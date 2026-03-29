"""Safe action workflows v1 API (bounded execution; not preview/validation)."""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from app_api.schemas.safe_actions import (
    SafeActionApproveRequest,
    SafeActionCancelRequest,
    SafeActionCreateRequest,
    SafeActionDetailResponse,
    SafeActionExecuteRequest,
    SafeActionListResponse,
    SafeActionRejectRequest,
    SafeActionTimelineResponse,
)
from app_api.services import safe_actions as safe_actions_service

router = APIRouter(prefix="/actions", tags=["safe-actions"])


@router.get("", response_model=SafeActionListResponse)
def list_actions(limit: int = Query(default=50, ge=1, le=100)) -> SafeActionListResponse:
    """List durable safe action records (newest first)."""
    return safe_actions_service.list_safe_actions(limit=limit)


@router.post("", response_model=SafeActionDetailResponse)
def create_action(body: SafeActionCreateRequest) -> JSONResponse:
    """Create a safe action request (prerequisite enforcement at create)."""
    result, created = safe_actions_service.create_safe_action(body)
    return JSONResponse(content=result.model_dump(mode="json"), status_code=201 if created else 200)


@router.get("/{action_id}", response_model=SafeActionDetailResponse)
def get_action(action_id: str) -> SafeActionDetailResponse:
    got = safe_actions_service.get_safe_action(action_id)
    if got is None:
        raise HTTPException(status_code=404, detail="action_not_found")
    return got


@router.get("/{action_id}/timeline", response_model=SafeActionTimelineResponse)
def get_action_timeline(action_id: str) -> SafeActionTimelineResponse:
    got = safe_actions_service.get_safe_action_timeline(action_id)
    if got is None:
        raise HTTPException(status_code=404, detail="action_not_found")
    return got


@router.post("/{action_id}/approve", response_model=SafeActionDetailResponse)
def approve_action(action_id: str, body: SafeActionApproveRequest) -> SafeActionDetailResponse:
    try:
        got = safe_actions_service.approve_safe_action(action_id, body)
    except ValueError as exc:
        code = str(exc)
        if code == "action_not_approvable":
            raise HTTPException(status_code=409, detail=code) from exc
        if code in ("invalid_execution_state", "approval_not_pending"):
            raise HTTPException(status_code=409, detail=code) from exc
        raise
    if got is None:
        raise HTTPException(status_code=404, detail="action_not_found")
    return got


@router.post("/{action_id}/reject", response_model=SafeActionDetailResponse)
def reject_action(action_id: str, body: SafeActionRejectRequest) -> SafeActionDetailResponse:
    try:
        got = safe_actions_service.reject_safe_action(action_id, body)
    except ValueError as exc:
        if str(exc) == "invalid_execution_state":
            raise HTTPException(status_code=409, detail=str(exc)) from exc
        raise
    if got is None:
        raise HTTPException(status_code=404, detail="action_not_found")
    return got


@router.post("/{action_id}/execute", response_model=SafeActionDetailResponse)
def execute_action(action_id: str, body: SafeActionExecuteRequest) -> SafeActionDetailResponse:
    try:
        got = safe_actions_service.execute_safe_action(action_id, body)
    except ValueError as exc:
        code = str(exc)
        if code == "not_ready_to_execute":
            raise HTTPException(status_code=409, detail=code) from exc
        if code in ("workflow_not_found", "workflow_not_approved"):
            raise HTTPException(status_code=409, detail=code) from exc
        raise
    if got is None:
        raise HTTPException(status_code=404, detail="action_not_found")
    return got


@router.post("/{action_id}/cancel", response_model=SafeActionDetailResponse)
def cancel_action(action_id: str, body: SafeActionCancelRequest) -> SafeActionDetailResponse:
    try:
        got = safe_actions_service.cancel_safe_action(action_id, body)
    except ValueError as exc:
        if str(exc) == "invalid_execution_state":
            raise HTTPException(status_code=409, detail=str(exc)) from exc
        raise
    if got is None:
        raise HTTPException(status_code=404, detail="action_not_found")
    return got
