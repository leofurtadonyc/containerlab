"""Typed schemas for bounded audit-style history responses."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app_api.schemas.common import ApiResponseMetadata


class AuditHistoryItem(BaseModel):
    """Bounded audit-style history item."""

    event_id: str
    event_type: Literal["read_side_sync_recorded"]
    source: Literal["app-api"]
    actor: Literal["platform_system"]
    target_scope: str
    result: Literal["succeeded", "failed", "partial", "unknown"]
    correlation_id: str
    occurred_at: datetime
    message: str
    notes: list[str]


class AuditHistoryResponse(ApiResponseMetadata):
    """Read-only audit-style history response."""

    data_status: Literal["persisted_activity_history", "empty"]
    summary: str
    count: int
    items: list[AuditHistoryItem]
