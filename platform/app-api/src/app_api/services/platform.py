"""Platform status service helpers."""

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.schemas.platform import PlatformComponentStatus, PlatformStatusResponse


def build_platform_status_response() -> PlatformStatusResponse:
    """Build the Phase 1 platform status scaffold."""
    settings = get_settings()
    return PlatformStatusResponse(
        status="ok",
        service="app-api",
        version=settings.app_version,
        phase="phase_1_skeleton",
        generated_at=datetime.now(UTC),
        topology_name="platform",
        summary=(
            "Phase 1 declared platform service inventory only; live dependency "
            "checks are not implemented yet."
        ),
        components=[
            PlatformComponentStatus(
                name="app-api",
                role="backend-api",
                lifecycle_state="declared",
                observation_state="not_checked",
            ),
            PlatformComponentStatus(
                name="app-web",
                role="operator-webui",
                lifecycle_state="declared",
                observation_state="not_checked",
            ),
            PlatformComponentStatus(
                name="gnmi-collector",
                role="observed-state-collector",
                lifecycle_state="declared",
                observation_state="not_checked",
            ),
            PlatformComponentStatus(
                name="postgres",
                role="durable-application-store",
                lifecycle_state="declared",
                observation_state="not_checked",
            ),
            PlatformComponentStatus(
                name="prometheus",
                role="metrics-store",
                lifecycle_state="declared",
                observation_state="not_checked",
            ),
            PlatformComponentStatus(
                name="grafana",
                role="observability-dashboards",
                lifecycle_state="declared",
                observation_state="not_checked",
            ),
            PlatformComponentStatus(
                name="odl",
                role="bounded-controller-helper",
                lifecycle_state="declared",
                observation_state="not_checked",
            ),
        ],
    )
