"""Contract tests for GET /api/v1/policies/{policy_id}/evidence-delta."""

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


def test_evidence_delta_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/policies/does-not-exist/evidence-delta")
    assert response.status_code == 404


def test_evidence_delta_no_comparable_anchor(monkeypatch: pytest.MonkeyPatch) -> None:
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
    response = client.get(f"/api/v1/policies/{pid}/evidence-delta")
    assert response.status_code == 200
    payload = response.json()
    assert payload["comparison_status"] == "no_comparable_anchor"
    assert payload["previous_anchor"] is None
    assert any(i["category"] == "gap_note" for i in payload["delta_items"])


def test_evidence_delta_insufficient_evidence(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    monkeypatch.setattr(
        "app_api.services.policy_evidence_delta._build_policy_history_window",
        lambda **kwargs: PolicyHistoryWindow(
            status="comparison_ready",
            summary="ready",
            recent_snapshots=[],
            comparison_to_previous=None,
        ),
    )
    monkeypatch.setattr(
        "app_api.services.policy_evidence_delta.load_previous_policy_snapshot",
        lambda: None,
    )
    pid = "PE1:static_local:192.0.2.11:100"
    response = client.get(f"/api/v1/policies/{pid}/evidence-delta")
    assert response.status_code == 200
    payload = response.json()
    assert payload["comparison_status"] == "insufficient_evidence"
    assert payload["previous_anchor"] is None


def test_evidence_delta_anchor_policy_absent(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    collector_snapshot, snapshot, _persisted_at = _build_policy_inventory()
    assert collector_snapshot is not None
    anchor_snap = snapshot.model_copy(deep=True)
    anchor_snap.records = []
    fake = PersistedPolicySnapshot(
        snapshot_id="prev-id",
        sync_run_id="sync-run",
        persisted_at=datetime(2026, 1, 1, tzinfo=UTC),
        data_status="live",
        source_endpoint="http://collector/policies",
        detail_ready_target_count=2,
        snapshot=anchor_snap,
    )
    monkeypatch.setattr(
        "app_api.services.policy_evidence_delta._build_policy_history_window",
        lambda **kwargs: PolicyHistoryWindow(
            status="comparison_ready",
            summary="ready",
            recent_snapshots=[],
            comparison_to_previous=None,
        ),
    )
    monkeypatch.setattr(
        "app_api.services.policy_evidence_delta.load_previous_policy_snapshot",
        lambda: fake,
    )
    pid = "PE1:static_local:192.0.2.11:100"
    response = client.get(f"/api/v1/policies/{pid}/evidence-delta")
    assert response.status_code == 200
    payload = response.json()
    assert payload["comparison_status"] == "anchor_policy_absent"
    assert payload["previous_anchor"]["snapshot_id"] == "prev-id"


def test_evidence_delta_contract_and_field_delta(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    collector_snapshot, snapshot, _persisted_at = _build_policy_inventory()
    assert collector_snapshot is not None
    anchor_snap = snapshot.model_copy(deep=True)
    pid = "PE1:static_local:192.0.2.11:100"
    for r in anchor_snap.records:
        if r.policy_id == pid:
            r.health_state = "degraded"
            break
    fake = PersistedPolicySnapshot(
        snapshot_id="prev-id",
        sync_run_id="sync-run",
        persisted_at=datetime(2026, 1, 1, tzinfo=UTC),
        data_status="live",
        source_endpoint="http://collector/policies",
        detail_ready_target_count=2,
        snapshot=anchor_snap,
    )
    monkeypatch.setattr(
        "app_api.services.policy_evidence_delta._build_policy_history_window",
        lambda **kwargs: PolicyHistoryWindow(
            status="comparison_ready",
            summary="ready",
            recent_snapshots=[],
            comparison_to_previous=None,
        ),
    )
    monkeypatch.setattr(
        "app_api.services.policy_evidence_delta.load_previous_policy_snapshot",
        lambda: fake,
    )
    response = client.get(f"/api/v1/policies/{pid}/evidence-delta")
    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_id"] == "policy_evidence_delta_v1"
    assert payload["comparison_status"] == "delta_ready"
    assert "not_drift_truth" in payload["safety_framing"]["explicit_non_claims"]
    categories = {d["category"] for d in payload["delta_items"]}
    assert "posture_or_state_field_change" in categories
    assert payload["previous_anchor"] is not None
