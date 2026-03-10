"""Capability API endpoints."""

from fastapi import APIRouter

from app_api.schemas.capabilities import CapabilitiesListResponse
from app_api.services.capabilities import build_capabilities_list_response


router = APIRouter(tags=["capabilities"])


@router.get("/capabilities", response_model=CapabilitiesListResponse)
def list_capabilities() -> CapabilitiesListResponse:
    """Return the Phase 2 bounded capability matrix."""
    return build_capabilities_list_response()
