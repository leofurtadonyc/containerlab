"""Typed schemas for topology responses."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app_api.schemas.common import ApiResponseMetadata, EvidenceConfidenceSummary


CurrentRowPosture = Literal["current", "stale"]
TopologyState = Literal["up", "down", "degraded", "unknown"]


class TopologyNodeRecord(BaseModel):
    """Normalized topology node record."""

    node_id: str
    display_name: str
    role: str
    current_posture: CurrentRowPosture
    state: TopologyState
    last_recorded_state: TopologyState
    source: str
    device_id: str | None = None
    attributes: dict[str, str]


class TopologyLinkRecord(BaseModel):
    """Normalized topology link record."""

    link_id: str
    source_node_id: str
    target_node_id: str
    current_posture: CurrentRowPosture
    state: TopologyState
    last_recorded_state: TopologyState
    source: str
    endpoint_pairing_state: Literal["paired", "single_sided", "unknown"]
    endpoint_evidence_count: int | None = None
    attributes: dict[str, str]


class TopologyCoverageSummaryRecord(BaseModel):
    """Bounded response-level topology coverage summary."""

    inference_posture: Literal["inferred", "unknown"]
    endpoint_pairing_posture: Literal["paired", "partially_paired", "single_sided", "unknown"]
    collection_posture: Literal["ok", "degraded", "blocked", "unknown"]
    node_participation_posture: Literal[
        "fully_linked", "partially_isolated", "isolated_only", "unknown"
    ]
    paired_link_count: int
    single_sided_link_count: int
    linked_node_count: int
    isolated_node_count: int
    summary: str


class TopologyRecord(BaseModel):
    """Normalized topology snapshot."""

    topology_id: str
    topology_name: str
    nodes: list[TopologyNodeRecord]
    links: list[TopologyLinkRecord]
    sync_source: str
    sync_status: Literal["ok", "degraded", "failed", "unknown"]
    completeness: Literal["complete", "partial", "unknown"]
    observed_at: datetime | None = None
    notes: list[str]


class TopologyComparisonSummary(BaseModel):
    """Bounded current-versus-persisted topology comparison summary."""

    status: Literal["unavailable", "live_vs_latest_persisted_ready"]
    summary: str
    comparison_snapshot_id: str | None = None
    comparison_persisted_at: datetime | None = None
    current_observed_at: datetime | None = None
    current_node_count: int
    persisted_node_count: int
    current_link_count: int
    persisted_link_count: int
    node_count_delta: int
    link_count_delta: int
    added_node_count: int
    removed_node_count: int
    changed_node_count: int
    added_link_count: int
    removed_link_count: int
    changed_link_count: int
    notes: list[str]


class TopologyHistorySnapshotRecord(BaseModel):
    """Bounded summary of one persisted topology snapshot."""

    snapshot_id: str
    persisted_at: datetime
    observed_at: datetime | None = None
    topology_name: str
    sync_source: str
    sync_status: Literal["ok", "degraded", "failed", "unknown"]
    completeness: Literal["complete", "partial", "unknown"]
    node_count: int
    link_count: int
    node_state_counts: dict[str, int]
    link_state_counts: dict[str, int]


class TopologyHistoryComparison(BaseModel):
    """Bounded comparison of the latest two persisted topology snapshots."""

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


class TopologyHistoryWindow(BaseModel):
    """Bounded persisted history window for topology comparison support."""

    status: Literal["unavailable", "current_only", "comparison_ready"]
    summary: str
    recent_snapshots: list[TopologyHistorySnapshotRecord]
    comparison_to_previous: TopologyHistoryComparison | None = None


class TopologyResponse(ApiResponseMetadata):
    """Read-only topology response."""

    data_status: Literal["normalized_scaffold", "live", "degraded"]
    serving_mode: Literal["live_collector", "persisted_fallback", "empty_scaffold"]
    evidence_confidence: EvidenceConfidenceSummary
    summary: str
    served_persisted_at: datetime | None = None
    comparison_to_latest_persisted: TopologyComparisonSummary
    history: TopologyHistoryWindow
    coverage_summary: TopologyCoverageSummaryRecord
    topology: TopologyRecord
