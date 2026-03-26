"""Contract tests for GET /api/v1/maintenance-window-workspace."""

import pytest
from fastapi.testclient import TestClient

from app_api.integrations.collector.policies import clear_policy_snapshot_cache
from app_api.integrations.collector.topology import clear_topology_snapshot_cache
from app_api.main import app
from app_api.schemas.maintenance_window_workspace import MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS
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


def test_maintenance_window_workspace_missing_subject_422() -> None:
    response = client.get("/api/v1/maintenance-window-workspace")
    assert response.status_code == 422
    msg = response.json()["message"]
    assert "subject" in msg.lower() or "Provide" in msg


def test_maintenance_window_workspace_bad_token_422() -> None:
    response = client.get(
        "/api/v1/maintenance-window-workspace",
        params=[("subject", "bogus:PE1")],
    )
    assert response.status_code == 422


def test_maintenance_window_workspace_not_found_subjects_422(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get(
        "/api/v1/maintenance-window-workspace",
        params=[("subject", "node:no-such-node-xyz")],
    )
    assert response.status_code == 422
    msg = response.json()["message"]
    assert "failures" in msg or "No subjects" in msg or "missing-node" in msg


def test_maintenance_window_workspace_contract_multi_subject(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get(
        "/api/v1/maintenance-window-workspace",
        params=[
            ("subject", "node:PE1"),
            ("subject", "link:P1--PE1"),
            ("subject", "node:PE1"),
        ],
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_id"] == "maintenance_window_workspace_v1"
    assert payload["subjects_requested"] == 2
    assert payload["subjects_resolved"] == 2
    assert "node:PE1" in payload["selected_subjects"]
    assert "link:P1--PE1" in payload["selected_subjects"]
    assert len(payload["subject_strip"]) == 2
    assert payload["deduped_affected_services"]
    assert payload["deduped_related_policies"]
    assert any("maintenance_window_workspace_v1" in x.lower() for x in payload["explicit_non_claims"])
    assert "maintenance_preview_v1" in payload["source_contract_ids"]
    assert payload["subject_resolution_failures"] == []


def test_maintenance_window_workspace_partial_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get(
        "/api/v1/maintenance-window-workspace",
        params=[
            ("subject", "node:PE1"),
            ("subject", "node:missing-node-zzz"),
        ],
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["subjects_resolved"] == 1
    assert len(payload["subject_resolution_failures"]) == 1
    assert payload["subject_resolution_failures"][0]["object_id"] == "missing-node-zzz"


def test_maintenance_window_workspace_too_many_subjects_422() -> None:
    subjects = [("subject", f"node:n{i}") for i in range(MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS + 1)]
    response = client.get("/api/v1/maintenance-window-workspace", params=subjects)
    assert response.status_code == 422
    assert "maximum" in response.json()["message"].lower()
