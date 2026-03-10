"""Policy inventory service helpers."""

from collections import Counter
from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.integrations.collector.policies import (
    CollectorPolicySnapshot,
    get_collector_policy_client,
)
from app_api.metrics.state import cache_policy_metrics
from app_api.models.policy import CandidatePath, PolicyInventoryRecord, PolicyInventorySnapshot
from app_api.persistence.read_side import (
    load_latest_policy_snapshot,
    persist_policy_snapshot,
)
from app_api.schemas.policies import (
    CandidatePathRecord,
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
            observed_policy_count=0,
            active_policy_count=0,
            static_policy_count=0,
            bgp_policy_count=0,
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
        observed_policy_count=collector_snapshot.policy_count,
        active_policy_count=collector_snapshot.active_policy_count,
        static_policy_count=collector_snapshot.static_policy_count,
        bgp_policy_count=collector_snapshot.bgp_policy_count,
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


def build_policies_list_response() -> PoliciesListResponse:
    """Build the policy inventory response from the live collector boundary."""
    settings = get_settings()
    collector_snapshot, snapshot, persisted_at = _build_policy_inventory()
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
                "bounded static-policy visibility, and no SR policies are currently "
                "observed across the configured targets."
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
        observed_policy_count=snapshot.observed_policy_count,
        active_policy_count=snapshot.active_policy_count,
        static_policy_count=snapshot.static_policy_count,
        bgp_policy_count=snapshot.bgp_policy_count,
        count=len(items),
        notes=snapshot.notes,
        items=items,
    )
