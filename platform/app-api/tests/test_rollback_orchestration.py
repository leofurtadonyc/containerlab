"""Tests for rollback orchestration v1 (bounded operator intent compensation)."""

from __future__ import annotations

import uuid

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
V1_ACTION = "policy_static_local_operator_intent_record_v1"
V1_PREVIEW = "policy_static_local_intent_preview_v1"
V1_VALIDATION = "policy_read_model_observability_v1"
V1_ROLLBACK = "policy_operator_intent_rollback_v1"


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
def _clear_policy_topology_caches() -> None:
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


def _mk_approved_workflow() -> str:
    suffix = uuid.uuid4().hex[:8]
    r = client.post(
        "/api/v1/workflow-lifecycle",
        json={
            "workflow_type": f"safe_action_wf_{suffix}",
            "title": f"Safe action WF {suffix}",
            "initial_status": "requested",
            "actor": "pytest",
            "provenance": "api",
        },
    )
    assert r.status_code == 201, r.text
    wid = r.json()["workflow"]["workflow_id"]
    tr = client.post(
        f"/api/v1/workflow-lifecycle/{wid}/transitions",
        json={"next_status": "approved", "actor": "pytest", "reason": "pytest approved"},
    )
    assert tr.status_code == 200, tr.text
    return wid


def _preview_and_validation(*, wid: str, policy_id: str, intent: str) -> tuple[str, str]:
    pr = client.post(
        "/api/v1/previews",
        json={
            "preview_type": V1_PREVIEW,
            "target_kind": "policy",
            "target_ids": [policy_id],
            "requested_action_type": "intent_state_change",
            "requested_payload": {"proposed_intent_state": intent},
            "workflow_id": wid,
            "actor_type": "operator",
            "actor_id": "pytest",
        },
    )
    assert pr.status_code in (200, 201), pr.text
    pid = pr.json()["preview"]["preview_id"]
    vr = client.post(
        "/api/v1/validations",
        json={
            "validation_type": V1_VALIDATION,
            "validation_context": "pre_change",
            "target_kind": "policy",
            "target_ids": [policy_id],
            "workflow_id": wid,
            "preview_id": pid,
            "created_by_actor_type": "operator",
            "created_by_actor_id": "pytest",
        },
    )
    assert vr.status_code in (200, 201), vr.text
    vid = vr.json()["validation_id"]
    return pid, vid


def _post_change_validation(*, policy_id: str) -> str:
    vr = client.post(
        "/api/v1/validations",
        json={
            "validation_type": V1_VALIDATION,
            "validation_context": "post_change",
            "target_kind": "policy",
            "target_ids": [policy_id],
            "created_by_actor_type": "operator",
            "created_by_actor_id": "pytest",
        },
    )
    assert vr.status_code in (200, 201), vr.text
    body = vr.json()
    assert body.get("overall_verdict") == "pass", body
    assert body.get("validation_status") == "completed"
    return body["validation_id"]


def _successful_action(monkeypatch: pytest.MonkeyPatch) -> str:
    _stub_live_policy_and_topology(monkeypatch)
    wid = _mk_approved_workflow()
    pid, vid = _preview_and_validation(wid=wid, policy_id=STATIC_LOCAL_POLICY_ID, intent="declared")
    ar = client.post(
        "/api/v1/actions",
        json={
            "workflow_id": wid,
            "preview_id": pid,
            "validation_id": vid,
            "action_type": V1_ACTION,
            "target_kind": "policy",
            "target_ids": [STATIC_LOCAL_POLICY_ID],
            "requested_payload": {"proposed_intent_state": "declared"},
        },
    )
    assert ar.status_code == 201, ar.text
    aid = ar.json()["action"]["action_id"]
    client.post(f"/api/v1/actions/{aid}/approve", json={"actor_id": "pytest", "provenance": "operator"})
    ex = client.post(
        f"/api/v1/actions/{aid}/execute",
        json={"actor_id": "pytest", "provenance": "operator"},
    )
    assert ex.status_code == 200
    assert ex.json()["action"]["execution_status"] == "succeeded"
    return aid


def test_rollback_blocked_without_succeeded_parent(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    wid = _mk_approved_workflow()
    pid, vid = _preview_and_validation(wid=wid, policy_id=STATIC_LOCAL_POLICY_ID, intent="declared")
    ar = client.post(
        "/api/v1/actions",
        json={
            "workflow_id": wid,
            "preview_id": pid,
            "validation_id": vid,
            "action_type": V1_ACTION,
            "target_kind": "policy",
            "target_ids": [STATIC_LOCAL_POLICY_ID],
            "requested_payload": {"proposed_intent_state": "declared"},
        },
    )
    assert ar.status_code == 201
    aid = ar.json()["action"]["action_id"]
    post_vid = _post_change_validation(policy_id=STATIC_LOCAL_POLICY_ID)
    rr = client.post(
        "/api/v1/rollbacks",
        json={
            "parent_action_id": aid,
            "rollback_type": V1_ROLLBACK,
            "target_kind": "policy",
            "target_ids": [STATIC_LOCAL_POLICY_ID],
            "pre_rollback_validation_id": post_vid,
        },
    )
    assert rr.status_code == 201
    rb = rr.json()["rollback"]
    assert rb["rollback_decision"] == "blocked"
    assert rb["rollback_status"] == "blocked"


def test_rollback_happy_path(monkeypatch: pytest.MonkeyPatch) -> None:
    aid = _successful_action(monkeypatch)
    post_vid = _post_change_validation(policy_id=STATIC_LOCAL_POLICY_ID)
    rr = client.post(
        "/api/v1/rollbacks",
        json={
            "parent_action_id": aid,
            "rollback_type": V1_ROLLBACK,
            "target_kind": "policy",
            "target_ids": [STATIC_LOCAL_POLICY_ID],
            "pre_rollback_validation_id": post_vid,
        },
    )
    assert rr.status_code == 201, rr.text
    rb = rr.json()["rollback"]
    assert rb["rollback_decision"] == "allowed"
    assert rb["rollback_status"] == "awaiting_approval"
    rid = rb["rollback_id"]
    ap = client.post(
        f"/api/v1/rollbacks/{rid}/approve",
        json={"actor_id": "pytest", "provenance": "operator"},
    )
    assert ap.status_code == 200
    assert ap.json()["rollback"]["rollback_status"] == "ready_to_execute"
    ex = client.post(
        f"/api/v1/rollbacks/{rid}/execute",
        json={"actor_id": "pytest", "provenance": "operator"},
    )
    assert ex.status_code == 200
    final = ex.json()["rollback"]
    assert final["rollback_status"] == "succeeded"
    exe = final["execution"]
    assert exe.get("outcome") == "succeeded"
    assert exe.get("compensation_intent_record_id")
    tl = client.get(f"/api/v1/rollbacks/{rid}/timeline")
    assert tl.status_code == 200
    types = {e["event_type"] for e in tl.json()["events"]}
    assert "rollback_execution_completed" in types


def test_rollbacks_list_contract() -> None:
    r = client.get("/api/v1/rollbacks?limit=5")
    assert r.status_code == 200
    body = r.json()
    assert body["contract_id"] == "rollback_orchestration_v1"
    assert "items" in body
