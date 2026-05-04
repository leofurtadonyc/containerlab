"""Tests for action safety case v1 (bounded assembly; no device actuation)."""

from __future__ import annotations

from types import SimpleNamespace
import uuid
from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

from app_api.main import app
from app_api.persistence.session import create_session
from app_api.persistence.tables import PreviewRequestTable, SafeActionTable, ValidationRequestTable, WorkflowLifecycleTable
import app_api.services.action_safety_case as safety_case_mod

client = TestClient(app)

STATIC_LOCAL_POLICY_ID = "PE1:static_local:192.0.2.11:100"
V1_ACTION = "policy_static_local_operator_intent_record_v1"


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


def _stub_supporting_evidence(monkeypatch: pytest.MonkeyPatch, *, evidence_posture: str = "bounded_ok") -> None:
    monkeypatch.setattr(
        safety_case_mod.evidence_quality_service,
        "build_evidence_quality_workspace_response",
        lambda: SimpleNamespace(
            read_path_reliability_posture=evidence_posture,
            rows=[] if evidence_posture == "bounded_ok" else [object()],
            assembly_notes=[],
        ),
    )
    lane = SimpleNamespace(session_posture="established")
    monkeypatch.setattr(
        safety_case_mod.controller_evidence_service,
        "build_controller_evidence_response",
        lambda: SimpleNamespace(
            controller_reachability="ok",
            bgp_ls=lane,
            pcep=lane,
            netconf=lane,
        ),
    )
    monkeypatch.setattr(
        safety_case_mod.preview_service,
        "get_preview",
        lambda preview_id: SimpleNamespace(preview=SimpleNamespace(stale_posture="current")),
    )
    monkeypatch.setattr(
        safety_case_mod.preview_service,
        "get_preview_diff",
        lambda preview_id: SimpleNamespace(
            diff=SimpleNamespace(change_items=[object()], change_scope="policy_intent_state"),
            stale_posture="current",
        ),
    )
    monkeypatch.setattr(
        safety_case_mod.validation_service,
        "get_validation",
        lambda validation_id: SimpleNamespace(stale_posture="current"),
    )


def _now() -> datetime:
    return datetime.now(UTC)


def _seed_action(
    *,
    execution_status: str = "awaiting_approval",
    action_decision: str = "allowed",
    validation_verdict: str = "pass",
) -> str:
    workflow_id = str(uuid.uuid4())
    preview_id = str(uuid.uuid4())
    validation_id = str(uuid.uuid4())
    action_id = str(uuid.uuid4())
    now = _now()
    with create_session() as session:
        session.add(
            WorkflowLifecycleTable(
                id=workflow_id,
                workflow_type="safe_action_wf_test",
                workflow_status="approved",
                title="Safety case test workflow",
                description=None,
                target_scope={},
                capability_decision={},
                actor_created="pytest",
                actor_updated="pytest",
                audit_attachment_hint=None,
                created_at=now,
                updated_at=now,
            )
        )
        session.flush()
        session.add(
            PreviewRequestTable(
                id=preview_id,
                workflow_id=workflow_id,
                idempotency_key=None,
                preview_type="policy_static_local_intent_preview_v1",
                target_kind="policy",
                target_ids=[STATIC_LOCAL_POLICY_ID],
                target_scope=None,
                requested_action_type="intent_state_change",
                requested_payload={"proposed_intent_state": "declared"},
                created_at=now,
                created_by_actor_type="operator",
                created_by_actor_id="pytest",
                created_by_actor_display_name=None,
                preview_status="generated",
                capability_decision_state="allowed",
                capability_decision_reason=None,
                capability_decision_source="pytest",
                truth_scope_summary={},
                truth_fingerprint="preview-fingerprint",
                notes=None,
                extension_hints=None,
                result_json={},
                processing_duration_ms=1.0,
            )
        )
        session.flush()
        session.add(
            ValidationRequestTable(
                id=validation_id,
                workflow_id=workflow_id,
                preview_id=preview_id,
                idempotency_key=None,
                validation_type="policy_read_model_observability_v1",
                validation_context="pre_change",
                target_kind="policy",
                target_ids=[STATIC_LOCAL_POLICY_ID],
                target_scope=None,
                requested_checkset=None,
                created_at=now,
                created_by_actor_type="operator",
                created_by_actor_id="pytest",
                created_by_actor_display_name=None,
                validation_status="completed",
                capability_decision_state="allowed",
                capability_decision_reason=None,
                truth_scope_summary={},
                truth_fingerprint="validation-fingerprint",
                overall_verdict=validation_verdict,
                stale_posture="current",
                expires_at=None,
                notes=None,
                extension_hints=None,
                result_json={},
                processing_duration_ms=1.0,
            )
        )
        session.flush()
        session.add(
            SafeActionTable(
                id=action_id,
                workflow_id=workflow_id,
                preview_id=preview_id,
                validation_id=validation_id,
                idempotency_key=None,
                action_type=V1_ACTION,
                target_kind="policy",
                target_ids=[STATIC_LOCAL_POLICY_ID],
                target_scope=None,
                requested_payload={"proposed_intent_state": "declared"},
                requested_at=now,
                requested_by_actor_type="operator",
                requested_by_actor_id="pytest",
                requested_by_actor_display_name=None,
                action_decision=action_decision,
                capability_decision_state="allowed" if action_decision == "allowed" else "blocked",
                capability_decision_reason=None,
                truth_scope_summary={
                    "policy_data_status": "live",
                    "policy_serving_mode": "live_collector",
                    "action_truth_notes": ["pytest"],
                },
                prerequisite_notes=[],
                approval_required=True,
                approval_state="pending",
                approver_actor_id=None,
                approver_actor_display_name=None,
                approved_at=None,
                rejection_reason=None,
                execution_status=execution_status,
                execution_started_at=None,
                execution_completed_at=now if execution_status == "succeeded" else None,
                execution_latency_ms=None,
                execution_error_code=None,
                execution_error_detail=None,
                post_check_validation_id=None,
                rollback_parent_action_id=None,
                rollback_workflow_id=None,
                rollback_ready_state=None,
                rollback_validation_id=None,
                compensation_reference=None,
                result_json={"execution": {"outcome": "succeeded" if execution_status == "succeeded" else "unknown"}},
                audit_attachment_hint=None,
                description=None,
                compensated_by_rollback_id=None,
            )
        )
        session.commit()
    return action_id


def test_action_safety_case_ready_for_review(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_supporting_evidence(monkeypatch)
    action_id = _seed_action()

    response = client.get(f"/api/v1/actions/{action_id}/safety-case")

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["contract_id"] == "action_safety_case_v1"
    assert body["final_bounded_posture"] == "ready_for_review"
    assert body["action"]["present"] is True
    assert body["preview"]["present"] is True
    assert body["validation"]["verdict"] == "pass"
    assert body["rollback_readiness"]["present"] is False
    assert "safe-to-execute" in " ".join(body["safety_framing"]["explicit_limitations"])


def test_action_safety_case_blocked_validation(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_supporting_evidence(monkeypatch)
    action_id = _seed_action(validation_verdict="fail")

    response = client.get(f"/api/v1/actions/{action_id}/safety-case")

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["final_bounded_posture"] == "blocked"
    assert any(g["gate_id"] == "validation_not_pass" for g in body["blocking_gates"])


def test_action_safety_case_missing_rollback_after_execution(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_supporting_evidence(monkeypatch)
    action_id = _seed_action(execution_status="succeeded")

    response = client.get(f"/api/v1/actions/{action_id}/safety-case")

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["final_bounded_posture"] == "rollback_not_ready"
    assert any(g["gate_id"] == "rollback_not_prepared" for g in body["warning_gates"])


def test_action_safety_case_degraded_evidence(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_supporting_evidence(monkeypatch, evidence_posture="heavily_limited")
    action_id = _seed_action()

    response = client.get(f"/api/v1/actions/{action_id}/safety-case")

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["final_bounded_posture"] == "degraded_evidence"
    assert body["evidence_quality"]["status"] == "heavily_limited"
    assert any(g["gate_id"] == "evidence_quality_degraded" for g in body["warning_gates"])


def test_action_safety_case_missing_action() -> None:
    response = client.get(f"/api/v1/actions/{uuid.uuid4()}/safety-case")

    assert response.status_code == 404
    assert response.json()["message"] == "action_not_found"
