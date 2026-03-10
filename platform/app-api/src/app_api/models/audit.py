"""Backend-owned internal models for bounded audit-style history."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class AuditEventRecord(BaseModel):
    """Bounded read-only audit-style event record."""

    event_id: str
    event_type: Literal["read_side_sync_recorded"]
    source: Literal["app-api"]
    actor: Literal["platform_system"]
    target_scope: str
    result: Literal["succeeded", "failed", "partial", "unknown"]
    correlation_id: str
    occurred_at: datetime
    message: str
    notes: list[str] = Field(default_factory=list)
