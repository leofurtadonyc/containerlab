"""Topology normalization helpers."""

from datetime import datetime
from itertools import chain
from typing import Literal, cast

from gnmi_collector.models.topology import (
    IgpAdjacencyObservation,
    LldpNeighborObservation,
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


def _normalize_identity(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip().lower()
    if not normalized:
        return None
    return normalized.split(".", maxsplit=1)[0]


def _normalize_protocol_identity(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip().lower()
    return normalized or None


def _normalize_interface_token(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = "".join(ch for ch in value.strip().lower() if ch.isalnum())
    return normalized or None


def _resolve_lldp_remote_node(
    observation: LldpNeighborObservation,
    *,
    raw_records: list[TopologyRawRecord],
) -> str | None:
    by_name = {
        _normalize_identity(record.target_name): record.target_name
        for record in raw_records
        if _normalize_identity(record.target_name) is not None
    }
    by_management = {
        _normalize_identity(record.management_address): record.target_name
        for record in raw_records
        if _normalize_identity(record.management_address) is not None
    }
    remote_name_key = _normalize_identity(observation.remote_system_name)
    if remote_name_key and remote_name_key in by_name:
        return by_name[remote_name_key]
    remote_management_key = _normalize_identity(observation.remote_management_address)
    if remote_management_key and remote_management_key in by_management:
        return by_management[remote_management_key]
    return None


def _resolve_remote_interface(
    remote_node_id: str,
    observation: LldpNeighborObservation,
    *,
    interfaces_by_node: dict[str, list[str]],
) -> str | None:
    candidates = {
        _normalize_interface_token(observation.remote_interface_name),
        _normalize_interface_token(observation.remote_port_id),
        _normalize_interface_token(observation.remote_port_description),
    }
    candidates.discard(None)
    if not candidates:
        return None
    for interface_name in interfaces_by_node.get(remote_node_id, []):
        if _normalize_interface_token(interface_name) in candidates:
            return interface_name
    return None


def _resolve_igp_remote_node(
    observation: IgpAdjacencyObservation,
    *,
    by_name: dict[str, str],
    ospf_router_id_to_node: dict[str, str],
    isis_system_id_to_node: dict[str, str],
) -> str | None:
    if observation.protocol == "ospf":
        remote_router_id = _normalize_protocol_identity(observation.remote_router_id)
        if remote_router_id and remote_router_id in ospf_router_id_to_node:
            return ospf_router_id_to_node[remote_router_id]
        remote_hostname = _normalize_identity(observation.remote_hostname)
        if remote_hostname and remote_hostname in by_name:
            return by_name[remote_hostname]
        return None

    remote_hostname = _normalize_identity(observation.remote_hostname)
    if remote_hostname and remote_hostname in by_name:
        return by_name[remote_hostname]
    remote_system_id = _normalize_protocol_identity(observation.remote_system_id)
    if remote_system_id and remote_system_id in isis_system_id_to_node:
        return isis_system_id_to_node[remote_system_id]
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
) -> tuple[
    list[NormalizedTopologyLinkRecord],
    int,
    int,
    int,
    int,
    int,
    int,
    int,
    int,
    int,
    int,
    int,
    int,
    int,
]:
    """Infer normalized link records from interface evidence and correlate LLDP + IGP observations."""
    known_targets = {record.target_name for record in raw_records}
    evidence: dict[tuple[str, str], list[tuple[str, str, str]]] = {}
    interfaces_by_node = {
        record.target_name: [interface.interface_name for interface in record.raw_interfaces]
        for record in raw_records
    }
    interface_state_by_endpoint = {
        (record.target_name, interface.interface_name): _map_oper_state(interface.oper_state)
        for record in raw_records
        for interface in record.raw_interfaces
    }
    inferred_peer_by_endpoint: dict[tuple[str, str], str] = {}
    by_name = {
        _normalize_identity(record.target_name): record.target_name
        for record in raw_records
        if _normalize_identity(record.target_name) is not None
    }
    ospf_router_id_to_node: dict[str, str] = {}
    isis_system_id_to_node: dict[str, str] = {}

    for record in raw_records:
        for observation in record.raw_igp_adjacencies:
            if observation.local_router_id:
                ospf_router_id_to_node.setdefault(
                    _normalize_protocol_identity(observation.local_router_id) or "",
                    record.target_name,
                )
            if observation.local_system_id:
                isis_system_id_to_node.setdefault(
                    _normalize_protocol_identity(observation.local_system_id) or "",
                    record.target_name,
                )
    ospf_router_id_to_node = {key: value for key, value in ospf_router_id_to_node.items() if key}
    isis_system_id_to_node = {key: value for key, value in isis_system_id_to_node.items() if key}

    for record in raw_records:
        for interface in record.raw_interfaces:
            peer_name = _extract_peer_name(interface.interface_name, known_targets)
            if peer_name is None or peer_name == record.target_name:
                continue
            pair = tuple(sorted((record.target_name, peer_name)))
            inferred_peer_by_endpoint[(record.target_name, interface.interface_name)] = peer_name
            evidence.setdefault(pair, []).append(
                (
                    record.target_name,
                    interface.interface_name,
                    _map_oper_state(interface.oper_state),
                )
            )

    lldp_by_pair: dict[tuple[str, str], list[tuple[str, LldpNeighborObservation, list[str]]]] = {}
    igp_by_pair: dict[tuple[str, str], list[tuple[str, IgpAdjacencyObservation, list[str]]]] = {}
    total_lldp_observations = sum(len(record.raw_lldp_neighbors) for record in raw_records)
    total_igp_observations = sum(len(record.raw_igp_adjacencies) for record in raw_records)
    ospf_observation_count = sum(
        1
        for record in raw_records
        for observation in record.raw_igp_adjacencies
        if observation.protocol == "ospf"
    )
    isis_observation_count = total_igp_observations - ospf_observation_count
    for record in raw_records:
        for observation in record.raw_lldp_neighbors:
            notes = list(observation.notes)
            remote_node_id = _resolve_lldp_remote_node(observation, raw_records=raw_records)
            inferred_peer = inferred_peer_by_endpoint.get((record.target_name, observation.local_interface_name))
            if remote_node_id is None:
                notes.append("LLDP remote system could not be correlated to a known topology node.")
                if inferred_peer is None:
                    continue
                remote_node_id = inferred_peer
            elif inferred_peer is not None and inferred_peer != remote_node_id:
                notes.append(
                    f"LLDP remote system resolved to {remote_node_id}, which differs from the interface-derived peer {inferred_peer}."
                )
                remote_node_id = inferred_peer

            remote_interface_name = _resolve_remote_interface(
                remote_node_id,
                observation,
                interfaces_by_node=interfaces_by_node,
            )
            if remote_interface_name is None and observation.remote_port_id:
                notes.append(
                    f"LLDP remote port {observation.remote_port_id} could not be matched to a known interface on {remote_node_id}."
                )

            pair = tuple(sorted((record.target_name, remote_node_id)))
            lldp_by_pair.setdefault(pair, []).append((record.target_name, observation, notes))
        for observation in record.raw_igp_adjacencies:
            notes = list(observation.notes)
            inferred_peer = None
            if observation.local_interface_name:
                inferred_peer = inferred_peer_by_endpoint.get(
                    (record.target_name, observation.local_interface_name)
                )
            remote_node_id = _resolve_igp_remote_node(
                observation,
                by_name=by_name,
                ospf_router_id_to_node=ospf_router_id_to_node,
                isis_system_id_to_node=isis_system_id_to_node,
            )
            if remote_node_id is None:
                notes.append(
                    "IGP remote identity could not be confidently correlated to a known topology node."
                )
                if inferred_peer is None:
                    continue
                remote_node_id = inferred_peer
            elif inferred_peer is not None and inferred_peer != remote_node_id:
                notes.append(
                    f"IGP remote identity resolved to {remote_node_id}, which differs from the interface-derived peer {inferred_peer}."
                )
                remote_node_id = inferred_peer
            pair = tuple(sorted((record.target_name, remote_node_id)))
            igp_by_pair.setdefault(pair, []).append((record.target_name, observation, notes))

    links: list[NormalizedTopologyLinkRecord] = []
    paired_link_count = 0
    single_sided_link_count = 0
    lldp_correlated_link_count = 0
    lldp_single_sided_link_count = 0
    lldp_bidirectional_link_count = 0
    lldp_mismatch_link_count = 0
    igp_correlated_link_count = 0
    igp_confirmed_link_count = 0
    igp_protocol_mismatch_link_count = 0
    all_pairs = sorted(set(evidence) | set(lldp_by_pair) | set(igp_by_pair))
    status_by_node = {record.target_name: record.lldp_collection_status for record in raw_records}
    igp_status_by_node = {record.target_name: record.igp_collection_status for record in raw_records}

    for source_node_id, target_node_id in all_pairs:
        endpoint_evidence = evidence.get((source_node_id, target_node_id), [])
        lldp_evidence = lldp_by_pair.get((source_node_id, target_node_id), [])
        igp_evidence = igp_by_pair.get((source_node_id, target_node_id), [])
        endpoint_evidence_count = len(endpoint_evidence)
        states = {item[2] for item in endpoint_evidence}
        if endpoint_evidence_count == 0 and lldp_evidence:
            endpoint_evidence_count = min(2, len({item[0] for item in lldp_evidence}))
            states = {
                interface_state_by_endpoint.get(
                    (observer, observation.local_interface_name),
                    "unknown",
                )
                for observer, observation, _ in lldp_evidence
            }
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

        lldp_observation_count = len(lldp_evidence)
        lldp_local_interfaces = sorted(
            {observation.local_interface_name for _observer, observation, _notes in lldp_evidence}
        )
        lldp_remote_systems = sorted(
            {
                observation.remote_system_name
                for _observer, observation, _notes in lldp_evidence
                if observation.remote_system_name
            }
        )
        lldp_remote_ports = sorted(
            {
                value
                for _observer, observation, _notes in lldp_evidence
                for value in (observation.remote_port_id, observation.remote_port_description)
                if value
            }
        )
        lldp_notes = sorted(
            {
                note
                for _observer, _observation, notes in lldp_evidence
                for note in notes
                if note
            }
        )
        observer_count = len({observer for observer, _observation, _notes in lldp_evidence})
        if lldp_observation_count > 0:
            lldp_correlated_link_count += 1
            if any("differs from the interface-derived peer" in note for note in lldp_notes):
                physical_adjacency_posture = "lldp_mismatch"
                lldp_mismatch_link_count += 1
            elif observer_count >= 2:
                physical_adjacency_posture = "bidirectional_lldp"
                lldp_bidirectional_link_count += 1
            else:
                physical_adjacency_posture = "single_sided_lldp"
                lldp_single_sided_link_count += 1
        elif any(
            status_by_node.get(node_id) in {"not_exposed", "query_failed", "unknown"}
            for node_id in (source_node_id, target_node_id)
        ):
            physical_adjacency_posture = "suppressed_or_unknown"
        else:
            physical_adjacency_posture = "not_observed"

        igp_adjacency_observation_count = len(igp_evidence)
        igp_local_interfaces = sorted(
            {
                observation.local_interface_name
                for _observer, observation, _notes in igp_evidence
                if observation.local_interface_name
            }
        )
        igp_remote_identities = sorted(
            {
                value
                for _observer, observation, _notes in igp_evidence
                for value in (
                    observation.remote_hostname,
                    observation.remote_router_id,
                    observation.remote_system_id,
                )
                if value
            }
        )
        igp_notes = sorted(
            {
                note
                for _observer, _observation, notes in igp_evidence
                for note in notes
                if note
            }
        )
        igp_protocols_observed = sorted(
            {observation.protocol for _observer, observation, _notes in igp_evidence}
        )
        ospf_states = sorted(
            {
                observation.adjacency_state
                for _observer, observation, _notes in igp_evidence
                if observation.protocol == "ospf" and observation.adjacency_state
            }
        )
        isis_states = sorted(
            {
                observation.adjacency_state
                for _observer, observation, _notes in igp_evidence
                if observation.protocol == "isis" and observation.adjacency_state
            }
        )
        strong_igp = any(
            observation.state_strength == "strong"
            for _observer, observation, _notes in igp_evidence
        )
        if igp_adjacency_observation_count > 0:
            igp_correlated_link_count += 1
            if any("differs from the interface-derived peer" in note for note in igp_notes):
                control_plane_adjacency_posture = "protocol_mismatch"
                igp_protocol_mismatch_link_count += 1
            elif strong_igp:
                control_plane_adjacency_posture = "igp_confirmed"
                igp_confirmed_link_count += 1
            elif igp_protocols_observed == ["ospf"]:
                control_plane_adjacency_posture = "ospf_observed"
            elif igp_protocols_observed == ["isis"]:
                control_plane_adjacency_posture = "isis_observed"
            else:
                control_plane_adjacency_posture = "unknown"
        elif any(
            igp_status_by_node.get(node_id) in {"not_exposed", "query_failed", "unknown"}
            for node_id in (source_node_id, target_node_id)
        ):
            control_plane_adjacency_posture = "suppressed_or_unknown"
        else:
            control_plane_adjacency_posture = "not_observed"

        if endpoint_evidence and lldp_observation_count:
            inference_method = "interface_name_and_oper_state_plus_openconfig_lldp"
            knowledge_state = "partially_confirmed"
        elif endpoint_evidence and igp_adjacency_observation_count:
            inference_method = "interface_name_and_oper_state_plus_device_native_igp"
            knowledge_state = "partially_confirmed"
        elif lldp_observation_count:
            inference_method = "openconfig_lldp_gnmi"
            knowledge_state = "observed"
        elif igp_adjacency_observation_count:
            inference_method = "device_native_igp_gnmi"
            knowledge_state = "observed"
        else:
            inference_method = "interface_name_and_oper_state"
            knowledge_state = "partial"

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
                physical_adjacency_posture=cast(
                    Literal[
                        "not_observed",
                        "single_sided_lldp",
                        "bidirectional_lldp",
                        "lldp_mismatch",
                        "suppressed_or_unknown",
                    ],
                    physical_adjacency_posture,
                ),
                control_plane_adjacency_posture=cast(
                    Literal[
                        "not_observed",
                        "ospf_observed",
                        "isis_observed",
                        "igp_confirmed",
                        "protocol_mismatch",
                        "suppressed_or_unknown",
                        "unknown",
                    ],
                    control_plane_adjacency_posture,
                ),
                lldp_observation_count=lldp_observation_count,
                lldp_bidirectional=observer_count >= 2 and physical_adjacency_posture == "bidirectional_lldp",
                lldp_local_interfaces=lldp_local_interfaces,
                lldp_remote_systems=lldp_remote_systems,
                lldp_remote_ports=lldp_remote_ports,
                lldp_correlation_notes=lldp_notes,
                igp_adjacency_observation_count=igp_adjacency_observation_count,
                igp_protocols_observed=cast(list[Literal["ospf", "isis"]], igp_protocols_observed),
                ospf_adjacency_state=", ".join(ospf_states) if ospf_states else None,
                isis_adjacency_state=", ".join(isis_states) if isis_states else None,
                igp_local_interfaces=igp_local_interfaces,
                igp_remote_identities=igp_remote_identities,
                igp_correlation_notes=igp_notes,
                attributes={
                    "knowledge_state": knowledge_state,
                    "inference_method": inference_method,
                    "endpoint_evidence_count": str(endpoint_evidence_count),
                    "endpoint_pairing_state": endpoint_pairing_state,
                    "physical_adjacency_posture": physical_adjacency_posture,
                    "control_plane_adjacency_posture": control_plane_adjacency_posture,
                    "lldp_observation_count": str(lldp_observation_count),
                    "igp_adjacency_observation_count": str(igp_adjacency_observation_count),
                    "igp_protocols_observed": ", ".join(igp_protocols_observed),
                    "observed_interfaces": ", ".join(
                        f"{node}:{interface_name}" for node, interface_name, _ in endpoint_evidence
                    )
                    if endpoint_evidence
                    else ", ".join(
                        f"{observer}:{observation.local_interface_name}"
                        for observer, observation, _notes in lldp_evidence
                    ),
                },
            )
        )

    return (
        links,
        paired_link_count,
        single_sided_link_count,
        total_lldp_observations,
        lldp_correlated_link_count,
        lldp_single_sided_link_count,
        lldp_bidirectional_link_count,
        lldp_mismatch_link_count,
        total_igp_observations,
        ospf_observation_count,
        isis_observation_count,
        igp_correlated_link_count,
        igp_confirmed_link_count,
        igp_protocol_mismatch_link_count,
    )


def derive_node_participation_counts(
    normalized_nodes: list[NormalizedTopologyNodeRecord],
    normalized_links: list[NormalizedTopologyLinkRecord],
) -> tuple[int, int]:
    """Count how many observed nodes are represented by at least one emitted link."""
    linked_node_ids = {
        node_id
        for link in normalized_links
        for node_id in (link.source_node_id, link.target_node_id)
    }
    linked_node_count = sum(
        1 for node in normalized_nodes if node.node_id in linked_node_ids
    )
    isolated_node_count = max(0, len(normalized_nodes) - linked_node_count)
    return linked_node_count, isolated_node_count


def derive_topology_observed_at(raw_records: list[TopologyRawRecord]) -> datetime | None:
    """Return the newest observed timestamp present in the raw records."""
    observed_timestamps = [
        record.observed_at for record in raw_records if record.observed_at is not None
    ]
    if not observed_timestamps:
        return None
    return max(observed_timestamps)
