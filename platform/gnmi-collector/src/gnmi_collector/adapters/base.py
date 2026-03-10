"""Base adapter contracts for vendor-specific collector code."""

from typing import Protocol

from gnmi_collector.config.models import GnmiTargetConfig
from gnmi_collector.models.inventory import InventoryCollectionPlan, InventoryRawRecord
from gnmi_collector.models.policy import PolicyCollectionPlan, PolicyRawRecord
from gnmi_collector.models.topology import TopologyCollectionPlan, TopologyRawRecord


class GnmiAdapter(Protocol):
    """Common contract for vendor-specific gNMI adapters."""

    vendor_name: str

    def describe(self) -> str:
        """Return a short description of the adapter scope."""

    def build_inventory_plan(self, target: GnmiTargetConfig) -> InventoryCollectionPlan:
        """Build the inventory-oriented collection plan for one target."""

    def collect_inventory(self, target: GnmiTargetConfig) -> InventoryRawRecord:
        """Return a raw inventory record for one target."""

    def build_topology_plan(self, target: GnmiTargetConfig) -> TopologyCollectionPlan:
        """Build the topology-oriented collection plan for one target."""

    def collect_topology(self, target: GnmiTargetConfig) -> TopologyRawRecord:
        """Return a raw topology record for one target."""

    def build_policy_plan(self, target: GnmiTargetConfig) -> PolicyCollectionPlan:
        """Build the policy-oriented collection plan for one target."""

    def collect_policy(self, target: GnmiTargetConfig) -> PolicyRawRecord:
        """Return a raw policy record for one target."""
