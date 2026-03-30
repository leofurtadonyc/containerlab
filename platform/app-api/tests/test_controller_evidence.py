"""Tests for controller southbound session truth v2."""

from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import patch

from fastapi.testclient import TestClient

from app_api.main import app
from app_api.schemas.controller_evidence import (
    CONTROLLER_SOUTHBOUND_SESSION_TRUTH_V2_CONTRACT_ID,
    BgpLsLaneOnlyResponse,
    ControllerEvidenceResponse,
    ControllerEvidenceSafetyFramingV2,
    NetconfLaneOnlyResponse,
    PcepLaneOnlyResponse,
    ProtocolLaneDetailV2,
)


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
