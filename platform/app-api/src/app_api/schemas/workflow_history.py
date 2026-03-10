"""Typed schemas for bounded workflow-style history responses."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app_api.schemas.common import ApiResponseMetadata


class WorkflowHistoryItem(BaseModel):
    """Bounded workflow-style history item."""

    workflow_id: str
    workflow_type: Literal["read_side_sync"]
    workflow_name: str
    scope: str
    status: Literal["completed", "partial", "failed", "unknown"]
    source_type: str
    source_endpoint: str
    record_count: int
    observed_at: datetime | None = None
    started_at: datetime
    finished_at: datetime
    persisted_artifacts: list[str]
    notes: list[str]


class WorkflowHistoryResponse(ApiResponseMetadata):
    """Read-only workflow-style history response."""

    data_status: Literal["persisted_activity_history", "empty"]
    summary: str
    count: int
    items: list[WorkflowHistoryItem]
