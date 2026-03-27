"""Validation engine v1 API routes."""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from app_api.schemas.validation_engine import (
    ValidationCreateRequest,
    ValidationDetailResponse,
    ValidationListResponse,
    ValidationTimelineResponse,
)
from app_api.services import validation_engine as validation_service

router = APIRouter(prefix="/validations", tags=["validations"])


@router.get("", response_model=ValidationListResponse)
def list_validations(limit: int = Query(default=50, ge=1, le=100)) -> ValidationListResponse:
    """List durable validation requests (newest first)."""
    return validation_service.list_validations(limit=limit)


@router.post("", response_model=ValidationDetailResponse)
def create_validation(body: ValidationCreateRequest) -> JSONResponse:
    """Create and evaluate a validation request (v1 bounded scope)."""
    try:
        result, created = validation_service.create_validation(body)
    except ValueError as exc:
        msg = str(exc)
        if msg == "unsupported_validation_type":
            raise HTTPException(
                status_code=422,
                detail={"code": "unsupported_validation_type", "message": msg},
            ) from exc
        if msg == "unsupported_target_kind":
            raise HTTPException(
                status_code=422,
                detail={"code": "unsupported_target_kind", "message": msg},
            ) from exc
        if msg == "policy_validation_requires_single_target_id":
            raise HTTPException(
                status_code=422,
                detail={"code": "invalid_target_ids", "message": msg},
            ) from exc
        if msg == "empty_policy_id":
            raise HTTPException(
                status_code=422,
                detail={"code": "invalid_target_ids", "message": msg},
            ) from exc
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except LookupError as exc:
        if str(exc) == "workflow_not_found":
            raise HTTPException(status_code=404, detail="workflow_not_found") from exc
        if str(exc) == "preview_not_found":
            raise HTTPException(status_code=404, detail="preview_not_found") from exc
        raise
    return JSONResponse(
        content=result.model_dump(mode="json"),
        status_code=201 if created else 200,
    )


@router.get("/{validation_id}", response_model=ValidationDetailResponse)
def get_validation(validation_id: str) -> ValidationDetailResponse:
    """Return one validation with live stale posture when possible."""
    got = validation_service.get_validation(validation_id)
    if got is None:
        raise HTTPException(status_code=404, detail="validation_not_found")
    return got


@router.get("/{validation_id}/timeline", response_model=ValidationTimelineResponse)
def get_validation_timeline(validation_id: str) -> ValidationTimelineResponse:
    """Return ordered validation lifecycle events."""
    got = validation_service.get_validation_timeline(validation_id)
    if got is None:
        raise HTTPException(status_code=404, detail="validation_not_found")
    return got
