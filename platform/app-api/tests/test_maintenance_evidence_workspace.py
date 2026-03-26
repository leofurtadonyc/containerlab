"""Contract tests for GET /api/v1/maintenance-evidence-workspace."""

import pytest
from fastapi.testclient import TestClient

from app_api.integrations.collector.policies import clear_policy_snapshot_cache
from app_api.integrations.collector.topology import clear_topology_snapshot_cache
from app_api.main import app
import test_app as test_app_contracts

client = TestClient(app)


@pytest.fixture(autouse=True)
def _clear_caches() -> None:
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


def test_maintenance_evidence_workspace_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/maintenance-evidence-workspace", params={"node_id": "no-such-node-xyz"})
    assert response.status_code == 404


def test_maintenance_evidence_workspace_contract_and_nested(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/maintenance-evidence-workspace", params={"node_id": "PE1"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_id"] == "maintenance_evidence_workspace_v1"
    assert payload["object_id"] == "PE1"
    assert payload["object_kind"] == "node"
    assert payload["maintenance_preview"]["contract_id"] == "maintenance_preview_v1"
    assert payload["topology_object_dossier"]["contract_id"] == "topology_object_dossier_v1"
    assert payload["topology_object_evidence_timeline"]["contract_id"] == "topology_object_evidence_timeline_v1"
    assert payload["topology_object_evidence_delta"]["contract_id"] == "topology_object_evidence_delta_v1"
    assert payload["change_safety_case"]["contract_id"] == "change_safety_case_v1"
    assert payload["change_safety_case"]["safety_case_context"] == "topology_change_safety"
    assert "maintenance_evidence_workspace_v1" in payload["source_contract_ids"]
    assert any("maintenance_evidence_workspace_v1" in x.lower() for x in payload["explicit_non_claims"])


def test_maintenance_evidence_workspace_missing_subject_422() -> None:
    response = client.get("/api/v1/maintenance-evidence-workspace")
    assert response.status_code == 422
