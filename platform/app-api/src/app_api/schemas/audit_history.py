"""Typed schemas for bounded audit-style history responses."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app_api.schemas.common import ApiResponseMetadata, HistoryBaselineSummary
from app_api.schemas.devices import InventoryHistoryChangePreview


class AuditPolicySnapshotSummary(BaseModel):
    """Bounded persisted policy snapshot context attached to an audit event."""

    snapshot_id: str
    persisted_at: datetime
    observed_at: datetime | None = None
    data_status: str
    sync_source: str
    sync_status: str
    completeness: str
    detail_mode: str
    empty_reason: str
    observed_policy_count: int
    active_policy_count: int
    static_local_policy_count: int = 0
    detail_record_count: int
    detail_source_readiness_posture: str = "unknown"
    detail_ready_target_count: int = 0
    no_policies_observed_target_count: int = 0
    detail_unavailable_target_count: int = 0
    partial_detail_target_count: int = 0


class AuditInventorySnapshotSummary(BaseModel):
    """Bounded persisted inventory snapshot context attached to an audit event."""

    snapshot_id: str
    sync_run_id: str
    persisted_at: datetime
    observed_at: datetime | None = None
    sync_source: str
    sync_status: str
    data_status: str
    source_endpoint: str
    device_count: int
    role_counts: dict[str, int]
    collector_status_counts: dict[str, int]
    capability_summary_counts: dict[str, int]


class AuditInventorySnapshotComparison(BaseModel):
    """Bounded current-versus-previous inventory snapshot comparison evidence."""

    current_snapshot_id: str
    previous_snapshot_id: str
    current_persisted_at: datetime
    previous_persisted_at: datetime
    current_observed_at: datetime | None = None
    previous_observed_at: datetime | None = None
    current_sync_status: str
    previous_sync_status: str
    current_data_status: str
    previous_data_status: str
    current_device_count: int
    previous_device_count: int
    device_count_delta: int
    added_device_count: int
    removed_device_count: int
    changed_device_count: int
    change_preview: list[InventoryHistoryChangePreview]
    notes: list[str]


class AuditTopologySnapshotSummary(BaseModel):
    """Bounded persisted topology snapshot context attached to an audit event."""

    snapshot_id: str
    persisted_at: datetime
    observed_at: datetime | None = None
    topology_name: str
    sync_source: str
    sync_status: str
    completeness: str
    node_count: int
    link_count: int
    node_state_counts: dict[str, int]
    link_state_counts: dict[str, int]
    inference_posture: str = "unknown"
    endpoint_pairing_posture: str = "unknown"
    collection_posture: str = "unknown"
    node_participation_posture: str = "unknown"
    paired_link_count: int = 0
    single_sided_link_count: int = 0
    linked_node_count: int = 0
    isolated_node_count: int = 0


class AuditTopologySnapshotComparison(BaseModel):
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
    notes: list[str]
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


class AuditPolicySnapshotComparison(BaseModel):
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
    notes: list[str]
    current_detail_source_readiness_posture: str = "unknown"
    previous_detail_source_readiness_posture: str = "unknown"
    current_detail_ready_target_count: int = 0
    previous_detail_ready_target_count: int = 0
    current_no_policies_observed_target_count: int = 0
    previous_no_policies_observed_target_count: int = 0
    current_detail_unavailable_target_count: int = 0
    previous_detail_unavailable_target_count: int = 0
    current_partial_detail_target_count: int = 0
    previous_partial_detail_target_count: int = 0
    current_static_local_policy_count: int = 0
    previous_static_local_policy_count: int = 0
    static_local_policy_delta: int = 0
    current_data_status: str
    previous_data_status: str


class AuditReadinessSnapshotSummary(BaseModel):
    """Bounded persisted readiness snapshot context attached to an audit event."""

    snapshot_id: str
    persisted_at: datetime
    readiness_status: str
    planning_readiness: str
    phase_recommendation: str
    summary: str
    blocker_count: int
    strongest_blockers: list[str]


class AuditHistoryItem(BaseModel):
    """Bounded audit-style history item."""

    event_id: str
    event_type: Literal["read_side_sync_recorded", "readiness_snapshot_recorded"]
    source: Literal["app-api"]
    actor: Literal["platform_system"]
    target_scope: str
    result: Literal["succeeded", "failed", "partial", "unknown"]
    correlation_id: str
    sync_run_id: str | None = None
    readiness_snapshot_id: str | None = None
    occurred_at: datetime
    message: str
    inventory_snapshot_summary: AuditInventorySnapshotSummary | None = None
    inventory_comparison_to_previous: AuditInventorySnapshotComparison | None = None
    topology_snapshot_summary: AuditTopologySnapshotSummary | None = None
    topology_comparison_to_previous: AuditTopologySnapshotComparison | None = None
    policy_snapshot_summary: AuditPolicySnapshotSummary | None = None
    policy_comparison_to_previous: AuditPolicySnapshotComparison | None = None
    readiness_snapshot_summary: AuditReadinessSnapshotSummary | None = None
    notes: list[str]


class AuditHistoryResponse(ApiResponseMetadata):
    """Read-only audit-style history response."""

    data_status: Literal["persisted_activity_history", "empty"]
    summary: str
    baseline_summary: HistoryBaselineSummary
    count: int
    items: list[AuditHistoryItem]
