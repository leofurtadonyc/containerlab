"""Bounded ODL integration placeholder for the backend."""

from dataclasses import dataclass


@dataclass(frozen=True)
class OdlClientConfig:
    """Minimal configuration for the ODL integration boundary."""

    base_url: str


@dataclass(frozen=True)
class OdlClientPlaceholder:
    """Placeholder client showing where ODL integration belongs."""

    config: OdlClientConfig

    def describe_boundary(self) -> dict[str, str]:
        """Describe the intended bounded role of ODL in the platform."""
        return {
            "integration": "odl",
            "role": "bounded_controller_helper",
            "ownership": "app-api remains the product brain",
            "status": "phase_1_placeholder",
        }
