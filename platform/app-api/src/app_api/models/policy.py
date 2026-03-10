"""Backend-owned internal models for policy inventory reads."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


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
    empty_reason: Literal[
        "none",
        "no_policies_observed",
        "per_policy_details_unavailable",
        "collector_unavailable",
    ]
    observed_at: datetime | None = None
    observed_target_count: int
    policy_capable_target_count: int
    observed_policy_count: int
    active_policy_count: int
    static_policy_count: int
    bgp_policy_count: int
    notes: list[str] = Field(default_factory=list)
    records: list[PolicyInventoryRecord] = Field(default_factory=list)
