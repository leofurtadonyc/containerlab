"""Contract tests for GET /api/v1/exports/maintenance-window-handoff (maintenance_window_handoff_v1)."""

import pytest
from fastapi.testclient import TestClient

from app_api.integrations.collector.policies import clear_policy_snapshot_cache
from app_api.integrations.collector.topology import clear_topology_snapshot_cache
from app_api.main import app
from app_api.schemas.maintenance_window_handoff import MAINTENANCE_WINDOW_HANDOFF_V1_CONTRACT_ID
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


def test_maintenance_window_handoff_missing_subject_422() -> None:
    response = client.get("/api/v1/exports/maintenance-window-handoff")
    assert response.status_code == 422


def test_maintenance_window_handoff_not_evidence_export_envelope(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get(
        "/api/v1/exports/maintenance-window-handoff",
        params=[
            ("subject", "node:PE1"),
            ("subject", "link:P1--PE1"),
        ],
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_id"] == "maintenance_window_handoff_v1"
    assert "evidence_export_v1" not in payload
    assert payload["workspace_snapshot"]["contract_id"] == "maintenance_window_workspace_v1"
    assert payload["handoff_subject"]["preview_context"] == "planning_window"
    assert payload["handoff_subject"]["sync_runs_limit"] >= 1
    assert "node:PE1" in payload["handoff_subject"]["subjects"]
    assert "link:P1--PE1" in payload["handoff_subject"]["subjects"]
    assert MAINTENANCE_WINDOW_HANDOFF_V1_CONTRACT_ID in payload["source_contract_ids"]
    assert "maintenance_window_workspace_v1" in payload["source_contract_ids"]
    assert any("not evidence_export_v1" in x.lower() for x in payload["explicit_non_claims"])
    assert any("maintenance_window_handoff_v1" in x.lower() for x in payload["explicit_non_claims"])
    assert payload["handoff_generated_at"]
    assert payload["workspace_snapshot"]["metadata"]["generated_at"]


def test_maintenance_window_handoff_optional_labels_echo(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get(
        "/api/v1/exports/maintenance-window-handoff",
        params={
            "subject": "node:PE1",
            "handoff_label": "  Window A  ",
            "operator_note": "  shift handoff  ",
        },
    )
    assert response.status_code == 200
    hs = response.json()["handoff_subject"]
    assert hs["handoff_label"] == "Window A"
    assert hs["operator_note"] == "shift handoff"


def test_maintenance_window_handoff_markdown_companion(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get(
        "/api/v1/exports/maintenance-window-handoff",
        params=[("subject", "node:PE1"), ("format", "markdown")],
    )
    assert response.status_code == 200
    assert response.headers.get("content-type", "").startswith("text/markdown")
    body = response.text
    assert "maintenance_window_handoff_v1" in body
    assert "Canonical structured data" in body


def test_maintenance_window_handoff_unresolved_422(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get(
        "/api/v1/exports/maintenance-window-handoff",
        params=[("subject", "node:no-such-node-xyz")],
    )
    assert response.status_code == 422


def test_maintenance_window_handoff_too_many_subjects_422() -> None:
    subjects = [("subject", f"node:n{i}") for i in range(MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS + 1)]
    response = client.get("/api/v1/exports/maintenance-window-handoff", params=subjects)
    assert response.status_code == 422
