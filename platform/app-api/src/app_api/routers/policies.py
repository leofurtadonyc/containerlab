"""Policy inventory API endpoints."""

from fastapi import APIRouter, Depends, HTTPException

from app_api.dependencies.read_side_query import (
    read_side_history_recent_limit,
    read_side_primary_list_limit,
)
from app_api.schemas.path_analysis import PathAnalysisViewResponse
from app_api.schemas.policy_topology_impact import PolicyTopologyImpactResponse
from app_api.schemas.policies import PoliciesListResponse
from app_api.services.path_analysis import build_policy_path_analysis_response
from app_api.services.policy_topology_impact import build_policy_topology_impact_response
from app_api.services.policies import build_policies_list_response


router = APIRouter(tags=["policies"])


@router.get("/policies", response_model=PoliciesListResponse)
def list_policies(
    limit: int | None = Depends(read_side_primary_list_limit),
    history_recent_limit: int | None = Depends(read_side_history_recent_limit),
) -> PoliciesListResponse:
    """Return the current normalized policy inventory view."""
    return build_policies_list_response(
        limit=limit,
        history_recent_limit=history_recent_limit,
    )


@router.get(
    "/policies/{policy_id}/path-analysis",
    response_model=PathAnalysisViewResponse,
)
def get_policy_path_analysis(policy_id: str) -> PathAnalysisViewResponse:
    """Bounded read-only path interpretation for one normalized policy record."""
    body = build_policy_path_analysis_response(policy_id)
    if body is None:
        raise HTTPException(
            status_code=404,
            detail="No normalized policy record exists for the requested policy_id.",
        )
    return body


@router.get(
    "/policies/{policy_id}/topology-impact",
    response_model=PolicyTopologyImpactResponse,
)
def get_policy_topology_impact(policy_id: str) -> PolicyTopologyImpactResponse:
    """Bounded topology objects that string-align with this policy (naming pivot, not blast radius)."""
    body = build_policy_topology_impact_response(policy_id)
    if body is None:
        raise HTTPException(
            status_code=404,
            detail="No normalized policy record exists for the requested policy_id.",
        )
    return body
