"""Contract tests for GET /api/v1/policies/{policy_id}/dossier."""

import copy

import pytest
from fastapi.testclient import TestClient

from app_api.integrations.collector.policies import CollectorPolicySnapshot, clear_policy_snapshot_cache
from app_api.integrations.collector.topology import clear_topology_snapshot_cache
from app_api.main import app
from app_api.models.policy import PolicyHistoryWindow
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


def test_policy_dossier_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/policies/does-not-exist/dossier")
    assert response.status_code == 404


def test_policy_dossier_present_contract_and_nested_ids(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    pid = "PE1:static_local:192.0.2.11:100"
    response = client.get(f"/api/v1/policies/{pid}/dossier")
    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_id"] == "policy_dossier_v1"
    assert payload["policy_record"]["policy_id"] == pid
    assert payload["policy_record"]["degraded_policy_v1"]["contract_id"] == "degraded_policy_v1"
    assert payload["path_analysis"]["safety_framing"]["contract_id"] == "path_analysis_phase2_v1"
    assert payload["topology_impact"]["policy_id"] == pid
    assert payload["evidence_timeline"]["contract_id"] == "policy_evidence_timeline_v1"
    assert payload["evidence_delta"]["contract_id"] == "policy_evidence_delta_v1"
    assert payload["navigation_targets"]["investigation_shell_params"]["inv_from"] == "policies"
    assert payload["navigation_targets"]["investigation_shell_params"]["policy_id"] == pid
    assert payload["freshness"]["policy_serving_mode_echo"]
    assert payload["merged_caveats"]


def test_policy_dossier_sparse_topology_impact(monkeypatch: pytest.MonkeyPatch) -> None:
    """Empty topology-impact items still returns 200 with honest nested contract."""
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
        "app_api.services.policy_dossier.build_policy_topology_impact_response",
        _sparse_impact,
    )

    response = client.get(f"/api/v1/policies/{pid}/dossier")
    assert response.status_code == 200
    payload = response.json()
    assert payload["topology_impact"]["items"] == []
    assert payload["contract_id"] == "policy_dossier_v1"


def test_policy_dossier_comparison_not_ready_merges_caveat(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    monkeypatch.setattr(
        "app_api.services.policy_evidence_delta._build_policy_history_window",
        lambda **kwargs: PolicyHistoryWindow(
            status="unavailable",
            summary="No persisted snapshots.",
            recent_snapshots=[],
        ),
    )
    pid = "PE1:static_local:192.0.2.11:100"
    response = client.get(f"/api/v1/policies/{pid}/dossier")
    assert response.status_code == 200
    payload = response.json()
    assert payload["evidence_delta"]["comparison_status"] == "no_comparable_anchor"
    merged = "\n".join(payload["merged_caveats"])
    assert "comparison_status=no_comparable_anchor" in merged or "no_comparable_anchor" in merged


def test_policy_dossier_path_analysis_caveat_propagates(monkeypatch: pytest.MonkeyPatch) -> None:
    """Unsupported policy support_state => path-analysis caveat appears in merged caveats."""
    test_app_contracts._disable_read_side_persistence(monkeypatch)
    live = test_app_contracts._build_live_policy_snapshot()
    data = live.model_dump()
    records = copy.deepcopy(data["records"])
    records[0]["support_state"] = "unsupported"
    data["records"] = records
    stub_snapshot = CollectorPolicySnapshot(**data)

    class StubCollectorPolicyClient:
        def read_policy_snapshot(self):
            return stub_snapshot

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

    pid = stub_snapshot.records[0].policy_id
    response = client.get(f"/api/v1/policies/{pid}/dossier")
    assert response.status_code == 200
    merged = "\n".join(response.json()["merged_caveats"])
    assert "path-analysis" in merged.lower() or "interpretation" in merged.lower()
