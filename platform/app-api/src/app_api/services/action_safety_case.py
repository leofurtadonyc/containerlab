"""Bounded action safety case assembly from existing persisted workflow rows."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import desc, select

from app_api.config.settings import get_settings
from app_api.persistence.session import create_session
from app_api.persistence.tables import (
    PreviewRequestTable,
    RollbackRequestTable,
    SafeActionTable,
    ValidationRequestTable,
    WorkflowLifecycleTable,
)
from app_api.schemas.action_safety_case import (
    ActionSafetyCaseGate,
    ActionSafetyCaseNextStep,
    ActionSafetyCaseReference,
    ActionSafetyCaseResponse,
)
from app_api.schemas.common import ApiResponseMetadata
from app_api.services import controller_evidence as controller_evidence_service
from app_api.services import evidence_quality_workspace as evidence_quality_service
from app_api.services import preview_engine as preview_service
from app_api.services import validation_engine as validation_service

_metadata_phase = "phase_2_read_only_foundation"


def _utcnow() -> datetime:
    return datetime.now(UTC)


def _metadata() -> ApiResponseMetadata:
    settings = get_settings()
    return ApiResponseMetadata(
        service="app-api",
        version=settings.app_version,
        phase=_metadata_phase,
        generated_at=_utcnow(),
    )


def _gate(
    gate_id: str,
    severity: str,
    summary: str,
    cited_fields: list[str] | None = None,
) -> ActionSafetyCaseGate:
    return ActionSafetyCaseGate(
        gate_id=gate_id,
        severity=severity,  # type: ignore[arg-type]
        summary=summary,
        cited_fields=cited_fields or [],
    )


def _next_step(step_id: str, label: str, rationale: str, route_family: str | None = None) -> ActionSafetyCaseNextStep:
    return ActionSafetyCaseNextStep(step_id=step_id, label=label, rationale=rationale, route_family=route_family)


def _summarize_action(row: SafeActionTable) -> ActionSafetyCaseReference:
    return ActionSafetyCaseReference(
        present=True,
        identifier=row.id,
        status=row.execution_status,
        verdict=row.action_decision,
        summary=(
            f"Action {row.id} is {row.action_decision}/{row.execution_status}; "
            "v1 effect remains platform operator intent overlay only."
        ),
        route_family=f"GET /api/v1/actions/{row.id}",
        cited_fields=["safe_actions.action_decision", "safe_actions.execution_status"],
    )


def _summarize_workflow(row: WorkflowLifecycleTable | None, workflow_id: str | None) -> ActionSafetyCaseReference:
    if row is None:
        return ActionSafetyCaseReference(
            present=False,
            identifier=workflow_id,
            summary="No workflow lifecycle row is available for this action.",
            route_family="GET /api/v1/workflow-lifecycle/{workflow_id}",
        )
    return ActionSafetyCaseReference(
        present=True,
        identifier=row.id,
        status=row.workflow_status,
        summary=f"Workflow lifecycle is {row.workflow_status}; safety case does not alter lifecycle state.",
        route_family=f"GET /api/v1/workflow-lifecycle/{row.id}",
        cited_fields=["workflow_lifecycles.workflow_status"],
    )


def _summarize_preview(row: PreviewRequestTable | None, preview_id: str | None) -> ActionSafetyCaseReference:
    if row is None:
        return ActionSafetyCaseReference(
            present=False,
            identifier=preview_id,
            summary="No preview row is available for this action.",
            route_family="GET /api/v1/previews/{preview_id}",
        )
    live = preview_service.get_preview(row.id)
    stale = live.preview.stale_posture if live is not None else "unknown"
    return ActionSafetyCaseReference(
        present=True,
        identifier=row.id,
        status=row.preview_status,
        verdict=row.capability_decision_state,
        summary=f"Preview is {row.preview_status}; capability decision {row.capability_decision_state}; stale posture {stale}.",
        route_family=f"GET /api/v1/previews/{row.id}",
        cited_fields=["preview_requests.preview_status", "preview_requests.capability_decision_state", "preview.stale_posture"],
    )


def _summarize_diff(preview_id: str | None) -> ActionSafetyCaseReference:
    if not preview_id:
        return ActionSafetyCaseReference(
            present=False,
            summary="No preview id is available, so no diff summary can be assembled.",
            route_family="GET /api/v1/previews/{preview_id}/diff",
        )
    diff = preview_service.get_preview_diff(preview_id)
    if diff is None:
        return ActionSafetyCaseReference(
            present=False,
            identifier=preview_id,
            summary="Preview diff is unavailable for this action.",
            route_family=f"GET /api/v1/previews/{preview_id}/diff",
        )
    if diff.diff is None:
        return ActionSafetyCaseReference(
            present=False,
            identifier=preview_id,
            summary="Preview diff payload is empty for this action.",
            route_family=f"GET /api/v1/previews/{preview_id}/diff",
        )
    return ActionSafetyCaseReference(
        present=True,
        identifier=preview_id,
        status=diff.stale_posture,
        summary=(
            f"Diff has {len(diff.diff.change_items)} change item(s); "
            f"scope={diff.diff.change_scope}; stale posture {diff.stale_posture}."
        ),
        route_family=f"GET /api/v1/previews/{preview_id}/diff",
        cited_fields=["preview_diff.change_items", "preview_diff.change_scope", "preview_diff.stale_posture"],
    )


def _summarize_validation(row: ValidationRequestTable | None, validation_id: str | None) -> ActionSafetyCaseReference:
    if row is None:
        return ActionSafetyCaseReference(
            present=False,
            identifier=validation_id,
            summary="No validation row is available for this action.",
            route_family="GET /api/v1/validations/{validation_id}",
        )
    live = validation_service.get_validation(row.id)
    stale = live.stale_posture if live is not None else (row.stale_posture or "unknown")
    return ActionSafetyCaseReference(
        present=True,
        identifier=row.id,
        status=row.validation_status,
        verdict=row.overall_verdict,
        summary=(
            f"Validation is {row.validation_status}; verdict {row.overall_verdict or 'unknown'}; "
            f"capability {row.capability_decision_state}; stale posture {stale}."
        ),
        route_family=f"GET /api/v1/validations/{row.id}",
        cited_fields=[
            "validation_requests.validation_status",
            "validation_requests.overall_verdict",
            "validation_requests.capability_decision_state",
            "validation.stale_posture",
        ],
    )


def _summarize_evidence_quality() -> ActionSafetyCaseReference:
    try:
        eq = evidence_quality_service.build_evidence_quality_workspace_response()
    except Exception as exc:  # pragma: no cover - defensive: assembly should not break action detail.
        return ActionSafetyCaseReference(
            present=False,
            status="unavailable",
            summary=f"Evidence quality assembly unavailable: {exc.__class__.__name__}.",
            route_family="GET /api/v1/evidence-quality-workspace",
        )
    return ActionSafetyCaseReference(
        present=True,
        status=eq.read_path_reliability_posture,
        summary=(
            f"Evidence quality posture {eq.read_path_reliability_posture}; "
            f"rows={len(eq.rows)}; notes={len(eq.assembly_notes)}."
        ),
        route_family="GET /api/v1/evidence-quality-workspace",
        cited_fields=["evidence_quality_workspace.read_path_reliability_posture", "evidence_quality_workspace.rows"],
    )


def _summarize_controller_evidence() -> ActionSafetyCaseReference:
    try:
        ce = controller_evidence_service.build_controller_evidence_response()
    except Exception as exc:  # pragma: no cover - defensive: controller evidence is supporting only.
        return ActionSafetyCaseReference(
            present=False,
            status="unavailable",
            summary=f"Controller evidence assembly unavailable: {exc.__class__.__name__}.",
            route_family="GET /api/v1/controller/evidence",
        )
    lane_statuses = [ce.bgp_ls.session_posture, ce.pcep.session_posture, ce.netconf.session_posture]
    established = sum(1 for status in lane_statuses if status == "established")
    status = ce.controller_reachability
    return ActionSafetyCaseReference(
        present=True,
        status=status,
        summary=(
            f"Controller reachability {ce.controller_reachability}; established lanes={established}/3; "
            "supporting evidence only, not controller source of truth."
        ),
        route_family="GET /api/v1/controller/evidence",
        cited_fields=[
            "controller_evidence.controller_reachability",
            "controller_evidence.bgp_ls.session_posture",
            "controller_evidence.pcep.session_posture",
            "controller_evidence.netconf.session_posture",
        ],
    )


def _summarize_rollback(session, action_id: str) -> ActionSafetyCaseReference:
    rb = session.scalars(
        select(RollbackRequestTable)
        .where(RollbackRequestTable.parent_action_id == action_id)
        .order_by(desc(RollbackRequestTable.requested_at))
        .limit(1)
    ).first()
    if rb is None:
        return ActionSafetyCaseReference(
            present=False,
            status="not_prepared",
            summary="No rollback request is associated with this action yet.",
            route_family="GET /api/v1/rollbacks",
        )
    return ActionSafetyCaseReference(
        present=True,
        identifier=rb.id,
        status=rb.rollback_status,
        verdict=rb.rollback_decision,
        summary=(
            f"Rollback {rb.id} is {rb.rollback_decision}/{rb.rollback_status}; "
            "v1 rollback remains platform compensation, not device restore."
        ),
        route_family=f"GET /api/v1/rollbacks/{rb.id}",
        cited_fields=["rollback_requests.rollback_decision", "rollback_requests.rollback_status"],
    )


def _derive_posture(
    *,
    action: SafeActionTable,
    validation: ActionSafetyCaseReference,
    evidence_quality: ActionSafetyCaseReference,
    rollback: ActionSafetyCaseReference,
    blocking: list[ActionSafetyCaseGate],
    missing: list[ActionSafetyCaseGate],
) -> str:
    if action.action_decision in ("unsupported", "unknown") or action.execution_status in ("unsupported", "unknown", "invalid"):
        return "not_executable" if action.action_decision == "unsupported" else "unknown"
    if not validation.present:
        return "awaiting_validation"
    if blocking:
        return "blocked"
    if action.execution_status == "succeeded" and not rollback.present:
        return "rollback_not_ready"
    if evidence_quality.status in ("mixed_degraded", "heavily_limited") or any(g.gate_id.startswith("evidence_") for g in missing):
        return "degraded_evidence"
    return "ready_for_review"


def build_action_safety_case(action_id: str) -> ActionSafetyCaseResponse | None:
    """Assemble one action-primary safety case from existing bounded artifacts only."""

    with create_session() as session:
        action = session.get(SafeActionTable, action_id)
        if action is None:
            return None

        workflow_row = session.get(WorkflowLifecycleTable, action.workflow_id) if action.workflow_id else None
        preview_row = session.get(PreviewRequestTable, action.preview_id) if action.preview_id else None
        validation_row = session.get(ValidationRequestTable, action.validation_id) if action.validation_id else None

        action_ref = _summarize_action(action)
        workflow_ref = _summarize_workflow(workflow_row, action.workflow_id)
        preview_ref = _summarize_preview(preview_row, action.preview_id)
        diff_ref = _summarize_diff(action.preview_id)
        validation_ref = _summarize_validation(validation_row, action.validation_id)
        evidence_ref = _summarize_evidence_quality()
        controller_ref = _summarize_controller_evidence()
        rollback_ref = _summarize_rollback(session, action.id)

        blocking: list[ActionSafetyCaseGate] = []
        warnings: list[ActionSafetyCaseGate] = []
        missing: list[ActionSafetyCaseGate] = []

        if action.action_decision != "allowed":
            blocking.append(
                _gate(
                    "action_decision_not_allowed",
                    "blocking",
                    f"Action decision is {action.action_decision}; the safety case cannot upgrade it.",
                    ["safe_actions.action_decision"],
                )
            )
        if action.execution_status in ("blocked", "failed", "partially_failed", "cancelled", "invalid"):
            blocking.append(
                _gate(
                    "action_execution_status_not_reviewable",
                    "blocking",
                    f"Action execution status is {action.execution_status}.",
                    ["safe_actions.execution_status"],
                )
            )
        if not workflow_ref.present:
            missing.append(_gate("workflow_missing", "missing_evidence", "Workflow lifecycle evidence is missing."))
        if not preview_ref.present:
            missing.append(_gate("preview_missing", "missing_evidence", "Preview evidence is missing."))
        if not diff_ref.present:
            missing.append(_gate("diff_missing", "missing_evidence", "Preview diff evidence is missing."))
        if not validation_ref.present:
            missing.append(_gate("validation_missing", "missing_evidence", "Validation evidence is missing."))
        elif validation_ref.verdict != "pass":
            blocking.append(
                _gate(
                    "validation_not_pass",
                    "blocking",
                    f"Validation verdict is {validation_ref.verdict or 'unknown'}.",
                    ["validation_requests.overall_verdict"],
                )
            )
        if evidence_ref.status in ("mixed_degraded", "heavily_limited"):
            warnings.append(
                _gate(
                    "evidence_quality_degraded",
                    "warning",
                    f"Evidence quality posture is {evidence_ref.status}; operator review should account for weak read-side evidence.",
                    ["evidence_quality_workspace.read_path_reliability_posture"],
                )
            )
        if not controller_ref.present or controller_ref.status in ("unavailable", "unknown"):
            missing.append(
                _gate(
                    "controller_evidence_limited",
                    "missing_evidence",
                    "Controller evidence is unavailable or unknown; this does not block platform-only action review.",
                    ["controller_evidence.overall_posture"],
                )
            )
        if not rollback_ref.present and action.execution_status == "succeeded":
            warnings.append(
                _gate(
                    "rollback_not_prepared",
                    "warning",
                    "The action has succeeded but no rollback request is associated with it.",
                    ["rollback_requests.parent_action_id"],
                )
            )

        posture = _derive_posture(
            action=action,
            validation=validation_ref,
            evidence_quality=evidence_ref,
            rollback=rollback_ref,
            blocking=blocking,
            missing=missing,
        )

        next_steps: list[ActionSafetyCaseNextStep] = []
        if not validation_ref.present:
            next_steps.append(
                _next_step(
                    "create_or_attach_validation",
                    "Create or attach validation",
                    "Validation evidence is required before this action can be reviewed.",
                    "POST /api/v1/validations",
                )
            )
        if blocking:
            next_steps.append(
                _next_step(
                    "resolve_blocking_gates",
                    "Resolve blocking gates",
                    "The safety case is blocked until the listed backend-owned gates are cleared.",
                    f"GET /api/v1/actions/{action.id}",
                )
            )
        if action.execution_status == "succeeded" and not rollback_ref.present:
            next_steps.append(
                _next_step(
                    "prepare_rollback",
                    "Prepare rollback request",
                    "Rollback readiness is not present for this completed action.",
                    "POST /api/v1/rollbacks",
                )
            )
        if not next_steps:
            next_steps.append(
                _next_step(
                    "operator_review",
                    "Review bounded safety case",
                    "Review warnings and explicit limitations before using existing approval or execution controls.",
                    f"GET /api/v1/actions/{action.id}/safety-case",
                )
            )

        return ActionSafetyCaseResponse(
            **_metadata().model_dump(),
            action_id=action.id,
            final_bounded_posture=posture,  # type: ignore[arg-type]
            action=action_ref,
            workflow_lifecycle=workflow_ref,
            preview=preview_ref,
            diff_summary=diff_ref,
            validation=validation_ref,
            evidence_quality=evidence_ref,
            controller_evidence=controller_ref,
            rollback_readiness=rollback_ref,
            blocking_gates=blocking,
            warning_gates=warnings,
            missing_evidence=missing,
            operator_next_steps=next_steps,
        )
