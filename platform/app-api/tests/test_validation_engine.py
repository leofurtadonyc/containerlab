"""Tests for validation engine v1 (bounded policy read-model observability; not actuation).

Requires PostgreSQL for durable rows (skips when DB unreachable).
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

from app_api.integrations.collector.policies import clear_policy_snapshot_cache
from app_api.integrations.collector.topology import clear_topology_snapshot_cache
from app_api.main import app
import test_app as test_app_contracts

client = TestClient(app)

STATIC_LOCAL_POLICY_ID = "PE1:static_local:192.0.2.11:100"


def _postgres_reachable() -> bool:
    try:
        from app_api.config.settings import get_settings

        engine = create_engine(get_settings().get_sqlalchemy_database_url())
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except OperationalError:
        return False


pytestmark = pytest.mark.skipif(
    not _postgres_reachable(),
    reason="PostgreSQL not reachable (expected in dev without platform postgres)",
)


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


def test_validation_unsupported_type_returns_422() -> None:
    r = client.post(
        "/api/v1/validations",
        json={
            "validation_type": "not_a_supported_type",
            "validation_context": "pre_change",
            "target_kind": "policy",
            "target_ids": [STATIC_LOCAL_POLICY_ID],
        },
    )
    assert r.status_code == 422


def test_validation_unsupported_target_kind_returns_422() -> None:
    r = client.post(
        "/api/v1/validations",
        json={
            "validation_type": "policy_read_model_observability_v1",
            "validation_context": "pre_change",
            "target_kind": "topology",
            "target_ids": [STATIC_LOCAL_POLICY_ID],
        },
    )
    assert r.status_code == 422


def test_validation_happy_path_pass(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.post(
        "/api/v1/validations",
        json={
            "validation_type": "policy_read_model_observability_v1",
            "validation_context": "pre_change",
            "target_kind": "policy",
            "target_ids": [STATIC_LOCAL_POLICY_ID],
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert body["result"]["contract_id"] == "validation_engine_policy_read_model_observability_v1"
    assert body["overall_verdict"] in ("pass", "unknown", "fail")
    assert body["capability_decision_state"] == "allowed"
    vid = body["validation_id"]
    g = client.get(f"/api/v1/validations/{vid}")
    assert g.status_code == 200
    assert g.json()["validation_id"] == vid


def test_validation_fail_unknown_policy(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.post(
        "/api/v1/validations",
        json={
            "validation_type": "policy_read_model_observability_v1",
            "validation_context": "post_change",
            "target_kind": "policy",
            "target_ids": ["no-such-policy:static_local:x:1"],
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert body["overall_verdict"] == "fail"
    assert any(
        c["check_id"] == "policy_record_present_v1" and c["verdict"] == "fail"
        for c in body["result"]["checks"]
    )


def test_validation_unsupported_capability(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    monkeypatch.setattr(
        "app_api.services.validation_engine._find_static_policy_capability",
        lambda: ("unsupported", "placeholder"),
    )
    r = client.post(
        "/api/v1/validations",
        json={
            "validation_type": "policy_read_model_observability_v1",
            "validation_context": "pre_change",
            "target_kind": "policy",
            "target_ids": [STATIC_LOCAL_POLICY_ID],
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert body["capability_decision_state"] == "unsupported"
    assert body["overall_verdict"] == "not_applicable"


def test_validation_blocked_collector(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    from app_api.services import policies as policies_mod

    def _fake_list(**kwargs):
        base = policies_mod.build_policies_list_response(**kwargs)
        return base.model_copy(update={"empty_reason": "collector_unavailable"})

    monkeypatch.setattr(
        "app_api.services.validation_engine.build_policies_list_response",
        _fake_list,
    )
    r = client.post(
        "/api/v1/validations",
        json={
            "validation_type": "policy_read_model_observability_v1",
            "validation_context": "pre_change",
            "target_kind": "policy",
            "target_ids": [STATIC_LOCAL_POLICY_ID],
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert body["capability_decision_state"] == "blocked"
    assert body["overall_verdict"] in ("unknown", "fail", "pass")


def test_validation_blocked_terminal_workflow(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    wf = client.post(
        "/api/v1/workflow-lifecycle",
        json={
            "workflow_type": "policy_change",
            "title": "verify validation",
            "description": "test",
        },
    )
    assert wf.status_code == 201
    wid = wf.json()["workflow"]["workflow_id"]
    tr = client.post(
        f"/api/v1/workflow-lifecycle/{wid}/transitions",
        json={"next_status": "succeeded", "reason": "done"},
    )
    assert tr.status_code == 200
    r = client.post(
        "/api/v1/validations",
        json={
            "validation_type": "policy_read_model_observability_v1",
            "validation_context": "pre_change",
            "target_kind": "policy",
            "target_ids": [STATIC_LOCAL_POLICY_ID],
            "workflow_id": wid,
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert body["capability_decision_state"] == "blocked"
    assert body["overall_verdict"] == "not_applicable"


def test_validation_list_and_timeline(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    client.post(
        "/api/v1/validations",
        json={
            "validation_type": "policy_read_model_observability_v1",
            "validation_context": "pre_change",
            "target_kind": "policy",
            "target_ids": [STATIC_LOCAL_POLICY_ID],
        },
    )
    lst = client.get("/api/v1/validations?limit=5")
    assert lst.status_code == 200
    assert '"items"' in lst.text or "items" in lst.json()
    items = lst.json().get("items", [])
    assert len(items) >= 1
    vid = items[0]["validation_id"]
    tl = client.get(f"/api/v1/validations/{vid}/timeline")
    assert tl.status_code == 200
    assert len(tl.json()["events"]) >= 1


def test_metrics_endpoint_includes_validation_counters(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    client.post(
        "/api/v1/validations",
        json={
            "validation_type": "policy_read_model_observability_v1",
            "validation_context": "pre_change",
            "target_kind": "policy",
            "target_ids": [STATIC_LOCAL_POLICY_ID],
        },
    )
    m = client.get("/metrics")
    assert m.status_code == 200
    assert "platform_app_api_validation_requests_total" in m.text
    assert "platform_app_api_validation_generation_seconds_count" in m.text
