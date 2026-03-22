"""Topology API endpoints."""

from fastapi import APIRouter, HTTPException

from app_api.schemas.topology import TopologyResponse
from app_api.schemas.topology_related_policies import TopologyObjectRelatedPoliciesResponse
from app_api.services.topology import build_topology_response
from app_api.services.topology_related_policies import build_topology_object_related_policies_response


router = APIRouter(tags=["topology"])


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


@router.get("/topology", response_model=TopologyResponse)
def get_topology() -> TopologyResponse:
    """Return the current normalized topology view."""
    return build_topology_response()
