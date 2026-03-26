"""Contract tests for GET /api/v1/topology/objects/{object_id}/evidence-timeline."""

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


def test_topology_object_evidence_timeline_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/topology/objects/unknown-node-xyz/evidence-timeline")
    assert response.status_code == 404


def test_topology_object_evidence_timeline_contract_and_shape(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/topology/objects/PE1/evidence-timeline")
    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_id"] == "topology_object_evidence_timeline_v1"
    assert payload["object_kind"] == "node"
    assert payload["object_id"] == "PE1"
    assert "not_topology_pairing_or_coverage_truth" in payload["safety_framing"]["explicit_non_claims"]
    assert "not_substitute_for_policy_timeline" in payload["safety_framing"]["explicit_non_claims"]
    kinds = {e["entry_kind"] for e in payload["entries"]}
    assert "topology_object_snapshot_anchor" in kinds
    assert "failure_impact_assembly_anchor" in kinds
    assert "related_policies_list_anchor" in kinds
    assert "topology_risk_summary_row_anchor" in kinds
    assert "related_policy_timeline_entry" in kinds
