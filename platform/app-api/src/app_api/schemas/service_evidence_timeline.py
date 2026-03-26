"""Service evidence timeline contract types (Phase 2, read-only).

Per ``platform/docs/service-evidence-timeline-contract.md`` — service-scoped evidence ordering
only; not incident chronology, workflow execution truth, or SLA authority.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata

SERVICE_EVIDENCE_TIMELINE_CONTRACT_ID = "service_evidence_timeline_v1"

ServiceEvidenceTimelineEntryKind = Literal[
    "service_membership_snapshot_anchor",
    "member_policy_timeline_entry",
    "member_policy_history_checkpoint",
    "member_path_analysis_assembly_anchor",
    "degraded_posture_shift_for_member",
    "service_degraded_roll_up_context",
    "sync_activity_touch",
    "gap_note",
]

ServiceEvidenceTimelineExplicitNonClaim = Literal[
    "not_unified_incident_chronology",
    "not_workflow_execution_order",
    "not_validation_truth",
    "not_sla_or_customer_impact",
    "not_packet_path_proof",
    "not_service_catalog_authority",
    "not_cross_service_ranking",
    "not_grafana_timeline",
    "not_substitute_for_policy_timeline",
]

DEFAULT_SERVICE_EVIDENCE_TIMELINE_EXPLICIT_NON_CLAIMS: list[ServiceEvidenceTimelineExplicitNonClaim] = [
    "not_unified_incident_chronology",
    "not_workflow_execution_order",
    "not_validation_truth",
    "not_sla_or_customer_impact",
    "not_packet_path_proof",
    "not_service_catalog_authority",
    "not_cross_service_ranking",
    "not_grafana_timeline",
    "not_substitute_for_policy_timeline",
]


class ServiceEvidenceTimelineSafetyFraming(BaseModel):
    contract_id: str = Field(default=SERVICE_EVIDENCE_TIMELINE_CONTRACT_ID)
    authority_posture: Literal["interpretation_support_only", "read_only_assembly_non_authoritative"] = (
        "interpretation_support_only"
    )
    explicit_non_claims: list[ServiceEvidenceTimelineExplicitNonClaim] = Field(
        default_factory=lambda: list(DEFAULT_SERVICE_EVIDENCE_TIMELINE_EXPLICIT_NON_CLAIMS)
    )
    phase: Literal["phase_2_read_only_foundation"] = "phase_2_read_only_foundation"
    summary_disclaimer: str = Field(
        default=(
            "Service evidence timeline v1 orders existing read-side timestamps for member policies under one "
            "service_id. It does not assert incident chronology, workflow execution order, SLA or customer impact, "
            "or replace the per-policy evidence timeline for full policy-only depth."
        )
    )


class ServiceEvidenceTimelineEntry(BaseModel):
    """One ordered evidence anchor for a service scope (reuse-only from bounded product paths)."""

    entry_kind: ServiceEvidenceTimelineEntryKind
    sort_key: datetime = Field(
        ...,
        description="Primary instant used for newest-first ordering (verbatim from source evidence).",
    )
    tie_break: int = Field(
        ...,
        ge=0,
        description="Stable ordering when sort_key ties (lower sorts earlier after datetime sort).",
    )
    summary: str
    provenance: str = Field(
        ...,
        description="Human-readable source family (e.g. policy_evidence_timeline_v1, service_explorer_v1).",
    )
    reference: str = Field(
        ...,
        description="Stable pointer such as API route family or nested policy timeline reference.",
    )
    policy_id: str | None = Field(
        default=None,
        description="Member policy when this row projects a per-policy timeline entry.",
    )
    source_policy_entry_kind: str | None = Field(
        default=None,
        description="When entry_kind is member_policy_timeline_entry, the nested policy timeline entry_kind.",
    )


class ServiceEvidenceTimelineResponse(BaseModel):
    """Read-only service-scoped evidence timeline."""

    metadata: ApiResponseMetadata
    contract_id: str = Field(default=SERVICE_EVIDENCE_TIMELINE_CONTRACT_ID)
    safety_framing: ServiceEvidenceTimelineSafetyFraming
    service_id: str
    scope_summary: str = Field(
        ...,
        description="Whether the window is full, partial, or current-snapshot-only.",
    )
    entries: list[ServiceEvidenceTimelineEntry] = Field(default_factory=list)
    missing_evidence_notes: list[str] = Field(
        default_factory=list,
        description="Honest gaps when member timelines or Explorer detail are partial.",
    )
