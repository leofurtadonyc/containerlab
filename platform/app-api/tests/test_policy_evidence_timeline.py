"""Contract tests for GET /api/v1/policies/{policy_id}/evidence-timeline."""

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


def test_evidence_timeline_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/policies/does-not-exist/evidence-timeline")
    assert response.status_code == 404


def test_evidence_timeline_contract_and_non_claims(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    pid = "PE1:static_local:192.0.2.11:100"
    response = client.get(f"/api/v1/policies/{pid}/evidence-timeline")
    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_id"] == "policy_evidence_timeline_v1"
    assert payload["policy_id"] == pid
    assert "not_unified_forensic_chronology" in payload["safety_framing"]["explicit_non_claims"]
    assert "not_validation_truth" in payload["safety_framing"]["explicit_non_claims"]
    kinds = {e["entry_kind"] for e in payload["entries"]}
    assert "policy_inventory_snapshot_anchor" in kinds
    assert "degraded_policy_v1_signal_anchor" in kinds
    assert "path_analysis_assembly_anchor" in kinds


def test_evidence_timeline_sparse_history(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    monkeypatch.setattr(
        "app_api.services.policy_evidence_timeline._build_policy_history_window",
        lambda **kwargs: __import__(
            "app_api.models.policy",
            fromlist=["PolicyHistoryWindow"],
        ).PolicyHistoryWindow(
            status="unavailable",
            summary="No history.",
            recent_snapshots=[],
        ),
    )
    monkeypatch.setattr(
        "app_api.services.policy_evidence_timeline.load_recent_policy_snapshot_summaries",
        lambda limit: [],
    )
    pid = "PE1:static_local:192.0.2.11:100"
    response = client.get(f"/api/v1/policies/{pid}/evidence-timeline")
    assert response.status_code == 200
    payload = response.json()
    assert any("No persisted" in n or "persisted" in n.lower() for n in payload["missing_evidence_notes"])
    assert not any(e["entry_kind"] == "policy_history_persisted_checkpoint" for e in payload["entries"])


def test_evidence_timeline_ordering_newest_first(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    pid = "PE1:static_local:192.0.2.11:100"
    response = client.get(f"/api/v1/policies/{pid}/evidence-timeline")
    assert response.status_code == 200
    entries = response.json()["entries"]
    keys = [e["sort_key"] for e in entries]
    assert keys == sorted(keys, reverse=True)


def test_evidence_timeline_scope_summary_partial_when_sparse(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    monkeypatch.setattr(
        "app_api.services.policy_evidence_timeline._build_policy_history_window",
        lambda **kwargs: __import__(
            "app_api.models.policy",
            fromlist=["PolicyHistoryWindow"],
        ).PolicyHistoryWindow(
            status="unavailable",
            summary="No history.",
            recent_snapshots=[],
        ),
    )
    monkeypatch.setattr(
        "app_api.services.policy_evidence_timeline.load_recent_policy_snapshot_summaries",
        lambda limit: [],
    )
    response = client.get("/api/v1/policies/PE1:static_local:192.0.2.11:100/evidence-timeline")
    assert response.status_code == 200
    assert "Partial" in response.json()["scope_summary"]
