"""Platform status service helpers."""

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.integrations.odl import OdlControllerObservation, get_odl_client
from app_api.schemas.platform import PlatformComponentStatus, PlatformStatusResponse


def _build_declared_component(name: str, role: str) -> PlatformComponentStatus:
    """Return a declared component without a live observation yet."""
    return PlatformComponentStatus(
        name=name,
        role=role,
        lifecycle_state="declared",
        observation_state="not_checked",
    )


def _read_odl_observation() -> OdlControllerObservation:
    """Read one bounded ODL controller observation."""
    try:
        return get_odl_client().read_controller_observation()
    except Exception:
        return OdlControllerObservation(
            observation_state="unknown",
            observed_source="odl_restconf_capability_probe",
            observation_summary=(
                "The backend could not complete the bounded ODL capability "
                "probe cleanly."
            ),
            observed_capabilities=[],
            notes=[
                "ODL remains an optional helper only on this path.",
                "The backend still owns platform status and does not delegate product truth to the controller.",
            ],
        )


def _build_odl_component_status() -> PlatformComponentStatus:
    """Map the bounded ODL observation into product-facing platform status."""
    observation = _read_odl_observation()
    return PlatformComponentStatus(
        name="odl",
        role="bounded-controller-helper",
        lifecycle_state="declared",
        observation_state=observation.observation_state,
        observation_source=observation.observed_source,
        observation_summary=observation.observation_summary,
        observed_capabilities=observation.observed_capabilities,
        notes=observation.notes,
    )


def build_platform_status_response() -> PlatformStatusResponse:
    """Build the bounded platform status response for the current phase."""
    settings = get_settings()
    return PlatformStatusResponse(
        status="ok",
        service="app-api",
        version=settings.app_version,
        phase="phase_2_read_only_foundation",
        generated_at=datetime.now(UTC),
        topology_name="platform",
        summary=(
            "Phase 2 declared platform service inventory with one bounded ODL "
            "RESTCONF capability probe; other dependency checks remain "
            "intentionally narrow."
        ),
        components=[
            _build_declared_component("app-api", "backend-api"),
            _build_declared_component("app-web", "operator-webui"),
            _build_declared_component("gnmi-collector", "observed-state-collector"),
            _build_declared_component("postgres", "durable-application-store"),
            _build_declared_component("prometheus", "metrics-store"),
            _build_declared_component("grafana", "observability-dashboards"),
            _build_odl_component_status(),
        ],
    )
