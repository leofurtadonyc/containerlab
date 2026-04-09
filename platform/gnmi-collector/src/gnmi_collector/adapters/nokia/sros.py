"""Nokia SR OS adapter implementation for live read-side collection."""

from dataclasses import dataclass
from datetime import UTC, datetime
import re
from typing import Any

from pygnmi.client import gNMIclient

from gnmi_collector.config.models import GnmiTargetConfig
from gnmi_collector.models.inventory import InventoryCollectionPlan, InventoryRawRecord
from gnmi_collector.models.policy import PolicyCollectionPlan, PolicyRawRecord
from gnmi_collector.models.topology import (
    IgpAdjacencyObservation,
    LldpNeighborObservation,
    TopologyCollectionPlan,
    TopologyObservedInterface,
    TopologyRawRecord,
)


@dataclass(frozen=True)
class NokiaSrosAdapter:
    """Nokia-first adapter for live read-only collection over gNMI."""

    vendor_name: str = "nokia"
    native_lldp_fallback_path: str = "/nokia-state:state/port"

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
            gnmi_timeout=target.gnmi_request_timeout_seconds,
        ) as client:
            return client.get(path=paths, encoding="json_ietf")

    def _strip_module_prefix(self, value: str) -> str:
        return value.split(":", 1)[-1]

    def _find_first_child(self, payload: dict[str, Any], name: str) -> Any | None:
        for key, value in payload.items():
            if self._strip_module_prefix(key) == name:
                return value
        return None

    def _get_child_value(self, payload: dict[str, Any], *names: str) -> Any | None:
        for name in names:
            if name in payload:
                return payload[name]
            child = self._find_first_child(payload, name)
            if child is not None:
                return child
        return None

    def _as_list(self, value: object) -> list[dict[str, Any]]:
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
        if isinstance(value, dict):
            return [value]
        return []

    def _classify_igp_query_error(self, exc: Exception) -> tuple[str, str]:
        message = str(exc)
        normalized = message.lower()
        if "disabled by configuration" in normalized or "unknown element" in normalized:
            return (
                "not_exposed",
                f"IGP path is not exposed on the target: {message}",
            )
        return (
            "query_failed",
            f"IGP path query failed: {message}",
        )

    def _prefer_collection_status(self, current: str, candidate: str) -> str:
        ranking = {
            "unknown": 0,
            "not_exposed": 1,
            "query_failed": 2,
            "enabled_no_adjacencies": 3,
            "adjacencies_visible": 4,
        }
        return candidate if ranking.get(candidate, 0) >= ranking.get(current, 0) else current

    def _classify_igp_state_strength(self, protocol: str, state: str | None) -> str:
        if state is None:
            return "unknown"
        normalized = state.strip().lower()
        if not normalized:
            return "unknown"
        if protocol == "ospf":
            return "strong" if normalized == "full" else "weak"
        if protocol == "isis":
            return "strong" if normalized == "up" else "weak"
        return "unknown"

    def _extract_openconfig_lldp_neighbors(
        self,
        value: object,
        *,
        source_path: str,
    ) -> tuple[
        list[LldpNeighborObservation],
        str,
        list[str],
    ]:
        if not isinstance(value, dict):
            return [], "unknown", ["LLDP subtree did not return a structured payload."]

        root = self._find_first_child(value, "lldp") if "lldp" not in value else value.get("lldp")
        if not isinstance(root, dict):
            root = value

        interfaces_container = self._find_first_child(root, "interfaces")
        if not isinstance(interfaces_container, dict):
            return [], "enabled_no_neighbors", [
                "OpenConfig LLDP root is reachable, but no interface neighbor table was returned.",
            ]

        interface_entries = self._find_first_child(interfaces_container, "interface")
        if not isinstance(interface_entries, list) or not interface_entries:
            return [], "enabled_no_neighbors", [
                "OpenConfig LLDP is enabled, but no interface neighbor rows were returned.",
            ]

        observations: list[LldpNeighborObservation] = []
        for interface_entry in interface_entries:
            if not isinstance(interface_entry, dict):
                continue
            state_payload = self._find_first_child(interface_entry, "state")
            local_interface_name = interface_entry.get("name")
            if not local_interface_name and isinstance(state_payload, dict):
                local_interface_name = state_payload.get("name")
            if not local_interface_name:
                continue

            neighbors_container = self._find_first_child(interface_entry, "neighbors")
            if not isinstance(neighbors_container, dict):
                continue
            neighbor_entries = self._find_first_child(neighbors_container, "neighbor")
            if not isinstance(neighbor_entries, list):
                continue
            for neighbor_entry in neighbor_entries:
                if not isinstance(neighbor_entry, dict):
                    continue
                neighbor_state = self._find_first_child(neighbor_entry, "state")
                if not isinstance(neighbor_state, dict):
                    neighbor_state = {}
                management_address = neighbor_state.get("management-address")
                if isinstance(management_address, list):
                    management_address = next(
                        (str(item) for item in management_address if item),
                        None,
                    )
                observations.append(
                    LldpNeighborObservation(
                        local_interface_name=str(local_interface_name),
                        remote_system_name=(
                            str(neighbor_state.get("system-name"))
                            if neighbor_state.get("system-name")
                            else None
                        ),
                        remote_chassis_id=(
                            str(neighbor_state.get("chassis-id"))
                            if neighbor_state.get("chassis-id")
                            else None
                        ),
                        remote_port_id=(
                            str(neighbor_state.get("port-id"))
                            if neighbor_state.get("port-id")
                            else None
                        ),
                        remote_port_description=(
                            str(neighbor_state.get("port-description"))
                            if neighbor_state.get("port-description")
                            else None
                        ),
                        remote_interface_name=(
                            str(neighbor_state.get("port-id"))
                            if neighbor_state.get("port-id")
                            else None
                        ),
                        remote_management_address=(
                            str(management_address) if management_address else None
                        ),
                        source_path=source_path,
                        notes=[],
                    )
                )

        if observations:
            return observations, "neighbors_visible", [
                f"OpenConfig LLDP returned {len(observations)} neighbor row(s).",
            ]
        return [], "enabled_no_neighbors", [
            "OpenConfig LLDP is enabled, but no neighbor rows were present under the interface table.",
        ]

    def _extract_port_id_from_path(self, path: str) -> str | None:
        match = re.search(r"port\[port-id=([^\]]+)\]", path)
        if not match:
            return None
        return match.group(1)

    def _extract_nokia_native_lldp_neighbors(
        self,
        result: dict[str, Any],
        *,
        source_path: str,
    ) -> tuple[
        list[LldpNeighborObservation],
        str,
        list[str],
    ]:
        if not isinstance(result, dict):
            return [], "unknown", ["Nokia native LLDP subtree did not return a structured payload."]

        observations: list[LldpNeighborObservation] = []
        saw_lldp_payload = False
        for notification in result.get("notification", []):
            if not isinstance(notification, dict):
                continue
            for update in notification.get("update", []):
                if not isinstance(update, dict):
                    continue
                path = str(update.get("path", ""))
                value = update.get("val")
                if not isinstance(value, dict):
                    continue

                port_id = self._extract_port_id_from_path(path)
                if port_id is None:
                    raw_port_id = value.get("nokia-state:port-id") or value.get("port-id")
                    if raw_port_id:
                        port_id = str(raw_port_id)

                lldp_payload: object | None
                if path.endswith("/ethernet/lldp"):
                    lldp_payload = value
                else:
                    ethernet_payload = self._find_first_child(value, "ethernet")
                    if not isinstance(ethernet_payload, dict):
                        continue
                    lldp_payload = self._find_first_child(ethernet_payload, "lldp")

                if not isinstance(lldp_payload, dict):
                    continue
                saw_lldp_payload = True

                dest_mac_entries = self._find_first_child(lldp_payload, "dest-mac")
                if not isinstance(dest_mac_entries, list):
                    continue
                for dest_mac_entry in dest_mac_entries:
                    if not isinstance(dest_mac_entry, dict):
                        continue
                    remote_systems = self._find_first_child(dest_mac_entry, "remote-system")
                    if not isinstance(remote_systems, list):
                        continue
                    for remote_system in remote_systems:
                        if not isinstance(remote_system, dict) or not port_id:
                            continue
                        observations.append(
                            LldpNeighborObservation(
                                local_interface_name=port_id,
                                remote_system_name=(
                                    str(remote_system.get("system-name"))
                                    if remote_system.get("system-name")
                                    else None
                                ),
                                remote_chassis_id=(
                                    str(remote_system.get("chassis-id"))
                                    if remote_system.get("chassis-id")
                                    else None
                                ),
                                remote_port_id=(
                                    str(remote_system.get("remote-port-id"))
                                    if remote_system.get("remote-port-id")
                                    else None
                                ),
                                remote_port_description=(
                                    str(remote_system.get("port-description"))
                                    if remote_system.get("port-description")
                                    else None
                                ),
                                remote_interface_name=(
                                    str(remote_system.get("remote-port-id"))
                                    if remote_system.get("remote-port-id")
                                    else None
                                ),
                                remote_management_address=None,
                                source_path=source_path,
                                notes=[],
                            )
                        )

        if observations:
            return observations, "neighbors_visible", [
                f"Nokia native LLDP fallback returned {len(observations)} neighbor row(s).",
            ]
        if saw_lldp_payload:
            return [], "enabled_no_neighbors", [
                "Nokia native LLDP fallback was reachable, but no remote-system rows were present.",
            ]
        return [], "unknown", [
            "Nokia native LLDP fallback did not expose any ethernet/lldp payloads in the returned port state.",
        ]

    def _collect_nokia_native_lldp_fallback(
        self,
        target: GnmiTargetConfig,
    ) -> tuple[
        list[LldpNeighborObservation],
        str,
        list[str],
    ]:
        path = self.native_lldp_fallback_path
        try:
            result = self._get_paths(target, [path])
        except Exception as exc:
            status, note = self._classify_lldp_query_error(exc)
            return [], status, [f"{path}: Nokia native LLDP fallback failed: {note}"]

        neighbors, status, notes = self._extract_nokia_native_lldp_neighbors(
            result,
            source_path=path,
        )
        return neighbors, status, [f"{path}: {note}" for note in notes]

    def _extract_interface_updates(
        self,
        result: dict[str, Any],
    ) -> list[TopologyObservedInterface]:
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
        return interfaces

    def _classify_lldp_query_error(self, exc: Exception) -> tuple[str, str]:
        message = str(exc)
        normalized = message.lower()
        if "disabled by configuration" in normalized or "unknown element" in normalized:
            return (
                "not_exposed",
                f"LLDP path is not exposed on the target: {message}",
            )
        return (
            "query_failed",
            f"LLDP path query failed: {message}",
        )

    def _extract_ospf_adjacencies(
        self,
        value: object,
        *,
        source_path: str,
    ) -> tuple[list[IgpAdjacencyObservation], str, list[str]]:
        if not isinstance(value, dict):
            return [], "unknown", ["OSPF subtree did not return a structured payload."]

        root = self._get_child_value(value, "ospf")
        if root is None:
            root = value

        instance_entries = self._as_list(root)
        observations: list[IgpAdjacencyObservation] = []
        saw_root = False
        saw_neighbor_container = False

        for instance_entry in instance_entries:
            saw_root = True
            instance_state = self._get_child_value(instance_entry, "state")
            instance_id = self._get_child_value(instance_entry, "instance-id", "ospf-instance")
            local_router_id = None
            if isinstance(instance_state, dict):
                local_router_id = self._get_child_value(instance_state, "router-id")
            if local_router_id is None:
                local_router_id = self._get_child_value(instance_entry, "router-id")

            area_entries = self._as_list(self._get_child_value(instance_entry, "area"))
            for area_entry in area_entries:
                area_id = self._get_child_value(area_entry, "area-id")
                interface_entries = self._as_list(self._get_child_value(area_entry, "interface"))
                for interface_entry in interface_entries:
                    interface_name = self._get_child_value(
                        interface_entry,
                        "interface-name",
                        "name",
                    )
                    neighbor_entries = self._as_list(self._get_child_value(interface_entry, "neighbor"))
                    if neighbor_entries:
                        saw_neighbor_container = True
                    for neighbor_entry in neighbor_entries:
                        neighbor_state = self._get_child_value(neighbor_entry, "state")
                        if not isinstance(neighbor_state, dict):
                            neighbor_state = neighbor_entry
                        remote_router_id = self._get_child_value(
                            neighbor_entry,
                            "router-id",
                            "neighbor-router-id",
                        )
                        if remote_router_id is None:
                            remote_router_id = self._get_child_value(
                                neighbor_state,
                                "router-id",
                                "neighbor-router-id",
                            )
                        adjacency_state = self._get_child_value(
                            neighbor_state,
                            "neighbor-state",
                            "adjacency-state",
                            "state",
                        )
                        last_change = self._get_child_value(
                            neighbor_state,
                            "last-state-change",
                            "last-change",
                        )
                        observations.append(
                            IgpAdjacencyObservation(
                                protocol="ospf",
                                local_interface_name=str(interface_name) if interface_name else None,
                                local_router_id=str(local_router_id) if local_router_id else None,
                                local_area=str(area_id) if area_id else None,
                                local_instance=str(instance_id) if instance_id else None,
                                remote_router_id=str(remote_router_id) if remote_router_id else None,
                                adjacency_state=str(adjacency_state) if adjacency_state else None,
                                state_strength=self._classify_igp_state_strength(
                                    "ospf",
                                    str(adjacency_state) if adjacency_state else None,
                                ),
                                last_change_at=str(last_change) if last_change else None,
                                source_path=source_path,
                                notes=[],
                            )
                        )

        if observations:
            return observations, "adjacencies_visible", [
                f"OSPF returned {len(observations)} adjacency row(s).",
            ]
        if saw_neighbor_container or saw_root:
            return [], "enabled_no_adjacencies", [
                "OSPF state is reachable, but no neighbor rows were returned.",
            ]
        return [], "unknown", ["OSPF subtree did not expose recognizable area/interface/neighbor payloads."]

    def _extract_isis_adjacencies(
        self,
        value: object,
        *,
        source_path: str,
    ) -> tuple[list[IgpAdjacencyObservation], str, list[str]]:
        if not isinstance(value, dict):
            return [], "unknown", ["IS-IS subtree did not return a structured payload."]

        root = self._get_child_value(value, "isis")
        if root is None:
            root = value

        instance_entries = self._as_list(root)
        observations: list[IgpAdjacencyObservation] = []
        saw_root = False
        saw_adjacency_container = False

        for instance_entry in instance_entries:
            saw_root = True
            instance_state = self._get_child_value(instance_entry, "state")
            instance_id = self._get_child_value(instance_entry, "instance", "instance-id")
            local_system_id = None
            if isinstance(instance_state, dict):
                local_system_id = self._get_child_value(instance_state, "system-id")
            if local_system_id is None:
                local_system_id = self._get_child_value(instance_entry, "system-id")

            interface_entries = self._as_list(self._get_child_value(instance_entry, "interface"))
            for interface_entry in interface_entries:
                interface_name = self._get_child_value(
                    interface_entry,
                    "interface-name",
                    "name",
                )
                adjacency_entries = self._as_list(
                    self._get_child_value(interface_entry, "adjacency", "neighbor")
                )
                if adjacency_entries:
                    saw_adjacency_container = True
                interface_level = self._get_child_value(interface_entry, "level")
                for adjacency_entry in adjacency_entries:
                    adjacency_state_payload = self._get_child_value(adjacency_entry, "state")
                    if not isinstance(adjacency_state_payload, dict):
                        adjacency_state_payload = adjacency_entry
                    remote_system_id = self._get_child_value(
                        adjacency_entry,
                        "system-id",
                        "neighbor-system-id",
                    )
                    if remote_system_id is None:
                        remote_system_id = self._get_child_value(
                            adjacency_state_payload,
                            "system-id",
                            "neighbor-system-id",
                        )
                    remote_hostname = self._get_child_value(
                        adjacency_state_payload,
                        "oper-hostname",
                        "hostname",
                        "neighbor-hostname",
                        "system-name",
                    )
                    adjacency_state = self._get_child_value(
                        adjacency_state_payload,
                        "oper-state",
                        "adjacency-state",
                        "state",
                    )
                    level = self._get_child_value(adjacency_state_payload, "level")
                    if level is None:
                        level = interface_level
                    last_change = self._get_child_value(
                        adjacency_state_payload,
                        "last-state-change",
                        "last-change",
                    )
                    observations.append(
                        IgpAdjacencyObservation(
                            protocol="isis",
                            local_interface_name=str(interface_name) if interface_name else None,
                            local_instance=str(instance_id) if instance_id else None,
                            local_level=str(level) if level else None,
                            local_system_id=str(local_system_id) if local_system_id else None,
                            remote_system_id=str(remote_system_id) if remote_system_id else None,
                            remote_hostname=str(remote_hostname) if remote_hostname else None,
                            adjacency_state=str(adjacency_state) if adjacency_state else None,
                            state_strength=self._classify_igp_state_strength(
                                "isis",
                                str(adjacency_state) if adjacency_state else None,
                            ),
                            last_change_at=str(last_change) if last_change else None,
                            source_path=source_path,
                            notes=[],
                        )
                    )

        if observations:
            return observations, "adjacencies_visible", [
                f"IS-IS returned {len(observations)} adjacency row(s).",
            ]
        if saw_adjacency_container or saw_root:
            return [], "enabled_no_adjacencies", [
                "IS-IS state is reachable, but no adjacency rows were returned.",
            ]
        return [], "unknown", [
            "IS-IS subtree did not expose recognizable interface/adjacency payloads.",
        ]

    def _extract_policy_payloads(self, value: object) -> list[dict[str, object]]:
        """Extract likely static-policy payload dictionaries from a subtree value."""
        payloads: list[dict[str, object]] = []

        def normalized_keys(node: dict[str, object]) -> set[str]:
            return {key.split(":", 1)[-1] for key in node}

        def looks_like_policy(node: dict[str, object]) -> bool:
            keys = normalized_keys(node)
            return bool(
                {"policy-name", "endpoint", "color", "head-end"} & keys
                or "candidate-path" in keys
            )

        def walk(node: object) -> None:
            if isinstance(node, dict):
                if looks_like_policy(node):
                    payloads.append(node)
                    return
                for child in node.values():
                    walk(child)
                return
            if isinstance(node, list):
                for item in node:
                    walk(item)

        walk(value)
        return payloads

    def _extract_sr_path_payloads(self, value: object) -> list[dict[str, object]]:
        """Extract likely sr-path runtime dictionaries from a subtree value."""
        payloads: list[dict[str, object]] = []

        def normalized_keys(node: dict[str, object]) -> set[str]:
            return {key.split(":", 1)[-1] for key in node}

        def looks_like_runtime_path(node: dict[str, object]) -> bool:
            keys = normalized_keys(node)
            return bool(
                {"endpoint", "color", "owner", "preference"} <= keys
                and ({"active", "is-candidate-path-operational"} & keys)
            )

        def walk(node: object) -> None:
            if isinstance(node, dict):
                if looks_like_runtime_path(node):
                    payloads.append(node)
                    return
                for child in node.values():
                    walk(child)
                return
            if isinstance(node, list):
                for item in node:
                    walk(item)

        walk(value)
        return payloads

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
                observed_at=None,
                raw_data={
                    "management_address": target.management_address,
                    "role": target.role or "unknown",
                },
            )

        timestamps = [
            notification.get("timestamp")
            for notification in result.get("notification", [])
            if notification.get("timestamp") is not None
        ]
        observed_at = None
        if timestamps:
            observed_at = datetime.fromtimestamp(max(timestamps) / 1_000_000_000, tz=UTC)

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
            observed_at=observed_at,
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
        interfaces: list[TopologyObservedInterface] = []
        lldp_neighbors: list[LldpNeighborObservation] = []
        igp_adjacencies: list[IgpAdjacencyObservation] = []
        lldp_collection_status = "unknown"
        lldp_notes: list[str] = []
        igp_collection_status = "unknown"
        igp_notes: list[str] = []
        timestamps: list[int] = []
        collection_errors: list[str] = []

        for path in target.topology_paths:
            try:
                result = self._get_paths(target, [path])
            except Exception as exc:
                if "openconfig-lldp" in path:
                    lldp_collection_status, lldp_note = self._classify_lldp_query_error(exc)
                    lldp_notes.append(f"{path}: {lldp_note}")
                    if lldp_collection_status == "not_exposed":
                        (
                            fallback_neighbors,
                            fallback_status,
                            fallback_notes,
                        ) = self._collect_nokia_native_lldp_fallback(target)
                        if fallback_neighbors:
                            lldp_neighbors.extend(fallback_neighbors)
                        if fallback_status in {"neighbors_visible", "enabled_no_neighbors"}:
                            lldp_collection_status = fallback_status
                        lldp_notes.extend(fallback_notes)
                    continue
                if "/ospf" in path or "ospf" in path:
                    path_status, igp_note = self._classify_igp_query_error(exc)
                    igp_collection_status = self._prefer_collection_status(
                        igp_collection_status,
                        path_status,
                    )
                    igp_notes.append(f"{path}: {igp_note}")
                    continue
                if "/isis" in path or "isis" in path:
                    path_status, igp_note = self._classify_igp_query_error(exc)
                    igp_collection_status = self._prefer_collection_status(
                        igp_collection_status,
                        path_status,
                    )
                    igp_notes.append(f"{path}: {igp_note}")
                    continue
                collection_errors.append(f"{path}: {exc}")
                continue

            timestamps.extend(
                notification.get("timestamp")
                for notification in result.get("notification", [])
                if notification.get("timestamp") is not None
            )
            if "openconfig-lldp" in path:
                parsed_neighbors: list[LldpNeighborObservation] = []
                parsed_status = "enabled_no_neighbors"
                parsed_notes: list[str] = []
                for notification in result.get("notification", []):
                    for update in notification.get("update", []):
                        update_neighbors, update_status, update_notes = self._extract_openconfig_lldp_neighbors(
                            update.get("val"),
                            source_path=path,
                        )
                        parsed_neighbors.extend(update_neighbors)
                        parsed_status = update_status
                        parsed_notes.extend(update_notes)

                if parsed_neighbors:
                    lldp_neighbors.extend(parsed_neighbors)
                lldp_collection_status = parsed_status
                lldp_notes.extend(parsed_notes)
                continue

            if "/ospf" in path or "ospf" in path:
                parsed_adjacencies: list[IgpAdjacencyObservation] = []
                parsed_status = "enabled_no_adjacencies"
                parsed_notes: list[str] = []
                for notification in result.get("notification", []):
                    for update in notification.get("update", []):
                        update_adjacencies, update_status, update_notes = self._extract_ospf_adjacencies(
                            update.get("val"),
                            source_path=path,
                        )
                        parsed_adjacencies.extend(update_adjacencies)
                        parsed_status = self._prefer_collection_status(parsed_status, update_status)
                        parsed_notes.extend(update_notes)
                if parsed_adjacencies:
                    igp_adjacencies.extend(parsed_adjacencies)
                igp_collection_status = self._prefer_collection_status(
                    igp_collection_status,
                    parsed_status,
                )
                igp_notes.extend(parsed_notes)
                continue

            if "/isis" in path or "isis" in path:
                parsed_adjacencies = []
                parsed_status = "enabled_no_adjacencies"
                parsed_notes = []
                for notification in result.get("notification", []):
                    for update in notification.get("update", []):
                        update_adjacencies, update_status, update_notes = self._extract_isis_adjacencies(
                            update.get("val"),
                            source_path=path,
                        )
                        parsed_adjacencies.extend(update_adjacencies)
                        parsed_status = self._prefer_collection_status(parsed_status, update_status)
                        parsed_notes.extend(update_notes)
                if parsed_adjacencies:
                    igp_adjacencies.extend(parsed_adjacencies)
                igp_collection_status = self._prefer_collection_status(
                    igp_collection_status,
                    parsed_status,
                )
                igp_notes.extend(parsed_notes)
                continue

            if "openconfig-lldp" not in path:
                interfaces.extend(self._extract_interface_updates(result))
                continue

        observed_at = None
        if timestamps:
            observed_at = datetime.fromtimestamp(max(timestamps) / 1_000_000_000, tz=UTC)

        system_interface = next(
            (interface for interface in interfaces if interface.interface_name == "system"),
            None,
        )
        missing_fields = []
        if system_interface is None:
            missing_fields.append("system_interface")

        collection_status = "partial" if missing_fields or collection_errors else "success"
        if not interfaces and collection_errors:
            collection_status = "failure"

        collection_error_parts: list[str] = []
        if missing_fields:
            collection_error_parts.append("Missing topology fields: " + ", ".join(missing_fields))
        if collection_errors:
            collection_error_parts.append("Path failures: " + "; ".join(collection_errors))

        return TopologyRawRecord(
            target_name=target.name,
            vendor=target.vendor,
            platform_hint="sros",
            role=target.role,
            management_address=target.management_address,
            collection_status=collection_status,
            collection_error=" | ".join(collection_error_parts) if collection_error_parts else None,
            observed_at=observed_at,
            raw_interfaces=interfaces,
            raw_lldp_neighbors=lldp_neighbors,
            raw_igp_adjacencies=igp_adjacencies,
            lldp_collection_status=lldp_collection_status,
            lldp_notes=lldp_notes,
            igp_collection_status=igp_collection_status,
            igp_notes=igp_notes,
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
        """Collect live bounded SR policy counters and static-policy detail when present."""
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
        raw_policies: list[dict[str, object]] = []
        raw_runtime_paths: list[dict[str, object]] = []
        for notification in result.get("notification", []):
            for update in notification.get("update", []):
                value = update.get("val")
                path = str(update.get("path", ""))
                if isinstance(value, dict):
                    if path.endswith("segment-routing/sr-policies"):
                        sr_policy_counts.update(
                            {
                                key.split(":", 1)[-1]: int(count)
                                for key, count in value.items()
                                if isinstance(count, int)
                            }
                        )
                        raw_runtime_paths.extend(self._extract_sr_path_payloads(value))
                    if "static-policy" in path:
                        raw_policies.extend(self._extract_policy_payloads(value))
                    if "sr-path" in path:
                        raw_runtime_paths.extend(self._extract_sr_path_payloads(value))
                elif isinstance(value, list) and "static-policy" in path:
                    raw_policies.extend(self._extract_policy_payloads(value))
                elif isinstance(value, list) and "sr-path" in path:
                    raw_runtime_paths.extend(self._extract_sr_path_payloads(value))

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
            raw_policies=raw_policies,
            raw_runtime_paths=raw_runtime_paths,
        )
