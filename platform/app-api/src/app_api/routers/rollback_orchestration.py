"""Rollback orchestration v1 API (bounded compensation; not device restore)."""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from app_api.schemas.rollback_orchestration import (
    RollbackApproveRequest,
    RollbackCancelRequest,
    RollbackCreateRequest,
    RollbackDetailResponse,
    RollbackExecuteRequest,
    RollbackListResponse,
    RollbackRejectRequest,
    RollbackTimelineResponse,
)
from app_api.services import rollback_orchestration as rollback_service

router = APIRouter(prefix="/rollbacks", tags=["rollback-orchestration"])


@router.get("", response_model=RollbackListResponse)
def list_rollbacks(limit: int = Query(default=50, ge=1, le=100)) -> RollbackListResponse:
    """List durable rollback records (newest first)."""
    return rollback_service.list_rollbacks(limit=limit)


@router.post("", response_model=RollbackDetailResponse)
def create_rollback(body: RollbackCreateRequest) -> JSONResponse:
    """Create a rollback request (prerequisite enforcement at create)."""
    result, created = rollback_service.create_rollback(body)
    return JSONResponse(content=result.model_dump(mode="json"), status_code=201 if created else 200)


@router.get("/{rollback_id}", response_model=RollbackDetailResponse)
def get_rollback(rollback_id: str) -> RollbackDetailResponse:
    got = rollback_service.get_rollback(rollback_id)
    if got is None:
        raise HTTPException(status_code=404, detail="rollback_not_found")
    return got


@router.get("/{rollback_id}/timeline", response_model=RollbackTimelineResponse)
def get_rollback_timeline(rollback_id: str) -> RollbackTimelineResponse:
    got = rollback_service.get_rollback_timeline(rollback_id)
    if got is None:
        raise HTTPException(status_code=404, detail="rollback_not_found")
    return got


@router.post("/{rollback_id}/approve", response_model=RollbackDetailResponse)
def approve_rollback(rollback_id: str, body: RollbackApproveRequest) -> RollbackDetailResponse:
    try:
        got = rollback_service.approve_rollback(rollback_id, body)
    except ValueError as exc:
        code = str(exc)
        if code == "rollback_not_approvable":
            raise HTTPException(status_code=409, detail=code) from exc
        if code in ("invalid_rollback_state", "approval_not_pending"):
            raise HTTPException(status_code=409, detail=code) from exc
        raise
    if got is None:
        raise HTTPException(status_code=404, detail="rollback_not_found")
    return got


@router.post("/{rollback_id}/reject", response_model=RollbackDetailResponse)
def reject_rollback(rollback_id: str, body: RollbackRejectRequest) -> RollbackDetailResponse:
    try:
        got = rollback_service.reject_rollback(rollback_id, body)
    except ValueError as exc:
        if str(exc) == "invalid_rollback_state":
            raise HTTPException(status_code=409, detail=str(exc)) from exc
        raise
    if got is None:
        raise HTTPException(status_code=404, detail="rollback_not_found")
    return got


@router.post("/{rollback_id}/execute", response_model=RollbackDetailResponse)
def execute_rollback(rollback_id: str, body: RollbackExecuteRequest) -> RollbackDetailResponse:
    try:
        got = rollback_service.execute_rollback(rollback_id, body)
    except ValueError as exc:
        code = str(exc)
        if code == "not_ready_to_execute":
            raise HTTPException(status_code=409, detail=code) from exc
        if code in ("workflow_not_found", "workflow_not_approved"):
            raise HTTPException(status_code=409, detail=code) from exc
        raise
    if got is None:
        raise HTTPException(status_code=404, detail="rollback_not_found")
    return got


@router.post("/{rollback_id}/cancel", response_model=RollbackDetailResponse)
def cancel_rollback(rollback_id: str, body: RollbackCancelRequest) -> RollbackDetailResponse:
    try:
        got = rollback_service.cancel_rollback(rollback_id, body)
    except ValueError as exc:
        if str(exc) == "invalid_rollback_state":
            raise HTTPException(status_code=409, detail=str(exc)) from exc
        raise
    if got is None:
        raise HTTPException(status_code=404, detail="rollback_not_found")
    return got
