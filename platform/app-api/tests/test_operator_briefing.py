"""Contract tests for GET /api/v1/operator-briefing (operator_briefing_workspace_v1)."""

import pytest
from fastapi.testclient import TestClient

from app_api.integrations.collector.policies import clear_policy_snapshot_cache
from app_api.integrations.collector.topology import clear_topology_snapshot_cache
from app_api.main import app
from app_api.schemas.operator_briefing import OPERATOR_BRIEFING_CONTRACT_ID
import app_api.services.operator_briefing as operator_briefing_service
import test_app as test_app_contracts

client = TestClient(app)

KNOWN_POLICY_ID = "PE1:static_local:192.0.2.11:100"


@pytest.fixture(autouse=True)
def _clear_topology_policy_caches() -> None:
    clear_policy_snapshot_cache()
    clear_topology_snapshot_cache()


def _stub_live_policy_and_topology(monkeypatch: pytest.MonkeyPatch) -> None:
    test_app_contracts._disable_read_side_persistence(monkeypatch)

    class StubCollectorPolicyClient:
        def read_policy_snapshot(self):
            return test_app_contracts._build_live_policy_snapshot()

    class StubCollectorTopologyClient:
        def read_topology_snapshot(self):
            return test_app_contracts._build_live_topology_snapshot()

    monkeypatch.setattr(
        "app_api.services.policies.get_collector_policy_client",
        lambda: StubCollectorPolicyClient(),
    )
    monkeypatch.setattr(
        "app_api.services.topology.get_collector_topology_client",
        lambda: StubCollectorTopologyClient(),
    )


def test_operator_briefing_default_sparse_contract_and_sections(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get("/api/v1/operator-briefing")
    assert r.status_code == 200
    payload = r.json()
    assert payload["contract_id"] == OPERATOR_BRIEFING_CONTRACT_ID
    assert payload["safety"]["contract_id"] == OPERATOR_BRIEFING_CONTRACT_ID
    assert payload["delta_digest"] is not None
    assert payload["delta_digest"]["contract_id"] == "cross_domain_delta_digest_v1"
    assert payload["policy_dossier"] is None
    assert payload["policy_dossier_note"] == "not_requested"
    assert payload["topology_object_dossier"] is None
    assert payload["topology_object_dossier_note"] == "not_requested"
    assert payload["situation_pack"] is not None
    assert payload["investigation_workspace"] is not None
    keys = {s["section_key"] for s in payload["section_meta"]}
    assert keys == {
        "briefing_context",
        "delta_digest",
        "policy_dossier",
        "topology_object_dossier",
        "situation_room",
        "investigation_workspace",
    }
    assert len(payload["recommended_pivots"]) >= 3
    assert any("delta-digest" in p for p in payload["recommended_pivots"])


def test_operator_briefing_with_selected_policy_id(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get(f"/api/v1/operator-briefing?policy_id={KNOWN_POLICY_ID}")
    assert r.status_code == 200
    payload = r.json()
    assert payload["policy_dossier"] is not None
    assert payload["policy_dossier"]["policy_record"]["policy_id"] == KNOWN_POLICY_ID
    assert payload["policy_dossier_note"] is None
    assert any("exports/policies" in p for p in payload["recommended_pivots"])


def test_operator_briefing_with_selected_topology_object(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get("/api/v1/operator-briefing?topology_object=PE1&topology_object_kind=node")
    assert r.status_code == 200
    payload = r.json()
    assert payload["topology_object_dossier"] is not None
    assert payload["topology_object_dossier"]["object_identity"]["object_id"] == "PE1"
    assert payload["topology_object_dossier_note"] is None
    assert any("topology-objects" in p or "topology_object=PE1" in p for p in payload["recommended_pivots"])


def test_operator_briefing_mixed_policy_topology_and_sync_window(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get(
        f"/api/v1/operator-briefing?sync_runs_limit=7"
        f"&policy_id={KNOWN_POLICY_ID}&topology_object=PE1&topology_object_kind=node"
        f"&inv_from=overview&global_search_q=PE1",
    )
    assert r.status_code == 200
    payload = r.json()
    assert payload["sync_runs_limit_applied"] == 7
    assert payload["briefing_context"]["sync_runs_limit_requested"] == 7
    assert payload["briefing_context"]["inv_from_client_hint"] == "overview"
    assert payload["briefing_context"]["global_search_q_client_hint"] == "PE1"
    assert payload["policy_dossier"] is not None
    assert payload["topology_object_dossier"] is not None
    assert payload["delta_digest"]["sync_runs_limit_applied"] == 7


def test_operator_briefing_caveat_propagation_and_safety_non_claims(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get("/api/v1/operator-briefing")
    assert r.status_code == 200
    payload = r.json()
    assert payload["merged_caveats"]
    assert set(payload["safety"]["explicit_non_claims"]) == set(
        [
            "not_change_approval",
            "not_incident_command",
            "not_unified_cross_domain_truth",
            "not_validation_or_drift_verdict",
            "not_workflow_execution_truth",
            "not_grafana_or_metrics_substitute",
            "not_guaranteed_completeness",
        ],
    )


def test_operator_briefing_survives_delta_digest_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)

    def _boom(**_kwargs):
        raise RuntimeError("injected digest failure")

    monkeypatch.setattr(
        operator_briefing_service,
        "build_cross_domain_delta_digest_response",
        _boom,
    )
    r = client.get("/api/v1/operator-briefing?sync_runs_limit=3")
    assert r.status_code == 200
    payload = r.json()
    assert payload["delta_digest"] is None
    assert payload["delta_digest_error"] is not None
    assert "RuntimeError" in payload["delta_digest_error"]
    assert payload["investigation_workspace"] is not None
    dd_meta = next(s for s in payload["section_meta"] if s["section_key"] == "delta_digest")
    assert dd_meta["evidence_status"] == "unavailable"


def test_operator_briefing_rejects_invalid_sync_runs_limit() -> None:
    assert client.get("/api/v1/operator-briefing?sync_runs_limit=0").status_code == 422
    assert client.get("/api/v1/operator-briefing?sync_runs_limit=101").status_code == 422
