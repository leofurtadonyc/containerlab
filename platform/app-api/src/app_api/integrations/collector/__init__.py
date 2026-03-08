"""Collector integration boundary package."""

from app_api.integrations.collector.inventory import (
    CollectorInventoryClient,
    CollectorInventoryRecord,
    CollectorInventorySnapshot,
)

__all__ = [
    "CollectorInventoryClient",
    "CollectorInventoryRecord",
    "CollectorInventorySnapshot",
]
