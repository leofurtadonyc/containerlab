"""Change intelligence (bounded recent-change summary) API."""

from fastapi import APIRouter, Query

from app_api.schemas.change_intelligence import RecentChangeSummaryResponse
from app_api.services.change_intelligence import (
    RECENT_CHANGE_SYNC_RUNS_DEFAULT,
    RECENT_CHANGE_SYNC_RUNS_MAX,
    build_recent_change_summary_response,
)

router = APIRouter(tags=["change-intelligence"])


@router.get("/change-intelligence/recent-summary", response_model=RecentChangeSummaryResponse)
def get_recent_change_summary(
    sync_runs_limit: int = Query(
        default=RECENT_CHANGE_SYNC_RUNS_DEFAULT,
        ge=1,
        le=RECENT_CHANGE_SYNC_RUNS_MAX,
        description=(
            "How many recent persisted sync runs to load for workflow-history and audit-history "
            "substrate signals (bounded; does not change snapshot table metrics)."
        ),
    ),
) -> RecentChangeSummaryResponse:
    """Return a backend-owned cross-domain recent-change summary from existing evidence."""
    return build_recent_change_summary_response(sync_runs_limit=sync_runs_limit)
