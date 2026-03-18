"""Backend-owned internal models for policy inventory reads."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


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


class PolicyDetailSourceReadiness(BaseModel):
    """Backend-owned bounded summary of source-side policy detail readiness."""

    posture: PolicyDetailSourceReadinessPosture = "unknown"
    no_policies_observed_target_count: int = 0
    detail_unavailable_target_count: int = 0
    partial_detail_target_count: int = 0


class CandidatePath(BaseModel):
    """Backend-owned normalized candidate path summary."""

    name: str
    path_state: Literal["active", "inactive", "unknown"]
    preference: int | None = None
    notes: list[str] = Field(default_factory=list)


class PolicyInventoryRecord(BaseModel):
    """Backend-owned normalized policy inventory model."""

    policy_id: str
    policy_name: str
    policy_type: Literal["static_local", "static_non_local", "unknown"]
    headend: str
    endpoint: str
    color: int
    source_target: str
    source_target_role: str | None = None
    candidate_paths: list[CandidatePath]
    intent_state: Literal["declared", "unknown"]
    observed_state: Literal["active", "inactive", "degraded", "unknown"]
    support_state: Literal[
        "supported",
        "partially_supported",
        "unsupported",
        "unknown",
        "not_implemented_in_platform",
    ]
    health_state: Literal["healthy", "degraded", "down", "unknown"]
    source: str
    notes: list[str] = Field(default_factory=list)


class PolicyTargetFootprint(BaseModel):
    """Backend-owned normalized per-target policy footprint."""

    target_name: str
    target_role: str | None = None
    collection_status: Literal["success", "failure", "partial"]
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
    detail_blocker_reason: PolicyDetailBlockerReason = "not_recorded"
    notes: list[str] = Field(default_factory=list)


class PolicyInventorySnapshot(BaseModel):
    """Backend-owned normalized policy inventory snapshot."""

    sync_source: str
    sync_status: Literal["ok", "degraded", "failed", "unknown"]
    completeness: Literal["complete", "partial", "unknown"]
    detail_mode: Literal[
        "counters_only",
        "static_policies_when_present",
        "mixed",
        "unknown",
    ]
    detail_source_readiness: PolicyDetailSourceReadiness = Field(
        default_factory=PolicyDetailSourceReadiness
    )
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
    notes: list[str] = Field(default_factory=list)
    target_footprints: list[PolicyTargetFootprint] = Field(default_factory=list)
    records: list[PolicyInventoryRecord] = Field(default_factory=list)


class PolicyHistorySnapshotRecord(BaseModel):
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


class PolicyComparisonChangePreview(BaseModel):
    """Bounded preview of one normalized policy-record change."""

    policy_id: str
    policy_name: str
    source_target: str
    source_target_role: str | None = None
    change_kind: Literal["added", "removed", "changed"]
    changed_fields: list[str] = Field(default_factory=list)


class PolicyHistoryComparison(BaseModel):
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
    change_preview: list[PolicyComparisonChangePreview] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)
    current_detail_source_readiness_posture: PolicyDetailSourceReadinessPosture = "unknown"
    previous_detail_source_readiness_posture: PolicyDetailSourceReadinessPosture = "unknown"
    current_detail_ready_target_count: int = 0
    previous_detail_ready_target_count: int = 0
    current_no_policies_observed_target_count: int = 0
    previous_no_policies_observed_target_count: int = 0


class PolicyHistoryWindow(BaseModel):
    """Bounded persisted history window for policy comparison support."""

    status: Literal["unavailable", "current_only", "comparison_ready"]
    summary: str
    recent_snapshots: list[PolicyHistorySnapshotRecord] = Field(default_factory=list)
    comparison_to_previous: PolicyHistoryComparison | None = None


class PolicyCurrentComparison(BaseModel):
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
    change_preview: list[PolicyComparisonChangePreview] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)
