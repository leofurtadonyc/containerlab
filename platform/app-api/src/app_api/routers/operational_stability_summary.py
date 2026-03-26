"""Operational stability summary (Phase 2 read-only assembly)."""

from fastapi import APIRouter, Query

from app_api.schemas.operational_stability_summary import OperationalStabilitySummaryResponse
from app_api.services.change_intelligence import (
    RECENT_CHANGE_SYNC_RUNS_DEFAULT,
    RECENT_CHANGE_SYNC_RUNS_MAX,
)
from app_api.services.operational_stability_summary import build_operational_stability_summary_response

router = APIRouter(prefix="/stability", tags=["stability"])


@router.get("/summary", response_model=OperationalStabilitySummaryResponse)
def get_operational_stability_summary(
    sync_runs_limit: int = Query(
        default=RECENT_CHANGE_SYNC_RUNS_DEFAULT,
        ge=1,
        le=RECENT_CHANGE_SYNC_RUNS_MAX,
        description="Aligns embedded change-intelligence window with other bounded summaries.",
    ),
) -> OperationalStabilitySummaryResponse:
    """Return a bounded operational stability summary from existing read APIs only."""
    return build_operational_stability_summary_response(sync_runs_limit=sync_runs_limit)
