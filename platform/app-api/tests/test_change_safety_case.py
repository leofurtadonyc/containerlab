"""Contract tests for GET /api/v1/reports/change-safety-case/*."""

import pytest
from fastapi.testclient import TestClient

from app_api.integrations.collector.policies import clear_policy_snapshot_cache
from app_api.integrations.collector.topology import clear_topology_snapshot_cache
from app_api.main import app
import test_app as test_app_contracts

client = TestClient(app)

PID = "PE1:static_local:192.0.2.11:100"


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


def test_policy_change_safety_case_json(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get("/api/v1/reports/change-safety-case/policy", params={"policy_id": PID})
    assert r.status_code == 200
    p = r.json()
    assert p["contract_id"] == "change_safety_case_v1"
    assert p["safety_case_context"] == "policy_change_safety"
    assert p["anchor_policy_id"] == PID
    assert p["policy_dossier"]["contract_id"] == "policy_dossier_v1"
    assert "policy_dossier_v1" in p["source_contract_ids"]
    assert "not_dry_run_or_simulation" in p["safety_framing"]["explicit_non_claims"]
    assert isinstance(p["evidence_gaps"], list)
    assert len(p["evidence_inventory"]) >= 1


def test_policy_change_safety_case_markdown(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get(
        "/api/v1/reports/change-safety-case/policy",
        params={"policy_id": PID, "format": "markdown"},
    )
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/markdown")
    body = r.text
    assert "# Change safety case: policy_change_safety" in body
    assert "change_safety_case_v1" in body
    assert "```json" in body


def test_policy_change_safety_unknown_returns_404(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get("/api/v1/reports/change-safety-case/policy", params={"policy_id": "no-such-policy"})
    assert r.status_code == 404


def test_policy_change_safety_missing_param_returns_422() -> None:
    r = client.get("/api/v1/reports/change-safety-case/policy")
    assert r.status_code == 422


def test_service_change_safety_case_json(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get("/api/v1/reports/change-safety-case/service", params={"service_id": "color:100"})
    assert r.status_code == 200
    p = r.json()
    assert p["contract_id"] == "change_safety_case_v1"
    assert p["safety_case_context"] == "service_change_safety"
    assert p["anchor_service_id"] == "color:100"
    assert p["service_dossier"]["contract_id"] == "service_dossier_v1"
    assert "service_dossier_v1" in p["source_contract_ids"]


def test_service_change_safety_unknown_returns_404(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get("/api/v1/reports/change-safety-case/service", params={"service_id": "color:999999"})
    assert r.status_code == 404


def test_topology_change_safety_case_json(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get("/api/v1/reports/change-safety-case/maintenance", params={"node_id": "PE1"})
    assert r.status_code == 200
    p = r.json()
    assert p["contract_id"] == "change_safety_case_v1"
    assert p["safety_case_context"] == "topology_change_safety"
    assert p["anchor_maintenance"]["object_id"] == "PE1"
    assert p["maintenance_preview"]["contract_id"] == "maintenance_preview_v1"
    assert "maintenance_preview_v1" in p["source_contract_ids"]


def test_topology_change_safety_missing_subject_returns_422() -> None:
    r = client.get("/api/v1/reports/change-safety-case/maintenance")
    assert r.status_code == 422


def test_topology_change_safety_unknown_object_returns_404(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get(
        "/api/v1/reports/change-safety-case/maintenance",
        params={"object_kind": "node", "object_id": "no-such-node"},
    )
    assert r.status_code == 404
