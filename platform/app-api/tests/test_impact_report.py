"""Contract tests for GET /api/v1/reports/*-impact."""

import pytest
from fastapi.testclient import TestClient

from app_api.integrations.collector.policies import clear_policy_snapshot_cache
from app_api.integrations.collector.topology import (
    CollectorTopologyNodeRecord,
    CollectorTopologySnapshot,
    clear_topology_snapshot_cache,
)
from app_api.main import app
import test_app as test_app_contracts

client = TestClient(app)

PID = "PE1:static_local:192.0.2.11:100"


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


def test_service_impact_report_json(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get("/api/v1/reports/service-impact", params={"service_id": "color:100"})
    assert r.status_code == 200
    p = r.json()
    assert p["contract_id"] == "impact_report_v1"
    assert p["report_context"] == "service_impact"
    assert p["anchor_service_id"] == "color:100"
    assert p["service_detail"]["contract_id"] == "service_explorer_v1"
    assert "impact_report_v1" in p["source_contract_ids"]
    assert "not_compliance_or_legal_artifact" in p["safety_framing"]["explicit_non_claims"]


def test_service_impact_report_markdown(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get(
        "/api/v1/reports/service-impact",
        params={"service_id": "color:100", "format": "markdown"},
    )
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/markdown")
    body = r.text
    assert "# Impact report: service_impact" in body
    assert "impact_report_v1" in body
    assert "```json" in body


def test_service_impact_unknown_returns_404(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get("/api/v1/reports/service-impact", params={"service_id": "color:999999"})
    assert r.status_code == 404


def test_service_impact_missing_service_id_returns_422() -> None:
    r = client.get("/api/v1/reports/service-impact")
    assert r.status_code == 422


def test_policy_impact_report_json(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get("/api/v1/reports/policy-impact", params={"policy_id": PID})
    assert r.status_code == 200
    p = r.json()
    assert p["contract_id"] == "impact_report_v1"
    assert p["report_context"] == "policy_impact"
    assert p["anchor_policy_id"] == PID
    assert p["policy_dossier"]["contract_id"] == "policy_dossier_v1"
    assert "policy_dossier_v1" in p["source_contract_ids"]


def test_policy_impact_unknown_returns_404(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get("/api/v1/reports/policy-impact", params={"policy_id": "no-such-policy"})
    assert r.status_code == 404


def test_policy_impact_missing_policy_id_returns_422() -> None:
    r = client.get("/api/v1/reports/policy-impact")
    assert r.status_code == 422


def test_maintenance_impact_report_json(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get("/api/v1/reports/maintenance-impact", params={"node_id": "PE1"})
    assert r.status_code == 200
    p = r.json()
    assert p["contract_id"] == "impact_report_v1"
    assert p["report_context"] == "maintenance_impact"
    assert p["anchor_maintenance"]["object_id"] == "PE1"
    assert p["maintenance_preview"]["contract_id"] == "maintenance_preview_v1"
    assert "maintenance_preview_v1" in p["source_contract_ids"]


def test_maintenance_impact_missing_subject_returns_422() -> None:
    r = client.get("/api/v1/reports/maintenance-impact")
    assert r.status_code == 422


def test_maintenance_impact_unknown_object_returns_404(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get(
        "/api/v1/reports/maintenance-impact",
        params={"object_kind": "node", "object_id": "no-such-node"},
    )
    assert r.status_code == 404


def test_maintenance_impact_kind_mismatch_returns_422(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get(
        "/api/v1/reports/maintenance-impact",
        params={"object_kind": "link", "object_id": "PE1"},
    )
    assert r.status_code == 422


def test_maintenance_impact_sparse_orphan_node(monkeypatch: pytest.MonkeyPatch) -> None:
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

    r = client.get("/api/v1/reports/maintenance-impact", params={"node_id": "ORPHAN"})
    assert r.status_code == 200
    p = r.json()
    assert p["sparse_report"] is True
    assert p["maintenance_preview"]["sparse_preview"] is True
