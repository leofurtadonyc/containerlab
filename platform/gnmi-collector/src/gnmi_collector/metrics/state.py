"""In-memory collector metrics snapshot cache."""

from dataclasses import dataclass
from threading import Lock
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from gnmi_collector.models.inventory import InventoryFlowSummary
    from gnmi_collector.models.policy import PolicyFlowSummary
    from gnmi_collector.models.topology import TopologyFlowSummary


@dataclass(frozen=True)
class CollectorMetricsSnapshot:
    """Cached collector metrics summaries."""

    inventory: "InventoryFlowSummary | None" = None
    topology: "TopologyFlowSummary | None" = None
    policy: "PolicyFlowSummary | None" = None


_lock = Lock()
_snapshot = CollectorMetricsSnapshot()


def record_inventory_summary(summary: "InventoryFlowSummary") -> None:
    """Store the latest inventory flow summary for metrics scraping."""
    global _snapshot
    with _lock:
        _snapshot = CollectorMetricsSnapshot(
            inventory=summary,
            topology=_snapshot.topology,
            policy=_snapshot.policy,
        )


def record_topology_summary(summary: "TopologyFlowSummary") -> None:
    """Store the latest topology flow summary for metrics scraping."""
    global _snapshot
    with _lock:
        _snapshot = CollectorMetricsSnapshot(
            inventory=_snapshot.inventory,
            topology=summary,
            policy=_snapshot.policy,
        )


def record_policy_summary(summary: "PolicyFlowSummary") -> None:
    """Store the latest policy flow summary for metrics scraping."""
    global _snapshot
    with _lock:
        _snapshot = CollectorMetricsSnapshot(
            inventory=_snapshot.inventory,
            topology=_snapshot.topology,
            policy=summary,
        )


def get_metrics_snapshot() -> CollectorMetricsSnapshot:
    """Return the latest cached collector metrics snapshot."""
    with _lock:
        return _snapshot
