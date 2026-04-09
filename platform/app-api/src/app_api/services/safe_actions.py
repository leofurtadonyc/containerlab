"""Safe action workflow v1 service — prerequisite-gated bounded execution."""

from __future__ import annotations

import time
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import desc, select
from sqlalchemy.exc import IntegrityError

from app_api.config.settings import get_settings
from app_api.metrics.state import record_safe_action_outcome
from app_api.persistence.session import create_session
from app_api.persistence.tables import (
    PolicyOperatorIntentRecordTable,
    PreviewRequestTable,
    SafeActionEventTable,
    SafeActionTable,
    ValidationRequestTable,
    WorkflowLifecycleTable,
)
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.safe_actions import (
    SAFE_ACTION_WORKFLOW_V1_CONTRACT_ID,
    SafeActionApproveRequest,
    SafeActionCancelRequest,
    SafeActionDetailPayload,
    SafeActionDetailResponse,
    SafeActionCreateRequest,
    SafeActionEventItem,
    SafeActionExecutionResult,
    SafeActionListItem,
    SafeActionListResponse,
    SafeActionPrerequisiteReadiness,
    SafeActionRejectRequest,
    SafeActionRollbackHints,
    SafeActionExecuteRequest,
    SafeActionSafetyFraming,
    SafeActionTimelineResponse,
    SafeActionTruthScopeSummary,
)
from app_api.schemas.workflow_lifecycle import WorkflowLifecycleTransitionRequest
from app_api.services import preview_engine as preview_service
from app_api.services import validation_engine as validation_service
from app_api.services import workflow_lifecycle as workflow_service
from app_api.services.capabilities import build_capabilities_list_response
from app_api.services.policies import build_policies_list_response

V1_ACTION_TYPE = "policy_static_local_operator_intent_record_v1"
V1_PREVIEW_TYPE = "policy_static_local_intent_preview_v1"
V1_VALIDATION_TYPE = "policy_read_model_observability_v1"
STATIC_POLICY_DETAIL_FEATURE = "static_policy_detail"
TERMINAL_WORKFLOW: frozenset[str] = frozenset({"succeeded", "failed", "cancelled", "rejected"})

_metadata_phase = "phase_2_read_only_foundation"


def _utcnow() -> datetime:
    return datetime.now(UTC)


def _new_intent_record_id() -> str:
    """Separate hook for tests (e.g. intentional persistence collision)."""
    return str(uuid4())


def _metadata() -> ApiResponseMetadata:
    settings = get_settings()
    return ApiResponseMetadata(
        service="app-api",
        version=settings.app_version,
        phase=_metadata_phase,
        generated_at=_utcnow(),
    )


def _truth_scope_from_policies(policies) -> SafeActionTruthScopeSummary:
    return SafeActionTruthScopeSummary(
        policy_data_status=policies.data_status,
        policy_serving_mode=policies.serving_mode,
        policies_source_posture=policies.evidence_confidence.source_posture,
        policies_confidence_posture=policies.evidence_confidence.confidence_posture,
        policies_evidence_kind=policies.evidence_confidence.evidence_kind,
        action_truth_notes=list(policies.notes)[:8],
    )


def _static_policy_capability_allowed() -> tuple[bool, str | None]:
    caps = build_capabilities_list_response()
    for item in caps.items:
        if item.feature == STATIC_POLICY_DETAIL_FEATURE and item.vendor == "nokia":
            if item.support_status == "unsupported":
                return False, "static_policy_detail_unsupported"
            if item.support_status == "unknown":
                return False, "static_policy_detail_unknown"
            return True, None
    return False, "static_policy_detail_missing"


def _policy_static_local(policy_id: str, policies) -> bool:
    for p in policies.items:
        if p.policy_id == policy_id:
            return p.policy_type == "static_local"
    return False


def _payloads_match_preview_intent(req: dict[str, object], prev: dict[str, object]) -> bool:
    a = req.get("proposed_intent_state")
    b = prev.get("proposed_intent_state")
    return a == b and a in ("declared", "unknown")


def _append_event(
    session,
    *,
    action_id: str,
    event_type: str,
    actor: str,
    reason: str | None,
    metadata: dict[str, object],
    provenance: str = "api",
) -> None:
    session.add(
        SafeActionEventTable(
            id=str(uuid4()),
            action_id=action_id,
            event_type=event_type,
            occurred_at=_utcnow(),
            actor=actor,
            reason=reason,
            event_metadata=metadata,
            provenance=provenance,
        )
    )


def _row_to_execution_result(row: SafeActionTable) -> SafeActionExecutionResult:
    rj = dict(row.result_json or {})
    ex = rj.get("execution")
    if isinstance(ex, dict):
        return SafeActionExecutionResult.model_validate(ex)
    return SafeActionExecutionResult()


def _row_to_payload(row: SafeActionTable) -> SafeActionDetailPayload:
    rj = dict(row.result_json or {})
    readiness_dict = rj.get("prerequisite_readiness")
    readiness = (
        SafeActionPrerequisiteReadiness.model_validate(readiness_dict)
        if isinstance(readiness_dict, dict)
        else SafeActionPrerequisiteReadiness()
    )
    rb_dict = rj.get("rollback")
    rollback = (
        SafeActionRollbackHints.model_validate(rb_dict) if isinstance(rb_dict, dict) else SafeActionRollbackHints()
    )
    return SafeActionDetailPayload(
        contract_id=SAFE_ACTION_WORKFLOW_V1_CONTRACT_ID,
        action_id=row.id,
        workflow_id=row.workflow_id,
        preview_id=row.preview_id,
        validation_id=row.validation_id,
        action_type=row.action_type,
        target_kind=row.target_kind,
        target_ids=[str(x) for x in (row.target_ids or [])],
        target_scope=dict(row.target_scope) if row.target_scope else None,
        requested_payload=dict(row.requested_payload or {}),
        requested_at=row.requested_at,
        requested_by_actor_type=row.requested_by_actor_type,
        requested_by_actor_id=row.requested_by_actor_id,
        requested_by_actor_display_name=row.requested_by_actor_display_name,
        action_decision=row.action_decision,  # type: ignore[arg-type]
        capability_decision_state=row.capability_decision_state,  # type: ignore[arg-type]
        capability_decision_reason=row.capability_decision_reason,
        truth_scope_summary=SafeActionTruthScopeSummary.model_validate(row.truth_scope_summary),
        prerequisite_notes=[str(x) for x in (row.prerequisite_notes or [])],
        prerequisite_readiness=readiness,
        approval_required=row.approval_required,
        approval_state=row.approval_state,  # type: ignore[arg-type]
        approver_actor_id=row.approver_actor_id,
        approver_actor_display_name=row.approver_actor_display_name,
        approved_at=row.approved_at,
        rejection_reason=row.rejection_reason,
        execution_status=row.execution_status,  # type: ignore[arg-type]
        execution_started_at=row.execution_started_at,
        execution_completed_at=row.execution_completed_at,
        execution_latency_ms=row.execution_latency_ms,
        execution_error_code=row.execution_error_code,
        execution_error_detail=row.execution_error_detail,
        post_check_validation_id=row.post_check_validation_id,
        rollback=rollback,
        execution=_row_to_execution_result(row),
        description=row.description,
        safety_framing=SafeActionSafetyFraming(),
    )


def _row_to_detail(row: SafeActionTable) -> SafeActionDetailResponse:
    return SafeActionDetailResponse(
        **_metadata().model_dump(),
        action=_row_to_payload(row),
    )


def _evaluate_prerequisites_for_create(
    *,
    body: SafeActionCreateRequest,
    policies,
) -> tuple[
    str,
    str,
    str | None,
    list[str],
    SafeActionPrerequisiteReadiness,
    SafeActionTruthScopeSummary,
]:
    """Return action_decision, capability_state, cap_reason, notes, readiness, truth."""
    notes: list[str] = []
    readiness = SafeActionPrerequisiteReadiness()
    truth = _truth_scope_from_policies(policies)

    if body.action_type != V1_ACTION_TYPE:
        notes.append(f"Unsupported action_type for v1 (expected {V1_ACTION_TYPE}).")
        readiness.workflow_present = body.workflow_id is not None
        return "unsupported", "unsupported", "action_type_out_of_scope", notes, readiness, truth

    if len(body.target_ids) != 1:
        notes.append("v1 requires exactly one policy target_id.")
        return "invalid", "blocked", "invalid_target_ids", notes, readiness, truth

    policy_id = body.target_ids[0].strip()
    if not policy_id:
        return "invalid", "blocked", "empty_policy_id", notes, readiness, truth

    prop = body.requested_payload.get("proposed_intent_state")
    if prop not in ("declared", "unknown"):
        notes.append("requested_payload.proposed_intent_state must be declared|unknown.")
        return "invalid", "blocked", "invalid_intent_payload", notes, readiness, truth

    with create_session() as session:
        wf = session.get(WorkflowLifecycleTable, body.workflow_id)
        readiness.workflow_present = wf is not None
        readiness.workflow_status = wf.workflow_status if wf else None
        readiness.workflow_terminal = wf.workflow_status in TERMINAL_WORKFLOW if wf else False

        if wf is None:
            notes.append("workflow_not_found")
            return "unknown", "blocked", "workflow_not_found", notes, readiness, truth
        if wf.workflow_status in TERMINAL_WORKFLOW:
            notes.append(f"workflow_terminal:{wf.workflow_status}")
            return "blocked", "blocked", "workflow_terminal", notes, readiness, truth

        pv_row = session.get(PreviewRequestTable, body.preview_id)
        val_row = session.get(ValidationRequestTable, body.validation_id)

        readiness.preview_present = pv_row is not None
        readiness.validation_present = val_row is not None

        if pv_row is None:
            notes.append("preview_not_found")
            return "unknown", "blocked", "preview_not_found", notes, readiness, truth
        if val_row is None:
            notes.append("validation_not_found")
            return "unknown", "blocked", "validation_not_found", notes, readiness, truth

        readiness.preview_allowed = pv_row.preview_status == "generated" and pv_row.capability_decision_state == "allowed"
        readiness.validation_pass = (
            val_row.validation_status == "completed"
            and val_row.overall_verdict == "pass"
            and val_row.capability_decision_state == "allowed"
        )

        readiness.linkage_matches = (
            pv_row.workflow_id == body.workflow_id
            and val_row.workflow_id == body.workflow_id
            and val_row.preview_id == body.preview_id
        )
        readiness.payload_matches_preview = _payloads_match_preview_intent(
            body.requested_payload,
            dict(pv_row.requested_payload or {}),
        )
        tid_pv = [str(x) for x in (pv_row.target_ids or [])]
        tid_va = [str(x) for x in (val_row.target_ids or [])]
        readiness.linkage_matches = readiness.linkage_matches and tid_pv == body.target_ids == tid_va

        pv_ok = (
            pv_row.preview_type == V1_PREVIEW_TYPE
            and pv_row.target_kind == "policy"
            and pv_row.requested_action_type == "intent_state_change"
        )
        val_ok = val_row.validation_type == V1_VALIDATION_TYPE and val_row.validation_context == "pre_change"

        if not pv_ok:
            notes.append("preview_type_or_shape_mismatch")
            return "blocked", "blocked", "preview_contract_mismatch", notes, readiness, truth
        if not val_ok:
            notes.append("validation_type_or_context_mismatch")
            return "blocked", "blocked", "validation_contract_mismatch", notes, readiness, truth

        if not readiness.linkage_matches or not readiness.payload_matches_preview:
            notes.append("preview_validation_linkage_or_payload_mismatch")
            return "blocked", "blocked", "stale_or_mismatched_prerequisites", notes, readiness, truth

        cap_ok, cap_reason = _static_policy_capability_allowed()
        readiness.capability_allowed = cap_ok
        if not cap_ok:
            notes.append(cap_reason or "capability_blocked")
            return "blocked", "blocked", cap_reason, notes, readiness, truth

        live_preview = preview_service.get_preview(body.preview_id)
        if live_preview is None:
            notes.append("preview_detail_missing")
            return "unknown", "blocked", "preview_not_found", notes, readiness, truth
        stale_pv = live_preview.preview.stale_posture
        readiness.preview_stale_posture = stale_pv
        if stale_pv != "current":
            notes.append(f"preview_stale:{stale_pv}")
            return "blocked", "blocked", "stale_preview", notes, readiness, truth

        live_val = validation_service.get_validation(body.validation_id)
        if live_val is None:
            return "unknown", "blocked", "validation_not_found", notes, readiness, truth
        readiness.validation_stale_posture = live_val.stale_posture
        if live_val.stale_posture != "current":
            notes.append(f"validation_stale:{live_val.stale_posture}")
            return "blocked", "blocked", "stale_validation", notes, readiness, truth
        now = _utcnow()
        if live_val.expires_at and live_val.expires_at < now:
            readiness.validation_not_expired = False
            notes.append("validation_expired")
            return "blocked", "blocked", "stale_validation", notes, readiness, truth
        readiness.validation_not_expired = True

        if not readiness.preview_allowed:
            notes.append(f"preview_not_allowed:status={pv_row.preview_status}")
            return "blocked", "blocked", "preview_not_executable", notes, readiness, truth

        if not readiness.validation_pass:
            notes.append(
                f"validation_not_pass:status={val_row.validation_status} verdict={val_row.overall_verdict}"
            )
            return "blocked", "blocked", "validation_not_executable", notes, readiness, truth

        readiness.policy_is_static_local = _policy_static_local(policy_id, policies)
        if not readiness.policy_is_static_local:
            notes.append("policy_not_static_local_or_missing")
            return "unsupported", "unsupported", "policy_outside_static_local_slice", notes, readiness, truth

        return "allowed", "allowed", None, notes, readiness, truth


def _execution_status_for_decision(decision: str) -> str:
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


def create_safe_action(body: SafeActionCreateRequest) -> tuple[SafeActionDetailResponse, bool]:
    """Create action row; enforced prerequisites; idempotent on idempotency_key."""
    t0 = time.perf_counter()
    aid = str(uuid4())
    now = _utcnow()
    policies = build_policies_list_response()

    with create_session() as session:
        if body.idempotency_key:
            existing = session.scalars(
                select(SafeActionTable).where(SafeActionTable.idempotency_key == body.idempotency_key)
            ).first()
            if existing is not None:
                return _row_to_detail(existing), False

    decision, cap_state, cap_reason, notes, readiness, truth = _evaluate_prerequisites_for_create(
        body=body, policies=policies
    )
    exec_status = _execution_status_for_decision(decision)
    approval_st = _approval_state_for_decision(decision)
    rollback_model = body.rollback or SafeActionRollbackHints()

    result_json: dict[str, object] = {
        "execution": SafeActionExecutionResult().model_dump(mode="json"),
        "prerequisite_readiness": readiness.model_dump(mode="json"),
        "rollback": rollback_model.model_dump(mode="json"),
        "contract_version": 1,
    }

    row = SafeActionTable(
        id=aid,
        workflow_id=body.workflow_id,
        preview_id=body.preview_id,
        validation_id=body.validation_id,
        idempotency_key=body.idempotency_key,
        action_type=body.action_type,
        target_kind=body.target_kind,
        target_ids=list(body.target_ids),
        target_scope=body.target_scope,
        requested_payload=dict(body.requested_payload),
        requested_at=now,
        requested_by_actor_type=body.requested_by_actor_type,
        requested_by_actor_id=body.requested_by_actor_id,
        requested_by_actor_display_name=body.requested_by_actor_display_name,
        action_decision=decision if decision != "invalid" else "blocked",
        capability_decision_state=cap_state,
        capability_decision_reason=cap_reason,
        truth_scope_summary=truth.model_dump(mode="json"),
        prerequisite_notes=list(notes),
        approval_required=True,
        approval_state=approval_st,
        execution_status=exec_status,
        post_check_validation_id=None,
        rollback_parent_action_id=rollback_model.rollback_parent_action_id,
        rollback_workflow_id=rollback_model.rollback_workflow_id,
        rollback_ready_state=rollback_model.rollback_ready_state,
        rollback_validation_id=rollback_model.rollback_validation_id,
        compensation_reference=rollback_model.compensation_reference,
        result_json=result_json,
        description=body.description,
    )

    with create_session() as session:
        session.add(row)
        _append_event(
            session,
            action_id=aid,
            event_type="action_requested",
            actor=body.requested_by_actor_id,
            reason=None,
            metadata={"action_type": body.action_type, "decision": decision},
        )
        _append_event(
            session,
            action_id=aid,
            event_type="capability_evaluated",
            actor="safe-action-engine",
            reason=cap_reason,
            metadata={"capability_decision_state": cap_state, "action_decision": decision},
        )
        try:
            session.commit()
        except IntegrityError as exc:
            session.rollback()
            if body.idempotency_key:
                with create_session() as session2:
                    existing = session2.scalars(
                        select(SafeActionTable).where(
                            SafeActionTable.idempotency_key == body.idempotency_key
                        )
                    ).first()
                    if existing is not None:
                        return _row_to_detail(existing), False
            raise exc

    record_safe_action_outcome(
        action_type=body.action_type,
        action_decision=decision if decision != "invalid" else "blocked",
        execution_status=exec_status,
        event="created",
        duration_seconds=time.perf_counter() - t0,
    )

    with create_session() as session:
        r = session.get(SafeActionTable, aid)
        assert r is not None
        return _row_to_detail(r), True


def get_safe_action(action_id: str) -> SafeActionDetailResponse | None:
    with create_session() as session:
        row = session.get(SafeActionTable, action_id)
        if row is None:
            return None
        return _row_to_detail(row)


def list_safe_actions(*, limit: int = 50) -> SafeActionListResponse:
    cap = max(1, min(limit, 100))
    meta = _metadata()
    with create_session() as session:
        rows = session.scalars(
            select(SafeActionTable).order_by(desc(SafeActionTable.requested_at)).limit(cap)
        ).all()
        items = [
            SafeActionListItem(
                action_id=r.id,
                action_type=r.action_type,
                action_decision=r.action_decision,  # type: ignore[arg-type]
                execution_status=r.execution_status,  # type: ignore[arg-type]
                workflow_id=r.workflow_id,
                preview_id=r.preview_id,
                validation_id=r.validation_id,
                requested_at=r.requested_at,
                requested_by_actor_id=r.requested_by_actor_id,
            )
            for r in rows
        ]
    return SafeActionListResponse(**meta.model_dump(), contract_id=SAFE_ACTION_WORKFLOW_V1_CONTRACT_ID, items=items)


def get_safe_action_timeline(action_id: str) -> SafeActionTimelineResponse | None:
    meta = _metadata()
    with create_session() as session:
        a = session.get(SafeActionTable, action_id)
        if a is None:
            return None
        ev_rows = session.scalars(
            select(SafeActionEventTable)
            .where(SafeActionEventTable.action_id == action_id)
            .order_by(SafeActionEventTable.occurred_at)
        ).all()
        events = [
            SafeActionEventItem(
                event_id=e.id,
                action_id=e.action_id,
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
    return SafeActionTimelineResponse(
        **meta.model_dump(),
        contract_id=SAFE_ACTION_WORKFLOW_V1_CONTRACT_ID,
        action_id=action_id,
        events=events,
    )


def approve_safe_action(action_id: str, body: SafeActionApproveRequest) -> SafeActionDetailResponse | None:
    t0 = time.perf_counter()
    now = _utcnow()
    with create_session() as session:
        row = session.get(SafeActionTable, action_id, with_for_update=True)
        if row is None:
            return None
        if row.action_decision != "allowed":
            session.rollback()
            raise ValueError("action_not_approvable")
        if row.execution_status != "awaiting_approval":
            session.rollback()
            raise ValueError("invalid_execution_state")
        if row.approval_state != "pending":
            session.rollback()
            raise ValueError("approval_not_pending")

        row.approval_state = "approved"
        row.approver_actor_id = body.actor_id
        row.approver_actor_display_name = body.actor_display_name
        row.approved_at = now
        row.execution_status = "ready_to_execute"
        _append_event(
            session,
            action_id=action_id,
            event_type="approval_granted",
            actor=body.actor_id,
            reason=body.reason,
            metadata={"provenance": body.provenance},
            provenance=body.provenance,
        )
        action_type_saved = row.action_type
        session.commit()

    record_safe_action_outcome(
        action_type=action_type_saved,
        action_decision="allowed",
        execution_status="ready_to_execute",
        event="approve",
        duration_seconds=time.perf_counter() - t0,
    )
    return get_safe_action(action_id)


def reject_safe_action(action_id: str, body: SafeActionRejectRequest) -> SafeActionDetailResponse | None:
    t0 = time.perf_counter()
    with create_session() as session:
        row = session.get(SafeActionTable, action_id, with_for_update=True)
        if row is None:
            return None
        if row.execution_status != "awaiting_approval" or row.approval_state != "pending":
            session.rollback()
            raise ValueError("invalid_execution_state")

        row.approval_state = "rejected"
        row.approver_actor_id = body.actor_id
        row.approver_actor_display_name = body.actor_display_name
        row.rejection_reason = body.reason
        row.execution_status = "blocked"
        _append_event(
            session,
            action_id=action_id,
            event_type="approval_rejected",
            actor=body.actor_id,
            reason=body.reason,
            metadata={"provenance": body.provenance},
            provenance=body.provenance,
        )
        action_type_saved = row.action_type
        session.commit()

    record_safe_action_outcome(
        action_type=action_type_saved,
        action_decision="blocked",
        execution_status="blocked",
        event="reject",
        duration_seconds=time.perf_counter() - t0,
    )
    return get_safe_action(action_id)


def cancel_safe_action(action_id: str, body: SafeActionCancelRequest) -> SafeActionDetailResponse | None:
    with create_session() as session:
        row = session.get(SafeActionTable, action_id, with_for_update=True)
        if row is None:
            return None
        if row.execution_status not in ("awaiting_approval", "ready_to_execute"):
            session.rollback()
            raise ValueError("invalid_execution_state")
        row.execution_status = "cancelled"
        _append_event(
            session,
            action_id=action_id,
            event_type="action_cancelled",
            actor=body.actor_id,
            reason=body.reason,
            metadata={},
            provenance="operator",
        )
        session.commit()
    return get_safe_action(action_id)


def _revalidate_execute_prerequisites(action_id: str) -> tuple[bool, str | None]:
    """Return ok, error_code."""
    with create_session() as session:
        row = session.get(SafeActionTable, action_id)
        if row is None:
            return False, "action_not_found"
        body = SafeActionCreateRequest(
            workflow_id=row.workflow_id or "",
            preview_id=row.preview_id or "",
            validation_id=row.validation_id or "",
            action_type=row.action_type,
            target_kind="policy",
            target_ids=[str(x) for x in (row.target_ids or [])],
            target_scope=dict(row.target_scope) if row.target_scope else None,
            requested_payload=dict(row.requested_payload or {}),
        )
    policies = build_policies_list_response()
    decision, _cap, reason, _notes, _readiness, _truth = _evaluate_prerequisites_for_create(
        body=body, policies=policies
    )
    if decision != "allowed":
        return False, reason or f"prerequisites_failed:{decision}"
    return True, None


def execute_safe_action(action_id: str, body: SafeActionExecuteRequest) -> SafeActionDetailResponse | None:
    t0 = time.perf_counter()
    now = _utcnow()

    with create_session() as session:
        row = session.get(SafeActionTable, action_id, with_for_update=True)
        if row is None:
            return None
        if row.execution_status == "succeeded":
            session.commit()
            return _row_to_detail(row)

        if row.execution_status != "ready_to_execute" or row.approval_state != "approved":
            session.rollback()
            raise ValueError("not_ready_to_execute")

        wf_row = session.get(WorkflowLifecycleTable, row.workflow_id)
        if wf_row is None:
            session.rollback()
            raise ValueError("workflow_not_found")
        if wf_row.workflow_status != "approved":
            session.rollback()
            raise ValueError("workflow_not_approved")

    ok, err = _revalidate_execute_prerequisites(action_id)
    if not ok:
        blocked_action_type = ""
        with create_session() as session:
            row_blk = session.get(SafeActionTable, action_id, with_for_update=True)
            assert row_blk is not None
            blocked_action_type = row_blk.action_type
            row_blk.execution_status = "blocked"
            row_blk.execution_error_code = err
            row_blk.execution_error_detail = "Prerequisites failed at execute time (stale or drift)."
            _append_event(
                session,
                action_id=action_id,
                event_type="action_blocked",
                actor=body.actor_id,
                reason=err,
                metadata={"phase": "pre_execute"},
                provenance=body.provenance,
            )
            session.commit()
        record_safe_action_outcome(
            action_type=blocked_action_type,
            action_decision="blocked",
            execution_status="blocked",
            event="execute_blocked",
            duration_seconds=time.perf_counter() - t0,
        )
        return get_safe_action(action_id)

    wf_id: str
    action_type_snap: str
    with create_session() as session:
        row_ex = session.get(SafeActionTable, action_id, with_for_update=True)
        assert row_ex is not None
        wf_id = row_ex.workflow_id or ""
        action_type_snap = row_ex.action_type
        policy_id = str(row_ex.target_ids[0])
        proposed = str(dict(row_ex.requested_payload or {}).get("proposed_intent_state", ""))
        row_ex.execution_status = "executing"
        row_ex.execution_started_at = now
        _append_event(
            session,
            action_id=action_id,
            event_type="execution_started",
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
                reason="safe_action_execute_start",
                actor=body.actor_id,
                metadata={"action_id": action_id},
                provenance="api",
            ),
        )
    except RuntimeError:
        pass

    intent_record_id = _new_intent_record_id()
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
                intent_state=proposed,
                action_id=action_id,
                previous_record_id=prev_id,
                applied_at=completed_at,
                truth_notes=[
                    "Platform-only operator intent overlay; observed inventory unchanged by this v1 action.",
                ],
            )
            session.add(rec)

            row2 = session.get(SafeActionTable, action_id, with_for_update=True)
            assert row2 is not None
            row2.execution_status = "succeeded"
            row2.execution_completed_at = completed_at
            row2.execution_latency_ms = latency_ms
            row2.execution_error_code = None
            row2.execution_error_detail = None
            ex = SafeActionExecutionResult(
                outcome="succeeded",
                operator_intent_record_id=intent_record_id,
                applied_intent_state=proposed,
                applied_policy_id=policy_id,
                notes=["Durably recorded in platform_app.policy_operator_intent_records."],
            )
            rj = dict(row2.result_json or {})
            rj["execution"] = ex.model_dump(mode="json")
            row2.result_json = rj
            _append_event(
                session,
                action_id=action_id,
                event_type="execution_completed",
                actor=body.actor_id,
                reason=None,
                metadata={"operator_intent_record_id": intent_record_id},
                provenance=body.provenance,
            )
            session.commit()
    except Exception as exc:
        with create_session() as session:
            row3 = session.get(SafeActionTable, action_id, with_for_update=True)
            if row3 is not None:
                row3.execution_status = "failed"
                row3.execution_completed_at = _utcnow()
                row3.execution_latency_ms = (time.perf_counter() - t0) * 1000.0
                row3.execution_error_code = "execution_persist_failed"
                row3.execution_error_detail = str(exc)[:8192]
                _append_event(
                    session,
                    action_id=action_id,
                    event_type="execution_failed",
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
                    reason="safe_action_execute_failed",
                    actor=body.actor_id,
                    metadata={"action_id": action_id},
                    provenance="api",
                ),
            )
        except RuntimeError:
            pass
        record_safe_action_outcome(
            action_type=action_type_snap,
            action_decision="allowed",
            execution_status="failed",
            event="execute_failed",
            duration_seconds=time.perf_counter() - t0,
        )
        return get_safe_action(action_id)

    try:
        workflow_service.transition_workflow_lifecycle(
            wf_id,
            WorkflowLifecycleTransitionRequest(
                next_status="succeeded",
                reason="safe_action_execute_succeeded",
                actor=body.actor_id,
                metadata={"action_id": action_id, "operator_intent_record_id": intent_record_id},
                provenance="api",
            ),
        )
    except RuntimeError:
        pass

    record_safe_action_outcome(
        action_type=action_type_snap,
        action_decision="allowed",
        execution_status="succeeded",
        event="execute_succeeded",
        duration_seconds=time.perf_counter() - t0,
    )
    return get_safe_action(action_id)
