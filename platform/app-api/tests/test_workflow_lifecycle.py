"""Tests for durable workflow lifecycle APIs (not workflow-history sync surface).

Requires PostgreSQL with migrations applied (same as runtime). Skips when DB is unreachable.
"""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

from app_api.config.settings import get_settings
from app_api.main import app
from app_api.schemas.workflow_lifecycle import (
    WORKFLOW_LIFECYCLE_LIST_V1_CONTRACT_ID,
    WORKFLOW_LIFECYCLE_RECORD_V1_CONTRACT_ID,
    WORKFLOW_LIFECYCLE_TIMELINE_V1_CONTRACT_ID,
)

client = TestClient(app)


def _postgres_reachable() -> bool:
    try:
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


def test_workflow_lifecycle_list_contract() -> None:
    r = client.get("/api/v1/workflow-lifecycle")
    assert r.status_code == 200
    payload = r.json()
    assert payload["contract_id"] == WORKFLOW_LIFECYCLE_LIST_V1_CONTRACT_ID
    assert payload["service"] == "app-api"
    assert isinstance(payload["items"], list)


def test_workflow_lifecycle_create_detail_timeline_transition() -> None:
    suffix = uuid.uuid4().hex[:8]
    create = client.post(
        "/api/v1/workflow-lifecycle",
        json={
            "workflow_type": f"test_type_{suffix}",
            "title": f"Test workflow {suffix}",
            "description": "pytest create",
            "initial_status": "requested",
            "actor": "pytest",
            "provenance": "api",
        },
    )
    assert create.status_code == 201, create.text
    wid = create.json()["workflow"]["workflow_id"]
    assert create.json()["workflow"]["contract_id"] == WORKFLOW_LIFECYCLE_RECORD_V1_CONTRACT_ID

    detail = client.get(f"/api/v1/workflow-lifecycle/{wid}")
    assert detail.status_code == 200
    assert detail.json()["workflow"]["workflow_id"] == wid

    timeline = client.get(f"/api/v1/workflow-lifecycle/{wid}/timeline")
    assert timeline.status_code == 200
    tl = timeline.json()
    assert tl["contract_id"] == WORKFLOW_LIFECYCLE_TIMELINE_V1_CONTRACT_ID
    assert any(e["event_type"] == "created" for e in tl["events"])

    tr = client.post(
        f"/api/v1/workflow-lifecycle/{wid}/transitions",
        json={"next_status": "planned", "reason": "pytest transition", "actor": "pytest"},
    )
    assert tr.status_code == 200
    assert tr.json()["workflow"]["workflow_status"] == "planned"

    terminal = client.post(
        f"/api/v1/workflow-lifecycle/{wid}/transitions",
        json={"next_status": "cancelled", "actor": "pytest"},
    )
    assert terminal.status_code == 200

    blocked = client.post(
        f"/api/v1/workflow-lifecycle/{wid}/transitions",
        json={"next_status": "planned", "actor": "pytest"},
    )
    assert blocked.status_code == 409


def test_workflow_lifecycle_not_found() -> None:
    r = client.get("/api/v1/workflow-lifecycle/00000000-0000-4000-8000-000000000000")
    assert r.status_code == 404
