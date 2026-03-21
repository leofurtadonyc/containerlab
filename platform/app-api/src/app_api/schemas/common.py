"""Shared API response schemas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ApiResponseMetadata(BaseModel):
    """Common response metadata for Phase 2 read-only endpoints."""

    service: Literal["app-api"]
    version: str
    phase: Literal["phase_2_read_only_foundation"]
    generated_at: datetime


ComparisonToLatestPersistedStatus = Literal["unavailable", "live_vs_latest_persisted_ready"]
"""Shared status for ``comparison_to_latest_persisted`` on list-style read responses.

Used by inventory (``/api/v1/devices``), topology (``/api/v1/topology``), and policies
(``/api/v1/policies``) so operators and clients see one convention for “live response
versus latest persisted snapshot” comparison readiness.
"""


class EvidenceConfidenceSummary(BaseModel):
    """Shared summary of evidence basis and truth-confidence posture."""

    source_posture: Literal["live_observed", "persisted_fallback", "empty_scaffold"]
    evidence_kind: Literal[
        "direct_observed",
        "observed_plus_inferred",
        "aggregate_only",
        "aggregate_plus_bounded_records",
        "unknown",
    ]
    confidence_posture: Literal[
        "strong_for_current_slice",
        "bounded_partial",
        "degraded",
        "blocked",
    ]
    freshness_posture: Literal["current", "stale", "unknown"]
    blocked_reason: Literal[
        "none",
        "collector_unavailable",
        "collector_unavailable_and_no_persisted_snapshot",
        "per_record_detail_unavailable",
        "unknown",
    ]
    summary: str
    notes: list[str] = Field(default_factory=list)


class ErrorDetail(BaseModel):
    """Structured error detail entry."""

    field: str | None = None
    issue: str


class ErrorResponse(BaseModel):
    """Consistent error response contract for the backend API."""

    code: str
    message: str
    details: list[ErrorDetail] = Field(default_factory=list)
    request_id: str


class HistoryBaselineSummary(BaseModel):
    """Bounded baseline summary for workflow and audit history responses.

    Helps operators interpret whether the history view reflects preserved sync-derived
    history from the current workspace baseline or is effectively starting from a new
    baseline after restart or redeploy.
    """

    baseline_posture: Literal["preserved_same_workspace_baseline", "new_baseline"]
    summary: str
    notes: list[str] = Field(default_factory=list)
