"""Typed schemas for policy inventory responses."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata, EvidenceConfidenceSummary


CurrentRowPosture = Literal["current", "stale"]
CandidatePathState = Literal["active", "inactive", "unknown"]
PolicyObservedState = Literal["active", "inactive", "degraded", "unknown"]
PolicyHealthState = Literal["healthy", "degraded", "down", "unknown"]
PolicyCollectionStatus = Literal["success", "failure", "partial"]
PolicyDetailBlockerReason = Literal[
    "none",
    "policy_capability_unavailable",
    "no_policies_observed",
    "per_policy_details_unavailable",
    "partial_detail_coverage",
    "collection_failed",
    "collection_partial",
    "not_recorded",
]
PolicyDetailSourceReadinessPosture = Literal[
    "unknown",
    "no_policies_observed",
    "source_detail_unavailable",
    "partially_ready",
    "ready",
]


class PolicyDetailSourceReadinessRecord(BaseModel):
    """Bounded summary of source-side policy detail readiness."""

    posture: PolicyDetailSourceReadinessPosture
    no_policies_observed_target_count: int
    detail_unavailable_target_count: int
    partial_detail_target_count: int


class CandidatePathRecord(BaseModel):
    """Normalized candidate path record."""

    name: str
    current_posture: CurrentRowPosture
    path_state: CandidatePathState
    last_recorded_path_state: CandidatePathState
    preference: int | None = None
    notes: list[str]


class PolicyRecord(BaseModel):
    """Vendor-neutral policy inventory record."""

    policy_id: str
    policy_name: str
    policy_type: Literal["static_local", "static_non_local", "unknown"]
    headend: str
    endpoint: str
    color: int
    source_target: str
    source_target_role: str | None = None
    candidate_paths: list[CandidatePathRecord]
    current_posture: CurrentRowPosture
    intent_state: Literal["declared", "unknown"]
    observed_state: PolicyObservedState
    last_recorded_observed_state: PolicyObservedState
    support_state: Literal[
        "supported",
        "partially_supported",
        "unsupported",
        "unknown",
        "not_implemented_in_platform",
    ]
    health_state: PolicyHealthState
    last_recorded_health_state: PolicyHealthState
    source: str
    notes: list[str]


class PolicyTargetFootprintRecord(BaseModel):
    """Vendor-neutral per-target policy footprint."""

    target_name: str
    target_role: str | None = None
    current_posture: CurrentRowPosture
    collection_status: PolicyCollectionStatus
    last_recorded_collection_status: PolicyCollectionStatus
    policy_capable: bool
    observed_policy_count: int
    active_policy_count: int
    static_policy_count: int
    static_local_policy_count: int
    static_non_local_policy_count: int
    bgp_policy_count: int
    ttm_preference_count: int
    binding_sid_count: int
    srv6_binding_sid_count: int
    detail_record_count: int
    detail_blocker_reason: PolicyDetailBlockerReason
    notes: list[str]


class PolicyHistorySnapshotResponseRecord(BaseModel):
    """Bounded summary of one persisted policy snapshot."""

    snapshot_id: str
    persisted_at: datetime
    observed_at: datetime | None = None
    data_status: Literal["live", "degraded"]
    sync_source: str
    sync_status: Literal["ok", "degraded", "failed", "unknown"]
    completeness: Literal["complete", "partial", "unknown"]
    detail_mode: Literal[
        "counters_only",
        "static_policies_when_present",
        "mixed",
        "unknown",
    ]
    empty_reason: Literal[
        "none",
        "no_policies_observed",
        "per_policy_details_unavailable",
        "collector_unavailable",
    ]
    observed_policy_count: int
    active_policy_count: int
    detail_record_count: int
    detail_source_readiness_posture: PolicyDetailSourceReadinessPosture = "unknown"
    detail_ready_target_count: int = 0
    no_policies_observed_target_count: int = 0
    detail_unavailable_target_count: int = 0
    partial_detail_target_count: int = 0


class PolicyComparisonChangePreviewResponse(BaseModel):
    """Bounded preview of one normalized policy-record change."""

    policy_id: str
    policy_name: str
    source_target: str
    source_target_role: str | None = None
    change_kind: Literal["added", "removed", "changed"]
    changed_fields: list[str]


class PolicyHistoryComparisonResponse(BaseModel):
    """Bounded comparison of the latest two persisted policy snapshots."""

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
    change_preview: list[PolicyComparisonChangePreviewResponse]
    notes: list[str]
    current_detail_source_readiness_posture: PolicyDetailSourceReadinessPosture = "unknown"
    previous_detail_source_readiness_posture: PolicyDetailSourceReadinessPosture = "unknown"
    current_detail_ready_target_count: int = 0
    previous_detail_ready_target_count: int = 0
    current_no_policies_observed_target_count: int = 0
    previous_no_policies_observed_target_count: int = 0


class PolicyHistoryWindowResponse(BaseModel):
    """Bounded persisted history window for policy comparison support."""

    status: Literal["unavailable", "current_only", "comparison_ready"]
    summary: str
    recent_snapshots: list[PolicyHistorySnapshotResponseRecord]
    comparison_to_previous: PolicyHistoryComparisonResponse | None = None


class PolicyCurrentComparisonResponse(BaseModel):
    """Bounded comparison between the current response and latest persisted snapshot."""

    status: Literal["unavailable", "current_vs_latest_persisted_ready"]
    summary: str
    comparison_snapshot_id: str | None = None
    comparison_persisted_at: datetime | None = None
    current_observed_at: datetime | None = None
    current_observed_policy_count: int
    persisted_observed_policy_count: int
    current_detail_record_count: int
    persisted_detail_record_count: int
    observed_policy_delta: int
    detail_record_delta: int
    added_policy_count: int
    removed_policy_count: int
    changed_policy_count: int
    change_preview: list[PolicyComparisonChangePreviewResponse]
    notes: list[str]


class PoliciesListResponse(ApiResponseMetadata):
    """Read-only policy inventory list response."""

    data_status: Literal["live", "degraded"]
    serving_mode: Literal["live_collector", "persisted_fallback", "empty_scaffold"]
    evidence_confidence: EvidenceConfidenceSummary
    summary: str
    served_persisted_at: datetime | None = None
    sync_source: str
    sync_status: Literal["ok", "degraded", "failed", "unknown"]
    completeness: Literal["complete", "partial", "unknown"]
    detail_mode: Literal[
        "counters_only",
        "static_policies_when_present",
        "mixed",
        "unknown",
    ]
    detail_source_readiness: PolicyDetailSourceReadinessRecord
    empty_reason: Literal[
        "none",
        "no_policies_observed",
        "per_policy_details_unavailable",
        "collector_unavailable",
    ]
    observed_at: datetime | None = None
    observed_target_count: int
    policy_capable_target_count: int
    observed_target_role_counts: dict[str, int] = Field(default_factory=dict)
    policy_capable_target_role_counts: dict[str, int] = Field(default_factory=dict)
    observed_policy_count: int
    active_policy_count: int
    static_policy_count: int
    static_local_policy_count: int
    static_non_local_policy_count: int
    bgp_policy_count: int
    ttm_preference_count: int
    binding_sid_count: int
    srv6_binding_sid_count: int
    count: int
    notes: list[str]
    target_footprints: list[PolicyTargetFootprintRecord]
    comparison_to_latest_persisted: PolicyCurrentComparisonResponse
    history: PolicyHistoryWindowResponse
    items: list[PolicyRecord]
