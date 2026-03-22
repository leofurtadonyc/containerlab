"""Bounded change-intelligence contract types (Phase 2, read-only).

This module defines **backend-owned vocabulary** and response shapes for the
cross-domain recent-change summary. Aggregation logic lives in
``app_api.services.change_intelligence``; this module does not perform I/O.

Relationship to weeks 19–23: inventory, topology, and policy list endpoints
expose per-resource ``comparison_to_latest_persisted`` and **history** slices;
workflow-history and audit-history expose sync-derived records and baseline
summaries; readiness exposes planning-support snapshots. **Change intelligence**
is an **aggregation-and-interpretation** contract over those existing signals—not
a duplicate of per-domain comparison semantics.

See: ``platform/docs/change-intelligence-contract.md``.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata

CHANGE_INTELLIGENCE_CONTRACT_ID = "change_intelligence_phase2_v1"
"""Stable identifier for this contract revision (bump when vocabulary changes)."""

ChangeEvidenceDomain = Literal[
    "devices",
    "topology",
    "policies",
    "readiness",
    "workflow_history",
    "audit_history",
]
"""Read-side domains that may contribute **bounded** recent-change signals.

Each domain remains subject to its own truth-depth and partiality limits; this
literal only names **where** signals may appear, not completeness of coverage.
"""

BoundedChangeSignalFamily = Literal[
    "persisted_snapshot_delta",
    "persisted_history_anchor",
    "read_side_sync_derived",
    "readiness_snapshot_sequence",
    "audit_event_sequence",
]
"""Coarse families of **existing** evidence shapes the backend may reference.

- ``persisted_snapshot_delta``: sequence or comparison across persisted inventory,
  topology, or policy snapshots (when rows exist).
- ``persisted_history_anchor``: snapshot identity / recency cues already carried
  in history payloads.
- ``read_side_sync_derived``: workflow-history / audit-history records tied to
  read-side sync activity (not workflow execution).
- ``readiness_snapshot_sequence``: persisted readiness-support snapshots and
  their inspection API—planning posture only.
- ``audit_event_sequence``: audit-history event stream (read-side and
  readiness-related events where present).

No family implies validation, drift engines, or authorization.
"""

ChangeIntelligenceAuthorityPosture = Literal[
    "summarization_only",
    "evidence_aggregated_non_authoritative",
]
"""How operators must read any future change-intelligence summary.

Always non-authoritative inside Phase 2: summaries organize visibility; they do
not approve changes or authorize actions.
"""

ChangeIntelligenceExplicitNonClaim = Literal[
    "not_validation_verdict",
    "not_drift_engine_result",
    "not_safe_to_change_recommendation",
    "not_workflow_execution_or_authorization",
    "not_new_collector_truth_domain",
    "not_cross_domain_completeness_guarantee",
]
"""Stable keys for explicit **non-goals** (usable in API metadata or docs).

These literals exist so product copy and structured responses can echo the same
denial vocabulary without inventing new strings per endpoint.
"""

DEFAULT_CHANGE_INTELLIGENCE_EXPLICIT_NON_CLAIMS: list[ChangeIntelligenceExplicitNonClaim] = [
    "not_validation_verdict",
    "not_drift_engine_result",
    "not_safe_to_change_recommendation",
    "not_workflow_execution_or_authorization",
    "not_new_collector_truth_domain",
    "not_cross_domain_completeness_guarantee",
]

RecentChangeWindowSemantics = Literal[
    "backend_defined_bounded_lookback",
    "visible_signals_in_request_budget",
]
"""How a ``recent`` window is defined.

Summaries are **not** required to be exhaustive across all history tables or to
match a single global timestamp column; the backend defines bounded lookback and
payload limits consistent with existing read APIs.
"""

RecentChangeCompletenessPosture = Literal[
    "bounded_partial",
    "best_effort_visible_signals_only",
]
"""Honesty posture for coverage of "what changed."

Partiality is expected: some domains may have no rows, empty history, or
degraded collectors; the summary must remain honest about that.
"""


class ChangeIntelligenceSafetyFraming(BaseModel):
    """Standard safety framing for future change-intelligence responses."""

    contract_id: str = Field(default=CHANGE_INTELLIGENCE_CONTRACT_ID)
    authority_posture: ChangeIntelligenceAuthorityPosture
    explicit_non_claims: list[ChangeIntelligenceExplicitNonClaim] = Field(
        default_factory=lambda: list(DEFAULT_CHANGE_INTELLIGENCE_EXPLICIT_NON_CLAIMS)
    )
    phase: Literal["phase_2_read_only_foundation"] = "phase_2_read_only_foundation"
    summary_disclaimer: str = Field(
        default=(
            "Recent change intelligence summarizes existing read-side evidence for "
            "operator visibility. It is not a validation verdict, drift detection "
            "result, safe-to-change recommendation, or workflow authorization."
        )
    )


class ChangeEvidenceDomainContribution(BaseModel):
    """Describes how one domain participates in a bounded change summary (metadata)."""

    domain: ChangeEvidenceDomain
    signal_families: list[BoundedChangeSignalFamily] = Field(default_factory=list)
    honest_limit_summary: str = Field(
        description=(
            "Short operator-facing note for this domain's limits "
            "(e.g. topology partiality, static_local policy slice)."
        )
    )


DomainEvidenceStatus = Literal["present", "absent", "partial"]
"""Whether this domain contributed usable evidence to the summary."""


class RecentChangeDomainSlice(BaseModel):
    """One domain's bounded contribution to the cross-domain recent-change summary."""

    domain: ChangeEvidenceDomain
    signal_families: list[BoundedChangeSignalFamily] = Field(default_factory=list)
    evidence_status: DomainEvidenceStatus
    headline: str
    detail_notes: list[str] = Field(default_factory=list)
    persisted_snapshot_count: int | None = None
    latest_persisted_at: datetime | None = None
    sync_runs_in_window: int | None = None
    latest_sync_finished_at: datetime | None = None


class RecentChangeSummaryResponse(BaseModel):
    """Backend-owned recent change intelligence summary (Phase 2 read-only)."""

    metadata: ApiResponseMetadata
    safety: ChangeIntelligenceSafetyFraming
    window_semantics: RecentChangeWindowSemantics
    completeness_posture: RecentChangeCompletenessPosture
    sync_runs_limit_applied: int
    readiness_snapshots_considered: int
    domains: list[RecentChangeDomainSlice]
    aggregation_notes: list[str] = Field(default_factory=list)
