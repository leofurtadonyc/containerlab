"""Bounded collector inventory integration models and placeholder client."""

from dataclasses import dataclass
from typing import Literal

from pydantic import BaseModel

from app_api.config.settings import get_settings


class CollectorInventoryRecord(BaseModel):
    """Normalized inventory record accepted from the collector boundary."""

    device_id: str
    vendor: str
    platform: str
    software_version: str | None = None
    role: str | None = None
    management_address: str
    collector_status: Literal["ok", "degraded", "unreachable", "unknown"]
    capability_summary: Literal[
        "supported",
        "partially_supported",
        "unsupported",
        "unknown",
        "not_implemented_in_platform",
    ]
    normalization_status: Literal["normalized_placeholder", "partial", "failed"]
    source: Literal["gnmi"]
    source_target: str
    notes: list[str]


class CollectorInventorySnapshot(BaseModel):
    """Stable intermediate boundary for collector-backed inventory reads."""

    integration: Literal["gnmi_collector_inventory"]
    status: Literal["placeholder_normalized_feed"]
    destination_service: Literal["app-api"]
    source_endpoint: str
    records: list[CollectorInventoryRecord]


@dataclass(frozen=True)
class CollectorInventoryClientPlaceholder:
    """Placeholder client for the normalized collector inventory boundary."""

    source_endpoint: str

    def read_inventory_snapshot(self) -> CollectorInventorySnapshot:
        """Return a stable normalized inventory snapshot for Phase 1."""
        return CollectorInventorySnapshot(
            integration="gnmi_collector_inventory",
            status="placeholder_normalized_feed",
            destination_service="app-api",
            source_endpoint=self.source_endpoint,
            records=[
                CollectorInventoryRecord(
                    device_id="example-nokia-router",
                    vendor="nokia",
                    platform="sros",
                    software_version="unknown",
                    role="unknown",
                    management_address="192.0.2.10",
                    collector_status="ok",
                    capability_summary="not_implemented_in_platform",
                    normalization_status="normalized_placeholder",
                    source="gnmi",
                    source_target="example-nokia-router",
                    notes=[
                        "Loaded through the bounded collector integration placeholder.",
                        "Represents normalized collector-shaped inventory rather than a raw vendor payload.",
                    ],
                )
            ],
        )


def get_collector_inventory_client() -> CollectorInventoryClientPlaceholder:
    """Return the current collector inventory boundary client."""
    settings = get_settings()
    return CollectorInventoryClientPlaceholder(
        source_endpoint=settings.gnmi_collector_url,
    )
