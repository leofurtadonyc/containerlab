"""Evidence quality workspace v1 (Phase 2, read-only).

See ``platform/docs/evidence-quality-workspace-contract.md``.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata

EVIDENCE_QUALITY_WORKSPACE_V1_CONTRACT_ID = "evidence_quality_workspace_v1"

EvidenceQualityDimension = Literal[
    "collection_assurance",
    "read_path_fragility",
    "fallback_conditions",
    "sparse_history_anchors",
    "comparison_limits",
    "unsupported_partial_detail",
    "cross_domain_scope_note",
]

EvidenceQualitySubjectDomain = Literal[
    "platform_read_paths",
    "platform_recovery",
    "devices",
    "policies",
    "topology",
    "capabilities",
    "global",
]

ReadPathReliabilityPosture = Literal[
    "bounded_ok",
    "mixed_degraded",
    "heavily_limited",
]

EvidenceQualityExplicitNonClaim = Literal[
    "not_validation_or_approval",
    "not_remediation_playbook",
    "not_root_cause_authority",
    "not_unified_quality_score",
    "not_substitute_evidence_consistency",
    "not_substitute_operational_stability",
    "not_grafana_semantics",
]

DEFAULT_EVIDENCE_QUALITY_EXPLICIT_NON_CLAIMS: list[EvidenceQualityExplicitNonClaim] = [
    "not_validation_or_approval",
    "not_remediation_playbook",
    "not_root_cause_authority",
    "not_unified_quality_score",
    "not_substitute_evidence_consistency",
    "not_substitute_operational_stability",
    "not_grafana_semantics",
]


class EvidenceQualitySafetyFraming(BaseModel):
    contract_id: str = Field(default=EVIDENCE_QUALITY_WORKSPACE_V1_CONTRACT_ID)
    authority_posture: Literal["interpretation_support_only", "read_only_assembly_non_authoritative"] = (
        "interpretation_support_only"
    )
    explicit_non_claims: list[EvidenceQualityExplicitNonClaim] = Field(
        default_factory=lambda: list(DEFAULT_EVIDENCE_QUALITY_EXPLICIT_NON_CLAIMS)
    )
    phase: Literal["phase_2_read_only_foundation"] = "phase_2_read_only_foundation"
    summary_disclaimer: str = Field(
        default=(
            "Evidence quality workspace v1 explains read-path limits, fallback posture, history gates, and comparison "
            "honesty using existing Phase 2 fields only. It does not validate changes, prescribe remediation, score "
            "overall health, or replace evidence-consistency or operational-stability summaries."
        )
    )


class EvidenceQualityRow(BaseModel):
    """One auditable evidence-quality observation derived from cited sources."""

    evidence_quality_dimension: EvidenceQualityDimension
    evidence_subject_domain: EvidenceQualitySubjectDomain
    summary: str
    detail: str | None = None
    source_citations: list[str] = Field(
        default_factory=list,
        description="Stable references such as GET paths used as assembly inputs.",
    )


class EvidenceQualitySummaryResponse(BaseModel):
    """Cross-domain evidence quality / collection assurance summary (Phase 2 read-only)."""

    metadata: ApiResponseMetadata
    contract_id: str = Field(default=EVIDENCE_QUALITY_WORKSPACE_V1_CONTRACT_ID)
    safety_framing: EvidenceQualitySafetyFraming
    read_path_reliability_posture: ReadPathReliabilityPosture
    collection_assurance_summary: str = Field(
        description=(
            "Short plain-language roll-up of collector/read-path posture from platform status read_paths—"
            "interpretation support only."
        ),
    )
    scope_summary: str
    sync_runs_limit_applied: int = Field(
        ge=1,
        le=100,
        description="Bounded window aligned with other summaries; reserved for embedded assemblies.",
    )
    rows: list[EvidenceQualityRow] = Field(default_factory=list)
    caveats: list[str] = Field(default_factory=list)
    assembly_notes: list[str] = Field(
        default_factory=list,
        description="Bounded notes when a source assembly failed partially.",
    )
