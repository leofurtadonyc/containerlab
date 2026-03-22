"""Investigation workspace (bounded context assembly) API."""

from fastapi import APIRouter, Query

from app_api.schemas.investigation_workspace import InvestigationContextAssemblyResponse
from app_api.services.change_intelligence import (
    RECENT_CHANGE_SYNC_RUNS_DEFAULT,
    RECENT_CHANGE_SYNC_RUNS_MAX,
)
from app_api.services.investigation_workspace import (
    build_investigation_context_assembly_response,
)

router = APIRouter(tags=["investigation-workspace"])


@router.get(
    "/investigation-workspace/context",
    response_model=InvestigationContextAssemblyResponse,
)
def get_investigation_context(
    sync_runs_limit: int = Query(
        default=RECENT_CHANGE_SYNC_RUNS_DEFAULT,
        ge=1,
        le=RECENT_CHANGE_SYNC_RUNS_MAX,
        description=(
            "Forwarded to the nested change-intelligence recent-summary assembly "
            "(bounded sync-run window for workflow/audit substrate signals)."
        ),
    ),
) -> InvestigationContextAssemblyResponse:
    """Return a coherent investigation context from existing read-side evidence only."""
    return build_investigation_context_assembly_response(sync_runs_limit=sync_runs_limit)
