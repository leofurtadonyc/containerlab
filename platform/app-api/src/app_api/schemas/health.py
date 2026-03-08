"""Typed schemas for health responses."""

from typing import Literal

from app_api.schemas.common import ApiResponseMetadata


class HealthResponse(ApiResponseMetadata):
    """Minimal Phase 1 health contract."""

    status: Literal["ok"]
