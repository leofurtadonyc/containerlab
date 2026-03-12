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


class AuditInventorySnapshotSummary(BaseModel):
    """Bounded persisted inventory snapshot context attached to an audit event."""

    persisted_at: datetime
    observed_at: datetime | None = None
    sync_source: str
    sync_status: str
    data_status: str
    device_count: int
    role_counts: dict[str, int] = Field(default_factory=dict)
    collector_status_counts: dict[str, int] = Field(default_factory=dict)
    capability_summary_counts: dict[str, int] = Field(default_factory=dict)


class AuditInventorySnapshotComparison(BaseModel):
    """Bounded current-versus-previous inventory snapshot comparison evidence."""

    current_persisted_at: datetime
    previous_persisted_at: datetime
    current_device_count: int
    previous_device_count: int
    device_count_delta: int
    added_device_count: int
    removed_device_count: int
    changed_device_count: int
    notes: list[str] = Field(default_factory=list)


class AuditTopologySnapshotSummary(BaseModel):
    """Bounded persisted topology snapshot context attached to an audit event."""

    persisted_at: datetime
    observed_at: datetime | None = None
    topology_name: str
    sync_source: str
    sync_status: str
    completeness: str
    node_count: int
    link_count: int
    node_state_counts: dict[str, int] = Field(default_factory=dict)
    link_state_counts: dict[str, int] = Field(default_factory=dict)


class AuditTopologySnapshotComparison(BaseModel):
    """Bounded current-versus-previous topology snapshot comparison evidence."""

    current_persisted_at: datetime
    previous_persisted_at: datetime
    current_node_count: int
    previous_node_count: int
    current_link_count: int
    previous_link_count: int
    node_count_delta: int
    link_count_delta: int
    added_node_count: int
    removed_node_count: int
    changed_node_count: int
    added_link_count: int
    removed_link_count: int
    changed_link_count: int
    notes: list[str] = Field(default_factory=list)


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
    inventory_snapshot_summary: AuditInventorySnapshotSummary | None = None
    inventory_comparison_to_previous: AuditInventorySnapshotComparison | None = None
    topology_snapshot_summary: AuditTopologySnapshotSummary | None = None
    topology_comparison_to_previous: AuditTopologySnapshotComparison | None = None
    policy_snapshot_summary: AuditPolicySnapshotSummary | None = None
    policy_comparison_to_previous: AuditPolicySnapshotComparison | None = None
    notes: list[str] = Field(default_factory=list)
