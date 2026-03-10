"""Typed schemas for health responses."""

from typing import Literal

from app_api.schemas.common import ApiResponseMetadata


class HealthResponse(ApiResponseMetadata):
    """Minimal Phase 2 health contract."""

    status: Literal["ok"]
