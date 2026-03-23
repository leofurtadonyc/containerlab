"""Assemble failure-impact v1 read responses (Phase 2, read-only).

Reuses ``build_topology_object_related_policies_response`` for relationship identity
and ``_build_policy_inventory`` + ``build_degraded_policy_v1_classification`` for
per-policy posture consistent with ``GET /api/v1/policies``.
"""

from __future__ import annotations

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.integrations.collector.policies import CollectorPolicySnapshot
from app_api.models.policy import PolicyInventoryRecord
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.failure_impact import (
    FAILURE_IMPACT_CONTRACT_ID,
    DEFAULT_FAILURE_IMPACT_EXPLICIT_NON_CLAIMS,
    FailureImpactDegradedPostureBreakdown,
    FailureImpactFreshness,
    FailureImpactRollupCounts,
    FailureImpactSafetyFraming,
    FailureImpactSubject,
    FailureImpactViewResponse,
)
from app_api.services.degraded_policy_v1 import build_degraded_policy_v1_classification
from app_api.services.policies import _build_policy_inventory
from app_api.services.topology import load_topology_snapshot_for_topology_relationship_queries
from app_api.services.topology_related_policies import build_topology_object_related_policies_response


def _policy_serving_mode_echo(
    collector_snapshot: CollectorPolicySnapshot,
    persisted_at: datetime | None,
) -> str:
    if collector_snapshot.status == "collector_unavailable":
        return "persisted_fallback" if persisted_at is not None else "unknown"
    if collector_snapshot.status == "partial_live_feed":
        return "mixed"
    if collector_snapshot.status == "live_normalized_feed":
        return "live"
    return "unknown"


def _path_analysis_interpretation_supported(policy: PolicyInventoryRecord) -> bool:
    """True when path-analysis is not blocked by unsupported / not_implemented support_state."""
    return policy.support_state not in ("unsupported", "not_implemented_in_platform")


def degraded_posture_breakdown_for_distinct_policy_ids(
    unique_policy_ids: Iterable[str],
    *,
    policy_by_id: dict[str, PolicyInventoryRecord],
    row_current_posture: str,
) -> tuple[FailureImpactDegradedPostureBreakdown, int, list[str]]:
    """Count ``degraded_policy_v1`` postures for distinct related policy ids (failure-impact semantics).

    Returns ``(breakdown, path_analysis_supported_count, missing_evidence_notes)``.
    """
    unique = sorted({pid for pid in unique_policy_ids})
    breakdown_ok = 0
    breakdown_degraded = 0
    breakdown_unknown = 0
    path_supported = 0
    missing_notes: list[str] = []

    for pid in unique:
        policy = policy_by_id.get(pid)
        if policy is None:
            breakdown_unknown += 1
            missing_notes.append(
                f"Related policy_id {pid!r} has no row in the current normalized policy inventory; "
                "rollup posture counted as unknown."
            )
            continue
        cls = build_degraded_policy_v1_classification(
            policy=policy,
            row_current_posture=row_current_posture,
        )
        if cls.posture == "degraded":
            breakdown_degraded += 1
        elif cls.posture == "unknown":
            breakdown_unknown += 1
        else:
            breakdown_ok += 1
        if _path_analysis_interpretation_supported(policy):
            path_supported += 1

    if len(unique) > 0 and path_supported < len(unique):
        missing_notes.append(
            "Path-analysis interpretation is limited or unavailable for one or more related "
            "policies (support_state unsupported or not_implemented_in_platform); see per-policy "
            "GET /api/v1/policies/{policy_id}/path-analysis for details."
        )

    return (
        FailureImpactDegradedPostureBreakdown(
            ok=breakdown_ok,
            degraded=breakdown_degraded,
            unknown=breakdown_unknown,
        ),
        path_supported,
        missing_notes,
    )


def build_failure_impact_view_response(object_id: str) -> FailureImpactViewResponse | None:
    """Return failure-impact v1 rollup for ``object_id``, or ``None`` if topology object unknown."""
    related = build_topology_object_related_policies_response(object_id)
    if related is None:
        return None

    settings = get_settings()
    collector_snapshot, policy_snapshot, persisted_at = _build_policy_inventory()
    _, topo_snapshot, _ = load_topology_snapshot_for_topology_relationship_queries()

    row_current_posture: str = (
        "stale"
        if collector_snapshot.status == "collector_unavailable" and persisted_at is not None
        else "current"
    )

    policy_by_id: dict[str, PolicyInventoryRecord] = {
        p.policy_id: p for p in policy_snapshot.records
    }
    unique_policy_ids = sorted({item.policy_id for item in related.items})

    breakdown, path_supported, missing_notes = degraded_posture_breakdown_for_distinct_policy_ids(
        unique_policy_ids,
        policy_by_id=policy_by_id,
        row_current_posture=row_current_posture,
    )

    caveats = list(related.global_caveats)
    caveats.append(
        "Failure-impact v1 counts are subset-scoped to the related-policy string-equality set for "
        "this object; they are not global policy health, blast radius, or dependency simulation."
    )

    serving = _policy_serving_mode_echo(collector_snapshot, persisted_at)
    now = datetime.now(tz=UTC)

    return FailureImpactViewResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        contract_id=FAILURE_IMPACT_CONTRACT_ID,
        safety_framing=FailureImpactSafetyFraming(
            explicit_non_claims=list(DEFAULT_FAILURE_IMPACT_EXPLICIT_NON_CLAIMS),
        ),
        subject=FailureImpactSubject(
            kind=related.object_kind,
            object_id=related.object_id,
        ),
        rollup_counts=FailureImpactRollupCounts(
            related_policies_total=len(unique_policy_ids),
            degraded_related_policies_total=breakdown.degraded,
            non_degraded_related_policies_total=breakdown.ok + breakdown.unknown,
            related_policies_path_analysis_supported_total=path_supported,
        ),
        degraded_posture_breakdown=breakdown,
        freshness=FailureImpactFreshness(
            assembly_generated_at=now,
            policy_inventory_observed_at=policy_snapshot.observed_at,
            topology_snapshot_observed_at=topo_snapshot.observed_at,
            policy_inventory_empty_reason=(
                None if policy_snapshot.empty_reason == "none" else policy_snapshot.empty_reason
            ),
            policy_serving_mode_echo=serving,
        ),
        caveats=caveats,
        missing_evidence_notes=missing_notes,
    )
