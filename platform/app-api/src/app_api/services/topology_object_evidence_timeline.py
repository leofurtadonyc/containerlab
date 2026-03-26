"""Assemble topology-object-scoped evidence timeline read responses (Phase 2, read-only).

Reuses related-policies, failure-impact, risk-summary row excerpt, and per-policy
``build_policy_evidence_timeline_response`` projections — see
``platform/docs/topology-object-evidence-timeline-contract.md``.
"""

from __future__ import annotations

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.policy_evidence_timeline import PolicyEvidenceTimelineEntry
from app_api.schemas.topology_object_evidence_timeline import (
    TOPOLOGY_OBJECT_EVIDENCE_TIMELINE_CONTRACT_ID,
    DEFAULT_TOPOLOGY_OBJECT_EVIDENCE_TIMELINE_EXPLICIT_NON_CLAIMS,
    TopologyObjectEvidenceTimelineEntry,
    TopologyObjectEvidenceTimelineResponse,
    TopologyObjectEvidenceTimelineSafetyFraming,
)
from app_api.schemas.topology_related_policies import TopologyObjectRelatedPoliciesResponse
from app_api.services.failure_impact import build_failure_impact_view_response
from app_api.services.policy_evidence_timeline import build_policy_evidence_timeline_response
from app_api.services.topology_related_policies import build_topology_object_related_policies_response
from app_api.services.topology_risk_summary import build_topology_risk_summary_response

# Tie-break bands (lower first after newest-first datetime sort).
_TB_SNAPSHOT = 0
_TB_FAILURE_IMPACT = 1
_TB_RELATED_LIST = 2
_TB_RISK_ROW = 3
_TB_POLICY_BASE = 10

_MAX_ENTRIES = 400


def _member_tie_break(member_index: int, inner: int) -> int:
    return _TB_POLICY_BASE + member_index * 1000 + inner


def _project_policy_entries(
    *,
    policy_id: str,
    member_index: int,
    policy_entries: list[PolicyEvidenceTimelineEntry],
) -> list[TopologyObjectEvidenceTimelineEntry]:
    out: list[TopologyObjectEvidenceTimelineEntry] = []
    for pe in policy_entries:
        out.append(
            TopologyObjectEvidenceTimelineEntry(
                entry_kind="related_policy_timeline_entry",
                sort_key=pe.sort_key,
                tie_break=_member_tie_break(member_index, pe.tie_break),
                summary=f"[{policy_id}] {pe.summary}",
                provenance="policy_evidence_timeline_v1",
                reference=f"GET /api/v1/policies/{policy_id}/evidence-timeline — {pe.reference}",
                policy_id=policy_id,
                source_policy_entry_kind=pe.entry_kind,
            )
        )
    return out


def build_topology_object_evidence_timeline_response(
    object_id: str,
    *,
    related_policies: TopologyObjectRelatedPoliciesResponse | None = None,
) -> TopologyObjectEvidenceTimelineResponse | None:
    """Return evidence timeline for ``object_id``, or ``None`` if the topology object is unknown."""
    related = related_policies or build_topology_object_related_policies_response(object_id)
    if related is None:
        return None

    fi = build_failure_impact_view_response(object_id, related_policies=related)
    if fi is None:
        return None

    settings = get_settings()
    now = datetime.now(tz=UTC)
    missing: list[str] = []
    merged: list[TopologyObjectEvidenceTimelineEntry] = []

    topo_obs = fi.freshness.topology_snapshot_observed_at
    if topo_obs is None:
        topo_obs = related.metadata.generated_at
        missing.append(
            "Topology snapshot observed_at was absent on failure-impact freshness; snapshot anchor "
            "sort_key uses related-policies assembly time as fallback (interpretation only)."
        )

    merged.append(
        TopologyObjectEvidenceTimelineEntry(
            entry_kind="topology_object_snapshot_anchor",
            sort_key=topo_obs,
            tie_break=_TB_SNAPSHOT,
            summary=(
                f"Topology snapshot observation anchor for object_kind={related.object_kind} "
                f"object_id={object_id!r} (read-side slice; not pairing or coverage proof)."
            ),
            provenance="topology_v1",
            reference="GET /api/v1/topology — observed_at echo via failure-impact freshness",
            policy_id=None,
            source_policy_entry_kind=None,
        )
    )

    merged.append(
        TopologyObjectEvidenceTimelineEntry(
            entry_kind="failure_impact_assembly_anchor",
            sort_key=fi.freshness.assembly_generated_at,
            tie_break=_TB_FAILURE_IMPACT,
            summary=(
                f"Failure-impact v1 assembly — related_policies_total={fi.rollup_counts.related_policies_total}, "
                "subset-scoped degraded counts (interpretation only)."
            ),
            provenance="failure_impact_v1",
            reference=f"GET /api/v1/topology/objects/{object_id}/failure-impact",
            policy_id=None,
            source_policy_entry_kind=None,
        )
    )

    merged.append(
        TopologyObjectEvidenceTimelineEntry(
            entry_kind="related_policies_list_anchor",
            sort_key=related.metadata.generated_at,
            tie_break=_TB_RELATED_LIST,
            summary=(
                f"Related-policies string-equality set: {len(related.items)} reference row(s); "
                "not operational dependency or dataplane truth."
            ),
            provenance="topology_related_policies_v1",
            reference=f"GET /api/v1/topology/objects/{object_id}/related-policies",
            policy_id=None,
            source_policy_entry_kind=None,
        )
    )

    risk = build_topology_risk_summary_response()
    risk_row = next(
        (
            r
            for r in risk.ranked_objects
            if r.object_id == object_id and r.object_kind == related.object_kind
        ),
        None,
    )
    if risk_row is not None:
        ri = risk_row.ranking_inputs
        merged.append(
            TopologyObjectEvidenceTimelineEntry(
                entry_kind="topology_risk_summary_row_anchor",
                sort_key=risk.freshness.assembly_generated_at,
                tie_break=_TB_RISK_ROW,
                summary=(
                    f"Risk summary row rank_index={risk_row.rank_index} "
                    f"D={ri.degraded_related_count} U={ri.unknown_related_count} "
                    f"R={ri.related_policy_breadth} K={ri.ok_related_count} (subset-scoped; not SLA risk)."
                ),
                provenance="topology_risk_summary_v1",
                reference="GET /api/v1/topology/risk-summary (row excerpt)",
                policy_id=None,
                source_policy_entry_kind=None,
            )
        )
    else:
        missing.append(
            "No matching topology risk summary row for this object in the current ranked_objects list "
            "(unexpected if object exists); risk anchor omitted."
        )

    unique_policy_ids = sorted({item.policy_id for item in related.items})
    for idx, pid in enumerate(unique_policy_ids):
        pt = build_policy_evidence_timeline_response(pid)
        if pt is None:
            missing.append(
                f"No normalized inventory row for related policy_id={pid!r}; policy timeline projection skipped."
            )
            continue
        merged.extend(
            _project_policy_entries(
                policy_id=pid,
                member_index=idx,
                policy_entries=pt.entries,
            )
        )
        missing.extend(f"[{pid}] {n}" for n in pt.missing_evidence_notes)

    merged.sort(key=lambda e: (-e.sort_key.timestamp(), e.tie_break, e.policy_id or ""))

    truncated = False
    if len(merged) > _MAX_ENTRIES:
        truncated = True
        merged = merged[:_MAX_ENTRIES]
        missing.append(
            f"Topology object evidence timeline truncated to {_MAX_ENTRIES} entries; open per-policy "
            "GET /api/v1/policies/<policy_id>/evidence-timeline for full policy-only depth."
        )

    scope = (
        "Bounded evidence window from topology-object scope, failure-impact, related-policies, risk-summary "
        "excerpt, and per-related-policy policy_evidence_timeline_v1 projections."
    )
    if not any(e.entry_kind == "related_policy_timeline_entry" for e in merged):
        scope = "Partial evidence window — related policy timeline projections are empty or unavailable; see notes."
    if truncated:
        scope = "Partial evidence window — entries truncated; see missing_evidence_notes."

    return TopologyObjectEvidenceTimelineResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        contract_id=TOPOLOGY_OBJECT_EVIDENCE_TIMELINE_CONTRACT_ID,
        safety_framing=TopologyObjectEvidenceTimelineSafetyFraming(
            explicit_non_claims=list(DEFAULT_TOPOLOGY_OBJECT_EVIDENCE_TIMELINE_EXPLICIT_NON_CLAIMS),
        ),
        object_kind=related.object_kind,
        object_id=related.object_id,
        scope_summary=scope,
        entries=merged,
        missing_evidence_notes=missing,
    )
