"""Maintenance window handoff v1 — frozen multi-subject maintenance-window planning snapshot (Phase 2, read-only).

Semantic authority: ``platform/docs/maintenance-window-handoff-contract.md``.
Export route: ``GET /api/v1/exports/maintenance-window-handoff`` (distinct from ``evidence_export_v1``).
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.maintenance_window_workspace import MaintenanceWindowWorkspaceResponse

MAINTENANCE_WINDOW_HANDOFF_V1_CONTRACT_ID = "maintenance_window_handoff_v1"

# Handoff-level honesty (propagated workspace non-claims are merged at assembly time).
DEFAULT_MAINTENANCE_WINDOW_HANDOFF_EXPLICIT_NON_CLAIMS: tuple[str, ...] = (
    "maintenance_window_handoff_v1 is a frozen handoff serialization for operator communication; "
    "it is not workflow approval, maintenance authorization, or change validation.",
    "This artifact is not tamper-evident, signed, or immutable by default.",
    "This handoff is not evidence_export_v1, briefing_export_bundle_v1, impact_report_v1, or change_safety_case_v1.",
    "This snapshot is not a substitute for live GET /api/v1/maintenance-window-workspace when current read-side truth is required.",
    "maintenance_window_handoff_v1 is not safe-to-change, blast-radius, or SLA proof.",
    "maintenance_window_handoff_v1 is not an evidence replay root for evidence-replay-viewer-contract unless a future revision adds explicit support.",
)


class MaintenanceWindowHandoffSubjectEcho(BaseModel):
    """Bounded inputs echoed on the handoff envelope (same semantics as workspace query)."""

    subjects: list[str] = Field(
        ...,
        description="Normalized `node:` / `link:` labels after parse and deterministic dedupe.",
    )
    preview_context: str = Field(..., description="same as GET /api/v1/maintenance-window-workspace")
    sync_runs_limit: int = Field(ge=1, le=100)
    handoff_label: str | None = Field(
        default=None,
        description="Optional communication label only — not approval or ticketing.",
    )
    operator_note: str | None = Field(
        default=None,
        description="Optional free-text note — not approval or ticketing.",
    )


class MaintenanceWindowHandoffResponse(BaseModel):
    """maintenance_window_handoff_v1 — workspace snapshot embedded at handoff assembly time."""

    contract_id: Literal["maintenance_window_handoff_v1"] = Field(
        default=MAINTENANCE_WINDOW_HANDOFF_V1_CONTRACT_ID,
    )
    handoff_generated_at: datetime = Field(
        ...,
        description="UTC when handoff JSON was assembled (distinct from workspace_snapshot.metadata.generated_at).",
    )
    handoff_subject: MaintenanceWindowHandoffSubjectEcho
    workspace_snapshot: MaintenanceWindowWorkspaceResponse
    source_contract_ids: list[str] = Field(
        ...,
        description="Union of handoff, workspace, and nested families from the snapshot.",
    )
    explicit_non_claims: list[str] = Field(
        ...,
        description="Handoff-level non-claims plus propagated workspace lines without dropping honesty.",
    )
    handoff_format_version: str = Field(default="1", description="Serialization format version for this envelope.")