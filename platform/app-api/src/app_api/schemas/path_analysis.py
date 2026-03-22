"""Bounded path-analysis contract types (Phase 2, read-only).

This module defines **backend-owned vocabulary** for a future **path-analysis**
read surface: **interpretation support** that relates **policy intent**, **policy
observed/candidate-path signals**, and **bounded topology/inventory context**
without claiming dataplane certainty, TE resolution, or controller-owned path
computation truth.

Relationship to closed slices:

- **Policies (weeks 19–20):** per-policy ``candidate_paths`` and observed states
  remain the **source** semantics; path analysis **assembles** and **labels**
  cross-signals for operators—it does **not** replace policy list/history APIs.
- **Topology (weeks 14–16):** inferred links and partiality axes remain
  **topology** truth contracts; path analysis may **reference** topology
  partiality for caveats only—**not** reopen pairing or coverage-history work.
- **Platform status / ODL (week 21):** bounded RESTCONF probe vs gNMI/collector
  read paths stands; path analysis may cite **platform_status** and **odl**
  only as **evidence attribution**, not as path computation authority.

This module does not perform I/O.

See: ``platform/docs/path-analysis-contract.md``.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata

PATH_ANALYSIS_CONTRACT_ID = "path_analysis_phase2_v1"
"""Stable identifier for this contract revision (bump when vocabulary changes)."""

PathEvidenceDomain = Literal[
    "devices",
    "topology",
    "policies",
    "platform_status",
    "odl_controller_probe",
    "workflow_history",
    "audit_history",
    "unknown",
]
"""Domains that may be **attributed** as evidence sources for path hints.

``odl_controller_probe`` means the bounded ODL RESTCONF capability probe
surfaced via platform status—not BGP-LS path computation or full controller
semantics.
"""

PathAnalysisAuthorityPosture = Literal[
    "interpretation_support_only",
    "read_only_assembly_non_authoritative",
]
"""How operators must read any path-analysis response."""

PathAnalysisExplicitNonClaim = Literal[
    "not_validation_verdict",
    "not_drift_engine_result",
    "not_safe_to_change_recommendation",
    "not_workflow_execution_or_authorization",
    "not_dry_run_execution",
    "not_dataplane_forwarding_truth",
    "not_traffic_engineering_resolution_truth",
    "not_per_hop_label_stack_verification",
    "not_controller_computed_path_truth",
    "not_odl_substitute_for_gnmi_collector_read_paths",
    "not_cross_domain_completeness_guarantee",
    "not_implied_forwarding_equivalence",
]
"""Stable keys for explicit **non-goals** (API metadata, docs, product copy)."""

DEFAULT_PATH_ANALYSIS_EXPLICIT_NON_CLAIMS: list[PathAnalysisExplicitNonClaim] = [
    "not_validation_verdict",
    "not_drift_engine_result",
    "not_safe_to_change_recommendation",
    "not_workflow_execution_or_authorization",
    "not_dry_run_execution",
    "not_dataplane_forwarding_truth",
    "not_traffic_engineering_resolution_truth",
    "not_per_hop_label_stack_verification",
    "not_controller_computed_path_truth",
    "not_odl_substitute_for_gnmi_collector_read_paths",
    "not_cross_domain_completeness_guarantee",
    "not_implied_forwarding_equivalence",
]

IntendedPathHintKind = Literal[
    "policy_intent_endpoints",
    "policy_declared_candidate",
    "unknown",
]
"""Coarse classification of **intent-side** hints (declarative; not TE CSPF)."""

ObservedPathHintKind = Literal[
    "policy_observed_state",
    "policy_candidate_path_state",
    "topology_context_only",
    "inventory_context_only",
    "unknown",
]
"""Coarse classification of **observed-side** hints."""

PathAnalysisCandidatePathState = Literal["active", "inactive", "unknown"]
"""Aligned with policy ``CandidatePathRecord.path_state``."""

PathAnalysisCurrentRowPosture = Literal["current", "stale"]
"""Aligned with policy ``CandidatePathRecord.current_posture``."""

PathAnalysisTruthAlignmentPosture = Literal[
    "intended_vs_observed_aligned",
    "uncertain",
    "contradictory",
    "insufficient_evidence",
]
"""Backend-owned coarse alignment between intent and observed signals—not a verdict."""


class PathEvidenceAttribution(BaseModel):
    """Attribution of one evidence-bearing surface (read-only pointer semantics)."""

    domain: PathEvidenceDomain
    reference: str = Field(
        ...,
        description=(
            "Stable human-readable pointer, e.g. API route family or field path "
            "within an existing contract."
        ),
    )


class PathAnalysisSafetyFraming(BaseModel):
    """Standard safety framing for path-analysis responses."""

    contract_id: str = Field(default=PATH_ANALYSIS_CONTRACT_ID)
    authority_posture: PathAnalysisAuthorityPosture
    explicit_non_claims: list[PathAnalysisExplicitNonClaim] = Field(
        default_factory=lambda: list(DEFAULT_PATH_ANALYSIS_EXPLICIT_NON_CLAIMS)
    )
    phase: Literal["phase_2_read_only_foundation"] = "phase_2_read_only_foundation"
    summary_disclaimer: str = Field(
        default=(
            "Path analysis organizes existing read-side policy, topology, and platform "
            "signals for operator interpretation. It does not assert dataplane forwarding "
            "truth, TE path resolution, per-hop label verification, or controller-computed "
            "path authority."
        )
    )


class PathAnalysisSubject(BaseModel):
    """Subject anchor for a path-analysis view (Phase 2 v1: policy-centric)."""

    anchor_kind: Literal["policy"] = "policy"
    policy_id: str
    policy_name: str
    policy_type: Literal["static_local", "static_non_local", "unknown"]
    color: int
    headend: str
    endpoint: str
    source_target: str


class IntendedPathHint(BaseModel):
    """Bounded declarative hint about intended path scope from existing models."""

    hint_id: str
    kind: IntendedPathHintKind
    summary: str
    evidence_sources: list[PathEvidenceAttribution] = Field(default_factory=list)


class ObservedPathHint(BaseModel):
    """Bounded hint about observed path posture from existing read-side signals."""

    hint_id: str
    kind: ObservedPathHintKind
    summary: str
    candidate_path_name: str | None = None
    observed_path_state: PathAnalysisCandidatePathState | None = None
    evidence_sources: list[PathEvidenceAttribution] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class PathAnalysisCandidatePathSummary(BaseModel):
    """Public contract mirror of policy per-candidate path summaries."""

    name: str
    current_posture: PathAnalysisCurrentRowPosture
    path_state: PathAnalysisCandidatePathState
    last_recorded_path_state: PathAnalysisCandidatePathState
    preference: int | None = None
    notes: list[str] = Field(default_factory=list)


class PathAnalysisFreshness(BaseModel):
    """Freshness anchors for the assembly (honest where timestamps exist)."""

    assembly_generated_at: datetime
    policy_snapshot_observed_at: datetime | None = None
    topology_snapshot_observed_at: datetime | None = None
    inventory_snapshot_observed_at: datetime | None = None
    serving_mode_echo: Literal["live", "persisted_fallback", "mixed", "unknown"] | None = None


class PathAnalysisCaveat(BaseModel):
    """Single caveat line (bounded operator language)."""

    code: Literal[
        "topology_partial",
        "policy_detail_partial",
        "no_dataplane_evidence",
        "inferred_topology_links",
        "odl_probe_only",
        "persisted_fallback_stale_row",
        "unknown",
    ]
    message: str


class PathAnalysisTruthAlignment(BaseModel):
    """Coarse intended-vs-observed alignment summary—not a validation result."""

    posture: PathAnalysisTruthAlignmentPosture
    summary: str


class PathAnalysisViewResponse(BaseModel):
    """Read-only path-analysis product response.

    Served by ``GET /api/v1/policies/{policy_id}/path-analysis``.
    """

    metadata: ApiResponseMetadata
    safety_framing: PathAnalysisSafetyFraming
    subject: PathAnalysisSubject
    intended_path_hints: list[IntendedPathHint] = Field(default_factory=list)
    observed_path_hints: list[ObservedPathHint] = Field(default_factory=list)
    candidate_path_summaries: list[PathAnalysisCandidatePathSummary] = Field(
        default_factory=list
    )
    evidence_sources: list[PathEvidenceAttribution] = Field(default_factory=list)
    freshness: PathAnalysisFreshness
    truth_alignment: PathAnalysisTruthAlignment
    caveats: list[PathAnalysisCaveat] = Field(default_factory=list)
