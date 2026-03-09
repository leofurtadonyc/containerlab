"""Bounded collector topology integration models and live snapshot client."""

import json
from dataclasses import dataclass
from typing import Literal
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

from pydantic import BaseModel, Field

from app_api.config.settings import get_settings


class CollectorTopologyNodeRecord(BaseModel):
    """Normalized topology node record accepted from the collector boundary."""

    node_id: str
    display_name: str
    role: str
    state: Literal["up", "down", "degraded", "unknown"]
    source: Literal["gnmi"]
    device_id: str | None = None
    attributes: dict[str, str] = Field(default_factory=dict)


class CollectorTopologyLinkRecord(BaseModel):
    """Normalized topology link record accepted from the collector boundary."""

    link_id: str
    source_node_id: str
    target_node_id: str
    state: Literal["up", "down", "degraded", "unknown"]
    source: Literal["gnmi"]
    attributes: dict[str, str] = Field(default_factory=dict)


class CollectorTopologySnapshot(BaseModel):
    """Stable intermediate boundary for collector-backed topology reads."""

    integration: Literal["gnmi_collector_topology"]
    status: Literal["live_normalized_feed", "partial_live_feed", "collector_unavailable"]
    destination_service: Literal["app-api"]
    source_endpoint: str
    topology_id: str
    topology_name: str
    sync_source: str
    sync_status: Literal["ok", "degraded", "failed", "unknown"]
    completeness: Literal["complete", "partial", "unknown"]
    observed_at: str | None = None
    notes: list[str] = Field(default_factory=list)
    nodes: list[CollectorTopologyNodeRecord] = Field(default_factory=list)
    links: list[CollectorTopologyLinkRecord] = Field(default_factory=list)
    fetch_error: str | None = None


@dataclass(frozen=True)
class CollectorTopologyClient:
    """HTTP client for the normalized collector topology boundary."""

    source_endpoint: str
    timeout_seconds: int

    def read_topology_snapshot(self) -> CollectorTopologySnapshot:
        """Read the live normalized topology snapshot from the collector."""
        snapshot_url = f"{self.source_endpoint.rstrip('/')}/topology/snapshot"
        try:
            with urlopen(snapshot_url, timeout=self.timeout_seconds) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
            return CollectorTopologySnapshot(
                integration="gnmi_collector_topology",
                status="collector_unavailable",
                destination_service="app-api",
                source_endpoint=snapshot_url,
                topology_id="platform-observed-topology",
                topology_name="Platform Observed Topology",
                sync_source="gnmi_collector_topology",
                sync_status="failed",
                completeness="unknown",
                notes=[],
                nodes=[],
                links=[],
                fetch_error=str(exc),
            )

        status_map = {
            "live_ready": "live_normalized_feed",
            "partial": "partial_live_feed",
            "failed": "collector_unavailable",
        }
        return CollectorTopologySnapshot(
            integration="gnmi_collector_topology",
            status=status_map.get(payload.get("delivery_status"), "collector_unavailable"),
            destination_service="app-api",
            source_endpoint=snapshot_url,
            topology_id=payload.get("topology_id", "platform-observed-topology"),
            topology_name=payload.get("topology_name", "Platform Observed Topology"),
            sync_source=payload.get("sync_source", "gnmi_collector_topology"),
            sync_status=payload.get("sync_status", "unknown"),
            completeness=payload.get("completeness", "unknown"),
            observed_at=payload.get("observed_at"),
            notes=payload.get("notes", []),
            nodes=[
                CollectorTopologyNodeRecord.model_validate(record)
                for record in payload.get("nodes", [])
            ],
            links=[
                CollectorTopologyLinkRecord.model_validate(record)
                for record in payload.get("links", [])
            ],
            fetch_error=None,
        )


def get_collector_topology_client() -> CollectorTopologyClient:
    """Return the current collector topology boundary client."""
    settings = get_settings()
    return CollectorTopologyClient(
        source_endpoint=settings.gnmi_collector_url,
        timeout_seconds=settings.gnmi_collector_timeout_seconds,
    )
