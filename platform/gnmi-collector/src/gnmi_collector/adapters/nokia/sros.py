"""Nokia SR OS adapter implementation for live inventory collection."""

from dataclasses import dataclass

from pygnmi.client import gNMIclient

from gnmi_collector.config.models import GnmiTargetConfig
from gnmi_collector.models.inventory import InventoryCollectionPlan, InventoryRawRecord


@dataclass(frozen=True)
class NokiaSrosAdapter:
    """Nokia-first adapter for live inventory collection over gNMI."""

    vendor_name: str = "nokia"

    def describe(self) -> str:
        """Describe the current adapter scope honestly."""
        return "Phase 2 Nokia SR OS live inventory adapter"

    def build_inventory_plan(self, target: GnmiTargetConfig) -> InventoryCollectionPlan:
        """Build the Nokia-specific plan for inventory collection."""
        return InventoryCollectionPlan(
            target_name=target.name,
            vendor=target.vendor,
            management_address=target.management_address,
            inventory_paths=target.inventory_paths,
        )

    def collect_inventory(self, target: GnmiTargetConfig) -> InventoryRawRecord:
        """Collect live inventory data from a Nokia SR OS target over gNMI."""
        try:
            with gNMIclient(
                target=(target.management_address, target.port),
                username=target.auth.username,
                password=target.auth.password,
                insecure=target.insecure,
            ) as client:
                result = client.get(path=target.inventory_paths, encoding="json_ietf")
        except Exception as exc:
            return InventoryRawRecord(
                target_name=target.name,
                vendor=target.vendor,
                platform_hint="sros",
                collection_status="failure",
                collection_error=str(exc),
                raw_data={
                    "management_address": target.management_address,
                    "role": target.role or "unknown",
                },
            )

        updates = {}
        for notification in result.get("notification", []):
            for update in notification.get("update", []):
                updates[update.get("path", "")] = update.get("val")

        version_payload = updates.get("state/system/version")
        version_number = None
        if isinstance(version_payload, dict):
            version_number = version_payload.get("nokia-state:version-number")
        elif isinstance(version_payload, str):
            version_number = version_payload

        raw_data = {
            "system_name": str(updates.get("state/system/oper-name", target.name)),
            "platform": str(updates.get("state/system/platform", "sros")),
            "software_version": version_number or "unknown",
            "role": target.role or "unknown",
            "management_address": target.management_address,
        }

        missing_fields = [
            field_name
            for field_name in ("system_name", "platform", "software_version")
            if raw_data.get(field_name) in {None, "", "unknown"}
        ]

        return InventoryRawRecord(
            target_name=target.name,
            vendor=target.vendor,
            platform_hint="sros",
            collection_status="partial" if missing_fields else "success",
            collection_error=(
                "Missing inventory fields: " + ", ".join(missing_fields)
                if missing_fields
                else None
            ),
            raw_data=raw_data,
        )
