"""Topology service helpers."""

from collections import Counter
from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.integrations.collector.topology import (
    CollectorTopologySnapshot,
    get_collector_topology_client,
)
from app_api.metrics.state import cache_topology_metrics
from app_api.models.topology import TopologyLink, TopologyNode, TopologySnapshot
from app_api.persistence.read_side import (
    load_latest_topology_snapshot,
    persist_topology_snapshot,
)
from app_api.schemas.topology import (
    TopologyLinkRecord,
    TopologyNodeRecord,
    TopologyRecord,
    TopologyResponse,
)


def _build_topology_snapshot() -> tuple[
    CollectorTopologySnapshot, TopologySnapshot, datetime | None
]:
    """Build the backend-owned normalized topology snapshot from the collector boundary."""
    collector_snapshot = get_collector_topology_client().read_topology_snapshot()
    observed_at = (
        datetime.fromisoformat(collector_snapshot.observed_at.replace("Z", "+00:00"))
        if collector_snapshot.observed_at
        else None
    )

    if collector_snapshot.status == "collector_unavailable":
        persisted_snapshot = load_latest_topology_snapshot()
        if persisted_snapshot is not None:
            return collector_snapshot, persisted_snapshot.snapshot, persisted_snapshot.persisted_at
        return collector_snapshot, TopologySnapshot(
            topology_id="platform-observed-topology",
            topology_name="Platform Observed Topology",
            nodes=[],
            links=[],
            sync_source="gnmi_collector_topology",
            sync_status="failed",
            completeness="unknown",
            observed_at=None,
            notes=[
                "The backend could not load the live topology snapshot from the collector.",
                "No raw vendor payloads are exposed through the topology API.",
            ],
        ), None

    nodes = [
        TopologyNode(
            node_id=node.node_id,
            display_name=node.display_name,
            role=node.role,
            state=node.state,
            source=node.source,
            device_id=node.device_id,
            attributes=node.attributes,
        )
        for node in collector_snapshot.nodes
    ]
    links = [
        TopologyLink(
            link_id=link.link_id,
            source_node_id=link.source_node_id,
            target_node_id=link.target_node_id,
            state=link.state,
            source=link.source,
            attributes=link.attributes,
        )
        for link in collector_snapshot.links
    ]

    snapshot = TopologySnapshot(
        topology_id=collector_snapshot.topology_id,
        topology_name=collector_snapshot.topology_name,
        nodes=nodes,
        links=links,
        sync_source=collector_snapshot.sync_source,
        sync_status=collector_snapshot.sync_status,
        completeness=collector_snapshot.completeness,
        observed_at=observed_at,
        notes=collector_snapshot.notes,
    )
    persist_topology_snapshot(
        collector_snapshot=collector_snapshot,
        snapshot=snapshot,
        data_status=(
            "live" if collector_snapshot.status == "live_normalized_feed" else "degraded"
        ),
    )
    return collector_snapshot, snapshot, None


def build_topology_response() -> TopologyResponse:
    """Build the topology response from a normalized backend model."""
    settings = get_settings()
    collector_snapshot, snapshot, persisted_at = _build_topology_snapshot()
    topology = TopologyRecord(
        topology_id=snapshot.topology_id,
        topology_name=snapshot.topology_name,
        nodes=[
            TopologyNodeRecord(
                node_id=node.node_id,
                display_name=node.display_name,
                role=node.role,
                state=node.state,
                source=node.source,
                device_id=node.device_id,
                attributes=node.attributes,
            )
            for node in snapshot.nodes
        ],
        links=[
            TopologyLinkRecord(
                link_id=link.link_id,
                source_node_id=link.source_node_id,
                target_node_id=link.target_node_id,
                state=link.state,
                source=link.source,
                attributes=link.attributes,
            )
            for link in snapshot.links
        ],
        sync_source=snapshot.sync_source,
        sync_status=snapshot.sync_status,
        completeness=snapshot.completeness,
        observed_at=snapshot.observed_at,
        notes=snapshot.notes,
    )
    if collector_snapshot.status == "live_normalized_feed":
        data_status = "live"
        summary = (
            "Topology is backed by live read-only Nokia gNMI collection and bounded "
            "interface-based link inference, with partial knowledge still explicit."
        )
    elif collector_snapshot.status == "partial_live_feed":
        data_status = "degraded"
        summary = (
            "Topology is backed by live Nokia gNMI collection, but one or more "
            "targets or inferred links remain partial or degraded."
        )
    else:
        data_status = "degraded"
        if snapshot.nodes and persisted_at is not None:
            summary = (
                "The backend could not load the live collector topology snapshot, so "
                "the latest persisted normalized topology snapshot is being served."
            )
        else:
            summary = (
                "The backend could not load the live collector topology snapshot. "
                "No raw vendor payloads are exposed through the topology API."
            )
    cache_topology_metrics(
        node_count=len(topology.nodes),
        link_count=len(topology.links),
        data_status=data_status,
        sync_status=topology.sync_status,
        completeness=topology.completeness,
        node_state_counts=dict(Counter(node.state for node in topology.nodes)),
        link_state_counts=dict(Counter(link.state for link in topology.links)),
    )
    return TopologyResponse(
        service="app-api",
        version=settings.app_version,
        phase="phase_1_skeleton",
        generated_at=datetime.now(UTC),
        data_status=data_status,
        summary=summary,
        topology=topology,
    )
