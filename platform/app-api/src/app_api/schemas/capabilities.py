"""Typed schemas for capability responses."""

from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata


class CapabilityRecord(BaseModel):
    """Vendor-neutral capability record for Phase 2 APIs."""

    vendor: str
    platform: str
    version_scope: str | None = None
    domain: Literal[
        "inventory",
        "topology",
        "policy",
        "platform_health",
        "workflow_history",
        "audit_history",
    ]
    feature: str
    support_status: Literal[
        "supported",
        "partially_supported",
        "unsupported",
        "unknown",
        "not_implemented_in_platform",
    ]
    implementation_status: Literal["planned", "placeholder", "partial", "implemented"]
    delivery_tier: Literal[
        "delivered_read_only",
        "bounded_partial_read_only",
        "future_roadmap",
        "out_of_scope",
    ]
    evidence_basis: Literal[
        "live_validated",
        "persisted_validated",
        "platform_probe",
        "design_review",
        "roadmap_only",
    ]
    vendor_posture: Literal[
        "current_nokia_focus",
        "future_juniper_target",
        "future_multi_vendor_candidate",
    ]
    availability_scope: str
    status_detail: str
    caveats: list[str]
    source_of_determination: str


class DryRunReadinessPrerequisite(BaseModel):
    """One bounded prerequisite used to assess future dry-run readiness."""

    prerequisite: Literal[
        "inventory_read_model",
        "topology_comparison_evidence",
        "policy_comparison_evidence",
        "workflow_audit_visibility",
        "capability_matrix_precision",
    ]
    status: Literal["ready", "partial", "not_ready"]
    current_evidence: str
    blocking_gaps: list[str]


class DryRunReadinessAssessmentArea(BaseModel):
    """Stricter evidence-based readiness assessment for one foundation area."""

    area: Literal[
        "model_maturity",
        "history_maturity",
        "comparison_maturity",
        "capability_maturity",
    ]
    status: Literal["strong_for_planning", "mixed", "blocked"]
    summary: str
    strongest_gaps: list[str]


class DryRunReadinessSummary(BaseModel):
    """Bounded non-executing summary of dry-run-readiness prerequisites."""

    status: Literal["foundation_strengthening", "bounded_readiness_support"]
    planning_readiness: Literal["readiness_planning_supported", "more_foundation_needed"]
    phase_recommendation: Literal["remain_phase_2_read_only_foundation"]
    summary: str
    readiness_scope: str
    notes: list[str]
    strongest_blockers: list[str]
    bounded_next_steps: list[str]
    assessment_areas: list[DryRunReadinessAssessmentArea]
    prerequisites: list[DryRunReadinessPrerequisite]


class CapabilitiesListResponse(ApiResponseMetadata):
    """Read-only capability matrix response."""

    data_status: Literal["placeholder", "bounded_matrix"]
    summary: str
    count: int
    domain_counts: dict[str, int] = Field(default_factory=dict)
    support_counts: dict[str, int] = Field(default_factory=dict)
    implementation_counts: dict[str, int] = Field(default_factory=dict)
    delivery_tier_counts: dict[str, int] = Field(default_factory=dict)
    evidence_basis_counts: dict[str, int] = Field(default_factory=dict)
    vendor_counts: dict[str, int] = Field(default_factory=dict)
    vendor_posture_counts: dict[str, int] = Field(default_factory=dict)
    dry_run_readiness: DryRunReadinessSummary
    items: list[CapabilityRecord]
