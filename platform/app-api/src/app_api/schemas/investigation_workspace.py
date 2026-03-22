"""Bounded investigation-workspace contract types (Phase 2, read-only).

This module defines **backend-owned vocabulary** for assembling **interpretation
support** in a coherent operator investigation workspace from **existing**
read-side evidence only. It does not perform I/O.

Relationship to week **24**: **change intelligence** supplies a cross-domain
**recent-change** summary; an investigation workspace may **include** that
summary as **one** context source alongside **current posture** (e.g. platform
status) and per-domain surfaces—it does **not** re-derive per-record comparison
math or duplicate change-intelligence aggregation semantics.

See: ``platform/docs/investigation-workspace-contract.md``.
"""

from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.capabilities import CapabilitiesListResponse
from app_api.schemas.change_intelligence import RecentChangeSummaryResponse
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.platform import PlatformStatusResponse

INVESTIGATION_WORKSPACE_CONTRACT_ID = "investigation_workspace_phase2_v1"
"""Stable identifier for this contract revision (bump when vocabulary changes)."""

InvestigationContextDomain = Literal[
    "devices",
    "topology",
    "policies",
    "readiness",
    "workflow_history",
    "audit_history",
    "change_intelligence",
    "platform_status",
    "capabilities",
]
"""Sources that may contribute **bounded** context to an investigation workspace.

- ``change_intelligence``: cross-domain recent-change summary contract
  (``GET /api/v1/change-intelligence/recent-summary``), not a separate truth domain.
- ``platform_status``: current platform status / recovery / read-path posture
  from the platform status API—not Grafana dashboards as authority.

Each source remains subject to its own API contracts and partiality limits.
"""

InvestigationWorkspaceAuthorityPosture = Literal[
    "interpretation_support_only",
    "read_only_assembly_non_authoritative",
]
"""How operators must read any investigation workspace assembly.

Phase 2: always non-authoritative—assembly organizes visibility; it does not
approve changes, authorize actions, or validate intent.
"""

InvestigationWorkspaceExplicitNonClaim = Literal[
    "not_validation_verdict",
    "not_drift_engine_result",
    "not_safe_to_change_recommendation",
    "not_workflow_execution_or_authorization",
    "not_dry_run_execution",
    "not_new_collector_truth_domain",
    "not_cross_domain_completeness_guarantee",
    "not_implied_risk_or_confidence_score",
]
"""Stable keys for explicit **non-goals** (API metadata, docs, product copy)."""

DEFAULT_INVESTIGATION_WORKSPACE_EXPLICIT_NON_CLAIMS: list[InvestigationWorkspaceExplicitNonClaim] = [
    "not_validation_verdict",
    "not_drift_engine_result",
    "not_safe_to_change_recommendation",
    "not_workflow_execution_or_authorization",
    "not_dry_run_execution",
    "not_new_collector_truth_domain",
    "not_cross_domain_completeness_guarantee",
    "not_implied_risk_or_confidence_score",
]

InvestigationSuggestionRule = Literal[
    "evidence_backed_read_only_surfaces_only",
    "optional_next_product_surfaces_without_preference_ordering",
]
"""How bounded 'next place to look' hints may be expressed—never as execution."""

NEXT_INSPECTION_FRAMING = (
    "These hints are optional read-only navigation prompts derived from fields already "
    "present in this assembly. They are not validation verdicts, safe-to-change guidance, "
    "or ranked execution steps. Suggestion order is sorted by suggestion_id and does not "
    "imply an operator action sequence."
)
"""Stable copy surfaced alongside ``next_inspection_suggestions`` (Phase 2)."""


class InvestigationNextInspectionSuggestion(BaseModel):
    """One bounded 'where to look next' hint—evidence navigation only."""

    suggestion_id: str = Field(
        ...,
        description=(
            "Stable identifier for tests and support; responses sort by this field. "
            "Not a priority rank."
        ),
    )
    context_domain: InvestigationContextDomain
    framing_rule: InvestigationSuggestionRule = "evidence_backed_read_only_surfaces_only"
    headline: str
    rationale: str


class InvestigationWorkspaceSafetyFraming(BaseModel):
    """Standard safety framing for investigation workspace responses."""

    contract_id: str = Field(default=INVESTIGATION_WORKSPACE_CONTRACT_ID)
    authority_posture: InvestigationWorkspaceAuthorityPosture
    explicit_non_claims: list[InvestigationWorkspaceExplicitNonClaim] = Field(
        default_factory=lambda: list(DEFAULT_INVESTIGATION_WORKSPACE_EXPLICIT_NON_CLAIMS)
    )
    phase: Literal["phase_2_read_only_foundation"] = "phase_2_read_only_foundation"
    summary_disclaimer: str = Field(
        default=(
            "Investigation workspace assemblies combine existing read-side evidence for "
            "operator interpretation. They are not validation verdicts, drift detection "
            "results, safe-to-change recommendations, workflow authorization, or dry-run "
            "execution."
        )
    )


class InvestigationContextAssemblyResponse(BaseModel):
    """Backend-owned read-only assembly of existing evidence for operator investigation.

    Composes **nested** responses already defined by their own contracts—no new
    persistence, scoring, or cross-domain authority. Missing or partial evidence
    remains explicit inside each nested payload.
    """

    metadata: ApiResponseMetadata
    safety: InvestigationWorkspaceSafetyFraming
    assembly_notes: list[str] = Field(
        default_factory=list,
        description=(
            "Bounded explanation of what was assembled; not a verdict or recommendation."
        ),
    )
    recent_change: RecentChangeSummaryResponse
    platform_status: PlatformStatusResponse
    capabilities: CapabilitiesListResponse
    next_inspection_framing: str = Field(
        default=NEXT_INSPECTION_FRAMING,
        description="Explicit non-authority copy for optional next-inspection hints.",
    )
    next_inspection_suggestions: list[InvestigationNextInspectionSuggestion] = Field(
        default_factory=list,
        description=(
            "Bounded navigation prompts from nested evidence only; no scoring or workflow semantics."
        ),
    )
