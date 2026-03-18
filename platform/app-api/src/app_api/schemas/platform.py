"""Typed schemas for platform status responses."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata


class PlatformComponentStatus(BaseModel):
    """Phase 2 status for a declared platform component."""

    name: str
    role: str
    lifecycle_state: Literal["declared"]
    observation_state: Literal["not_checked", "ok", "degraded", "unreachable", "unknown"]
    observation_source: str | None = None
    observation_summary: str | None = None
    observed_capabilities: list[str] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class PlatformReadPathStatus(BaseModel):
    """Bounded collector-to-backend read-path status for one model family."""

    model_family: Literal["inventory", "topology", "policy"]
    observation_state: Literal["ok", "degraded", "unreachable", "unknown"]
    configured_target_count: int
    observed_target_count: int
    collection_success_count: int
    collection_partial_count: int
    collection_failure_count: int
    oldest_observed_at: datetime | None = None
    newest_observed_at: datetime | None = None
    policy_capable_target_count: int | None = None
    detail_ready_target_count: int | None = None
    inference_posture: Literal["inferred", "unknown"] | None = None
    endpoint_pairing_posture: Literal[
        "paired", "partially_paired", "single_sided", "unknown"
    ] | None = None
    collection_posture: Literal["ok", "degraded", "blocked", "unknown"] | None = None
    node_participation_posture: Literal[
        "fully_linked", "partially_isolated", "isolated_only", "unknown"
    ] | None = None
    paired_link_count: int | None = None
    single_sided_link_count: int | None = None
    linked_node_count: int | None = None
    isolated_node_count: int | None = None
    degraded_scope_summary: str
    summary: str
    notes: list[str] = Field(default_factory=list)


class PlatformRecoveryPersistedArtifacts(BaseModel):
    """Bounded persisted artifact availability for same-workspace recovery posture."""

    inventory_snapshot: bool
    topology_snapshot: bool
    policy_snapshot: bool
    sync_history: bool
    readiness_snapshot: bool


class PlatformRecoveryStatus(BaseModel):
    """Backend-owned same-workspace recovery posture for the current runtime."""

    baseline_posture: Literal["preserved_same_workspace_baseline", "new_baseline"]
    read_side_posture: Literal[
        "live_recollection_ready",
        "degraded_with_persisted_baseline",
        "degraded_without_persisted_baseline",
    ]
    summary: str
    persisted_artifacts: PlatformRecoveryPersistedArtifacts
    notes: list[str] = Field(default_factory=list)


class PlatformStatusResponse(ApiResponseMetadata):
    """Read-only platform status response for Phase 2."""

    status: Literal["ok"]
    topology_name: Literal["platform"]
    summary: str
    recovery: PlatformRecoveryStatus
    components: list[PlatformComponentStatus]
    read_paths: list[PlatformReadPathStatus] = Field(default_factory=list)
