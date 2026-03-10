"""Backend-owned internal models for bounded workflow-style history."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class WorkflowPolicySnapshotSummary(BaseModel):
    """Bounded persisted policy snapshot context attached to a history item."""

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


class WorkflowPolicySnapshotComparison(BaseModel):
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
    policy_snapshot_summary: WorkflowPolicySnapshotSummary | None = None
    policy_comparison_to_previous: WorkflowPolicySnapshotComparison | None = None
    notes: list[str] = Field(default_factory=list)
