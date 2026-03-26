"""Assemble topology-object-scoped evidence delta read responses (Phase 2, read-only).

Compares current topology-object assemblies to a **previous** persisted normalized topology snapshot
plus **previous** persisted normalized policy snapshot — see ``topology-object-evidence-delta-contract.md``.
"""

from __future__ import annotations

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.models.policy import PolicyInventoryRecord
from app_api.models.topology import TopologyLink, TopologyNode
from app_api.persistence.read_side import load_previous_policy_snapshot, load_previous_topology_snapshot
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.failure_impact import FailureImpactRollupCounts
from app_api.schemas.read_side_query import READ_SIDE_HISTORY_RECENT_LIMIT_DEFAULT
from app_api.schemas.service_evidence_delta import MemberPolicyEvidenceDeltaPointer
from app_api.schemas.topology_object_evidence_delta import (
    TOPOLOGY_OBJECT_EVIDENCE_DELTA_CONTRACT_ID,
    DEFAULT_TOPOLOGY_OBJECT_EVIDENCE_DELTA_EXPLICIT_NON_CLAIMS,
    TopologyObjectEvidenceDeltaAnchorCurrent,
    TopologyObjectEvidenceDeltaAnchorPrevious,
    TopologyObjectEvidenceDeltaComparisonStatus,
    TopologyObjectEvidenceDeltaItem,
    TopologyObjectEvidenceDeltaResponse,
    TopologyObjectEvidenceDeltaSafetyFraming,
)
from app_api.services.degraded_policy_v1 import build_degraded_policy_v1_classification
from app_api.services.failure_impact import (
    build_failure_impact_view_response,
    degraded_posture_breakdown_for_distinct_policy_ids,
)
from app_api.services.policies import _build_policy_history_window, _build_policy_inventory
from app_api.services.policy_evidence_delta import build_policy_evidence_delta_response
from app_api.services.topology import load_topology_snapshot_for_topology_relationship_queries
from app_api.services.topology_related_policies import (
    _resolve_object,
    build_topology_object_related_policies_response,
    build_topology_object_related_policies_response_from_snapshot,
)

_MAX_MEMBER_POLICY_POINTERS = 20


def _node_signature(node: TopologyNode) -> tuple[object, ...]:
    return (
        node.display_name,
        node.role,
        node.state,
        node.source,
        node.device_id,
        tuple(sorted(node.attributes.items())),
    )


def _link_signature(link: TopologyLink) -> tuple[object, ...]:
    return (
        link.source_node_id,
        link.target_node_id,
        link.state,
        link.source,
        link.endpoint_pairing_state,
        tuple(sorted(link.attributes.items())),
    )


def _rollup_for_side(
    unique_policy_ids: list[str],
    *,
    policy_by_id: dict[str, PolicyInventoryRecord],
    row_current_posture: str,
) -> FailureImpactRollupCounts:
    breakdown, path_supported, _ = degraded_posture_breakdown_for_distinct_policy_ids(
        unique_policy_ids,
        policy_by_id=policy_by_id,
        row_current_posture=row_current_posture,
    )
    return FailureImpactRollupCounts(
        related_policies_total=len(unique_policy_ids),
        degraded_related_policies_total=breakdown.degraded,
        non_degraded_related_policies_total=breakdown.ok + breakdown.unknown,
        related_policies_path_analysis_supported_total=path_supported,
    )


def _ranking_tuple_from_breakdown(
    *,
    breakdown: tuple[int, int, int],  # ok, degraded, unknown from FailureImpactDegradedPostureBreakdown
    breadth: int,
) -> tuple[int, int, int, int]:
    ok, degraded, unknown = breakdown
    return (degraded, unknown, breadth, ok)


def _no_anchor_response(
    *,
    object_kind: str,
    object_id: str,
    now: datetime,
    status: TopologyObjectEvidenceDeltaComparisonStatus,
    scope: str,
    current_anchor: TopologyObjectEvidenceDeltaAnchorCurrent,
    caveats: list[str],
) -> TopologyObjectEvidenceDeltaResponse:
    settings = get_settings()
    return TopologyObjectEvidenceDeltaResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        contract_id=TOPOLOGY_OBJECT_EVIDENCE_DELTA_CONTRACT_ID,
        safety_framing=TopologyObjectEvidenceDeltaSafetyFraming(
            explicit_non_claims=list(DEFAULT_TOPOLOGY_OBJECT_EVIDENCE_DELTA_EXPLICIT_NON_CLAIMS),
        ),
        object_kind=object_kind,
        object_id=object_id,
        comparison_status=status,
        scope_summary=scope,
        current_anchor=current_anchor,
        previous_anchor=None,
        delta_items=[
            TopologyObjectEvidenceDeltaItem(
                category="gap_note",
                summary="No delta between anchors: a comparable previous persisted snapshot pair is required.",
                detail=None,
            )
        ],
        caveats=caveats,
    )


def build_topology_object_evidence_delta_response(object_id: str) -> TopologyObjectEvidenceDeltaResponse | None:
    """Return evidence delta for ``object_id``, or ``None`` when the object is unknown (404 family)."""
    related_cur = build_topology_object_related_policies_response(object_id)
    if related_cur is None:
        return None

    fi_cur = build_failure_impact_view_response(object_id, related_policies=related_cur)
    if fi_cur is None:
        return None

    settings = get_settings()
    now = datetime.now(tz=UTC)
    current_anchor = TopologyObjectEvidenceDeltaAnchorCurrent(generated_at=fi_cur.freshness.assembly_generated_at)

    caveats: list[str] = [
        "Delta aligns with the latest-two persisted snapshot comparison family used by policy history "
        "(current inventory versus the **previous** persisted policy snapshot row set), intersected with "
        "the previous persisted normalized topology snapshot for object-scoped relationship queries.",
        "This is a bounded read-side comparison across anchors, not topology drift truth or pairing proof.",
    ]

    history = _build_policy_history_window(history_recent_limit=READ_SIDE_HISTORY_RECENT_LIMIT_DEFAULT)
    if history.status != "comparison_ready":
        status: TopologyObjectEvidenceDeltaComparisonStatus = "no_comparable_anchor"
        scope = (
            "No comparable persisted anchor: policy history does not yet expose a bounded latest-two "
            "snapshot comparison."
        )
        if history.status == "unavailable":
            scope = (
                "No comparable persisted anchor: no normalized policy snapshot history is available for "
                "bounded comparison."
            )
        elif history.status == "current_only":
            scope = (
                "No comparable persisted anchor: only one persisted policy snapshot exists, so a "
                "previous-snapshot row set is not available."
            )
        caveats.append(history.summary)
        return _no_anchor_response(
            object_kind=related_cur.object_kind,
            object_id=object_id,
            now=now,
            status=status,
            scope=scope,
            current_anchor=current_anchor,
            caveats=caveats,
        )

    prev_ps = load_previous_policy_snapshot()
    if prev_ps is None:
        return _no_anchor_response(
            object_kind=related_cur.object_kind,
            object_id=object_id,
            now=now,
            status="insufficient_evidence",
            scope=(
                "Insufficient evidence: policy history indicated comparison readiness, but the previous "
                "persisted policy snapshot could not be loaded."
            ),
            current_anchor=current_anchor,
            caveats=caveats
            + [
                "This is an internal consistency edge case between history summaries and full snapshot loads.",
            ],
        )

    prev_topo = load_previous_topology_snapshot()
    if prev_topo is None:
        return _no_anchor_response(
            object_kind=related_cur.object_kind,
            object_id=object_id,
            now=now,
            status="insufficient_evidence",
            scope=(
                "Insufficient evidence: a previous persisted normalized topology snapshot is required for "
                "anchor B but was not available."
            ),
            current_anchor=current_anchor,
            caveats=caveats,
        )

    if _resolve_object(object_id, prev_topo.snapshot) is None:
        prev_anchor = TopologyObjectEvidenceDeltaAnchorPrevious(
            topology_snapshot_id=prev_topo.snapshot_id,
            topology_persisted_at=prev_topo.persisted_at,
            policy_snapshot_id=prev_ps.snapshot_id,
            policy_persisted_at=prev_ps.persisted_at,
            policy_observed_at=prev_ps.snapshot.observed_at,
        )
        return TopologyObjectEvidenceDeltaResponse(
            metadata=ApiResponseMetadata(
                service="app-api",
                version=settings.app_version,
                phase="phase_2_read_only_foundation",
                generated_at=now,
            ),
            contract_id=TOPOLOGY_OBJECT_EVIDENCE_DELTA_CONTRACT_ID,
            safety_framing=TopologyObjectEvidenceDeltaSafetyFraming(
                explicit_non_claims=list(DEFAULT_TOPOLOGY_OBJECT_EVIDENCE_DELTA_EXPLICIT_NON_CLAIMS),
            ),
            object_kind=related_cur.object_kind,
            object_id=object_id,
            comparison_status="insufficient_evidence",
            scope_summary=(
                "Insufficient evidence: this object_id is not present on the previous persisted topology "
                "snapshot, so a comparable object-scoped anchor B cannot be assembled."
            ),
            current_anchor=current_anchor,
            previous_anchor=prev_anchor,
            delta_items=[
                TopologyObjectEvidenceDeltaItem(
                    category="gap_note",
                    summary="Previous topology snapshot does not contain this object_id; no inferred equality.",
                    detail=None,
                )
            ],
            caveats=caveats,
        )

    related_prev = build_topology_object_related_policies_response_from_snapshot(
        object_id,
        topo_snapshot=prev_topo.snapshot,
        policies=list(prev_ps.snapshot.records),
    )
    if related_prev is None:
        return _no_anchor_response(
            object_kind=related_cur.object_kind,
            object_id=object_id,
            now=now,
            status="insufficient_evidence",
            scope="Insufficient evidence: related-policy assembly for anchor B failed unexpectedly.",
            current_anchor=current_anchor,
            caveats=caveats,
        )

    collector_snapshot, policy_snapshot, persisted_at = _build_policy_inventory()
    _, topo_cur, _ = load_topology_snapshot_for_topology_relationship_queries()

    row_cur_posture: str = (
        "stale"
        if collector_snapshot.status == "collector_unavailable" and persisted_at is not None
        else "current"
    )
    row_prev_posture = "stale"

    policy_by_id_cur: dict[str, PolicyInventoryRecord] = {p.policy_id: p for p in policy_snapshot.records}
    policy_by_id_prev: dict[str, PolicyInventoryRecord] = {
        p.policy_id: p for p in prev_ps.snapshot.records
    }

    cur_ids = sorted({item.policy_id for item in related_cur.items})
    prev_ids = sorted({item.policy_id for item in related_prev.items})

    rollup_cur = _rollup_for_side(cur_ids, policy_by_id=policy_by_id_cur, row_current_posture=row_cur_posture)
    rollup_prev = _rollup_for_side(prev_ids, policy_by_id=policy_by_id_prev, row_current_posture=row_prev_posture)

    bd_cur = degraded_posture_breakdown_for_distinct_policy_ids(
        cur_ids,
        policy_by_id=policy_by_id_cur,
        row_current_posture=row_cur_posture,
    )[0]
    bd_prev = degraded_posture_breakdown_for_distinct_policy_ids(
        prev_ids,
        policy_by_id=policy_by_id_prev,
        row_current_posture=row_prev_posture,
    )[0]

    delta_items: list[TopologyObjectEvidenceDeltaItem] = []

    if set(cur_ids) != set(prev_ids):
        added = sorted(set(cur_ids) - set(prev_ids))
        removed = sorted(set(prev_ids) - set(cur_ids))
        delta_items.append(
            TopologyObjectEvidenceDeltaItem(
                category="related_policy_set_change",
                summary="Related policy_id set differs between current assembly and the previous snapshot pair.",
                detail=f"added={added} removed={removed}",
            )
        )

    if rollup_cur != rollup_prev:
        delta_items.append(
            TopologyObjectEvidenceDeltaItem(
                category="failure_impact_rollup_change",
                summary="Failure-impact–shaped rollup counts differ between anchors (subset-scoped).",
                detail=None,
            )
        )

    rt_cur = _ranking_tuple_from_breakdown(
        breakdown=(bd_cur.ok, bd_cur.degraded, bd_cur.unknown),
        breadth=len(cur_ids),
    )
    rt_prev = _ranking_tuple_from_breakdown(
        breakdown=(bd_prev.ok, bd_prev.degraded, bd_prev.unknown),
        breadth=len(prev_ids),
    )
    if rt_cur != rt_prev:
        delta_items.append(
            TopologyObjectEvidenceDeltaItem(
                category="risk_summary_ranking_inputs_change",
                summary="D/U/R/K-style ranking inputs for this object differ between anchors.",
                detail=None,
            )
        )

    member_changed: list[str] = []
    for pid in sorted(set(cur_ids) & set(prev_ids)):
        cur_pol = policy_by_id_cur.get(pid)
        prev_pol = policy_by_id_prev.get(pid)
        if cur_pol is None or prev_pol is None:
            continue
        c_cls = build_degraded_policy_v1_classification(
            policy=cur_pol,
            row_current_posture=row_cur_posture,
        )
        p_cls = build_degraded_policy_v1_classification(
            policy=prev_pol,
            row_current_posture=row_prev_posture,
        )
        if c_cls.posture != p_cls.posture or sorted(c_cls.reason_codes) != sorted(p_cls.reason_codes):
            member_changed.append(pid)
    if member_changed:
        delta_items.append(
            TopologyObjectEvidenceDeltaItem(
                category="related_member_degraded_policy_change",
                summary="One or more related policies changed degraded_policy_v1 posture or reason_codes.",
                detail=f"policy_ids={member_changed}",
            )
        )

    resolved_cur = _resolve_object(object_id, topo_cur)
    resolved_prev = _resolve_object(object_id, prev_topo.snapshot)
    if resolved_cur is not None and resolved_prev is not None:
        kind_c, node_c, link_c = resolved_cur
        _, node_p, link_p = resolved_prev
        row_changed = False
        if kind_c == "node" and node_c is not None and node_p is not None:
            row_changed = _node_signature(node_c) != _node_signature(node_p)
        elif kind_c == "link" and link_c is not None and link_p is not None:
            row_changed = _link_signature(link_c) != _link_signature(link_p)
        if row_changed:
            delta_items.append(
                TopologyObjectEvidenceDeltaItem(
                    category="topology_row_observation_change",
                    summary="Bounded topology node/link fields exposed on the snapshot row differ between anchors.",
                    detail=None,
                )
            )

    caveat_echo = False
    if policy_snapshot.empty_reason != prev_ps.snapshot.empty_reason:
        caveat_echo = True
    if topo_cur.completeness != prev_topo.snapshot.completeness:
        caveat_echo = True
    if caveat_echo:
        delta_items.append(
            TopologyObjectEvidenceDeltaItem(
                category="topology_snapshot_caveat_echo_change",
                summary="Policy inventory empty_reason and/or topology completeness echo differs between anchors.",
                detail=None,
            )
        )

    if not delta_items:
        delta_items.append(
            TopologyObjectEvidenceDeltaItem(
                category="no_comparable_fields",
                summary="No observable differences in compared topology-object–shaped fields between anchors.",
                detail=None,
            )
        )

    pointers: list[MemberPolicyEvidenceDeltaPointer] = []
    for pid in member_changed[:_MAX_MEMBER_POLICY_POINTERS]:
        pr = build_policy_evidence_delta_response(pid)
        if pr is None:
            continue
        pointers.append(
            MemberPolicyEvidenceDeltaPointer(
                policy_id=pid,
                comparison_status=pr.comparison_status,
            )
        )

    if len(delta_items) == 1 and delta_items[0].category == "no_comparable_fields":
        scope = (
            "No normalized differences detected in compared topology-object–shaped fields between the current "
            "assembly and the previous persisted topology plus policy snapshot pair."
        )
    else:
        scope = (
            "Bounded delta between current topology-object assemblies and the previous persisted normalized "
            "topology and policy snapshot pair."
        )

    prev_anchor = TopologyObjectEvidenceDeltaAnchorPrevious(
        topology_snapshot_id=prev_topo.snapshot_id,
        topology_persisted_at=prev_topo.persisted_at,
        policy_snapshot_id=prev_ps.snapshot_id,
        policy_persisted_at=prev_ps.persisted_at,
        policy_observed_at=prev_ps.snapshot.observed_at,
    )

    return TopologyObjectEvidenceDeltaResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        contract_id=TOPOLOGY_OBJECT_EVIDENCE_DELTA_CONTRACT_ID,
        safety_framing=TopologyObjectEvidenceDeltaSafetyFraming(
            explicit_non_claims=list(DEFAULT_TOPOLOGY_OBJECT_EVIDENCE_DELTA_EXPLICIT_NON_CLAIMS),
        ),
        object_kind=related_cur.object_kind,
        object_id=object_id,
        comparison_status="delta_ready",
        scope_summary=scope,
        current_anchor=current_anchor,
        previous_anchor=prev_anchor,
        delta_items=delta_items,
        member_policy_delta_pointers=pointers,
        caveats=caveats,
    )
