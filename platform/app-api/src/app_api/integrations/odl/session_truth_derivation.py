"""Derive v2 session posture / evidence strength from native probes + v1 lane fetchers + YANG hints."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from app_api.integrations.odl.bgp_ls_topology import BgplsTopologyFetchResult
from app_api.integrations.odl.native_session_probes import NativeSessionProbeResult
from app_api.integrations.odl.netconf_lane import NetconfLaneFetchResult
from app_api.integrations.odl.network_topology_common import NetworkTopologyAggregateResult
from app_api.integrations.odl.pcep_lane import PcepLaneFetchResult


ProtocolExposurePosture = Literal["exposed", "not_exposed", "unknown"]
ObjectVisibilityPosture = Literal["objects_visible", "scope_only", "none_visible", "unknown"]
SessionPosture = Literal[
    "established",
    "not_observed",
    "degraded",
    "unknown",
    "unsupported",
    "unreachable",
]
EvidenceStrength = Literal[
    "session_backed",
    "object_backed",
    "scope_only",
    "heuristic_only",
    "unavailable",
]
DerivationMode = Literal[
    "protocol_native",
    "controller_object_parse",
    "topology_partition_heuristic",
    "supplemental_restconf",
    "unknown",
]


@dataclass(frozen=True)
class LaneTruthDerivation:
    """Intermediate derivation for one lane before Pydantic mapping."""

    lane_posture: str
    protocol_exposure_posture: ProtocolExposurePosture
    object_visibility_posture: ObjectVisibilityPosture
    session_posture: SessionPosture
    evidence_strength: EvidenceStrength
    derivation_mode: DerivationMode
    fallback_notes: list[str]


def _scope_only_bgp(snap: BgplsTopologyFetchResult) -> bool:
    nodes = snap.snapshot.nodes
    links = snap.snapshot.links
    if not nodes:
        return False
    scope_markers = sum(1 for n in nodes if getattr(n, "role", "") == "controller_topology_scope")
    return scope_markers > 0 and len(links) == 0


def derive_bgp_ls_truth(
    *,
    aggregate: NetworkTopologyAggregateResult,
    bgp: BgplsTopologyFetchResult,
    native: NativeSessionProbeResult,
    protocol_exposure_posture: ProtocolExposurePosture,
) -> LaneTruthDerivation:
    """BGP-LS lane: prefer native BGP tree; distinguish topology-only vs session hints."""
    fb: list[str] = list(native.notes)
    if aggregate.status == "unreachable":
        return LaneTruthDerivation(
            lane_posture="unreachable",
            protocol_exposure_posture="unknown",
            object_visibility_posture="unknown",
            session_posture="unreachable",
            evidence_strength="unavailable",
            derivation_mode="unknown",
            fallback_notes=["Network-topology aggregate unreachable."],
        )

    exposure = protocol_exposure_posture
    if exposure == "not_exposed":
        fb.append("No BGP/BGP-LS/BGPCEP family module name matched YANG catalog heuristics.")
    elif exposure == "unknown":
        fb.append("YANG module catalog unavailable; BGP-LS protocol exposure could not be confirmed.")

    snap = bgp.snapshot
    has_objects = bool(snap.nodes or snap.links)
    scope_only = _scope_only_bgp(bgp)

    if has_objects and not scope_only:
        obj_vis: ObjectVisibilityPosture = "objects_visible"
    elif scope_only:
        obj_vis = "scope_only"
    elif not has_objects:
        obj_vis = "none_visible"
    else:
        obj_vis = "unknown"

    if bgp.status == "unreachable":
        return LaneTruthDerivation(
            lane_posture="unreachable",
            protocol_exposure_posture=exposure,
            object_visibility_posture=obj_vis,
            session_posture="unreachable",
            evidence_strength="unavailable",
            derivation_mode="controller_object_parse",
            fallback_notes=fb + ["BGP-LS enrichment read unreachable."],
        )

    if exposure == "not_exposed" and native.payload is None and not has_objects:
        return LaneTruthDerivation(
            lane_posture="unsupported",
            protocol_exposure_posture=exposure,
            object_visibility_posture=obj_vis,
            session_posture="unsupported",
            evidence_strength="unavailable",
            derivation_mode="unknown",
            fallback_notes=fb
            + [
                "No BGP-LS module exposure, topology objects, or protocol-native session tree were observed.",
            ],
        )

    if exposure == "unknown" and native.payload is None and not has_objects:
        return LaneTruthDerivation(
            lane_posture="unknown",
            protocol_exposure_posture=exposure,
            object_visibility_posture=obj_vis,
            session_posture="unknown",
            evidence_strength="unavailable",
            derivation_mode="unknown",
            fallback_notes=fb + ["No BGP-LS objects were observed and protocol exposure could not be verified."],
        )

    if native.payload is not None and native.has_session_oper_hints:
        return LaneTruthDerivation(
            lane_posture="available" if has_objects else "partial",
            protocol_exposure_posture=exposure,
            object_visibility_posture=obj_vis,
            session_posture="established",
            evidence_strength="session_backed",
            derivation_mode="protocol_native",
            fallback_notes=fb + ["Protocol-native BGP tree contained session/oper hints (bounded scan)."],
        )
    if native.payload is not None:
        return LaneTruthDerivation(
            lane_posture="partial" if has_objects else "empty",
            protocol_exposure_posture=exposure,
            object_visibility_posture=obj_vis,
            session_posture="not_observed",
            evidence_strength="object_backed" if has_objects else "heuristic_only",
            derivation_mode="protocol_native",
            fallback_notes=fb + ["Protocol-native BGP tree readable without session/oper hints in bounded scan."],
        )
    if has_objects:
        return LaneTruthDerivation(
            lane_posture="partial" if scope_only else "available",
            protocol_exposure_posture=exposure,
            object_visibility_posture=obj_vis,
            session_posture="not_observed",
            evidence_strength="scope_only" if scope_only else "object_backed",
            derivation_mode="topology_partition_heuristic",
            fallback_notes=fb + ["No protocol-native BGP session tree; network-topology parse only."],
        )
    return LaneTruthDerivation(
        lane_posture="empty",
        protocol_exposure_posture=exposure,
        object_visibility_posture="none_visible",
        session_posture="not_observed",
        evidence_strength="unavailable",
        derivation_mode="topology_partition_heuristic",
        fallback_notes=fb + ["No BGP-LS objects in bounded parse; session not observed."],
    )


def derive_pcep_truth(
    *,
    aggregate: NetworkTopologyAggregateResult,
    pcep: PcepLaneFetchResult,
    native: NativeSessionProbeResult,
    protocol_exposure_posture: ProtocolExposurePosture,
) -> LaneTruthDerivation:
    fb: list[str] = list(native.notes)
    if aggregate.status == "unreachable":
        return LaneTruthDerivation(
            lane_posture="unreachable",
            protocol_exposure_posture="unknown",
            object_visibility_posture="unknown",
            session_posture="unreachable",
            evidence_strength="unavailable",
            derivation_mode="unknown",
            fallback_notes=["Aggregate unreachable."],
        )

    exposure = protocol_exposure_posture
    if exposure == "not_exposed":
        fb.append("No PCEP module name matched YANG catalog heuristics.")
    elif exposure == "unknown":
        fb.append("YANG module catalog unavailable; PCEP protocol exposure could not be confirmed.")

    has_obj = pcep.node_count > 0 or pcep.link_count > 0
    obj_vis: ObjectVisibilityPosture = (
        "objects_visible"
        if has_obj
        else ("scope_only" if pcep.topology_ids else ("none_visible" if pcep.posture == "empty" else "unknown"))
    )

    if exposure == "not_exposed" and native.payload is None and not has_obj and not pcep.topology_ids:
        return LaneTruthDerivation(
            lane_posture="unsupported",
            protocol_exposure_posture=exposure,
            object_visibility_posture=obj_vis,
            session_posture="unsupported",
            evidence_strength="unavailable",
            derivation_mode="unknown",
            fallback_notes=fb + ["No PCEP module exposure, lane objects, or native session tree were observed."],
        )

    if exposure == "unknown" and native.payload is None and not has_obj and not pcep.topology_ids:
        return LaneTruthDerivation(
            lane_posture="unknown",
            protocol_exposure_posture=exposure,
            object_visibility_posture=obj_vis,
            session_posture="unknown",
            evidence_strength="unavailable",
            derivation_mode="unknown",
            fallback_notes=fb + ["No PCEP objects were observed and protocol exposure could not be verified."],
        )

    if native.payload is not None and native.has_session_oper_hints:
        return LaneTruthDerivation(
            lane_posture="available",
            protocol_exposure_posture=exposure,
            object_visibility_posture=obj_vis,
            session_posture="established",
            evidence_strength="session_backed",
            derivation_mode="protocol_native",
            fallback_notes=fb + ["PCEP native tree shows session/oper hints (bounded scan)."],
        )
    if native.payload is not None:
        return LaneTruthDerivation(
            lane_posture="partial",
            protocol_exposure_posture=exposure,
            object_visibility_posture=obj_vis,
            session_posture="not_observed",
            evidence_strength="object_backed" if has_obj else "heuristic_only",
            derivation_mode="protocol_native",
            fallback_notes=fb + ["PCEP native data without session hints in bounded scan."],
        )
    if pcep.synchronized_node_count > 0:
        return LaneTruthDerivation(
            lane_posture="available",
            protocol_exposure_posture=exposure,
            object_visibility_posture=obj_vis,
            session_posture="established",
            evidence_strength="session_backed",
            derivation_mode="controller_object_parse",
            fallback_notes=fb
            + [
                f"PCEP topology exposed {pcep.synchronized_node_count} PCC node row(s) with state-sync=synchronized.",
            ],
        )
    return LaneTruthDerivation(
        lane_posture=pcep.posture,
        protocol_exposure_posture=exposure,
        object_visibility_posture=obj_vis,
        session_posture="not_observed",
        evidence_strength=(
            "heuristic_only"
            if has_obj
            else ("scope_only" if pcep.topology_ids else "unavailable")
        ),
        derivation_mode="topology_partition_heuristic",
        fallback_notes=fb + ["PCEP lane uses network-topology partition; native PCEP session tree unavailable."],
    )


def derive_netconf_truth(
    *,
    aggregate: NetworkTopologyAggregateResult,
    netconf: NetconfLaneFetchResult,
    native: NativeSessionProbeResult,
    protocol_exposure_posture: ProtocolExposurePosture,
) -> LaneTruthDerivation:
    fb: list[str] = list(native.notes)
    if aggregate.status == "unreachable":
        return LaneTruthDerivation(
            lane_posture="unreachable",
            protocol_exposure_posture="unknown",
            object_visibility_posture="unknown",
            session_posture="unreachable",
            evidence_strength="unavailable",
            derivation_mode="unknown",
            fallback_notes=["Aggregate unreachable."],
        )

    exposure = protocol_exposure_posture
    if exposure == "not_exposed":
        fb.append("No NETCONF topology module name matched YANG catalog heuristics.")
    elif exposure == "unknown":
        fb.append("YANG module catalog unavailable; NETCONF protocol exposure could not be confirmed.")

    has_obj = netconf.node_count > 0 or netconf.link_count > 0 or (netconf.netconf_connector_node_count or 0) > 0
    obj_vis: ObjectVisibilityPosture = (
        "objects_visible" if has_obj else ("scope_only" if netconf.topology_ids else "none_visible")
    )

    if (
        exposure == "not_exposed"
        and native.payload is None
        and not has_obj
        and not netconf.topology_ids
    ):
        return LaneTruthDerivation(
            lane_posture="unsupported",
            protocol_exposure_posture=exposure,
            object_visibility_posture=obj_vis,
            session_posture="unsupported",
            evidence_strength="unavailable",
            derivation_mode="unknown",
            fallback_notes=fb + ["No NETCONF module exposure, managed-node objects, or native session tree were observed."],
        )

    if exposure == "unknown" and native.payload is None and not has_obj and not netconf.topology_ids:
        return LaneTruthDerivation(
            lane_posture="unknown",
            protocol_exposure_posture=exposure,
            object_visibility_posture=obj_vis,
            session_posture="unknown",
            evidence_strength="unavailable",
            derivation_mode="unknown",
            fallback_notes=fb + ["No NETCONF objects were observed and protocol exposure could not be verified."],
        )

    if native.payload is not None and native.has_session_oper_hints:
        return LaneTruthDerivation(
            lane_posture="available",
            protocol_exposure_posture=exposure,
            object_visibility_posture=obj_vis,
            session_posture="established",
            evidence_strength="session_backed",
            derivation_mode="protocol_native",
            fallback_notes=fb + ["NETCONF native tree shows connector/session hints (bounded scan)."],
        )
    if native.payload is not None:
        mode: DerivationMode = "supplemental_restconf" if netconf.netconf_connector_node_count else "protocol_native"
        return LaneTruthDerivation(
            lane_posture="partial",
            protocol_exposure_posture=exposure,
            object_visibility_posture=obj_vis,
            session_posture="not_observed",
            evidence_strength="object_backed" if has_obj else "heuristic_only",
            derivation_mode=mode,
            fallback_notes=fb + ["NETCONF native data without session hints in bounded scan."],
        )
    if netconf.netconf_connector_node_count is not None and netconf.netconf_connector_node_count > 0:
        return LaneTruthDerivation(
            lane_posture="partial",
            protocol_exposure_posture=exposure,
            object_visibility_posture=obj_vis,
            session_posture="not_observed",
            evidence_strength="object_backed",
            derivation_mode="supplemental_restconf",
            fallback_notes=fb + ["Connector inventory visible; connection state not confirmed in bounded scan."],
        )
    return LaneTruthDerivation(
        lane_posture=netconf.posture,
        protocol_exposure_posture=exposure,
        object_visibility_posture=obj_vis,
        session_posture="not_observed",
        evidence_strength=(
            "heuristic_only"
            if has_obj
            else ("scope_only" if netconf.topology_ids else "unavailable")
        ),
        derivation_mode="topology_partition_heuristic",
        fallback_notes=fb + ["NETCONF lane uses topology partition/heuristics; native connector session tree unavailable."],
    )
