"""Change Safety Case v1 — bounded pre-change read-side assembly (Phase 2).

See ``platform/docs/change-safety-case-contract.md``.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.maintenance_preview import MaintenancePreviewResponse, MaintenanceSubjectSummary
from app_api.schemas.policy_dossier import PolicyDossierResponse
from app_api.schemas.policy_explainability import PolicyExplainabilityResponse
from app_api.schemas.service_dossier import ServiceDossierResponse

CHANGE_SAFETY_CASE_CONTRACT_ID = "change_safety_case_v1"

ChangeSafetyCaseContext = Literal[
    "policy_change_safety",
    "service_change_safety",
    "topology_change_safety",
]

ChangeSafetyCaseExplicitNonClaim = Literal[
    "not_dry_run_or_simulation",
    "not_validation_authority",
    "not_approval_or_authorization",
    "not_safe_to_change_truth",
    "not_rollback_or_execution_planning",
    "not_guaranteed_complete_dependency_or_underlay_proof",
    "not_substitute_for_live_authoritative_read_apis_when_freshness_matters",
]

DEFAULT_CHANGE_SAFETY_CASE_EXPLICIT_NON_CLAIMS: list[ChangeSafetyCaseExplicitNonClaim] = [
    "not_dry_run_or_simulation",
    "not_validation_authority",
    "not_approval_or_authorization",
    "not_safe_to_change_truth",
    "not_rollback_or_execution_planning",
    "not_guaranteed_complete_dependency_or_underlay_proof",
    "not_substitute_for_live_authoritative_read_apis_when_freshness_matters",
]


class ChangeSafetyCaseSafetyFraming(BaseModel):
    """Honesty framing for change safety case v1."""

    contract_id: str = Field(default=CHANGE_SAFETY_CASE_CONTRACT_ID)
    authority_posture: Literal["pre_change_interpretation_only"] = "pre_change_interpretation_only"
    explicit_non_claims: list[ChangeSafetyCaseExplicitNonClaim] = Field(
        default_factory=lambda: list(DEFAULT_CHANGE_SAFETY_CASE_EXPLICIT_NON_CLAIMS),
    )
    phase: Literal["phase_2_read_only_foundation"] = "phase_2_read_only_foundation"
    summary_disclaimer: str = Field(
        default=(
            "Change Safety Case v1 composes existing Phase 2 read-only evidence to support pre-change "
            "understanding posture. It is not dry-run output, validation, approval, safe-to-change truth, "
            "or execution planning."
        ),
    )


class ChangeSafetyCaseResponse(BaseModel):
    """Composed change safety case: nested bodies reuse existing contracts only."""

    metadata: ApiResponseMetadata
    contract_id: Literal["change_safety_case_v1"] = CHANGE_SAFETY_CASE_CONTRACT_ID
    safety_case_context: ChangeSafetyCaseContext
    safety_framing: ChangeSafetyCaseSafetyFraming
    source_contract_ids: list[str] = Field(
        ...,
        description="Includes change_safety_case_v1 plus nested contract_id values (deduped order).",
    )
    understanding_posture_summary: str = Field(
        ...,
        description="Bounded vocabulary synthesis—no invented scores or approval language.",
    )
    evidence_inventory: list[str] = Field(
        ...,
        description="Which source families were considered (transparency).",
    )
    merged_caveats: list[str] = Field(default_factory=list)
    evidence_gaps: list[str] = Field(
        ...,
        description="Required first-class unknowns / missing assemblies.",
    )
    next_review_guidance: list[str] = Field(
        default_factory=list,
        description="Interpretation-only follow-up suggestions (not schedules or authorization).",
    )
    recommended_api_pivots: list[str] = Field(
        default_factory=list,
        description="Relative GET paths for follow-up (navigation only).",
    )
    investigation_situation_briefing_pivot_hints: list[str] = Field(
        default_factory=list,
        description="Shell / query hints for investigation, situation room, briefing—navigation only.",
    )
    sparse_case: bool = Field(
        ...,
        description="True when nested assemblies are empty, truncated, or materially partial.",
    )
    sparse_reasons: list[str] = Field(default_factory=list)

    anchor_policy_id: str | None = None
    anchor_service_id: str | None = None
    anchor_maintenance: MaintenanceSubjectSummary | None = None

    policy_dossier: PolicyDossierResponse | None = None
    policy_explainability: PolicyExplainabilityResponse | None = None
    service_dossier: ServiceDossierResponse | None = None
    maintenance_preview: MaintenancePreviewResponse | None = None

    @model_validator(mode="after")
    def _anchors_match_context(self) -> ChangeSafetyCaseResponse:
        ctx = self.safety_case_context
        if ctx == "policy_change_safety":
            if self.anchor_policy_id is None:
                raise ValueError("policy_change_safety requires anchor_policy_id.")
            if self.policy_dossier is None:
                raise ValueError("policy_change_safety requires policy_dossier.")
            if self.anchor_service_id is not None or self.anchor_maintenance is not None:
                raise ValueError("policy_change_safety must not set service or topology anchors.")
            if self.service_dossier is not None or self.maintenance_preview is not None:
                raise ValueError("policy_change_safety must not include service_dossier or maintenance_preview.")
        elif ctx == "service_change_safety":
            if self.anchor_service_id is None:
                raise ValueError("service_change_safety requires anchor_service_id.")
            if self.service_dossier is None:
                raise ValueError("service_change_safety requires service_dossier.")
            if self.anchor_policy_id is not None or self.anchor_maintenance is not None:
                raise ValueError("service_change_safety must not set policy or topology anchors.")
            if self.policy_dossier is not None or self.maintenance_preview is not None:
                raise ValueError("service_change_safety must not include policy_dossier or maintenance_preview.")
        elif ctx == "topology_change_safety":
            if self.anchor_maintenance is None:
                raise ValueError("topology_change_safety requires anchor_maintenance.")
            if self.maintenance_preview is None:
                raise ValueError("topology_change_safety requires maintenance_preview.")
            if self.anchor_policy_id is not None or self.anchor_service_id is not None:
                raise ValueError("topology_change_safety must not set policy or service anchors.")
            if self.policy_dossier is not None or self.service_dossier is not None:
                raise ValueError("topology_change_safety must not include policy_dossier or service_dossier.")
        return self
