"""Evidence weakness explanation and next-best pivot v1 — Phase 2 read-only.

Semantic authority: ``platform/docs/evidence-weakness-explanation-contract.md``.
Composes with ``evidence_quality_workspace_v1`` rows; no new telemetry or scoring.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata

EVIDENCE_WEAKNESS_EXPLANATION_V1_CONTRACT_ID = "evidence_weakness_explanation_v1"

EvidenceWeaknessExplanationCategory = Literal[
    "collection_assurance_weak",
    "fallback_or_stale_serving",
    "sparse_history_or_anchors",
    "comparison_or_scope_limited",
    "partial_or_unsupported_detail",
    "cross_surface_scope_note",
]

NextBestPivotId = Literal[
    "open_devices_list",
    "open_topology_view",
    "open_policies_list",
    "open_platform_health",
    "open_capabilities",
    "open_service_explorer",
    "open_maintenance_evidence_workspace",
    "open_maintenance_window_workspace",
    "open_stability_workspace",
    "open_evidence_consistency_workspace",
    "open_investigation_workspace",
]


EvidenceWeaknessExplanationExplicitNonClaim = Literal[
    "advisory_navigation_only",
    "not_workflow_step_or_remediation",
    "not_approval_or_safe_to_change",
    "not_hidden_ranking_or_score",
    "not_substitute_investigation_next_inspection",
    "not_substitute_evidence_consistency_summary",
    "not_substitute_operational_stability_summary",
    "not_root_cause_beyond_cited_fields",
]

DEFAULT_EVIDENCE_WEAKNESS_EXPLICIT_NON_CLAIMS: list[EvidenceWeaknessExplanationExplicitNonClaim] = [
    "advisory_navigation_only",
    "not_workflow_step_or_remediation",
    "not_approval_or_safe_to_change",
    "not_hidden_ranking_or_score",
    "not_substitute_investigation_next_inspection",
    "not_substitute_evidence_consistency_summary",
    "not_substitute_operational_stability_summary",
    "not_root_cause_beyond_cited_fields",
]


class NextBestPivot(BaseModel):
    """Read-only navigation recommendation (bounded pivot v1)."""

    pivot_id: NextBestPivotId
    label: str
    route_family: str = Field(
        description="Declared GET path prefix and/or view= shell id; navigation hint only.",
    )
    rationale: str = Field(
        description="One sentence tying pivot to the explanation category; must not assert network outcome.",
    )
    cited_evidence_fields: list[str] | None = Field(
        default=None,
        description="Echo of existing response field paths or citations that motivated the pivot.",
    )


class EvidenceWeaknessExplanationBlock(BaseModel):
    """One workspace row plus explanation vocabulary and a single primary pivot."""

    explanation_category: EvidenceWeaknessExplanationCategory
    evidence_quality_dimension: str
    evidence_subject_domain: str
    row_summary: str = Field(description="Bounded echo of the evidence-quality row summary.")
    primary_next_best_pivot: NextBestPivot
    alternate_next_best_pivot: NextBestPivot | None = Field(
        default=None,
        description="Optional secondary pivot only when a deterministic tie-break applies (no numeric rank).",
    )


class EvidenceWeaknessExplanationSafetyFraming(BaseModel):
    contract_id: str = Field(default=EVIDENCE_WEAKNESS_EXPLANATION_V1_CONTRACT_ID)
    authority_posture: Literal["advisory_read_only_navigation", "interpretation_support_only"] = (
        "advisory_read_only_navigation"
    )
    explicit_non_claims: list[EvidenceWeaknessExplanationExplicitNonClaim] = Field(
        default_factory=lambda: list(DEFAULT_EVIDENCE_WEAKNESS_EXPLICIT_NON_CLAIMS)
    )
    phase: Literal["phase_2_read_only_foundation"] = "phase_2_read_only_foundation"
    summary_disclaimer: str = Field(
        default=(
            "Evidence weakness explanation v1 maps evidence-quality rows to plain-language categories and "
            "read-only next-best pivots. It does not prescribe remediation, approval, investigation next-inspection, "
            "evidence-consistency resolution, or operational-stability analysis."
        )
    )


class EvidenceWeaknessExplanationResponse(BaseModel):
    metadata: ApiResponseMetadata
    contract_id: str = Field(default=EVIDENCE_WEAKNESS_EXPLANATION_V1_CONTRACT_ID)
    safety_framing: EvidenceWeaknessExplanationSafetyFraming
    sync_runs_limit_applied: int = Field(ge=1, le=100)
    blocks: list[EvidenceWeaknessExplanationBlock] = Field(default_factory=list)
    caveats: list[str] = Field(default_factory=list)
    assembly_notes: list[str] = Field(
        default_factory=list,
        description="Propagated from evidence-quality workspace when source assemblies partially fail.",
    )
