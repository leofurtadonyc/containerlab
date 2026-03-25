"""Service Dossier v1 — composed read-side assembly for one ``service_id`` (Phase 2, read-only).

See ``platform/docs/service-dossier-contract.md``.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.maintenance_preview import MaintenancePreviewResponse
from app_api.schemas.policy_explainability import PolicyExplainabilityResponse
from app_api.schemas.service_explorer import ServiceDetailResponse

SERVICE_DOSSIER_V1_CONTRACT_ID = "service_dossier_v1"

DEFAULT_SERVICE_DOSSIER_EXPLICIT_NON_CLAIMS: list[str] = [
    "not_sla_or_availability_proof",
    "not_billing_or_entitlement_truth",
    "not_end_to_end_traffic_flow_proof",
    "not_full_service_dependency_or_blast_radius_truth",
    "not_workflow_approval_or_maintenance_authority",
    "not_multi_vendor_parity_proof",
    "not_substitute_for_full_service_explorer_policy_dossier_or_topology_panels",
    "not_grafana_or_prometheus_business_truth",
]


class ServiceDossierSafetyFraming(BaseModel):
    """Honesty framing for service dossier v1 (interpretation support only)."""

    contract_id: str = Field(default=SERVICE_DOSSIER_V1_CONTRACT_ID)
    authority_posture: Literal["interpretation_support_only"] = "interpretation_support_only"
    explicit_non_claims: list[str] = Field(
        default_factory=lambda: list(DEFAULT_SERVICE_DOSSIER_EXPLICIT_NON_CLAIMS),
    )
    phase: Literal["phase_2_read_only_foundation"] = "phase_2_read_only_foundation"
    summary_disclaimer: str = Field(
        default=(
            "Service Dossier v1 composes existing Phase 2 read-only assemblies (Service Explorer detail, "
            "optional policy explainability for one default member, optional maintenance preview for one "
            "linked topology subject). It does not score SLA, approve change, or prove dataplane impact."
        ),
    )


class ServiceDossierResponse(ApiResponseMetadata):
    """Composed workspace for one ``service_id`` — assembly-only; no new truth domains."""

    contract_id: Literal["service_dossier_v1"] = SERVICE_DOSSIER_V1_CONTRACT_ID
    safety_framing: ServiceDossierSafetyFraming = Field(default_factory=ServiceDossierSafetyFraming)
    service_explorer_detail: ServiceDetailResponse = Field(
        ...,
        description="Authoritative Service Explorer v1 detail for this service_id (same as GET /services/{id}).",
    )
    default_member_policy_id: str = Field(
        ...,
        description="Member chosen for optional explainability (worst degraded_policy_v1 posture, then lexicographic policy_id).",
    )
    member_posture_counts: dict[str, int] = Field(
        ...,
        description="Counts of degraded_policy_v1.posture values across members (ok / degraded / unknown).",
    )
    policy_explainability: PolicyExplainabilityResponse | None = Field(
        default=None,
        description="Optional explainability workspace for default_member_policy_id when assembly succeeds.",
    )
    explainability_unavailable_note: str | None = Field(
        default=None,
        description="Set when explainability was not embedded (missing policy row or assembly failure).",
    )
    maintenance_preview: MaintenancePreviewResponse | None = Field(
        default=None,
        description="Optional maintenance preview for the first topology-linked node_id when related-policies resolves.",
    )
    maintenance_preview_subject_node_id: str | None = Field(
        default=None,
        description="Topology node_id used when maintenance_preview is present (first Explorer link).",
    )
    maintenance_unavailable_note: str | None = Field(
        default=None,
        description="Why maintenance preview was omitted (no linkage, unknown object, or bounded read failure).",
    )
    merged_caveats: list[str] = Field(
        default_factory=list,
        description="Ordered deduped caveats from nested assemblies and framing.",
    )
    missing_evidence_notes: list[str] = Field(
        default_factory=list,
        description="Explicit gaps (not hidden completeness).",
    )
    source_contract_ids: list[str] = Field(
        ...,
        description="contract_id values composed in this response (depth-first, first-seen order).",
    )
    recommended_api_pivots: list[str] = Field(
        default_factory=list,
        description="Read-only API paths for drill-down (Service Explorer, explainability, maintenance, impact report).",
    )
    investigation_pivot_hint: str = Field(
        ...,
        description="Shell breadcrumb hint (inv_from=service_dossier); navigation-only.",
    )
    sparse_dossier: bool = Field(
        ...,
        description="True when inventory is degraded/empty, nested assemblies are partial, or optional sections are missing.",
    )
    sparse_reasons: list[str] = Field(
        default_factory=list,
        description="Why the dossier is sparse (explicit, not silent).",
    )
