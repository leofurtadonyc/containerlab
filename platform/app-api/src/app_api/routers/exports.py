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
