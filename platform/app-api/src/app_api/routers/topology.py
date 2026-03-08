"""Topology API endpoints."""

from fastapi import APIRouter

from app_api.schemas.topology import TopologyResponse
from app_api.services.topology import build_topology_response


router = APIRouter(tags=["topology"])


@router.get("/topology", response_model=TopologyResponse)
def get_topology() -> TopologyResponse:
    """Return the Phase 1 topology scaffold."""
    return build_topology_response()
