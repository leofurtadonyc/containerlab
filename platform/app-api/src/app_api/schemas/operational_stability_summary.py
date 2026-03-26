"""Operational stability summary v1 (Phase 2, read-only).

See ``platform/docs/operational-stability-summary-contract.md``.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata

OPERATIONAL_STABILITY_SUMMARY_CONTRACT_ID = "operational_stability_summary_v1"

StabilityPosture = Literal[
    "quiet_or_stable_evidence",
    "elevated_churn",
    "recurrence_suspected",
    "degraded_recurrence",
    "insufficient_evidence_for_stability_view",
]

StabilitySubjectFamily = Literal["global_window", "service", "topology_object"]

StabilityRowType = Literal[
    "churn_signal",
    "recurrence_signal",
    "degraded_recurrence_signal",
    "evidence_weakness_signal",
    "quiet_signal",
]

OperationalStabilityExplicitNonClaim = Literal[
    "not_prediction_or_forecast",
    "not_validation_or_approval",
    "not_root_cause_or_blast_radius",
    "not_unified_health_score",
    "not_drift_truth",
    "not_substitute_for_evidence_consistency",
    "not_grafana_semantics",
]

DEFAULT_OPERATIONAL_STABILITY_EXPLICIT_NON_CLAIMS: list[OperationalStabilityExplicitNonClaim] = [
    "not_prediction_or_forecast",
    "not_validation_or_approval",
    "not_root_cause_or_blast_radius",
    "not_unified_health_score",
    "not_drift_truth",
    "not_substitute_for_evidence_consistency",
    "not_grafana_semantics",
]


class OperationalStabilitySafetyFraming(BaseModel):
    contract_id: str = Field(default=OPERATIONAL_STABILITY_SUMMARY_CONTRACT_ID)
    authority_posture: Literal["interpretation_support_only", "read_only_assembly_non_authoritative"] = (
        "interpretation_support_only"
    )
    explicit_non_claims: list[OperationalStabilityExplicitNonClaim] = Field(
        default_factory=lambda: list(DEFAULT_OPERATIONAL_STABILITY_EXPLICIT_NON_CLAIMS)
    )
    phase: Literal["phase_2_read_only_foundation"] = "phase_2_read_only_foundation"
    summary_disclaimer: str = Field(
        default=(
            "Operational stability summary v1 interprets existing Phase 2 read-side evidence for steadiness, churn, "
            "and evidence sufficiency. It does not predict failures, validate changes, approve work, or replace "
            "evidence-consistency or change-intelligence surfaces."
        )
    )


class OperationalStabilityRow(BaseModel):
    """One auditable stability observation derived from cited sources."""

    subject_family: StabilitySubjectFamily = "global_window"
    row_type: StabilityRowType
    stability_posture_hint: StabilityPosture | None = Field(
        default=None,
        description="Optional posture label for this row; primary roll-up is operational_stability_posture.",
    )
    summary: str
    detail: str | None = None
    source_citations: list[str] = Field(
        default_factory=list,
        description="Stable references such as GET paths already used as assembly inputs.",
    )


class OperationalStabilitySummaryResponse(BaseModel):
    """Cross-surface operational stability summary (Phase 2 read-only)."""

    metadata: ApiResponseMetadata
    contract_id: str = Field(default=OPERATIONAL_STABILITY_SUMMARY_CONTRACT_ID)
    safety_framing: OperationalStabilitySafetyFraming
    operational_stability_posture: StabilityPosture
    scope_summary: str
    sync_runs_limit_applied: int = Field(
        ge=1,
        le=100,
        description="Aligned with embedded change-intelligence window.",
    )
    rows: list[OperationalStabilityRow] = Field(default_factory=list)
    caveats: list[str] = Field(default_factory=list)
    assembly_notes: list[str] = Field(
        default_factory=list,
        description="Bounded notes when a source assembly failed partially.",
    )
