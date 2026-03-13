"""Platform read-only API endpoints."""

from fastapi import APIRouter

from app_api.schemas.platform import PlatformStatusResponse
from app_api.services.platform import build_platform_status_response


router = APIRouter(tags=["platform"])


@router.get("/platform/status", response_model=PlatformStatusResponse)
def get_platform_status() -> PlatformStatusResponse:
    """Return the Phase 2 platform status response."""
    return build_platform_status_response()
