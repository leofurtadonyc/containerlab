"""Capability service helpers."""

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.schemas.capabilities import CapabilityRecord, CapabilitiesListResponse


def build_capabilities_list_response() -> CapabilitiesListResponse:
    """Build the bounded capability placeholder response for the current phase."""
    settings = get_settings()
    items = [
        CapabilityRecord(
            vendor="nokia",
            platform="sros",
            version_scope=None,
            feature="device_inventory",
            support_status="unknown",
            implementation_status="placeholder",
            caveats=[
                "Capability determination is not connected to live collector inputs yet."
            ],
            source_of_determination="platform_placeholder",
        ),
        CapabilityRecord(
            vendor="nokia",
            platform="sros",
            version_scope=None,
            feature="topology_observation",
            support_status="unknown",
            implementation_status="placeholder",
            caveats=[
                "Topology support is represented as a platform contract only in the current bounded read-only phase."
            ],
            source_of_determination="platform_placeholder",
        ),
    ]
    return CapabilitiesListResponse(
        service="app-api",
        version=settings.app_version,
        phase="phase_2_read_only_foundation",
        generated_at=datetime.now(UTC),
        data_status="placeholder",
        summary=(
            "Phase 2 placeholder capability matrix. Unsupported, unknown, and partial "
            "states remain explicit until real platform evidence exists."
        ),
        count=len(items),
        items=items,
    )
