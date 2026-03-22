"""Policy inventory API endpoints."""

from fastapi import APIRouter, Depends

from app_api.dependencies.read_side_query import read_side_primary_list_limit
from app_api.schemas.policies import PoliciesListResponse
from app_api.services.policies import build_policies_list_response


router = APIRouter(tags=["policies"])


@router.get("/policies", response_model=PoliciesListResponse)
def list_policies(
    limit: int | None = Depends(read_side_primary_list_limit),
) -> PoliciesListResponse:
    """Return the current normalized policy inventory view."""
    return build_policies_list_response(limit=limit)
