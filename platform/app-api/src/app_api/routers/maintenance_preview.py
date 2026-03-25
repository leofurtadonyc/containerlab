"""Maintenance Preview v1 API (bounded read-side assembly)."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException, Query

from app_api.schemas.maintenance_preview import (
    MaintenancePreviewContext,
    MaintenancePreviewResponse,
)
from app_api.services.maintenance_preview import build_maintenance_preview_response
from app_api.services.topology_related_policies import build_topology_object_related_policies_response

router = APIRouter(tags=["maintenance-preview"])


def _resolve_subject_params(
    *,
    node_id: str | None,
    link_id: str | None,
    object_id: str | None,
    object_kind: Literal["node", "link"] | None,
) -> tuple[str, Literal["node", "link"]]:
    """Return ``(object_id, object_kind)`` or raise HTTP 422."""
    if node_id is not None and (link_id is not None or object_id is not None or object_kind is not None):
        raise HTTPException(
            status_code=422,
            detail="Specify only one subject selector: node_id, link_id, or object_id with object_kind.",
        )
    if link_id is not None and (object_id is not None or object_kind is not None):
        raise HTTPException(
            status_code=422,
            detail="Specify only one subject selector: node_id, link_id, or object_id with object_kind.",
        )
    if (object_id is None) != (object_kind is None):
        raise HTTPException(
            status_code=422,
            detail="object_id and object_kind must be provided together.",
        )

    if node_id is not None:
        return node_id, "node"
    if link_id is not None:
        return link_id, "link"
    if object_id is not None and object_kind is not None:
        return object_id, object_kind

    raise HTTPException(
        status_code=422,
        detail=(
            "Missing maintenance subject: provide node_id, link_id, or both object_id and object_kind."
        ),
    )


@router.get("/maintenance-preview", response_model=MaintenancePreviewResponse)
def get_maintenance_preview(
    node_id: str | None = Query(
        default=None,
        description="Shortcut: maintenance subject is this topology node_id.",
    ),
    link_id: str | None = Query(
        default=None,
        description="Shortcut: maintenance subject is this topology link_id.",
    ),
    object_id: str | None = Query(
        default=None,
        description="Topology object id (with object_kind); same identity rules as related-policies.",
    ),
    object_kind: Literal["node", "link"] | None = Query(
        default=None,
        description="``node`` or ``link`` — must pair with object_id unless using node_id/link_id shortcuts.",
    ),
    preview_context: MaintenancePreviewContext = Query(
        default="explicit_subject",
        description=(
            "Operator framing cue only; does not change assembly math (may affect ordering hints later)."
        ),
    ),
) -> MaintenancePreviewResponse:
    """Return Maintenance Preview v1: reuse-only assembly over existing Phase 2 read contracts."""
    oid, kind = _resolve_subject_params(
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

    return build_maintenance_preview_response(related=related, preview_context=preview_context)
