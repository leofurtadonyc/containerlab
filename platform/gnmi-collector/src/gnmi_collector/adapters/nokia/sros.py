"""Nokia SR OS adapter placeholder."""

from dataclasses import dataclass

from gnmi_collector.config.models import GnmiTargetConfig
from gnmi_collector.models.inventory import InventoryCollectionPlan, InventoryRawRecord


@dataclass(frozen=True)
class NokiaSrosAdapter:
    """Placeholder for Nokia-first collection behavior."""

    vendor_name: str = "nokia"

    def describe(self) -> str:
        """Describe the current adapter scope honestly."""
        return "Phase 1 Nokia SR OS inventory adapter scaffold"

    def build_inventory_plan(self, target: GnmiTargetConfig) -> InventoryCollectionPlan:
        """Build the Nokia-specific plan for inventory collection."""
        return InventoryCollectionPlan(
            target_name=target.name,
            vendor=target.vendor,
            management_address=target.management_address,
            inventory_paths=target.inventory_paths,
        )

    def collect_inventory(self, target: GnmiTargetConfig) -> InventoryRawRecord:
        """Return a placeholder Nokia inventory record."""
        return InventoryRawRecord(
            target_name=target.name,
            vendor=target.vendor,
            platform_hint="sros",
            collection_status="success",
            raw_data={
                "system_name": target.name,
                "platform": "sros",
                "software_version": "unknown",
                "role": "unknown",
                "management_address": target.management_address,
            },
        )
