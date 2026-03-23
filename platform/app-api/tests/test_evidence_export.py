"""Contract tests for GET /api/v1/exports/... evidence export v1."""

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


def test_export_policy_dossier_json_success(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    pid = "PE1:static_local:192.0.2.11:100"
    r = client.get(f"/api/v1/exports/policies/{pid}/dossier")
    assert r.status_code == 200
    payload = r.json()
    assert payload["contract_id"] == "evidence_export_v1"
    assert payload["export_kind"] == "policy_dossier"
    assert payload["subject_ref"]["policy_id"] == pid
    assert "policy_dossier_v1" in payload["source_contract_ids"]
    assert payload["nested"]["contract_id"] == "policy_dossier_v1"
    assert payload["explicit_non_claims"]
    assert payload["export_framing"]


def test_export_policy_dossier_sparse_nested(monkeypatch: pytest.MonkeyPatch) -> None:
    """Sparse topology-impact items still export honestly with nested contract."""
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

    r = client.get(f"/api/v1/exports/policies/{pid}/dossier")
    assert r.status_code == 200
    payload = r.json()
    assert payload["nested"]["topology_impact"]["items"] == []


def test_export_policy_dossier_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get("/api/v1/exports/policies/does-not-exist/dossier")
    assert r.status_code == 404


def test_export_topology_object_dossier_json_success(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get("/api/v1/exports/topology-objects/PE1/dossier")
    assert r.status_code == 200
    payload = r.json()
    assert payload["contract_id"] == "evidence_export_v1"
    assert payload["export_kind"] == "topology_object_dossier"
    assert payload["subject_ref"]["object_id"] == "PE1"
    assert "topology_object_dossier_v1" in payload["source_contract_ids"]
    assert payload["nested"]["contract_id"] == "topology_object_dossier_v1"


def test_export_topology_object_dossier_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get("/api/v1/exports/topology-objects/no-such-object/dossier")
    assert r.status_code == 404


def test_export_situation_room_summary_json_success(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get("/api/v1/exports/situation-room/summary?sync_runs_limit=5")
    assert r.status_code == 200
    payload = r.json()
    assert payload["contract_id"] == "evidence_export_v1"
    assert payload["export_kind"] == "situation_room"
    assert payload["subject_ref"]["sync_runs_limit"] == 5
    assert "evidence_pack_phase2_v1" in payload["source_contract_ids"]
    assert payload["nested"]["safety"]["contract_id"] == "evidence_pack_phase2_v1"


def test_export_investigation_workspace_summary_json_success(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get("/api/v1/exports/investigation-workspace/summary")
    assert r.status_code == 200
    payload = r.json()
    assert payload["contract_id"] == "evidence_export_v1"
    assert payload["export_kind"] == "investigation_workspace"
    assert "investigation_workspace_phase2_v1" in payload["source_contract_ids"]
    assert payload["nested"]["recent_change"]["safety"]["contract_id"]


def test_export_policy_dossier_markdown_format(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    pid = "PE1:static_local:192.0.2.11:100"
    r = client.get(f"/api/v1/exports/policies/{pid}/dossier?format=markdown")
    assert r.status_code == 200
    assert r.headers.get("content-type", "").startswith("text/markdown")
    body = r.text
    assert "# Evidence export: policy_dossier" in body
    assert "```json" in body
    assert "policy_dossier_v1" in body
