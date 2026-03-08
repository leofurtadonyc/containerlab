"""Inventory mapping placeholder."""

from typing import Any


def map_inventory_record(raw_record: dict[str, Any]) -> dict[str, Any]:
    """Return a minimal normalized inventory placeholder."""
    return {
        "model_family": "inventory",
        "source": "gnmi",
        "raw_record": raw_record,
        "normalization_status": "placeholder",
    }
