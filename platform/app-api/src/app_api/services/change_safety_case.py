"""Change Safety Case v1 — compose existing Phase 2 assemblies only.

See ``platform/docs/change-safety-case-contract.md``.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any
from urllib.parse import quote

from app_api.config.settings import get_settings
from app_api.schemas.change_safety_case import (
    CHANGE_SAFETY_CASE_CONTRACT_ID,
    ChangeSafetyCaseResponse,
    ChangeSafetyCaseSafetyFraming,
)
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.maintenance_preview import MaintenanceSubjectSummary
from app_api.schemas.topology_related_policies import TopologyObjectRelatedPoliciesResponse
from app_api.services.evidence_export import collect_contract_ids_depth_first
from app_api.services.maintenance_preview import build_maintenance_preview_response
from app_api.services.policy_dossier import _merge_caveats_ordered, build_policy_dossier_response
from app_api.services.policy_explainability import build_policy_explainability_response
from app_api.services.service_dossier import build_service_dossier_response
def _metadata() -> ApiResponseMetadata:
    settings = get_settings()
    return ApiResponseMetadata(
        service="app-api",
        version=settings.app_version,
        phase="phase_2_read_only_foundation",
        generated_at=datetime.now(tz=UTC),
    )


def _merge_source_ids(tree: Any) -> list[str]:
    ids = collect_contract_ids_depth_first(tree)
    out: list[str] = [CHANGE_SAFETY_CASE_CONTRACT_ID]
    for cid in ids:
        if cid not in out:
            out.append(cid)
    return out


def _policy_investigation_hints(policy_id: str, dossier: Any) -> list[str]:
    nt = dossier.navigation_targets
    return [
        f"Investigation shell params (navigation only): {nt.investigation_shell_params!r}",
        f"Situation room shell params (navigation only): {nt.situation_room_shell_params!r}",
        (
            "Operator briefing: GET /api/v1/operator-briefing/workspace — bounded briefing assembly; "
            "not approval or execution authority."
        ),
        f"policy_id anchor for pivots: {policy_id!r}",
    ]


def build_policy_change_safety_case(policy_id: str) -> ChangeSafetyCaseResponse | None:
    dossier = build_policy_dossier_response(policy_id)
    if dossier is None:
        return None

    expl = build_policy_explainability_response(policy_id)

    caveat_chunks: list[list[str]] = [list(dossier.merged_caveats)]
    if expl is not None:
        caveat_chunks.append(list(expl.merged_caveats))
    merged = _merge_caveats_ordered(*caveat_chunks)
    merged = _merge_caveats_ordered(
        merged,
        [
            f"{CHANGE_SAFETY_CASE_CONTRACT_ID}: composed pre-change posture; nested contract_ids in source_contract_ids.",
        ],
    )

    ta = dossier.path_analysis.truth_alignment.posture
    degraded = dossier.policy_record.degraded_policy_v1.posture
    understanding = (
        f"Member degraded_policy_v1 posture: {degraded!r}. "
        f"Path truth_alignment posture: {ta!r} — {dossier.path_analysis.truth_alignment.summary} "
        "Read-side interpretation only — not safe-to-change or validation."
    )

    inventory = [
        "policy_dossier_v1 — path analysis, topology impact, evidence timeline/delta, navigation targets.",
    ]
    if expl is not None:
        inventory.append("policy_explainability_workspace_v1 — optional embedded path-story assembly.")
    else:
        inventory.append(
            "policy_explainability_workspace_v1 — not embedded (unavailable or incomplete inputs for this slice).",
        )

    gaps: list[str] = []
    if expl is None:
        gaps.append(
            "Policy explainability workspace not embedded — path-story rollups and candidate signals may be missing "
            "from this safety case body; open GET /api/v1/policies/{policy_id}/explainability when needed.",
        )
    if len(dossier.topology_impact.items) == 0:
        gaps.append(
            "Topology impact table is empty for this policy — cannot infer co-visibility with topology objects "
            "from impact rows in this slice.",
        )
    if ta in ("uncertain", "insufficient_evidence", "contradictory"):
        gaps.append(
            f"Path truth_alignment is {ta!r} — not a validation verdict; treat alignment as incomplete read-side.",
        )

    next_rev: list[str] = []
    if dossier.freshness.policy_serving_mode_echo == "persisted_fallback":
        next_rev.append(
            "Policy inventory serving mode is persisted_fallback — prefer live collector path when healthy for fresher rows.",
        )
    if dossier.freshness.policy_inventory_empty_reason not in (None, "none"):
        next_rev.append(
            f"Policy inventory empty_reason={dossier.freshness.policy_inventory_empty_reason!r} — "
            "re-check inventory before overreading dossier sections.",
        )
    if ta == "uncertain":
        next_rev.append(
            "Review path-analysis and explainability panels before treating candidate path state as definitive.",
        )

    sparse = bool(gaps) or len(dossier.topology_impact.items) == 0 or ta != "intended_vs_observed_aligned"
    reasons: list[str] = []
    if expl is None:
        reasons.append("Explainability not embedded.")
    if len(dossier.topology_impact.items) == 0:
        reasons.append("Empty topology impact rows.")
    if ta != "intended_vs_observed_aligned":
        reasons.append(f"truth_alignment={ta!r}.")

    tree: dict[str, Any] = {
        "contract_id": CHANGE_SAFETY_CASE_CONTRACT_ID,
        "policy_dossier": dossier.model_dump(mode="json"),
        "policy_explainability": expl.model_dump(mode="json") if expl else None,
    }

    pivots = [
        f"/api/v1/reports/policy-impact?policy_id={quote(policy_id, safe='')}",
        f"/api/v1/policies/{quote(policy_id, safe='')}/explainability",
        f"/api/v1/policies/{quote(policy_id, safe='')}/dossier",
        "/api/v1/change-intelligence/recent-summary",
        "/api/v1/delta-digest",
    ]

    return ChangeSafetyCaseResponse(
        metadata=_metadata(),
        safety_case_context="policy_change_safety",
        safety_framing=ChangeSafetyCaseSafetyFraming(),
        source_contract_ids=_merge_source_ids(tree),
        understanding_posture_summary=understanding,
        evidence_inventory=inventory,
        merged_caveats=merged,
        evidence_gaps=gaps,
        next_review_guidance=next_rev,
        recommended_api_pivots=pivots,
        investigation_situation_briefing_pivot_hints=_policy_investigation_hints(policy_id, dossier),
        sparse_case=sparse,
        sparse_reasons=reasons,
        anchor_policy_id=policy_id,
        policy_dossier=dossier,
        policy_explainability=expl,
    )


def build_service_change_safety_case(service_id: str) -> ChangeSafetyCaseResponse | None:
    """Reuse Service Dossier v1 as the primary composed body (Explorer + optional explainability + optional maintenance)."""
    sd = build_service_dossier_response(service_id)
    if sd is None:
        return None

    detail = sd.service_explorer_detail
    ta_note = detail.topology_evidence_status
    understanding = (
        f"Service Explorer member count: {detail.members_total}; "
        f"degraded_service roll-up: {detail.degraded_service.posture!r}; "
        f"topology linkage evidence status: {ta_note!r}. "
        "Composed read-side posture only — not safe-to-change."
    )

    inventory = [
        "service_explorer_v1 — members, inventory echo, topology linkage (nested in service_dossier).",
        "service_dossier_v1 — composed dossier including optional policy_explainability and maintenance_preview.",
    ]

    gaps: list[str] = list(sd.missing_evidence_notes)
    if detail.members_total == 0:
        gaps.append("Service has zero member policies — grouping may be unsupported or empty in this slice.")
    if detail.policy_inventory.empty_reason != "none":
        gaps.append(
            f"Policy inventory empty_reason={detail.policy_inventory.empty_reason!r} — bounded to same slice as Explorer.",
        )
    if ta_note in ("partial", "unavailable"):
        gaps.append(
            f"Topology linkage evidence is {ta_note!r} — relationship visibility is incomplete.",
        )
    if sd.sparse_dossier:
        gaps.extend(sd.sparse_reasons)

    next_rev: list[str] = []
    if ta_note != "present":
        next_rev.append("Re-fetch topology and Service Explorer detail when snapshots refresh for stronger linkage.")
    if sd.explainability_unavailable_note:
        next_rev.append("Open explainability for member policies when default-member explainability is missing.")
    next_rev.append(
        "Investigation / situation room: use sync_runs_limit discipline from navigation hints only — not scheduling authority.",
    )

    sparse = sd.sparse_dossier or detail.members_total == 0 or ta_note in ("partial", "unavailable")
    reasons = list(sd.sparse_reasons)
    if detail.members_total == 0:
        reasons.append("Zero members.")
    if ta_note in ("partial", "unavailable"):
        reasons.append(f"topology_evidence_status={ta_note!r}.")

    tree = sd.model_dump(mode="json")
    enc = quote(service_id, safe="")
    pivots = [
        f"/api/v1/reports/service-impact?service_id={quote(service_id, safe='')}",
        f"/api/v1/services/{enc}/dossier",
        f"/api/v1/services/{enc}",
        "/api/v1/change-intelligence/recent-summary",
    ]
    hints = [
        sd.investigation_pivot_hint,
        "Situation room: GET /api/v1/evidence-pack/situation — bounded pack; not substitute for live APIs.",
        "Operator briefing: GET /api/v1/operator-briefing/workspace",
    ]

    return ChangeSafetyCaseResponse(
        metadata=_metadata(),
        safety_case_context="service_change_safety",
        safety_framing=ChangeSafetyCaseSafetyFraming(),
        source_contract_ids=_merge_source_ids(tree),
        understanding_posture_summary=understanding,
        evidence_inventory=inventory,
        merged_caveats=list(sd.merged_caveats),
        evidence_gaps=gaps,
        next_review_guidance=next_rev,
        recommended_api_pivots=pivots,
        investigation_situation_briefing_pivot_hints=hints,
        sparse_case=sparse,
        sparse_reasons=reasons,
        anchor_service_id=service_id,
        service_dossier=sd,
    )


def build_topology_change_safety_case_from_related(
    *,
    related: TopologyObjectRelatedPoliciesResponse,
    preview_context: str,
) -> ChangeSafetyCaseResponse:
    """Caller validates topology identity and object_kind match (same rules as maintenance-preview / impact report)."""
    preview = build_maintenance_preview_response(related=related, preview_context=preview_context)
    subj = MaintenanceSubjectSummary(
        object_kind=preview.subject.object_kind,
        object_id=preview.subject.object_id,
        display_name=preview.subject.display_name,
        source_node_id=preview.subject.source_node_id,
        target_node_id=preview.subject.target_node_id,
    )
    oid = preview.subject.object_id
    rc = preview.failure_impact.rollup_counts
    understanding = (
        f"Maintenance Preview subject {preview.subject.object_kind!r} {oid!r}; "
        f"sparse_preview={preview.sparse_preview}; "
        f"failure-impact rollups: related_policies_total={rc.related_policies_total}, "
        f"degraded_related_policies_total={rc.degraded_related_policies_total}. "
        "Co-occurrence read-side only — not blast-radius or approval."
    )

    inventory = [
        "maintenance_preview_v1 — related policies, failure-impact reuse, service pointers.",
        "topology_object_related_policies_v1 — relationship basis for this subject.",
    ]

    gaps: list[str] = list(preview.assembly_caveats[:8])
    if preview.sparse_preview:
        gaps.append("Maintenance preview flagged sparse_preview — lists may be capped or partial.")
    if not preview.related_policies.items:
        gaps.append("No related policies resolved for this topology subject — string alignment may be empty.")

    next_rev = [
        "Re-run related-policies after topology refresh if snapshot is stale.",
        f"Open GET /api/v1/topology/objects/{quote(oid, safe='')}/dossier for object-centric depth.",
        "Investigation and situation room remain navigation-only pivots — not workflow state.",
    ]

    tree = preview.model_dump(mode="json")
    pivots = [
        f"/api/v1/reports/maintenance-impact?node_id={quote(oid, safe='')}"
        if preview.subject.object_kind == "node"
        else f"/api/v1/reports/maintenance-impact?link_id={quote(oid, safe='')}",
        "/api/v1/maintenance-preview",
        f"/api/v1/topology/objects/{quote(oid, safe='')}/failure-impact",
    ]

    return ChangeSafetyCaseResponse(
        metadata=_metadata(),
        safety_case_context="topology_change_safety",
        safety_framing=ChangeSafetyCaseSafetyFraming(),
        source_contract_ids=_merge_source_ids(tree),
        understanding_posture_summary=understanding,
        evidence_inventory=inventory,
        merged_caveats=list(preview.assembly_caveats),
        evidence_gaps=gaps,
        next_review_guidance=next_rev,
        recommended_api_pivots=pivots,
        investigation_situation_briefing_pivot_hints=[
            "GET /api/v1/investigation-workspace/context — sync-bounded assembly; not execution planning.",
            "GET /api/v1/evidence-pack/situation — bounded situation pack.",
        ],
        sparse_case=preview.sparse_preview,
        sparse_reasons=list(preview.sparse_reasons),
        anchor_maintenance=subj,
        maintenance_preview=preview,
    )


def change_safety_case_response_to_markdown(body: ChangeSafetyCaseResponse) -> str:
    """Markdown companion: metadata + honesty + nested JSON (same pattern as impact report)."""
    dumped = body.model_dump(mode="json")
    nested_json = json.dumps(dumped, indent=2, ensure_ascii=False)
    lines: list[str] = [
        f"# Change safety case: {body.safety_case_context}",
        "",
        "## Case metadata",
        "",
        f"- **contract_id:** `{body.contract_id}`",
        f"- **generated_at:** {body.metadata.generated_at.isoformat()}",
    ]
    if body.anchor_policy_id:
        lines.append(f"- **anchor policy_id:** `{body.anchor_policy_id}`")
    if body.anchor_service_id:
        lines.append(f"- **anchor service_id:** `{body.anchor_service_id}`")
    if body.anchor_maintenance:
        am = body.anchor_maintenance
        lines.append(f"- **anchor topology subject:** `{am.object_kind}` `{am.object_id}` ({am.display_name})")
    lines.extend(["", "## Source contract ids", ""])
    for cid in body.source_contract_ids:
        lines.append(f"- `{cid}`")
    lines.extend(["", "## Understanding posture summary", "", body.understanding_posture_summary, ""])
    lines.extend(["## Evidence inventory", ""])
    for row in body.evidence_inventory:
        lines.append(f"- {row}")
    lines.extend(["", "## Evidence gaps", ""])
    for g in body.evidence_gaps:
        lines.append(f"- {g}")
    lines.extend(["", "## Explicit non-claims", ""])
    for claim in body.safety_framing.explicit_non_claims:
        lines.append(f"- {claim}")
    if body.sparse_case:
        lines.extend(["", "## Sparse / partial", "", f"- **sparse_case:** {body.sparse_case}"])
        for r in body.sparse_reasons:
            lines.append(f"- {r}")
    lines.extend(
        [
            "",
            "## Full payload (JSON)",
            "",
            "```json",
            nested_json,
            "```",
            "",
        ]
    )
    return "\n".join(lines)
