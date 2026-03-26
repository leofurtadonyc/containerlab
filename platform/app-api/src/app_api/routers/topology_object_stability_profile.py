"""Topology object stability profile API (Phase 2, read-only)."""

from fastapi import APIRouter, HTTPException

from app_api.schemas.topology_object_stability_profile import TopologyObjectStabilityProfileResponse
from app_api.services.topology_object_stability_profile import (
    build_topology_object_stability_profile_response,
)

router = APIRouter(tags=["topology"])


@router.get("/topology/objects/{object_id}/stability-profile", response_model=TopologyObjectStabilityProfileResponse)
def get_topology_object_stability_profile(object_id: str) -> TopologyObjectStabilityProfileResponse:
    """Return bounded stability interpretation for one topology node or link (read-only assembly).

    Unknown ``object_id`` values return **404** (same identity rules as related-policies and dossier).
    """
    response = build_topology_object_stability_profile_response(object_id)
    if response is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Topology object not found: {object_id!r} is not a known node_id or link_id "
                "in the current normalized topology snapshot."
            ),
        )
    return response
