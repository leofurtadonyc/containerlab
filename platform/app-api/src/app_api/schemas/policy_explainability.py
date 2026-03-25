"""Policy Explainability Workspace v1 read contract (Phase 2, read-only).

Composes existing bounded contracts only; no new scoring or workflow authority.
See ``platform/docs/policy-explainability-workspace-contract.md``.
"""

from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.path_analysis import PathAnalysisViewResponse
from app_api.schemas.policies import PolicyRecord
from app_api.schemas.policy_dossier import (
    PolicyDossierFreshnessBlock,
    PolicyDossierTopologyObjectHint,
)
from app_api.schemas.policy_evidence_delta import PolicyEvidenceDeltaResponse
from app_api.schemas.policy_evidence_timeline import PolicyEvidenceTimelineResponse
from app_api.schemas.policy_topology_impact import PolicyTopologyImpactResponse

POLICY_EXPLAINABILITY_WORKSPACE_V1_CONTRACT_ID = "policy_explainability_workspace_v1"

ExplainabilityCandidateSignal = Literal["active_signal", "inactive_signal", "unknown_signal"]
"""Rollup signal derived only from path_state / inventory-aligned summaries—not fabricated rejections."""

ExplainabilityUnknownCandidatePosture = Literal["none", "partial", "full"]
"""Coarse posture when candidate-path reasoning is incomplete (per workspace contract)."""


class ExplainabilityCandidatePathRollup(BaseModel):
    """Per-candidate explainability rollup from path analysis and/or inventory alignment."""

    name: str
    signal: ExplainabilityCandidateSignal
    path_state: str
    preference: int | None = None
    hint_lines: list[str] = Field(
        default_factory=list,
        description="Lines from path-analysis or inventory notes only; capped; not TE rejection verdicts.",
    )


class PolicyExplainabilityNavigationTargets(BaseModel):
    """Read-only shell pivots; same discipline as dossier plus Service Explorer and delta-digest hints."""

    investigation_shell_params: dict[str, str] = Field(
        ...,
        description="inv_from=policy_explainability for breadcrumb-only echo.",
    )
    situation_room_shell_params: dict[str, str] = Field(...)
    policies_view_params: dict[str, str] = Field(...)
    topology_object_hints: list[PolicyDossierTopologyObjectHint] = Field(
        default_factory=list,
        description="Distinct topology objects from impact rows (reused dossier shape).",
    )
    service_explorer_shell_params: dict[str, str] = Field(
        ...,
        description="Service Explorer pivot (policy:{policy_id} or documented service_id forms).",
    )
    delta_digest_shell_params: dict[str, str] = Field(
        ...,
        description="Delta digest panel hints (view, sync_runs_limit).",
    )


class PolicyExplainabilitySparseSignals(BaseModel):
    """Honest sparse/unknown flags over nested contracts (no new evidence)."""

    topology_naming_alignment_unknown: bool = Field(
        ...,
        description="True when topology-impact rows are empty—unknown naming alignment, not 'no dependencies'.",
    )
    evidence_timeline_sparse: bool = Field(
        ...,
        description="True when timeline entries empty or missing_evidence_notes present.",
    )
    evidence_delta_not_ready: bool = Field(
        ...,
        description="True when nested delta comparison_status is not delta_ready.",
    )


class PolicyExplainabilityResponse(BaseModel):
    """Read-only explainability workspace for one normalized policy record."""

    metadata: ApiResponseMetadata
    contract_id: Literal["policy_explainability_workspace_v1"] = Field(
        default=POLICY_EXPLAINABILITY_WORKSPACE_V1_CONTRACT_ID,
    )
    policy_id: str
    policy_record: PolicyRecord
    path_analysis: PathAnalysisViewResponse
    topology_impact: PolicyTopologyImpactResponse
    evidence_timeline: PolicyEvidenceTimelineResponse
    evidence_delta: PolicyEvidenceDeltaResponse
    path_explanation_summary: str = Field(
        ...,
        description="One-line rollup from path-analysis truth_alignment (bounded; not full JSON).",
    )
    candidate_path_rollups: list[ExplainabilityCandidatePathRollup] = Field(
        default_factory=list,
    )
    unknown_candidate_posture: ExplainabilityUnknownCandidatePosture
    sparse_signals: PolicyExplainabilitySparseSignals
    navigation_targets: PolicyExplainabilityNavigationTargets
    freshness: PolicyDossierFreshnessBlock
    merged_caveats: list[str] = Field(
        default_factory=list,
        description="Deduped caveat lines from composed sources.",
    )
