"""Evidence export v1 — bounded read-only snapshots of existing Phase 2 assemblies."""

from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse, PlainTextResponse

from app_api.schemas.evidence_export import (
    InvestigationWorkspaceEvidenceExportResponse,
    PolicyDossierEvidenceExportResponse,
    SituationRoomEvidenceExportResponse,
    TopologyObjectDossierEvidenceExportResponse,
)
from app_api.schemas.maintenance_preview import MaintenancePreviewContext
from app_api.schemas.maintenance_window_workspace import (
    MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS,
)
from app_api.services.briefing_export_bundle import (
    briefing_export_bundle_to_markdown,
    build_briefing_export_bundle_response,
)
from app_api.services.maintenance_window_handoff import (
    build_maintenance_window_handoff_response,
    maintenance_window_handoff_to_markdown,
)
from app_api.services.maintenance_window_workspace import dedupe_subjects, parse_subject_tokens
from app_api.services.change_intelligence import (
    RECENT_CHANGE_SYNC_RUNS_DEFAULT,
    RECENT_CHANGE_SYNC_RUNS_MAX,
)
from app_api.services.evidence_export import (
    build_investigation_workspace_export,
    build_policy_dossier_export,
    build_situation_room_export,
    build_topology_object_dossier_export,
    evidence_export_response_to_markdown,
)

router = APIRouter(tags=["exports"])

ExportFormat = Literal["json", "markdown"]


def _export_response(
    fmt: ExportFormat,
    body: PolicyDossierEvidenceExportResponse
    | TopologyObjectDossierEvidenceExportResponse
    | SituationRoomEvidenceExportResponse
    | InvestigationWorkspaceEvidenceExportResponse,
    merged_caveats: list[str] | None,
) -> JSONResponse | PlainTextResponse:
    if fmt == "json":
        return JSONResponse(content=body.model_dump(mode="json"))
    md = evidence_export_response_to_markdown(
        export_kind=body.export_kind,
        subject_ref=body.subject_ref,
        generated_at=body.generated_at,
        source_contract_ids=body.source_contract_ids,
        explicit_non_claims=body.explicit_non_claims,
        export_framing=body.export_framing,
        merged_caveats=merged_caveats,
        nested=body.nested,
    )
    return PlainTextResponse(
        content=md,
        media_type="text/markdown; charset=utf-8",
    )


@router.get(
    "/exports/policies/{policy_id}/dossier",
    response_model=None,
    responses={
        200: {
            "content": {
                "application/json": {},
                "text/markdown": {},
            },
        },
        404: {"description": "Policy dossier absent (same as GET .../policies/{id}/dossier)."},
    },
)
def export_policy_dossier(
    policy_id: str,
    response_format: Annotated[
        ExportFormat,
        Query(
            alias="format",
            description="json (canonical) or markdown (human-readable companion).",
        ),
    ] = "json",
) -> JSONResponse | PlainTextResponse:
    out = build_policy_dossier_export(policy_id)
    if out is None:
        raise HTTPException(status_code=404, detail="Policy dossier not found.")
    return _export_response(
        response_format,
        out,
        merged_caveats=out.nested.merged_caveats,
    )


@router.get(
    "/exports/topology-objects/{object_id}/dossier",
    response_model=None,
    responses={
        200: {
            "content": {
                "application/json": {},
                "text/markdown": {},
            },
        },
        404: {"description": "Topology object dossier absent."},
    },
)
def export_topology_object_dossier(
    object_id: str,
    response_format: Annotated[
        ExportFormat,
        Query(
            alias="format",
            description="json (canonical) or markdown (human-readable companion).",
        ),
    ] = "json",
) -> JSONResponse | PlainTextResponse:
    out = build_topology_object_dossier_export(object_id)
    if out is None:
        raise HTTPException(status_code=404, detail="Topology object dossier not found.")
    return _export_response(
        response_format,
        out,
        merged_caveats=out.nested.merged_caveats,
    )


@router.get(
    "/exports/situation-room/summary",
    response_model=None,
    responses={
        200: {
            "content": {
                "application/json": {},
                "text/markdown": {},
            },
        },
    },
)
def export_situation_room_summary(
    sync_runs_limit: int = Query(
        default=RECENT_CHANGE_SYNC_RUNS_DEFAULT,
        ge=1,
        le=RECENT_CHANGE_SYNC_RUNS_MAX,
        description="Same bounded window as GET /api/v1/evidence-pack/situation.",
    ),
    response_format: Annotated[
        ExportFormat,
        Query(
            alias="format",
            description="json (canonical) or markdown (human-readable companion).",
        ),
    ] = "json",
) -> JSONResponse | PlainTextResponse:
    out = build_situation_room_export(sync_runs_limit=sync_runs_limit)
    return _export_response(response_format, out, merged_caveats=None)


@router.get(
    "/exports/investigation-workspace/summary",
    response_model=None,
    responses={
        200: {
            "content": {
                "application/json": {},
                "text/markdown": {},
            },
        },
    },
)
def export_investigation_workspace_summary(
    sync_runs_limit: int = Query(
        default=RECENT_CHANGE_SYNC_RUNS_DEFAULT,
        ge=1,
        le=RECENT_CHANGE_SYNC_RUNS_MAX,
        description="Same bounded window as GET /api/v1/investigation-workspace/context.",
    ),
    response_format: Annotated[
        ExportFormat,
        Query(
            alias="format",
            description="json (canonical) or markdown (human-readable companion).",
        ),
    ] = "json",
) -> JSONResponse | PlainTextResponse:
    out = build_investigation_workspace_export(sync_runs_limit=sync_runs_limit)
    return _export_response(response_format, out, merged_caveats=None)


@router.get(
    "/exports/operator-briefing",
    response_model=None,
    responses={
        200: {
            "content": {
                "application/json": {},
                "text/markdown": {},
            },
        },
    },
)
def export_operator_briefing_bundle(
    sync_runs_limit: int = Query(
        default=RECENT_CHANGE_SYNC_RUNS_DEFAULT,
        ge=1,
        le=RECENT_CHANGE_SYNC_RUNS_MAX,
        description="Same bounded window as GET /api/v1/operator-briefing.",
    ),
    policy_id: str | None = Query(
        default=None,
        description="When set, a policy_dossier member may be included (or omitted if unavailable).",
    ),
    topology_object: str | None = Query(
        default=None,
        description="With topology_object_kind, a topology_object_dossier member may be included.",
    ),
    topology_object_kind: Literal["node", "link"] | None = Query(
        default=None,
        description="Required with topology_object for topology dossier membership.",
    ),
    inv_from: str | None = Query(
        default=None,
        description="Client-only echo for handoff context (not authority).",
    ),
    global_search_q: str | None = Query(
        default=None,
        description="Optional client echo of operator search query.",
    ),
    response_format: Annotated[
        ExportFormat,
        Query(
            alias="format",
            description="json (canonical) or markdown (human-readable companion).",
        ),
    ] = "json",
) -> JSONResponse | PlainTextResponse:
    """Export briefing_export_bundle_v1: ordered evidence_export_v1 members for briefing context."""
    out = build_briefing_export_bundle_response(
        sync_runs_limit=sync_runs_limit,
        policy_id=policy_id,
        topology_object=topology_object,
        topology_object_kind=topology_object_kind,
        inv_from=inv_from,
        global_search_q=global_search_q,
    )
    if response_format == "json":
        return JSONResponse(content=out.model_dump(mode="json"))
    md = briefing_export_bundle_to_markdown(out)
    return PlainTextResponse(
        content=md,
        media_type="text/markdown; charset=utf-8",
    )


@router.get(
    "/exports/maintenance-window-handoff",
    response_model=None,
    responses={
        200: {
            "content": {
                "application/json": {},
                "text/markdown": {},
            },
        },
        422: {"description": "Missing/invalid subjects or no subjects resolved to topology."},
    },
)
def export_maintenance_window_handoff(
    subject: list[str] = Query(
        default=[],
        description=(
            "Same as GET /api/v1/maintenance-window-workspace: repeated `node:{id}` / `link:{id}` "
            f"(distinct subjects capped at {MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS})."
        ),
    ),
    preview_context: MaintenancePreviewContext = Query(
        default="planning_window",
        description="Same semantics as GET /api/v1/maintenance-window-workspace.",
    ),
    sync_runs_limit: int = Query(
        default=RECENT_CHANGE_SYNC_RUNS_DEFAULT,
        ge=1,
        le=RECENT_CHANGE_SYNC_RUNS_MAX,
        description="Bounded window aligned with maintenance window workspace assembly.",
    ),
    handoff_label: str | None = Query(
        default=None,
        description="Optional communication label only (not approval or ticketing).",
    ),
    operator_note: str | None = Query(
        default=None,
        description="Optional free-text note (not approval or ticketing).",
    ),
    response_format: Annotated[
        ExportFormat,
        Query(
            alias="format",
            description="json (canonical) or markdown (human-readable companion).",
        ),
    ] = "json",
) -> JSONResponse | PlainTextResponse:
    """maintenance_window_handoff_v1 — frozen snapshot of maintenance window workspace assembly (not evidence_export_v1)."""
    if not subject:
        raise HTTPException(
            status_code=422,
            detail="Provide at least one `subject` query parameter (e.g. subject=node:PE1&subject=link:P1--PE1).",
        )
    try:
        pairs = parse_subject_tokens(subject)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    distinct = dedupe_subjects(pairs)
    if len(distinct) > MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Too many distinct subjects after dedupe ({len(distinct)}); "
                f"maximum is {MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS}."
            ),
        )

    out = build_maintenance_window_handoff_response(
        subject_pairs=distinct,
        preview_context=preview_context,
        sync_runs_limit=sync_runs_limit,
        handoff_label=handoff_label,
        operator_note=operator_note,
    )
    if out.workspace_snapshot.subjects_resolved == 0:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "No subjects resolved to the current normalized topology snapshot.",
                "failures": [f.model_dump() for f in out.workspace_snapshot.subject_resolution_failures],
            },
        )
    if response_format == "json":
        return JSONResponse(content=out.model_dump(mode="json"))
    md = maintenance_window_handoff_to_markdown(out)
    return PlainTextResponse(
        content=md,
        media_type="text/markdown; charset=utf-8",
    )
