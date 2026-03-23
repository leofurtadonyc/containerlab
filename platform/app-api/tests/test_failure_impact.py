"""Contract tests for GET /api/v1/topology/objects/{object_id}/failure-impact."""

import copy

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


def test_failure_impact_unknown_object_returns_404(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/topology/objects/no-such-object/failure-impact")
    assert response.status_code == 404


def test_failure_impact_node_related_policies_and_rollups(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/topology/objects/PE1/failure-impact")
    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_id"] == "failure_impact_v1"
    assert payload["subject"] == {"kind": "node", "object_id": "PE1"}
    assert payload["rollup_counts"]["related_policies_total"] >= 1
    assert (
        payload["rollup_counts"]["degraded_related_policies_total"]
        + payload["rollup_counts"]["non_degraded_related_policies_total"]
        == payload["rollup_counts"]["related_policies_total"]
    )
    b = payload["degraded_posture_breakdown"]
    assert b["ok"] + b["degraded"] + b["unknown"] == payload["rollup_counts"]["related_policies_total"]
    assert payload["rollup_counts"]["related_policies_path_analysis_supported_total"] == b["ok"] + b[
        "degraded"
    ] + b["unknown"]
    assert "not_graph_simulation" in payload["safety_framing"]["explicit_non_claims"]


def test_failure_impact_link_unions_endpoints(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/topology/objects/P1--PE1/failure-impact")
    assert response.status_code == 200
    payload = response.json()
    assert payload["subject"] == {"kind": "link", "object_id": "P1--PE1"}
    assert payload["rollup_counts"]["related_policies_total"] == 2
    assert payload["rollup_counts"]["degraded_related_policies_total"] >= 1
    assert payload["rollup_counts"]["non_degraded_related_policies_total"] >= 1


def test_failure_impact_empty_related_policies(monkeypatch: pytest.MonkeyPatch) -> None:
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

    response = client.get("/api/v1/topology/objects/ORPHAN/failure-impact")
    assert response.status_code == 200
    payload = response.json()
    assert payload["rollup_counts"]["related_policies_total"] == 0
    assert payload["degraded_posture_breakdown"] == {"ok": 0, "degraded": 0, "unknown": 0}


def test_failure_impact_degraded_counts_on_link(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/topology/objects/P1--PE1/failure-impact")
    payload = response.json()
    # P1 policy is degraded v1; PE1 policy is ok in default stub
    assert payload["rollup_counts"]["degraded_related_policies_total"] == 1
    assert payload["rollup_counts"]["non_degraded_related_policies_total"] == 1
    assert payload["degraded_posture_breakdown"]["degraded"] == 1
    assert payload["degraded_posture_breakdown"]["ok"] == 1


def test_failure_impact_partial_path_analysis_support(monkeypatch: pytest.MonkeyPatch) -> None:
    """One related policy unsupported for path-analysis => supported count < related total."""
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

    response = client.get("/api/v1/topology/objects/PE1/failure-impact")
    assert response.status_code == 200
    payload = response.json()
    assert payload["rollup_counts"]["related_policies_total"] >= 1
    assert payload["rollup_counts"]["related_policies_path_analysis_supported_total"] < payload[
        "rollup_counts"
    ]["related_policies_total"]
    assert any("Path-analysis interpretation is limited" in n for n in payload["missing_evidence_notes"])
