"""Controller southbound session truth v2 — aggregate BGP-LS, PCEP, NETCONF lanes with explicit session semantics."""

from __future__ import annotations

import time
from datetime import UTC, datetime
from typing import Literal
from uuid import uuid4

from sqlalchemy.exc import OperationalError

from app_api.config.settings import get_settings
from app_api.integrations.odl.bgp_ls_topology import fetch_bgpls_topology_via_odl
from app_api.integrations.odl.client import get_odl_client
from app_api.integrations.odl.native_session_probes import (
    probe_bgp_ls_native,
    probe_netconf_native,
    probe_pcep_native,
)
from app_api.integrations.odl.netconf_lane import summarize_netconf_lane
from app_api.integrations.odl.network_topology_common import fetch_network_topology_aggregate
from app_api.integrations.odl.pcep_lane import summarize_pcep_lane
from app_api.integrations.odl.session_truth_derivation import (
    derive_bgp_ls_truth,
    derive_netconf_truth,
    derive_pcep_truth,
)
from app_api.integrations.odl.yang_module_catalog import fetch_yang_module_names, module_hints_for_lanes
from app_api.metrics.state import record_controller_evidence_v2_observation
from app_api.persistence.session import create_session
from app_api.persistence.tables import ControllerEvidenceSnapshotTable
from app_api.schemas.controller_evidence import (
    CONTROLLER_SOUTHBOUND_SESSION_TRUTH_V2_CONTRACT_ID,
    BgpLsLaneOnlyResponse,
    ControllerEvidenceResponse,
    ControllerEvidenceSafetyFramingV2,
    NetconfLaneOnlyResponse,
    PcepLaneOnlyResponse,
    ProtocolLaneDetailV2,
    ProtocolLanePosture,
)

_metadata_phase = "phase_2_read_only_foundation"


def _utcnow() -> datetime:
    return datetime.now(UTC)


def _cast_lane_posture(p: str) -> ProtocolLanePosture:
    allowed: set[ProtocolLanePosture] = {
        "available",
        "partial",
        "empty",
        "degraded",
        "unreachable",
        "unsupported",
        "unknown",
    }
    if p in allowed:
        return p  # type: ignore[return-value]
    return "unknown"


def _reachability_from_observation(state: str) -> Literal["ok", "degraded", "unreachable", "unknown"]:
    if state in ("ok", "degraded", "unreachable", "unknown"):
        return state  # type: ignore[return-value]
    return "unknown"


def _lane_v2(
    lane_id: Literal["bgp_ls", "pcep", "netconf"],
    *,
    observed_source: str,
    topology_ids: list[str],
    fingerprint: str,
    base_notes: list[str],
    node_count: int,
    link_count: int,
    d,
) -> ProtocolLaneDetailV2:
    return ProtocolLaneDetailV2(
        lane_id=lane_id,
        lane_posture=_cast_lane_posture(d.lane_posture),
        protocol_exposure_posture=d.protocol_exposure_posture,
        object_visibility_posture=d.object_visibility_posture,
        session_posture=d.session_posture,  # type: ignore[arg-type]
        evidence_strength=d.evidence_strength,  # type: ignore[arg-type]
        derivation_mode=d.derivation_mode,  # type: ignore[arg-type]
        observed_source=observed_source,
        node_count=node_count,
        link_count=link_count,
        topology_ids=topology_ids,
        fingerprint=fingerprint,
        notes=base_notes,
        fallback_notes=list(d.fallback_notes),
        explicit_non_claims=[
            "Lane evidence is controller-exported only; not dataplane or forwarding truth.",
            "RESTCONF reachability and YANG module registration do not prove every southbound session is healthy.",
        ],
    )


def build_controller_evidence_response() -> ControllerEvidenceResponse:
    """Aggregate read: YANG catalog + native probes + shared aggregate + v1 parsers + v2 derivation."""
    t0 = time.perf_counter()
    settings = get_settings()
    client = get_odl_client()
    obs = client.read_controller_observation()
    reach = _reachability_from_observation(obs.observation_state)

    module_names, yang_notes = fetch_yang_module_names(client)
    hints = module_hints_for_lanes(module_names)

    aggregate = fetch_network_topology_aggregate(client)
    bgp = fetch_bgpls_topology_via_odl(client, preloaded_aggregate=aggregate)
    pcep = summarize_pcep_lane(aggregate)
    netconf = summarize_netconf_lane(aggregate, client=client)

    bgp_native = probe_bgp_ls_native(client)
    pcep_native = probe_pcep_native(client)
    netconf_native = probe_netconf_native(client)

    d_bgp = derive_bgp_ls_truth(
        aggregate=aggregate,
        bgp=bgp,
        native=bgp_native,
        module_family_exposed=hints["bgp_ls_family"],
    )
    d_pcep = derive_pcep_truth(
        aggregate=aggregate,
        pcep=pcep,
        native=pcep_native,
        module_family_exposed=hints["pcep_family"],
    )
    d_nc = derive_netconf_truth(
        aggregate=aggregate,
        netconf=netconf,
        native=netconf_native,
        module_family_exposed=hints["netconf_family"],
    )

    snap = bgp.snapshot
    bg_lane = _lane_v2(
        "bgp_ls",
        observed_source=bgp.observed_source,
        topology_ids=sorted(
            {
                str(n.attributes.get("topology_id", ""))
                for n in snap.nodes
                if n.attributes.get("topology_id")
            }
            - {""}
        ),
        fingerprint=bgp.fingerprint,
        base_notes=list(bgp.notes) + yang_notes,
        node_count=len(snap.nodes),
        link_count=len(snap.links),
        d=d_bgp,
    )

    pcep_lane = _lane_v2(
        "pcep",
        observed_source=pcep.observed_source,
        topology_ids=list(pcep.topology_ids),
        fingerprint=pcep.fingerprint,
        base_notes=list(pcep.notes),
        node_count=pcep.node_count,
        link_count=pcep.link_count,
        d=d_pcep,
    )

    netconf_lane = _lane_v2(
        "netconf",
        observed_source=netconf.observed_source,
        topology_ids=list(netconf.topology_ids),
        fingerprint=netconf.fingerprint,
        base_notes=list(netconf.notes),
        node_count=netconf.node_count,
        link_count=netconf.link_count,
        d=d_nc,
    )

    snap_id = _persist_snapshot(
        reachability=reach,
        bgp_fp=bgp.fingerprint,
        pcep_fp=pcep.fingerprint,
        netconf_fp=netconf.fingerprint,
        lanes={
            "bgp_ls": bg_lane.model_dump(mode="json"),
            "pcep": pcep_lane.model_dump(mode="json"),
            "netconf": netconf_lane.model_dump(mode="json"),
            "contract_id": CONTROLLER_SOUTHBOUND_SESSION_TRUTH_V2_CONTRACT_ID,
            "yang_module_catalog_count": len(module_names),
        },
        aggregate_notes=list(aggregate.notes),
    )

    record_controller_evidence_v2_observation(
        controller_reachability=reach,
        bgp_ls_lane_posture=bg_lane.lane_posture,
        bgp_ls_session_posture=bg_lane.session_posture,
        bgp_ls_evidence_strength=bg_lane.evidence_strength,
        pcep_lane_posture=pcep_lane.lane_posture,
        pcep_session_posture=pcep_lane.session_posture,
        pcep_evidence_strength=pcep_lane.evidence_strength,
        netconf_lane_posture=netconf_lane.lane_posture,
        netconf_session_posture=netconf_lane.session_posture,
        netconf_evidence_strength=netconf_lane.evidence_strength,
        duration_seconds=time.perf_counter() - t0,
    )

    return ControllerEvidenceResponse(
        service="app-api",
        version=settings.app_version,
        phase=_metadata_phase,  # type: ignore[arg-type]
        generated_at=_utcnow(),
        contract_id=CONTROLLER_SOUTHBOUND_SESSION_TRUTH_V2_CONTRACT_ID,
        controller_reachability=reach,
        controller_capability_probe_summary=obs.observation_summary,
        yang_module_catalog_count=len(module_names),
        aggregate_fetch_notes=list(aggregate.notes),
        bgp_ls=bg_lane,
        pcep=pcep_lane,
        netconf=netconf_lane,
        persisted_snapshot_id=snap_id,
        safety_framing=ControllerEvidenceSafetyFramingV2(),
    )


def _persist_snapshot(
    *,
    reachability: str,
    bgp_fp: str,
    pcep_fp: str,
    netconf_fp: str,
    lanes: dict[str, object],
    aggregate_notes: list[str],
) -> str | None:
    row_id = str(uuid4())
    try:
        with create_session() as session:
            session.add(
                ControllerEvidenceSnapshotTable(
                    id=row_id,
                    persisted_at=_utcnow(),
                    controller_reachability=reachability,
                    bgp_ls_fingerprint=bgp_fp,
                    pcep_fingerprint=pcep_fp,
                    netconf_fingerprint=netconf_fp,
                    lanes_payload=lanes,
                    aggregate_notes=list(aggregate_notes),
                )
            )
            session.commit()
    except OperationalError:
        return None
    return row_id


def build_bgpls_lane_only_response() -> BgpLsLaneOnlyResponse:
    full = build_controller_evidence_response()
    return BgpLsLaneOnlyResponse(
        contract_id=CONTROLLER_SOUTHBOUND_SESSION_TRUTH_V2_CONTRACT_ID,
        lane=full.bgp_ls,
    )


def build_pcep_lane_only_response() -> PcepLaneOnlyResponse:
    full = build_controller_evidence_response()
    return PcepLaneOnlyResponse(
        contract_id=CONTROLLER_SOUTHBOUND_SESSION_TRUTH_V2_CONTRACT_ID,
        lane=full.pcep,
    )


def build_netconf_lane_only_response() -> NetconfLaneOnlyResponse:
    full = build_controller_evidence_response()
    return NetconfLaneOnlyResponse(
        contract_id=CONTROLLER_SOUTHBOUND_SESSION_TRUTH_V2_CONTRACT_ID,
        lane=full.netconf,
    )
