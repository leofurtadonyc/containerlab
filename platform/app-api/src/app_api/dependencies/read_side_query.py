"""FastAPI dependencies for Phase 2 read-side query ergonomics."""

from __future__ import annotations

from fastapi import Query

from app_api.schemas.read_side_query import READ_SIDE_PRIMARY_LIST_LIMIT_MAX


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
