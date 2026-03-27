"""Evidence weakness explanation + next-best pivot v1 (Phase 2 read-only)."""

from fastapi import APIRouter, Query

from app_api.schemas.evidence_weakness_explanation import EvidenceWeaknessExplanationResponse
from app_api.services.change_intelligence import (
    RECENT_CHANGE_SYNC_RUNS_DEFAULT,
    RECENT_CHANGE_SYNC_RUNS_MAX,
)
from app_api.services.evidence_weakness_explanation import build_evidence_weakness_explanation_response

router = APIRouter(tags=["evidence-weakness-explanation"])


@router.get("/evidence-weakness-explanation", response_model=EvidenceWeaknessExplanationResponse)
def get_evidence_weakness_explanation(
    sync_runs_limit: int = Query(
        default=RECENT_CHANGE_SYNC_RUNS_DEFAULT,
        ge=1,
        le=RECENT_CHANGE_SYNC_RUNS_MAX,
        description="Aligned with evidence-quality workspace bounded assembly window.",
    ),
) -> EvidenceWeaknessExplanationResponse:
    """Map bounded evidence-quality findings to explanation categories and read-only navigation pivots."""
    return build_evidence_weakness_explanation_response(sync_runs_limit=sync_runs_limit)
