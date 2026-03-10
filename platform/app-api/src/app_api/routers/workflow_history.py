"""Workflow-style history API endpoints."""

from fastapi import APIRouter

from app_api.schemas.workflow_history import WorkflowHistoryResponse
from app_api.services.workflow_history import build_workflow_history_response

router = APIRouter(tags=["workflow-history"])


@router.get("/workflow-history", response_model=WorkflowHistoryResponse)
def list_workflow_history() -> WorkflowHistoryResponse:
    """Return bounded platform-side sync activity as workflow-style history."""
    return build_workflow_history_response()
