"""Collector service scaffolding."""

from gnmi_collector.adapters.nokia import NokiaSrosAdapter
from gnmi_collector.services.inventory import build_inventory_flow_snapshot


def describe_collection_pipeline() -> dict[str, object]:
    """Describe the current collector skeleton honestly."""
    adapter = NokiaSrosAdapter()
    inventory_flow = build_inventory_flow_snapshot()
    return {
        "mode": inventory_flow.mode,
        "adapters": [adapter.describe()],
        "mappings": ["inventory_normalization"],
        "delivery": inventory_flow.delivery.delivery_status,
        "target_count": inventory_flow.summary.target_count,
        "normalized_record_count": inventory_flow.summary.normalized_record_count,
    }
