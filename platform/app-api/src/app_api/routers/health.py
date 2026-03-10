"""Health endpoints for the backend skeleton."""

from fastapi import APIRouter

from app_api.schemas.health import HealthResponse
from app_api.services.health import build_health_response


router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Return a minimal typed health response for Phase 2."""
    return build_health_response()
