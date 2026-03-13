"""Collector service helpers."""

from gnmi_collector.adapters.nokia import NokiaSrosAdapter
from gnmi_collector.services.inventory import build_inventory_flow_snapshot
from gnmi_collector.services.topology import build_topology_flow_snapshot


def describe_collection_pipeline() -> dict[str, object]:
    """Describe the current collector pipeline honestly."""
    adapter = NokiaSrosAdapter()
    inventory_flow = build_inventory_flow_snapshot()
    topology_flow = build_topology_flow_snapshot()
    return {
        "mode": inventory_flow.mode,
        "adapters": [adapter.describe()],
        "mappings": ["inventory_normalization", "topology_normalization"],
        "delivery": {
            "inventory": inventory_flow.delivery.delivery_status,
            "topology": topology_flow.delivery.delivery_status,
        },
        "target_count": inventory_flow.summary.target_count,
        "normalized_record_count": inventory_flow.summary.normalized_record_count,
        "normalized_topology_nodes": topology_flow.summary.normalized_node_count,
        "normalized_topology_links": topology_flow.summary.normalized_link_count,
    }
