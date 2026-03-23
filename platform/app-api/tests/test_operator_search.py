"""Tests for GET /api/v1/operator-search."""

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


def _stub_read_side(monkeypatch: pytest.MonkeyPatch) -> None:
    test_app_contracts._disable_read_side_persistence(monkeypatch)
    monkeypatch.setattr(
        "app_api.services.capabilities.persist_readiness_snapshot",
        lambda **kwargs: None,
    )

    class StubInventory:
        def read_inventory_snapshot(self):
            return test_app_contracts._build_live_inventory_snapshot()

    class StubCollectorPolicyClient:
        def read_policy_snapshot(self):
            return test_app_contracts._build_live_policy_snapshot()

    class StubCollectorTopologyClient:
        def read_topology_snapshot(self):
            return test_app_contracts._build_live_topology_snapshot()

    monkeypatch.setattr(
        "app_api.services.devices.get_collector_inventory_client",
        lambda: StubInventory(),
    )
    monkeypatch.setattr(
        "app_api.services.policies.get_collector_policy_client",
        lambda: StubCollectorPolicyClient(),
    )
    monkeypatch.setattr(
        "app_api.services.topology.get_collector_topology_client",
        lambda: StubCollectorTopologyClient(),
    )


def test_operator_search_missing_q_returns_422() -> None:
    response = client.get("/api/v1/operator-search")
    assert response.status_code == 422


def test_operator_search_empty_query_after_trim_returns_422() -> None:
    response = client.get("/api/v1/operator-search?q=")
    assert response.status_code == 422
    response = client.get("/api/v1/operator-search?q=%20%20")
    assert response.status_code == 422


def test_operator_search_ambiguous_short_query() -> None:
    response = client.get("/api/v1/operator-search?q=a")
    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_id"] == "operator_search_pivot_v1"
    assert payload["result_state"] == "ambiguous"
    assert payload["groups"] == []
    assert payload["guidance"]


def test_operator_search_no_hits() -> None:
    response = client.get("/api/v1/operator-search?q=zzzz_no_such_inventory_token_999")
    assert response.status_code == 200
    payload = response.json()
    assert payload["result_state"] == "no_hits"
    assert payload["groups"] == []


def test_operator_search_direct_policy_hit(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_read_side(monkeypatch)
    pid = "PE1:static_local:192.0.2.11:100"
    response = client.get(f"/api/v1/operator-search?q={pid}")
    assert response.status_code == 200
    payload = response.json()
    assert payload["result_state"] == "hits"
    assert payload["q"] == pid
    pol_groups = [g for g in payload["groups"] if g["family"] == "policies"]
    assert pol_groups
    hit = pol_groups[0]["items"][0]
    assert hit["primary_id"] == pid
    assert hit["ranking_basis"] == "exact_id"
    assert hit["pivot"]["view"] == "policies"
    assert hit["pivot"]["policy_id"] == pid
    assert "match_reason" in hit


def test_operator_search_direct_topology_hit(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_read_side(monkeypatch)
    link_id = "P1--PE1"
    response = client.get(f"/api/v1/operator-search?q={link_id}")
    assert response.status_code == 200
    payload = response.json()
    assert payload["result_state"] == "hits"
    link_groups = [g for g in payload["groups"] if g["family"] == "topology_links"]
    assert link_groups
    hit = link_groups[0]["items"][0]
    assert hit["primary_id"] == link_id
    assert hit["ranking_basis"] == "exact_id"
    assert hit["pivot"]["topology_object_kind"] == "link"
    assert hit["pivot"]["topology_object"] == link_id


def test_operator_search_ambiguous_multi_family_hits(monkeypatch: pytest.MonkeyPatch) -> None:
    """Query 'PE1' matches device id, topology node, and policy substrings — multiple groups."""
    _stub_read_side(monkeypatch)
    response = client.get("/api/v1/operator-search?q=PE1")
    assert response.status_code == 200
    payload = response.json()
    assert payload["result_state"] == "hits"
    families = {g["family"] for g in payload["groups"]}
    assert "devices" in families
    assert "topology_nodes" in families
    assert "policies" in families
    assert payload["explicit_non_claims"]


def test_operator_search_contract_metadata(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_read_side(monkeypatch)
    response = client.get("/api/v1/operator-search?q=static")
    assert response.status_code == 200
    payload = response.json()
    assert payload["service"] == "app-api"
    assert payload["phase"] == "phase_2_read_only_foundation"
    assert "generated_at" in payload
