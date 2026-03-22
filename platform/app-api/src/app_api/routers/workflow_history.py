"""Workflow-style history API endpoints."""

from fastapi import APIRouter, Depends

from app_api.dependencies.read_side_query import (
    read_side_primary_list_limit,
    read_side_sync_runs_limit,
)
from app_api.schemas.workflow_history import WorkflowHistoryResponse
from app_api.services.workflow_history import build_workflow_history_response

router = APIRouter(tags=["workflow-history"])


@router.get("/workflow-history", response_model=WorkflowHistoryResponse)
def list_workflow_history(
    limit: int | None = Depends(read_side_primary_list_limit),
    sync_runs_limit: int | None = Depends(read_side_sync_runs_limit),
) -> WorkflowHistoryResponse:
    """Return bounded platform-side sync activity as workflow-style history."""
    return build_workflow_history_response(limit=limit, sync_runs_limit=sync_runs_limit)
