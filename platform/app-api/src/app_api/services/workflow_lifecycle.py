"""Durable workflow lifecycle persistence (not sync-run history, not actuation)."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import desc, select
from app_api.config.settings import get_settings
from app_api.persistence.session import create_session
from app_api.persistence.tables import WorkflowLifecycleEventTable, WorkflowLifecycleTable
from app_api.schemas.workflow_lifecycle import (
    DEFAULT_WORKFLOW_LIFECYCLE_EXPLICIT_NON_CLAIMS,
    WORKFLOW_LIFECYCLE_RECORD_V1_CONTRACT_ID,
    WorkflowLifecycleCreateRequest,
    WorkflowLifecycleDetailResponse,
    WorkflowLifecycleEventItem,
    WorkflowLifecycleListResponse,
    WorkflowLifecycleRecord,
    WorkflowLifecycleSafetyFraming,
    WorkflowLifecycleTimelineResponse,
    WorkflowLifecycleTransitionRequest,
    WorkflowLifecycleStatus,
)

_TERMINAL_STATUSES: frozenset[str] = frozenset({"succeeded", "failed", "cancelled", "rejected"})

_VALID_STATUSES: frozenset[str] = frozenset(
    {
        "requested",
        "planned",
        "approved",
        "rejected",
        "dry_run_ready",
        "executing",
        "succeeded",
        "failed",
        "cancelled",
    }
)


def _utcnow() -> datetime:
    return datetime.now(UTC)


def _as_status(value: str) -> WorkflowLifecycleStatus:
    if value not in _VALID_STATUSES:
        return "requested"  # defensive; DB should only contain valid
    return value  # type: ignore[return-value]


def _row_to_record(row: WorkflowLifecycleTable) -> WorkflowLifecycleRecord:
    return WorkflowLifecycleRecord(
        contract_id=WORKFLOW_LIFECYCLE_RECORD_V1_CONTRACT_ID,
        workflow_id=row.id,
        workflow_type=row.workflow_type,
        workflow_status=_as_status(row.workflow_status),
        title=row.title,
        description=row.description,
        target_scope=dict(row.target_scope or {}),
        capability_decision=dict(row.capability_decision or {}),
        actor_created=row.actor_created,
        actor_updated=row.actor_updated,
        audit_attachment_hint=dict(row.audit_attachment_hint) if row.audit_attachment_hint else None,
        created_at=row.created_at,
        updated_at=row.updated_at,
        safety_framing=WorkflowLifecycleSafetyFraming(
            explicit_non_claims=list(DEFAULT_WORKFLOW_LIFECYCLE_EXPLICIT_NON_CLAIMS)
        ),
    )


def _event_to_item(row: WorkflowLifecycleEventTable) -> WorkflowLifecycleEventItem:
    prov = row.provenance if row.provenance in ("system", "operator", "api") else "api"
    return WorkflowLifecycleEventItem(
        event_id=row.id,
        workflow_id=row.workflow_id,
        prior_status=_as_status(row.prior_status) if row.prior_status else None,
        next_status=_as_status(row.next_status),
        event_type=row.event_type,
        occurred_at=row.occurred_at,
        actor=row.actor,
        reason=row.reason,
        metadata=dict(row.event_metadata or {}),
        provenance=prov,  # type: ignore[arg-type]
    )


def list_workflow_lifecycles(*, limit: int = 50) -> WorkflowLifecycleListResponse:
    cap = max(1, min(limit, 100))
    settings = get_settings()
    now = _utcnow()
    with create_session() as session:
        rows = session.scalars(
            select(WorkflowLifecycleTable).order_by(desc(WorkflowLifecycleTable.created_at)).limit(cap)
        ).all()
        items = [_row_to_record(r) for r in rows]
    return WorkflowLifecycleListResponse(
        service="app-api",
        version=settings.app_version,
        phase="phase_2_read_only_foundation",
        generated_at=now,
        items=items,
    )


def get_workflow_lifecycle(workflow_id: str) -> WorkflowLifecycleDetailResponse | None:
    with create_session() as session:
        row = session.get(WorkflowLifecycleTable, workflow_id)
        if row is None:
            return None
        return WorkflowLifecycleDetailResponse(workflow=_row_to_record(row))


def get_workflow_timeline(workflow_id: str) -> WorkflowLifecycleTimelineResponse | None:
    settings = get_settings()
    now = _utcnow()
    with create_session() as session:
        wf = session.get(WorkflowLifecycleTable, workflow_id)
        if wf is None:
            return None
        events = session.scalars(
            select(WorkflowLifecycleEventTable)
            .where(WorkflowLifecycleEventTable.workflow_id == workflow_id)
            .order_by(WorkflowLifecycleEventTable.occurred_at, WorkflowLifecycleEventTable.id)
        ).all()
        return WorkflowLifecycleTimelineResponse(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
            workflow_id=workflow_id,
            events=[_event_to_item(e) for e in events],
        )


def create_workflow_lifecycle(body: WorkflowLifecycleCreateRequest) -> WorkflowLifecycleDetailResponse:
    wf_id = str(uuid4())
    now = _utcnow()
    if body.initial_status not in _VALID_STATUSES:
        raise ValueError("invalid initial_status")

    prov = "operator" if body.provenance == "operator" else "api"
    event_id = str(uuid4())

    with create_session() as session:
        row = WorkflowLifecycleTable(
            id=wf_id,
            workflow_type=body.workflow_type.strip(),
            workflow_status=body.initial_status,
            title=body.title.strip(),
            description=body.description.strip() if body.description else None,
            target_scope=dict(body.target_scope or {}),
            capability_decision=dict(body.capability_decision or {}),
            actor_created=body.actor.strip(),
            actor_updated=None,
            audit_attachment_hint=None,
            created_at=now,
            updated_at=now,
        )
        session.add(row)
        ev = WorkflowLifecycleEventTable(
            id=event_id,
            workflow_id=wf_id,
            prior_status=None,
            next_status=body.initial_status,
            event_type="created",
            occurred_at=now,
            actor=body.actor.strip(),
            reason="Workflow lifecycle record created",
            event_metadata={"provenance": prov},
            provenance="system",
        )
        session.add(ev)
        session.commit()
        session.refresh(row)

    got = get_workflow_lifecycle(wf_id)
    assert got is not None
    return got


def transition_workflow_lifecycle(
    workflow_id: str, body: WorkflowLifecycleTransitionRequest
) -> WorkflowLifecycleDetailResponse | None:
    if body.next_status not in _VALID_STATUSES:
        raise ValueError("invalid next_status")

    now = _utcnow()
    event_id = str(uuid4())
    prov = "operator" if body.provenance == "operator" else "api"

    with create_session() as session:
        row = session.get(WorkflowLifecycleTable, workflow_id, with_for_update=True)
        if row is None:
            return None
        prior = row.workflow_status
        if prior in _TERMINAL_STATUSES:
            raise RuntimeError("terminal_status")

        row.workflow_status = body.next_status
        row.actor_updated = body.actor.strip()
        row.updated_at = now

        ev = WorkflowLifecycleEventTable(
            id=event_id,
            workflow_id=workflow_id,
            prior_status=prior,
            next_status=body.next_status,
            event_type="transition",
            occurred_at=now,
            actor=body.actor.strip(),
            reason=body.reason.strip() if body.reason else None,
            event_metadata={**dict(body.metadata or {}), "provenance": prov},
            provenance=prov,
        )
        session.add(ev)
        session.commit()

    got = get_workflow_lifecycle(workflow_id)
    assert got is not None
    return got


