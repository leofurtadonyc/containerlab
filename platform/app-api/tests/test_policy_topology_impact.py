"""Contract tests for GET /api/v1/policies/{policy_id}/topology-impact."""

import pytest
from fastapi.testclient import TestClient

from app_api.integrations.collector.policies import clear_policy_snapshot_cache
from app_api.integrations.collector.topology import clear_topology_snapshot_cache
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


def test_policy_topology_impact_lists_nodes_and_links(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    pid = "PE1:static_local:192.0.2.11:100"
    response = client.get(f"/api/v1/policies/{pid}/topology-impact")

    assert response.status_code == 200
    payload = response.json()
    assert payload["policy_id"] == pid
    assert payload["policy_name"]
    assert payload["metadata"]["phase"] == "phase_2_read_only_foundation"
    assert any("exact string equality" in c.lower() for c in payload["global_caveats"])
    kinds = {r["topology_object_kind"] for r in payload["items"]}
    assert "node" in kinds
    assert "link" in kinds
    node_rows = [r for r in payload["items"] if r["topology_object_kind"] == "node"]
    assert any(r["topology_object_id"] == "PE1" for r in node_rows)


def test_policy_topology_impact_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/policies/does-not-exist/topology-impact")

    assert response.status_code == 404
    err = response.json()
    assert err["code"] == "http_error"
