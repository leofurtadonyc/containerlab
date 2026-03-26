"""Maintenance Evidence Workspace v1 — composed maintenance-centered read assembly.

Read-only; see ``platform/docs/maintenance-evidence-workspace-contract.md``.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.change_safety_case import ChangeSafetyCaseResponse
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.maintenance_preview import MaintenancePreviewContext, MaintenancePreviewResponse
from app_api.schemas.topology_object_dossier import TopologyObjectDossierResponse
from app_api.schemas.topology_object_evidence_delta import TopologyObjectEvidenceDeltaResponse
from app_api.schemas.topology_object_evidence_timeline import TopologyObjectEvidenceTimelineResponse

MAINTENANCE_EVIDENCE_WORKSPACE_V1_CONTRACT_ID = "maintenance_evidence_workspace_v1"

DEFAULT_MAINTENANCE_EVIDENCE_WORKSPACE_EXPLICIT_NON_CLAIMS: tuple[str, ...] = (
    "maintenance_evidence_workspace_v1 is a composed read-only workspace; it is not approval, simulation, or safe-to-change authority.",
    "maintenance_evidence_workspace_v1 does not prove blast radius, SLA, outage, or dataplane truth.",
    "Nested contract JSON remains authoritative for its own fields; composition does not strengthen evidence.",
    "Change safety case, maintenance preview, and impact reports remain separate GET families; pivots are navigation only.",
    "This response is not evidence_export_v1 and is not an evidence-replay root per evidence-replay-viewer-contract.",
)


class MaintenanceEvidenceWorkspaceResponse(BaseModel):
    """Composed maintenance evidence workspace for one topology maintenance subject (node or link)."""

    metadata: ApiResponseMetadata
    contract_id: Literal["maintenance_evidence_workspace_v1"] = Field(
        default=MAINTENANCE_EVIDENCE_WORKSPACE_V1_CONTRACT_ID,
    )
    object_kind: Literal["node", "link"]
    object_id: str
    preview_context: MaintenancePreviewContext
    maintenance_framing_summary: str = Field(
        ...,
        description=(
            "Short read-only framing: maintenance-centered evidence review from existing Phase 2 assemblies only."
        ),
    )
    maintenance_preview: MaintenancePreviewResponse = Field(
        ...,
        description="Nested maintenance_preview_v1 (authoritative touch-set semantics).",
    )
    topology_object_dossier: TopologyObjectDossierResponse | None = Field(
        default=None,
        description="Nested topology_object_dossier_v1 when assembly succeeds.",
    )
    topology_object_evidence_timeline: TopologyObjectEvidenceTimelineResponse | None = Field(
        default=None,
        description="Nested topology_object_evidence_timeline_v1 when assembly succeeds.",
    )
    topology_object_evidence_delta: TopologyObjectEvidenceDeltaResponse | None = Field(
        default=None,
        description="Nested topology_object_evidence_delta_v1 when assembly succeeds.",
    )
    change_safety_case: ChangeSafetyCaseResponse = Field(
        ...,
        description=(
            "Nested change_safety_case_v1 for topology_change_safety (includes maintenance_preview per CSC contract)."
        ),
    )
    merged_caveats: list[str] = Field(
        default_factory=list,
        description="Deduped caveat lines from nested assemblies.",
    )
    merged_evidence_gap_notes: list[str] = Field(
        default_factory=list,
        description="Honest gaps when optional bodies are partial or duplicated narrative applies.",
    )
    explicit_non_claims: list[str] = Field(
        default_factory=list,
        description="Workspace-level framing; nested safety_framing remain authoritative for nested bodies.",
    )
    source_contract_ids: list[str] = Field(
        default_factory=list,
        description="Nested contract identifiers included (includes maintenance_evidence_workspace_v1 once).",
    )
    recommended_api_pivots: list[str] = Field(
        default_factory=list,
        description="Read-only GET hints for service impact, impact reports, exports, investigation.",
    )
