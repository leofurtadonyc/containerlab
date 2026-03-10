"""Persistence helpers for bounded workflow and audit history reads."""

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
