"""Bounded collector inventory integration models and live snapshot client."""

import json
from dataclasses import dataclass
from typing import Literal
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

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
    normalization_status: Literal["normalized_live", "partial", "failed"]
    source: Literal["gnmi"]
    source_target: str
    notes: list[str]


class CollectorInventorySnapshot(BaseModel):
    """Stable intermediate boundary for collector-backed inventory reads."""

    integration: Literal["gnmi_collector_inventory"]
    status: Literal["live_normalized_feed", "partial_live_feed", "collector_unavailable"]
    destination_service: Literal["app-api"]
    source_endpoint: str
    records: list[CollectorInventoryRecord]
    fetch_error: str | None = None


@dataclass(frozen=True)
class CollectorInventoryClient:
    """HTTP client for the normalized collector inventory boundary."""

    source_endpoint: str

    def read_inventory_snapshot(self) -> CollectorInventorySnapshot:
        """Read the live normalized inventory snapshot from the collector."""
        snapshot_url = f"{self.source_endpoint.rstrip('/')}/inventory/snapshot"
        try:
            with urlopen(snapshot_url, timeout=5) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
            return CollectorInventorySnapshot(
                integration="gnmi_collector_inventory",
                status="collector_unavailable",
                destination_service="app-api",
                source_endpoint=snapshot_url,
                records=[],
                fetch_error=str(exc),
            )

        status_map = {
            "live_ready": "live_normalized_feed",
            "partial": "partial_live_feed",
            "failed": "collector_unavailable",
        }
        records = [
            CollectorInventoryRecord.model_validate(record)
            for record in payload.get("records", [])
        ]
        return CollectorInventorySnapshot(
            integration="gnmi_collector_inventory",
            status=status_map.get(payload.get("delivery_status"), "collector_unavailable"),
            destination_service="app-api",
            source_endpoint=snapshot_url,
            records=records,
            fetch_error=None,
        )


def get_collector_inventory_client() -> CollectorInventoryClient:
    """Return the current collector inventory boundary client."""
    settings = get_settings()
    return CollectorInventoryClient(
        source_endpoint=settings.gnmi_collector_url,
    )
