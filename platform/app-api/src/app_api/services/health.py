"""Health service helpers."""
from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.schemas.health import HealthResponse


def build_health_response() -> HealthResponse:
    """Build the minimal health payload exposed by the API."""
    settings = get_settings()
    return HealthResponse(
        status="ok",
        service="app-api",
        version=settings.app_version,
        phase="phase_1_skeleton",
        generated_at=datetime.now(UTC),
    )
