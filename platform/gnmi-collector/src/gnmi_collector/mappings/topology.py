"""Topology normalization helpers."""

from datetime import datetime
from typing import Literal, cast

from gnmi_collector.models.topology import (
    NormalizedTopologyLinkRecord,
    NormalizedTopologyNodeRecord,
    TopologyRawRecord,
)


def _map_oper_state(value: str) -> str:
    """Map a Nokia interface operational state into the platform topology state."""
    normalized = value.strip().lower()
    if normalized == "up":
        return "up"
    if normalized in {"down", "lower-layer-down"}:
        return "down"
    if normalized:
        return "degraded"
    return "unknown"


def _topology_state(value: str) -> Literal["up", "down", "degraded", "unknown"]:
    """Cast a mapped topology state into the constrained normalized type."""
    return cast(Literal["up", "down", "degraded", "unknown"], value)


def _extract_peer_name(interface_name: str, known_targets: set[str]) -> str | None:
    """Infer a peer device name from the interface naming convention."""
    if not interface_name.startswith("to-"):
        return None

    peer_name = interface_name.removeprefix("to-")
    if peer_name in known_targets:
        return peer_name

    trimmed_peer_name = peer_name.split("-vlan", maxsplit=1)[0]
    if trimmed_peer_name in known_targets:
        return trimmed_peer_name

    return None


def map_topology_nodes(raw_records: list[TopologyRawRecord]) -> list[NormalizedTopologyNodeRecord]:
    """Map raw per-target topology evidence into normalized node records."""
    nodes: list[NormalizedTopologyNodeRecord] = []
    for record in raw_records:
        system_interface = next(
            (interface for interface in record.raw_interfaces if interface.interface_name == "system"),
            None,
        )
        if record.collection_status == "failure":
            state = "unknown"
        elif record.collection_status == "partial":
            state = "degraded"
        elif system_interface is not None:
            state = _map_oper_state(system_interface.oper_state)
        else:
            state = "unknown"

        nodes.append(
            NormalizedTopologyNodeRecord(
                node_id=record.target_name,
                display_name=record.target_name,
                role=record.role or "unknown",
                state=_topology_state(state),
                source="gnmi",
                device_id=record.target_name,
                attributes={
                    "vendor": record.vendor,
                    "platform_hint": record.platform_hint,
                    "management_address": record.management_address,
                    "loopback_ipv4": system_interface.ipv4_address if system_interface and system_interface.ipv4_address else "unknown",
                },
            )
        )
    return nodes


def map_topology_links(
    raw_records: list[TopologyRawRecord],
) -> tuple[list[NormalizedTopologyLinkRecord], int, int]:
    """Infer normalized link records from live interface evidence."""
    known_targets = {record.target_name for record in raw_records}
    evidence: dict[tuple[str, str], list[tuple[str, str, str]]] = {}

    for record in raw_records:
        for interface in record.raw_interfaces:
            peer_name = _extract_peer_name(interface.interface_name, known_targets)
            if peer_name is None or peer_name == record.target_name:
                continue
            pair = tuple(sorted((record.target_name, peer_name)))
            evidence.setdefault(pair, []).append(
                (
                    record.target_name,
                    interface.interface_name,
                    _map_oper_state(interface.oper_state),
                )
            )

    links: list[NormalizedTopologyLinkRecord] = []
    paired_link_count = 0
    single_sided_link_count = 0
    for source_node_id, target_node_id in sorted(evidence):
        endpoint_evidence = evidence[(source_node_id, target_node_id)]
        endpoint_evidence_count = len(endpoint_evidence)
        states = {item[2] for item in endpoint_evidence}
        if endpoint_evidence_count < 2:
            state = "degraded"
            endpoint_pairing_state = "single_sided"
            single_sided_link_count += 1
        elif states == {"up"}:
            state = "up"
            endpoint_pairing_state = "paired"
            paired_link_count += 1
        elif states == {"down"}:
            state = "down"
            endpoint_pairing_state = "paired"
            paired_link_count += 1
        elif "up" in states or "degraded" in states:
            state = "degraded"
            endpoint_pairing_state = "paired"
            paired_link_count += 1
        else:
            state = "unknown"
            endpoint_pairing_state = "paired"
            paired_link_count += 1

        links.append(
            NormalizedTopologyLinkRecord(
                link_id=f"{source_node_id}--{target_node_id}",
                source_node_id=source_node_id,
                target_node_id=target_node_id,
                state=_topology_state(state),
                source="gnmi",
                endpoint_pairing_state=cast(
                    Literal["paired", "single_sided", "unknown"], endpoint_pairing_state
                ),
                endpoint_evidence_count=endpoint_evidence_count,
                attributes={
                    "knowledge_state": "partial",
                    "inference_method": "interface_name_and_oper_state",
                    "endpoint_evidence_count": str(endpoint_evidence_count),
                    "endpoint_pairing_state": endpoint_pairing_state,
                    "observed_interfaces": ", ".join(
                        f"{node}:{interface_name}" for node, interface_name, _ in endpoint_evidence
                    ),
                },
            )
        )

    return links, paired_link_count, single_sided_link_count


def derive_topology_observed_at(raw_records: list[TopologyRawRecord]) -> datetime | None:
    """Return the newest observed timestamp present in the raw records."""
    observed_timestamps = [
        record.observed_at for record in raw_records if record.observed_at is not None
    ]
    if not observed_timestamps:
        return None
    return max(observed_timestamps)
