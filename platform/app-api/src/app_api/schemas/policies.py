"""Typed schemas for policy inventory responses."""

from typing import Literal

from pydantic import BaseModel

from app_api.schemas.common import ApiResponseMetadata


class CandidatePathRecord(BaseModel):
    """Normalized candidate path record."""

    name: str
    path_state: Literal["active", "inactive", "unknown"]
    preference: int | None = None
    notes: list[str]


class PolicyRecord(BaseModel):
    """Vendor-neutral policy inventory record for Phase 1 APIs."""

    policy_id: str
    policy_name: str
    headend: str
    endpoint: str
    color: int
    candidate_paths: list[CandidatePathRecord]
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
    notes: list[str]


class PoliciesListResponse(ApiResponseMetadata):
    """Read-only policy inventory list response."""

    data_status: Literal["normalized_scaffold"]
    summary: str
    count: int
    items: list[PolicyRecord]
