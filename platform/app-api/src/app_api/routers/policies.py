"""Policy inventory API endpoints."""

from fastapi import APIRouter

from app_api.schemas.policies import PoliciesListResponse
from app_api.services.policies import build_policies_list_response


router = APIRouter(tags=["policies"])


@router.get("/policies", response_model=PoliciesListResponse)
def list_policies() -> PoliciesListResponse:
    """Return the Phase 1 policy inventory scaffold."""
    return build_policies_list_response()
