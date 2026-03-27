"""Durable workflow lifecycle APIs (record management; not network actuation)."""

from fastapi import APIRouter, HTTPException, Query

from app_api.schemas.workflow_lifecycle import (
    WorkflowLifecycleCreateRequest,
    WorkflowLifecycleDetailResponse,
    WorkflowLifecycleListResponse,
    WorkflowLifecycleTimelineResponse,
    WorkflowLifecycleTransitionRequest,
)
from app_api.services import workflow_lifecycle as wl_service

router = APIRouter(prefix="/workflow-lifecycle", tags=["workflow-lifecycle"])


@router.get("", response_model=WorkflowLifecycleListResponse)
def list_workflows(limit: int = Query(default=50, ge=1, le=100)) -> WorkflowLifecycleListResponse:
    """List durable workflow lifecycle records (newest first)."""
    return wl_service.list_workflow_lifecycles(limit=limit)


@router.post("", response_model=WorkflowLifecycleDetailResponse, status_code=201)
def create_workflow(body: WorkflowLifecycleCreateRequest) -> WorkflowLifecycleDetailResponse:
    """Create a workflow lifecycle record (bounded; not actuation)."""
    try:
        return wl_service.create_workflow_lifecycle(body)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/{workflow_id}/timeline", response_model=WorkflowLifecycleTimelineResponse)
def get_timeline(workflow_id: str) -> WorkflowLifecycleTimelineResponse:
    """Return ordered transition history for one workflow."""
    got = wl_service.get_workflow_timeline(workflow_id)
    if got is None:
        raise HTTPException(status_code=404, detail="workflow_not_found")
    return got


@router.get("/{workflow_id}", response_model=WorkflowLifecycleDetailResponse)
def get_workflow(workflow_id: str) -> WorkflowLifecycleDetailResponse:
    """Return one workflow lifecycle record."""
    got = wl_service.get_workflow_lifecycle(workflow_id)
    if got is None:
        raise HTTPException(status_code=404, detail="workflow_not_found")
    return got


@router.post("/{workflow_id}/transitions", response_model=WorkflowLifecycleDetailResponse)
def transition_workflow(
    workflow_id: str, body: WorkflowLifecycleTransitionRequest
) -> WorkflowLifecycleDetailResponse:
    """Record a bounded status transition (not execution)."""
    try:
        got = wl_service.transition_workflow_lifecycle(workflow_id, body)
        if got is None:
            raise HTTPException(status_code=404, detail="workflow_not_found")
        return got
    except RuntimeError as exc:
        if str(exc) == "terminal_status":
            raise HTTPException(
                status_code=409,
                detail="workflow_is_terminal",
            ) from exc
        raise
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
