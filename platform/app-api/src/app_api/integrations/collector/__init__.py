"""Collector integration boundary package."""

from app_api.integrations.collector.inventory import (
    CollectorInventoryClientPlaceholder,
    CollectorInventoryRecord,
    CollectorInventorySnapshot,
)

__all__ = [
    "CollectorInventoryClientPlaceholder",
    "CollectorInventoryRecord",
    "CollectorInventorySnapshot",
]
