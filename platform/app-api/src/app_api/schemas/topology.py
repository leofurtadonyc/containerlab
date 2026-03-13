"""Typed schemas for topology responses."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app_api.schemas.common import ApiResponseMetadata, EvidenceConfidenceSummary


class TopologyNodeRecord(BaseModel):
    """Normalized topology node record."""

    node_id: str
    display_name: str
    role: str
    state: Literal["up", "down", "degraded", "unknown"]
    source: str
    device_id: str | None = None
    attributes: dict[str, str]


class TopologyLinkRecord(BaseModel):
    """Normalized topology link record."""

    link_id: str
    source_node_id: str
    target_node_id: str
    state: Literal["up", "down", "degraded", "unknown"]
    source: str
    attributes: dict[str, str]


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


class TopologyResponse(ApiResponseMetadata):
    """Read-only topology response."""

    data_status: Literal["normalized_scaffold", "live", "degraded"]
    serving_mode: Literal["live_collector", "persisted_fallback", "empty_scaffold"]
    evidence_confidence: EvidenceConfidenceSummary
    summary: str
    served_persisted_at: datetime | None = None
    comparison_to_latest_persisted: TopologyComparisonSummary
    topology: TopologyRecord
