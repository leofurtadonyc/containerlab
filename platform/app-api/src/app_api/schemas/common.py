"""Shared API response schemas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ApiResponseMetadata(BaseModel):
    """Common response metadata for Phase 1 read-only endpoints."""

    service: Literal["app-api"]
    version: str
    phase: Literal["phase_1_skeleton"]
    generated_at: datetime


class ErrorDetail(BaseModel):
    """Structured error detail entry."""

    field: str | None = None
    issue: str


class ErrorResponse(BaseModel):
    """Consistent error response contract for the backend API."""

    code: str
    message: str
    details: list[ErrorDetail] = Field(default_factory=list)
    request_id: str
