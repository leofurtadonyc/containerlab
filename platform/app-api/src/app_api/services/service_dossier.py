"""Service Dossier v1 — compose Service Explorer + optional explainability + optional maintenance preview.

Read-only reuse of existing bounded assemblies only; see ``platform/docs/service-dossier-contract.md``.
"""

from __future__ import annotations

from collections import Counter
from datetime import UTC, datetime
from typing import Literal
from urllib.parse import quote

from app_api.config.settings import get_settings
from app_api.schemas.maintenance_preview import MaintenancePreviewResponse
from app_api.schemas.policy_explainability import PolicyExplainabilityResponse
from app_api.schemas.service_dossier import (
    SERVICE_DOSSIER_V1_CONTRACT_ID,
    ServiceDossierResponse,
    ServiceDossierSafetyFraming,
)
from app_api.schemas.service_explorer import (
    SERVICE_EXPLORER_V1_CONTRACT_ID,
    ServiceDetailResponse,
    ServiceMemberSummary,
)
from app_api.services.evidence_export import collect_contract_ids_depth_first
from app_api.services.maintenance_preview import build_maintenance_preview_response
from app_api.services.policy_dossier import _merge_caveats_ordered
from app_api.services.policy_explainability import build_policy_explainability_response
from app_api.services.service_explorer import build_service_detail_response
from app_api.services.topology_related_policies import build_topology_object_related_policies_response

_POSTURE_ORDER: dict[str, int] = {"degraded": 0, "unknown": 1, "ok": 2}


def _worst_member_policy_id(members: list[ServiceMemberSummary]) -> str | None:
    if not members:
        return None
    sorted_m = sorted(
        members,
        key=lambda m: (_POSTURE_ORDER.get(m.degraded_policy_v1.posture, 9), m.policy_id),
    )
    return sorted_m[0].policy_id


def _posture_counts(members: list[ServiceMemberSummary]) -> dict[str, int]:
    c: Counter[Literal["ok", "degraded", "unknown"]] = Counter()
    for m in members:
        c[m.degraded_policy_v1.posture] += 1
    return dict(c)


def _encoded_service_path(service_id: str) -> str:
    return quote(service_id, safe="")


def build_service_dossier_response(service_id: str) -> ServiceDossierResponse | None:
    """Return Service Dossier v1 for ``service_id``, or ``None`` when Explorer detail would 404."""
    detail = build_service_detail_response(service_id)
    if detail is None:
        return None

    settings = get_settings()
    now = datetime.now(tz=UTC)

    default_pid = _worst_member_policy_id(detail.members) or ""
    counts = _posture_counts(detail.members)

    expl: PolicyExplainabilityResponse | None = None
    expl_note: str | None = None
    if default_pid:
        try:
            expl = build_policy_explainability_response(default_pid)
        except Exception as exc:  # noqa: BLE001 — bounded read: surface as gap note
            expl_note = f"Policy explainability assembly failed ({type(exc).__name__}); not embedded."
        if expl is None and expl_note is None and default_pid:
            expl_note = (
                f"Policy explainability not available for default_member_policy_id={default_pid!r} "
                "(policy row absent from inventory slice)."
            )

    maint: MaintenancePreviewResponse | None = None
    maint_node: str | None = None
    maint_note: str | None = None
    if detail.topology_links:
        maint_node = detail.topology_links[0].node_id
        try:
            related = build_topology_object_related_policies_response(maint_node)
            if related is not None:
                maint = build_maintenance_preview_response(
                    related=related,
                    preview_context="explicit_subject",
                )
            else:
                maint_note = (
                    f"Maintenance preview omitted: topology object {maint_node!r} did not resolve "
                    "for related-policies in the current snapshot."
                )
        except Exception as exc:  # noqa: BLE001
            maint_note = f"Maintenance preview assembly failed ({type(exc).__name__}); not embedded."
    else:
        maint_note = (
            "Maintenance preview not composed: no topology linkage rows for this service "
            "(single-subject rule)."
        )

    caveat_chunks: list[list[str]] = [
        list(detail.caveats),
        list(detail.topology_caveats),
    ]
    if expl is not None:
        caveat_chunks.append(list(expl.merged_caveats))
    if maint is not None:
        caveat_chunks.append(list(maint.assembly_caveats))
    merged = _merge_caveats_ordered(*caveat_chunks)
    merged = _merge_caveats_ordered(
        merged,
        [
            f"{SERVICE_DOSSIER_V1_CONTRACT_ID}: composed assembly; nested contract_ids listed in source_contract_ids.",
        ],
    )

    missing_notes: list[str] = []
    if expl_note:
        missing_notes.append(expl_note)
    if maint_note:
        missing_notes.append(maint_note)

    sparse_reasons: list[str] = []
    if detail.policy_inventory.empty_reason != "none":
        sparse_reasons.append(
            f"Policy inventory echo empty_reason={detail.policy_inventory.empty_reason!r}; "
            "dossier is bounded to the same slice.",
        )
    if detail.topology_evidence_status in ("partial", "unavailable"):
        sparse_reasons.append(
            f"Topology linkage posture is {detail.topology_evidence_status!r} (bounded evidence).",
        )
    if expl is None and default_pid:
        sparse_reasons.append("Policy explainability section missing or omitted; see explainability_unavailable_note.")
    if detail.topology_links and maint is None and maint_note and "no topology linkage rows" not in maint_note:
        sparse_reasons.append(
            "Maintenance preview section missing despite topology linkage hints; see maintenance_unavailable_note.",
        )
    sparse = bool(sparse_reasons)

    tree: dict[str, object] = {
        "contract_id": SERVICE_DOSSIER_V1_CONTRACT_ID,
        "service_explorer_detail": detail.model_dump(mode="json"),
        "policy_explainability": expl.model_dump(mode="json") if expl else None,
        "maintenance_preview": maint.model_dump(mode="json") if maint else None,
    }
    source_ids = collect_contract_ids_depth_first(tree)
    if SERVICE_DOSSIER_V1_CONTRACT_ID not in source_ids:
        source_ids.insert(0, SERVICE_DOSSIER_V1_CONTRACT_ID)
    elif source_ids[0] != SERVICE_DOSSIER_V1_CONTRACT_ID:
        source_ids.remove(SERVICE_DOSSIER_V1_CONTRACT_ID)
        source_ids.insert(0, SERVICE_DOSSIER_V1_CONTRACT_ID)

    enc = _encoded_service_path(service_id)
    pivots = [
        f"GET /api/v1/services/{enc} — {SERVICE_EXPLORER_V1_CONTRACT_ID} authority for members and linkage.",
        f"GET /api/v1/services/{enc}/dossier — {SERVICE_DOSSIER_V1_CONTRACT_ID} (this assembly).",
        f"GET /api/v1/policies/{quote(default_pid, safe='')}/explainability — explainability for default member.",
        (
            f"GET /api/v1/reports/service-impact?service_id={quote(service_id, safe='')} — "
            "impact_report_v1 service_impact framing; not identical to this dossier JSON."
        ),
    ]
    if maint_node:
        pivots.append(f"GET /api/v1/maintenance-preview?node_id={quote(maint_node, safe='')} — maintenance preview.")
    inv_hint = (
        f"Live shell: view=investigation — inv_from=service_dossier&service_id={enc} "
        f"(breadcrumb-only; sync_runs_limit discipline unchanged)."
    )

    return ServiceDossierResponse(
        service="app-api",
        version=settings.app_version,
        phase="phase_2_read_only_foundation",
        generated_at=now,
        safety_framing=ServiceDossierSafetyFraming(),
        service_explorer_detail=detail,
        default_member_policy_id=default_pid,
        member_posture_counts=counts,
        policy_explainability=expl,
        explainability_unavailable_note=expl_note,
        maintenance_preview=maint,
        maintenance_preview_subject_node_id=maint_node if maint is not None else None,
        maintenance_unavailable_note=maint_note,
        merged_caveats=merged,
        missing_evidence_notes=missing_notes,
        source_contract_ids=source_ids,
        recommended_api_pivots=pivots[:24],
        investigation_pivot_hint=inv_hint,
        sparse_dossier=sparse,
        sparse_reasons=sparse_reasons,
    )
