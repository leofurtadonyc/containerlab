"""Tests for Service Explorer v1 (GET /api/v1/services, GET /api/v1/services/{service_id})."""

from __future__ import annotations

from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

from app_api.main import app
from app_api.schemas.degraded_policy_v1 import DegradedPolicyV1Classification
from app_api.schemas.policies import (
    CandidatePathRecord,
    PoliciesListResponse,
    PolicyCurrentComparisonResponse,
    PolicyDetailSourceReadinessRecord,
    PolicyHistoryWindowResponse,
    PolicyRecord,
)
from app_api.schemas.read_side_query import build_read_side_query_echo
from app_api.schemas.service_explorer import SERVICE_EXPLORER_V1_CONTRACT_ID
from app_api.schemas.common import EvidenceConfidenceSummary
from app_api.services import service_explorer as service_explorer_service

client = TestClient(app)


def _deg(posture: str) -> DegradedPolicyV1Classification:
    return DegradedPolicyV1Classification(
        posture=posture,  # type: ignore[arg-type]
        reason_codes=[],
        confidence="medium",
        summary="test",
    )


def _path() -> CandidatePathRecord:
    return CandidatePathRecord(
        name="p1",
        current_posture="current",
        path_state="active",
        last_recorded_path_state="active",
        preference=1,
        notes=[],
    )


def _policy(
    policy_id: str,
    *,
    color: int = 100,
    headend: str = "PE1",
    endpoint: str = "192.0.2.11",
    degraded: DegradedPolicyV1Classification | None = None,
) -> PolicyRecord:
    d = degraded or _deg("ok")
    return PolicyRecord(
        policy_id=policy_id,
        policy_name="n",
        policy_type="static_local",
        headend=headend,
        endpoint=endpoint,
        color=color,
        source_target=headend,
        source_target_role="pe",
        candidate_paths=[_path()],
        current_posture="current",
        intent_state="declared",
        observed_state="active",
        last_recorded_observed_state="active",
        support_state="supported",
        health_state="healthy",
        last_recorded_health_state="healthy",
        source="test",
        notes=[],
        degraded_policy_v1=d,
    )


def _minimal_policies_response(items: list[PolicyRecord]) -> PoliciesListResponse:
    n = len(items)
    now = datetime.now(UTC)
    detail_ready = PolicyDetailSourceReadinessRecord(
        posture="ready",
        no_policies_observed_target_count=0,
        detail_unavailable_target_count=0,
        partial_detail_target_count=0,
    )
    comparison = PolicyCurrentComparisonResponse(
        status="unavailable",
        summary="none",
        current_observed_policy_count=n,
        persisted_observed_policy_count=n,
        current_detail_record_count=n,
        persisted_detail_record_count=n,
        observed_policy_delta=0,
        detail_record_delta=0,
        added_policy_count=0,
        removed_policy_count=0,
        changed_policy_count=0,
        change_preview=[],
        notes=[],
    )
    history = PolicyHistoryWindowResponse(
        status="unavailable",
        summary="test",
        recent_snapshots=[],
        comparison_to_previous=None,
    )
    return PoliciesListResponse(
        service="app-api",
        version="0.1.0",
        phase="phase_2_read_only_foundation",
        generated_at=now,
        data_status="live",
        serving_mode="live_collector",
        evidence_confidence=EvidenceConfidenceSummary(
            source_posture="live_observed",
            evidence_kind="aggregate_plus_bounded_records",
            confidence_posture="strong_for_current_slice",
            freshness_posture="current",
            blocked_reason="none",
            summary="test",
            notes=[],
        ),
        summary="inv",
        sync_source="test",
        sync_status="ok",
        completeness="complete",
        detail_mode="mixed",
        detail_source_readiness=detail_ready,
        empty_reason="none" if n else "no_policies_observed",
        observed_at=now,
        observed_target_count=1,
        policy_capable_target_count=1,
        observed_policy_count=n,
        active_policy_count=n,
        static_policy_count=n,
        static_local_policy_count=n,
        static_non_local_policy_count=0,
        bgp_policy_count=0,
        ttm_preference_count=0,
        binding_sid_count=0,
        srv6_binding_sid_count=0,
        count=n,
        notes=[],
        target_footprints=[],
        comparison_to_latest_persisted=comparison,
        history=history,
        items=items,
        read_side_query=build_read_side_query_echo(
            limit_requested=None,
            items_total=n,
            items_returned=n,
        ),
    )


def test_services_list_empty_inventory_contract_id_and_caveat(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        service_explorer_service,
        "build_policies_list_response",
        lambda **_: _minimal_policies_response([]),
    )
    r = client.get("/api/v1/services")
    assert r.status_code == 200
    payload = r.json()
    assert payload["contract_id"] == SERVICE_EXPLORER_V1_CONTRACT_ID
    assert payload["items"] == []
    assert any("empty_reason" in c.lower() or "no_policies" in c.lower() for c in payload["caveats"])


def test_services_list_populated_summary_and_truncation_echo(monkeypatch: pytest.MonkeyPatch) -> None:
    p1 = _policy("PE1:static_local:192.0.2.11:100")
    p2 = _policy("PE2:static_local:192.0.2.12:200", color=200, headend="PE2", endpoint="192.0.2.12")
    monkeypatch.setattr(
        service_explorer_service,
        "build_policies_list_response",
        lambda **_: _minimal_policies_response([p1, p2]),
    )
    r = client.get("/api/v1/services?limit=3")
    assert r.status_code == 200
    payload = r.json()
    assert payload["read_side_query"]["limit_requested"] == 3
    assert payload["read_side_query"]["items_total"] == 8
    assert payload["read_side_query"]["items_returned"] == 3
    assert any("truncated" in c.lower() for c in payload["caveats"])
    # Rows are sorted lexicographically by service_id; first three are color:* / endpoint:*.
    assert payload["items"][0]["service_id"].startswith("color:")
    kinds = {row["kind"] for row in payload["items"]}
    assert kinds <= {"color", "endpoint", "headend", "policy"}
    assert "color" in kinds


def test_service_detail_policy_atomic(monkeypatch: pytest.MonkeyPatch) -> None:
    pid = "PE1:static_local:192.0.2.11:100"
    p = _policy(pid)
    monkeypatch.setattr(
        service_explorer_service,
        "build_policies_list_response",
        lambda **_: _minimal_policies_response([p]),
    )
    monkeypatch.setattr(
        service_explorer_service,
        "build_topology_response",
        lambda: _topology_stub(nodes=[]),
    )
    r = client.get(f"/api/v1/services/policy:{pid}")
    assert r.status_code == 200
    body = r.json()
    assert body["contract_id"] == SERVICE_EXPLORER_V1_CONTRACT_ID
    assert body["members_total"] == 1
    assert body["members"][0]["policy_id"] == pid
    assert body["topology_evidence_status"] == "partial"


def test_service_detail_404_unknown_form() -> None:
    r = client.get("/api/v1/services/not_a_prefix:foo")
    assert r.status_code == 404


def test_service_detail_404_no_members(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        service_explorer_service,
        "build_policies_list_response",
        lambda **_: _minimal_policies_response([_policy("a")]),
    )
    r = client.get("/api/v1/services/color:999")
    assert r.status_code == 404


def test_service_detail_sparse_topology_partial_mapping(monkeypatch: pytest.MonkeyPatch) -> None:
    pid = "PE1:static_local:192.0.2.11:100"
    p = _policy(pid, headend="node-a")
    monkeypatch.setattr(
        service_explorer_service,
        "build_policies_list_response",
        lambda **_: _minimal_policies_response([p]),
    )
    monkeypatch.setattr(
        service_explorer_service,
        "build_topology_response",
        lambda: _topology_stub(
            nodes=[
                {
                    "node_id": "node-a",
                    "display_name": "Node A",
                    "role": "pe",
                    "current_posture": "current",
                    "state": "up",
                    "last_recorded_state": "up",
                    "source": "test",
                    "device_id": None,
                    "attributes": {},
                }
            ],
        ),
    )
    r = client.get(f"/api/v1/services/policy:{pid}")
    assert r.status_code == 200
    body = r.json()
    assert body["topology_evidence_status"] == "present"
    assert body["topology_links"]
    assert any(SERVICE_EXPLORER_V1_CONTRACT_ID in p for p in body["recommended_pivots"])


def test_topology_failure_is_non_fatal(monkeypatch: pytest.MonkeyPatch) -> None:
    pid = "PE1:static_local:192.0.2.11:100"
    p = _policy(pid)
    monkeypatch.setattr(
        service_explorer_service,
        "build_policies_list_response",
        lambda **_: _minimal_policies_response([p]),
    )

    def _boom() -> None:
        raise RuntimeError("injected topology failure")

    monkeypatch.setattr(service_explorer_service, "build_topology_response", _boom)
    r = client.get(f"/api/v1/services/policy:{pid}")
    assert r.status_code == 200
    body = r.json()
    assert body["topology_evidence_status"] == "unavailable"
    assert body["topology_links"] == []
    assert any("assembly failed" in c.lower() for c in body["caveats"])


def test_degraded_roll_up_worst(monkeypatch: pytest.MonkeyPatch) -> None:
    p1 = _policy("a", degraded=_deg("ok"))
    p2 = _policy("b", degraded=_deg("degraded"))
    monkeypatch.setattr(
        service_explorer_service,
        "build_policies_list_response",
        lambda **_: _minimal_policies_response([p1, p2]),
    )
    monkeypatch.setattr(
        service_explorer_service,
        "build_topology_response",
        lambda: _topology_stub(nodes=[]),
    )
    r = client.get("/api/v1/services/headend:PE1")
    assert r.status_code == 200
    body = r.json()
    assert body["degraded_service"]["posture"] == "degraded"


def _topology_stub(*, nodes: list[dict]) -> object:
    """Minimal TopologyResponse-shaped stub for monkeypatched build_topology_response."""
    from app_api.schemas.topology import (
        TopologyComparisonSummary,
        TopologyCoverageSummaryRecord,
        TopologyHistoryWindow,
        TopologyRecord,
        TopologyResponse,
    )

    now = datetime.now(UTC)
    cov = TopologyCoverageSummaryRecord(
        inference_posture="inferred",
        endpoint_pairing_posture="paired",
        collection_posture="ok",
        node_participation_posture="fully_linked",
        paired_link_count=0,
        single_sided_link_count=0,
        linked_node_count=len(nodes),
        isolated_node_count=0,
        summary="cov",
    )
    tr = TopologyRecord(
        topology_id="t1",
        topology_name="t",
        nodes=nodes,  # type: ignore[arg-type]
        links=[],
        sync_source="test",
        sync_status="ok",
        completeness="complete",
        observed_at=now,
        notes=[],
    )
    comp = TopologyComparisonSummary(
        status="unavailable",
        summary="n",
        current_node_count=len(nodes),
        persisted_node_count=0,
        current_link_count=0,
        persisted_link_count=0,
        node_count_delta=0,
        link_count_delta=0,
        added_node_count=0,
        removed_node_count=0,
        changed_node_count=0,
        added_link_count=0,
        removed_link_count=0,
        changed_link_count=0,
        notes=[],
    )
    hist = TopologyHistoryWindow(status="unavailable", summary="h", recent_snapshots=[])
    return TopologyResponse(
        service="app-api",
        version="0.1.0",
        phase="phase_2_read_only_foundation",
        generated_at=now,
        data_status="live",
        serving_mode="live_collector",
        evidence_confidence=EvidenceConfidenceSummary(
            source_posture="live_observed",
            evidence_kind="observed_plus_inferred",
            confidence_posture="bounded_partial",
            freshness_posture="current",
            blocked_reason="none",
            summary="e",
            notes=[],
        ),
        summary="topo",
        comparison_to_latest_persisted=comp,
        history=hist,
        coverage_summary=cov,
        topology=tr,
    )
