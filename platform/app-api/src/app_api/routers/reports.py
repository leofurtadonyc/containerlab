"""Impact Report v1 API — bounded composition of existing Phase 2 read assemblies."""

from __future__ import annotations

from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse, PlainTextResponse

from app_api.routers.maintenance_preview import resolve_maintenance_subject_params
from app_api.schemas.maintenance_preview import MaintenancePreviewContext
from app_api.services.impact_report import (
    build_maintenance_impact_report_from_related,
    build_policy_impact_report,
    build_service_impact_report,
    impact_report_response_to_markdown,
)
from app_api.services.topology_related_policies import build_topology_object_related_policies_response

router = APIRouter(tags=["impact-reports"])

ReportFormat = Literal["json", "markdown"]


@router.get(
    "/reports/service-impact",
    response_model=None,
    responses={
        200: {"content": {"application/json": {}, "text/markdown": {}}},
        404: {"description": "Unknown or unsupported service_id."},
    },
)
def get_service_impact_report(
    service_id: Annotated[str, Query(..., description="Service Explorer service_id (e.g. color:100, policy:…).")],
    response_format: Annotated[
        ReportFormat,
        Query(
            alias="format",
            description="json (canonical) or markdown (human-readable companion).",
        ),
    ] = "json",
) -> JSONResponse | PlainTextResponse:
    """Return Impact Report v1 for a service-centric anchor (nested Service Explorer detail)."""
    body = build_service_impact_report(service_id)
    if body is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "No service matches the requested service_id for the current policy inventory, "
                "or the service_id form is not supported."
            ),
        )
    if response_format == "json":
        return JSONResponse(content=body.model_dump(mode="json"))
    return PlainTextResponse(
        content=impact_report_response_to_markdown(body),
        media_type="text/markdown; charset=utf-8",
    )


@router.get(
    "/reports/policy-impact",
    response_model=None,
    responses={
        200: {"content": {"application/json": {}, "text/markdown": {}}},
        404: {"description": "Policy not in inventory (no dossier)."},
    },
)
def get_policy_impact_report(
    policy_id: Annotated[str, Query(..., description="Normalized policy_id from inventory.")],
    response_format: Annotated[
        ReportFormat,
        Query(
            alias="format",
            description="json (canonical) or markdown (human-readable companion).",
        ),
    ] = "json",
) -> JSONResponse | PlainTextResponse:
    """Return Impact Report v1 for a policy-centric anchor (nested policy dossier)."""
    body = build_policy_impact_report(policy_id)
    if body is None:
        raise HTTPException(status_code=404, detail="Policy dossier not found for this policy_id.")
    if response_format == "json":
        return JSONResponse(content=body.model_dump(mode="json"))
    return PlainTextResponse(
        content=impact_report_response_to_markdown(body),
        media_type="text/markdown; charset=utf-8",
    )


@router.get(
    "/reports/maintenance-impact",
    response_model=None,
    responses={
        200: {"content": {"application/json": {}, "text/markdown": {}}},
        404: {"description": "Topology object not on snapshot."},
        422: {"description": "Missing/conflicting selectors or object_kind mismatch."},
    },
)
def get_maintenance_impact_report(
    node_id: str | None = Query(default=None, description="Shortcut: subject is this topology node_id."),
    link_id: str | None = Query(default=None, description="Shortcut: subject is this topology link_id."),
    object_id: str | None = Query(
        default=None,
        description="Topology object id (with object_kind); same identity rules as maintenance-preview.",
    ),
    object_kind: Literal["node", "link"] | None = Query(
        default=None,
        description="``node`` or ``link`` — pair with object_id unless using node_id/link_id shortcuts.",
    ),
    preview_context: MaintenancePreviewContext = Query(
        default="explicit_subject",
        description="Operator framing cue only; same semantics as GET /api/v1/maintenance-preview.",
    ),
    response_format: Annotated[
        ReportFormat,
        Query(
            alias="format",
            description="json (canonical) or markdown (human-readable companion).",
        ),
    ] = "json",
) -> JSONResponse | PlainTextResponse:
    """Return Impact Report v1 for a maintenance subject (nested Maintenance Preview v1)."""
    oid, kind = resolve_maintenance_subject_params(
        node_id=node_id,
        link_id=link_id,
        object_id=object_id,
        object_kind=object_kind,
    )
    related = build_topology_object_related_policies_response(oid)
    if related is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Topology object not found: {oid!r} is not a known node_id or link_id "
                "in the current normalized topology snapshot."
            ),
        )
    if related.object_kind != kind:
        raise HTTPException(
            status_code=422,
            detail=(
                f"object_kind={kind!r} does not match topology identity for object_id={oid!r} "
                f"(expected object_kind={related.object_kind!r})."
            ),
        )
    body = build_maintenance_impact_report_from_related(related=related, preview_context=preview_context)
    if response_format == "json":
        return JSONResponse(content=body.model_dump(mode="json"))
    return PlainTextResponse(
        content=impact_report_response_to_markdown(body),
        media_type="text/markdown; charset=utf-8",
    )
