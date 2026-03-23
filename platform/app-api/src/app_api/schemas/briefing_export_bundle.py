"""Briefing export bundle v1 — multi-member evidence_export_v1 container (Phase 2, read-only).

See ``platform/docs/briefing-export-bundle-contract.md``.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

from app_api.schemas.evidence_export import (
    EvidenceExportKind,
    InvestigationWorkspaceEvidenceExportResponse,
    PolicyDossierEvidenceExportResponse,
    SituationRoomEvidenceExportResponse,
    TopologyObjectDossierEvidenceExportResponse,
)

BRIEFING_EXPORT_BUNDLE_CONTRACT_ID = "briefing_export_bundle_v1"

EvidenceExportMemberPayload = (
    PolicyDossierEvidenceExportResponse
    | TopologyObjectDossierEvidenceExportResponse
    | SituationRoomEvidenceExportResponse
    | InvestigationWorkspaceEvidenceExportResponse
)


class BriefingExportBundleSubject(BaseModel):
    """Echo of bounded briefing context (aligned with operator briefing query dimensions)."""

    sync_runs_limit: int = Field(..., ge=1, le=100)
    policy_id: str | None = None
    topology_object: str | None = None
    topology_object_kind: Literal["node", "link"] | None = None
    inv_from: str | None = Field(
        default=None,
        description="Client-only echo; not authority for app-api.",
    )
    global_search_q: str | None = Field(
        default=None,
        description="Client-only echo of operator search query when applicable.",
    )


class BriefingExportBundleMember(BaseModel):
    """One bundle slot: full evidence_export_v1 payload or honest omission."""

    export_kind: EvidenceExportKind
    subject_ref: dict[str, Any]
    member_generated_at: datetime | None = Field(
        default=None,
        description="Member export generated_at when payload is present; null when omitted.",
    )
    payload: EvidenceExportMemberPayload | None = None
    omission_reason: str | None = Field(
        default=None,
        description="Set when payload is null (e.g. policy_dossier_unavailable).",
    )


class BriefingExportBundleResponse(BaseModel):
    """Single-file bundle over multiple evidence_export_v1 snapshots."""

    contract_id: Literal["briefing_export_bundle_v1"] = Field(
        default=BRIEFING_EXPORT_BUNDLE_CONTRACT_ID,
    )
    generated_at: datetime
    briefing_subject: BriefingExportBundleSubject
    bundle_members: list[BriefingExportBundleMember]
    source_contract_ids: list[str] = Field(
        ...,
        description="Union of nested contract_id values plus bundle/briefing workspace ids.",
    )
    explicit_non_claims: list[str]
    export_framing: str
