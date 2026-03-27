"""Maintenance Window Workspace v1 API — bounded multi-subject read assembly."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app_api.schemas.maintenance_preview import MaintenancePreviewContext
from app_api.schemas.maintenance_window_workspace import (
    MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS,
    MaintenanceWindowWorkspaceResponse,
)
from app_api.services.change_intelligence import RECENT_CHANGE_SYNC_RUNS_DEFAULT, RECENT_CHANGE_SYNC_RUNS_MAX
from app_api.services.maintenance_window_workspace import (
    build_maintenance_window_workspace_response,
    dedupe_subjects,
    parse_subject_tokens,
)

router = APIRouter(tags=["maintenance-window-workspace"])


@router.get("/maintenance-window-workspace", response_model=MaintenanceWindowWorkspaceResponse)
def get_maintenance_window_workspace(
    subject: list[str] = Query(
        default=[],
        description=(
            "Repeated query parameter: each value is `node:{node_id}` or `link:{link_id}` "
            f"(distinct subjects capped at {MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS})."
        ),
    ),
    preview_context: MaintenancePreviewContext = Query(
        default="planning_window",
        description="Operator framing cue; same semantics as GET /api/v1/maintenance-preview.",
    ),
    sync_runs_limit: int = Query(
        default=RECENT_CHANGE_SYNC_RUNS_DEFAULT,
        ge=1,
        le=RECENT_CHANGE_SYNC_RUNS_MAX,
        description="Bounded window for embedded stability and evidence-consistency assemblies.",
    ),
) -> MaintenanceWindowWorkspaceResponse:
    """Multi-subject maintenance-window planning workspace (deduped rollups; read-only)."""
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

    response = build_maintenance_window_workspace_response(
        subject_pairs=distinct,
        preview_context=preview_context,
        sync_runs_limit=sync_runs_limit,
    )
    if response.subjects_resolved == 0:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "No subjects resolved to the current normalized topology snapshot.",
                "failures": [f.model_dump() for f in response.subject_resolution_failures],
            },
        )
    return response
