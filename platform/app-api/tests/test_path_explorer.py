"""Contract tests for GET /api/v1/path-explorer (Path Explorer v1)."""

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


def test_path_explorer_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/path-explorer", params={"policy_id": "does-not-exist"})
    assert response.status_code == 404


def test_path_explorer_contract_nested_and_sources(monkeypatch: pytest.MonkeyPatch) -> None:
    """Pins path_explorer_v1 and nested path-analysis + explainability authority."""
    _stub_live_policy_and_topology(monkeypatch)
    pid = "PE1:static_local:192.0.2.11:100"
    response = client.get("/api/v1/path-explorer", params={"policy_id": pid})
    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_id"] == "path_explorer_v1"
    assert payload["policy_id"] == pid
    assert payload["path_analysis"]["safety_framing"]["contract_id"] == "path_analysis_phase2_v1"
    assert payload["explainability"]["contract_id"] == "policy_explainability_workspace_v1"
    assert "path_analysis_phase2_v1" in payload["source_contract_ids"]
    assert "policy_explainability_workspace_v1" in payload["source_contract_ids"]
    if payload.get("policy_dossier") is not None:
        assert payload["policy_dossier"]["contract_id"] == "policy_dossier_v1"
        assert "policy_dossier_v1" in payload["source_contract_ids"]
    assert isinstance(payload["merged_caveats"], list)
    assert isinstance(payload["explicit_non_claims"], list)
    assert any("path_explorer_v1" in x.lower() for x in payload["explicit_non_claims"])


def test_path_explorer_sparse_explainability_topology(monkeypatch: pytest.MonkeyPatch) -> None:
    """Empty topology-impact in explainability: merged_caveats stay honest (sparse path)."""
    _stub_live_policy_and_topology(monkeypatch)
    pid = "PE1:static_local:192.0.2.11:100"

    from app_api.services.policy_topology_impact import (
        build_policy_topology_impact_response as real_topo_impact,
    )

    def _sparse_impact(policy_id: str):
        out = real_topo_impact(policy_id)
        if out is None:
            return None
        return out.model_copy(update={"items": []})

    monkeypatch.setattr(
        "app_api.services.policy_explainability.build_policy_topology_impact_response",
        _sparse_impact,
    )

    response = client.get("/api/v1/path-explorer", params={"policy_id": pid})
    assert response.status_code == 200
    payload = response.json()
    assert payload["explainability"]["sparse_signals"]["topology_naming_alignment_unknown"] is True
    merged = "\n".join(payload["merged_caveats"]).lower()
    assert "topology" in merged or "unknown" in merged
