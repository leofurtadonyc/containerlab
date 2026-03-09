"""Collector integration boundary package."""

from app_api.integrations.collector.inventory import (
    CollectorInventoryClient,
    CollectorInventoryRecord,
    CollectorInventorySnapshot,
)
from app_api.integrations.collector.topology import (
    CollectorTopologyClient,
    CollectorTopologyLinkRecord,
    CollectorTopologyNodeRecord,
    CollectorTopologySnapshot,
)

__all__ = [
    "CollectorInventoryClient",
    "CollectorInventoryRecord",
    "CollectorInventorySnapshot",
    "CollectorTopologyClient",
    "CollectorTopologyLinkRecord",
    "CollectorTopologyNodeRecord",
    "CollectorTopologySnapshot",
]
