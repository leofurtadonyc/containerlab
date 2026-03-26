"""Maintenance Evidence Workspace v1 — compose maintenance preview, dossier, timeline, delta, change safety case.

Overlaps (composition only):

- ``GET /api/v1/maintenance-preview`` — nested ``maintenance_preview_v1``.
- ``GET /api/v1/topology/objects/{object_id}/dossier`` — nested ``topology_object_dossier_v1``.
- ``GET /api/v1/topology/objects/{object_id}/evidence-timeline`` — nested ``topology_object_evidence_timeline_v1``.
- ``GET /api/v1/topology/objects/{object_id}/evidence-delta`` — nested ``topology_object_evidence_delta_v1``.
- ``GET /api/v1/reports/change-safety-case/maintenance`` — same assembly as ``build_topology_change_safety_case_from_related``.

Not ``evidence_export_v1``; export/replay boundaries: ``platform/docs/maintenance-evidence-workspace-contract.md``.
"""

from __future__ import annotations

from datetime import UTC, datetime
from urllib.parse import quote

from app_api.config.settings import get_settings
from app_api.schemas.change_safety_case import CHANGE_SAFETY_CASE_CONTRACT_ID
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.maintenance_evidence_workspace import (
    DEFAULT_MAINTENANCE_EVIDENCE_WORKSPACE_EXPLICIT_NON_CLAIMS,
    MAINTENANCE_EVIDENCE_WORKSPACE_V1_CONTRACT_ID,
    MaintenanceEvidenceWorkspaceResponse,
)
from app_api.schemas.maintenance_preview import MAINTENANCE_PREVIEW_CONTRACT_ID
from app_api.schemas.topology_object_dossier import TOPOLOGY_OBJECT_DOSSIER_CONTRACT_ID
from app_api.schemas.topology_object_evidence_delta import TOPOLOGY_OBJECT_EVIDENCE_DELTA_CONTRACT_ID
from app_api.schemas.topology_object_evidence_timeline import TOPOLOGY_OBJECT_EVIDENCE_TIMELINE_CONTRACT_ID
from app_api.schemas.topology_related_policies import TopologyObjectRelatedPoliciesResponse
from app_api.services.change_safety_case import build_topology_change_safety_case_from_related
from app_api.services.maintenance_preview import build_maintenance_preview_response
from app_api.services.topology_object_dossier import build_topology_object_dossier_response
from app_api.services.topology_object_evidence_delta import build_topology_object_evidence_delta_response
from app_api.services.topology_object_evidence_timeline import build_topology_object_evidence_timeline_response


def _dedupe_lines(lines: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for raw in lines:
        line = raw.strip()
        if line and line not in seen:
            seen.add(line)
            out.append(line)
    return out


def _merge_source_ids(*chunks: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = [MAINTENANCE_EVIDENCE_WORKSPACE_V1_CONTRACT_ID]
    for chunk in chunks:
        for cid in chunk:
            if cid not in seen:
                seen.add(cid)
                out.append(cid)
    return out


def _recommended_pivots(*, object_id: str, object_kind: str, service_ids: list[str]) -> list[str]:
    oid = quote(object_id, safe="")
    out: list[str] = [
        f"GET /api/v1/maintenance-preview?object_id={oid}&object_kind={object_kind} — maintenance preview (same subject).",
        f"GET /api/v1/topology/objects/{oid}/dossier — topology object dossier v1.",
        f"GET /api/v1/topology/objects/{oid}/evidence-timeline — topology object evidence timeline v1.",
        f"GET /api/v1/topology/objects/{oid}/evidence-delta — topology object evidence delta v1.",
        (
            f"GET /api/v1/reports/change-safety-case/maintenance?object_id={oid}&object_kind={object_kind}"
            " — change safety case v1 (separate report family)."
        ),
    ]
    if object_kind == "node":
        out.append(f"GET /api/v1/reports/maintenance-impact?node_id={oid} — impact_report family.")
    else:
        out.append(f"GET /api/v1/reports/maintenance-impact?link_id={oid} — impact_report family.")
    for sid in service_ids[:8]:
        enc = quote(sid, safe="")
        out.append(
            f"GET /api/v1/service-impact-workspace?service_id={enc} — service_impact_workspace_v1 (distinct anchor).",
        )
    out.append("GET /api/v1/exports/... — evidence_export_v1 envelopes (not this workspace JSON).")
    return out[:32]


def _explicit_non_claims() -> list[str]:
    return list(DEFAULT_MAINTENANCE_EVIDENCE_WORKSPACE_EXPLICIT_NON_CLAIMS)


def build_maintenance_evidence_workspace_response(
    *,
    related: TopologyObjectRelatedPoliciesResponse,
    preview_context: str,
) -> MaintenanceEvidenceWorkspaceResponse:
    """Return Maintenance Evidence Workspace v1 for a validated topology subject."""
    object_id = related.object_id
    object_kind = related.object_kind

    preview = build_maintenance_preview_response(related=related, preview_context=preview_context)
    dossier = build_topology_object_dossier_response(object_id)
    timeline = build_topology_object_evidence_timeline_response(object_id, related_policies=related)
    delta = build_topology_object_evidence_delta_response(object_id)
    csc = build_topology_change_safety_case_from_related(related=related, preview_context=preview_context)

    merged: list[str] = []
    merged.extend(preview.assembly_caveats)
    if dossier is not None:
        merged.extend(dossier.merged_caveats)
    if timeline is not None:
        merged.extend(timeline.missing_evidence_notes)
    if delta is not None:
        merged.extend(delta.caveats)
    merged.extend(csc.merged_caveats)
    merged.extend(csc.evidence_gaps[:16])
    merged = _dedupe_lines(merged)

    gap_notes: list[str] = []
    if dossier is None:
        gap_notes.append(
            "topology_object_dossier_v1 not embedded — assembly returned no dossier for this object_id "
            "(unexpected if related-policies resolved; treat as internal gap).",
        )
    if timeline is None:
        gap_notes.append(
            "topology_object_evidence_timeline_v1 not embedded — timeline assembly unavailable for this subject.",
        )
    if delta is None:
        gap_notes.append(
            "topology_object_evidence_delta_v1 not embedded — delta assembly unavailable for this subject.",
        )
    if delta is not None and delta.comparison_status != "delta_ready":
        gap_notes.append(
            f"topology_object_evidence_delta_v1 comparison_status={delta.comparison_status!r} "
            "(honest anchor limitations per delta contract).",
        )
    gap_notes.append(
        "change_safety_case_v1 embeds maintenance_preview_v1 again — same assembly as top-level "
        "maintenance_preview (duplicate JSON by design for change safety contract completeness).",
    )
    gap_notes = _dedupe_lines(gap_notes)

    svc_ids: list[str] = []
    for row in preview.related_services:
        if row.service_id and row.service_id not in svc_ids:
            svc_ids.append(row.service_id)

    sources = _merge_source_ids(
        [MAINTENANCE_PREVIEW_CONTRACT_ID] + list(preview.source_contract_ids),
        [TOPOLOGY_OBJECT_DOSSIER_CONTRACT_ID] if dossier is not None else [],
        [TOPOLOGY_OBJECT_EVIDENCE_TIMELINE_CONTRACT_ID] if timeline is not None else [],
        [TOPOLOGY_OBJECT_EVIDENCE_DELTA_CONTRACT_ID] if delta is not None else [],
        [CHANGE_SAFETY_CASE_CONTRACT_ID] + list(csc.source_contract_ids),
    )

    framing = (
        "Maintenance evidence workspace v1 composes maintenance preview, topology object dossier, evidence "
        "timeline and delta, and a topology change safety case from existing Phase 2 read-only GET assemblies "
        "only. It does not approve work, simulate outages, or assert safe-to-change authority."
    )

    settings = get_settings()
    now = datetime.now(tz=UTC)
    return MaintenanceEvidenceWorkspaceResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        contract_id=MAINTENANCE_EVIDENCE_WORKSPACE_V1_CONTRACT_ID,
        object_kind=object_kind,
        object_id=object_id,
        preview_context=preview.preview_context,
        maintenance_framing_summary=framing,
        maintenance_preview=preview,
        topology_object_dossier=dossier,
        topology_object_evidence_timeline=timeline,
        topology_object_evidence_delta=delta,
        change_safety_case=csc,
        merged_caveats=merged,
        merged_evidence_gap_notes=gap_notes,
        explicit_non_claims=_explicit_non_claims(),
        source_contract_ids=sources,
        recommended_api_pivots=_recommended_pivots(
            object_id=object_id,
            object_kind=object_kind,
            service_ids=svc_ids,
        ),
    )
