"""Topology API endpoints."""

from fastapi import APIRouter, HTTPException

from app_api.schemas.failure_impact import FailureImpactViewResponse
from app_api.schemas.topology import TopologyResponse
from app_api.schemas.topology_related_policies import TopologyObjectRelatedPoliciesResponse
from app_api.schemas.topology_risk_summary import TopologyRiskSummaryResponse
from app_api.services.failure_impact import build_failure_impact_view_response
from app_api.services.topology import build_topology_response
from app_api.services.topology_related_policies import build_topology_object_related_policies_response
from app_api.services.topology_risk_summary import build_topology_risk_summary_response


router = APIRouter(tags=["topology"])


@router.get("/topology/risk-summary", response_model=TopologyRiskSummaryResponse)
def get_topology_risk_summary() -> TopologyRiskSummaryResponse:
    """Return bounded topology risk summary v1: ranked nodes and links by related-policy degraded counts.

    Read-only evidence assembly; not SLA/traffic risk, blast radius, or global policy health.
    """
    return build_topology_risk_summary_response()


@router.get("/topology/objects/{object_id}/related-policies", response_model=TopologyObjectRelatedPoliciesResponse)
def get_topology_object_related_policies(object_id: str) -> TopologyObjectRelatedPoliciesResponse:
    """Return policies whose normalized string fields match a topology node or link endpoint identifiers.

    ``object_id`` must be a ``node_id`` present in the current topology snapshot or a ``link_id``
    present in that snapshot. Unknown ids return **404** (not an empty list).
    """
    response = build_topology_object_related_policies_response(object_id)
    if response is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Topology object not found: {object_id!r} is not a known node_id or link_id "
                "in the current normalized topology snapshot."
            ),
        )
    return response


@router.get("/topology/objects/{object_id}/failure-impact", response_model=FailureImpactViewResponse)
def get_topology_object_failure_impact(object_id: str) -> FailureImpactViewResponse:
    """Return bounded failure-impact v1 rollups for a topology node or link (read-only evidence assembly).

    Unknown ``object_id`` values return **404** (same identity rules as related-policies).
    """
    response = build_failure_impact_view_response(object_id)
    if response is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Topology object not found: {object_id!r} is not a known node_id or link_id "
                "in the current normalized topology snapshot."
            ),
        )
    return response


@router.get("/topology", response_model=TopologyResponse)
def get_topology() -> TopologyResponse:
    """Return the current normalized topology view."""
    return build_topology_response()
