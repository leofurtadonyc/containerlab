"""Base adapter contracts for vendor-specific collector code."""

from typing import Protocol

from gnmi_collector.config.models import GnmiTargetConfig
from gnmi_collector.models.inventory import InventoryCollectionPlan, InventoryRawRecord


class GnmiAdapter(Protocol):
    """Common contract for vendor-specific gNMI adapters."""

    vendor_name: str

    def describe(self) -> str:
        """Return a short description of the adapter scope."""

    def build_inventory_plan(self, target: GnmiTargetConfig) -> InventoryCollectionPlan:
        """Build the inventory-oriented collection plan for one target."""

    def collect_inventory(self, target: GnmiTargetConfig) -> InventoryRawRecord:
        """Return a raw inventory record for one target."""
