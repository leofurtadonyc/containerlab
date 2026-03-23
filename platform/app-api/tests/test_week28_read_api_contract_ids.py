"""Regression: week 28 read APIs expose stable contract_id values (structural smoke).

Aligned with ``verify-core-runtime.sh`` sampling—not a duplicate of ranking or rollup logic.
"""

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


def test_week28_read_endpoints_expose_expected_contract_ids(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    policy_id = "PE1:static_local:192.0.2.11:100"
    node_id = "PE1"

    r = client.get("/api/v1/topology/risk-summary")
    assert r.status_code == 200
    assert r.json()["contract_id"] == "topology_risk_summary_v1"

    r = client.get(f"/api/v1/topology/objects/{node_id}/failure-impact")
    assert r.status_code == 200
    assert r.json()["contract_id"] == "failure_impact_v1"

    r = client.get(f"/api/v1/policies/{policy_id}/evidence-timeline")
    assert r.status_code == 200
    assert r.json()["contract_id"] == "policy_evidence_timeline_v1"

    r = client.get(f"/api/v1/policies/{policy_id}/evidence-delta")
    assert r.status_code == 200
    body = r.json()
    assert body["contract_id"] == "policy_evidence_delta_v1"
    assert body["comparison_status"] in (
        "delta_ready",
        "no_comparable_anchor",
        "anchor_policy_absent",
        "insufficient_evidence",
    )
