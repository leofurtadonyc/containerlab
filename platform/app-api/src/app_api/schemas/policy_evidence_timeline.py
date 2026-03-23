"""Policy evidence timeline contract types (Phase 2, read-only).

Per ``platform/docs/policy-evidence-timeline-contract.md`` — evidence ordering only,
not forensic chronology or validation authority.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata

POLICY_EVIDENCE_TIMELINE_CONTRACT_ID = "policy_evidence_timeline_v1"

PolicyEvidenceTimelineEntryKind = Literal[
    "policy_inventory_snapshot_anchor",
    "policy_history_persisted_checkpoint",
    "policy_history_comparison_span",
    "path_analysis_assembly_anchor",
    "degraded_policy_v1_signal_anchor",
]

PolicyEvidenceTimelineExplicitNonClaim = Literal[
    "not_unified_forensic_chronology",
    "not_packet_path_proof",
    "not_workflow_execution_history",
    "not_validation_truth",
    "not_change_causality_engine",
    "not_controller_event_bus",
    "not_cross_policy_ranking",
]

DEFAULT_POLICY_EVIDENCE_TIMELINE_EXPLICIT_NON_CLAIMS: list[PolicyEvidenceTimelineExplicitNonClaim] = [
    "not_unified_forensic_chronology",
    "not_packet_path_proof",
    "not_workflow_execution_history",
    "not_validation_truth",
    "not_change_causality_engine",
    "not_controller_event_bus",
    "not_cross_policy_ranking",
]


class PolicyEvidenceTimelineSafetyFraming(BaseModel):
    contract_id: str = Field(default=POLICY_EVIDENCE_TIMELINE_CONTRACT_ID)
    authority_posture: Literal["interpretation_support_only", "read_only_assembly_non_authoritative"] = (
        "interpretation_support_only"
    )
    explicit_non_claims: list[PolicyEvidenceTimelineExplicitNonClaim] = Field(
        default_factory=lambda: list(DEFAULT_POLICY_EVIDENCE_TIMELINE_EXPLICIT_NON_CLAIMS)
    )
    phase: Literal["phase_2_read_only_foundation"] = "phase_2_read_only_foundation"
    summary_disclaimer: str = Field(
        default=(
            "Policy evidence timeline v1 orders existing read-side timestamps and anchors for this "
            "policy only. It does not assert a unified forensic log, dataplane proof, workflow "
            "execution truth, validation verdicts, or change causality."
        )
    )


class PolicyEvidenceTimelineEntry(BaseModel):
    """One ordered evidence anchor derived from bounded product read paths."""

    entry_kind: PolicyEvidenceTimelineEntryKind
    sort_key: datetime = Field(
        ...,
        description="Primary instant used for newest-first ordering (verbatim from source evidence).",
    )
    tie_break: int = Field(
        ...,
        ge=0,
        description="Stable ordering when sort_key ties (lower sorts earlier after datetime sort).",
    )
    summary: str
    provenance: str = Field(
        ...,
        description="Human-readable source family (e.g. policies inventory, path-analysis).",
    )
    reference: str = Field(
        ...,
        description="Stable pointer such as API route family or snapshot id.",
    )


class PolicyEvidenceTimelineResponse(BaseModel):
    """Read-only per-policy evidence timeline."""

    metadata: ApiResponseMetadata
    contract_id: str = Field(default=POLICY_EVIDENCE_TIMELINE_CONTRACT_ID)
    safety_framing: PolicyEvidenceTimelineSafetyFraming
    policy_id: str
    scope_summary: str = Field(
        ...,
        description="Whether the window is full, partial, or current-snapshot-only.",
    )
    entries: list[PolicyEvidenceTimelineEntry] = Field(default_factory=list)
    missing_evidence_notes: list[str] = Field(
        default_factory=list,
        description="Honest gaps when history, path-analysis, or persisted rows are partial.",
    )
