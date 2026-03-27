"""Evidence quality workspace v1 — collection assurance summary (Phase 2 read-only)."""

from fastapi import APIRouter, Query

from app_api.schemas.evidence_quality_workspace import EvidenceQualitySummaryResponse
from app_api.services.change_intelligence import (
    RECENT_CHANGE_SYNC_RUNS_DEFAULT,
    RECENT_CHANGE_SYNC_RUNS_MAX,
)
from app_api.services.evidence_quality_workspace import build_evidence_quality_workspace_response

router = APIRouter(tags=["evidence-quality-workspace"])


@router.get("/evidence-quality-workspace", response_model=EvidenceQualitySummaryResponse)
def get_evidence_quality_workspace(
    sync_runs_limit: int = Query(
        default=RECENT_CHANGE_SYNC_RUNS_DEFAULT,
        ge=1,
        le=RECENT_CHANGE_SYNC_RUNS_MAX,
        description="Bounded window aligned with other summaries; reserved for future embedded assemblies.",
    ),
) -> EvidenceQualitySummaryResponse:
    """Return a bounded evidence quality / collection assurance summary from existing read APIs only."""
    return build_evidence_quality_workspace_response(sync_runs_limit=sync_runs_limit)
