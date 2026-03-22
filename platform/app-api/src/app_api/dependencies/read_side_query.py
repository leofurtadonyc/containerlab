"""FastAPI dependencies for Phase 2 read-side query ergonomics."""

from __future__ import annotations

from typing import get_args

from fastapi import HTTPException, Query, status

from app_api.schemas.capabilities import ReadinessBlockerName
from app_api.schemas.read_side_query import (
    READ_SIDE_HISTORY_RECENT_LIMIT_MAX,
    READ_SIDE_PRIMARY_LIST_LIMIT_MAX,
    READ_SIDE_READINESS_SNAPSHOT_HISTORY_MAX,
    READ_SIDE_SYNC_RUNS_LIMIT_MAX,
)


async def read_side_primary_list_limit(
    limit: int | None = Query(
        None,
        ge=1,
        le=READ_SIDE_PRIMARY_LIST_LIMIT_MAX,
        description=(
            "Optional maximum number of rows to return from the endpoint's primary flat "
            f"list (1–{READ_SIDE_PRIMARY_LIST_LIMIT_MAX}). Omitted means return the full list. "
            "Does not change persisted truth, comparison totals, or history windows; "
            "see `read_side_query` in the response for truncation echo."
        ),
    ),
) -> int | None:
    """Optional bounded limit for primary list payloads (devices/policies ``items``)."""
    return limit


async def read_side_sync_runs_limit(
    sync_runs_limit: int | None = Query(
        None,
        ge=1,
        le=READ_SIDE_SYNC_RUNS_LIMIT_MAX,
        description=(
            "Optional maximum number of persisted sync-run rows to load before merge/sort "
            f"(1–{READ_SIDE_SYNC_RUNS_LIMIT_MAX}; default 50). "
            "Does not imply workflow execution semantics; see `read_side_query` in the response."
        ),
    ),
) -> int | None:
    """Optional bounded load for persisted sync-run history rows."""
    return sync_runs_limit


async def read_side_readiness_snapshot_history_limit(
    readiness_snapshot_history_limit: int | None = Query(
        None,
        ge=1,
        le=READ_SIDE_READINESS_SNAPSHOT_HISTORY_MAX,
        description=(
            "Optional maximum number of persisted readiness snapshot rows to load before merge/sort "
            f"(1–{READ_SIDE_READINESS_SNAPSHOT_HISTORY_MAX}; default 20). Audit-history only. "
            "See `read_side_query` in the response."
        ),
    ),
) -> int | None:
    """Optional bounded load for readiness snapshot history rows (audit-history)."""
    return readiness_snapshot_history_limit


async def read_side_readiness_snapshot_list_limit(
    limit: int | None = Query(
        None,
        ge=1,
        le=READ_SIDE_READINESS_SNAPSHOT_HISTORY_MAX,
        description=(
            "Optional maximum number of persisted readiness snapshot rows to return "
            f"(1–{READ_SIDE_READINESS_SNAPSHOT_HISTORY_MAX}; default 20). "
            "See `read_side_query` in the response."
        ),
    ),
) -> int | None:
    """Bounded list limit for readiness-snapshot history endpoint."""
    return limit


async def read_side_readiness_blocker_name_filter(
    blocker: str | None = Query(
        None,
        description=(
            "Optional `ReadinessBlockerName` filter. When set, only snapshots whose persisted "
            "JSON `blockers` array includes an entry with this `blocker` value are returned."
        ),
    ),
) -> str | None:
    """Optional bounded blocker filter for readiness snapshot history (closed vocabulary)."""
    if blocker is None:
        return None
    allowed = set(get_args(ReadinessBlockerName))
    if blocker not in allowed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Invalid blocker filter for readiness snapshot history.",
        )
    return blocker


async def read_side_history_recent_limit(
    history_recent_limit: int | None = Query(
        None,
        ge=1,
        le=READ_SIDE_HISTORY_RECENT_LIMIT_MAX,
        description=(
            "Optional maximum number of persisted snapshot **summary** rows to include in "
            f"`history.recent_snapshots` (1–{READ_SIDE_HISTORY_RECENT_LIMIT_MAX}; default 3). "
            "Does not alter latest-vs-previous comparison logic (still the two newest full snapshots). "
            "See `read_side_query` for the effective limit and returned row count."
        ),
    ),
) -> int | None:
    """Optional bounded window for persisted history snapshot summaries."""
    return history_recent_limit
