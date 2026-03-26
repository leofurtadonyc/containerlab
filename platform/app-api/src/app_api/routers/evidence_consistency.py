"""Cross-domain evidence consistency summary (Phase 2 read-only assembly)."""

from fastapi import APIRouter, Query

from app_api.schemas.evidence_consistency_summary import EvidenceConsistencySummaryResponse
from app_api.services.change_intelligence import (
    RECENT_CHANGE_SYNC_RUNS_DEFAULT,
    RECENT_CHANGE_SYNC_RUNS_MAX,
)
from app_api.services.evidence_consistency_summary import build_evidence_consistency_summary_response

router = APIRouter(prefix="/evidence-consistency", tags=["evidence-consistency"])


@router.get("/summary", response_model=EvidenceConsistencySummaryResponse)
def get_evidence_consistency_summary(
    sync_runs_limit: int = Query(
        default=RECENT_CHANGE_SYNC_RUNS_DEFAULT,
        ge=1,
        le=RECENT_CHANGE_SYNC_RUNS_MAX,
        description=(
            "Aligns embedded change-intelligence consideration window with Overview / delta-digest limits "
            "(bounded)."
        ),
    ),
) -> EvidenceConsistencySummaryResponse:
    """Return a bounded cross-domain evidence consistency summary from existing read APIs only."""
    return build_evidence_consistency_summary_response(sync_runs_limit=sync_runs_limit)
