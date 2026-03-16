"""Typed internal models for the policy collection flow."""

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
]


class PolicyCollectionPlan(BaseModel):
    """Vendor-neutral collection plan for one policy target."""

    target_name: str
    vendor: str
    management_address: str
    policy_paths: list[str]


class PolicyRawRecord(BaseModel):
    """Vendor-specific raw policy record before normalization."""

    target_name: str
    vendor: str
    platform_hint: str
    role: str | None = None
    management_address: str
    collection_status: Literal["success", "failure", "partial"]
    collection_error: str | None = None
    observed_at: datetime | None = None
    sr_policy_counts: dict[str, int] = Field(default_factory=dict)
    raw_policies: list[dict[str, object]] = Field(default_factory=list)
    raw_runtime_paths: list[dict[str, object]] = Field(default_factory=list)


class NormalizedPolicyCandidatePathRecord(BaseModel):
    """Vendor-neutral candidate path record prepared for backend consumption."""

    name: str
    path_state: Literal["active", "inactive", "unknown"]
    preference: int | None = None
    notes: list[str] = Field(default_factory=list)


class NormalizedPolicyRecord(BaseModel):
    """Vendor-neutral policy record prepared for backend consumption."""

    policy_id: str
    policy_name: str
    policy_type: Literal["static_local", "static_non_local", "unknown"]
    headend: str
    endpoint: str
    color: int
    source_target: str
    source_target_role: str | None = None
    candidate_paths: list[NormalizedPolicyCandidatePathRecord] = Field(default_factory=list)
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
    source: Literal["gnmi"]
    notes: list[str] = Field(default_factory=list)


class NormalizedPolicyTargetFootprint(BaseModel):
    """Vendor-neutral per-target policy footprint prepared for backend consumption."""

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
    detail_blocker_reason: PolicyDetailBlockerReason
    notes: list[str] = Field(default_factory=list)


class BackendPolicyDeliveryEnvelope(BaseModel):
    """Normalized policy payload prepared for backend delivery."""

    destination_service: Literal["app-api"]
    delivery_mode: Literal["backend_http_snapshot"]
    delivery_status: Literal["live_ready", "partial", "failed"]
    destination_endpoint: str
    model_family: Literal["policy_inventory"]
    configured_target_count: int
    collection_success_count: int
    collection_partial_count: int
    collection_failure_count: int
    oldest_observed_at: datetime | None = None
    newest_observed_at: datetime | None = None
    detail_ready_target_count: int
    degraded_scope_summary: str
    sync_source: str
    sync_status: Literal["ok", "degraded", "failed", "unknown"]
    completeness: Literal["complete", "partial", "unknown"]
    detail_mode: Literal[
        "counters_only",
        "static_policies_when_present",
        "mixed",
        "unknown",
    ]
    observed_at: datetime | None = None
    observed_target_count: int
    policy_capable_target_count: int
    observed_target_role_counts: dict[str, int] = Field(default_factory=dict)
    policy_capable_target_role_counts: dict[str, int] = Field(default_factory=dict)
    policy_count: int
    active_policy_count: int
    static_policy_count: int
    static_local_policy_count: int
    static_non_local_policy_count: int
    bgp_policy_count: int
    ttm_preference_count: int
    binding_sid_count: int
    srv6_binding_sid_count: int
    target_footprints: list[NormalizedPolicyTargetFootprint] = Field(default_factory=list)
    records: list[NormalizedPolicyRecord] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class PolicyFlowSummary(BaseModel):
    """Summary metrics for the current policy flow."""

    target_count: int
    planned_paths: int
    collection_success_count: int
    collection_failure_count: int
    partial_collection_count: int
    oldest_observed_at: datetime | None = None
    newest_observed_at: datetime | None = None
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
    detail_ready_target_count: int
    normalized_policy_record_count: int
    backend_ready_policy_count: int
    backend_delivery_error_count: int


class PolicyFlowSnapshot(BaseModel):
    """Typed end-to-end snapshot of the current policy collection flow."""

    mode: Literal["phase_2_live_inventory"]
    config_path: str
    plans: list[PolicyCollectionPlan]
    raw_records: list[PolicyRawRecord]
    normalized_records: list[NormalizedPolicyRecord]
    delivery: BackendPolicyDeliveryEnvelope
    summary: PolicyFlowSummary
