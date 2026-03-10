"""Persistence helpers for bounded workflow and audit history reads."""

from collections import Counter, defaultdict
from datetime import datetime
from logging import getLogger

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app_api.persistence.session import create_session
from app_api.persistence.tables import SyncRunTable

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


def load_sync_runs(limit: int = 50) -> list[PersistedSyncRun]:
    """Load recent persisted sync runs for read-only history endpoints."""
    try:
        with create_session() as session:
            rows = session.scalars(
                select(SyncRunTable)
                .options(
                    selectinload(SyncRunTable.inventory_snapshot),
                    selectinload(SyncRunTable.topology_snapshot),
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
