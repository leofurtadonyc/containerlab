"""Bounded collector topology integration models and live snapshot client."""

import json
from dataclasses import dataclass
from time import perf_counter
from typing import Literal
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

from pydantic import BaseModel, Field, ValidationError

from app_api.config.settings import get_settings
from app_api.integrations.collector.cache import SnapshotCache
from app_api.integrations.collector.failure import (
    CollectorFetchErrorKind,
    classify_collector_fetch_failure,
)


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
    endpoint_pairing_state: Literal["paired", "single_sided", "unknown"] | None = None
    endpoint_evidence_count: int | None = None
    physical_adjacency_posture: Literal[
        "not_observed",
        "single_sided_lldp",
        "bidirectional_lldp",
        "lldp_mismatch",
        "suppressed_or_unknown",
    ] = "suppressed_or_unknown"
    control_plane_adjacency_posture: Literal[
        "not_observed",
        "ospf_observed",
        "isis_observed",
        "igp_confirmed",
        "protocol_mismatch",
        "suppressed_or_unknown",
        "unknown",
    ] = "suppressed_or_unknown"
    lldp_observation_count: int = 0
    lldp_bidirectional: bool = False
    lldp_local_interfaces: list[str] = Field(default_factory=list)
    lldp_remote_systems: list[str] = Field(default_factory=list)
    lldp_remote_ports: list[str] = Field(default_factory=list)
    lldp_correlation_notes: list[str] = Field(default_factory=list)
    igp_adjacency_observation_count: int = 0
    igp_protocols_observed: list[Literal["ospf", "isis"]] = Field(default_factory=list)
    ospf_adjacency_state: str | None = None
    isis_adjacency_state: str | None = None
    igp_local_interfaces: list[str] = Field(default_factory=list)
    igp_remote_identities: list[str] = Field(default_factory=list)
    igp_correlation_notes: list[str] = Field(default_factory=list)
    attributes: dict[str, str] = Field(default_factory=dict)


class CollectorTopologySnapshot(BaseModel):
    """Stable intermediate boundary for collector-backed topology reads."""

    integration: Literal["gnmi_collector_topology"]
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
    inference_posture: Literal["inferred", "unknown"] | None = None
    collection_posture: Literal["ok", "degraded", "blocked", "unknown"] | None = None
    degraded_scope_summary: str
    endpoint_pairing_posture: Literal[
        "paired", "partially_paired", "single_sided", "unknown"
    ] | None = None
    node_participation_posture: Literal[
        "fully_linked", "partially_isolated", "isolated_only", "unknown"
    ] | None = None
    paired_link_count: int | None = None
    single_sided_link_count: int | None = None
    lldp_observation_count: int | None = None
    lldp_correlated_link_count: int | None = None
    lldp_single_sided_link_count: int | None = None
    lldp_bidirectional_link_count: int | None = None
    lldp_mismatch_link_count: int | None = None
    igp_adjacency_observation_count: int | None = None
    ospf_adjacency_observation_count: int | None = None
    isis_adjacency_observation_count: int | None = None
    igp_correlated_link_count: int | None = None
    igp_confirmed_link_count: int | None = None
    igp_protocol_mismatch_link_count: int | None = None
    linked_node_count: int | None = None
    isolated_node_count: int | None = None
    topology_id: str
    topology_name: str
    sync_source: str
    sync_status: Literal["ok", "degraded", "failed", "unknown"]
    completeness: Literal["complete", "partial", "unknown"]
    observed_at: str | None = None
    notes: list[str] = Field(default_factory=list)
    nodes: list[CollectorTopologyNodeRecord] = Field(default_factory=list)
    links: list[CollectorTopologyLinkRecord] = Field(default_factory=list)
    timeout_budget_seconds: int = 0
    fetch_duration_seconds: float | None = None
    fetch_error_kind: CollectorFetchErrorKind | None = None
    fetch_error: str | None = None


@dataclass(frozen=True)
class CollectorTopologyClient:
    """HTTP client for the normalized collector topology boundary."""

    source_endpoint: str
    timeout_seconds: int
    cache_ttl_seconds: int
    unavailable_cache_ttl_seconds: int

    def _load_topology_snapshot(self) -> CollectorTopologySnapshot:
        """Load the live normalized topology snapshot from the collector."""
        snapshot_url = f"{self.source_endpoint.rstrip('/')}/topology/snapshot"
        started_at = perf_counter()
        try:
            with urlopen(snapshot_url, timeout=self.timeout_seconds) as response:
                payload = json.loads(response.read().decode("utf-8"))
            nodes = [
                CollectorTopologyNodeRecord.model_validate(record)
                for record in payload.get("nodes", [])
            ]
            links = [
                CollectorTopologyLinkRecord.model_validate(record)
                for record in payload.get("links", [])
            ]
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError, ValidationError) as exc:
            fetch_duration_seconds = perf_counter() - started_at
            failure = classify_collector_fetch_failure(
                exc,
                boundary_label="topology snapshot",
                snapshot_url=snapshot_url,
                timeout_seconds=self.timeout_seconds,
            )
            return CollectorTopologySnapshot(
                integration="gnmi_collector_topology",
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
                inference_posture=None,
                collection_posture="blocked",
                degraded_scope_summary=(
                    "No configured topology targets returned usable live topology evidence."
                ),
                topology_id="platform-observed-topology",
                topology_name="Platform Observed Topology",
                sync_source="gnmi_collector_topology",
                sync_status="failed",
                completeness="unknown",
                notes=[],
                nodes=[],
                links=[],
                timeout_budget_seconds=self.timeout_seconds,
                fetch_duration_seconds=fetch_duration_seconds,
                fetch_error_kind=failure.kind,
                fetch_error=failure.detail,
            )

        status_map = {
            "live_ready": "live_normalized_feed",
            "partial": "partial_live_feed",
            "failed": "collector_unavailable",
        }
        fetch_duration_seconds = perf_counter() - started_at
        return CollectorTopologySnapshot(
            integration="gnmi_collector_topology",
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
            inference_posture=payload.get("inference_posture"),
            collection_posture=payload.get("collection_posture"),
            degraded_scope_summary=payload.get(
                "degraded_scope_summary",
                "Topology degraded scope was not provided by the collector.",
            ),
            endpoint_pairing_posture=payload.get("endpoint_pairing_posture"),
            node_participation_posture=payload.get("node_participation_posture"),
            paired_link_count=payload.get("paired_link_count"),
            single_sided_link_count=payload.get("single_sided_link_count"),
            lldp_observation_count=payload.get("lldp_observation_count"),
            lldp_correlated_link_count=payload.get("lldp_correlated_link_count"),
            lldp_single_sided_link_count=payload.get("lldp_single_sided_link_count"),
            lldp_bidirectional_link_count=payload.get("lldp_bidirectional_link_count"),
            lldp_mismatch_link_count=payload.get("lldp_mismatch_link_count"),
            linked_node_count=payload.get("linked_node_count"),
            isolated_node_count=payload.get("isolated_node_count"),
            topology_id=payload.get("topology_id", "platform-observed-topology"),
            topology_name=payload.get("topology_name", "Platform Observed Topology"),
            sync_source=payload.get("sync_source", "gnmi_collector_topology"),
            sync_status=payload.get("sync_status", "unknown"),
            completeness=payload.get("completeness", "unknown"),
            observed_at=payload.get("observed_at"),
            notes=payload.get("notes", []),
            nodes=nodes,
            links=links,
            timeout_budget_seconds=self.timeout_seconds,
            fetch_duration_seconds=fetch_duration_seconds,
            fetch_error_kind=None,
            fetch_error=None,
        )

    def read_topology_snapshot(self) -> CollectorTopologySnapshot:
        """Read the live normalized topology snapshot from the collector."""
        snapshot_key = (self.source_endpoint, self.timeout_seconds)
        return _topology_snapshot_cache.get_or_load(
            snapshot_key=snapshot_key,
            ttl_seconds=self.cache_ttl_seconds,
            ttl_resolver=lambda snapshot: (
                self.unavailable_cache_ttl_seconds
                if snapshot.status == "collector_unavailable"
                else self.cache_ttl_seconds
            ),
            loader=self._load_topology_snapshot,
        )


_topology_snapshot_cache: SnapshotCache[CollectorTopologySnapshot] = SnapshotCache()


def clear_topology_snapshot_cache() -> None:
    """Clear the short-lived topology snapshot cache."""
    _topology_snapshot_cache.clear()


def get_collector_topology_client() -> CollectorTopologyClient:
    """Return the current collector topology boundary client."""
    settings = get_settings()
    return CollectorTopologyClient(
        source_endpoint=settings.gnmi_collector_url,
        timeout_seconds=settings.get_gnmi_collector_topology_timeout_seconds(),
        cache_ttl_seconds=settings.gnmi_collector_snapshot_cache_ttl_seconds,
        unavailable_cache_ttl_seconds=settings.gnmi_collector_unavailable_snapshot_cache_ttl_seconds,
    )
