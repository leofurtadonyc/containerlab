"""Cross-domain evidence consistency summary v1 (Phase 2, read-only).

See ``platform/docs/evidence-consistency-summary-contract.md``.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata

EVIDENCE_CONSISTENCY_SUMMARY_CONTRACT_ID = "evidence_consistency_summary_v1"

EvidenceConsistencyContradictionCategory = Literal[
    "identity_or_reference_tension",
    "freshness_or_serving_mismatch",
    "posture_tension",
    "activity_vs_static_tension",
    "history_gate_mismatch",
    "scope_mismatch",
    "gap_note",
]

EvidenceConsistencySignal = Literal[
    "appears_aligned",
    "weak_alignment",
    "appears_in_tension",
    "not_comparable",
    "gap_note",
]

EvidenceConsistencyExplicitNonClaim = Literal[
    "not_validation_truth",
    "not_drift_truth",
    "not_root_cause",
    "not_safe_to_change",
    "not_unified_score",
    "not_grafana_semantics",
    "not_cross_domain_completeness",
]

DEFAULT_EVIDENCE_CONSISTENCY_EXPLICIT_NON_CLAIMS: list[EvidenceConsistencyExplicitNonClaim] = [
    "not_validation_truth",
    "not_drift_truth",
    "not_root_cause",
    "not_safe_to_change",
    "not_unified_score",
    "not_grafana_semantics",
    "not_cross_domain_completeness",
]


class EvidenceConsistencySafetyFraming(BaseModel):
    contract_id: str = Field(default=EVIDENCE_CONSISTENCY_SUMMARY_CONTRACT_ID)
    authority_posture: Literal["interpretation_support_only", "read_only_assembly_non_authoritative"] = (
        "interpretation_support_only"
    )
    explicit_non_claims: list[EvidenceConsistencyExplicitNonClaim] = Field(
        default_factory=lambda: list(DEFAULT_EVIDENCE_CONSISTENCY_EXPLICIT_NON_CLAIMS)
    )
    phase: Literal["phase_2_read_only_foundation"] = "phase_2_read_only_foundation"
    summary_disclaimer: str = Field(
        default=(
            "Evidence consistency summary v1 compares existing Phase 2 read-side postures across domains. "
            "It does not assert validation, drift truth, root cause, safe-to-change approval, or a unified "
            "urgency score."
        )
    )


class EvidenceConsistencyPivotHint(BaseModel):
    """Read-only pivot pointer (no new routes)."""

    label: str
    route_family: str = Field(
        description="Stable API or view family for operator navigation (e.g. GET /api/v1/policies).",
    )


class EvidenceConsistencyItemRow(BaseModel):
    """One auditable consistency observation."""

    category: EvidenceConsistencyContradictionCategory
    consistency_signal: EvidenceConsistencySignal
    summary: str
    detail: str | None = None
    pivot_hints: list[EvidenceConsistencyPivotHint] = Field(default_factory=list)


class DomainFreshnessEcho(BaseModel):
    """Echo of serving/freshness axes for transparency (no new semantics)."""

    domain: Literal["policies", "devices", "topology"]
    data_status: str | None = None
    serving_mode: str | None = None


class EvidenceConsistencySummaryResponse(BaseModel):
    """Cross-domain evidence consistency summary (Phase 2 read-only)."""

    metadata: ApiResponseMetadata
    contract_id: str = Field(default=EVIDENCE_CONSISTENCY_SUMMARY_CONTRACT_ID)
    safety_framing: EvidenceConsistencySafetyFraming
    scope_summary: str
    sync_runs_limit_applied: int = Field(
        ge=1,
        description="Aligned with embedded change-intelligence window when recent activity is considered.",
    )
    domain_freshness_echo: list[DomainFreshnessEcho] = Field(default_factory=list)
    items: list[EvidenceConsistencyItemRow] = Field(default_factory=list)
    caveats: list[str] = Field(default_factory=list)
    assembly_notes: list[str] = Field(
        default_factory=list,
        description="Bounded notes when a source assembly failed partially.",
    )
