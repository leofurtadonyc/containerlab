"""Tests for Service Dossier v1 (GET /api/v1/services/{service_id}/dossier)."""

from __future__ import annotations

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
from app_api.schemas.service_dossier import SERVICE_DOSSIER_V1_CONTRACT_ID
from app_api.schemas.common import EvidenceConfidenceSummary
from app_api.services import service_dossier as service_dossier_service
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
    from datetime import UTC, datetime

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


def _topology_stub(*, nodes: list[dict]) -> object:
    from datetime import UTC, datetime

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


def test_service_dossier_404_unknown_service(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        service_explorer_service,
        "build_service_detail_response",
        lambda _: None,
    )
    r = client.get("/api/v1/services/color:100/dossier")
    assert r.status_code == 404


def test_service_dossier_contract_id_and_nested_explorer(monkeypatch: pytest.MonkeyPatch) -> None:
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
    r = client.get(f"/api/v1/services/policy:{pid}/dossier")
    assert r.status_code == 200
    body = r.json()
    assert body["contract_id"] == SERVICE_DOSSIER_V1_CONTRACT_ID
    assert body["service_explorer_detail"]["contract_id"] == "service_explorer_v1"
    assert body["default_member_policy_id"] == pid
    assert body["member_posture_counts"].get("ok") == 1
    assert "service_explorer_v1" in body["source_contract_ids"]
    if body["policy_explainability"] is not None:
        assert "policy_explainability_workspace_v1" in body["source_contract_ids"]
    else:
        assert body["explainability_unavailable_note"] is not None
    assert body["investigation_pivot_hint"].startswith("Live shell:")
    assert any("service-impact" in x for x in body["recommended_api_pivots"])


def test_service_dossier_default_member_prefers_degraded(monkeypatch: pytest.MonkeyPatch) -> None:
    p_ok = _policy("Z:static_local:10.0.0.1:1", degraded=_deg("ok"))
    p_bad = _policy("A:static_local:10.0.0.2:2", degraded=_deg("degraded"))
    monkeypatch.setattr(
        service_explorer_service,
        "build_policies_list_response",
        lambda **_: _minimal_policies_response([p_ok, p_bad]),
    )
    monkeypatch.setattr(
        service_explorer_service,
        "build_topology_response",
        lambda: _topology_stub(nodes=[]),
    )
    r = client.get("/api/v1/services/color:100/dossier")
    assert r.status_code == 200
    body = r.json()
    assert body["default_member_policy_id"] == p_bad.policy_id
    assert body["member_posture_counts"]["degraded"] == 1
    assert body["member_posture_counts"]["ok"] == 1


def test_service_dossier_skips_maintenance_when_no_topology_links(monkeypatch: pytest.MonkeyPatch) -> None:
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
    r = client.get(f"/api/v1/services/policy:{pid}/dossier")
    assert r.status_code == 200
    body = r.json()
    assert body["maintenance_preview"] is None
    assert body["maintenance_unavailable_note"] is not None
    assert "no topology linkage" in body["maintenance_unavailable_note"].lower()


def test_service_dossier_sparse_when_explainability_fails(monkeypatch: pytest.MonkeyPatch) -> None:
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

    def _boom(_policy_id: str) -> None:
        raise RuntimeError("simulated explainability failure")

    monkeypatch.setattr(service_dossier_service, "build_policy_explainability_response", _boom)
    r = client.get(f"/api/v1/services/policy:{pid}/dossier")
    assert r.status_code == 200
    body = r.json()
    assert body["policy_explainability"] is None
    assert body["explainability_unavailable_note"] is not None
    assert body["sparse_dossier"] is True
    assert any("explainability" in s.lower() for s in body["sparse_reasons"])
