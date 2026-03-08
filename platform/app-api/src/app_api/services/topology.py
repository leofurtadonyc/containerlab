"""Topology service helpers."""

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.models.topology import TopologyLink, TopologyNode, TopologySnapshot
from app_api.schemas.topology import (
    TopologyLinkRecord,
    TopologyNodeRecord,
    TopologyRecord,
    TopologyResponse,
)


def _build_topology_snapshot() -> TopologySnapshot:
    """Build the backend-owned normalized topology snapshot."""
    return TopologySnapshot(
        topology_id="platform-observed-topology",
        topology_name="Platform Observed Topology",
        nodes=[
            TopologyNode(
                node_id="edge-pe-1",
                display_name="Edge PE 1",
                role="provider-edge",
                state="unknown",
                source="collector_placeholder",
                device_id="example-nokia-router",
                attributes={
                    "vendor": "nokia",
                    "platform": "sros",
                    "observation_scope": "inventory_seed_only",
                },
            ),
            TopologyNode(
                node_id="core-p-placeholder",
                display_name="Core P Placeholder",
                role="core",
                state="unknown",
                source="platform_placeholder",
                attributes={
                    "observation_scope": "topology_scaffold",
                    "knowledge_state": "partial",
                },
            ),
        ],
        links=[
            TopologyLink(
                link_id="edge-pe-1--core-p-placeholder",
                source_node_id="edge-pe-1",
                target_node_id="core-p-placeholder",
                state="unknown",
                source="platform_placeholder",
                attributes={
                    "relation": "possible_transport_adjacency",
                    "knowledge_state": "partial",
                },
            )
        ],
        sync_source="normalized_platform_topology_placeholder",
        sync_status="unknown",
        completeness="partial",
        observed_at=None,
        notes=[
            "Topology is intentionally partial in Phase 1.",
            "Unknown states are explicit until collector and controller inputs mature.",
        ],
    )


def build_topology_response() -> TopologyResponse:
    """Build the Phase 1 topology response from a normalized backend model."""
    settings = get_settings()
    snapshot = _build_topology_snapshot()
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
    return TopologyResponse(
        service="app-api",
        version=settings.app_version,
        phase="phase_1_skeleton",
        generated_at=datetime.now(UTC),
        data_status="normalized_scaffold",
        summary=(
            "Phase 1 topology is now served from a backend-owned normalized read "
            "model that makes partial and unknown knowledge explicit."
        ),
        topology=topology,
    )
