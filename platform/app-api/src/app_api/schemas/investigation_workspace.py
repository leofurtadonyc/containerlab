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
