"""Readiness snapshot history list (bounded query surfaces)."""

from datetime import UTC, datetime
from typing import Literal

from app_api.config.settings import get_settings
from app_api.persistence.history import (
    count_readiness_snapshots_matching,
    load_readiness_snapshot_history,
)
from app_api.schemas.capabilities import DryRunReadinessBlocker
from app_api.schemas.read_side_query import (
    READ_SIDE_READINESS_SNAPSHOT_HISTORY_DEFAULT,
    READ_SIDE_READINESS_SNAPSHOT_HISTORY_MAX,
    build_read_side_query_echo,
)
from app_api.schemas.readiness_snapshot_history import (
    ReadinessSnapshotHistoryItem,
    ReadinessSnapshotHistoryResponse,
)


def build_readiness_snapshot_history_response(
    *,
    limit_requested: int | None,
    blocker_filter: str | None,
    include_blockers_detail: bool,
) -> ReadinessSnapshotHistoryResponse:
    """Return persisted readiness snapshots with bounded read-side query echo."""
    settings = get_settings()
    generated_at = datetime.now(UTC)

    effective_limit = (
        limit_requested
        if limit_requested is not None
        else READ_SIDE_READINESS_SNAPSHOT_HISTORY_DEFAULT
    )
    effective_limit = min(effective_limit, READ_SIDE_READINESS_SNAPSHOT_HISTORY_MAX)

    items_total = count_readiness_snapshots_matching(blocker_filter=blocker_filter)
    rows = load_readiness_snapshot_history(
        effective_limit,
        blocker_filter=blocker_filter,
        include_blockers_json=include_blockers_detail,
    )

    items: list[ReadinessSnapshotHistoryItem] = []
    for row in rows:
        blockers_detail: list[DryRunReadinessBlocker] | None = None
        if include_blockers_detail and row.blockers_json:
            blockers_detail = []
            for raw in row.blockers_json:
                try:
                    blockers_detail.append(DryRunReadinessBlocker.model_validate(raw))
                except Exception:
                    continue
        items.append(
            ReadinessSnapshotHistoryItem(
                snapshot_id=row.snapshot_id,
                persisted_at=row.persisted_at,
                readiness_status=row.readiness_status,
                planning_readiness=row.planning_readiness,
                phase_recommendation=row.phase_recommendation,
                summary=row.summary,
                blocker_count=row.blocker_count,
                strongest_blockers=row.strongest_blockers,
                blockers_detail=blockers_detail,
            )
        )

    if items_total == 0:
        summary = (
            "No persisted readiness-support snapshots exist yet in this workspace—"
            "readiness evaluation still runs, but nothing durable is available to list."
        )
        data_status: Literal["empty", "bounded_history"] = "empty"
    else:
        summary = (
            "Bounded persisted readiness-support snapshot history for operator review. "
            "This remains planning-support evidence, not workflow execution or dry-run output."
        )
        data_status = "bounded_history"

    return ReadinessSnapshotHistoryResponse(
        service="app-api",
        version=settings.app_version,
        phase="phase_2_read_only_foundation",
        generated_at=generated_at,
        data_status=data_status,
        summary=summary,
        count=len(items),
        read_side_query=build_read_side_query_echo(
            limit_requested=limit_requested,
            items_total=items_total,
            items_returned=len(items),
            readiness_blocker_filter_requested=blocker_filter,
        ),
        items=items,
    )
