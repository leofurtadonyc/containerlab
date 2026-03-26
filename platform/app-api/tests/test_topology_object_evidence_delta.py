"""Contract tests for GET /api/v1/topology/objects/{object_id}/evidence-delta."""

from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

from app_api.integrations.collector.policies import clear_policy_snapshot_cache
from app_api.integrations.collector.topology import clear_topology_snapshot_cache
from app_api.main import app
from app_api.models.policy import PolicyHistoryWindow
from app_api.persistence.read_side import PersistedPolicySnapshot
from app_api.services.policies import _build_policy_inventory
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


def test_topology_object_evidence_delta_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/topology/objects/unknown-node-xyz/evidence-delta")
    assert response.status_code == 404


def test_topology_object_evidence_delta_no_comparable_anchor(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    monkeypatch.setattr(
        "app_api.services.topology_object_evidence_delta._build_policy_history_window",
        lambda **kwargs: PolicyHistoryWindow(
            status="unavailable",
            summary="No persisted snapshots.",
            recent_snapshots=[],
        ),
    )
    response = client.get("/api/v1/topology/objects/PE1/evidence-delta")
    assert response.status_code == 200
    payload = response.json()
    assert payload["comparison_status"] == "no_comparable_anchor"
    assert payload["previous_anchor"] is None
    assert payload["contract_id"] == "topology_object_evidence_delta_v1"
    assert any(i["category"] == "gap_note" for i in payload["delta_items"])
    assert "not_topology_drift_truth" in payload["safety_framing"]["explicit_non_claims"]


def test_topology_object_evidence_delta_insufficient_evidence(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    monkeypatch.setattr(
        "app_api.services.topology_object_evidence_delta._build_policy_history_window",
        lambda **kwargs: PolicyHistoryWindow(
            status="comparison_ready",
            summary="ready",
            recent_snapshots=[],
            comparison_to_previous=None,
        ),
    )
    monkeypatch.setattr(
        "app_api.services.topology_object_evidence_delta.load_previous_policy_snapshot",
        lambda: None,
    )
    response = client.get("/api/v1/topology/objects/PE1/evidence-delta")
    assert response.status_code == 200
    payload = response.json()
    assert payload["comparison_status"] == "insufficient_evidence"
    assert payload["previous_anchor"] is None


def test_topology_object_evidence_delta_delta_ready_shape(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    collector_snapshot, snapshot, _persisted_at = _build_policy_inventory()
    assert collector_snapshot is not None
    anchor_snap = snapshot.model_copy(deep=True)
    fake_policy = PersistedPolicySnapshot(
        snapshot_id="snap-prev",
        sync_run_id="run-prev",
        persisted_at=datetime.now(tz=UTC),
        data_status="live",
        snapshot=anchor_snap,
    )
    fake_topo = test_app_contracts._build_persisted_topology_snapshot()
    monkeypatch.setattr(
        "app_api.services.topology_object_evidence_delta._build_policy_history_window",
        lambda **kwargs: PolicyHistoryWindow(
            status="comparison_ready",
            summary="ready",
            recent_snapshots=[],
            comparison_to_previous=None,
        ),
    )
    monkeypatch.setattr(
        "app_api.services.topology_object_evidence_delta.load_previous_policy_snapshot",
        lambda: fake_policy,
    )
    monkeypatch.setattr(
        "app_api.services.topology_object_evidence_delta.load_previous_topology_snapshot",
        lambda: fake_topo,
    )
    response = client.get("/api/v1/topology/objects/PE1/evidence-delta")
    assert response.status_code == 200
    payload = response.json()
    assert payload["comparison_status"] == "delta_ready"
    assert payload["previous_anchor"] is not None
    assert payload["previous_anchor"]["policy_snapshot_id"] == "snap-prev"
    assert payload["previous_anchor"]["topology_snapshot_id"] == "topology-snapshot-1"
    assert isinstance(payload["delta_items"], list)
    assert payload["object_id"] == "PE1"
