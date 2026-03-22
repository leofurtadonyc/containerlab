"""Contract tests for GET /api/v1/topology/objects/{object_id}/related-policies."""

import pytest
from fastapi.testclient import TestClient

from app_api.integrations.collector.policies import clear_policy_snapshot_cache
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


def test_topology_related_policies_node_matches_string_fields(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/topology/objects/PE1/related-policies")

    assert response.status_code == 200
    payload = response.json()
    assert payload["object_kind"] == "node"
    assert payload["object_id"] == "PE1"
    assert payload["metadata"]["phase"] == "phase_2_read_only_foundation"
    assert any("exact string equality" in c.lower() for c in payload["global_caveats"])
    ids = {item["policy_id"] for item in payload["items"]}
    assert "PE1:static_local:192.0.2.11:100" in ids
    pe1_rows = [i for i in payload["items"] if i["policy_id"] == "PE1:static_local:192.0.2.11:100"]
    matched_fields = {r["matched_field"] for r in pe1_rows}
    assert "headend" in matched_fields
    assert "source_target" in matched_fields
    assert all(r["anchor_topology_node_id"] == "PE1" for r in pe1_rows)


def test_topology_related_policies_link_unions_endpoints(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/topology/objects/P1--PE1/related-policies")

    assert response.status_code == 200
    payload = response.json()
    assert payload["object_kind"] == "link"
    assert payload["object_id"] == "P1--PE1"
    ids = {item["policy_id"] for item in payload["items"]}
    assert "PE1:static_local:192.0.2.11:100" in ids
    assert "P1:static_non_local:198.51.100.1:200" in ids
    anchors = {item["anchor_topology_node_id"] for item in payload["items"]}
    assert anchors <= {"P1", "PE1"}


def test_topology_related_policies_unknown_object(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/topology/objects/no-such-object/related-policies")

    assert response.status_code == 404
    err = response.json()
    assert err["code"] == "http_error"
    assert "not found" in err["message"].lower() or "not a known" in err["message"].lower()


def test_topology_related_policies_partial_support_caveat(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/topology/objects/P1/related-policies")

    assert response.status_code == 200
    payload = response.json()
    assert payload["object_kind"] == "node"
    assert any(
        i["policy_id"] == "P1:static_non_local:198.51.100.1:200" and i["matched_field"] == "source_target"
        for i in payload["items"]
    )
    caveats = [c for c in payload["items"] if c["policy_id"] == "P1:static_non_local:198.51.100.1:200"]
    assert any("partially supported" in n.lower() for c in caveats for n in c["caveats"])


def test_topology_related_policies_collector_unavailable_empty_topology(monkeypatch: pytest.MonkeyPatch) -> None:
    test_app_contracts._disable_read_side_persistence(monkeypatch)

    class StubCollectorPolicyClient:
        def read_policy_snapshot(self):
            return test_app_contracts._build_live_policy_snapshot()

    class StubCollectorTopologyClient:
        def read_topology_snapshot(self) -> CollectorTopologySnapshot:
            return CollectorTopologySnapshot(
                integration="gnmi_collector_topology",
                status="collector_unavailable",
                destination_service="app-api",
                source_endpoint="http://gnmi-collector:9804/topology/snapshot",
                configured_target_count=0,
                observed_target_count=0,
                collection_success_count=0,
                collection_partial_count=0,
                collection_failure_count=0,
                oldest_observed_at=None,
                newest_observed_at=None,
                inference_posture="unknown",
                collection_posture="unknown",
                degraded_scope_summary="unavailable",
                endpoint_pairing_posture="unknown",
                node_participation_posture="unknown",
                paired_link_count=0,
                single_sided_link_count=0,
                linked_node_count=0,
                isolated_node_count=0,
                topology_id="platform-observed-topology",
                topology_name="Platform Observed Topology",
                sync_source="gnmi_collector_topology",
                sync_status="failed",
                completeness="unknown",
                observed_at=None,
                notes=["Collector unavailable"],
                nodes=[],
                links=[],
                timeout_budget_seconds=3,
                fetch_duration_seconds=0.0,
                fetch_error="unreachable",
            )

    monkeypatch.setattr(
        "app_api.services.policies.get_collector_policy_client",
        lambda: StubCollectorPolicyClient(),
    )
    monkeypatch.setattr(
        "app_api.services.topology.get_collector_topology_client",
        lambda: StubCollectorTopologyClient(),
    )
    monkeypatch.setattr("app_api.services.topology.load_latest_topology_snapshot", lambda: None)

    response = client.get("/api/v1/topology/objects/PE1/related-policies")
    assert response.status_code == 404
