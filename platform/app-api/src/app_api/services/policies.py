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
    PolicyComparisonChangePreview,
    PolicyCurrentComparison,
    PolicyHistoryComparison,
    PolicyHistoryWindow,
    PolicyInventoryRecord,
    PolicyInventorySnapshot,
    PolicyTargetFootprint,
)
from app_api.persistence.read_side import (
    load_latest_policy_snapshot,
    load_previous_policy_snapshot,
    load_recent_policy_snapshot_summaries,
    persist_policy_snapshot,
)
from app_api.schemas.policies import (
    CandidatePathRecord,
    PolicyComparisonChangePreviewResponse,
    PolicyCurrentComparisonResponse,
    PolicyHistoryComparisonResponse,
    PolicyHistorySnapshotResponseRecord,
    PolicyHistoryWindowResponse,
    PoliciesListResponse,
    PolicyRecord,
    PolicyTargetFootprintRecord,
)
from app_api.schemas.common import EvidenceConfidenceSummary


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
            target_footprints=[],
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
        target_footprints=[
            PolicyTargetFootprint(
                target_name=footprint.target_name,
                target_role=footprint.target_role,
                collection_status=footprint.collection_status,
                policy_capable=footprint.policy_capable,
                observed_policy_count=footprint.observed_policy_count,
                active_policy_count=footprint.active_policy_count,
                static_policy_count=footprint.static_policy_count,
                static_local_policy_count=footprint.static_local_policy_count,
                static_non_local_policy_count=footprint.static_non_local_policy_count,
                bgp_policy_count=footprint.bgp_policy_count,
                ttm_preference_count=footprint.ttm_preference_count,
                binding_sid_count=footprint.binding_sid_count,
                srv6_binding_sid_count=footprint.srv6_binding_sid_count,
                detail_record_count=footprint.detail_record_count,
                notes=footprint.notes,
            )
            for footprint in collector_snapshot.target_footprints
        ],
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


def _policy_changed_fields(
    current_policy: PolicyInventoryRecord,
    previous_policy: PolicyInventoryRecord,
) -> list[str]:
    """Return the normalized field names that changed between two policy records."""
    changed_fields: list[str] = []
    field_pairs = [
        ("policy_name", current_policy.policy_name, previous_policy.policy_name),
        ("policy_type", current_policy.policy_type, previous_policy.policy_type),
        ("headend", current_policy.headend, previous_policy.headend),
        ("endpoint", current_policy.endpoint, previous_policy.endpoint),
        ("color", current_policy.color, previous_policy.color),
        ("source_target", current_policy.source_target, previous_policy.source_target),
        (
            "source_target_role",
            current_policy.source_target_role,
            previous_policy.source_target_role,
        ),
        ("intent_state", current_policy.intent_state, previous_policy.intent_state),
        ("observed_state", current_policy.observed_state, previous_policy.observed_state),
        ("support_state", current_policy.support_state, previous_policy.support_state),
        ("health_state", current_policy.health_state, previous_policy.health_state),
    ]
    for field_name, current_value, previous_value in field_pairs:
        if current_value != previous_value:
            changed_fields.append(field_name)
    current_candidate_paths = [
        (
            candidate_path.name,
            candidate_path.path_state,
            candidate_path.preference,
            tuple(candidate_path.notes),
        )
        for candidate_path in current_policy.candidate_paths
    ]
    previous_candidate_paths = [
        (
            candidate_path.name,
            candidate_path.path_state,
            candidate_path.preference,
            tuple(candidate_path.notes),
        )
        for candidate_path in previous_policy.candidate_paths
    ]
    if current_candidate_paths != previous_candidate_paths:
        changed_fields.append("candidate_paths")
    return changed_fields


def _build_policy_change_preview(
    *,
    current_records: dict[str, PolicyInventoryRecord],
    previous_records: dict[str, PolicyInventoryRecord],
    added_policy_ids: set[str],
    removed_policy_ids: set[str],
    changed_policy_ids: set[str],
    limit: int = 10,
) -> list[PolicyComparisonChangePreview]:
    """Build a bounded preview of record-level policy changes."""
    preview: list[PolicyComparisonChangePreview] = []
    for policy_id in sorted(added_policy_ids, key=lambda item: (current_records[item].policy_name, item)):
        policy = current_records[policy_id]
        preview.append(
            PolicyComparisonChangePreview(
                policy_id=policy.policy_id,
                policy_name=policy.policy_name,
                source_target=policy.source_target,
                source_target_role=policy.source_target_role,
                change_kind="added",
                changed_fields=[],
            )
        )
    for policy_id in sorted(removed_policy_ids, key=lambda item: (previous_records[item].policy_name, item)):
        policy = previous_records[policy_id]
        preview.append(
            PolicyComparisonChangePreview(
                policy_id=policy.policy_id,
                policy_name=policy.policy_name,
                source_target=policy.source_target,
                source_target_role=policy.source_target_role,
                change_kind="removed",
                changed_fields=[],
            )
        )
    for policy_id in sorted(changed_policy_ids, key=lambda item: (current_records[item].policy_name, item)):
        current_policy = current_records[policy_id]
        previous_policy = previous_records[policy_id]
        preview.append(
            PolicyComparisonChangePreview(
                policy_id=current_policy.policy_id,
                policy_name=current_policy.policy_name,
                source_target=current_policy.source_target,
                source_target_role=current_policy.source_target_role,
                change_kind="changed",
                changed_fields=_policy_changed_fields(current_policy, previous_policy),
            )
        )
    return preview[:limit]


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
    change_preview = _build_policy_change_preview(
        current_records=current_records,
        previous_records=previous_records,
        added_policy_ids=added_policy_ids,
        removed_policy_ids=removed_policy_ids,
        changed_policy_ids=changed_policy_ids,
    )
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
    if len(change_preview) < len(added_policy_ids) + len(removed_policy_ids) + len(changed_policy_ids):
        comparison_notes.append(
            "Change preview is intentionally capped to a short bounded list of normalized policy records."
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
            change_preview=change_preview,
            notes=comparison_notes,
        ),
    )


def _build_current_policy_comparison(
    *,
    current_snapshot: PolicyInventorySnapshot,
    comparison_snapshot,
    comparison_persisted_at: datetime | None,
) -> PolicyCurrentComparison:
    """Build bounded current-versus-latest-persisted policy comparison evidence."""
    current_records = {record.policy_id: record for record in current_snapshot.records}
    if comparison_snapshot is None or comparison_persisted_at is None:
        return PolicyCurrentComparison(
            status="unavailable",
            summary=(
                "No persisted normalized policy snapshot is currently available for "
                "bounded comparison with the current policy response."
            ),
            comparison_persisted_at=None,
            current_observed_at=current_snapshot.observed_at,
            current_observed_policy_count=current_snapshot.observed_policy_count,
            persisted_observed_policy_count=0,
            current_detail_record_count=len(current_snapshot.records),
            persisted_detail_record_count=0,
            observed_policy_delta=0,
            detail_record_delta=0,
            added_policy_count=0,
            removed_policy_count=0,
            changed_policy_count=0,
            change_preview=[],
            notes=[
                "Comparison becomes available only when the backend already has a persisted normalized policy snapshot to compare against the current response.",
            ],
        )
    persisted_records = {record.policy_id: record for record in comparison_snapshot.records}
    current_policy_ids = set(current_records)
    persisted_policy_ids = set(persisted_records)
    added_policy_ids = current_policy_ids - persisted_policy_ids
    removed_policy_ids = persisted_policy_ids - current_policy_ids
    changed_policy_ids = {
        policy_id
        for policy_id in current_policy_ids & persisted_policy_ids
        if _policy_record_signature(current_records[policy_id])
        != _policy_record_signature(persisted_records[policy_id])
    }
    change_preview = _build_policy_change_preview(
        current_records=current_records,
        previous_records=persisted_records,
        added_policy_ids=added_policy_ids,
        removed_policy_ids=removed_policy_ids,
        changed_policy_ids=changed_policy_ids,
    )
    notes = [
        "This comparison reflects the current policy response against the latest persisted normalized policy snapshot.",
        "Added, removed, and changed counts only reflect policies that currently have bounded normalized detail records.",
    ]
    if (
        current_snapshot.observed_policy_count > len(current_snapshot.records)
        or comparison_snapshot.observed_policy_count > len(comparison_snapshot.records)
    ):
        notes.append(
            "Observed policy totals may be higher than detailed record totals when the bounded read path cannot derive per-policy detail for every observed policy type."
        )
    if len(change_preview) < len(added_policy_ids) + len(removed_policy_ids) + len(changed_policy_ids):
        notes.append(
            "Change preview is intentionally capped to a short bounded list of normalized policy records."
        )
    return PolicyCurrentComparison(
        status="current_vs_latest_persisted_ready",
        summary=(
            "Bounded comparison is available between the current policy response and "
            "the latest persisted normalized policy snapshot."
        ),
        comparison_persisted_at=comparison_persisted_at,
        current_observed_at=current_snapshot.observed_at,
        current_observed_policy_count=current_snapshot.observed_policy_count,
        persisted_observed_policy_count=comparison_snapshot.observed_policy_count,
        current_detail_record_count=len(current_snapshot.records),
        persisted_detail_record_count=len(comparison_snapshot.records),
        observed_policy_delta=(
            current_snapshot.observed_policy_count - comparison_snapshot.observed_policy_count
        ),
        detail_record_delta=len(current_snapshot.records) - len(comparison_snapshot.records),
        added_policy_count=len(added_policy_ids),
        removed_policy_count=len(removed_policy_ids),
        changed_policy_count=len(changed_policy_ids),
        change_preview=change_preview,
        notes=notes,
    )


def _policy_evidence_kind(detail_mode: str, empty_reason: str) -> str:
    """Map bounded policy detail posture into a stable evidence-kind label."""
    if empty_reason == "per_policy_details_unavailable" or detail_mode == "counters_only":
        return "aggregate_only"
    if detail_mode in {"static_policies_when_present", "mixed"}:
        return "aggregate_plus_bounded_records"
    return "unknown"


def _build_policy_evidence_confidence(
    *,
    collector_status: str,
    detail_mode: str,
    empty_reason: str,
    persisted_at: datetime | None,
) -> EvidenceConfidenceSummary:
    """Describe how much confidence the current policy response deserves."""
    evidence_kind = _policy_evidence_kind(detail_mode, empty_reason)
    if collector_status == "live_normalized_feed":
        if empty_reason == "per_policy_details_unavailable":
            return EvidenceConfidenceSummary(
                source_posture="live_observed",
                evidence_kind=evidence_kind,
                confidence_posture="blocked",
                freshness_posture="current",
                blocked_reason="per_record_detail_unavailable",
                summary=(
                    "Current policy truth is backed by live observed aggregate evidence, "
                    "but bounded per-policy detail records are unavailable."
                ),
                notes=[
                    "Observed policy counters and target coverage remain real live evidence.",
                    "Per-policy comparison semantics stay blocked until backend-owned normalized detail records are available.",
                ],
            )
        return EvidenceConfidenceSummary(
            source_posture="live_observed",
            evidence_kind=evidence_kind,
            confidence_posture=(
                "bounded_partial"
                if detail_mode in {"static_policies_when_present", "mixed", "counters_only"}
                else "strong_for_current_slice"
            ),
            freshness_posture="current",
            blocked_reason="none",
            summary=(
                "Current policy truth is backed by live observed policy evidence, with "
                "confidence bounded by the current normalized detail coverage."
            ),
            notes=[
                "Aggregate policy counters are directly observed from the live collector feed.",
                "Per-policy records remain intentionally bounded to the policy types the current read path can normalize honestly.",
            ],
        )
    if collector_status == "partial_live_feed":
        return EvidenceConfidenceSummary(
            source_posture="live_observed",
            evidence_kind=evidence_kind,
            confidence_posture="degraded",
            freshness_posture="current",
            blocked_reason="none",
            summary=(
                "Current policy truth remains live observed, but the collector reported "
                "partial or degraded policy visibility."
            ),
            notes=[
                "The backend is still serving live policy evidence for the currently available slice.",
                "Confidence is degraded because one or more targets returned partial live policy data.",
            ],
        )
    if persisted_at is not None:
        return EvidenceConfidenceSummary(
            source_posture="persisted_fallback",
            evidence_kind=evidence_kind,
            confidence_posture="degraded",
            freshness_posture="stale",
            blocked_reason="collector_unavailable",
            summary=(
                "Current policy truth is a persisted fallback snapshot because live "
                "collector evidence is unavailable."
            ),
            notes=[
                "The served policy data still reflects normalized observed policy evidence, but not from the current live read.",
                "Treat this response as stale relative to current policy truth until live collection recovers.",
            ],
        )
    return EvidenceConfidenceSummary(
        source_posture="empty_scaffold",
        evidence_kind="unknown",
        confidence_posture="blocked",
        freshness_posture="unknown",
        blocked_reason="collector_unavailable_and_no_persisted_snapshot",
        summary=(
            "The policy response is blocked from showing policy truth because live "
            "collector evidence is unavailable and no persisted fallback snapshot exists."
        ),
        notes=[
            "The policies API preserves contract stability here without inventing policy records.",
            "No raw vendor payloads are exposed when backend-owned policy evidence is missing.",
        ],
    )


def build_policies_list_response() -> PoliciesListResponse:
    """Build the policy inventory response from the live collector boundary."""
    settings = get_settings()
    collector_snapshot, snapshot, persisted_at = _build_policy_inventory()
    latest_persisted_snapshot = load_latest_policy_snapshot()
    history = _build_policy_history_window()
    evidence_confidence = _build_policy_evidence_confidence(
        collector_status=collector_snapshot.status,
        detail_mode=snapshot.detail_mode,
        empty_reason=snapshot.empty_reason,
        persisted_at=persisted_at,
    )
    current_comparison = _build_current_policy_comparison(
        current_snapshot=snapshot,
        comparison_snapshot=(
            latest_persisted_snapshot.snapshot if latest_persisted_snapshot is not None else None
        ),
        comparison_persisted_at=(
            latest_persisted_snapshot.persisted_at if latest_persisted_snapshot is not None else None
        ),
    )
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
        serving_mode = "live_collector"
        if snapshot.empty_reason == "no_policies_observed":
            summary = (
                "Policy inventory is backed by live Nokia SR policy counters and "
                "bounded static-policy visibility. No SR policies are currently "
                "observed, but stable per-target policy counter footprint and "
                "target-role coverage remain visible across the configured targets."
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
        serving_mode = "live_collector"
        summary = (
            "Policy inventory is backed by live Nokia SR policy counters and bounded "
            "static-policy observations, but one or more targets returned partial or "
            "degraded policy visibility."
        )
    else:
        data_status = "degraded"
        if persisted_at is not None:
            serving_mode = "persisted_fallback"
            current_comparison = PolicyCurrentComparison(
                status="unavailable",
                summary=(
                    "Live collector policy data is unavailable, so the current response "
                    "already reflects the latest persisted normalized policy snapshot."
                ),
                comparison_persisted_at=persisted_at,
                current_observed_at=snapshot.observed_at,
                current_observed_policy_count=snapshot.observed_policy_count,
                persisted_observed_policy_count=snapshot.observed_policy_count,
                current_detail_record_count=len(snapshot.records),
                persisted_detail_record_count=len(snapshot.records),
                observed_policy_delta=0,
                detail_record_delta=0,
                added_policy_count=0,
                removed_policy_count=0,
                changed_policy_count=0,
                change_preview=[],
                notes=[
                    "Comparison is not shown here because the current policy response is already the persisted fallback snapshot.",
                ],
            )
            summary = (
                "The backend could not load the live collector policy snapshot, so "
                "the latest persisted normalized policy snapshot is being served."
            )
        else:
            serving_mode = "empty_scaffold"
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
        serving_mode=serving_mode,
        sync_status=snapshot.sync_status,
        completeness=snapshot.completeness,
        detail_mode=snapshot.detail_mode,
        empty_reason=snapshot.empty_reason,
        source_posture=evidence_confidence.source_posture,
        evidence_kind=evidence_confidence.evidence_kind,
        confidence_posture=evidence_confidence.confidence_posture,
        freshness_posture=evidence_confidence.freshness_posture,
        blocked_reason=evidence_confidence.blocked_reason,
    )
    return PoliciesListResponse(
        service="app-api",
        version=settings.app_version,
        phase="phase_2_read_only_foundation",
        generated_at=datetime.now(UTC),
        data_status=data_status,
        serving_mode=serving_mode,
        evidence_confidence=evidence_confidence,
        summary=summary,
        served_persisted_at=persisted_at,
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
        target_footprints=[
            PolicyTargetFootprintRecord(
                target_name=footprint.target_name,
                target_role=footprint.target_role,
                collection_status=footprint.collection_status,
                policy_capable=footprint.policy_capable,
                observed_policy_count=footprint.observed_policy_count,
                active_policy_count=footprint.active_policy_count,
                static_policy_count=footprint.static_policy_count,
                static_local_policy_count=footprint.static_local_policy_count,
                static_non_local_policy_count=footprint.static_non_local_policy_count,
                bgp_policy_count=footprint.bgp_policy_count,
                ttm_preference_count=footprint.ttm_preference_count,
                binding_sid_count=footprint.binding_sid_count,
                srv6_binding_sid_count=footprint.srv6_binding_sid_count,
                detail_record_count=footprint.detail_record_count,
                notes=footprint.notes,
            )
            for footprint in snapshot.target_footprints
        ],
        comparison_to_latest_persisted=PolicyCurrentComparisonResponse(
            status=current_comparison.status,
            summary=current_comparison.summary,
            comparison_persisted_at=current_comparison.comparison_persisted_at,
            current_observed_at=current_comparison.current_observed_at,
            current_observed_policy_count=current_comparison.current_observed_policy_count,
            persisted_observed_policy_count=current_comparison.persisted_observed_policy_count,
            current_detail_record_count=current_comparison.current_detail_record_count,
            persisted_detail_record_count=current_comparison.persisted_detail_record_count,
            observed_policy_delta=current_comparison.observed_policy_delta,
            detail_record_delta=current_comparison.detail_record_delta,
            added_policy_count=current_comparison.added_policy_count,
            removed_policy_count=current_comparison.removed_policy_count,
            changed_policy_count=current_comparison.changed_policy_count,
            change_preview=[
                PolicyComparisonChangePreviewResponse(
                    policy_id=entry.policy_id,
                    policy_name=entry.policy_name,
                    source_target=entry.source_target,
                    source_target_role=entry.source_target_role,
                    change_kind=entry.change_kind,
                    changed_fields=entry.changed_fields,
                )
                for entry in current_comparison.change_preview
            ],
            notes=current_comparison.notes,
        ),
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
                    change_preview=[
                        PolicyComparisonChangePreviewResponse(
                            policy_id=entry.policy_id,
                            policy_name=entry.policy_name,
                            source_target=entry.source_target,
                            source_target_role=entry.source_target_role,
                            change_kind=entry.change_kind,
                            changed_fields=entry.changed_fields,
                        )
                        for entry in history.comparison_to_previous.change_preview
                    ],
                    notes=history.comparison_to_previous.notes,
                )
                if history.comparison_to_previous is not None
                else None
            ),
        ),
        items=items,
    )
