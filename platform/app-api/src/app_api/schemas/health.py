"""Typed schemas for health responses."""

from typing import Literal

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Minimal Phase 1 health contract."""

    status: Literal["ok"]
    service: Literal["app-api"]
    version: str
    phase: Literal["phase_1_skeleton"]
