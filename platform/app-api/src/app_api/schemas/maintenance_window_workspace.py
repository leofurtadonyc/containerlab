"""Maintenance Window Workspace v1 — bounded multi-subject maintenance-window planning (Phase 2, read-only).

Semantic authority: ``platform/docs/maintenance-window-workspace-contract.md``.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.service_explorer import ServiceExplorerServiceKind

MAINTENANCE_WINDOW_WORKSPACE_V1_CONTRACT_ID = "maintenance_window_workspace_v1"

# Hard cap on distinct topology subjects per request (documented; deterministic).
MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS = 16

DEFAULT_MAINTENANCE_WINDOW_WORKSPACE_EXPLICIT_NON_CLAIMS: tuple[str, ...] = (
    "maintenance_window_workspace_v1 is a composed read-only multi-subject planning workspace; "
    "it is not approval, simulation, safe-to-change authority, or blast-radius truth.",
    "Deduped rollups are planning aids only; nested maintenance_preview_v1 and other GET families remain authoritative.",
    "This response is not evidence_export_v1 and is not an evidence-replay root per evidence-replay-viewer-contract.",
    "Stability and evidence-consistency cues are optional pointers to existing summaries—not new scoring engines.",
)


class MaintenanceWindowSubjectResolutionFailure(BaseModel):
    """One subject that did not resolve to a topology object in the current snapshot."""

    object_kind: Literal["node", "link"]
    object_id: str
    reason: str


class MaintenanceWindowSubjectStripRow(BaseModel):
    """Compact per-subject row after successful preview assembly."""

    object_kind: Literal["node", "link"]
    object_id: str
    display_name: str
    sparse_preview: bool
    related_policy_count: int
    related_services_total: int


class MaintenanceWindowAffectedServiceRollupRow(BaseModel):
    """Deduped union row across subjects (Service Explorer–style fields, merged conservatively)."""

    service_id: str
    kind: ServiceExplorerServiceKind
    member_count: int = Field(ge=0, description="Max observed member_count across contributing previews.")
    degraded_group_posture: Literal["ok", "degraded", "unknown"]
    touched_by_subjects: list[str] = Field(
        ...,
        description="Stable labels like ``node:PE1`` or ``link:P1--PE1`` for subjects that listed this service.",
    )


class MaintenanceWindowPolicyRollupRow(BaseModel):
    """Deduped policy identity with provenance across subjects."""

    policy_id: str
    policy_name: str
    touched_by_subjects: list[str]


class MaintenanceWindowTensionCueRow(BaseModel):
    """Deduped hint from evidence consistency summary (tension rows only), not a full consistency copy."""

    summary: str
    detail: str | None = None
    category: str


class MaintenanceWindowWorkspaceResponse(BaseModel):
    """Multi-subject maintenance-window planning workspace (read-only composition)."""

    metadata: ApiResponseMetadata
    contract_id: Literal["maintenance_window_workspace_v1"] = Field(
        default=MAINTENANCE_WINDOW_WORKSPACE_V1_CONTRACT_ID,
    )
    window_framing_summary: str = Field(
        ...,
        description="Phase 2 multi-subject maintenance planning framing (not approval or simulation).",
    )
    preview_context: str = Field(
        ...,
        description="Same framing cue as maintenance preview; applied to each nested preview assembly.",
    )
    subject_cap_applied: int = Field(
        ...,
        ge=1,
        description="Maximum distinct subjects allowed for this endpoint (see MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS).",
    )
    subjects_requested: int = Field(ge=0, description="Distinct subjects after parse and dedupe, before resolution.")
    subjects_resolved: int = Field(ge=0, description="Subjects that produced a maintenance preview assembly.")
    selected_subjects: list[str] = Field(
        ...,
        description="Stable sorted labels ``kind:object_id`` for resolved subjects.",
    )
    subject_strip: list[MaintenanceWindowSubjectStripRow] = Field(default_factory=list)
    subject_resolution_failures: list[MaintenanceWindowSubjectResolutionFailure] = Field(
        default_factory=list,
        description="Subjects that did not resolve or had kind mismatch; partial workspace when non-empty.",
    )
    deduped_affected_services: list[MaintenanceWindowAffectedServiceRollupRow] = Field(default_factory=list)
    deduped_related_policies: list[MaintenanceWindowPolicyRollupRow] = Field(default_factory=list)
    merged_assembly_caveats: list[str] = Field(default_factory=list)
    merged_evidence_gap_notes: list[str] = Field(default_factory=list)
    stability_cue_summary: str | None = Field(
        default=None,
        description="Optional pointer-style line from operational stability summary (global window).",
    )
    stability_summary_unavailable_note: str | None = Field(
        default=None,
        description="Set when operational stability summary assembly failed or was skipped.",
    )
    tension_cue_rows: list[MaintenanceWindowTensionCueRow] = Field(
        default_factory=list,
        description="Subset of tension signals from evidence consistency summary (deduped by summary text).",
    )
    evidence_consistency_unavailable_note: str | None = None
    explicit_non_claims: list[str] = Field(default_factory=lambda: list(DEFAULT_MAINTENANCE_WINDOW_WORKSPACE_EXPLICIT_NON_CLAIMS))
    source_contract_ids: list[str] = Field(
        default_factory=list,
        description="Nested contract ids contributing to this assembly (includes maintenance_window_workspace_v1).",
    )
    sync_runs_limit_applied: int = Field(
        ge=1,
        le=100,
        description="Bounded window shared with stability and evidence-consistency assemblies.",
    )
    recommended_api_pivots: list[str] = Field(
        default_factory=list,
        description="Read-only GET hints for per-subject drill-down and export families.",
    )
