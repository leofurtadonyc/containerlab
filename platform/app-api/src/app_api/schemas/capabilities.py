"""Typed schemas for capability responses."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata

SupportStatus = Literal[
    "supported",
    "partially_supported",
    "unsupported",
    "unknown",
    "not_implemented_in_platform",
]
WorkflowReadinessStatus = Literal[
    "supports_planning",
    "partial_foundation",
    "blocked",
    "roadmap_only",
    "context_only",
]
WorkflowReadinessScope = Literal[
    "planning_depth",
    "preview_contracts",
    "validation_contracts",
    "workflow_audit_relationships",
    "phase_transition",
]
ReadinessBlockerName = Literal[
    "workflow_lifecycle_contract_missing",
    "dry_run_contract_missing",
    "validation_result_contract_missing",
    "topology_truth_still_bounded",
    "policy_truth_still_bounded",
    "history_still_sync_derived",
]
CapabilityEvidenceBasis = Literal[
    "live_validated",
    "persisted_validated",
    "platform_probe",
    "design_review",
    "roadmap_only",
]


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
    support_status: SupportStatus
    implementation_status: Literal["planned", "placeholder", "partial", "implemented"]
    delivery_tier: Literal[
        "delivered_read_only",
        "bounded_partial_read_only",
        "future_roadmap",
        "out_of_scope",
    ]
    evidence_basis: CapabilityEvidenceBasis
    vendor_posture: Literal[
        "current_nokia_focus",
        "future_juniper_target",
        "future_multi_vendor_candidate",
    ]
    availability_scope: str
    status_detail: str
    caveats: list[str]
    source_of_determination: str
    workflow_readiness_status: WorkflowReadinessStatus
    workflow_readiness_scopes: list[WorkflowReadinessScope] = Field(default_factory=list)
    workflow_readiness_detail: str
    related_readiness_blockers: list[ReadinessBlockerName] = Field(default_factory=list)


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
    support_posture: SupportStatus
    evidence_basis: CapabilityEvidenceBasis
    evidence_coverage: Literal["strong", "bounded", "partial", "blocked"]
    related_capabilities: list[str] = Field(default_factory=list)
    current_evidence: str
    blocking_gaps: list[str] = Field(default_factory=list)


class DryRunReadinessBlocker(BaseModel):
    """One explicit blocker that still prevents workflow-grade readiness."""

    blocker: ReadinessBlockerName
    category: Literal["contract", "truth", "history"]
    severity: Literal["critical", "major"]
    evidence_basis: CapabilityEvidenceBasis
    summary: str
    blocked_readiness_scopes: list[WorkflowReadinessScope] = Field(default_factory=list)
    related_prerequisites: list[
        Literal[
            "inventory_read_model",
            "topology_comparison_evidence",
            "policy_comparison_evidence",
            "workflow_audit_visibility",
            "capability_matrix_precision",
        ]
    ] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class DryRunReadinessAssessmentArea(BaseModel):
    """Stricter evidence-based readiness assessment for one foundation area."""

    area: Literal[
        "model_maturity",
        "history_maturity",
        "comparison_maturity",
        "capability_maturity",
        "blocker_maturity",
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
    evidence_coverage_counts: dict[str, int] = Field(default_factory=dict)
    support_posture_counts: dict[str, int] = Field(default_factory=dict)
    blocker_category_counts: dict[str, int] = Field(default_factory=dict)
    blocker_severity_counts: dict[str, int] = Field(default_factory=dict)
    blocked_scope_counts: dict[str, int] = Field(default_factory=dict)
    assessment_areas: list[DryRunReadinessAssessmentArea]
    blockers: list[DryRunReadinessBlocker]
    prerequisites: list[DryRunReadinessPrerequisite]


class CapabilitiesListResponse(ApiResponseMetadata):
    """Read-only capability matrix response."""

    data_status: Literal["placeholder", "bounded_matrix"]
    summary: str
    count: int
    readiness_persisted_at: datetime | None = None
    domain_counts: dict[str, int] = Field(default_factory=dict)
    support_counts: dict[str, int] = Field(default_factory=dict)
    implementation_counts: dict[str, int] = Field(default_factory=dict)
    delivery_tier_counts: dict[str, int] = Field(default_factory=dict)
    evidence_basis_counts: dict[str, int] = Field(default_factory=dict)
    vendor_counts: dict[str, int] = Field(default_factory=dict)
    vendor_posture_counts: dict[str, int] = Field(default_factory=dict)
    workflow_readiness_counts: dict[str, int] = Field(default_factory=dict)
    workflow_readiness_scope_counts: dict[str, int] = Field(default_factory=dict)
    dry_run_readiness: DryRunReadinessSummary
    items: list[CapabilityRecord]
