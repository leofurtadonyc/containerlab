"""Backend-owned internal models for bounded workflow-style history."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class WorkflowHistoryRecord(BaseModel):
    """Bounded read-only workflow-style history record."""

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
    persisted_artifacts: list[str] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)
