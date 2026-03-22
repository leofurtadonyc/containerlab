"""Bounded operator evidence-pack contract types (Phase 2, read-only).

This module defines **backend-owned vocabulary** for a composed **operator
evidence pack** (situation-room style artifact): read-only assembly of
**existing** evidence surfaces—current posture, recent change signals, bounded
history context, and **honest gaps**—without inventing validation engines,
execution authority, or synthetic risk scoring. It does not perform I/O.

Relationship to week **25**: an **investigation workspace** assembly (see
``investigation_workspace``) is **one** allowed **context source** named
``investigation_context`` here; an evidence pack is a **broader** composed
product lane that may also surface workflow/audit history context and explicit
gap language alongside the same domains—**not** a duplicate of investigation
routing or change-intelligence aggregation math.

See: ``platform/docs/evidence-pack-contract.md``.
"""

from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.audit_history import AuditHistoryResponse
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.devices import DevicesListResponse
from app_api.schemas.investigation_workspace import InvestigationContextAssemblyResponse
from app_api.schemas.policies import PoliciesListResponse
from app_api.schemas.readiness_snapshot_history import ReadinessSnapshotHistoryResponse
from app_api.schemas.topology import TopologyResponse
from app_api.schemas.workflow_history import WorkflowHistoryResponse

EVIDENCE_PACK_CONTRACT_ID = "evidence_pack_phase2_v1"
"""Stable identifier for this contract revision (bump when vocabulary changes)."""

EvidencePackContentDomain = Literal[
    "devices",
    "topology",
    "policies",
    "readiness",
    "capabilities",
    "workflow_history",
    "audit_history",
    "change_intelligence",
    "platform_status",
    "investigation_context",
]
"""Sources that may contribute **bounded** content to an evidence pack.

- ``change_intelligence``: cross-domain recent-change summary (``recent-summary``).
- ``platform_status``: current platform status / recovery / read-path posture.
- ``investigation_context``: nested investigation-workspace assembly
  (``GET /api/v1/investigation-workspace/context``)—interpretation support only.
- ``workflow_history`` / ``audit_history``: sync-derived history surfaces—not
  workflow lifecycle execution or SOC-grade audit.

Each source remains subject to its own API contracts and partiality limits.
"""

EvidencePackAuthorityPosture = Literal[
    "interpretation_support_only",
    "read_only_assembly_non_authoritative",
]
"""How operators must read any evidence pack response or document using this contract.

Phase 2: always non-authoritative—the pack organizes visibility; it does not
approve changes, authorize actions, validate intent, or command execution.
"""

EvidencePackExplicitNonClaim = Literal[
    "not_validation_verdict",
    "not_drift_engine_result",
    "not_safe_to_change_recommendation",
    "not_workflow_execution_or_authorization",
    "not_dry_run_execution",
    "not_new_collector_truth_domain",
    "not_cross_domain_completeness_guarantee",
    "not_implied_risk_or_confidence_score",
    "not_incident_command_or_runbook_authority",
    "not_unified_forensic_or_workflow_timeline",
]
"""Stable keys for explicit **non-goals** (API metadata, docs, product copy)."""

DEFAULT_EVIDENCE_PACK_EXPLICIT_NON_CLAIMS: list[EvidencePackExplicitNonClaim] = [
    "not_validation_verdict",
    "not_drift_engine_result",
    "not_safe_to_change_recommendation",
    "not_workflow_execution_or_authorization",
    "not_dry_run_execution",
    "not_new_collector_truth_domain",
    "not_cross_domain_completeness_guarantee",
    "not_implied_risk_or_confidence_score",
    "not_incident_command_or_runbook_authority",
    "not_unified_forensic_or_workflow_timeline",
]

EvidencePackGuidanceRule = Literal[
    "evidence_backed_read_only_surfaces_only",
    "optional_gap_and_history_context_without_execution_steps",
]
"""How bounded guidance or gap callouts may be expressed—never as execution."""


class EvidencePackSafetyFraming(BaseModel):
    """Standard safety framing for evidence pack responses and documents."""

    contract_id: str = Field(default=EVIDENCE_PACK_CONTRACT_ID)
    authority_posture: EvidencePackAuthorityPosture
    explicit_non_claims: list[EvidencePackExplicitNonClaim] = Field(
        default_factory=lambda: list(DEFAULT_EVIDENCE_PACK_EXPLICIT_NON_CLAIMS)
    )
    phase: Literal["phase_2_read_only_foundation"] = "phase_2_read_only_foundation"
    summary_disclaimer: str = Field(
        default=(
            "Operator evidence packs assemble existing read-side evidence for "
            "interpretation in a single coherent view. They are not validation "
            "verdicts, drift detection results, incident command or runbook authority, "
            "safe-to-change recommendations, workflow authorization, or dry-run "
            "execution."
        )
    )


SITUATION_PACK_GUIDANCE_FRAMING = (
    "This situation pack composes existing read-side evidence surfaces only. "
    "Change intelligence, platform status, and capabilities are nested under "
    "investigation_context (same assembly as GET /api/v1/investigation-workspace/context); "
    "they are not repeated as separate top-level keys. Missing or partial evidence remains "
    "explicit inside each nested payload under its own contracts."
)

SITUATION_REVIEW_FRAMING = (
    "Optional review prompts below are read-only navigation hints derived from fields already "
    "present in this assembly. They are not validation verdicts, safe-to-change guidance, "
    "incident command, ranked execution steps, or approval to act. Prompt order is sorted by "
    "prompt_id and does not imply operator priority."
)

SituationReviewNavPromptRule = Literal[
    "evidence_navigation_only",
    "no_preference_ordering",
]
"""How situation-pack review prompts must be read—never as execution or approval."""


class SituationReviewNavigationPrompt(BaseModel):
    """One bounded 'where to look next' hint for the situation pack—navigation only."""

    prompt_id: str = Field(
        ...,
        description="Stable id for tests and support; sort order uses this field.",
    )
    headline: str
    rationale: str
    framing_rule: SituationReviewNavPromptRule = "evidence_navigation_only"
    product_view: str = Field(
        ...,
        description=(
            "WebUI shell `view` target (e.g. devices, workflows)—read-only navigation anchor."
        ),
    )


class SituationReviewGuidance(BaseModel):
    """Backend-owned bounded review framing and gap language for the situation pack."""

    review_framing: str = Field(
        default=SITUATION_REVIEW_FRAMING,
        description="Non-authority copy surfaced with review prompts and gap notes.",
    )
    explicit_missing_evidence_notes: list[str] = Field(
        default_factory=list,
        description=(
            "Evidence-backed missing/partiality notes from this assembly only—no synthetic scores."
        ),
    )
    review_navigation_prompts: list[SituationReviewNavigationPrompt] = Field(
        default_factory=list,
        description="Optional navigation prompts; not ranked safe-to-change steps.",
    )


class SituationPackAssemblyResponse(BaseModel):
    """Backend-owned read-only situation (evidence) pack from existing services only.

    Composes nested responses already defined by their own contracts—no new
    persistence, scoring, or cross-domain authority. Missing or partial evidence
    remains explicit inside each nested payload.
    """

    metadata: ApiResponseMetadata
    safety: EvidencePackSafetyFraming
    assembly_notes: list[str] = Field(
        default_factory=list,
        description=(
            "Bounded explanation of what was assembled; not a verdict or recommendation."
        ),
    )
    situation_pack_guidance_framing: str = Field(
        default=SITUATION_PACK_GUIDANCE_FRAMING,
        description=(
            "How to read nested investigation_context vs other domains without "
            "duplicating change/platform/capabilities at the top level."
        ),
    )
    situation_review_guidance: SituationReviewGuidance
    devices: DevicesListResponse
    topology: TopologyResponse
    policies: PoliciesListResponse
    readiness: ReadinessSnapshotHistoryResponse
    workflow_history: WorkflowHistoryResponse
    audit_history: AuditHistoryResponse
    investigation_context: InvestigationContextAssemblyResponse
