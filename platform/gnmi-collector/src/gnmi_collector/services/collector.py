"""Collector service scaffolding."""

from gnmi_collector.adapters.nokia import NokiaSrosAdapter


def describe_collection_pipeline() -> dict[str, object]:
    """Describe the current collector skeleton honestly."""
    adapter = NokiaSrosAdapter()
    return {
        "mode": "phase_1_skeleton",
        "adapters": [adapter.describe()],
        "mappings": ["inventory"],
        "delivery": "not_implemented",
    }
