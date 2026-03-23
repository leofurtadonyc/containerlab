"""Cross-domain delta digest (Phase 2 read-only assembly)."""

from fastapi import APIRouter, Query

from app_api.schemas.delta_digest import CrossDomainDeltaDigestResponse
from app_api.services.change_intelligence import (
    RECENT_CHANGE_SYNC_RUNS_DEFAULT,
    RECENT_CHANGE_SYNC_RUNS_MAX,
)
from app_api.services.delta_digest import build_cross_domain_delta_digest_response

router = APIRouter(tags=["delta-digest"])


@router.get("/delta-digest", response_model=CrossDomainDeltaDigestResponse)
def get_cross_domain_delta_digest(
    sync_runs_limit: int = Query(
        default=RECENT_CHANGE_SYNC_RUNS_DEFAULT,
        ge=1,
        le=RECENT_CHANGE_SYNC_RUNS_MAX,
        description=(
            "Aligns embedded change-intelligence recent summary window with investigation / "
            "Overview recent-change limits (bounded)."
        ),
    ),
) -> CrossDomainDeltaDigestResponse:
    """Return a bounded cross-domain delta digest composed from existing read APIs only."""
    return build_cross_domain_delta_digest_response(sync_runs_limit=sync_runs_limit)
