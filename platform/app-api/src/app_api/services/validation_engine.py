"""Validation engine v1 — bounded policy read-model observability (not actuation)."""

from __future__ import annotations

import hashlib
import time
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from sqlalchemy import desc, select
from sqlalchemy.exc import IntegrityError

from app_api.config.settings import get_settings
from app_api.metrics.state import record_validation_outcome
from app_api.persistence.session import create_session
from app_api.persistence.tables import (
    PreviewRequestTable,
    ValidationEventTable,
    ValidationRequestTable,
    WorkflowLifecycleTable,
)
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.validation_engine import (
    CapabilityDecisionState,
    CheckVerdict,
    OverallVerdict,
    StalePosture,
    ValidationCheckResult,
    ValidationCreateRequest,
    ValidationDetailResponse,
    ValidationEventItem,
    ValidationEvidenceItem,
    ValidationListItem,
    ValidationListResponse,
    ValidationResultPayload,
    ValidationSafetyFraming,
    ValidationTimelineResponse,
    ValidationTruthScopeSummary,
    ValidationContext,
    ValidationLinkageHints,
)

from app_api.services.capabilities import build_capabilities_list_response
from app_api.services.policies import build_policies_list_response

V1_POLICY_READ_MODEL = "policy_read_model_observability_v1"
V1_SUPPORTED_TYPES: frozenset[str] = frozenset({V1_POLICY_READ_MODEL})
TARGET_KIND_POLICY = "policy"
TERMINAL_WORKFLOW_STATUSES: frozenset[str] = frozenset(
    {"succeeded", "failed", "cancelled", "rejected"}
)
STATIC_POLICY_DETAIL_FEATURE = "static_policy_detail"


def _utcnow() -> datetime:
    return datetime.now(UTC)


def _metadata() -> ApiResponseMetadata:
    settings = get_settings()
    return ApiResponseMetadata(
        service="app-api",
        version=settings.app_version,
        phase="phase_2_read_only_foundation",
        generated_at=_utcnow(),
    )


def _truth_fingerprint_from_policies(*, data_status: str, serving_mode: str, count: int) -> str:
    raw = f"{data_status}|{serving_mode}|{count}"
    return hashlib.sha256(raw.encode()).hexdigest()[:48]


def _find_static_policy_capability() -> tuple[str, str]:
    """Return (support_status, implementation_status) for Nokia static_policy_detail."""
    caps = build_capabilities_list_response()
    for item in caps.items:
        if item.feature == STATIC_POLICY_DETAIL_FEATURE and item.vendor == "nokia":
            return item.support_status, item.implementation_status
    return "unknown", "unknown"


def _aggregate_overall_verdict(checks: list[ValidationCheckResult]) -> OverallVerdict:
    """Aggregate check verdicts (mandatory checks are all checks in v1)."""
    if not checks:
        return "not_applicable"
    verdicts = [c.verdict for c in checks]
    if "fail" in verdicts:
        return "fail"
    if "unknown" in verdicts:
        return "unknown"
    if all(v == "not_applicable" for v in verdicts):
        return "not_applicable"
    if all(v == "pass" for v in verdicts):
        return "pass"
    return "unknown"


def _append_event(
    session,
    *,
    validation_id: str,
    event_type: str,
    actor: str,
    reason: str | None,
    metadata: dict[str, object],
    provenance: str = "api",
) -> None:
    row = ValidationEventTable(
        id=str(uuid4()),
        validation_id=validation_id,
        event_type=event_type,
        occurred_at=_utcnow(),
        actor=actor,
        reason=reason,
        event_metadata=metadata,
        provenance=provenance,
    )
    session.add(row)


def _build_checks_policy_read_model(
    *,
    policies,
    policy_id: str,
    context: ValidationContext,
) -> tuple[list[ValidationCheckResult], list[ValidationEvidenceItem], list[str]]:
    """Evaluate v1 checks against current policy inventory response."""
    checks: list[ValidationCheckResult] = []
    evidence: list[ValidationEvidenceItem] = []
    notes: list[str] = []

    gate = ValidationCheckResult(
        check_id="capability_gate_v1",
        check_name="Capability gate (static policy detail)",
        check_type="capability",
        check_context=context,
        verdict="pass",
        reason="static_policy_detail is supported for Nokia SR OS in the bounded matrix.",
        confidence_state="high",
        source="capability_matrix",
        evidence_refs=["ev_capability_matrix"],
    )
    checks.append(gate)
    evidence.append(
        ValidationEvidenceItem(
            evidence_id="ev_capability_matrix",
            evidence_type="capability_record",
            evidence_source="GET /api/v1/capabilities",
            observed_at=_utcnow(),
            summary="Capability matrix evaluation for static_policy_detail.",
            provenance="backend",
            confidence_notes=["Matrix is descriptive; not vendor execution proof."],
        )
    )

    inv = ValidationCheckResult(
        check_id="policy_inventory_non_empty_v1",
        check_name="Policy inventory reachable",
        check_type="read_model",
        check_context=context,
        verdict="pass",
        reason="Policy inventory response returned with bounded read-side metadata.",
        confidence_state="medium",
        source="policy_read_path",
        evidence_refs=["ev_policy_inventory"],
    )
    if policies.observed_policy_count == 0 and policies.empty_reason == "no_policies_observed":
        inv.verdict = "unknown"
        inv.reason = (
            "Policy inventory reports no observed policies; cannot validate a concrete policy row."
        )
        inv.unknown_reason = "no_policies_observed"
        inv.confidence_state = "low"
        notes.append("Truth depth: inventory empty — validation remains unknown, not pass.")
    elif policies.empty_reason == "collector_unavailable":
        inv.verdict = "unknown"
        inv.unknown_reason = "collector_unavailable"
        inv.reason = "Collector unavailable; policy read model may be degraded or persisted-only."
        notes.append("Policy collector boundary was unavailable when building inventory.")
    checks.append(inv)
    evidence.append(
        ValidationEvidenceItem(
            evidence_id="ev_policy_inventory",
            evidence_type="policies_list_response",
            evidence_source="GET /api/v1/policies",
            observed_at=policies.observed_at,
            summary=f"observed_policy_count={policies.observed_policy_count}, "
            f"empty_reason={policies.empty_reason}, data_status={policies.data_status}",
            provenance="backend",
            confidence_notes=list(policies.notes)[:5],
        )
    )

    found = None
    for p in policies.items:
        if p.policy_id == policy_id:
            found = p
            break

    presence = ValidationCheckResult(
        check_id="policy_record_present_v1",
        check_name="Policy record present in read model",
        check_type="inventory_membership",
        check_context=context,
        verdict="fail" if found is None else "pass",
        reason=(
            f"Policy {policy_id!r} not found in current normalized inventory."
            if found is None
            else f"Policy {policy_id!r} is present in the normalized inventory."
        ),
        confidence_state="high" if found is not None else "high",
        source="policy_read_path",
        evidence_refs=["ev_policy_record"] if found is not None else [],
    )
    if found is None:
        presence.evidence_refs = ["ev_policy_inventory"]
    checks.append(presence)

    if found is not None:
        evidence.append(
            ValidationEvidenceItem(
                evidence_id="ev_policy_record",
                evidence_type="policy_record",
                evidence_source="normalized_policy_inventory",
                observed_at=policies.observed_at,
                summary=f"policy_type={found.policy_type}, observed_state={found.observed_state}",
                provenance="backend",
                confidence_notes=[],
            )
        )

    depth_verdict: CheckVerdict = "pass"
    depth_reason = "Bounded static-policy fields available for this record where present."
    depth_unknown: str | None = None
    if found is None:
        depth_verdict = "not_applicable"
        depth_reason = "No policy record; truth-depth check not applicable."
    elif found.support_state in ("unknown", "unsupported"):
        depth_verdict = "unknown"
        depth_reason = "Policy support_state is not confidently observed for workflow-grade conclusions."
        depth_unknown = "weak_support_state"
    elif policies.detail_mode == "counters_only":
        depth_verdict = "unknown"
        depth_reason = "Policy detail mode is counters_only; bounded static-policy validation is weak."
        depth_unknown = "detail_mode_counters_only"

    depth = ValidationCheckResult(
        check_id="policy_observation_truth_depth_v1",
        check_name="Policy observation truth depth",
        check_type="truth_depth",
        check_context=context,
        verdict=depth_verdict,
        reason=depth_reason,
        confidence_state="low" if depth_verdict == "unknown" else "medium",
        source="policy_read_path",
        evidence_refs=["ev_policy_inventory", "ev_truth_scope"],
        unknown_reason=depth_unknown if depth_verdict == "unknown" else None,
    )
    checks.append(depth)
    evidence.append(
        ValidationEvidenceItem(
            evidence_id="ev_truth_scope",
            evidence_type="truth_scope_summary",
            evidence_source="policy_read_path",
            observed_at=_utcnow(),
            summary=(
                f"detail_mode={policies.detail_mode}, confidence_posture="
                f"{policies.evidence_confidence.confidence_posture}"
            ),
            provenance="backend",
            confidence_notes=[
                "Topology/policy truth remains intentionally bounded for Phase 2.",
            ],
        )
    )

    return checks, evidence, notes


def _row_to_detail(
    row: ValidationRequestTable,
    *,
    live_stale_posture: StalePosture | None = None,
) -> ValidationDetailResponse:
    meta = _metadata()
    result_dict = dict(row.result_json or {})
    payload_dict = result_dict.get("result")
    if not isinstance(payload_dict, dict):
        payload_dict = {}
    payload = ValidationResultPayload.model_validate(
        {**payload_dict, "validation_id": row.id}
    )
    ts = ValidationTruthScopeSummary.model_validate(row.truth_scope_summary)
    stale: StalePosture = live_stale_posture or (
        row.stale_posture  # type: ignore[assignment]
        if row.stale_posture in ("current", "truth_changed", "unknown")
        else "current"
    )
    ext = (
        ValidationLinkageHints.model_validate(row.extension_hints)
        if row.extension_hints
        else None
    )
    return ValidationDetailResponse(
        **meta.model_dump(),
        validation_id=row.id,
        workflow_id=row.workflow_id,
        preview_id=row.preview_id,
        validation_type=row.validation_type,
        validation_context=row.validation_context,  # type: ignore[arg-type]
        target_kind=row.target_kind,
        target_ids=list(row.target_ids) if row.target_ids else [],
        target_scope=dict(row.target_scope) if row.target_scope else None,
        requested_checkset=list(row.requested_checkset) if row.requested_checkset else None,
        created_at=row.created_at,
        created_by_actor_type=row.created_by_actor_type,
        created_by_actor_id=row.created_by_actor_id,
        created_by_actor_display_name=row.created_by_actor_display_name,
        validation_status=row.validation_status,  # type: ignore[arg-type]
        capability_decision_state=row.capability_decision_state,  # type: ignore[arg-type]
        capability_decision_reason=row.capability_decision_reason,
        truth_scope_summary=ts,
        truth_fingerprint=row.truth_fingerprint,
        overall_verdict=row.overall_verdict,  # type: ignore[arg-type]
        stale_posture=stale,
        expires_at=row.expires_at,
        notes=row.notes,
        extension_hints=ext,
        processing_duration_ms=row.processing_duration_ms,
        result=payload,
    )


def create_validation(
    body: ValidationCreateRequest,
) -> tuple[ValidationDetailResponse, bool]:
    """Create and evaluate a validation request."""
    if body.validation_type not in V1_SUPPORTED_TYPES:
        raise ValueError("unsupported_validation_type")
    if body.target_kind != TARGET_KIND_POLICY:
        raise ValueError("unsupported_target_kind")
    if len(body.target_ids) != 1:
        raise ValueError("policy_validation_requires_single_target_id")
    policy_id = body.target_ids[0].strip()
    if not policy_id:
        raise ValueError("empty_policy_id")

    t0 = time.perf_counter()
    vid = str(uuid4())
    now = _utcnow()

    with create_session() as session:
        if body.idempotency_key:
            existing = session.scalars(
                select(ValidationRequestTable).where(
                    ValidationRequestTable.idempotency_key == body.idempotency_key
                )
            ).first()
            if existing is not None:
                return _row_to_detail(existing), False

        if body.workflow_id:
            wf = session.get(WorkflowLifecycleTable, body.workflow_id)
            if wf is None:
                raise LookupError("workflow_not_found")
            if wf.workflow_status in TERMINAL_WORKFLOW_STATUSES:
                row = _persist_terminal_blocked(
                    session,
                    validation_id=vid,
                    body=body,
                    now=now,
                    reason=f"workflow_terminal:{wf.workflow_status}",
                    t0=t0,
                )
                session.commit()
                return _row_to_detail(row), True

        if body.preview_id:
            pv = session.get(PreviewRequestTable, body.preview_id)
            if pv is None:
                raise LookupError("preview_not_found")

        support_status, _impl = _find_static_policy_capability()
        if support_status == "unsupported":
            row = _persist_unsupported(
                session,
                validation_id=vid,
                body=body,
                now=now,
                reason="static_policy_detail_unsupported",
                t0=t0,
            )
            session.commit()
            return _row_to_detail(row), True

        policies = build_policies_list_response()
        if policies.empty_reason == "collector_unavailable":
            row = _persist_blocked_collector(
                session,
                validation_id=vid,
                body=body,
                policies=policies,
                policy_id=policy_id,
                now=now,
                t0=t0,
            )
            session.commit()
            return _row_to_detail(row), True

        fp = _truth_fingerprint_from_policies(
            data_status=policies.data_status,
            serving_mode=policies.serving_mode,
            count=policies.observed_policy_count,
        )

        checks, evidence, agg_notes = _build_checks_policy_read_model(
            policies=policies,
            policy_id=policy_id,
            context=body.validation_context,
        )
        overall = _aggregate_overall_verdict(checks)

        truth = ValidationTruthScopeSummary(
            policy_data_status=policies.data_status,
            policy_serving_mode=policies.serving_mode,
            policies_source_posture=policies.evidence_confidence.source_posture,
            policies_confidence_posture=policies.evidence_confidence.confidence_posture,
            policies_evidence_kind=policies.evidence_confidence.evidence_kind,
            policy_truth_notes=list(policies.notes)[:8],
            validation_truth_notes=agg_notes,
        )

        cap_decision: CapabilityDecisionState = "allowed"
        cap_reason = None

        payload = ValidationResultPayload(
            validation_id=vid,
            validation_type=body.validation_type,
            validation_context=body.validation_context,
            overall_verdict=overall,
            verdict_summary=_verdict_summary(overall, checks),
            checks=checks,
            evidence=evidence,
            aggregation_notes=agg_notes,
            stale_posture="current",
            capability_decision_state=cap_decision,
            capability_decision_reason=cap_reason,
            truth_scope_summary=truth,
            linkage=body.extension_hints or ValidationLinkageHints(),
            safety_framing=ValidationSafetyFraming(),
        )

        duration_ms = (time.perf_counter() - t0) * 1000.0
        ext = body.extension_hints.model_dump(mode="json") if body.extension_hints else None

        row = ValidationRequestTable(
            id=vid,
            workflow_id=body.workflow_id,
            preview_id=body.preview_id,
            idempotency_key=body.idempotency_key,
            validation_type=body.validation_type,
            validation_context=body.validation_context,
            target_kind=body.target_kind,
            target_ids=list(body.target_ids),
            target_scope=body.target_scope,
            requested_checkset=body.requested_checkset,
            created_at=now,
            created_by_actor_type=body.created_by_actor_type,
            created_by_actor_id=body.created_by_actor_id,
            created_by_actor_display_name=body.created_by_actor_display_name,
            validation_status="completed",
            capability_decision_state=cap_decision,
            capability_decision_reason=cap_reason,
            truth_scope_summary=truth.model_dump(mode="json"),
            truth_fingerprint=fp,
            overall_verdict=overall,
            stale_posture="current",
            expires_at=now + timedelta(hours=24),
            notes=body.notes,
            extension_hints=ext,
            result_json={"result": payload.model_dump(mode="json"), "contract_version": 1},
            processing_duration_ms=duration_ms,
        )
        session.add(row)
        _append_event(
            session,
            validation_id=vid,
            event_type="validation_requested",
            actor=body.created_by_actor_id,
            reason=None,
            metadata={"validation_type": body.validation_type},
        )
        _append_event(
            session,
            validation_id=vid,
            event_type="capability_evaluated",
            actor="validation-engine",
            reason=cap_reason,
            metadata={"decision": cap_decision},
        )
        _append_event(
            session,
            validation_id=vid,
            event_type="validation_completed",
            actor="validation-engine",
            reason=None,
            metadata={"overall_verdict": overall},
        )
        try:
            session.commit()
        except IntegrityError as exc:
            session.rollback()
            if body.idempotency_key:
                existing = session.scalars(
                    select(ValidationRequestTable).where(
                        ValidationRequestTable.idempotency_key == body.idempotency_key
                    )
                ).first()
                if existing is not None:
                    return _row_to_detail(existing), False
            raise exc

    record_validation_outcome(
        validation_type=body.validation_type,
        validation_context=body.validation_context,
        capability_decision_state=cap_decision,
        validation_status="completed",
        overall_verdict=overall,
        duration_seconds=(time.perf_counter() - t0),
    )
    with create_session() as session:
        r = session.get(ValidationRequestTable, vid)
        assert r is not None
        return _row_to_detail(r), True


def _verdict_summary(overall: OverallVerdict, checks: list[ValidationCheckResult]) -> str:
    if overall == "pass":
        return "All v1 checks passed within bounded read-model semantics."
    if overall == "fail":
        return "At least one v1 check failed (membership or bounded observation)."
    if overall == "unknown":
        return "At least one v1 check is unknown due to weak or missing evidence."
    return "Checks were not applicable for this validation posture."


def _persist_blocked_collector(
    session,
    *,
    validation_id: str,
    body: ValidationCreateRequest,
    policies,
    policy_id: str,
    now: datetime,
    t0: float,
) -> ValidationRequestTable:
    """Collector unavailable — capability decision is blocked; verdicts are unknown/not applicable."""
    checks, evidence, agg_notes = _build_checks_policy_read_model(
        policies=policies,
        policy_id=policy_id,
        context=body.validation_context,
    )
    # Force inventory/truth checks to unknown when collector is unavailable
    for c in checks:
        if c.check_id in ("policy_inventory_non_empty_v1", "policy_observation_truth_depth_v1"):
            c.verdict = "unknown"
            c.unknown_reason = "collector_unavailable"
            c.reason = "Policy collector unavailable — bounded observability cannot be asserted."
    overall = _aggregate_overall_verdict(checks)
    truth = ValidationTruthScopeSummary(
        policy_data_status=policies.data_status,
        policy_serving_mode=policies.serving_mode,
        policies_source_posture=policies.evidence_confidence.source_posture,
        policies_confidence_posture=policies.evidence_confidence.confidence_posture,
        policies_evidence_kind=policies.evidence_confidence.evidence_kind,
        policy_truth_notes=list(policies.notes)[:8],
        validation_truth_notes=agg_notes
        + ["Capability decision: blocked (policy collector unavailable)."],
    )
    reason = "Policy collector unavailable — validation cannot claim fresh live observability."
    payload = ValidationResultPayload(
        validation_id=validation_id,
        validation_type=body.validation_type,
        validation_context=body.validation_context,
        overall_verdict=overall,
        verdict_summary=_verdict_summary(overall, checks),
        checks=checks,
        evidence=evidence,
        aggregation_notes=agg_notes,
        stale_posture="current",
        capability_decision_state="blocked",
        capability_decision_reason=reason,
        truth_scope_summary=truth,
    )
    duration_ms = (time.perf_counter() - t0) * 1000.0
    fp = _truth_fingerprint_from_policies(
        data_status=policies.data_status,
        serving_mode=policies.serving_mode,
        count=policies.observed_policy_count,
    )
    row = ValidationRequestTable(
        id=validation_id,
        workflow_id=body.workflow_id,
        preview_id=body.preview_id,
        idempotency_key=body.idempotency_key,
        validation_type=body.validation_type,
        validation_context=body.validation_context,
        target_kind=body.target_kind,
        target_ids=list(body.target_ids),
        target_scope=body.target_scope,
        requested_checkset=body.requested_checkset,
        created_at=now,
        created_by_actor_type=body.created_by_actor_type,
        created_by_actor_id=body.created_by_actor_id,
        created_by_actor_display_name=body.created_by_actor_display_name,
        validation_status="completed",
        capability_decision_state="blocked",
        capability_decision_reason=reason,
        truth_scope_summary=truth.model_dump(mode="json"),
        truth_fingerprint=fp,
        overall_verdict=overall,
        stale_posture="current",
        expires_at=now + timedelta(hours=24),
        notes=body.notes,
        extension_hints=body.extension_hints.model_dump(mode="json") if body.extension_hints else None,
        result_json={"result": payload.model_dump(mode="json"), "contract_version": 1},
        processing_duration_ms=duration_ms,
    )
    session.add(row)
    _append_event(
        session,
        validation_id=validation_id,
        event_type="validation_blocked",
        actor="validation-engine",
        reason=reason,
        metadata={"layer": "collector_boundary"},
    )
    record_validation_outcome(
        validation_type=body.validation_type,
        validation_context=body.validation_context,
        capability_decision_state="blocked",
        validation_status="completed",
        overall_verdict=overall,
        duration_seconds=(time.perf_counter() - t0),
    )
    return row


def _persist_terminal_blocked(
    session,
    *,
    validation_id: str,
    body: ValidationCreateRequest,
    now: datetime,
    reason: str,
    t0: float,
) -> ValidationRequestTable:
    truth = ValidationTruthScopeSummary(
        policy_data_status="unknown",
        policy_serving_mode="unknown",
        policies_source_posture="unknown",
        policies_confidence_posture="unknown",
        policies_evidence_kind="unknown",
        policy_truth_notes=[],
        validation_truth_notes=["Workflow is terminal — validation refused."],
    )
    payload = ValidationResultPayload(
        validation_id=validation_id,
        validation_type=body.validation_type,
        validation_context=body.validation_context,
        overall_verdict="not_applicable",
        verdict_summary="Validation blocked because the linked workflow is in a terminal state.",
        checks=[],
        evidence=[],
        aggregation_notes=[reason],
        stale_posture="current",
        capability_decision_state="blocked",
        capability_decision_reason=reason,
        truth_scope_summary=truth,
    )
    duration_ms = (time.perf_counter() - t0) * 1000.0
    row = ValidationRequestTable(
        id=validation_id,
        workflow_id=body.workflow_id,
        preview_id=body.preview_id,
        idempotency_key=body.idempotency_key,
        validation_type=body.validation_type,
        validation_context=body.validation_context,
        target_kind=body.target_kind,
        target_ids=list(body.target_ids),
        target_scope=body.target_scope,
        requested_checkset=body.requested_checkset,
        created_at=now,
        created_by_actor_type=body.created_by_actor_type,
        created_by_actor_id=body.created_by_actor_id,
        created_by_actor_display_name=body.created_by_actor_display_name,
        validation_status="completed",
        capability_decision_state="blocked",
        capability_decision_reason=reason,
        truth_scope_summary=truth.model_dump(mode="json"),
        truth_fingerprint=None,
        overall_verdict="not_applicable",
        stale_posture="current",
        expires_at=None,
        notes=body.notes,
        extension_hints=body.extension_hints.model_dump(mode="json") if body.extension_hints else None,
        result_json={"result": payload.model_dump(mode="json"), "contract_version": 1},
        processing_duration_ms=duration_ms,
    )
    session.add(row)
    _append_event(session, validation_id=validation_id, event_type="validation_blocked", actor="validation-engine", reason=reason, metadata={})
    record_validation_outcome(
        validation_type=body.validation_type,
        validation_context=body.validation_context,
        capability_decision_state="blocked",
        validation_status="completed",
        overall_verdict="not_applicable",
        duration_seconds=(time.perf_counter() - t0),
    )
    return row


def _persist_unsupported(
    session,
    *,
    validation_id: str,
    body: ValidationCreateRequest,
    now: datetime,
    reason: str,
    t0: float,
) -> ValidationRequestTable:
    truth = ValidationTruthScopeSummary(
        policy_data_status="unknown",
        policy_serving_mode="unknown",
        policies_source_posture="unknown",
        policies_confidence_posture="unknown",
        policies_evidence_kind="unknown",
        policy_truth_notes=[],
        validation_truth_notes=["Capability matrix reports unsupported static policy detail."],
    )
    payload = ValidationResultPayload(
        validation_id=validation_id,
        validation_type=body.validation_type,
        validation_context=body.validation_context,
        overall_verdict="not_applicable",
        verdict_summary="Validation unsupported for current capability posture.",
        checks=[],
        evidence=[],
        aggregation_notes=[reason],
        stale_posture="current",
        capability_decision_state="unsupported",
        capability_decision_reason=reason,
        truth_scope_summary=truth,
    )
    duration_ms = (time.perf_counter() - t0) * 1000.0
    row = ValidationRequestTable(
        id=validation_id,
        workflow_id=body.workflow_id,
        preview_id=body.preview_id,
        idempotency_key=body.idempotency_key,
        validation_type=body.validation_type,
        validation_context=body.validation_context,
        target_kind=body.target_kind,
        target_ids=list(body.target_ids),
        target_scope=body.target_scope,
        requested_checkset=body.requested_checkset,
        created_at=now,
        created_by_actor_type=body.created_by_actor_type,
        created_by_actor_id=body.created_by_actor_id,
        created_by_actor_display_name=body.created_by_actor_display_name,
        validation_status="completed",
        capability_decision_state="unsupported",
        capability_decision_reason=reason,
        truth_scope_summary=truth.model_dump(mode="json"),
        truth_fingerprint=None,
        overall_verdict="not_applicable",
        stale_posture="current",
        expires_at=None,
        notes=body.notes,
        extension_hints=body.extension_hints.model_dump(mode="json") if body.extension_hints else None,
        result_json={"result": payload.model_dump(mode="json"), "contract_version": 1},
        processing_duration_ms=duration_ms,
    )
    session.add(row)
    _append_event(
        session,
        validation_id=validation_id,
        event_type="validation_unsupported",
        actor="validation-engine",
        reason=reason,
        metadata={},
    )
    record_validation_outcome(
        validation_type=body.validation_type,
        validation_context=body.validation_context,
        capability_decision_state="unsupported",
        validation_status="completed",
        overall_verdict="not_applicable",
        duration_seconds=(time.perf_counter() - t0),
    )
    return row


def get_validation(validation_id: str) -> ValidationDetailResponse | None:
    """Return one validation; recompute stale posture vs live policy fingerprint when possible."""
    with create_session() as session:
        row = session.get(ValidationRequestTable, validation_id)
        if row is None:
            return None
        live_stale: StalePosture = "current"
        try:
            policies = build_policies_list_response()
            live_fp = _truth_fingerprint_from_policies(
                data_status=policies.data_status,
                serving_mode=policies.serving_mode,
                count=policies.observed_policy_count,
            )
            if row.truth_fingerprint and live_fp != row.truth_fingerprint:
                live_stale = "truth_changed"
        except Exception:
            live_stale = "unknown"
        return _row_to_detail(row, live_stale_posture=live_stale)


def list_validations(*, limit: int = 50) -> ValidationListResponse:
    cap = max(1, min(limit, 100))
    meta = _metadata()
    with create_session() as session:
        rows = session.scalars(
            select(ValidationRequestTable)
            .order_by(desc(ValidationRequestTable.created_at))
            .limit(cap)
        ).all()
        items = [
            ValidationListItem(
                validation_id=r.id,
                validation_type=r.validation_type,
                validation_context=r.validation_context,  # type: ignore[arg-type]
                validation_status=r.validation_status,  # type: ignore[arg-type]
                overall_verdict=r.overall_verdict,  # type: ignore[arg-type]
                capability_decision_state=r.capability_decision_state,  # type: ignore[arg-type]
                created_at=r.created_at,
                workflow_id=r.workflow_id,
                preview_id=r.preview_id,
            )
            for r in rows
        ]
    return ValidationListResponse(
        **meta.model_dump(),
        items=items,
    )


def get_validation_timeline(validation_id: str) -> ValidationTimelineResponse | None:
    meta = _metadata()
    with create_session() as session:
        v = session.get(ValidationRequestTable, validation_id)
        if v is None:
            return None
        ev_rows = session.scalars(
            select(ValidationEventTable)
            .where(ValidationEventTable.validation_id == validation_id)
            .order_by(ValidationEventTable.occurred_at)
        ).all()
        events = [
            ValidationEventItem(
                event_id=e.id,
                validation_id=e.validation_id,
                event_type=e.event_type,
                occurred_at=e.occurred_at,
                actor=e.actor,
                reason=e.reason,
                metadata=dict(e.event_metadata or {}),
                provenance=e.provenance if e.provenance in ("system", "operator", "api") else "api",  # type: ignore[arg-type]
            )
            for e in ev_rows
        ]
    return ValidationTimelineResponse(
        **meta.model_dump(),
        validation_id=validation_id,
        events=events,
    )
