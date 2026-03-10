"""Typed schemas for platform status responses."""

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


class PlatformStatusResponse(ApiResponseMetadata):
    """Read-only platform status response for Phase 2."""

    status: Literal["ok"]
    topology_name: Literal["platform"]
    summary: str
    components: list[PlatformComponentStatus]
