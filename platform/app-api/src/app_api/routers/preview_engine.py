"""Preview engine APIs (bounded pre-change reasoning; not network actuation)."""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from app_api.schemas.preview_engine import (
    PreviewCreateRequest,
    PreviewDetailResponse,
    PreviewDiffResponse,
    PreviewListResponse,
    PreviewTimelineResponse,
)
from app_api.services import preview_engine as preview_service

router = APIRouter(prefix="/previews", tags=["previews"])


@router.get("", response_model=PreviewListResponse)
def list_previews(limit: int = Query(default=50, ge=1, le=100)) -> PreviewListResponse:
    """List durable preview requests (newest first)."""
    return preview_service.list_previews(limit=limit)


@router.post("", response_model=PreviewDetailResponse)
def create_preview(body: PreviewCreateRequest) -> JSONResponse:
    """Create and evaluate a preview request (v1: static_local intent only)."""
    try:
        result, created = preview_service.create_preview(body)
    except ValueError as exc:
        msg = str(exc)
        if msg == "idempotency_key_conflict":
            raise HTTPException(status_code=409, detail=msg) from exc
        raise HTTPException(status_code=422, detail=msg) from exc
    except LookupError as exc:
        if str(exc) == "workflow_not_found":
            raise HTTPException(status_code=404, detail="workflow_not_found") from exc
        raise
    return JSONResponse(
        content=result.model_dump(mode="json"),
        status_code=201 if created else 200,
    )


@router.get("/{preview_id}", response_model=PreviewDetailResponse)
def get_preview(preview_id: str) -> PreviewDetailResponse:
    """Return one preview with current staleness posture."""
    got = preview_service.get_preview(preview_id)
    if got is None:
        raise HTTPException(status_code=404, detail="preview_not_found")
    return got


@router.get("/{preview_id}/diff", response_model=PreviewDiffResponse)
def get_preview_diff(preview_id: str) -> PreviewDiffResponse:
    """Return diff payload and truth fingerprint comparison."""
    got = preview_service.get_preview_diff(preview_id)
    if got is None:
        raise HTTPException(status_code=404, detail="preview_not_found")
    return got


@router.get("/{preview_id}/timeline", response_model=PreviewTimelineResponse)
def get_preview_timeline(preview_id: str) -> PreviewTimelineResponse:
    """Return ordered preview lifecycle events."""
    got = preview_service.get_preview_timeline(preview_id)
    if got is None:
        raise HTTPException(status_code=404, detail="preview_not_found")
    return got
