"""Operator briefing workspace v1 — composed read-side assembly (Phase 2).

See ``platform/docs/operator-briefing-workspace-contract.md``.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.delta_digest import CrossDomainDeltaDigestResponse
from app_api.schemas.evidence_pack import SituationPackAssemblyResponse
from app_api.schemas.investigation_workspace import InvestigationContextAssemblyResponse
from app_api.schemas.policy_dossier import PolicyDossierResponse
from app_api.schemas.topology_object_dossier import TopologyObjectDossierResponse

OPERATOR_BRIEFING_CONTRACT_ID = "operator_briefing_workspace_v1"

OperatorBriefingExplicitNonClaim = Literal[
    "not_change_approval",
    "not_incident_command",
    "not_unified_cross_domain_truth",
    "not_validation_or_drift_verdict",
    "not_workflow_execution_truth",
    "not_grafana_or_metrics_substitute",
    "not_guaranteed_completeness",
]

DEFAULT_OPERATOR_BRIEFING_EXPLICIT_NON_CLAIMS: list[OperatorBriefingExplicitNonClaim] = [
    "not_change_approval",
    "not_incident_command",
    "not_unified_cross_domain_truth",
    "not_validation_or_drift_verdict",
    "not_workflow_execution_truth",
    "not_grafana_or_metrics_substitute",
    "not_guaranteed_completeness",
]


class OperatorBriefingSafetyFraming(BaseModel):
    """Honesty framing for the briefing assembly."""

    contract_id: str = Field(default=OPERATOR_BRIEFING_CONTRACT_ID)
    authority_posture: Literal["interpretation_support_only"] = "interpretation_support_only"
    explicit_non_claims: list[OperatorBriefingExplicitNonClaim] = Field(
        default_factory=lambda: list(DEFAULT_OPERATOR_BRIEFING_EXPLICIT_NON_CLAIMS),
    )
    phase: Literal["phase_2_read_only_foundation"] = "phase_2_read_only_foundation"
    summary_disclaimer: str = Field(
        default=(
            "This response composes existing Phase 2 read-only workspaces only (delta digest, optional "
            "dossiers, situation pack, investigation context). It does not approve changes, command "
            "incidents, or replace live product pages, Grafana, or authoritative per-domain APIs."
        ),
    )


class OperatorBriefingContextEcho(BaseModel):
    """Echo of bounded query context (client hints are not authority)."""

    sync_runs_limit_requested: int = Field(
        ...,
        ge=1,
        le=100,
        description="Bounded window aligned with nested assemblies.",
    )
    policy_id: str | None = Field(default=None, description="Optional policy scope for dossier preview.")
    topology_object: str | None = Field(
        default=None,
        description="Optional topology object id for dossier preview.",
    )
    topology_object_kind: Literal["node", "link"] | None = Field(
        default=None,
        description="Optional client echo of object kind; server uses dossier identity when present.",
    )
    inv_from_client_hint: str | None = Field(
        default=None,
        description="Client-only breadcrumb echo (shell); not validated as authority.",
    )
    global_search_q_client_hint: str | None = Field(
        default=None,
        description="Client-only echo of operator search query when applicable.",
    )


BriefingSectionKey = Literal[
    "briefing_context",
    "delta_digest",
    "policy_dossier",
    "topology_object_dossier",
    "situation_room",
    "investigation_workspace",
]

BriefingEvidenceStatus = Literal["present", "partial", "absent", "unavailable"]


class OperatorBriefingSectionMeta(BaseModel):
    """Per-section caveats and freshness for one composed workspace."""

    section_key: BriefingSectionKey
    evidence_status: BriefingEvidenceStatus
    caveats: list[str] = Field(default_factory=list)
    freshness_lines: list[str] = Field(
        default_factory=list,
        description="Echo of generated_at or serving hints where applicable.",
    )
    error_note: str | None = Field(
        default=None,
        description="Assembly failure or honest absence (e.g. policy row not found).",
    )


class OperatorBriefingWorkspaceResponse(BaseModel):
    """Single bounded briefing composed from existing Phase 2 assemblies only."""

    metadata: ApiResponseMetadata
    contract_id: str = Field(default=OPERATOR_BRIEFING_CONTRACT_ID)
    safety: OperatorBriefingSafetyFraming = Field(default_factory=OperatorBriefingSafetyFraming)
    sync_runs_limit_applied: int
    briefing_context: OperatorBriefingContextEcho
    delta_digest: CrossDomainDeltaDigestResponse | None = Field(
        default=None,
        description="Embedded cross_domain_delta_digest_v1 when assembly succeeds.",
    )
    delta_digest_error: str | None = Field(
        default=None,
        description="Set when delta digest assembly fails entirely.",
    )
    policy_dossier: PolicyDossierResponse | None = None
    policy_dossier_note: str | None = Field(
        default=None,
        description="e.g. not_requested | policy_not_found | assembly_unavailable",
    )
    topology_object_dossier: TopologyObjectDossierResponse | None = None
    topology_object_dossier_note: str | None = Field(
        default=None,
        description="e.g. not_requested | object_not_found | kind_mismatch | assembly_unavailable",
    )
    situation_pack: SituationPackAssemblyResponse | None = None
    situation_pack_error: str | None = None
    investigation_workspace: InvestigationContextAssemblyResponse | None = None
    investigation_workspace_error: str | None = None
    section_meta: list[OperatorBriefingSectionMeta] = Field(
        default_factory=list,
        description="Parallel honesty strip for each composed section.",
    )
    merged_caveats: list[str] = Field(
        default_factory=list,
        description="Deduped high-signal caveat lines from nested payloads (bounded list).",
    )
    recommended_pivots: list[str] = Field(
        default_factory=list,
        description="Shell routes and export paths for live workspaces (read-only navigation).",
    )
