"""Topology object dossier v1 read contract (Phase 2, read-only).

Composes existing week 27–28 bounded read surfaces for one topology node or link.
See ``platform/docs/topology-object-dossier-contract.md``.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.degraded_policy_v1 import DegradedPolicyV1Classification
from app_api.schemas.failure_impact import FailureImpactViewResponse
from app_api.schemas.topology_related_policies import TopologyObjectRelatedPoliciesResponse
from app_api.schemas.topology_risk_summary import TopologyRiskSummaryRow

TOPOLOGY_OBJECT_DOSSIER_CONTRACT_ID = "topology_object_dossier_v1"


class TopologyObjectIdentitySection(BaseModel):
    """Object identity from the current normalized topology snapshot."""

    object_kind: Literal["node", "link"]
    object_id: str
    display_label: str = Field(
        ...,
        description="Primary display string (node display_name or link endpoint summary).",
    )
    identity_detail_lines: list[str] = Field(
        default_factory=list,
        description="Role, state, source, or endpoint hints already exposed on topology rows.",
    )


class TopologyRiskAttentionSection(BaseModel):
    """Single-object slice from topology risk summary v1 (no full re-rank)."""

    ranking_basis: str = Field(
        ...,
        description="Echo of topology risk summary lexicographic basis for this assembly.",
    )
    row: TopologyRiskSummaryRow | None = Field(
        default=None,
        description="Matching ranked row for this object when present in the current assembly.",
    )
    risk_row_gap_note: str | None = Field(
        default=None,
        description="Honest gap when this object is absent from ranked_objects (unexpected).",
    )


class TopologyObjectDossierDegradedRelatedPreviewItem(BaseModel):
    """Per related policy: degraded_policy v1 classification (same rules as policies inventory)."""

    policy_id: str
    policy_name: str
    degraded_policy_v1: DegradedPolicyV1Classification


class TopologyObjectDossierNavigationTargets(BaseModel):
    """Read-only shell hints aligned with week 27–28 navigation helpers (not execution)."""

    investigation_shell_params: dict[str, str] = Field(
        ...,
        description="Suggested query params: inv_from, topology_object, topology_object_kind, optional entries.",
    )
    situation_room_shell_params: dict[str, str] = Field(
        ...,
        description="Suggested params for situation-room view (e.g. view, sync_runs_limit).",
    )
    topology_shell_params: dict[str, str] = Field(
        ...,
        description="Suggested params to stay on topology with this object selected.",
    )
    related_policy_ids_for_policies_view: list[str] = Field(
        default_factory=list,
        description="Distinct related policy ids for Policies view selection / path-analysis drill-down.",
    )


class TopologyObjectDossierFreshnessBlock(BaseModel):
    """Merged provenance for dossier assembly (nested contracts retain their own timestamps)."""

    dossier_assembled_at: datetime
    policy_inventory_observed_at: datetime | None = None
    topology_snapshot_observed_at: datetime | None = None
    policy_inventory_empty_reason: str | None = None
    policy_serving_mode_echo: str = Field(
        ...,
        description="Echo consistent with composed policy inventory read (failure-impact freshness).",
    )
    topology_risk_summary_assembly_generated_at: datetime | None = Field(
        default=None,
        description="When the embedded risk-summary assembly was generated.",
    )


class TopologyObjectDossierResponse(BaseModel):
    """Read-only composed dossier for one topology node or link."""

    metadata: ApiResponseMetadata
    contract_id: Literal["topology_object_dossier_v1"] = Field(
        default=TOPOLOGY_OBJECT_DOSSIER_CONTRACT_ID,
    )
    object_identity: TopologyObjectIdentitySection
    topology_posture_summary_lines: list[str] = Field(
        default_factory=list,
        description="Bounded echo of coverage/partiality axes (summary lines only).",
    )
    failure_impact: FailureImpactViewResponse
    risk_attention: TopologyRiskAttentionSection
    related_policies: TopologyObjectRelatedPoliciesResponse
    degraded_related_policies_preview: list[TopologyObjectDossierDegradedRelatedPreviewItem] = Field(
        default_factory=list,
        description="Per related policy_id: degraded_policy v1 (scoped to related set only).",
    )
    navigation_targets: TopologyObjectDossierNavigationTargets
    freshness: TopologyObjectDossierFreshnessBlock
    merged_caveats: list[str] = Field(
        default_factory=list,
        description="Deduped caveat lines from composed sources (stricter honesty preserved).",
    )
