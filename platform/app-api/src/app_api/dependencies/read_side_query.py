"""FastAPI dependencies for Phase 2 read-side query ergonomics."""

from __future__ import annotations

from fastapi import Query

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
