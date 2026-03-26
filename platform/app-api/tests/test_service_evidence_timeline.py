"""Contract tests for GET /api/v1/services/{service_id}/evidence-timeline."""

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


def test_service_evidence_timeline_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/services/does-not-exist:foo/evidence-timeline")
    assert response.status_code == 404


def test_service_evidence_timeline_contract_and_shape(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    pid = "PE1:static_local:192.0.2.11:100"
    sid = f"policy:{pid}"
    response = client.get(f"/api/v1/services/{sid}/evidence-timeline")
    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_id"] == "service_evidence_timeline_v1"
    assert payload["service_id"] == sid
    assert "not_unified_incident_chronology" in payload["safety_framing"]["explicit_non_claims"]
    assert "not_substitute_for_policy_timeline" in payload["safety_framing"]["explicit_non_claims"]
    kinds = {e["entry_kind"] for e in payload["entries"]}
    assert "service_membership_snapshot_anchor" in kinds
    assert "service_degraded_roll_up_context" in kinds
    assert "member_policy_timeline_entry" in kinds
    member_entries = [e for e in payload["entries"] if e["entry_kind"] == "member_policy_timeline_entry"]
    assert all(e.get("policy_id") == pid for e in member_entries)
