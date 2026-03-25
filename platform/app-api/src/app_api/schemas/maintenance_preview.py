"""Maintenance Preview v1 — bounded read-side assembly (Phase 2).

See ``platform/docs/maintenance-preview-contract.md``.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.failure_impact import FailureImpactViewResponse
from app_api.schemas.service_explorer import ServiceListRow
from app_api.schemas.topology import TopologyCoverageSummaryRecord
from app_api.schemas.topology_related_policies import TopologyObjectRelatedPoliciesResponse

MAINTENANCE_PREVIEW_CONTRACT_ID = "maintenance_preview_v1"

MaintenancePreviewContext = Literal[
    "planning_window",
    "topology_drilldown",
    "change_adjacent",
    "explicit_subject",
]

MaintenancePreviewExplicitNonClaim = Literal[
    "not_simulation_or_what_if_traffic_engine",
    "not_blast_radius_or_dependency_completeness",
    "not_safe_to_change_risk_scoring_or_approval",
    "not_maintenance_approval_or_change_control_authority",
    "not_traffic_or_protection_guarantee",
    "not_sla_or_availability_entitlement",
    "not_dataplane_forwarding_or_te_path_proof",
    "not_substitute_for_full_failure_impact_service_explorer_or_explainability_panels",
    "not_grafana_or_prometheus_business_truth",
    "not_operator_sign_off_or_audit_readiness",
]

DEFAULT_MAINTENANCE_PREVIEW_EXPLICIT_NON_CLAIMS: list[MaintenancePreviewExplicitNonClaim] = [
    "not_simulation_or_what_if_traffic_engine",
    "not_blast_radius_or_dependency_completeness",
    "not_safe_to_change_risk_scoring_or_approval",
    "not_maintenance_approval_or_change_control_authority",
    "not_traffic_or_protection_guarantee",
    "not_sla_or_availability_entitlement",
    "not_dataplane_forwarding_or_te_path_proof",
    "not_substitute_for_full_failure_impact_service_explorer_or_explainability_panels",
    "not_grafana_or_prometheus_business_truth",
    "not_operator_sign_off_or_audit_readiness",
]


class MaintenancePreviewSafetyFraming(BaseModel):
    """Honesty framing for maintenance preview v1."""

    contract_id: str = Field(default=MAINTENANCE_PREVIEW_CONTRACT_ID)
    authority_posture: Literal["interpretation_support_only"] = "interpretation_support_only"
    explicit_non_claims: list[MaintenancePreviewExplicitNonClaim] = Field(
        default_factory=lambda: list(DEFAULT_MAINTENANCE_PREVIEW_EXPLICIT_NON_CLAIMS),
    )
    phase: Literal["phase_2_read_only_foundation"] = "phase_2_read_only_foundation"
    summary_disclaimer: str = Field(
        default=(
            "Maintenance Preview v1 indexes existing Phase 2 read-only evidence (relationships, "
            "degraded posture, service groupings, topology partiality). It does not simulate failures, "
            "score safe-to-change, approve work, or prove dataplane impact."
        ),
    )


class MaintenanceSubjectSummary(BaseModel):
    """Canonical maintenance subject with topology display labels."""

    object_kind: Literal["node", "link"]
    object_id: str
    display_name: str = Field(
        ...,
        description="Node display_name or link_id echo (operator-facing label).",
    )
    source_node_id: str | None = Field(
        default=None,
        description="For links: source endpoint node_id when available.",
    )
    target_node_id: str | None = Field(
        default=None,
        description="For links: target endpoint node_id when available.",
    )


class MaintenanceExplainabilityPointer(BaseModel):
    """Per-policy deep-link hints (navigation only)."""

    policy_id: str
    policies_explainability_path: str = Field(
        ...,
        description="Relative API path template for policy explainability (GET).",
    )
    policies_path_analysis_path: str = Field(
        ...,
        description="Relative API path template for path-analysis (GET).",
    )


class MaintenanceTopologyImpactSection(BaseModel):
    """Topology partiality + coverage echo for maintenance planning (not impact simulation)."""

    coverage_summary: TopologyCoverageSummaryRecord
    topology_snapshot_observed_at: str | None = Field(
        default=None,
        description="ISO timestamp from topology snapshot when present.",
    )
    dossier_path: str = Field(
        ...,
        description="Relative GET path for topology object dossier for this subject.",
    )


class MaintenancePreviewResponse(BaseModel):
    """Read-only maintenance-oriented assembly over existing bounded contracts."""

    metadata: ApiResponseMetadata
    contract_id: Literal["maintenance_preview_v1"] = MAINTENANCE_PREVIEW_CONTRACT_ID
    safety_framing: MaintenancePreviewSafetyFraming
    preview_context: MaintenancePreviewContext
    source_contract_ids: list[str] = Field(
        ...,
        description="Contracts composed in this assembly (reuse-only; no new truth domains).",
    )
    subject: MaintenanceSubjectSummary
    sparse_preview: bool = Field(
        ...,
        description="True when related policies are empty, inventory is empty, or sections are truncated.",
    )
    sparse_reasons: list[str] = Field(
        default_factory=list,
        description="Why the preview is sparse (explicit empty, not hidden completeness).",
    )
    related_policies: TopologyObjectRelatedPoliciesResponse
    failure_impact: FailureImpactViewResponse
    related_services: list[ServiceListRow] = Field(
        ...,
        description="Service Explorer–style rows derived only from the related-policy set.",
    )
    related_services_total: int = Field(
        ge=0,
        description="Row count before any cap (honest truncation when lower than len(related_services)).",
    )
    related_services_truncated: bool = False
    topology_impact: MaintenanceTopologyImpactSection
    explainability_pointers: list[MaintenanceExplainabilityPointer] = Field(
        default_factory=list,
        description="Capped per-policy navigation hints (not proof of operational impact).",
    )
    recommended_pivots: list[str] = Field(
        default_factory=list,
        description="Shell navigation and API hints (same semantics as Service Explorer pivots).",
    )
    assembly_caveats: list[str] = Field(
        default_factory=list,
        description="Merged caveats including maintenance-preview framing and reuse notes.",
    )
