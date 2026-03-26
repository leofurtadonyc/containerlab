"""Service Impact Workspace v1 — composed Service Explorer + optional failure-impact.

Read-only; see ``platform/docs/service-impact-workspace-contract.md``.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.failure_impact import FailureImpactViewResponse
from app_api.schemas.service_explorer import ServiceDetailResponse

SERVICE_IMPACT_WORKSPACE_V1_CONTRACT_ID = "service_impact_workspace_v1"

DEFAULT_SERVICE_IMPACT_WORKSPACE_EXPLICIT_NON_CLAIMS: tuple[str, ...] = (
    "service_impact_workspace_v1 is a composed read-only workspace; it is not blast-radius or dependency truth.",
    "service_impact_workspace_v1 does not prove SLA, traffic risk, incident command, or safe-to-change authority.",
    "Nested contracts remain authoritative for their own JSON; composition does not strengthen evidence.",
    "Maintenance preview and change safety case remain separate GETs; pivots are navigation only.",
)


class ServiceImpactWorkspaceResponse(BaseModel):
    """Composed service-impact workspace for one ``service_id`` (Service Explorer anchor)."""

    metadata: ApiResponseMetadata
    contract_id: Literal["service_impact_workspace_v1"] = Field(
        default=SERVICE_IMPACT_WORKSPACE_V1_CONTRACT_ID
    )
    service_id: str
    service_explorer: ServiceDetailResponse
    failure_impact: FailureImpactViewResponse | None = Field(
        default=None,
        description="Optional embedded failure_impact_v1 when a topology node anchor resolves.",
    )
    failure_impact_topology_anchor: str | None = Field(
        default=None,
        description="Topology node_id used for failure-impact when present.",
    )
    failure_impact_assembly_note: str | None = Field(
        default=None,
        description="Honest note when failure-impact is omitted or assembly returned no rollup.",
    )
    merged_caveats: list[str] = Field(
        default_factory=list,
        description="Deduped caveat lines from Explorer and optional failure-impact.",
    )
    merged_evidence_gap_notes: list[str] = Field(
        default_factory=list,
        description="Deduped evidence-gap lines (e.g. failure-impact missing_evidence_notes).",
    )
    explicit_non_claims: list[str] = Field(
        default_factory=list,
        description="Workspace-level and nested framing non-claims.",
    )
    source_contract_ids: list[str] = Field(
        default_factory=list,
        description="Nested contract identifiers included in this response.",
    )
    recommended_api_pivots: list[str] = Field(
        default_factory=list,
        description="Read-only GET hints for maintenance preview, failure-impact, change-safety-case, reports.",
    )
