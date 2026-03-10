"""Policy inventory service helpers."""

from collections import Counter
from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.integrations.collector.policies import (
    CollectorPolicySnapshot,
    get_collector_policy_client,
)
from app_api.metrics.state import cache_policy_metrics
from app_api.models.policy import (
    CandidatePath,
    PolicyHistoryComparison,
    PolicyHistoryWindow,
    PolicyInventoryRecord,
    PolicyInventorySnapshot,
)
from app_api.persistence.read_side import (
    load_latest_policy_snapshot,
    load_previous_policy_snapshot,
    load_recent_policy_snapshot_summaries,
    persist_policy_snapshot,
)
from app_api.schemas.policies import (
    CandidatePathRecord,
    PolicyHistoryComparisonResponse,
    PolicyHistorySnapshotResponseRecord,
    PolicyHistoryWindowResponse,
    PoliciesListResponse,
    PolicyRecord,
)


def _build_policy_inventory() -> tuple[
    CollectorPolicySnapshot, PolicyInventorySnapshot, datetime | None
]:
    """Build the backend-owned normalized policy inventory snapshot."""
    collector_snapshot = get_collector_policy_client().read_policy_snapshot()
    observed_at = (
        datetime.fromisoformat(collector_snapshot.observed_at.replace("Z", "+00:00"))
        if collector_snapshot.observed_at
        else None
    )

    if collector_snapshot.status == "collector_unavailable":
        persisted_snapshot = load_latest_policy_snapshot()
        if persisted_snapshot is not None:
            return collector_snapshot, persisted_snapshot.snapshot, persisted_snapshot.persisted_at
        return collector_snapshot, PolicyInventorySnapshot(
            sync_source="gnmi_collector_policy",
            sync_status="failed",
            completeness="unknown",
            detail_mode="unknown",
            empty_reason="collector_unavailable",
            observed_at=None,
            observed_target_count=0,
            policy_capable_target_count=0,
            observed_target_role_counts={},
            policy_capable_target_role_counts={},
            observed_policy_count=0,
            active_policy_count=0,
            static_policy_count=0,
            static_local_policy_count=0,
            static_non_local_policy_count=0,
            bgp_policy_count=0,
            ttm_preference_count=0,
            binding_sid_count=0,
            srv6_binding_sid_count=0,
            notes=[
                "The backend could not load the live policy snapshot from the collector.",
                "No raw vendor payloads are exposed through the policies API.",
            ],
            records=[],
        ), None

    snapshot = PolicyInventorySnapshot(
        sync_source=collector_snapshot.sync_source,
        sync_status=collector_snapshot.sync_status,
        completeness=collector_snapshot.completeness,
        detail_mode=collector_snapshot.detail_mode,
        empty_reason=(
            "no_policies_observed"
            if collector_snapshot.policy_count == 0
            else (
                "per_policy_details_unavailable"
                if collector_snapshot.policy_count > 0 and not collector_snapshot.records
                else "none"
            )
        ),
        observed_at=observed_at,
        observed_target_count=collector_snapshot.observed_target_count,
        policy_capable_target_count=collector_snapshot.policy_capable_target_count,
        observed_target_role_counts=collector_snapshot.observed_target_role_counts,
        policy_capable_target_role_counts=collector_snapshot.policy_capable_target_role_counts,
        observed_policy_count=collector_snapshot.policy_count,
        active_policy_count=collector_snapshot.active_policy_count,
        static_policy_count=collector_snapshot.static_policy_count,
        static_local_policy_count=collector_snapshot.static_local_policy_count,
        static_non_local_policy_count=collector_snapshot.static_non_local_policy_count,
        bgp_policy_count=collector_snapshot.bgp_policy_count,
        ttm_preference_count=collector_snapshot.ttm_preference_count,
        binding_sid_count=collector_snapshot.binding_sid_count,
        srv6_binding_sid_count=collector_snapshot.srv6_binding_sid_count,
        notes=collector_snapshot.notes,
        records=[
            PolicyInventoryRecord(
                policy_id=record.policy_id,
                policy_name=record.policy_name,
                policy_type=record.policy_type,
                headend=record.headend,
                endpoint=record.endpoint,
                color=record.color,
                source_target=record.source_target,
                source_target_role=record.source_target_role,
                candidate_paths=[
                    CandidatePath(
                        name=path.name,
                        path_state=path.path_state,
                        preference=path.preference,
                        notes=path.notes,
                    )
                    for path in record.candidate_paths
                ],
                intent_state=record.intent_state,
                observed_state=record.observed_state,
                support_state=record.support_state,
                health_state=record.health_state,
                source=record.source,
                notes=record.notes,
            )
            for record in collector_snapshot.records
        ],
    )
    persist_policy_snapshot(
        collector_snapshot=collector_snapshot,
        snapshot=snapshot,
        data_status=(
            "live" if collector_snapshot.status == "live_normalized_feed" else "degraded"
        ),
    )
    return collector_snapshot, snapshot, None


def _policy_record_signature(policy: PolicyInventoryRecord) -> tuple[object, ...]:
    """Return a bounded normalized signature for current-versus-previous comparison."""
    return (
        policy.policy_name,
        policy.policy_type,
        policy.headend,
        policy.endpoint,
        policy.color,
        policy.source_target,
        policy.source_target_role,
        policy.intent_state,
        policy.observed_state,
        policy.support_state,
        policy.health_state,
        tuple(
            (
                candidate_path.name,
                candidate_path.path_state,
                candidate_path.preference,
                tuple(candidate_path.notes),
            )
            for candidate_path in policy.candidate_paths
        ),
    )


def _build_policy_history_window() -> PolicyHistoryWindow:
    """Build a bounded persisted history/comparison view for policy snapshots."""
    recent_snapshots = load_recent_policy_snapshot_summaries(limit=3)
    if not recent_snapshots:
        return PolicyHistoryWindow(
            status="unavailable",
            summary=(
                "No persisted normalized policy snapshots are currently available for "
                "bounded policy history or comparison."
            ),
        )

    if len(recent_snapshots) == 1:
        return PolicyHistoryWindow(
            status="current_only",
            summary=(
                "One persisted normalized policy snapshot is currently available, so "
                "bounded current-versus-previous policy comparison is not yet available."
            ),
            recent_snapshots=[entry.snapshot for entry in recent_snapshots],
        )

    current_snapshot = load_latest_policy_snapshot()
    previous_snapshot = load_previous_policy_snapshot()
    if current_snapshot is None or previous_snapshot is None:
        return PolicyHistoryWindow(
            status="current_only",
            summary=(
                "Recent persisted policy snapshot summaries are available, but the "
                "bounded comparison view could not load both full snapshots."
            ),
            recent_snapshots=[entry.snapshot for entry in recent_snapshots],
        )

    current_records = {record.policy_id: record for record in current_snapshot.snapshot.records}
    previous_records = {record.policy_id: record for record in previous_snapshot.snapshot.records}
    current_policy_ids = set(current_records)
    previous_policy_ids = set(previous_records)
    added_policy_ids = current_policy_ids - previous_policy_ids
    removed_policy_ids = previous_policy_ids - current_policy_ids
    shared_policy_ids = current_policy_ids & previous_policy_ids
    changed_policy_ids = {
        policy_id
        for policy_id in shared_policy_ids
        if _policy_record_signature(current_records[policy_id])
        != _policy_record_signature(previous_records[policy_id])
    }
    comparison_notes = [
        "This comparison is derived from the latest two persisted normalized policy snapshots.",
        (
            "Added, removed, and changed counts only reflect policies that currently have "
            "bounded normalized detail records."
        ),
    ]
    if (
        current_snapshot.snapshot.observed_policy_count > len(current_snapshot.snapshot.records)
        or previous_snapshot.snapshot.observed_policy_count > len(previous_snapshot.snapshot.records)
    ):
        comparison_notes.append(
            "Observed policy totals may be higher than detailed record totals when the bounded read path cannot derive per-policy detail for every observed policy type."
        )
    return PolicyHistoryWindow(
        status="comparison_ready",
        summary=(
            "Recent persisted normalized policy snapshots are available for bounded "
            "current-versus-previous comparison."
        ),
        recent_snapshots=[entry.snapshot for entry in recent_snapshots],
        comparison_to_previous=PolicyHistoryComparison(
            current_persisted_at=current_snapshot.persisted_at,
            previous_persisted_at=previous_snapshot.persisted_at,
            current_observed_policy_count=current_snapshot.snapshot.observed_policy_count,
            previous_observed_policy_count=previous_snapshot.snapshot.observed_policy_count,
            current_detail_record_count=len(current_snapshot.snapshot.records),
            previous_detail_record_count=len(previous_snapshot.snapshot.records),
            observed_policy_delta=(
                current_snapshot.snapshot.observed_policy_count
                - previous_snapshot.snapshot.observed_policy_count
            ),
            detail_record_delta=(
                len(current_snapshot.snapshot.records) - len(previous_snapshot.snapshot.records)
            ),
            added_policy_count=len(added_policy_ids),
            removed_policy_count=len(removed_policy_ids),
            changed_policy_count=len(changed_policy_ids),
            notes=comparison_notes,
        ),
    )


def build_policies_list_response() -> PoliciesListResponse:
    """Build the policy inventory response from the live collector boundary."""
    settings = get_settings()
    collector_snapshot, snapshot, persisted_at = _build_policy_inventory()
    history = _build_policy_history_window()
    items = [
        PolicyRecord(
            policy_id=policy.policy_id,
            policy_name=policy.policy_name,
            policy_type=policy.policy_type,
            headend=policy.headend,
            endpoint=policy.endpoint,
            color=policy.color,
            source_target=policy.source_target,
            source_target_role=policy.source_target_role,
            candidate_paths=[
                CandidatePathRecord(
                    name=path.name,
                    path_state=path.path_state,
                    preference=path.preference,
                    notes=path.notes,
                )
                for path in policy.candidate_paths
            ],
            intent_state=policy.intent_state,
            observed_state=policy.observed_state,
            support_state=policy.support_state,
            health_state=policy.health_state,
            source=policy.source,
            notes=policy.notes,
        )
        for policy in snapshot.records
    ]
    if collector_snapshot.status == "live_normalized_feed":
        data_status = "live"
        if snapshot.empty_reason == "no_policies_observed":
            summary = (
                "Policy inventory is backed by live Nokia SR policy counters and "
                "bounded static-policy visibility. No SR policies are currently "
                "observed, but stable counter footprint and target-role coverage "
                "remain visible across the configured targets."
            )
        elif snapshot.empty_reason == "per_policy_details_unavailable":
            summary = (
                "Policy counters indicate SR policies are present, but the current "
                "bounded platform path could not derive per-policy detail records for "
                "the observed policy types."
            )
        else:
            summary = (
                "Policy inventory is backed by live Nokia SR policy counters plus "
                "bounded static-policy observations from the configured targets."
            )
    elif collector_snapshot.status == "partial_live_feed":
        data_status = "degraded"
        summary = (
            "Policy inventory is backed by live Nokia SR policy counters and bounded "
            "static-policy observations, but one or more targets returned partial or "
            "degraded policy visibility."
        )
    else:
        data_status = "degraded"
        if persisted_at is not None:
            summary = (
                "The backend could not load the live collector policy snapshot, so "
                "the latest persisted normalized policy snapshot is being served."
            )
        else:
            summary = (
                "The backend could not load the live collector policy snapshot. "
                "No raw vendor payloads are exposed through the policies API."
            )
    cache_policy_metrics(
        record_count=len(items),
        active_policy_count=snapshot.active_policy_count,
        static_policy_count=snapshot.static_policy_count,
        bgp_policy_count=snapshot.bgp_policy_count,
        observed_target_count=snapshot.observed_target_count,
        policy_capable_target_count=snapshot.policy_capable_target_count,
        observed_policy_count=snapshot.observed_policy_count,
        observed_state_counts=dict(Counter(policy.observed_state for policy in items)),
        health_state_counts=dict(Counter(policy.health_state for policy in items)),
        support_state_counts=dict(Counter(policy.support_state for policy in items)),
        policy_type_counts=dict(Counter(policy.policy_type for policy in items)),
        data_status=data_status,
        sync_status=snapshot.sync_status,
        completeness=snapshot.completeness,
        detail_mode=snapshot.detail_mode,
    )
    return PoliciesListResponse(
        service="app-api",
        version=settings.app_version,
        phase="phase_2_read_only_foundation",
        generated_at=datetime.now(UTC),
        data_status=data_status,
        summary=summary,
        sync_source=snapshot.sync_source,
        sync_status=snapshot.sync_status,
        completeness=snapshot.completeness,
        detail_mode=snapshot.detail_mode,
        empty_reason=snapshot.empty_reason,
        observed_at=snapshot.observed_at,
        observed_target_count=snapshot.observed_target_count,
        policy_capable_target_count=snapshot.policy_capable_target_count,
        observed_target_role_counts=snapshot.observed_target_role_counts,
        policy_capable_target_role_counts=snapshot.policy_capable_target_role_counts,
        observed_policy_count=snapshot.observed_policy_count,
        active_policy_count=snapshot.active_policy_count,
        static_policy_count=snapshot.static_policy_count,
        static_local_policy_count=snapshot.static_local_policy_count,
        static_non_local_policy_count=snapshot.static_non_local_policy_count,
        bgp_policy_count=snapshot.bgp_policy_count,
        ttm_preference_count=snapshot.ttm_preference_count,
        binding_sid_count=snapshot.binding_sid_count,
        srv6_binding_sid_count=snapshot.srv6_binding_sid_count,
        count=len(items),
        notes=snapshot.notes,
        history=PolicyHistoryWindowResponse(
            status=history.status,
            summary=history.summary,
            recent_snapshots=[
                PolicyHistorySnapshotResponseRecord(
                    persisted_at=entry.persisted_at,
                    observed_at=entry.observed_at,
                    data_status=entry.data_status,
                    sync_source=entry.sync_source,
                    sync_status=entry.sync_status,
                    completeness=entry.completeness,
                    detail_mode=entry.detail_mode,
                    empty_reason=entry.empty_reason,
                    observed_policy_count=entry.observed_policy_count,
                    active_policy_count=entry.active_policy_count,
                    detail_record_count=entry.detail_record_count,
                )
                for entry in history.recent_snapshots
            ],
            comparison_to_previous=(
                PolicyHistoryComparisonResponse(
                    current_persisted_at=history.comparison_to_previous.current_persisted_at,
                    previous_persisted_at=history.comparison_to_previous.previous_persisted_at,
                    current_observed_policy_count=history.comparison_to_previous.current_observed_policy_count,
                    previous_observed_policy_count=history.comparison_to_previous.previous_observed_policy_count,
                    current_detail_record_count=history.comparison_to_previous.current_detail_record_count,
                    previous_detail_record_count=history.comparison_to_previous.previous_detail_record_count,
                    observed_policy_delta=history.comparison_to_previous.observed_policy_delta,
                    detail_record_delta=history.comparison_to_previous.detail_record_delta,
                    added_policy_count=history.comparison_to_previous.added_policy_count,
                    removed_policy_count=history.comparison_to_previous.removed_policy_count,
                    changed_policy_count=history.comparison_to_previous.changed_policy_count,
                    notes=history.comparison_to_previous.notes,
                )
                if history.comparison_to_previous is not None
                else None
            ),
        ),
        items=items,
    )
