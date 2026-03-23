"""Contract tests for GET /api/v1/topology/risk-summary."""

import copy

import pytest
from fastapi.testclient import TestClient

from app_api.integrations.collector.policies import CollectorPolicySnapshot, clear_policy_snapshot_cache
from app_api.integrations.collector.topology import (
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


def test_risk_summary_contract_and_ranking_order(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/topology/risk-summary")
    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_id"] == "topology_risk_summary_v1"
    assert "topology_risk_summary_v1 lexicographic" in payload["ranking_basis"]
    assert payload["total_objects"] == 3
    assert len(payload["ranked_objects"]) == 3
    # Link P1--PE1 has R=2 and D=1 in default stubs — should rank first
    first = payload["ranked_objects"][0]
    assert first["object_id"] == "P1--PE1"
    assert first["ranking_inputs"]["related_policy_breadth"] == 2
    assert first["ranking_inputs"]["degraded_related_count"] >= 1
    assert "not_validated_blast_radius" in payload["safety_framing"]["explicit_non_claims"]


def test_risk_summary_empty_topology(monkeypatch: pytest.MonkeyPatch) -> None:
    test_app_contracts._disable_read_side_persistence(monkeypatch)

    empty_topo = CollectorTopologySnapshot(
        integration="gnmi_collector_topology",
        status="live_normalized_feed",
        destination_service="app-api",
        source_endpoint="http://gnmi-collector:9804/topology/snapshot",
        configured_target_count=0,
        observed_target_count=0,
        collection_success_count=0,
        collection_partial_count=0,
        collection_failure_count=0,
        oldest_observed_at="2026-03-09T19:25:08.500000+00:00",
        newest_observed_at="2026-03-09T19:25:08.500000+00:00",
        inference_posture="unknown",
        collection_posture="blocked",
        degraded_scope_summary="empty",
        endpoint_pairing_posture="unknown",
        node_participation_posture="unknown",
        paired_link_count=0,
        single_sided_link_count=0,
        linked_node_count=0,
        isolated_node_count=0,
        topology_id="empty",
        topology_name="Empty",
        sync_source="test",
        sync_status="ok",
        completeness="partial",
        observed_at="2026-03-09T19:25:08.500000+00:00",
        notes=[],
        nodes=[],
        links=[],
        timeout_budget_seconds=3,
        fetch_duration_seconds=0.1,
        fetch_error=None,
    )

    class StubCollectorPolicyClient:
        def read_policy_snapshot(self):
            return test_app_contracts._build_live_policy_snapshot()

    class StubCollectorTopologyClient:
        def read_topology_snapshot(self):
            return empty_topo

    monkeypatch.setattr(
        "app_api.services.policies.get_collector_policy_client",
        lambda: StubCollectorPolicyClient(),
    )
    monkeypatch.setattr(
        "app_api.services.topology.get_collector_topology_client",
        lambda: StubCollectorTopologyClient(),
    )

    response = client.get("/api/v1/topology/risk-summary")
    assert response.status_code == 200
    payload = response.json()
    assert payload["total_objects"] == 0
    assert payload["ranked_objects"] == []
    assert payload["assembly_confidence"] == "low"
    assert any("no nodes or links" in c for c in payload["caveats"])


def test_risk_summary_no_related_policies_orphan_node(monkeypatch: pytest.MonkeyPatch) -> None:
    """Node with R=0 sorts after objects with R>0; counts are zero."""
    test_app_contracts._disable_read_side_persistence(monkeypatch)
    base = test_app_contracts._build_live_topology_snapshot()
    extra_node = copy.deepcopy(base.nodes[0])
    extra_node.node_id = "ORPHAN"
    extra_node.display_name = "ORPHAN"
    extra_node.device_id = "ORPHAN"
    topo = base.model_copy(update={"nodes": list(base.nodes) + [extra_node]})

    class StubCollectorPolicyClient:
        def read_policy_snapshot(self):
            return test_app_contracts._build_live_policy_snapshot()

    class StubCollectorTopologyClient:
        def read_topology_snapshot(self):
            return topo

    monkeypatch.setattr(
        "app_api.services.policies.get_collector_policy_client",
        lambda: StubCollectorPolicyClient(),
    )
    monkeypatch.setattr(
        "app_api.services.topology.get_collector_topology_client",
        lambda: StubCollectorTopologyClient(),
    )

    response = client.get("/api/v1/topology/risk-summary")
    assert response.status_code == 200
    payload = response.json()
    ranked = payload["ranked_objects"]
    assert ranked[-1]["object_id"] == "ORPHAN"
    assert ranked[-1]["ranking_inputs"]["related_policy_breadth"] == 0
    assert ranked[-1]["ranking_inputs"]["degraded_related_count"] == 0


def test_risk_summary_partial_path_analysis_support_note(monkeypatch: pytest.MonkeyPatch) -> None:
    """Unsupported policy row triggers aggregate path-analysis caveat."""
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

    response = client.get("/api/v1/topology/risk-summary")
    assert response.status_code == 200
    payload = response.json()
    assert any("Path-analysis interpretation is limited" in n for n in payload["missing_evidence_notes"])
