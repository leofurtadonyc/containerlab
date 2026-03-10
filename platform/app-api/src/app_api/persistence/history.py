"""Persistence helpers for bounded workflow and audit history reads."""

from collections import Counter, defaultdict
from datetime import datetime
from logging import getLogger

from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app_api.persistence.session import create_session
from app_api.persistence.tables import (
    PolicyCandidatePathTable,
    PolicyRecordTable,
    PolicySnapshotTable,
    SyncRunTable,
)

logger = getLogger(__name__)


class PersistedSyncRun(BaseModel):
    """Bounded sync-run history record recovered from Postgres."""

    sync_run_id: str
    model_family: str
    source_type: str
    source_endpoint: str
    fetch_status: str
    record_count: int
    observed_at: datetime | None = None
    started_at: datetime
    finished_at: datetime
    persisted_artifacts: list[str] = Field(default_factory=list)
    policy_snapshot_summary: "PersistedPolicySnapshotSummary | None" = None
    policy_comparison_to_previous: "PersistedPolicySnapshotComparison | None" = None
    notes: list[str] = Field(default_factory=list)


class PersistedPolicySnapshotSummary(BaseModel):
    """Bounded persisted policy snapshot context for history surfaces."""

    persisted_at: datetime
    observed_at: datetime | None = None
    sync_source: str
    sync_status: str
    completeness: str
    detail_mode: str
    empty_reason: str
    observed_policy_count: int
    active_policy_count: int
    detail_record_count: int


class PersistedPolicySnapshotComparison(BaseModel):
    """Bounded current-versus-previous comparison for one persisted policy snapshot."""

    current_persisted_at: datetime
    previous_persisted_at: datetime
    current_observed_policy_count: int
    previous_observed_policy_count: int
    current_detail_record_count: int
    previous_detail_record_count: int
    observed_policy_delta: int
    detail_record_delta: int
    added_policy_count: int
    removed_policy_count: int
    changed_policy_count: int
    notes: list[str] = Field(default_factory=list)


class SyncRunHistorySummary(BaseModel):
    """Bounded summary of persisted sync-run history for observability."""

    total_count: int = 0
    counts_by_model_family: dict[str, int] = Field(default_factory=dict)
    counts_by_result: dict[str, int] = Field(default_factory=dict)
    counts_by_model_family_and_result: dict[str, dict[str, int]] = Field(
        default_factory=dict
    )
    latest_finished_at_by_model_family: dict[str, datetime] = Field(
        default_factory=dict
    )


def _map_history_result(fetch_status: str) -> str:
    """Map raw sync-run fetch status into a low-cardinality history result."""
    return {
        "live_normalized_feed": "completed",
        "partial_live_feed": "partial",
        "collector_unavailable": "failed",
    }.get(fetch_status, "unknown")


def _load_policy_snapshot_record_signatures(
    session,
    *,
    snapshot_id: str,
) -> dict[str, tuple[object, ...]]:
    """Load bounded normalized signatures for one persisted policy snapshot."""
    policy_rows = session.scalars(
        select(PolicyRecordTable)
        .where(PolicyRecordTable.snapshot_id == snapshot_id)
        .order_by(PolicyRecordTable.policy_id.asc())
    ).all()
    if not policy_rows:
        return {}
    policy_record_ids = [row.id for row in policy_rows]
    candidate_rows = session.scalars(
        select(PolicyCandidatePathTable)
        .where(PolicyCandidatePathTable.policy_record_id.in_(policy_record_ids))
        .order_by(
            PolicyCandidatePathTable.policy_record_id.asc(),
            PolicyCandidatePathTable.preference.desc().nullslast(),
            PolicyCandidatePathTable.name.asc(),
        )
    ).all()
    candidates_by_policy_record_id: dict[int, list[PolicyCandidatePathTable]] = {}
    for row in candidate_rows:
        candidates_by_policy_record_id.setdefault(row.policy_record_id, []).append(row)
    signatures: dict[str, tuple[object, ...]] = {}
    for row in policy_rows:
        signatures[row.policy_id] = (
            row.policy_name,
            row.policy_type,
            row.headend,
            row.endpoint,
            row.color,
            row.source_target,
            row.source_target_role,
            row.intent_state,
            row.observed_state,
            row.support_state,
            row.health_state,
            tuple(
                (
                    candidate.name,
                    candidate.path_state,
                    candidate.preference,
                    tuple(candidate.notes),
                )
                for candidate in candidates_by_policy_record_id.get(row.id, [])
            ),
        )
    return signatures


def _build_policy_snapshot_summary(
    session,
    *,
    snapshot: PolicySnapshotTable,
) -> PersistedPolicySnapshotSummary:
    """Build bounded persisted policy snapshot context for one sync run."""
    detail_record_count = session.scalar(
        select(func.count(PolicyRecordTable.id)).where(PolicyRecordTable.snapshot_id == snapshot.id)
    )
    return PersistedPolicySnapshotSummary(
        persisted_at=snapshot.persisted_at,
        observed_at=snapshot.observed_at,
        sync_source=snapshot.sync_source,
        sync_status=snapshot.sync_status,
        completeness=snapshot.completeness,
        detail_mode=snapshot.detail_mode,
        empty_reason=snapshot.empty_reason,
        observed_policy_count=snapshot.observed_policy_count,
        active_policy_count=snapshot.active_policy_count,
        detail_record_count=int(detail_record_count or 0),
    )


def _build_policy_snapshot_comparison(
    session,
    *,
    snapshot: PolicySnapshotTable,
) -> PersistedPolicySnapshotComparison | None:
    """Build bounded comparison evidence against the immediately previous snapshot."""
    previous_snapshot = session.scalar(
        select(PolicySnapshotTable)
        .where(PolicySnapshotTable.persisted_at < snapshot.persisted_at)
        .order_by(PolicySnapshotTable.persisted_at.desc())
        .limit(1)
    )
    if previous_snapshot is None:
        return None
    current_signatures = _load_policy_snapshot_record_signatures(session, snapshot_id=snapshot.id)
    previous_signatures = _load_policy_snapshot_record_signatures(
        session, snapshot_id=previous_snapshot.id
    )
    current_policy_ids = set(current_signatures)
    previous_policy_ids = set(previous_signatures)
    added_policy_ids = current_policy_ids - previous_policy_ids
    removed_policy_ids = previous_policy_ids - current_policy_ids
    changed_policy_ids = {
        policy_id
        for policy_id in current_policy_ids & previous_policy_ids
        if current_signatures[policy_id] != previous_signatures[policy_id]
    }
    current_detail_record_count = len(current_signatures)
    previous_detail_record_count = len(previous_signatures)
    notes = [
        "This comparison is derived from the current persisted normalized policy snapshot and the immediately previous persisted normalized policy snapshot.",
        "Added, removed, and changed counts only reflect policies that have bounded normalized detail records in those snapshots.",
    ]
    if (
        snapshot.observed_policy_count > current_detail_record_count
        or previous_snapshot.observed_policy_count > previous_detail_record_count
    ):
        notes.append(
            "Observed policy totals may be higher than detailed record totals when the bounded read path cannot derive per-policy detail for every observed policy type."
        )
    return PersistedPolicySnapshotComparison(
        current_persisted_at=snapshot.persisted_at,
        previous_persisted_at=previous_snapshot.persisted_at,
        current_observed_policy_count=snapshot.observed_policy_count,
        previous_observed_policy_count=previous_snapshot.observed_policy_count,
        current_detail_record_count=current_detail_record_count,
        previous_detail_record_count=previous_detail_record_count,
        observed_policy_delta=snapshot.observed_policy_count - previous_snapshot.observed_policy_count,
        detail_record_delta=current_detail_record_count - previous_detail_record_count,
        added_policy_count=len(added_policy_ids),
        removed_policy_count=len(removed_policy_ids),
        changed_policy_count=len(changed_policy_ids),
        notes=notes,
    )


def load_sync_runs(limit: int = 50) -> list[PersistedSyncRun]:
    """Load recent persisted sync runs for read-only history endpoints."""
    try:
        with create_session() as session:
            rows = session.scalars(
                select(SyncRunTable)
                .options(
                    selectinload(SyncRunTable.inventory_snapshot),
                    selectinload(SyncRunTable.topology_snapshot),
                    selectinload(SyncRunTable.policy_snapshot),
                )
                .order_by(SyncRunTable.finished_at.desc())
                .limit(limit)
            ).all()
            items: list[PersistedSyncRun] = []
            for row in rows:
                persisted_artifacts: list[str] = []
                if row.inventory_snapshot is not None:
                    persisted_artifacts.append("inventory_snapshot")
                if row.topology_snapshot is not None:
                    persisted_artifacts.append("topology_snapshot")
                if row.policy_snapshot is not None:
                    persisted_artifacts.append("policy_snapshot")
                policy_snapshot_summary = None
                policy_comparison_to_previous = None
                if row.policy_snapshot is not None:
                    policy_snapshot_summary = _build_policy_snapshot_summary(
                        session, snapshot=row.policy_snapshot
                    )
                    policy_comparison_to_previous = _build_policy_snapshot_comparison(
                        session, snapshot=row.policy_snapshot
                    )
                items.append(
                    PersistedSyncRun(
                        sync_run_id=row.id,
                        model_family=row.model_family,
                        source_type=row.source_type,
                        source_endpoint=row.source_endpoint,
                        fetch_status=row.fetch_status,
                        record_count=row.record_count,
                        observed_at=row.observed_at,
                        started_at=row.started_at,
                        finished_at=row.finished_at,
                        persisted_artifacts=persisted_artifacts,
                        policy_snapshot_summary=policy_snapshot_summary,
                        policy_comparison_to_previous=policy_comparison_to_previous,
                        notes=row.notes,
                    )
                )
            return items
    except Exception:
        logger.exception("Failed to load bounded sync-run history.")
        return []


def summarize_sync_run_history(limit: int = 200) -> SyncRunHistorySummary:
    """Summarize persisted sync-run history for metrics and dashboards."""
    sync_runs = load_sync_runs(limit=limit)
    counts_by_model_family: Counter[str] = Counter()
    counts_by_result: Counter[str] = Counter()
    counts_by_model_family_and_result: dict[str, Counter[str]] = defaultdict(Counter)
    latest_finished_at_by_model_family: dict[str, datetime] = {}

    for sync_run in sync_runs:
        result = _map_history_result(sync_run.fetch_status)
        counts_by_model_family[sync_run.model_family] += 1
        counts_by_result[result] += 1
        counts_by_model_family_and_result[sync_run.model_family][result] += 1
        current_latest = latest_finished_at_by_model_family.get(sync_run.model_family)
        if current_latest is None or sync_run.finished_at > current_latest:
            latest_finished_at_by_model_family[sync_run.model_family] = sync_run.finished_at

    return SyncRunHistorySummary(
        total_count=len(sync_runs),
        counts_by_model_family=dict(counts_by_model_family),
        counts_by_result=dict(counts_by_result),
        counts_by_model_family_and_result={
            model_family: dict(result_counts)
            for model_family, result_counts in counts_by_model_family_and_result.items()
        },
        latest_finished_at_by_model_family=latest_finished_at_by_model_family,
    )
