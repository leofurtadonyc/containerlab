"""Tests for controller southbound session truth v2."""

from __future__ import annotations

from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient

from app_api.integrations.odl.bgp_ls_topology import BgplsTopologyFetchResult
from app_api.integrations.odl.native_session_probes import NativeSessionProbeResult
from app_api.integrations.odl.netconf_lane import NetconfLaneFetchResult
from app_api.integrations.odl.network_topology_common import NetworkTopologyAggregateResult
from app_api.integrations.odl.pcep_lane import PcepLaneFetchResult
from app_api.integrations.odl.session_truth_derivation import (
    derive_bgp_ls_truth,
    derive_netconf_truth,
    derive_pcep_truth,
)
from app_api.metrics.state import record_controller_evidence_v2_observation, reset_metrics_registry
from app_api.main import app
from app_api.models.topology import TopologyLink, TopologyNode, TopologySnapshot
from app_api.schemas.controller_evidence import (
    CONTROLLER_SOUTHBOUND_SESSION_TRUTH_V2_CONTRACT_ID,
    BgpLsLaneOnlyResponse,
    ControllerEvidenceResponse,
    ControllerEvidenceSafetyFramingV2,
    NetconfLaneOnlyResponse,
    PcepLaneOnlyResponse,
    ProtocolLaneDetailV2,
)
from app_api.services.controller_evidence import build_controller_evidence_response


def _lane(lane_id: str) -> ProtocolLaneDetailV2:
    return ProtocolLaneDetailV2(
        lane_id=lane_id,  # type: ignore[arg-type]
        lane_posture="empty",
        protocol_exposure_posture="not_exposed",
        object_visibility_posture="none_visible",
        session_posture="not_observed",
        evidence_strength="unavailable",
        derivation_mode="unknown",
        observed_source="test",
        node_count=0,
        link_count=0,
        topology_ids=[],
        fingerprint="abc",
        notes=["test"],
        fallback_notes=[],
        explicit_non_claims=[],
    )


def _fake_response() -> ControllerEvidenceResponse:
    return ControllerEvidenceResponse(
        service="app-api",
        version="0.1.0",
        phase="phase_2_read_only_foundation",
        generated_at=datetime.now(UTC),
        contract_id=CONTROLLER_SOUTHBOUND_SESSION_TRUTH_V2_CONTRACT_ID,
        controller_reachability="ok",
        controller_capability_probe_summary="probe",
        yang_module_catalog_count=12,
        aggregate_fetch_notes=[],
        bgp_ls=_lane("bgp_ls"),
        pcep=_lane("pcep"),
        netconf=_lane("netconf"),
        persisted_snapshot_id=None,
        safety_framing=ControllerEvidenceSafetyFramingV2(),
    )


client = TestClient(app)


def _aggregate(status: str = "ok") -> NetworkTopologyAggregateResult:
    return NetworkTopologyAggregateResult(status=status, payload={}, path_used="/rests/data/test", notes=[])


def _bgp_fetch(*, node_count: int = 0, link_count: int = 0, status: str = "ok") -> BgplsTopologyFetchResult:
    nodes = [
        TopologyNode(
            node_id=f"node-{index}",
            display_name=f"Node {index}",
            role="router",
            state="up",
            source="controller_bgpls",
            attributes={"topology_id": "bgpls:1"},
        )
        for index in range(node_count)
    ]
    links = [
        TopologyLink(
            link_id=f"link-{index}",
            source_node_id="node-a",
            target_node_id="node-b",
            state="up",
            source="controller_bgpls",
            attributes={"topology_id": "bgpls:1"},
        )
        for index in range(link_count)
    ]
    return BgplsTopologyFetchResult(
        status=status,  # type: ignore[arg-type]
        observed_source="odl_restconf_bgpls",
        snapshot=TopologySnapshot(
            topology_id="bgpls:1",
            topology_name="bgpls",
            nodes=nodes,
            links=links,
            sync_source="controller_bgpls",
            sync_status="ok",
            completeness="partial",
            observed_at=None,
            notes=[],
        ),
        fingerprint="bgp-fp",
        notes=[],
    )


def test_controller_evidence_aggregate_route() -> None:
    with patch(
        "app_api.routers.controller_evidence.build_controller_evidence_response",
        return_value=_fake_response(),
    ):
        r = client.get("/api/v1/controller/evidence")
    assert r.status_code == 200
    body = r.json()
    assert body["contract_id"] == CONTROLLER_SOUTHBOUND_SESSION_TRUTH_V2_CONTRACT_ID
    assert body["bgp_ls"]["lane_id"] == "bgp_ls"
    assert body["bgp_ls"]["session_posture"] == "not_observed"
    assert body["bgp_ls"]["evidence_strength"] == "unavailable"
    assert body["bgp_ls"]["derivation_mode"] == "unknown"
    assert body["pcep"]["lane_id"] == "pcep"
    assert body["netconf"]["lane_id"] == "netconf"
    assert "yang_module_catalog_count" in body


def test_controller_evidence_lane_routes() -> None:
    full = _fake_response()
    with patch(
        "app_api.services.controller_evidence.build_controller_evidence_response",
        return_value=full,
    ):
        bg = client.get("/api/v1/controller/evidence/bgpls")
        pc = client.get("/api/v1/controller/evidence/pcep")
        nc = client.get("/api/v1/controller/evidence/netconf")
    assert bg.status_code == 200
    assert bg.json()["lane"]["session_posture"] == "not_observed"
    assert pc.status_code == 200
    assert nc.status_code == 200


def test_controller_evidence_lane_only_models() -> None:
    lane = _lane("bgp_ls")
    assert (
        BgpLsLaneOnlyResponse(
            contract_id=CONTROLLER_SOUTHBOUND_SESSION_TRUTH_V2_CONTRACT_ID,
            lane=lane,
        ).lane.evidence_strength
        == "unavailable"
    )
    assert PcepLaneOnlyResponse(
        contract_id=CONTROLLER_SOUTHBOUND_SESSION_TRUTH_V2_CONTRACT_ID,
        lane=_lane("pcep"),
    ).lane.lane_id == "pcep"
    assert NetconfLaneOnlyResponse(
        contract_id=CONTROLLER_SOUTHBOUND_SESSION_TRUTH_V2_CONTRACT_ID,
        lane=_lane("netconf"),
    ).lane.lane_id == "netconf"


def test_bgp_ls_truth_is_unknown_when_exposure_cannot_be_verified_and_no_objects_exist() -> None:
    result = derive_bgp_ls_truth(
        aggregate=_aggregate(),
        bgp=_bgp_fetch(),
        native=NativeSessionProbeResult(path_used=None, payload=None, has_session_oper_hints=False, notes=[]),
        protocol_exposure_posture="unknown",
    )

    assert result.lane_posture == "unknown"
    assert result.session_posture == "unknown"
    assert result.evidence_strength == "unavailable"


def test_pcep_truth_is_unsupported_when_lane_not_exposed_and_no_objects_exist() -> None:
    result = derive_pcep_truth(
        aggregate=_aggregate(),
        pcep=PcepLaneFetchResult(
            posture="empty",
            observed_source="odl_restconf_pcep",
            topology_ids=(),
            node_count=0,
            link_count=0,
            fingerprint="pcep-fp",
            notes=[],
        ),
        native=NativeSessionProbeResult(path_used=None, payload=None, has_session_oper_hints=False, notes=[]),
        protocol_exposure_posture="not_exposed",
    )

    assert result.lane_posture == "unsupported"
    assert result.session_posture == "unsupported"
    assert result.evidence_strength == "unavailable"


def test_pcep_truth_uses_scope_only_when_only_topology_scope_is_visible() -> None:
    result = derive_pcep_truth(
        aggregate=_aggregate(),
        pcep=PcepLaneFetchResult(
            posture="partial",
            observed_source="odl_restconf_pcep",
            topology_ids=("pcep-topology",),
            node_count=0,
            link_count=0,
            fingerprint="pcep-fp",
            notes=[],
        ),
        native=NativeSessionProbeResult(path_used=None, payload=None, has_session_oper_hints=False, notes=[]),
        protocol_exposure_posture="exposed",
    )

    assert result.object_visibility_posture == "scope_only"
    assert result.evidence_strength == "scope_only"
    assert result.derivation_mode == "topology_partition_heuristic"


def test_netconf_truth_prefers_native_session_hints() -> None:
    result = derive_netconf_truth(
        aggregate=_aggregate(),
        netconf=NetconfLaneFetchResult(
            posture="available",
            observed_source="odl_restconf_netconf",
            topology_ids=("topology-netconf",),
            node_count=2,
            link_count=0,
            netconf_connector_node_count=2,
            fingerprint="netconf-fp",
            notes=[],
        ),
        native=NativeSessionProbeResult(
            path_used="/rests/data/netconf-node-topology:netconf-node-topology",
            payload={"session-state": "up"},
            has_session_oper_hints=True,
            notes=[],
        ),
        protocol_exposure_posture="exposed",
    )

    assert result.lane_posture == "available"
    assert result.session_posture == "established"
    assert result.evidence_strength == "session_backed"
    assert result.derivation_mode == "protocol_native"


def test_controller_evidence_metrics_include_lane_posture_and_session_backed_counters() -> None:
    reset_metrics_registry()
    record_controller_evidence_v2_observation(
        controller_reachability="ok",
        bgp_ls_lane_posture="unsupported",
        bgp_ls_session_posture="unsupported",
        bgp_ls_evidence_strength="unavailable",
        pcep_lane_posture="partial",
        pcep_session_posture="not_observed",
        pcep_evidence_strength="heuristic_only",
        netconf_lane_posture="available",
        netconf_session_posture="established",
        netconf_evidence_strength="session_backed",
        duration_seconds=0.125,
    )

    response = client.get("/metrics")
    assert response.status_code == 200
    assert 'platform_app_api_controller_evidence_lane_posture_total{lane="bgp_ls",posture="unsupported"} 1' in response.text
    assert 'platform_app_api_controller_evidence_lane_session_backed_total{lane="netconf",available="true"} 1' in response.text
    assert 'platform_app_api_controller_evidence_lane_session_backed_total{lane="pcep",available="false"} 1' in response.text


def test_controller_evidence_response_survives_persistence_failure(monkeypatch) -> None:
    monkeypatch.setattr(
        "app_api.services.controller_evidence.get_settings",
        lambda: SimpleNamespace(app_version="0.1.0"),
    )
    monkeypatch.setattr(
        "app_api.services.controller_evidence.get_odl_client",
        lambda: SimpleNamespace(
            read_controller_observation=lambda: SimpleNamespace(
                observation_state="ok",
                observation_summary="probe ok",
            )
        ),
    )
    monkeypatch.setattr(
        "app_api.services.controller_evidence.fetch_yang_module_names",
        lambda client: SimpleNamespace(status="ok", module_names={"ietf-netconf-monitoring"}, notes=["catalog ok"]),
    )
    monkeypatch.setattr(
        "app_api.services.controller_evidence.module_hints_for_lanes",
        lambda catalog: {
            "bgp_ls_family": "not_exposed",
            "pcep_family": "not_exposed",
            "netconf_family": "exposed",
        },
    )
    monkeypatch.setattr(
        "app_api.services.controller_evidence.fetch_network_topology_aggregate",
        lambda client: _aggregate(),
    )
    monkeypatch.setattr(
        "app_api.services.controller_evidence.fetch_bgpls_topology_via_odl",
        lambda client, preloaded_aggregate: _bgp_fetch(),
    )
    monkeypatch.setattr(
        "app_api.services.controller_evidence.summarize_pcep_lane",
        lambda aggregate: PcepLaneFetchResult(
            posture="empty",
            observed_source="odl_restconf_pcep",
            topology_ids=(),
            node_count=0,
            link_count=0,
            fingerprint="pcep-fp",
            notes=[],
        ),
    )
    monkeypatch.setattr(
        "app_api.services.controller_evidence.summarize_netconf_lane",
        lambda aggregate, client: NetconfLaneFetchResult(
            posture="partial",
            observed_source="odl_restconf_netconf",
            topology_ids=("topology-netconf",),
            node_count=0,
            link_count=0,
            netconf_connector_node_count=1,
            fingerprint="netconf-fp",
            notes=[],
        ),
    )
    monkeypatch.setattr(
        "app_api.services.controller_evidence.probe_bgp_ls_native",
        lambda client: NativeSessionProbeResult(path_used=None, payload=None, has_session_oper_hints=False, notes=[]),
    )
    monkeypatch.setattr(
        "app_api.services.controller_evidence.probe_pcep_native",
        lambda client: NativeSessionProbeResult(path_used=None, payload=None, has_session_oper_hints=False, notes=[]),
    )
    monkeypatch.setattr(
        "app_api.services.controller_evidence.probe_netconf_native",
        lambda client: NativeSessionProbeResult(path_used=None, payload=None, has_session_oper_hints=False, notes=[]),
    )
    monkeypatch.setattr("app_api.services.controller_evidence._persist_snapshot", lambda **kwargs: None)
    monkeypatch.setattr(
        "app_api.services.controller_evidence.record_controller_evidence_v2_observation",
        lambda **kwargs: None,
    )

    response = build_controller_evidence_response()

    assert response.contract_id == CONTROLLER_SOUTHBOUND_SESSION_TRUTH_V2_CONTRACT_ID
    assert response.persisted_snapshot_id is None
    assert response.netconf.protocol_exposure_posture == "exposed"
