"""Device inventory API endpoints."""

from fastapi import APIRouter

from app_api.schemas.devices import DevicesListResponse
from app_api.services.devices import build_devices_list_response


router = APIRouter(tags=["devices"])


@router.get("/devices", response_model=DevicesListResponse)
def list_devices() -> DevicesListResponse:
    """Return the Phase 1 device inventory scaffold."""
    return build_devices_list_response()
