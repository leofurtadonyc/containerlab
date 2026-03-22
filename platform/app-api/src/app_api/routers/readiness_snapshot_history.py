"""Readiness snapshot history API (bounded query surfaces)."""

from fastapi import APIRouter, Depends, Query

from app_api.dependencies.read_side_query import (
    read_side_readiness_blocker_name_filter,
    read_side_readiness_snapshot_list_limit,
)
from app_api.schemas.readiness_snapshot_history import ReadinessSnapshotHistoryResponse
from app_api.services.readiness_snapshot_history import (
    build_readiness_snapshot_history_response,
)

router = APIRouter(tags=["readiness-snapshot-history"])


@router.get("/readiness-snapshot-history", response_model=ReadinessSnapshotHistoryResponse)
def list_readiness_snapshot_history(
    limit: int | None = Depends(read_side_readiness_snapshot_list_limit),
    blocker: str | None = Depends(read_side_readiness_blocker_name_filter),
    include_blockers_detail: bool = Query(
        False,
        description=(
            "When true, include full JSON-derived blocker objects for each snapshot "
            "(bounded inspection only; not workflow execution)."
        ),
    ),
) -> ReadinessSnapshotHistoryResponse:
    """Return persisted bounded readiness-support snapshots with optional blocker filter."""
    return build_readiness_snapshot_history_response(
        limit_requested=limit,
        blocker_filter=blocker,
        include_blockers_detail=include_blockers_detail,
    )
