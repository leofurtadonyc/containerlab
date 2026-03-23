"""Assemble topology risk summary v1 read responses (Phase 2, read-only).

Ranks all nodes and links on the current topology snapshot using the same related-policy
identity and ``degraded_policy_v1`` counting rules as failure-impact v1.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.integrations.collector.policies import CollectorPolicySnapshot
from app_api.models.policy import PolicyInventoryRecord
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.failure_impact import FailureImpactDegradedPostureBreakdown
from app_api.schemas.topology_risk_summary import (
    TOPOLOGY_RISK_SUMMARY_CONTRACT_ID,
    TopologyRiskSummaryAssemblyConfidence,
    TopologyRiskSummaryFreshness,
    TopologyRiskSummaryRankingInputs,
    TopologyRiskSummaryResponse,
    TopologyRiskSummaryRow,
    TopologyRiskSummarySafetyFraming,
)
from app_api.services.failure_impact import degraded_posture_breakdown_for_distinct_policy_ids
from app_api.services.policies import _build_policy_inventory
from app_api.services.topology import load_topology_snapshot_for_topology_relationship_queries
from app_api.services.topology_related_policies import build_topology_object_related_policies_response

RANKING_BASIS_V1 = (
    "topology_risk_summary_v1 lexicographic order: partition objects with related_policy_breadth "
    "(R) > 0 before R == 0; within R > 0 sort by degraded_related_count (D) descending, "
    "unknown_related_count (U) descending, R descending, then object_kind (node before link), "
    "then object_id ascending; within R == 0 sort by object_kind then object_id."
)


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


@dataclass(frozen=True)
class _Candidate:
    object_kind: str
    object_id: str
    breakdown: FailureImpactDegradedPostureBreakdown
    related_breadth: int


def _sort_key(c: _Candidate) -> tuple:
    d = c.breakdown.degraded
    u = c.breakdown.unknown
    r = c.related_breadth
    has_rel = r > 0
    kind_order = 0 if c.object_kind == "node" else 1
    if has_rel:
        return (0, -d, -u, -r, kind_order, c.object_id)
    return (1, kind_order, c.object_id)


def build_topology_risk_summary_response() -> TopologyRiskSummaryResponse:
    """Return ranked topology objects for attention prioritization (read-only, evidence-bounded)."""
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

    candidates: list[_Candidate] = []
    all_missing: list[str] = []
    sample_global_caveats: list[str] = []

    object_specs: list[tuple[str, str]] = [(n.node_id, "node") for n in topo_snapshot.nodes]
    object_specs.extend((link.link_id, "link") for link in topo_snapshot.links)

    for object_id, kind in object_specs:
        related = build_topology_object_related_policies_response(object_id)
        if related is None:
            continue
        if not sample_global_caveats and related.global_caveats:
            sample_global_caveats = list(related.global_caveats)

        unique_policy_ids = sorted({item.policy_id for item in related.items})
        breakdown, _path_supported, missing_notes = degraded_posture_breakdown_for_distinct_policy_ids(
            unique_policy_ids,
            policy_by_id=policy_by_id,
            row_current_posture=row_current_posture,
        )
        all_missing.extend(missing_notes)
        candidates.append(
            _Candidate(
                object_kind=kind,
                object_id=object_id,
                breakdown=breakdown,
                related_breadth=len(unique_policy_ids),
            )
        )

    candidates.sort(key=_sort_key)

    caveats = list(sample_global_caveats)
    caveats.append(
        "Topology risk summary v1 ranks objects using related-policy and degraded_policy v1 "
        "counts only; it is not SLA or traffic risk, not blast radius, and not global policy health."
    )
    if not candidates:
        caveats.append(
            "Topology snapshot contains no nodes or links to rank; ranked_objects is empty."
        )
    if topo_snapshot.completeness != "complete":
        caveats.append(
            "Topology snapshot completeness is not 'complete'; the enumerated object set may omit "
            "nodes or links outside this normalized slice."
        )
    if policy_snapshot.empty_reason != "none":
        caveats.append(
            f"Policy inventory slice may be incomplete (empty_reason={policy_snapshot.empty_reason})."
        )

    assembly_confidence: TopologyRiskSummaryAssemblyConfidence = "medium"
    if policy_snapshot.empty_reason != "none" or topo_snapshot.completeness != "complete":
        assembly_confidence = "low"
    if not candidates:
        assembly_confidence = "low"

    now = datetime.now(tz=UTC)
    serving = _policy_serving_mode_echo(collector_snapshot, persisted_at)

    ranked: list[TopologyRiskSummaryRow] = []
    for idx, c in enumerate(candidates, start=1):
        d, u, k = c.breakdown.degraded, c.breakdown.unknown, c.breakdown.ok
        ranked.append(
            TopologyRiskSummaryRow(
                rank_index=idx,
                object_kind=c.object_kind,  # type: ignore[arg-type]
                object_id=c.object_id,
                ranking_inputs=TopologyRiskSummaryRankingInputs(
                    degraded_related_count=d,
                    unknown_related_count=u,
                    related_policy_breadth=c.related_breadth,
                    ok_related_count=k,
                ),
                degraded_posture_breakdown=c.breakdown,
            )
        )

    deduped_missing = list(dict.fromkeys(all_missing))

    return TopologyRiskSummaryResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        contract_id=TOPOLOGY_RISK_SUMMARY_CONTRACT_ID,
        ranking_basis=RANKING_BASIS_V1,
        safety_framing=TopologyRiskSummarySafetyFraming(),
        assembly_confidence=assembly_confidence,
        ranked_objects=ranked,
        total_objects=len(ranked),
        freshness=TopologyRiskSummaryFreshness(
            assembly_generated_at=now,
            policy_inventory_observed_at=policy_snapshot.observed_at,
            topology_snapshot_observed_at=topo_snapshot.observed_at,
            policy_inventory_empty_reason=(
                None if policy_snapshot.empty_reason == "none" else policy_snapshot.empty_reason
            ),
            policy_serving_mode_echo=serving,
        ),
        caveats=caveats,
        missing_evidence_notes=deduped_missing,
    )
