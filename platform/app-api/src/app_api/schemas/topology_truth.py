"""Deeper topology truth v1 — merged, source-aware topology (not path truth)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata

TOPOLOGY_TRUTH_V1_CONTRACT_ID = "topology_truth_v1"

TopologySourceType = Literal[
    "device_gnmi",
    "controller_bgpls",
    "persisted_snapshot",
    "merged",
]

TopologyTruthPosture = Literal[
    "inferred_only",
    "device_observed",
    "protocol_confirmed",
    "controller_correlated",
    "merged_multi_source",
    "partial",
    "conflicting",
    "stale",
    "unknown",
]

TopologyDisagreementKind = Literal[
    "device_controller_mismatch",
    "missing_controller_evidence",
    "missing_device_evidence",
    "stale_controller_view",
    "stale_device_view",
    "identity_conflict",
    "attribute_conflict",
]

ControllerFetchStatus = Literal["ok", "degraded", "unreachable", "empty"]


class TopologySourceRef(BaseModel):
    """One contributing topology source."""

    source_type: TopologySourceType
    source_id: str = Field(description="Stable id within the source, e.g. sync topology id or odl export id.")
    source_scope: str = Field(default="platform_v1", description="Deployment or slice scope label.")
    source_time: datetime | None = None
    source_freshness: Literal["current", "stale", "unknown"] = "unknown"
    source_authority_posture: Literal["observed", "inferred", "controller_export", "merged", "unknown"] = "unknown"
    source_summary: str = ""


class TopologyTruthProvenance(BaseModel):
    """Provenance for one topology object in the merged view."""

    contributing_sources: list[TopologySourceType] = Field(default_factory=list)
    primary_source: TopologySourceType | None = None
    evidence_timestamps: list[datetime] = Field(default_factory=list)
    freshness_posture: Literal["current", "stale", "unknown"] = "unknown"
    merged_or_correlated: bool = False
    missing_sources: list[TopologySourceType] = Field(default_factory=list)


class TopologyDisagreementRecord(BaseModel):
    """Explicit disagreement between sources for an object."""

    object_kind: Literal["node", "link"]
    object_id: str
    kind: TopologyDisagreementKind
    summary: str
    source_a: TopologySourceType | None = None
    source_b: TopologySourceType | None = None


class TopologyTruthNodeRecord(BaseModel):
    """Node in the merged topology truth view."""

    node_id: str
    display_name: str
    role: str
    state: str
    truth_posture: TopologyTruthPosture
    provenance: TopologyTruthProvenance
    disagreement: TopologyDisagreementRecord | None = None
    attributes: dict[str, str] = Field(default_factory=dict)


class TopologyTruthLinkRecord(BaseModel):
    """Link/adjacency in the merged topology truth view."""

    link_id: str
    source_node_id: str
    target_node_id: str
    state: str
    truth_posture: TopologyTruthPosture
    provenance: TopologyTruthProvenance
    endpoint_pairing_state: str = "unknown"
    endpoint_evidence_count: int | None = None
    disagreement: TopologyDisagreementRecord | None = None
    attributes: dict[str, str] = Field(default_factory=dict)


class TopologyTruthMergedTopology(BaseModel):
    """Backend-owned merged graph (not a substitute for path validation)."""

    topology_id: str
    topology_name: str
    nodes: list[TopologyTruthNodeRecord]
    links: list[TopologyTruthLinkRecord]
    notes: list[str] = Field(default_factory=list)


class TopologyTruthFreshnessSummary(BaseModel):
    """Freshness across sources for this read."""

    device_gnmi: Literal["current", "stale", "unknown"]
    controller_bgpls: Literal["current", "stale", "unknown", "not_applicable"]
    merged_view: Literal["current", "stale", "unknown"]


class TopologyTruthCounts(BaseModel):
    """Bounded counters for observability and UI."""

    merged_node_count: int
    merged_link_count: int
    inferred_only_link_count: int
    protocol_confirmed_link_count: int
    controller_only_node_count: int
    device_only_node_count: int
    conflicting_object_count: int
    stale_source_marker_count: int


class TopologyTruthSafetyFraming(BaseModel):
    contract_id: str = TOPOLOGY_TRUTH_V1_CONTRACT_ID
    explicit_non_claims: list[str] = Field(
        default_factory=lambda: [
            "Merged topology truth is not end-to-end traffic path truth or full TE authority.",
            "ODL/controller inputs are enrichment only; the backend owns the merged read model.",
            "Inferred gNMI links remain distinct from protocol-confirmed adjacency when sources disagree or controller data is missing.",
        ],
    )


class TopologyTruthResponse(ApiResponseMetadata):
    """Merged topology truth with provenance (GET /api/v1/topology/truth)."""

    contract_id: str = TOPOLOGY_TRUTH_V1_CONTRACT_ID
    sources: list[TopologySourceRef]
    controller_fetch_status: ControllerFetchStatus
    controller_notes: list[str] = Field(default_factory=list)
    freshness: TopologyTruthFreshnessSummary
    counts: TopologyTruthCounts
    disagreements: list[TopologyDisagreementRecord]
    merged_topology: TopologyTruthMergedTopology
    persisted_snapshot_id: str | None = None
    safety_framing: TopologyTruthSafetyFraming = Field(default_factory=TopologyTruthSafetyFraming)
