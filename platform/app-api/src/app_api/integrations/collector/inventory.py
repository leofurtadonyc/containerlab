"""Bounded collector inventory integration models and live snapshot client."""

import json
from dataclasses import dataclass
from typing import Literal
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

from pydantic import BaseModel

from app_api.config.settings import get_settings
from app_api.integrations.collector.cache import SnapshotCache


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
    configured_target_count: int
    observed_target_count: int
    collection_success_count: int
    collection_partial_count: int
    collection_failure_count: int
    oldest_observed_at: str | None = None
    newest_observed_at: str | None = None
    degraded_scope_summary: str
    records: list[CollectorInventoryRecord]
    notes: list[str]
    fetch_error: str | None = None


@dataclass(frozen=True)
class CollectorInventoryClient:
    """HTTP client for the normalized collector inventory boundary."""

    source_endpoint: str
    timeout_seconds: int
    cache_ttl_seconds: int
    unavailable_cache_ttl_seconds: int

    def _load_inventory_snapshot(self) -> CollectorInventorySnapshot:
        """Load the live normalized inventory snapshot from the collector."""
        snapshot_url = f"{self.source_endpoint.rstrip('/')}/inventory/snapshot"
        try:
            with urlopen(snapshot_url, timeout=self.timeout_seconds) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
            return CollectorInventorySnapshot(
                integration="gnmi_collector_inventory",
                status="collector_unavailable",
                destination_service="app-api",
                source_endpoint=snapshot_url,
                configured_target_count=0,
                observed_target_count=0,
                collection_success_count=0,
                collection_partial_count=0,
                collection_failure_count=0,
                oldest_observed_at=None,
                newest_observed_at=None,
                degraded_scope_summary=(
                    "No configured inventory targets returned usable live inventory evidence."
                ),
                records=[],
                notes=[],
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
            configured_target_count=payload.get("configured_target_count", 0),
            observed_target_count=payload.get("observed_target_count", 0),
            collection_success_count=payload.get("collection_success_count", 0),
            collection_partial_count=payload.get("collection_partial_count", 0),
            collection_failure_count=payload.get("collection_failure_count", 0),
            oldest_observed_at=payload.get("oldest_observed_at"),
            newest_observed_at=payload.get("newest_observed_at"),
            degraded_scope_summary=payload.get(
                "degraded_scope_summary",
                "Inventory degraded scope was not provided by the collector.",
            ),
            records=records,
            notes=payload.get("notes", []),
            fetch_error=None,
        )

    def read_inventory_snapshot(self) -> CollectorInventorySnapshot:
        """Read the live normalized inventory snapshot from the collector."""
        snapshot_key = (self.source_endpoint, self.timeout_seconds)
        return _inventory_snapshot_cache.get_or_load(
            snapshot_key=snapshot_key,
            ttl_seconds=self.cache_ttl_seconds,
            ttl_resolver=lambda snapshot: (
                self.unavailable_cache_ttl_seconds
                if snapshot.status == "collector_unavailable"
                else self.cache_ttl_seconds
            ),
            loader=self._load_inventory_snapshot,
        )


_inventory_snapshot_cache: SnapshotCache[CollectorInventorySnapshot] = SnapshotCache()


def clear_inventory_snapshot_cache() -> None:
    """Clear the short-lived inventory snapshot cache."""
    _inventory_snapshot_cache.clear()


def get_collector_inventory_client() -> CollectorInventoryClient:
    """Return the current collector inventory boundary client."""
    settings = get_settings()
    return CollectorInventoryClient(
        source_endpoint=settings.gnmi_collector_url,
        timeout_seconds=settings.gnmi_collector_timeout_seconds,
        cache_ttl_seconds=settings.gnmi_collector_snapshot_cache_ttl_seconds,
        unavailable_cache_ttl_seconds=settings.gnmi_collector_unavailable_snapshot_cache_ttl_seconds,
    )
