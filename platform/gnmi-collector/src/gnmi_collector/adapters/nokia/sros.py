"""Nokia SR OS adapter implementation for live read-side collection."""

from dataclasses import dataclass
from datetime import UTC, datetime

from pygnmi.client import gNMIclient

from gnmi_collector.config.models import GnmiTargetConfig
from gnmi_collector.models.inventory import InventoryCollectionPlan, InventoryRawRecord
from gnmi_collector.models.policy import PolicyCollectionPlan, PolicyRawRecord
from gnmi_collector.models.topology import (
    TopologyCollectionPlan,
    TopologyObservedInterface,
    TopologyRawRecord,
)


@dataclass(frozen=True)
class NokiaSrosAdapter:
    """Nokia-first adapter for live read-only collection over gNMI."""

    vendor_name: str = "nokia"

    def describe(self) -> str:
        """Describe the current adapter scope honestly."""
        return "Phase 2 Nokia SR OS live inventory, topology, and policy adapter"

    def _get_paths(self, target: GnmiTargetConfig, paths: list[str]) -> dict:
        """Execute one gNMI get against the target for the requested paths."""
        with gNMIclient(
            target=(target.management_address, target.port),
            username=target.auth.username,
            password=target.auth.password,
            insecure=target.insecure,
        ) as client:
            return client.get(path=paths, encoding="json_ietf")

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
            result = self._get_paths(target, target.inventory_paths)
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

    def build_topology_plan(self, target: GnmiTargetConfig) -> TopologyCollectionPlan:
        """Build the Nokia-specific plan for topology collection."""
        return TopologyCollectionPlan(
            target_name=target.name,
            vendor=target.vendor,
            management_address=target.management_address,
            topology_paths=target.topology_paths,
        )

    def collect_topology(self, target: GnmiTargetConfig) -> TopologyRawRecord:
        """Collect live topology evidence from a Nokia SR OS target over gNMI."""
        try:
            result = self._get_paths(target, target.topology_paths)
        except Exception as exc:
            return TopologyRawRecord(
                target_name=target.name,
                vendor=target.vendor,
                platform_hint="sros",
                role=target.role,
                management_address=target.management_address,
                collection_status="failure",
                collection_error=str(exc),
            )

        timestamps = [
            notification.get("timestamp")
            for notification in result.get("notification", [])
            if notification.get("timestamp") is not None
        ]
        observed_at = None
        if timestamps:
            observed_at = datetime.fromtimestamp(max(timestamps) / 1_000_000_000, tz=UTC)

        interfaces: list[TopologyObservedInterface] = []
        for notification in result.get("notification", []):
            for update in notification.get("update", []):
                value = update.get("val")
                if not isinstance(value, dict):
                    continue
                interface_name = value.get("nokia-state:interface-name")
                if not interface_name:
                    continue
                ipv4_payload = value.get("nokia-state:ipv4", {})
                primary_payload = (
                    ipv4_payload.get("primary", {}) if isinstance(ipv4_payload, dict) else {}
                )
                interfaces.append(
                    TopologyObservedInterface(
                        interface_name=str(interface_name),
                        oper_state=str(value.get("nokia-state:oper-state", "unknown")),
                        ipv4_address=(
                            str(primary_payload.get("oper-address"))
                            if primary_payload.get("oper-address")
                            else None
                        ),
                        protocol=(
                            str(value.get("nokia-state:protocol"))
                            if value.get("nokia-state:protocol")
                            else None
                        ),
                        down_reason=(
                            str(ipv4_payload.get("down-reason"))
                            if isinstance(ipv4_payload, dict)
                            and ipv4_payload.get("down-reason")
                            else None
                        ),
                    )
                )

        system_interface = next(
            (interface for interface in interfaces if interface.interface_name == "system"),
            None,
        )
        missing_fields = []
        if system_interface is None:
            missing_fields.append("system_interface")

        return TopologyRawRecord(
            target_name=target.name,
            vendor=target.vendor,
            platform_hint="sros",
            role=target.role,
            management_address=target.management_address,
            collection_status="partial" if missing_fields else "success",
            collection_error=(
                "Missing topology fields: " + ", ".join(missing_fields)
                if missing_fields
                else None
            ),
            observed_at=observed_at,
            raw_interfaces=interfaces,
        )

    def build_policy_plan(self, target: GnmiTargetConfig) -> PolicyCollectionPlan:
        """Build the Nokia-specific plan for bounded policy collection."""
        return PolicyCollectionPlan(
            target_name=target.name,
            vendor=target.vendor,
            management_address=target.management_address,
            policy_paths=target.policy_paths,
        )

    def collect_policy(self, target: GnmiTargetConfig) -> PolicyRawRecord:
        """Collect live bounded SR policy counters from a Nokia SR OS target."""
        try:
            result = self._get_paths(target, target.policy_paths)
        except Exception as exc:
            return PolicyRawRecord(
                target_name=target.name,
                vendor=target.vendor,
                platform_hint="sros",
                role=target.role,
                management_address=target.management_address,
                collection_status="failure",
                collection_error=str(exc),
            )

        timestamps = [
            notification.get("timestamp")
            for notification in result.get("notification", [])
            if notification.get("timestamp") is not None
        ]
        observed_at = None
        if timestamps:
            observed_at = datetime.fromtimestamp(max(timestamps) / 1_000_000_000, tz=UTC)

        sr_policy_counts: dict[str, int] = {}
        for notification in result.get("notification", []):
            for update in notification.get("update", []):
                value = update.get("val")
                if isinstance(value, dict):
                    sr_policy_counts.update(
                        {
                            key.split(":", 1)[-1]: int(count)
                            for key, count in value.items()
                            if isinstance(count, int)
                        }
                    )

        missing_fields = []
        if not sr_policy_counts:
            missing_fields.append("sr_policy_counts")

        return PolicyRawRecord(
            target_name=target.name,
            vendor=target.vendor,
            platform_hint="sros",
            role=target.role,
            management_address=target.management_address,
            collection_status="partial" if missing_fields else "success",
            collection_error=(
                "Missing policy fields: " + ", ".join(missing_fields)
                if missing_fields
                else None
            ),
            observed_at=observed_at,
            sr_policy_counts=sr_policy_counts,
        )
