"""Tests for preview engine v1 (bounded static_local intent; not actuation).

Uses the same live policy/topology stubs as maintenance-preview tests when needed.
Requires PostgreSQL for durable rows (skips when DB unreachable).
"""

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
STATIC_NON_LOCAL_POLICY_ID = "P1:static_non_local:198.51.100.1:200"


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


def test_preview_invalid_type_returns_422() -> None:
    r = client.post(
        "/api/v1/previews",
        json={
            "preview_type": "not_a_real_type",
            "target_kind": "policy",
            "target_ids": [STATIC_LOCAL_POLICY_ID],
            "requested_payload": {"proposed_intent_state": "unknown"},
        },
    )
    assert r.status_code == 422


def test_preview_bad_proposed_intent_returns_422() -> None:
    r = client.post(
        "/api/v1/previews",
        json={
            "preview_type": "policy_static_local_intent_preview_v1",
            "target_kind": "policy",
            "target_ids": [STATIC_LOCAL_POLICY_ID],
            "requested_payload": {"proposed_intent_state": "active"},
        },
    )
    assert r.status_code == 422


def test_preview_unknown_policy(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.post(
        "/api/v1/previews",
        json={
            "preview_type": "policy_static_local_intent_preview_v1",
            "target_kind": "policy",
            "target_ids": ["no-such-policy:static_local:x:1"],
            "requested_payload": {"proposed_intent_state": "unknown"},
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert body["preview"]["contract_id"] == "preview_engine_policy_static_local_intent_v1"
    assert body["preview"]["capability_decision_state"] == "unknown"
    assert body["preview"]["preview_status"] == "unknown"


def test_preview_static_non_local_unsupported(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.post(
        "/api/v1/previews",
        json={
            "preview_type": "policy_static_local_intent_preview_v1",
            "target_kind": "policy",
            "target_ids": [STATIC_NON_LOCAL_POLICY_ID],
            "requested_payload": {"proposed_intent_state": "unknown"},
        },
    )
    assert r.status_code == 201
    assert r.json()["preview"]["capability_decision_state"] == "unsupported"


def test_preview_blocked_no_change(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.post(
        "/api/v1/previews",
        json={
            "preview_type": "policy_static_local_intent_preview_v1",
            "target_kind": "policy",
            "target_ids": [STATIC_LOCAL_POLICY_ID],
            "requested_payload": {"proposed_intent_state": "declared"},
        },
    )
    assert r.status_code == 201
    p = r.json()["preview"]
    assert p["capability_decision_state"] == "blocked"
    assert p["diff"] is None


def test_preview_allowed_has_diff(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.post(
        "/api/v1/previews",
        json={
            "preview_type": "policy_static_local_intent_preview_v1",
            "target_kind": "policy",
            "target_ids": [STATIC_LOCAL_POLICY_ID],
            "requested_payload": {"proposed_intent_state": "unknown"},
        },
    )
    assert r.status_code == 201
    p = r.json()["preview"]
    assert p["capability_decision_state"] == "allowed"
    assert p["diff"] is not None
    assert p["diff"]["diff_type"] == "policy_intent_state_v1"
    pid = p["preview_id"]

    d = client.get(f"/api/v1/previews/{pid}/diff")
    assert d.status_code == 200
    assert d.json()["diff"]["diff_id"] == f"{pid}:diff"

    tl = client.get(f"/api/v1/previews/{pid}/timeline")
    assert tl.status_code == 200
    assert any(e["event_type"] == "preview_generated" for e in tl.json()["events"])


def test_preview_idempotency_key_returns_same(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    idem = f"pytest-idem-preview-{uuid.uuid4().hex}"
    body = {
        "preview_type": "policy_static_local_intent_preview_v1",
        "target_kind": "policy",
        "target_ids": [STATIC_LOCAL_POLICY_ID],
        "requested_payload": {"proposed_intent_state": "unknown"},
        "idempotency_key": idem,
    }
    r1 = client.post("/api/v1/previews", json=body)
    r2 = client.post("/api/v1/previews", json=body)
    assert r1.status_code == 201
    assert r2.status_code == 200
    assert r1.json()["preview"]["preview_id"] == r2.json()["preview"]["preview_id"]


def test_preview_workflow_not_found_returns_404(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.post(
        "/api/v1/previews",
        json={
            "preview_type": "policy_static_local_intent_preview_v1",
            "target_kind": "policy",
            "target_ids": [STATIC_LOCAL_POLICY_ID],
            "requested_payload": {"proposed_intent_state": "unknown"},
            "workflow_id": "00000000-0000-0000-0000-000000000000",
        },
    )
    assert r.status_code == 404
