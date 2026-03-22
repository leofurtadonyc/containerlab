"""Audit-style history API endpoints."""

from fastapi import APIRouter, Depends

from app_api.dependencies.read_side_query import (
    read_side_primary_list_limit,
    read_side_readiness_snapshot_history_limit,
    read_side_sync_runs_limit,
)
from app_api.schemas.audit_history import AuditHistoryResponse
from app_api.services.audit_history import build_audit_history_response

router = APIRouter(tags=["audit-history"])


@router.get("/audit-history", response_model=AuditHistoryResponse)
def list_audit_history(
    limit: int | None = Depends(read_side_primary_list_limit),
    sync_runs_limit: int | None = Depends(read_side_sync_runs_limit),
    readiness_snapshot_history_limit: int | None = Depends(
        read_side_readiness_snapshot_history_limit
    ),
) -> AuditHistoryResponse:
    """Return bounded platform-recorded audit-style sync history."""
    return build_audit_history_response(
        limit=limit,
        sync_runs_limit=sync_runs_limit,
        readiness_snapshot_history_limit=readiness_snapshot_history_limit,
    )
