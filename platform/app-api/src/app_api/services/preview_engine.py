"""Dry-run / preview / diff engine v1 (bounded static_local intent; not actuation)."""

from __future__ import annotations

import hashlib
import time
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import desc, select
from sqlalchemy.exc import IntegrityError

from app_api.metrics.state import record_preview_outcome
from app_api.persistence.session import create_session
from app_api.persistence.tables import (
    PreviewEventTable,
    PreviewRequestTable,
    WorkflowLifecycleTable,
)
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.policies import PolicyRecord
from app_api.schemas.preview_engine import (
    PREVIEW_ENGINE_V1_CONTRACT_ID,
    PreviewCreateRequest,
    PreviewDetailPayload,
    PreviewDetailResponse,
    PreviewDiffModel,
    PreviewDiffResponse,
    PreviewEventItem,
    PreviewListItem,
    PreviewListResponse,
    PreviewSafetyFraming,
    PreviewTimelineResponse,
    PreviewTruthScopeSummary,
    PreviewChangeItem,
    PreviewLinkageHints,
    PreviewDecisionState,
)
from app_api.services.capabilities import build_capabilities_list_response
from app_api.services.policies import build_policies_list_response

V1_PREVIEW_TYPE = "policy_static_local_intent_preview_v1"


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


def _truth_fingerprint_from_policies(
    *,
    data_status: str,
    serving_mode: str,
    policy_ids: list[str],
) -> str:
    joined = ",".join(sorted(policy_ids)[:500])
    raw = f"{data_status}|{serving_mode}|{len(policy_ids)}|{joined}"
    return hashlib.sha256(raw.encode()).hexdigest()[:48]


def _find_policy(records: list[PolicyRecord], policy_id: str) -> PolicyRecord | None:
    for p in records:
        if p.policy_id == policy_id:
            return p
    return None


def _decision_to_preview_status(
    decision: PreviewDecisionState,
) -> PreviewStatus:
    if decision == "allowed":
        return "generated"
    if decision == "blocked":
        return "blocked"
    if decision == "unsupported":
        return "unsupported"
    if decision == "unknown":
        return "unknown"
    return "invalid"


def _build_diff(
    *,
    preview_id: str,
    before_intent: str,
    after_intent: str,
    decision: PreviewDecisionState,
) -> PreviewDiffModel | None:
    if decision != "allowed":
        return None
    return PreviewDiffModel(
        diff_id=f"{preview_id}:diff",
        diff_type="policy_intent_state_v1",
        change_items=[
            PreviewChangeItem(
                field_name="intent_state",
                change_kind="modify" if before_intent != after_intent else "no_change",
                before_value=before_intent,
                after_value=after_intent,
                confidence_state="medium",
                reason="Normalized policy inventory intent_state only; not vendor config.",
                source="normalized_policy_inventory",
            )
        ],
        before_summary=f"intent_state={before_intent}",
        after_summary=f"intent_state={after_intent}",
        change_scope="single_field:intent_state",
        risk_hints=[
            "Intent preview does not prove the network will accept or apply the change.",
        ],
        unknown_items=[],
        unsupported_items=[],
        capability_notes=[
            "V1 supports only static_local policy rows with bounded normalized intent_state.",
        ],
        truth_notes=[
            "Diff is in normalized product terms; raw SR OS policy text is out of scope.",
        ],
    )


def _evaluate_v1(
    *,
    policy_id: str,
    proposed_raw: str,
    policies_items: list[PolicyRecord],
    policies_data_status: str,
    policies_serving_mode: str,
    evidence_confidence: object,
    static_detail_support: str,
) -> tuple[
    PreviewDecisionState,
    str | None,
    str,
    PreviewTruthScopeSummary,
]:
    """Return decision, reason, decision_source, truth_scope."""
    truth = PreviewTruthScopeSummary(
        policy_data_status=policies_data_status,
        policy_serving_mode=policies_serving_mode,
        policies_source_posture=str(getattr(evidence_confidence, "source_posture", "unknown")),
        policies_confidence_posture=str(getattr(evidence_confidence, "confidence_posture", "unknown")),
        policies_evidence_kind=str(getattr(evidence_confidence, "evidence_kind", "unknown")),
        capability_feature_checked="static_policy_detail",
        capability_support_status=static_detail_support,
        policy_truth_notes=[],
    )

    if static_detail_support == "unsupported":
        return (
            "blocked",
            "static_policy_detail capability is unsupported for this platform slice.",
            "capability_matrix:static_policy_detail",
            truth,
        )

    conf = getattr(evidence_confidence, "confidence_posture", "")
    if str(conf) == "blocked":
        return (
            "blocked",
            "Policy evidence confidence is blocked; preview cannot claim normalized intent truth.",
            "policies:evidence_confidence",
            truth,
        )

    proposed_intent: str = proposed_raw  # validated by caller

    pol = _find_policy(policies_items, policy_id)
    if pol is None:
        truth.policy_truth_notes.append("Policy id not present in current normalized inventory.")
        return (
            "unknown",
            "Policy not found in current normalized policy list.",
            "policies:inventory_lookup",
            truth,
        )

    if pol.policy_type != "static_local":
        return (
            "unsupported",
            "V1 preview supports only policy_type=static_local.",
            "preview_engine:v1_scope",
            truth,
        )

    before = pol.intent_state
    if before == proposed_intent:
        return (
            "blocked",
            "No change: proposed intent_state matches current normalized intent_state.",
            "preview_engine:no_change",
            truth,
        )

    return (
        "allowed",
        None,
        "policy_static_local_intent_rules_v1",
        truth,
    )


def _row_to_detail_payload(row: PreviewRequestTable) -> PreviewDetailPayload:
    raw = dict(row.result_json or {})
    return PreviewDetailPayload.model_validate(raw)


def create_preview(body: PreviewCreateRequest) -> tuple[PreviewDetailResponse, bool]:
    """Create and evaluate one preview request (durable row).

    Returns (response, created) where created is False for idempotent replay.
    """
    t0 = time.perf_counter()
    if body.preview_type != V1_PREVIEW_TYPE:
        raise ValueError(f"Unsupported preview_type for v1 engine: {body.preview_type!r}")

    policy_id = body.target_ids[0].strip()
    if not policy_id:
        raise ValueError("target_ids[0] must be a non-empty policy_id")

    proposed = body.requested_payload.get("proposed_intent_state")
    if not isinstance(proposed, str) or proposed not in ("declared", "unknown"):
        raise ValueError("requested_payload.proposed_intent_state must be 'declared' or 'unknown'")

    if body.idempotency_key:
        with create_session() as session:
            existing = session.scalars(
                select(PreviewRequestTable).where(
                    PreviewRequestTable.idempotency_key == body.idempotency_key.strip()
                )
            ).first()
            if existing is not None:
                payload = _row_to_detail_payload(existing)
                return PreviewDetailResponse(metadata=_metadata(), preview=payload), False

    if body.workflow_id:
        with create_session() as session:
            wf = session.get(WorkflowLifecycleTable, body.workflow_id)
            if wf is None:
                raise LookupError("workflow_not_found")

    caps = build_capabilities_list_response()
    static_support = "unknown"
    for it in caps.items:
        if it.feature == "static_policy_detail":
            static_support = it.support_status
            break

    policies = build_policies_list_response(limit=None)
    pol_items = policies.items
    fp = _truth_fingerprint_from_policies(
        data_status=policies.data_status,
        serving_mode=policies.serving_mode,
        policy_ids=[p.policy_id for p in pol_items],
    )

    decision, reason, source, truth = _evaluate_v1(
        policy_id=policy_id,
        proposed_raw=proposed,
        policies_items=pol_items,
        policies_data_status=policies.data_status,
        policies_serving_mode=policies.serving_mode,
        evidence_confidence=policies.evidence_confidence,
        static_detail_support=static_support,
    )

    preview_status = _decision_to_preview_status(decision)
    pid = str(uuid4())
    matched = _find_policy(pol_items, policy_id)
    diff = _build_diff(
        preview_id=pid,
        before_intent=matched.intent_state if matched is not None else "unknown",
        after_intent=proposed,
        decision=decision,
    )
    if decision != "allowed":
        diff = None

    payload = PreviewDetailPayload(
        contract_id=PREVIEW_ENGINE_V1_CONTRACT_ID,
        preview_id=pid,
        workflow_id=body.workflow_id,
        preview_type=body.preview_type,
        target_kind=body.target_kind,
        target_ids=body.target_ids,
        requested_action_type=body.requested_action_type,
        requested_payload=dict(body.requested_payload),
        created_at=_utcnow(),
        created_by_actor_type=body.actor_type,
        created_by_actor_id=body.actor_id,
        created_by_actor_display_name=body.actor_display_name,
        preview_status=preview_status,
        capability_decision_state=decision,
        capability_decision_reason=reason,
        capability_decision_source=source,
        truth_scope_summary=truth,
        truth_fingerprint=fp,
        stale_posture="current",
        notes=body.notes,
        linkage_hints=PreviewLinkageHints(),
        diff=diff,
        safety_framing=PreviewSafetyFraming(),
    )

    duration_ms = (time.perf_counter() - t0) * 1000.0
    with create_session() as session:
        row = PreviewRequestTable(
            id=pid,
            workflow_id=body.workflow_id,
            idempotency_key=body.idempotency_key.strip() if body.idempotency_key else None,
            preview_type=body.preview_type,
            target_kind=body.target_kind,
            target_ids=list(body.target_ids),
            target_scope=body.target_scope,
            requested_action_type=body.requested_action_type,
            requested_payload=dict(body.requested_payload),
            created_at=payload.created_at,
            created_by_actor_type=body.actor_type,
            created_by_actor_id=body.actor_id,
            created_by_actor_display_name=body.actor_display_name,
            preview_status=payload.preview_status,
            capability_decision_state=payload.capability_decision_state,
            capability_decision_reason=payload.capability_decision_reason,
            capability_decision_source=payload.capability_decision_source,
            truth_scope_summary=payload.truth_scope_summary.model_dump(mode="json"),
            truth_fingerprint=fp,
            notes=body.notes,
            extension_hints={
                "validation_result_ids": [],
                "execution_reference": None,
            },
            result_json=payload.model_dump(mode="json"),
            processing_duration_ms=duration_ms,
        )
        session.add(row)

        ev_req = PreviewEventTable(
            id=str(uuid4()),
            preview_id=pid,
            event_type="preview_requested",
            occurred_at=payload.created_at,
            actor=body.actor_id,
            reason=None,
            event_metadata={"preview_type": body.preview_type},
            provenance="api",
        )
        ev_cap = PreviewEventTable(
            id=str(uuid4()),
            preview_id=pid,
            event_type="capability_evaluated",
            occurred_at=_utcnow(),
            actor="preview_engine_v1",
            reason=reason,
            event_metadata={"decision": decision, "source": source},
            provenance="system",
        )
        ev_done = PreviewEventTable(
            id=str(uuid4()),
            preview_id=pid,
            event_type=(
                "preview_generated"
                if decision == "allowed"
                else (
                    "preview_blocked"
                    if decision == "blocked"
                    else (
                        "preview_unsupported"
                        if decision == "unsupported"
                        else "preview_unknown"
                    )
                )
            ),
            occurred_at=_utcnow(),
            actor="preview_engine_v1",
            reason=reason,
            event_metadata={"preview_status": preview_status},
            provenance="system",
        )
        session.add(ev_req)
        session.add(ev_cap)
        session.add(ev_done)
        try:
            session.commit()
        except IntegrityError as exc:
            session.rollback()
            raise ValueError("idempotency_key_conflict") from exc

    record_preview_outcome(
        preview_type=body.preview_type,
        decision=decision,
        preview_status=preview_status,
        duration_seconds=time.perf_counter() - t0,
    )

    return (
        PreviewDetailResponse(
            metadata=_metadata(),
            preview=payload,
        ),
        True,
    )


def get_preview(preview_id: str) -> PreviewDetailResponse | None:
    with create_session() as session:
        row = session.get(PreviewRequestTable, preview_id)
        if row is None:
            return None
        payload = _row_to_detail_payload(row)
        # Staleness: recompute fingerprint from live policies list
        policies = build_policies_list_response(limit=None)
        cur_fp = _truth_fingerprint_from_policies(
            data_status=policies.data_status,
            serving_mode=policies.serving_mode,
            policy_ids=[p.policy_id for p in policies.items],
        )
        stale = "current" if cur_fp == (row.truth_fingerprint or "") else "truth_changed"
        payload = payload.model_copy(
            update={
                "stale_posture": stale,
            }
        )
        return PreviewDetailResponse(metadata=_metadata(), preview=payload)


def get_preview_diff(preview_id: str) -> PreviewDiffResponse | None:
    got = get_preview(preview_id)
    if got is None:
        return None
    policies = build_policies_list_response(limit=None)
    cur_fp = _truth_fingerprint_from_policies(
        data_status=policies.data_status,
        serving_mode=policies.serving_mode,
        policy_ids=[p.policy_id for p in policies.items],
    )
    row_fp = got.preview.truth_fingerprint
    stale = "current" if cur_fp == (row_fp or "") else "truth_changed"
    return PreviewDiffResponse(
        metadata=_metadata(),
        preview_id=preview_id,
        stale_posture=stale,
        truth_fingerprint=row_fp,
        current_truth_fingerprint=cur_fp,
        diff=got.preview.diff,
        capability_decision_state=got.preview.capability_decision_state,
        capability_decision_reason=got.preview.capability_decision_reason,
        safety_framing=got.preview.safety_framing,
    )


def list_previews(*, limit: int = 50) -> PreviewListResponse:
    cap = max(1, min(limit, 100))
    with create_session() as session:
        rows = session.scalars(
            select(PreviewRequestTable).order_by(desc(PreviewRequestTable.created_at)).limit(cap)
        ).all()
        items = [
            PreviewListItem(
                preview_id=r.id,
                preview_type=r.preview_type,
                preview_status=r.preview_status,  # type: ignore[arg-type]
                capability_decision_state=r.capability_decision_state,  # type: ignore[arg-type]
                capability_decision_reason=r.capability_decision_reason,
                workflow_id=r.workflow_id,
                created_at=r.created_at,
                target_kind=r.target_kind,
                target_ids=[str(x) for x in (r.target_ids or [])],
            )
            for r in rows
        ]
    return PreviewListResponse(
        metadata=_metadata(),
        contract_id=PREVIEW_ENGINE_V1_CONTRACT_ID,
        items=items,
    )


def get_preview_timeline(preview_id: str) -> PreviewTimelineResponse | None:
    with create_session() as session:
        row = session.get(PreviewRequestTable, preview_id)
        if row is None:
            return None
        ev_rows = session.scalars(
            select(PreviewEventTable)
            .where(PreviewEventTable.preview_id == preview_id)
            .order_by(PreviewEventTable.occurred_at)
        ).all()
        events = [
            PreviewEventItem(
                event_id=e.id,
                preview_id=e.preview_id,
                event_type=e.event_type,
                occurred_at=e.occurred_at,
                actor=e.actor,
                reason=e.reason,
                metadata=dict(e.event_metadata or {}),
                provenance=e.provenance
                if e.provenance in ("system", "operator", "api")
                else "api",
            )
            for e in ev_rows
        ]
    return PreviewTimelineResponse(
        metadata=_metadata(),
        contract_id=PREVIEW_ENGINE_V1_CONTRACT_ID,
        preview_id=preview_id,
        events=events,
    )
