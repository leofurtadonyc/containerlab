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
    TopologyComparisonSummary,
    TopologyLinkRecord,
    TopologyNodeRecord,
    TopologyRecord,
    TopologyResponse,
)


def _node_signature(node: TopologyNode) -> tuple[object, ...]:
    """Return a stable normalized node signature for bounded comparisons."""
    return (
        node.display_name,
        node.role,
        node.state,
        node.source,
        node.device_id,
        tuple(sorted(node.attributes.items())),
    )


def _link_signature(link: TopologyLink) -> tuple[object, ...]:
    """Return a stable normalized link signature for bounded comparisons."""
    return (
        link.source_node_id,
        link.target_node_id,
        link.state,
        link.source,
        tuple(sorted(link.attributes.items())),
    )


def _build_topology_comparison_summary(
    *,
    current_snapshot: TopologySnapshot,
    comparison_snapshot: TopologySnapshot | None,
    comparison_persisted_at: datetime | None,
) -> TopologyComparisonSummary:
    """Build bounded current-versus-persisted topology comparison evidence."""
    current_node_signatures = {
        node.node_id: _node_signature(node) for node in current_snapshot.nodes
    }
    current_link_signatures = {
        link.link_id: _link_signature(link) for link in current_snapshot.links
    }
    if comparison_snapshot is None or comparison_persisted_at is None:
        return TopologyComparisonSummary(
            status="unavailable",
            summary=(
                "No earlier persisted normalized topology snapshot is currently available "
                "for bounded comparison."
            ),
            comparison_persisted_at=None,
            current_observed_at=current_snapshot.observed_at,
            current_node_count=len(current_snapshot.nodes),
            persisted_node_count=0,
            current_link_count=len(current_snapshot.links),
            persisted_link_count=0,
            node_count_delta=0,
            link_count_delta=0,
            added_node_count=0,
            removed_node_count=0,
            changed_node_count=0,
            added_link_count=0,
            removed_link_count=0,
            changed_link_count=0,
            notes=[
                "Topology comparison becomes available only when the backend already has an earlier persisted normalized topology snapshot.",
            ],
        )
    comparison_node_signatures = {
        node.node_id: _node_signature(node) for node in comparison_snapshot.nodes
    }
    comparison_link_signatures = {
        link.link_id: _link_signature(link) for link in comparison_snapshot.links
    }
    current_node_ids = set(current_node_signatures)
    comparison_node_ids = set(comparison_node_signatures)
    current_link_ids = set(current_link_signatures)
    comparison_link_ids = set(comparison_link_signatures)
    changed_node_count = sum(
        1
        for node_id in current_node_ids & comparison_node_ids
        if current_node_signatures[node_id] != comparison_node_signatures[node_id]
    )
    changed_link_count = sum(
        1
        for link_id in current_link_ids & comparison_link_ids
        if current_link_signatures[link_id] != comparison_link_signatures[link_id]
    )
    notes = [
        "This comparison reflects the current normalized topology snapshot against the latest earlier persisted normalized topology snapshot.",
        "Counts describe bounded normalized node and link changes, not path computation, protocol adjacency truth, or controller-derived intent.",
    ]
    if current_snapshot.completeness != "complete" or comparison_snapshot.completeness != "complete":
        notes.append(
            "One or both topology snapshots are explicitly partial, so comparison counts remain bounded to the currently normalized topology slice."
        )
    return TopologyComparisonSummary(
        status="live_vs_latest_persisted_ready",
        summary=(
            "Bounded comparison is available between the current normalized topology "
            "snapshot and the latest earlier persisted normalized topology snapshot."
        ),
        comparison_persisted_at=comparison_persisted_at,
        current_observed_at=current_snapshot.observed_at,
        current_node_count=len(current_snapshot.nodes),
        persisted_node_count=len(comparison_snapshot.nodes),
        current_link_count=len(current_snapshot.links),
        persisted_link_count=len(comparison_snapshot.links),
        node_count_delta=len(current_snapshot.nodes) - len(comparison_snapshot.nodes),
        link_count_delta=len(current_snapshot.links) - len(comparison_snapshot.links),
        added_node_count=len(current_node_ids - comparison_node_ids),
        removed_node_count=len(comparison_node_ids - current_node_ids),
        changed_node_count=changed_node_count,
        added_link_count=len(current_link_ids - comparison_link_ids),
        removed_link_count=len(comparison_link_ids - current_link_ids),
        changed_link_count=changed_link_count,
        notes=notes,
    )


def _build_topology_snapshot() -> tuple[
    CollectorTopologySnapshot, TopologySnapshot, datetime | None, TopologyComparisonSummary
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
            return (
                collector_snapshot,
                persisted_snapshot.snapshot,
                persisted_snapshot.persisted_at,
                TopologyComparisonSummary(
                    status="unavailable",
                    summary=(
                        "Live collector topology is unavailable, so the current response "
                        "already reflects the latest persisted normalized topology snapshot."
                    ),
                    comparison_persisted_at=persisted_snapshot.persisted_at,
                    current_observed_at=persisted_snapshot.snapshot.observed_at,
                    current_node_count=len(persisted_snapshot.snapshot.nodes),
                    persisted_node_count=len(persisted_snapshot.snapshot.nodes),
                    current_link_count=len(persisted_snapshot.snapshot.links),
                    persisted_link_count=len(persisted_snapshot.snapshot.links),
                    node_count_delta=0,
                    link_count_delta=0,
                    added_node_count=0,
                    removed_node_count=0,
                    changed_node_count=0,
                    added_link_count=0,
                    removed_link_count=0,
                    changed_link_count=0,
                    notes=[
                        "Comparison is not shown here because the current topology response is already the persisted fallback snapshot.",
                    ],
                ),
            )
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
        ), None, TopologyComparisonSummary(
            status="unavailable",
            summary=(
                "No persisted topology comparison is available because neither a live "
                "collector topology snapshot nor a persisted fallback snapshot could be loaded."
            ),
            comparison_persisted_at=None,
            current_observed_at=None,
            current_node_count=0,
            persisted_node_count=0,
            current_link_count=0,
            persisted_link_count=0,
            node_count_delta=0,
            link_count_delta=0,
            added_node_count=0,
            removed_node_count=0,
            changed_node_count=0,
            added_link_count=0,
            removed_link_count=0,
            changed_link_count=0,
            notes=[
                "Comparison requires at least one persisted normalized topology snapshot in addition to the current topology response.",
            ],
        )

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
    previous_persisted_snapshot = load_latest_topology_snapshot()
    comparison = _build_topology_comparison_summary(
        current_snapshot=snapshot,
        comparison_snapshot=(
            previous_persisted_snapshot.snapshot if previous_persisted_snapshot is not None else None
        ),
        comparison_persisted_at=(
            previous_persisted_snapshot.persisted_at if previous_persisted_snapshot is not None else None
        ),
    )
    persist_topology_snapshot(
        collector_snapshot=collector_snapshot,
        snapshot=snapshot,
        data_status=(
            "live" if collector_snapshot.status == "live_normalized_feed" else "degraded"
        ),
    )
    return collector_snapshot, snapshot, None, comparison


def build_topology_response() -> TopologyResponse:
    """Build the topology response from a normalized backend model."""
    settings = get_settings()
    collector_snapshot, snapshot, persisted_at, comparison = _build_topology_snapshot()
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
        serving_mode = "live_collector"
        summary = (
            "Topology is backed by live read-only Nokia gNMI collection and bounded "
            "interface-based link inference, with partial knowledge still explicit."
        )
    elif collector_snapshot.status == "partial_live_feed":
        data_status = "degraded"
        serving_mode = "live_collector"
        summary = (
            "Topology is backed by live Nokia gNMI collection, but one or more "
            "targets or inferred links remain partial or degraded."
        )
    else:
        data_status = "degraded"
        if snapshot.nodes and persisted_at is not None:
            serving_mode = "persisted_fallback"
            summary = (
                "The backend could not load the live collector topology snapshot, so "
                "the latest persisted normalized topology snapshot is being served."
            )
        else:
            serving_mode = "empty_scaffold"
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
        phase="phase_2_read_only_foundation",
        generated_at=datetime.now(UTC),
        data_status=data_status,
        serving_mode=serving_mode,
        summary=summary,
        served_persisted_at=persisted_at,
        comparison_to_latest_persisted=comparison,
        topology=topology,
    )
