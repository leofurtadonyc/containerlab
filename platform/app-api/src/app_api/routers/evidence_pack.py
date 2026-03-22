"""Evidence pack (bounded situation-room assembly) API."""

from fastapi import APIRouter, Query

from app_api.schemas.evidence_pack import SituationPackAssemblyResponse
from app_api.services.change_intelligence import (
    RECENT_CHANGE_SYNC_RUNS_DEFAULT,
    RECENT_CHANGE_SYNC_RUNS_MAX,
)
from app_api.services.situation_pack import build_situation_pack_assembly_response

router = APIRouter(tags=["evidence-pack"])


@router.get(
    "/evidence-pack/situation",
    response_model=SituationPackAssemblyResponse,
)
def get_evidence_pack_situation(
    sync_runs_limit: int = Query(
        default=RECENT_CHANGE_SYNC_RUNS_DEFAULT,
        ge=1,
        le=RECENT_CHANGE_SYNC_RUNS_MAX,
        description=(
            "Forwarded to nested investigation assembly (change intelligence window), "
            "and to workflow-history / audit-history persisted sync-run windows for "
            "aligned bounded history context across the pack."
        ),
    ),
) -> SituationPackAssemblyResponse:
    """Return a coherent situation pack from existing read-side evidence only."""
    return build_situation_pack_assembly_response(sync_runs_limit=sync_runs_limit)
