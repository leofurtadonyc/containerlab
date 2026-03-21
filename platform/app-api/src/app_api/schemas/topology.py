"""Typed schemas for topology responses.

Topology **partiality** is decomposed into four independent response-level axes
(see ``platform/schemas/topology/topology-read-path-coverage-semantics.md``):

- ``inference_posture`` — whether emitted links are still inference-bounded vs unclassifiable.
- ``endpoint_pairing_posture`` — strength of per-link endpoint evidence (paired vs single-sided mix).
- ``collection_posture`` — health of the live collection path (ok / degraded / blocked).
- ``node_participation_posture`` — whether observed nodes appear on any emitted inferred link.

These answer different questions; they must not be collapsed into one overloaded label.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import (
    ApiResponseMetadata,
    ComparisonToLatestPersistedStatus,
    EvidenceConfidenceSummary,
)


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
    """Bounded response-level topology coverage summary.

    Each field addresses one partiality dimension; see module docstring.
    """

    inference_posture: Literal["inferred", "unknown"] = Field(
        description=(
            "Inference-boundedness: emitted links are inferred (not direct adjacency truth), "
            "or posture cannot be classified. Independent of collection health and endpoint pairing strength."
        ),
    )
    endpoint_pairing_posture: Literal["paired", "partially_paired", "single_sided", "unknown"] = Field(
        description=(
            "Aggregate endpoint evidence for emitted links: all paired, mixed paired/single-sided, "
            "all single-sided, or unknown. Does not measure collection degradation or global topology completeness."
        ),
    )
    collection_posture: Literal["ok", "degraded", "blocked", "unknown"] = Field(
        description=(
            "Live collection path posture for the topology read (success vs partial failure vs blocked). "
            "Does not replace serving_mode; not a verdict on inference correctness."
        ),
    )
    node_participation_posture: Literal[
        "fully_linked", "partially_isolated", "isolated_only", "unknown"
    ] = Field(
        description=(
            "Whether observed nodes participate in at least one emitted inferred link (linked vs isolated mix). "
            "Orthogonal to per-link endpoint_pairing_state on individual links."
        ),
    )
    paired_link_count: int = Field(
        description="Count of emitted links with endpoint_pairing_state=paired.",
    )
    single_sided_link_count: int = Field(
        description="Count of emitted links with endpoint_pairing_state=single_sided.",
    )
    linked_node_count: int = Field(
        description="Observed nodes that appear on at least one emitted inferred link.",
    )
    isolated_node_count: int = Field(
        description="Observed nodes not represented by any emitted inferred link.",
    )
    summary: str = Field(
        description="Concatenated explanation of the four axes; does not replace typed posture fields.",
    )


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

    status: ComparisonToLatestPersistedStatus
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
    inference_posture: Literal["inferred", "unknown"] = "unknown"
    endpoint_pairing_posture: Literal[
        "paired", "partially_paired", "single_sided", "unknown"
    ] = "unknown"
    collection_posture: Literal["ok", "degraded", "blocked", "unknown"] = "unknown"
    node_participation_posture: Literal[
        "fully_linked", "partially_isolated", "isolated_only", "unknown"
    ] = "unknown"
    paired_link_count: int = 0
    single_sided_link_count: int = 0
    linked_node_count: int = 0
    isolated_node_count: int = 0


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
    current_inference_posture: Literal["inferred", "unknown"] = "unknown"
    previous_inference_posture: Literal["inferred", "unknown"] = "unknown"
    current_endpoint_pairing_posture: Literal[
        "paired", "partially_paired", "single_sided", "unknown"
    ] = "unknown"
    previous_endpoint_pairing_posture: Literal[
        "paired", "partially_paired", "single_sided", "unknown"
    ] = "unknown"
    current_collection_posture: Literal["ok", "degraded", "blocked", "unknown"] = "unknown"
    previous_collection_posture: Literal["ok", "degraded", "blocked", "unknown"] = "unknown"
    current_node_participation_posture: Literal[
        "fully_linked", "partially_isolated", "isolated_only", "unknown"
    ] = "unknown"
    previous_node_participation_posture: Literal[
        "fully_linked", "partially_isolated", "isolated_only", "unknown"
    ] = "unknown"
    current_paired_link_count: int = 0
    previous_paired_link_count: int = 0
    current_single_sided_link_count: int = 0
    previous_single_sided_link_count: int = 0
    current_linked_node_count: int = 0
    previous_linked_node_count: int = 0
    current_isolated_node_count: int = 0
    previous_isolated_node_count: int = 0


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
