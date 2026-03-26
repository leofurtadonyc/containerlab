"""Maintenance Evidence Workspace v1 composed API.

Read-only GET assembly; see ``services/maintenance_evidence_workspace.py`` and
``platform/docs/maintenance-evidence-workspace-contract.md``.
Not ``evidence_export_v1``; export/replay boundaries are documented in the contract.
"""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException, Query

from app_api.routers.maintenance_preview import resolve_maintenance_subject_params
from app_api.schemas.maintenance_preview import MaintenancePreviewContext
from app_api.schemas.maintenance_evidence_workspace import MaintenanceEvidenceWorkspaceResponse
from app_api.services.maintenance_evidence_workspace import build_maintenance_evidence_workspace_response
from app_api.services.topology_related_policies import build_topology_object_related_policies_response

router = APIRouter(tags=["maintenance-evidence-workspace"])


@router.get("/maintenance-evidence-workspace", response_model=MaintenanceEvidenceWorkspaceResponse)
def get_maintenance_evidence_workspace(
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
) -> MaintenanceEvidenceWorkspaceResponse:
    """Read-only composed maintenance evidence workspace (preview + dossier + timeline + delta + change safety case)."""
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

    return build_maintenance_evidence_workspace_response(related=related, preview_context=preview_context)
