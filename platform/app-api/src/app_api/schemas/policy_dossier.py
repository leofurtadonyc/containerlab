"""Policy dossier v1 read contract (Phase 2, read-only).

Composes existing week 27–28 bounded policy read surfaces for one ``policy_id``.
See ``platform/docs/policy-dossier-contract.md``.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.path_analysis import PathAnalysisViewResponse
from app_api.schemas.policies import PolicyRecord
from app_api.schemas.policy_evidence_delta import PolicyEvidenceDeltaResponse
from app_api.schemas.policy_evidence_timeline import PolicyEvidenceTimelineResponse
from app_api.schemas.policy_topology_impact import PolicyTopologyImpactResponse
from app_api.schemas.topology_related_policies import TopologyObjectKind

POLICY_DOSSIER_CONTRACT_ID = "policy_dossier_v1"


class PolicyDossierTopologyObjectHint(BaseModel):
    """Read-only pivot hint derived from topology-impact rows (string alignment only)."""

    topology_object_kind: TopologyObjectKind
    topology_object_id: str = Field(
        ...,
        description="Topology node_id or link_id from the impact assembly.",
    )


class PolicyDossierNavigationTargets(BaseModel):
    """Read-only shell hints aligned with week 27–28 navigation helpers (not execution)."""

    investigation_shell_params: dict[str, str] = Field(
        ...,
        description="Suggested query params: inv_from, policy_id, optional evidence focus hints.",
    )
    situation_room_shell_params: dict[str, str] = Field(
        ...,
        description="Suggested params for situation-room view (e.g. view, sync_runs_limit).",
    )
    policies_view_params: dict[str, str] = Field(
        ...,
        description="Suggested params to stay on Policies with this policy selected.",
    )
    topology_object_hints: list[PolicyDossierTopologyObjectHint] = Field(
        default_factory=list,
        description="Distinct topology objects from impact rows (capped); navigation-only.",
    )


class PolicyDossierFreshnessBlock(BaseModel):
    """Merged provenance for dossier assembly (nested contracts retain their own timestamps)."""

    dossier_assembled_at: datetime
    policy_inventory_observed_at: datetime | None = None
    topology_snapshot_observed_at: datetime | None = None
    policy_inventory_empty_reason: str | None = Field(
        default=None,
        description="Echo when policy snapshot empty_reason is not 'none'.",
    )
    policy_serving_mode_echo: str = Field(
        ...,
        description="Echo consistent with path-analysis / inventory serving mode.",
    )


class PolicyDossierResponse(BaseModel):
    """Read-only composed dossier for one normalized policy record."""

    metadata: ApiResponseMetadata
    contract_id: Literal["policy_dossier_v1"] = Field(
        default=POLICY_DOSSIER_CONTRACT_ID,
    )
    policy_record: PolicyRecord
    path_analysis: PathAnalysisViewResponse
    topology_impact: PolicyTopologyImpactResponse
    evidence_timeline: PolicyEvidenceTimelineResponse
    evidence_delta: PolicyEvidenceDeltaResponse
    navigation_targets: PolicyDossierNavigationTargets
    freshness: PolicyDossierFreshnessBlock
    merged_caveats: list[str] = Field(
        default_factory=list,
        description="Deduped caveat lines from composed sources (stricter honesty preserved).",
    )
