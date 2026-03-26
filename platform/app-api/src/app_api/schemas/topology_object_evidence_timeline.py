"""Topology object evidence timeline contract types (Phase 2, read-only).

Per ``platform/docs/topology-object-evidence-timeline-contract.md`` — node/link-scoped evidence
ordering only; not forensic chronology, pairing truth, or workflow authority.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata

TOPOLOGY_OBJECT_EVIDENCE_TIMELINE_CONTRACT_ID = "topology_object_evidence_timeline_v1"

TopologyObjectEvidenceTimelineEntryKind = Literal[
    "topology_object_snapshot_anchor",
    "failure_impact_assembly_anchor",
    "topology_risk_summary_row_anchor",
    "related_policies_list_anchor",
    "related_policy_timeline_entry",
    "related_policy_history_checkpoint",
    "related_path_analysis_assembly_anchor",
    "degraded_policy_signal_for_related_policy",
    "sync_activity_touch",
    "gap_note",
]

TopologyObjectEvidenceTimelineExplicitNonClaim = Literal[
    "not_unified_forensic_chronology",
    "not_dataplane_or_forwarding_proof",
    "not_topology_pairing_or_coverage_truth",
    "not_workflow_execution_order",
    "not_validation_truth",
    "not_blast_radius_or_dependency_simulation",
    "not_cross_object_ranking",
    "not_substitute_for_policy_timeline",
    "not_substitute_for_service_timeline",
    "not_substitute_for_topology_dossier",
    "not_grafana_timeline",
]

DEFAULT_TOPOLOGY_OBJECT_EVIDENCE_TIMELINE_EXPLICIT_NON_CLAIMS: list[TopologyObjectEvidenceTimelineExplicitNonClaim] = [
    "not_unified_forensic_chronology",
    "not_dataplane_or_forwarding_proof",
    "not_topology_pairing_or_coverage_truth",
    "not_workflow_execution_order",
    "not_validation_truth",
    "not_blast_radius_or_dependency_simulation",
    "not_cross_object_ranking",
    "not_substitute_for_policy_timeline",
    "not_substitute_for_service_timeline",
    "not_substitute_for_topology_dossier",
    "not_grafana_timeline",
]


class TopologyObjectEvidenceTimelineSafetyFraming(BaseModel):
    contract_id: str = Field(default=TOPOLOGY_OBJECT_EVIDENCE_TIMELINE_CONTRACT_ID)
    authority_posture: Literal["interpretation_support_only", "read_only_assembly_non_authoritative"] = (
        "interpretation_support_only"
    )
    explicit_non_claims: list[TopologyObjectEvidenceTimelineExplicitNonClaim] = Field(
        default_factory=lambda: list(DEFAULT_TOPOLOGY_OBJECT_EVIDENCE_TIMELINE_EXPLICIT_NON_CLAIMS)
    )
    phase: Literal["phase_2_read_only_foundation"] = "phase_2_read_only_foundation"
    summary_disclaimer: str = Field(
        default=(
            "Topology object evidence timeline v1 orders existing read-side timestamps for one topology "
            "node or link and related policy evidence projections. It does not assert forensic chronology, "
            "dataplane proof, pairing or coverage completeness, workflow order, or replace the topology "
            "object dossier or per-policy evidence timeline for full depth."
        )
    )


class TopologyObjectEvidenceTimelineEntry(BaseModel):
    """One ordered evidence anchor for a topology object scope (reuse-only)."""

    entry_kind: TopologyObjectEvidenceTimelineEntryKind
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
        description="Human-readable source family (e.g. policy_evidence_timeline_v1, failure_impact_v1).",
    )
    reference: str = Field(
        ...,
        description="Stable pointer such as API route family or nested policy timeline reference.",
    )
    policy_id: str | None = Field(
        default=None,
        description="Related policy when this row projects a per-policy timeline entry.",
    )
    source_policy_entry_kind: str | None = Field(
        default=None,
        description="When entry_kind is related_policy_timeline_entry, the nested policy timeline entry_kind.",
    )


class TopologyObjectEvidenceTimelineResponse(BaseModel):
    """Read-only topology-object-scoped evidence timeline."""

    metadata: ApiResponseMetadata
    contract_id: str = Field(default=TOPOLOGY_OBJECT_EVIDENCE_TIMELINE_CONTRACT_ID)
    safety_framing: TopologyObjectEvidenceTimelineSafetyFraming
    object_kind: Literal["node", "link"]
    object_id: str
    scope_summary: str = Field(
        ...,
        description="Whether the window is full, partial, or current-snapshot-only.",
    )
    entries: list[TopologyObjectEvidenceTimelineEntry] = Field(default_factory=list)
    missing_evidence_notes: list[str] = Field(
        default_factory=list,
        description="Honest gaps when related policies or policy timelines are partial.",
    )
