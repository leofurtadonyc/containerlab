"""Impact Report v1 — bounded read-side assembly for operator communication.

See ``platform/docs/impact-report-contract.md``.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.maintenance_preview import MaintenancePreviewResponse, MaintenanceSubjectSummary
from app_api.schemas.policy_dossier import PolicyDossierResponse
from app_api.schemas.service_explorer import ServiceDetailResponse

IMPACT_REPORT_CONTRACT_ID = "impact_report_v1"

ImpactReportContext = Literal["service_impact", "policy_impact", "maintenance_impact"]

ImpactReportExplicitNonClaim = Literal[
    "not_compliance_or_legal_artifact",
    "not_validation_record_or_test_sign_off",
    "not_incident_command_authority_or_operational_authorization",
    "not_safe_to_change_approval_or_maintenance_approval",
    "not_guaranteed_complete_dependency_or_underlay_proof",
    "not_tamper_evident_immutable_or_non_repudiation_evidence",
    "not_substitute_for_live_authoritative_read_apis_when_freshness_matters",
]

DEFAULT_IMPACT_REPORT_EXPLICIT_NON_CLAIMS: list[ImpactReportExplicitNonClaim] = [
    "not_compliance_or_legal_artifact",
    "not_validation_record_or_test_sign_off",
    "not_incident_command_authority_or_operational_authorization",
    "not_safe_to_change_approval_or_maintenance_approval",
    "not_guaranteed_complete_dependency_or_underlay_proof",
    "not_tamper_evident_immutable_or_non_repudiation_evidence",
    "not_substitute_for_live_authoritative_read_apis_when_freshness_matters",
]


class ImpactReportSafetyFraming(BaseModel):
    """Honesty framing for impact report v1."""

    contract_id: str = Field(default=IMPACT_REPORT_CONTRACT_ID)
    authority_posture: Literal["interpretation_support_only"] = "interpretation_support_only"
    explicit_non_claims: list[ImpactReportExplicitNonClaim] = Field(
        default_factory=lambda: list(DEFAULT_IMPACT_REPORT_EXPLICIT_NON_CLAIMS),
    )
    phase: Literal["phase_2_read_only_foundation"] = "phase_2_read_only_foundation"
    summary_disclaimer: str = Field(
        default=(
            "Impact Report v1 packages existing Phase 2 read-only evidence for operator communication. "
            "It is not compliance, validation, incident command, approval, or exhaustive dependency proof."
        ),
    )


class ImpactReportResponse(BaseModel):
    """Composed impact report: nested bodies reuse existing contracts only."""

    metadata: ApiResponseMetadata
    contract_id: Literal["impact_report_v1"] = IMPACT_REPORT_CONTRACT_ID
    report_context: ImpactReportContext
    safety_framing: ImpactReportSafetyFraming
    source_contract_ids: list[str] = Field(
        ...,
        description="Includes impact_report_v1 plus nested contract_id values (deduped order).",
    )
    scope_summary: str = Field(
        ...,
        description="Bounded narrative of what this report covers (read-side co-visibility only).",
    )
    explicit_excluded_concerns: list[str] = Field(
        default_factory=lambda: [
            "Blast-radius or traffic simulation",
            "SLA or availability entitlement",
            "Change approval or safe-to-change verdict",
            "Exhaustive graph or underlay discovery beyond inventory alignment",
        ],
    )
    sparse_report: bool = Field(
        ...,
        description="True when nested assemblies are empty, truncated, or materially partial.",
    )
    sparse_reasons: list[str] = Field(
        default_factory=list,
        description="Why the report is sparse (explicit; not hidden completeness).",
    )
    recommended_api_pivots: list[str] = Field(
        default_factory=list,
        description="Relative GET paths for follow-up (navigation only).",
    )

    anchor_service_id: str | None = None
    anchor_policy_id: str | None = None
    anchor_maintenance: MaintenanceSubjectSummary | None = None

    service_detail: ServiceDetailResponse | None = None
    policy_dossier: PolicyDossierResponse | None = None
    maintenance_preview: MaintenancePreviewResponse | None = None

    @model_validator(mode="after")
    def _anchors_match_context(self) -> ImpactReportResponse:
        ctx = self.report_context
        if ctx == "service_impact":
            if self.anchor_service_id is None:
                raise ValueError("service_impact requires anchor_service_id.")
            if self.service_detail is None:
                raise ValueError("service_impact requires service_detail.")
            if self.anchor_policy_id is not None or self.anchor_maintenance is not None:
                raise ValueError("service_impact must not set policy or maintenance anchors.")
            if self.policy_dossier is not None or self.maintenance_preview is not None:
                raise ValueError("service_impact must not include policy_dossier or maintenance_preview.")
        elif ctx == "policy_impact":
            if self.anchor_policy_id is None:
                raise ValueError("policy_impact requires anchor_policy_id.")
            if self.policy_dossier is None:
                raise ValueError("policy_impact requires policy_dossier.")
            if self.anchor_service_id is not None or self.anchor_maintenance is not None:
                raise ValueError("policy_impact must not set service or maintenance anchors.")
            if self.service_detail is not None or self.maintenance_preview is not None:
                raise ValueError("policy_impact must not include service_detail or maintenance_preview.")
        elif ctx == "maintenance_impact":
            if self.anchor_maintenance is None:
                raise ValueError("maintenance_impact requires anchor_maintenance.")
            if self.maintenance_preview is None:
                raise ValueError("maintenance_impact requires maintenance_preview.")
            if self.anchor_service_id is not None or self.anchor_policy_id is not None:
                raise ValueError("maintenance_impact must not set service or policy anchors.")
            if self.service_detail is not None or self.policy_dossier is not None:
                raise ValueError("maintenance_impact must not include service_detail or policy_dossier.")
        return self
