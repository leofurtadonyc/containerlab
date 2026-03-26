"""Service Impact Workspace v1 — compose Service Explorer detail + optional failure-impact.

Overlaps (composition only, no replacement of closed APIs):

- ``GET /api/v1/services/{service_id}`` — nested ``ServiceDetailResponse`` (``service_explorer_v1``).
- ``GET /api/v1/topology/objects/{object_id}/failure-impact`` — optional nested ``FailureImpactViewResponse``.

Maintenance preview, change safety case, service dossier, and impact reports remain **separate** GETs;
this workspace surfaces **recommended_api_pivots** only.
"""

from __future__ import annotations

from datetime import UTC, datetime
from urllib.parse import quote

from app_api.config.settings import get_settings
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.failure_impact import FAILURE_IMPACT_CONTRACT_ID, FailureImpactViewResponse
from app_api.schemas.service_explorer import SERVICE_EXPLORER_V1_CONTRACT_ID, ServiceDetailResponse
from app_api.schemas.service_impact_workspace import (
    DEFAULT_SERVICE_IMPACT_WORKSPACE_EXPLICIT_NON_CLAIMS,
    SERVICE_IMPACT_WORKSPACE_V1_CONTRACT_ID,
    ServiceImpactWorkspaceResponse,
)
from app_api.services.failure_impact import build_failure_impact_view_response
from app_api.services.service_explorer import build_service_detail_response


def _dedupe_lines(lines: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for raw in lines:
        line = raw.strip()
        if line and line not in seen:
            seen.add(line)
            out.append(line)
    return out


def _recommended_api_pivots(
    *,
    service_id: str,
    policy_id: str | None,
    topology_node_id: str | None,
) -> list[str]:
    enc = quote(service_id, safe="")
    out: list[str] = []
    if topology_node_id:
        qn = quote(topology_node_id, safe="")
        out.append(
            f"GET /api/v1/maintenance-preview?node_id={qn} — maintenance preview (planning context only).",
        )
        out.append(
            f"GET /api/v1/topology/objects/{qn}/failure-impact — failure_impact_v1 authority for this node.",
        )
    if policy_id:
        qp = quote(policy_id, safe="")
        out.append(
            f"GET /api/v1/reports/change-safety-case/policy?policy_id={qp} — change safety case (separate report).",
        )
    out.append(
        f"GET /api/v1/reports/service-impact?service_id={enc} — impact_report family (not merged as workspace body).",
    )
    out.append(f"GET /api/v1/services/{enc}/dossier — service dossier v1 (distinct composed product).")
    return out[:20]


def _merge_caveats(detail: ServiceDetailResponse, fi: FailureImpactViewResponse | None) -> list[str]:
    merged: list[str] = []
    merged.extend(detail.caveats)
    merged.extend(detail.topology_caveats)
    if fi is not None:
        merged.extend(fi.caveats)
        merged.extend(fi.missing_evidence_notes)
    return _dedupe_lines(merged)


def _merge_evidence_gaps(fi: FailureImpactViewResponse | None) -> list[str]:
    if fi is None:
        return []
    return _dedupe_lines(list(fi.missing_evidence_notes))


def _explicit_non_claims(fi: FailureImpactViewResponse | None) -> list[str]:
    base = list(DEFAULT_SERVICE_IMPACT_WORKSPACE_EXPLICIT_NON_CLAIMS)
    if fi is not None:
        for x in fi.safety_framing.explicit_non_claims:
            s = str(x)
            if s not in base:
                base.append(s)
    return base


def build_service_impact_workspace_response(service_id: str) -> ServiceImpactWorkspaceResponse | None:
    """Return Service Impact Workspace v1 for ``service_id``, or ``None`` when Explorer detail is absent."""
    detail = build_service_detail_response(service_id)
    if detail is None:
        return None

    anchor = detail.topology_links[0].node_id if detail.topology_links else None
    policy_id = detail.members[0].policy_id if detail.members else None

    fi: FailureImpactViewResponse | None = None
    note: str | None = None
    if anchor is None:
        note = (
            "No topology_links; failure-impact rollup omitted "
            "(service_explorer_v1 is authoritative for topology linkage)."
        )
    else:
        fi = build_failure_impact_view_response(anchor)
        if fi is None:
            note = (
                f"Failure-impact assembly returned no rollup for topology object_id={anchor!r} "
                "(unknown topology identity or empty related-policies path per failure_impact_v1)."
            )

    merged = _merge_caveats(detail, fi)
    gap_notes = _merge_evidence_gaps(fi)
    if note:
        gap_notes = _dedupe_lines(gap_notes + [note])

    sources = [SERVICE_EXPLORER_V1_CONTRACT_ID]
    if fi is not None:
        sources.append(FAILURE_IMPACT_CONTRACT_ID)

    settings = get_settings()
    now = datetime.now(tz=UTC)
    return ServiceImpactWorkspaceResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        contract_id=SERVICE_IMPACT_WORKSPACE_V1_CONTRACT_ID,
        service_id=service_id,
        service_explorer=detail,
        failure_impact=fi,
        failure_impact_topology_anchor=anchor,
        failure_impact_assembly_note=note if fi is None else None,
        merged_caveats=merged,
        merged_evidence_gap_notes=gap_notes,
        explicit_non_claims=_explicit_non_claims(fi),
        source_contract_ids=sources,
        recommended_api_pivots=_recommended_api_pivots(
            service_id=service_id,
            policy_id=policy_id,
            topology_node_id=anchor,
        ),
    )
