"""Backend-owned internal models for bounded workflow-style history."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class WorkflowPolicySnapshotSummary(BaseModel):
    """Bounded persisted policy snapshot context attached to a history item."""

    snapshot_id: str
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
    detail_source_readiness_posture: str = "unknown"
    detail_ready_target_count: int = 0
    no_policies_observed_target_count: int = 0
    detail_unavailable_target_count: int = 0
    partial_detail_target_count: int = 0


class WorkflowInventorySnapshotSummary(BaseModel):
    """Bounded persisted inventory snapshot context attached to a history item."""

    snapshot_id: str
    persisted_at: datetime
    observed_at: datetime | None = None
    sync_source: str
    sync_status: str
    data_status: str
    device_count: int
    role_counts: dict[str, int] = Field(default_factory=dict)
    collector_status_counts: dict[str, int] = Field(default_factory=dict)
    capability_summary_counts: dict[str, int] = Field(default_factory=dict)


class WorkflowInventorySnapshotComparison(BaseModel):
    """Bounded current-versus-previous inventory snapshot comparison evidence."""

    current_snapshot_id: str
    previous_snapshot_id: str
    current_persisted_at: datetime
    previous_persisted_at: datetime
    current_device_count: int
    previous_device_count: int
    device_count_delta: int
    added_device_count: int
    removed_device_count: int
    changed_device_count: int
    notes: list[str] = Field(default_factory=list)


class WorkflowTopologySnapshotSummary(BaseModel):
    """Bounded persisted topology snapshot context attached to a history item."""

    snapshot_id: str
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
    inference_posture: str = "unknown"
    endpoint_pairing_posture: str = "unknown"
    collection_posture: str = "unknown"
    node_participation_posture: str = "unknown"
    paired_link_count: int = 0
    single_sided_link_count: int = 0
    linked_node_count: int = 0
    isolated_node_count: int = 0


class WorkflowTopologySnapshotComparison(BaseModel):
    """Bounded current-versus-previous topology snapshot comparison evidence."""

    current_snapshot_id: str
    previous_snapshot_id: str
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
    current_inference_posture: str = "unknown"
    previous_inference_posture: str = "unknown"
    current_endpoint_pairing_posture: str = "unknown"
    previous_endpoint_pairing_posture: str = "unknown"
    current_collection_posture: str = "unknown"
    previous_collection_posture: str = "unknown"
    current_node_participation_posture: str = "unknown"
    previous_node_participation_posture: str = "unknown"
    current_paired_link_count: int = 0
    previous_paired_link_count: int = 0
    current_single_sided_link_count: int = 0
    previous_single_sided_link_count: int = 0
    current_linked_node_count: int = 0
    previous_linked_node_count: int = 0
    current_isolated_node_count: int = 0
    previous_isolated_node_count: int = 0


class WorkflowPolicySnapshotComparison(BaseModel):
    """Bounded current-versus-previous policy snapshot comparison evidence."""

    current_snapshot_id: str
    previous_snapshot_id: str
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
    current_detail_source_readiness_posture: str = "unknown"
    previous_detail_source_readiness_posture: str = "unknown"
    current_detail_ready_target_count: int = 0
    previous_detail_ready_target_count: int = 0
    current_no_policies_observed_target_count: int = 0
    previous_no_policies_observed_target_count: int = 0


class WorkflowHistoryRecord(BaseModel):
    """Bounded read-only workflow-style history record."""

    workflow_id: str
    sync_run_id: str
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
    inventory_snapshot_summary: WorkflowInventorySnapshotSummary | None = None
    inventory_comparison_to_previous: WorkflowInventorySnapshotComparison | None = None
    topology_snapshot_summary: WorkflowTopologySnapshotSummary | None = None
    topology_comparison_to_previous: WorkflowTopologySnapshotComparison | None = None
    policy_snapshot_summary: WorkflowPolicySnapshotSummary | None = None
    policy_comparison_to_previous: WorkflowPolicySnapshotComparison | None = None
    notes: list[str] = Field(default_factory=list)
