"""Rollback orchestration v1 — bounded operator-intent compensation."""

from __future__ import annotations

import time
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import desc, select
from sqlalchemy.exc import IntegrityError

from app_api.config.settings import get_settings
from app_api.metrics.state import record_rollback_outcome
from app_api.persistence.session import create_session
from app_api.persistence.tables import (
    PolicyOperatorIntentRecordTable,
    RollbackEventTable,
    RollbackRequestTable,
    SafeActionTable,
    ValidationRequestTable,
    WorkflowLifecycleTable,
)
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.rollback_orchestration import (
    ROLLBACK_ORCHESTRATION_V1_CONTRACT_ID,
    RollbackApproveRequest,
    RollbackCancelRequest,
    RollbackDetailPayload,
    RollbackDetailResponse,
    RollbackEventItem,
    RollbackExecutionResult,
    RollbackCreateRequest,
    RollbackExecuteRequest,
    RollbackListItem,
    RollbackListResponse,
    RollbackPrerequisiteReadiness,
    RollbackRejectRequest,
    RollbackSafetyFraming,
    RollbackTimelineResponse,
    RollbackTruthScopeSummary,
)
from app_api.schemas.workflow_lifecycle import WorkflowLifecycleCreateRequest, WorkflowLifecycleTransitionRequest
from app_api.services import validation_engine as validation_service
from app_api.services import workflow_lifecycle as workflow_service
from app_api.services.policies import build_policies_list_response
from app_api.services.safe_actions import (
    V1_ACTION_TYPE,
    V1_VALIDATION_TYPE,
    _policy_static_local,
    _static_policy_capability_allowed,
    _truth_scope_from_policies,
)

V1_ROLLBACK_TYPE = "policy_operator_intent_rollback_v1"
_metadata_phase = "phase_5_bounded_rollback_v1"

ACTIVE_ROLLBACK_STATUSES = frozenset(
    {"awaiting_approval", "ready_to_execute", "executing", "succeeded"}
)


def _utcnow() -> datetime:
    return datetime.now(UTC)


def _metadata() -> ApiResponseMetadata:
    settings = get_settings()
    return ApiResponseMetadata(
        service="app-api",
        version=settings.app_version,
        phase=_metadata_phase,  # type: ignore[arg-type]
        generated_at=_utcnow(),
    )


def _append_event(
    session,
    *,
    rollback_id: str,
    event_type: str,
    actor: str,
    reason: str | None,
    metadata: dict[str, object],
    provenance: str = "api",
) -> None:
    session.add(
        RollbackEventTable(
            id=str(uuid4()),
            rollback_id=rollback_id,
            event_type=event_type,
            occurred_at=_utcnow(),
            actor=actor,
            reason=reason,
            event_metadata=metadata,
            provenance=provenance,
        )
    )


def _row_execution(row: RollbackRequestTable) -> RollbackExecutionResult:
    rj = dict(row.result_json or {})
    ex = rj.get("execution")
    if isinstance(ex, dict):
        return RollbackExecutionResult.model_validate(ex)
    return RollbackExecutionResult()


def _row_to_payload(row: RollbackRequestTable) -> RollbackDetailPayload:
    rj = dict(row.result_json or {})
    readiness_dict = rj.get("prerequisite_readiness")
    readiness = (
        RollbackPrerequisiteReadiness.model_validate(readiness_dict)
        if isinstance(readiness_dict, dict)
        else RollbackPrerequisiteReadiness()
    )
    return RollbackDetailPayload(
        contract_id=ROLLBACK_ORCHESTRATION_V1_CONTRACT_ID,
        rollback_id=row.id,
        workflow_id=row.workflow_id,
        parent_workflow_id=row.parent_workflow_id,
        parent_action_id=row.parent_action_id,
        parent_preview_id=row.parent_preview_id,
        parent_validation_id=row.parent_validation_id,
        pre_rollback_validation_id=row.pre_rollback_validation_id,
        post_rollback_validation_id=row.post_rollback_validation_id,
        rollback_type=row.rollback_type,
        target_kind=row.target_kind,
        target_ids=[str(x) for x in (row.target_ids or [])],
        target_scope=dict(row.target_scope) if row.target_scope else None,
        rollback_payload=dict(row.rollback_payload or {}),
        requested_at=row.requested_at,
        requested_by_actor_type=row.requested_by_actor_type,
        requested_by_actor_id=row.requested_by_actor_id,
        requested_by_actor_display_name=row.requested_by_actor_display_name,
        rollback_decision=row.rollback_decision,  # type: ignore[arg-type]
        capability_decision_state=row.capability_decision_state,  # type: ignore[arg-type]
        capability_decision_reason=row.capability_decision_reason,
        truth_scope_summary=_truth_from_parent_row(row),
        prerequisite_notes=[str(x) for x in (row.prerequisite_notes or [])],
        prerequisite_readiness=readiness,
        restoration_semantics=row.restoration_semantics,
        approval_required=row.approval_required,
        approval_state=row.approval_state,  # type: ignore[arg-type]
        approver_actor_id=row.approver_actor_id,
        approver_actor_display_name=row.approver_actor_display_name,
        approved_at=row.approved_at,
        rejection_reason=row.rejection_reason,
        rollback_status=row.rollback_status,  # type: ignore[arg-type]
        execution_started_at=row.execution_started_at,
        execution_completed_at=row.execution_completed_at,
        execution_latency_ms=row.execution_latency_ms,
        execution_error_code=row.execution_error_code,
        execution_error_detail=row.execution_error_detail,
        result_json=dict(row.result_json or {}),
        description=row.description,
        execution=_row_execution(row),
        safety_framing=RollbackSafetyFraming(),
    )


def _truth_from_parent_row(row: RollbackRequestTable) -> RollbackTruthScopeSummary:
    return RollbackTruthScopeSummary.model_validate(row.truth_scope_summary or {})


def _row_to_detail(row: RollbackRequestTable) -> RollbackDetailResponse:
    return RollbackDetailResponse(
        **_metadata().model_dump(),
        rollback=_row_to_payload(row),
    )


def _resolve_restore_intent(
    session,
    *,
    parent: SafeActionTable,
    policies,
) -> tuple[str, str, str | None, bool]:
    """Return restore_intent_state, restoration_semantics, source_intent_record_id, identified."""
    rj = dict(parent.result_json or {})
    ex = rj.get("execution")
    intent_id: str | None = None
    if isinstance(ex, dict):
        raw = ex.get("operator_intent_record_id")
        if isinstance(raw, str):
            intent_id = raw
    if not intent_id:
        return "unknown", "bounded_compensation_no_prior_overlay_defaults_unknown", None, False

    cur = session.get(PolicyOperatorIntentRecordTable, intent_id)
    if cur is None:
        return "unknown", "bounded_compensation_no_prior_overlay_defaults_unknown", intent_id, False

    if cur.previous_record_id:
        prev = session.get(PolicyOperatorIntentRecordTable, cur.previous_record_id)
        if prev is not None:
            return (
                prev.intent_state,
                "bounded_compensation_to_prior_intent_overlay",
                intent_id,
                True,
            )
    return "unknown", "bounded_compensation_no_prior_overlay_defaults_unknown", intent_id, True


def _evaluate_prerequisites_for_create(
    *,
    body: RollbackCreateRequest,
    policies,
    session,
) -> tuple[str, str, str | None, list[str], RollbackPrerequisiteReadiness, RollbackTruthScopeSummary, str, dict[str, object]]:
    """Return decision, cap_state, cap_reason, notes, readiness, truth, restoration_semantics, rollback_payload."""
    notes: list[str] = []
    readiness = RollbackPrerequisiteReadiness()
    truth = _truth_scope_from_policies(policies)
    truth_rb = RollbackTruthScopeSummary(
        policy_data_status=truth.policy_data_status,
        policy_serving_mode=truth.policy_serving_mode,
        policies_source_posture=truth.policies_source_posture,
        policies_confidence_posture=truth.policies_confidence_posture,
        policies_evidence_kind=truth.policies_evidence_kind,
        rollback_truth_notes=list(truth.action_truth_notes)[:8],
    )
    default_payload: dict[str, object] = {}

    if body.rollback_type != V1_ROLLBACK_TYPE:
        notes.append(f"Unsupported rollback_type for v1 (expected {V1_ROLLBACK_TYPE}).")
        readiness.parent_action_present = False
        return "unsupported", "unsupported", "rollback_type_out_of_scope", notes, readiness, truth_rb, "unsupported", default_payload

    if len(body.target_ids) != 1:
        notes.append("v1 requires exactly one policy target_id.")
        return "invalid", "blocked", "invalid_target_ids", notes, readiness, truth_rb, "invalid", default_payload

    policy_id = body.target_ids[0].strip()
    if not policy_id:
        return "invalid", "blocked", "empty_policy_id", notes, readiness, truth_rb, "invalid", default_payload

    parent = session.get(SafeActionTable, body.parent_action_id)
    readiness.parent_action_present = parent is not None
    if parent is None:
        notes.append("parent_action_not_found")
        return "unknown", "blocked", "parent_action_not_found", notes, readiness, truth_rb, "unknown", default_payload

    readiness.parent_execution_succeeded = parent.execution_status == "succeeded"
    readiness.parent_action_type_supported = parent.action_type == V1_ACTION_TYPE
    readiness.parent_not_already_compensated = parent.compensated_by_rollback_id is None

    if parent.action_type != V1_ACTION_TYPE:
        notes.append("parent_action_type_not_rollback_supported")
        return "unsupported", "unsupported", "parent_action_type_unsupported", notes, readiness, truth_rb, "unsupported", default_payload

    if parent.execution_status != "succeeded":
        notes.append(f"parent_not_succeeded:{parent.execution_status}")
        return "blocked", "blocked", "parent_action_not_succeeded", notes, readiness, truth_rb, "blocked", default_payload

    if parent.compensated_by_rollback_id:
        notes.append("parent_already_compensated")
        return "blocked", "blocked", "parent_already_compensated", notes, readiness, truth_rb, "blocked", default_payload

    pids = [str(x) for x in (parent.target_ids or [])]
    if pids != body.target_ids:
        notes.append("target_ids_mismatch_parent_action")
        return "blocked", "blocked", "target_mismatch", notes, readiness, truth_rb, "blocked", default_payload

    dup = session.scalars(
        select(RollbackRequestTable).where(
            RollbackRequestTable.parent_action_id == body.parent_action_id,
            RollbackRequestTable.rollback_status.in_(ACTIVE_ROLLBACK_STATUSES),
        )
    ).first()
    readiness.no_conflicting_rollback = dup is None
    if dup is not None:
        notes.append(f"conflicting_rollback_exists:{dup.id}")
        return "blocked", "blocked", "duplicate_rollback_inflight_or_succeeded", notes, readiness, truth_rb, "blocked", default_payload

    val_row = session.get(ValidationRequestTable, body.pre_rollback_validation_id)
    readiness.pre_rollback_validation_present = val_row is not None
    if val_row is None:
        notes.append("pre_rollback_validation_not_found")
        return "unknown", "blocked", "pre_rollback_validation_not_found", notes, readiness, truth_rb, "unknown", default_payload

    readiness.pre_rollback_validation_pass = (
        val_row.validation_status == "completed"
        and val_row.overall_verdict == "pass"
        and val_row.capability_decision_state == "allowed"
    )
    tid_va = [str(x) for x in (val_row.target_ids or [])]
    val_ok = (
        val_row.validation_type == V1_VALIDATION_TYPE
        and val_row.validation_context == "post_change"
        and tid_va == body.target_ids
    )
    if not val_ok:
        notes.append("pre_rollback_validation_contract_mismatch")
        return "blocked", "blocked", "pre_rollback_validation_contract_mismatch", notes, readiness, truth_rb, "blocked", default_payload

    if not readiness.pre_rollback_validation_pass:
        notes.append(
            f"pre_rollback_validation_not_pass:status={val_row.validation_status} verdict={val_row.overall_verdict}"
        )
        return "blocked", "blocked", "pre_rollback_validation_not_executable", notes, readiness, truth_rb, "blocked", default_payload

    live_val = validation_service.get_validation(body.pre_rollback_validation_id)
    if live_val is None:
        notes.append("pre_rollback_validation_detail_missing")
        return "unknown", "blocked", "pre_rollback_validation_not_found", notes, readiness, truth_rb, "unknown", default_payload

    readiness.pre_rollback_validation_stale_current = live_val.stale_posture == "current"
    if live_val.stale_posture != "current":
        notes.append(f"pre_rollback_validation_stale:{live_val.stale_posture}")
        return "blocked", "blocked", "stale_pre_rollback_validation", notes, readiness, truth_rb, "blocked", default_payload

    now = _utcnow()
    if live_val.expires_at and live_val.expires_at < now:
        readiness.pre_rollback_validation_not_expired = False
        notes.append("pre_rollback_validation_expired")
        return "blocked", "blocked", "stale_pre_rollback_validation", notes, readiness, truth_rb, "blocked", default_payload
    readiness.pre_rollback_validation_not_expired = True

    cap_ok, cap_reason = _static_policy_capability_allowed()
    readiness.capability_allowed = cap_ok
    if not cap_ok:
        notes.append(cap_reason or "capability_blocked")
        return "blocked", "blocked", cap_reason, notes, readiness, truth_rb, "blocked", default_payload

    readiness.policy_is_static_local = _policy_static_local(policy_id, policies)
    if not readiness.policy_is_static_local:
        notes.append("policy_not_static_local_or_missing")
        return "unsupported", "unsupported", "policy_outside_static_local_slice", notes, readiness, truth_rb, "unsupported", default_payload

    restore_intent, restoration_sem, source_intent_id, identified = _resolve_restore_intent(
        session, parent=parent, policies=policies
    )
    readiness.prior_state_or_unknown_restore_identified = identified

    rollback_payload: dict[str, object] = {
        "restore_intent_state": restore_intent,
        "source_intent_record_id": source_intent_id,
        "parent_action_id": body.parent_action_id,
        "restoration_semantics": restoration_sem,
    }

    return "allowed", "allowed", None, notes, readiness, truth_rb, restoration_sem, rollback_payload


def _rollback_status_for_decision(decision: str) -> str:
    if decision == "allowed":
        return "awaiting_approval"
    if decision == "unsupported":
        return "unsupported"
    if decision == "unknown":
        return "unknown"
    if decision == "invalid":
        return "invalid"
    return "blocked"


def _approval_state_for_decision(decision: str) -> str:
    if decision == "allowed":
        return "pending"
    return "not_applicable"


def create_rollback(body: RollbackCreateRequest) -> tuple[RollbackDetailResponse, bool]:
    """Create rollback row; enforced prerequisites; idempotent on idempotency_key."""
    t0 = time.perf_counter()
    rid = str(uuid4())
    now = _utcnow()
    policies = build_policies_list_response()

    with create_session() as session:
        if body.idempotency_key:
            existing = session.scalars(
                select(RollbackRequestTable).where(
                    RollbackRequestTable.idempotency_key == body.idempotency_key
                )
            ).first()
            if existing is not None:
                return _row_to_detail(existing), False

    with create_session() as session:
        decision, cap_state, cap_reason, notes, readiness, truth_rb, restoration_sem, rollback_payload = (
            _evaluate_prerequisites_for_create(body=body, policies=policies, session=session)
        )

    rollback_status = _rollback_status_for_decision(decision)
    approval_st = _approval_state_for_decision(decision)

    parent_workflow_id: str | None = None
    parent_preview_id: str | None = None
    parent_validation_id: str | None = None
    with create_session() as session:
        par = session.get(SafeActionTable, body.parent_action_id)
        if par is not None:
            parent_workflow_id = par.workflow_id
            parent_preview_id = par.preview_id
            parent_validation_id = par.validation_id

    wf_id: str | None = None
    if decision == "allowed":
        wf = workflow_service.create_workflow_lifecycle(
            WorkflowLifecycleCreateRequest(
                workflow_type="rollback_operator_intent_v1",
                title=f"Rollback operator intent overlay ({body.parent_action_id[:8]}…)",
                description=f"Bounded rollback for safe action {body.parent_action_id}",
                initial_status="requested",
                target_scope={
                    "parent_action_id": body.parent_action_id,
                    "parent_workflow_id": parent_workflow_id,
                    "rollback_type": body.rollback_type,
                },
                actor=body.requested_by_actor_id,
                provenance="api",
            )
        )
        wf_id = wf.workflow.workflow_id

    result_json: dict[str, object] = {
        "execution": RollbackExecutionResult().model_dump(mode="json"),
        "prerequisite_readiness": readiness.model_dump(mode="json"),
        "contract_version": 1,
    }

    row = RollbackRequestTable(
        id=rid,
        workflow_id=wf_id,
        parent_workflow_id=parent_workflow_id,
        parent_action_id=body.parent_action_id,
        parent_preview_id=parent_preview_id,
        parent_validation_id=parent_validation_id,
        pre_rollback_validation_id=body.pre_rollback_validation_id,
        post_rollback_validation_id=None,
        idempotency_key=body.idempotency_key,
        rollback_type=body.rollback_type,
        target_kind=body.target_kind,
        target_ids=list(body.target_ids),
        target_scope=body.target_scope,
        rollback_payload=rollback_payload,
        requested_at=now,
        requested_by_actor_type=body.requested_by_actor_type,
        requested_by_actor_id=body.requested_by_actor_id,
        requested_by_actor_display_name=body.requested_by_actor_display_name,
        rollback_decision=decision if decision != "invalid" else "blocked",
        capability_decision_state=cap_state,
        capability_decision_reason=cap_reason,
        truth_scope_summary=truth_rb.model_dump(mode="json"),
        prerequisite_notes=list(notes),
        restoration_semantics=restoration_sem,
        approval_required=True,
        approval_state=approval_st,
        rollback_status=rollback_status,
        result_json=result_json,
        description=body.description,
    )

    with create_session() as session:
        session.add(row)
        _append_event(
            session,
            rollback_id=rid,
            event_type="rollback_requested",
            actor=body.requested_by_actor_id,
            reason=None,
            metadata={"rollback_type": body.rollback_type, "decision": decision},
        )
        _append_event(
            session,
            rollback_id=rid,
            event_type="capability_evaluated",
            actor="rollback-engine",
            reason=cap_reason,
            metadata={"capability_decision_state": cap_state, "rollback_decision": decision},
            provenance="api",
        )
        try:
            session.commit()
        except IntegrityError as exc:
            session.rollback()
            if body.idempotency_key:
                with create_session() as session2:
                    existing = session2.scalars(
                        select(RollbackRequestTable).where(
                            RollbackRequestTable.idempotency_key == body.idempotency_key
                        )
                    ).first()
                    if existing is not None:
                        return _row_to_detail(existing), False
            raise exc

    record_rollback_outcome(
        rollback_type=body.rollback_type,
        rollback_decision=decision if decision != "invalid" else "blocked",
        rollback_status=rollback_status,
        event="created",
        duration_seconds=time.perf_counter() - t0,
    )

    with create_session() as session:
        r = session.get(RollbackRequestTable, rid)
        assert r is not None
        return _row_to_detail(r), True


def get_rollback(rollback_id: str) -> RollbackDetailResponse | None:
    with create_session() as session:
        row = session.get(RollbackRequestTable, rollback_id)
        if row is None:
            return None
        return _row_to_detail(row)


def list_rollbacks(*, limit: int = 50) -> RollbackListResponse:
    cap = max(1, min(limit, 100))
    meta = _metadata()
    with create_session() as session:
        rows = session.scalars(
            select(RollbackRequestTable).order_by(desc(RollbackRequestTable.requested_at)).limit(cap)
        ).all()
        items = [
            RollbackListItem(
                rollback_id=r.id,
                rollback_type=r.rollback_type,
                rollback_decision=r.rollback_decision,  # type: ignore[arg-type]
                rollback_status=r.rollback_status,  # type: ignore[arg-type]
                parent_action_id=r.parent_action_id,
                workflow_id=r.workflow_id,
                requested_at=r.requested_at,
                requested_by_actor_id=r.requested_by_actor_id,
            )
            for r in rows
        ]
    return RollbackListResponse(**meta.model_dump(), contract_id=ROLLBACK_ORCHESTRATION_V1_CONTRACT_ID, items=items)


def get_rollback_timeline(rollback_id: str) -> RollbackTimelineResponse | None:
    meta = _metadata()
    with create_session() as session:
        r = session.get(RollbackRequestTable, rollback_id)
        if r is None:
            return None
        ev_rows = session.scalars(
            select(RollbackEventTable)
            .where(RollbackEventTable.rollback_id == rollback_id)
            .order_by(RollbackEventTable.occurred_at)
        ).all()
        events = [
            RollbackEventItem(
                event_id=e.id,
                rollback_id=e.rollback_id,
                event_type=e.event_type,
                occurred_at=e.occurred_at,
                actor=e.actor,
                reason=e.reason,
                metadata=dict(e.event_metadata or {}),
                provenance=e.provenance
                if e.provenance in ("system", "operator", "api")
                else "api",  # type: ignore[arg-type]
            )
            for e in ev_rows
        ]
    return RollbackTimelineResponse(
        **meta.model_dump(),
        contract_id=ROLLBACK_ORCHESTRATION_V1_CONTRACT_ID,
        rollback_id=rollback_id,
        events=events,
    )


def approve_rollback(rollback_id: str, body: RollbackApproveRequest) -> RollbackDetailResponse | None:
    t0 = time.perf_counter()
    now = _utcnow()
    with create_session() as session:
        row = session.get(RollbackRequestTable, rollback_id, with_for_update=True)
        if row is None:
            return None
        if row.rollback_decision != "allowed":
            session.rollback()
            raise ValueError("rollback_not_approvable")
        if row.rollback_status != "awaiting_approval":
            session.rollback()
            raise ValueError("invalid_rollback_state")
        if row.approval_state != "pending":
            session.rollback()
            raise ValueError("approval_not_pending")

        row.approval_state = "approved"
        row.approver_actor_id = body.actor_id
        row.approver_actor_display_name = body.actor_display_name
        row.approved_at = now
        row.rollback_status = "ready_to_execute"
        _append_event(
            session,
            rollback_id=rollback_id,
            event_type="approval_granted",
            actor=body.actor_id,
            reason=body.reason,
            metadata={"provenance": body.provenance},
            provenance=body.provenance,
        )
        rb_type = row.rollback_type
        wf_id = row.workflow_id
        session.commit()

    if wf_id:
        try:
            workflow_service.transition_workflow_lifecycle(
                wf_id,
                WorkflowLifecycleTransitionRequest(
                    next_status="approved",
                    reason="rollback_approval_granted",
                    actor=body.actor_id,
                    metadata={"rollback_id": rollback_id},
                    provenance="api",
                ),
            )
        except RuntimeError:
            pass

    record_rollback_outcome(
        rollback_type=rb_type,
        rollback_decision="allowed",
        rollback_status="ready_to_execute",
        event="approve",
        duration_seconds=time.perf_counter() - t0,
    )
    return get_rollback(rollback_id)


def reject_rollback(rollback_id: str, body: RollbackRejectRequest) -> RollbackDetailResponse | None:
    t0 = time.perf_counter()
    with create_session() as session:
        row = session.get(RollbackRequestTable, rollback_id, with_for_update=True)
        if row is None:
            return None
        if row.rollback_status != "awaiting_approval" or row.approval_state != "pending":
            session.rollback()
            raise ValueError("invalid_rollback_state")

        row.approval_state = "rejected"
        row.approver_actor_id = body.actor_id
        row.approver_actor_display_name = body.actor_display_name
        row.rejection_reason = body.reason
        row.rollback_status = "blocked"
        _append_event(
            session,
            rollback_id=rollback_id,
            event_type="approval_rejected",
            actor=body.actor_id,
            reason=body.reason,
            metadata={"provenance": body.provenance},
            provenance=body.provenance,
        )
        rb_type = row.rollback_type
        session.commit()

    record_rollback_outcome(
        rollback_type=rb_type,
        rollback_decision="blocked",
        rollback_status="blocked",
        event="reject",
        duration_seconds=time.perf_counter() - t0,
    )
    return get_rollback(rollback_id)


def cancel_rollback(rollback_id: str, body: RollbackCancelRequest) -> RollbackDetailResponse | None:
    with create_session() as session:
        row = session.get(RollbackRequestTable, rollback_id, with_for_update=True)
        if row is None:
            return None
        if row.rollback_status not in ("awaiting_approval", "ready_to_execute"):
            session.rollback()
            raise ValueError("invalid_rollback_state")
        row.rollback_status = "cancelled"
        _append_event(
            session,
            rollback_id=rollback_id,
            event_type="rollback_cancelled",
            actor=body.actor_id,
            reason=body.reason,
            metadata={},
            provenance="operator",
        )
        session.commit()
    return get_rollback(rollback_id)


def _revalidate_execute_prerequisites(rollback_id: str) -> tuple[bool, str | None]:
    with create_session() as session:
        rb = session.get(RollbackRequestTable, rollback_id)
        if rb is None:
            return False, "rollback_not_found"
        if not rb.pre_rollback_validation_id:
            return False, "pre_rollback_validation_missing"
        body = RollbackCreateRequest(
            parent_action_id=rb.parent_action_id,
            rollback_type=rb.rollback_type,
            target_kind="policy",
            target_ids=[str(x) for x in (rb.target_ids or [])],
            target_scope=dict(rb.target_scope) if rb.target_scope else None,
            pre_rollback_validation_id=rb.pre_rollback_validation_id,
        )
    policies = build_policies_list_response()
    with create_session() as session:
        decision, _cap, reason, _notes, _readiness, _truth, _sem, _payload = _evaluate_prerequisites_for_create(
            body=body, policies=policies, session=session
        )
    if decision != "allowed":
        return False, reason or f"prerequisites_failed:{decision}"
    return True, None


def execute_rollback(rollback_id: str, body: RollbackExecuteRequest) -> RollbackDetailResponse | None:
    t0 = time.perf_counter()
    now = _utcnow()

    with create_session() as session:
        row = session.get(RollbackRequestTable, rollback_id, with_for_update=True)
        if row is None:
            return None
        if row.rollback_status == "succeeded":
            session.commit()
            return _row_to_detail(row)

        if row.rollback_status != "ready_to_execute" or row.approval_state != "approved":
            session.rollback()
            raise ValueError("not_ready_to_execute")

        wf_row = session.get(WorkflowLifecycleTable, row.workflow_id)
        if wf_row is None:
            session.rollback()
            raise ValueError("workflow_not_found")
        if wf_row.workflow_status != "approved":
            session.rollback()
            raise ValueError("workflow_not_approved")

    ok, err = _revalidate_execute_prerequisites(rollback_id)
    if not ok:
        rb_type = ""
        with create_session() as session:
            row_blk = session.get(RollbackRequestTable, rollback_id, with_for_update=True)
            assert row_blk is not None
            rb_type = row_blk.rollback_type
            row_blk.rollback_status = "blocked"
            row_blk.execution_error_code = err
            row_blk.execution_error_detail = "Prerequisites failed at execute time (stale or drift)."
            _append_event(
                session,
                rollback_id=rollback_id,
                event_type="rollback_blocked",
                actor=body.actor_id,
                reason=err,
                metadata={"phase": "pre_execute"},
                provenance=body.provenance,
            )
            session.commit()
        record_rollback_outcome(
            rollback_type=rb_type,
            rollback_decision="blocked",
            rollback_status="blocked",
            event="execute_blocked",
            duration_seconds=time.perf_counter() - t0,
        )
        return get_rollback(rollback_id)

    wf_id: str
    rb_type_snap: str
    restore_intent: str
    policy_id: str
    with create_session() as session:
        row_ex = session.get(RollbackRequestTable, rollback_id, with_for_update=True)
        assert row_ex is not None
        wf_id = row_ex.workflow_id or ""
        rb_type_snap = row_ex.rollback_type
        rollback_payload = dict(row_ex.rollback_payload or {})
        raw = rollback_payload.get("restore_intent_state")
        restore_intent = str(raw) if raw is not None else "unknown"
        policy_id = str(row_ex.target_ids[0])
        row_ex.rollback_status = "executing"
        row_ex.execution_started_at = now
        _append_event(
            session,
            rollback_id=rollback_id,
            event_type="rollback_execution_started",
            actor=body.actor_id,
            reason=None,
            metadata={},
            provenance=body.provenance,
        )
        session.commit()

    try:
        workflow_service.transition_workflow_lifecycle(
            wf_id,
            WorkflowLifecycleTransitionRequest(
                next_status="executing",
                reason="rollback_execute_start",
                actor=body.actor_id,
                metadata={"rollback_id": rollback_id},
                provenance="api",
            ),
        )
    except RuntimeError:
        pass

    intent_record_id = str(uuid4())
    completed_at = _utcnow()
    latency_ms = (time.perf_counter() - t0) * 1000.0
    try:
        with create_session() as session:
            prev_row = session.scalars(
                select(PolicyOperatorIntentRecordTable)
                .where(PolicyOperatorIntentRecordTable.policy_id == policy_id)
                .order_by(desc(PolicyOperatorIntentRecordTable.applied_at))
                .limit(1)
            ).first()
            prev_id = prev_row.id if prev_row else None

            rec = PolicyOperatorIntentRecordTable(
                id=intent_record_id,
                policy_id=policy_id,
                intent_state=restore_intent,
                action_id=None,
                rollback_request_id=rollback_id,
                previous_record_id=prev_id,
                applied_at=completed_at,
                truth_notes=[
                    "Rollback compensation row: platform operator intent overlay only; not device restore.",
                ],
            )
            session.add(rec)

            row2 = session.get(RollbackRequestTable, rollback_id, with_for_update=True)
            assert row2 is not None
            par = session.get(SafeActionTable, row2.parent_action_id, with_for_update=True)
            if par is not None:
                par.compensated_by_rollback_id = rollback_id

            row2.rollback_status = "succeeded"
            row2.execution_completed_at = completed_at
            row2.execution_latency_ms = latency_ms
            row2.execution_error_code = None
            row2.execution_error_detail = None
            restoration_sem = row2.restoration_semantics
            ex = RollbackExecutionResult(
                outcome="succeeded",
                compensation_intent_record_id=intent_record_id,
                restored_intent_state=restore_intent,
                applied_policy_id=policy_id,
                restoration_semantics=restoration_sem,
                notes=["Durably recorded in platform_app.policy_operator_intent_records."],
            )
            rj = dict(row2.result_json or {})
            rj["execution"] = ex.model_dump(mode="json")
            row2.result_json = rj
            _append_event(
                session,
                rollback_id=rollback_id,
                event_type="rollback_execution_completed",
                actor=body.actor_id,
                reason=None,
                metadata={"compensation_intent_record_id": intent_record_id},
                provenance=body.provenance,
            )
            session.commit()
    except Exception as exc:
        with create_session() as session:
            row3 = session.get(RollbackRequestTable, rollback_id, with_for_update=True)
            if row3 is not None:
                row3.rollback_status = "failed"
                row3.execution_completed_at = _utcnow()
                row3.execution_latency_ms = (time.perf_counter() - t0) * 1000.0
                row3.execution_error_code = "execution_persist_failed"
                row3.execution_error_detail = str(exc)[:8192]
                _append_event(
                    session,
                    rollback_id=rollback_id,
                    event_type="rollback_execution_failed",
                    actor=body.actor_id,
                    reason=str(exc)[:1024],
                    metadata={},
                    provenance=body.provenance,
                )
                session.commit()
        try:
            workflow_service.transition_workflow_lifecycle(
                wf_id,
                WorkflowLifecycleTransitionRequest(
                    next_status="failed",
                    reason="rollback_execute_failed",
                    actor=body.actor_id,
                    metadata={"rollback_id": rollback_id},
                    provenance="api",
                ),
            )
        except RuntimeError:
            pass
        record_rollback_outcome(
            rollback_type=rb_type_snap,
            rollback_decision="allowed",
            rollback_status="failed",
            event="execute_failed",
            duration_seconds=time.perf_counter() - t0,
        )
        return get_rollback(rollback_id)

    try:
        workflow_service.transition_workflow_lifecycle(
            wf_id,
            WorkflowLifecycleTransitionRequest(
                next_status="succeeded",
                reason="rollback_execute_succeeded",
                actor=body.actor_id,
                metadata={"rollback_id": rollback_id, "compensation_intent_record_id": intent_record_id},
                provenance="api",
            ),
        )
    except RuntimeError:
        pass

    record_rollback_outcome(
        rollback_type=rb_type_snap,
        rollback_decision="allowed",
        rollback_status="succeeded",
        event="execute_succeeded",
        duration_seconds=time.perf_counter() - t0,
    )
    return get_rollback(rollback_id)
