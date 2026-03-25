"""Contract tests for GET /api/v1/maintenance-preview."""

import pytest
from fastapi.testclient import TestClient

from app_api.integrations.collector.policies import CollectorPolicySnapshot, clear_policy_snapshot_cache
from app_api.integrations.collector.topology import (
    CollectorTopologyNodeRecord,
    CollectorTopologySnapshot,
    clear_topology_snapshot_cache,
)
from app_api.main import app
import test_app as test_app_contracts

client = TestClient(app)


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


def _topology_with_orphan_node() -> CollectorTopologySnapshot:
    base = test_app_contracts._build_live_topology_snapshot()
    extra = CollectorTopologyNodeRecord(
        node_id="ORPHAN",
        display_name="ORPHAN",
        role="pe",
        state="up",
        source="gnmi",
        device_id="ORPHAN",
        attributes={},
    )
    return base.model_copy(update={"nodes": list(base.nodes) + [extra]})


def test_maintenance_preview_missing_subject_returns_422() -> None:
    response = client.get("/api/v1/maintenance-preview")
    assert response.status_code == 422


def test_maintenance_preview_object_id_without_kind_returns_422() -> None:
    response = client.get("/api/v1/maintenance-preview", params={"object_id": "PE1"})
    assert response.status_code == 422


def test_maintenance_preview_unknown_object_returns_404(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get(
        "/api/v1/maintenance-preview",
        params={"object_kind": "node", "object_id": "no-such-node"},
    )
    assert response.status_code == 404


def test_maintenance_preview_kind_mismatch_returns_422(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get(
        "/api/v1/maintenance-preview",
        params={"object_kind": "link", "object_id": "PE1"},
    )
    assert response.status_code == 422
    assert "expected object_kind=" in response.json()["message"]


def test_maintenance_preview_node_contract_and_nested_assemblies(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/maintenance-preview", params={"node_id": "PE1"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_id"] == "maintenance_preview_v1"
    assert "maintenance_preview_v1" in payload["source_contract_ids"]
    assert "failure_impact_v1" in payload["source_contract_ids"]
    assert "service_explorer_v1" in payload["source_contract_ids"]
    assert payload["subject"]["object_id"] == "PE1"
    assert payload["subject"]["object_kind"] == "node"
    assert payload["failure_impact"]["contract_id"] == "failure_impact_v1"
    assert payload["failure_impact"]["subject"] == {"kind": "node", "object_id": "PE1"}
    assert "not_safe_to_change_risk_scoring_or_approval" in payload["safety_framing"]["explicit_non_claims"]
    assert "not_graph_simulation" in payload["failure_impact"]["safety_framing"]["explicit_non_claims"]


def test_maintenance_preview_link_preview(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/maintenance-preview", params={"link_id": "P1--PE1"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["subject"]["object_kind"] == "link"
    assert payload["subject"]["object_id"] == "P1--PE1"
    assert payload["failure_impact"]["rollup_counts"]["related_policies_total"] == 2


def test_maintenance_preview_sparse_orphan_node(monkeypatch: pytest.MonkeyPatch) -> None:
    test_app_contracts._disable_read_side_persistence(monkeypatch)

    class StubCollectorPolicyClient:
        def read_policy_snapshot(self):
            return test_app_contracts._build_live_policy_snapshot()

    class StubCollectorTopologyClient:
        def read_topology_snapshot(self):
            return _topology_with_orphan_node()

    monkeypatch.setattr(
        "app_api.services.policies.get_collector_policy_client",
        lambda: StubCollectorPolicyClient(),
    )
    monkeypatch.setattr(
        "app_api.services.topology.get_collector_topology_client",
        lambda: StubCollectorTopologyClient(),
    )

    response = client.get("/api/v1/maintenance-preview", params={"node_id": "ORPHAN"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["failure_impact"]["rollup_counts"]["related_policies_total"] == 0
    assert payload["sparse_preview"] is True
    assert any("no_related_policies" in r for r in payload["sparse_reasons"])
