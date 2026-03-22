"""Bounded read-only readiness snapshot history list API."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.capabilities import DryRunReadinessBlocker
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.read_side_query import ReadSideQueryEcho


class ReadinessSnapshotHistoryItem(BaseModel):
    """One persisted readiness-support snapshot row for operator history navigation."""

    snapshot_id: str
    persisted_at: datetime
    readiness_status: str
    planning_readiness: str
    phase_recommendation: str
    summary: str
    blocker_count: int
    strongest_blockers: list[str] = Field(default_factory=list)
    blockers_detail: list[DryRunReadinessBlocker] | None = Field(
        default=None,
        description=(
            "Included only when `include_blockers_detail=true`; full blocker objects from persistence."
        ),
    )


class ReadinessSnapshotHistoryResponse(ApiResponseMetadata):
    """Read-only list of persisted bounded readiness-support snapshots."""

    data_status: Literal["empty", "bounded_history"]
    summary: str
    count: int
    read_side_query: ReadSideQueryEcho
    items: list[ReadinessSnapshotHistoryItem]
