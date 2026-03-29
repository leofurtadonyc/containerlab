"""Tests for safe action workflows v1 (bounded platform intent overlay; not device push)."""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

from app_api.integrations.collector.policies import clear_policy_snapshot_cache
from app_api.integrations.collector.topology import clear_topology_snapshot_cache
from app_api.main import app
from app_api.persistence.session import create_session
from app_api.persistence.tables import PolicyOperatorIntentRecordTable
import app_api.services.safe_actions as safe_actions_mod
import test_app as test_app_contracts

client = TestClient(app)

STATIC_LOCAL_POLICY_ID = "PE1:static_local:192.0.2.11:100"
STATIC_NON_LOCAL_POLICY_ID = "P1:static_non_local:198.51.100.1:200"
V1_ACTION = "policy_static_local_operator_intent_record_v1"
V1_PREVIEW = "policy_static_local_intent_preview_v1"
V1_VALIDATION = "policy_read_model_observability_v1"


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


def test_unsupported_action_type(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    wid = _mk_approved_workflow()
    pid, vid = _preview_and_validation(wid=wid, policy_id=STATIC_LOCAL_POLICY_ID, intent="declared")
    r = client.post(
        "/api/v1/actions",
        json={
            "workflow_id": wid,
            "preview_id": pid,
            "validation_id": vid,
            "action_type": "not_a_supported_action",
            "target_kind": "policy",
            "target_ids": [STATIC_LOCAL_POLICY_ID],
            "requested_payload": {"proposed_intent_state": "declared"},
        },
    )
    assert r.status_code == 201, r.text
    payload = r.json()["action"]
    assert payload["action_decision"] == "unsupported"
    assert payload["execution_status"] == "unsupported"


def test_unknown_workflow(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    wid = _mk_approved_workflow()
    pid, vid = _preview_and_validation(wid=wid, policy_id=STATIC_LOCAL_POLICY_ID, intent="declared")
    r = client.post(
        "/api/v1/actions",
        json={
            "workflow_id": str(uuid.uuid4()),
            "preview_id": pid,
            "validation_id": vid,
            "action_type": V1_ACTION,
            "target_kind": "policy",
            "target_ids": [STATIC_LOCAL_POLICY_ID],
            "requested_payload": {"proposed_intent_state": "declared"},
        },
    )
    assert r.status_code == 201
    assert r.json()["action"]["action_decision"] == "unknown"


def test_blocked_non_static_local_policy(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    wid = _mk_approved_workflow()
    pr = client.post(
        "/api/v1/previews",
        json={
            "preview_type": V1_PREVIEW,
            "target_kind": "policy",
            "target_ids": [STATIC_NON_LOCAL_POLICY_ID],
            "requested_action_type": "intent_state_change",
            "requested_payload": {"proposed_intent_state": "declared"},
            "workflow_id": wid,
            "actor_type": "operator",
            "actor_id": "pytest",
        },
    )
    assert pr.status_code in (200, 201)
    if pr.json()["preview"]["preview_status"] != "generated":
        pytest.skip("preview blocked for non-local in this fixture posture")
    pv_id = pr.json()["preview"]["preview_id"]
    vr = client.post(
        "/api/v1/validations",
        json={
            "validation_type": V1_VALIDATION,
            "validation_context": "pre_change",
            "target_kind": "policy",
            "target_ids": [STATIC_NON_LOCAL_POLICY_ID],
            "workflow_id": wid,
            "preview_id": pv_id,
            "created_by_actor_type": "operator",
            "created_by_actor_id": "pytest",
        },
    )
    assert vr.status_code in (200, 201)
    if vr.json()["overall_verdict"] != "pass":
        pytest.skip("validation does not pass for non-local sample")
    val_id = vr.json()["validation_id"]
    r = client.post(
        "/api/v1/actions",
        json={
            "workflow_id": wid,
            "preview_id": pv_id,
            "validation_id": val_id,
            "action_type": V1_ACTION,
            "target_kind": "policy",
            "target_ids": [STATIC_NON_LOCAL_POLICY_ID],
            "requested_payload": {"proposed_intent_state": "declared"},
        },
    )
    assert r.status_code == 201
    assert r.json()["action"]["action_decision"] == "unsupported"


def test_stale_validation_blocks_execute(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    wid = _mk_approved_workflow()
    pid, vid = _preview_and_validation(wid=wid, policy_id=STATIC_LOCAL_POLICY_ID, intent="unknown")
    ar = client.post(
        "/api/v1/actions",
        json={
            "workflow_id": wid,
            "preview_id": pid,
            "validation_id": vid,
            "action_type": V1_ACTION,
            "target_kind": "policy",
            "target_ids": [STATIC_LOCAL_POLICY_ID],
            "requested_payload": {"proposed_intent_state": "unknown"},
        },
    )
    assert ar.status_code == 201
    assert ar.json()["action"]["execution_status"] == "awaiting_approval"
    aid = ar.json()["action"]["action_id"]
    ap = client.post(
        f"/api/v1/actions/{aid}/approve",
        json={"actor_id": "pytest", "provenance": "operator"},
    )
    assert ap.status_code == 200

    class AltSnapshot:
        def read_policy_snapshot(self):
            snap = test_app_contracts._build_live_policy_snapshot()
            return snap.model_copy(update={"policy_count": 99})

    monkeypatch.setattr(
        "app_api.services.policies.get_collector_policy_client",
        lambda: AltSnapshot(),
    )

    ex = client.post(
        f"/api/v1/actions/{aid}/execute",
        json={"actor_id": "pytest", "provenance": "operator"},
    )
    assert ex.status_code == 200
    assert ex.json()["action"]["execution_status"] == "blocked"


def test_happy_path_approve_execute(monkeypatch: pytest.MonkeyPatch) -> None:
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
    act = ar.json()["action"]
    assert act["action_decision"] == "allowed"
    assert act["execution_status"] == "awaiting_approval"
    aid = act["action_id"]
    ap = client.post(
        f"/api/v1/actions/{aid}/approve",
        json={"actor_id": "pytest", "provenance": "operator"},
    )
    assert ap.status_code == 200
    assert ap.json()["action"]["execution_status"] == "ready_to_execute"
    ex = client.post(
        f"/api/v1/actions/{aid}/execute",
        json={"actor_id": "pytest", "provenance": "operator"},
    )
    assert ex.status_code == 200
    final = ex.json()["action"]
    assert final["execution_status"] == "succeeded"
    exe = final["execution"]
    assert exe.get("outcome") == "succeeded"
    assert exe.get("operator_intent_record_id")
    tl = client.get(f"/api/v1/actions/{aid}/timeline")
    assert tl.status_code == 200
    types = {e["event_type"] for e in tl.json()["events"]}
    assert "execution_completed" in types


def test_execute_fails_on_intent_id_collision(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    colliding = f"collision-{uuid.uuid4().hex[:12]}"
    monkeypatch.setattr(safe_actions_mod, "_new_intent_record_id", lambda: colliding)

    wid = _mk_approved_workflow()
    pid, vid = _preview_and_validation(wid=wid, policy_id=STATIC_LOCAL_POLICY_ID, intent="unknown")
    with create_session() as session:
        session.add(
            PolicyOperatorIntentRecordTable(
                id=colliding,
                policy_id="other-policy",
                intent_state="unknown",
                action_id=None,
                previous_record_id=None,
                applied_at=safe_actions_mod._utcnow(),
                truth_notes=["pre-seeded for collision test"],
            )
        )
        session.commit()

    ar = client.post(
        "/api/v1/actions",
        json={
            "workflow_id": wid,
            "preview_id": pid,
            "validation_id": vid,
            "action_type": V1_ACTION,
            "target_kind": "policy",
            "target_ids": [STATIC_LOCAL_POLICY_ID],
            "requested_payload": {"proposed_intent_state": "unknown"},
        },
    )
    assert ar.status_code == 201
    aid = ar.json()["action"]["action_id"]
    client.post(f"/api/v1/actions/{aid}/approve", json={"actor_id": "pytest", "provenance": "operator"})
    ex = client.post(
        f"/api/v1/actions/{aid}/execute",
        json={"actor_id": "pytest", "provenance": "operator"},
    )
    assert ex.status_code == 200
    assert ex.json()["action"]["execution_status"] == "failed"


def test_actions_list_contract() -> None:
    r = client.get("/api/v1/actions?limit=5")
    assert r.status_code == 200
    body = r.json()
    assert body["contract_id"] == "safe_action_workflow_v1"
    assert "items" in body


def test_idempotency_returns_existing(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    wid = _mk_approved_workflow()
    pid, vid = _preview_and_validation(wid=wid, policy_id=STATIC_LOCAL_POLICY_ID, intent="declared")
    key = f"idemp-{uuid.uuid4().hex}"
    body = {
        "workflow_id": wid,
        "preview_id": pid,
        "validation_id": vid,
        "action_type": V1_ACTION,
        "target_kind": "policy",
        "target_ids": [STATIC_LOCAL_POLICY_ID],
        "requested_payload": {"proposed_intent_state": "declared"},
        "idempotency_key": key,
    }
    a1 = client.post("/api/v1/actions", json=body)
    a2 = client.post("/api/v1/actions", json=body)
    assert a1.status_code == 201
    assert a2.status_code == 200
    assert a1.json()["action"]["action_id"] == a2.json()["action"]["action_id"]
