"""Typed schemas for platform status responses."""

from typing import Literal

from pydantic import BaseModel

from app_api.schemas.common import ApiResponseMetadata


class PlatformComponentStatus(BaseModel):
    """Phase 1 status for a declared platform component."""

    name: str
    role: str
    lifecycle_state: Literal["declared"]
    observation_state: Literal["not_checked"]


class PlatformStatusResponse(ApiResponseMetadata):
    """Read-only platform status scaffold for Phase 1."""

    status: Literal["ok"]
    topology_name: Literal["platform"]
    summary: str
    components: list[PlatformComponentStatus]
