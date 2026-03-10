"""Backend-owned internal models for bounded audit-style history."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class AuditPolicySnapshotSummary(BaseModel):
    """Bounded persisted policy snapshot context attached to an audit event."""

    persisted_at: datetime
    observed_at: datetime | None = None
    sync_source: str
    sync_status: str
    completeness: str
    detail_mode: str
    empty_reason: str
    observed_policy_count: int
    active_policy_count: int
    detail_record_count: int


class AuditPolicySnapshotComparison(BaseModel):
    """Bounded current-versus-previous policy snapshot comparison evidence."""

    current_persisted_at: datetime
    previous_persisted_at: datetime
    current_observed_policy_count: int
    previous_observed_policy_count: int
    current_detail_record_count: int
    previous_detail_record_count: int
    observed_policy_delta: int
    detail_record_delta: int
    added_policy_count: int
    removed_policy_count: int
    changed_policy_count: int
    notes: list[str] = Field(default_factory=list)


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
    policy_snapshot_summary: AuditPolicySnapshotSummary | None = None
    policy_comparison_to_previous: AuditPolicySnapshotComparison | None = None
    notes: list[str] = Field(default_factory=list)
