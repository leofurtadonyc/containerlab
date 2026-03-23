"""Operator briefing workspace (Phase 2 read-only assembly)."""

from typing import Literal

from fastapi import APIRouter, Query

from app_api.schemas.operator_briefing import OperatorBriefingWorkspaceResponse
from app_api.services.change_intelligence import (
    RECENT_CHANGE_SYNC_RUNS_DEFAULT,
    RECENT_CHANGE_SYNC_RUNS_MAX,
)
from app_api.services.operator_briefing import build_operator_briefing_workspace_response

router = APIRouter(tags=["operator-briefing"])


@router.get("/operator-briefing", response_model=OperatorBriefingWorkspaceResponse)
def get_operator_briefing(
    sync_runs_limit: int = Query(
        default=RECENT_CHANGE_SYNC_RUNS_DEFAULT,
        ge=1,
        le=RECENT_CHANGE_SYNC_RUNS_MAX,
        description=(
            "Bounded window aligned with delta digest, situation pack, and investigation nested assemblies."
        ),
    ),
    policy_id: str | None = Query(
        default=None,
        description="Optional policy scope for embedded policy dossier preview (normalized inventory).",
    ),
    topology_object: str | None = Query(
        default=None,
        description="Optional topology object id for embedded topology object dossier preview.",
    ),
    topology_object_kind: Literal["node", "link"] | None = Query(
        default=None,
        description="Optional client echo of object kind; compared to dossier identity when dossier loads.",
    ),
    inv_from: str | None = Query(
        default=None,
        description="Client-only breadcrumb echo (shell); not validated as authority by app-api.",
    ),
    global_search_q: str | None = Query(
        default=None,
        description="Optional client echo of operator search query string for handoff context.",
    ),
) -> OperatorBriefingWorkspaceResponse:
    """Compose a bounded operator briefing from existing Phase 2 read assemblies only."""
    return build_operator_briefing_workspace_response(
        sync_runs_limit=sync_runs_limit,
        policy_id=policy_id,
        topology_object=topology_object,
        topology_object_kind=topology_object_kind,
        inv_from_client_hint=inv_from,
        global_search_q_client_hint=global_search_q,
    )
