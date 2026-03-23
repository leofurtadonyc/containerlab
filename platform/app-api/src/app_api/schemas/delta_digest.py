"""Cross-domain delta digest v1 — composed read-side assembly (Phase 2).

See ``platform/docs/cross-domain-delta-digest-contract.md``.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.change_intelligence import (
    RecentChangeCompletenessPosture,
    RecentChangeSummaryResponse,
)
from app_api.schemas.common import ApiResponseMetadata

DELTA_DIGEST_CONTRACT_ID = "cross_domain_delta_digest_v1"

DeltaDigestSectionKey = Literal[
    "recent_sync_anchor",
    "device_inventory_delta",
    "topology_coverage_posture",
    "policy_delta_degraded",
    "change_intelligence_pointer",
    "recommended_pivots",
    "caveats_missing_evidence",
]

DeltaDigestEvidenceStatus = Literal["present", "partial", "absent", "unavailable"]

DeltaDigestExplicitNonClaim = Literal[
    "not_forensic_timeline",
    "not_workflow_execution_truth_source",
    "not_drift_verdict",
    "not_validation_proof",
    "not_incident_command_authority",
    "not_unified_cross_domain_score",
    "not_safe_to_change_recommendation",
    "not_causal_inference_across_domains",
]

DEFAULT_DELTA_DIGEST_EXPLICIT_NON_CLAIMS: list[DeltaDigestExplicitNonClaim] = [
    "not_forensic_timeline",
    "not_workflow_execution_truth_source",
    "not_drift_verdict",
    "not_validation_proof",
    "not_incident_command_authority",
    "not_unified_cross_domain_score",
    "not_safe_to_change_recommendation",
    "not_causal_inference_across_domains",
]


class DeltaDigestSafetyFraming(BaseModel):
    """Honesty framing for the digest response."""

    contract_id: str = Field(default=DELTA_DIGEST_CONTRACT_ID)
    authority_posture: Literal["interpretation_support_only"] = "interpretation_support_only"
    explicit_non_claims: list[DeltaDigestExplicitNonClaim] = Field(
        default_factory=lambda: list(DEFAULT_DELTA_DIGEST_EXPLICIT_NON_CLAIMS)
    )
    phase: Literal["phase_2_read_only_foundation"] = "phase_2_read_only_foundation"
    summary_disclaimer: str = Field(
        default=(
            "This digest summarizes existing Phase 2 read-side evidence for orientation only. "
            "It does not imply causal relationships between domains, validation verdicts, "
            "drift authority, safe-to-change approval, workflow execution truth, or a unified "
            "urgency score across inventory, topology, and policy."
        )
    )


class DeltaDigestSourceProvenance(BaseModel):
    """Freshness note for one composed source (no new semantics)."""

    source: Literal[
        "platform_status",
        "devices",
        "topology",
        "policies",
        "capabilities",
        "change_intelligence",
    ]
    note: str
    generated_at: datetime | None = None
    data_status_or_serving_hint: str | None = Field(
        default=None,
        description="Echo of data_status or serving_mode where applicable.",
    )


class DeltaDigestSection(BaseModel):
    """One normative digest section."""

    section_key: DeltaDigestSectionKey
    headline: str
    evidence_status: DeltaDigestEvidenceStatus
    detail_notes: list[str] = Field(default_factory=list)
    caveats: list[str] = Field(default_factory=list)


class CrossDomainDeltaDigestResponse(BaseModel):
    """Cross-domain delta digest — composition of existing bounded responses only."""

    metadata: ApiResponseMetadata
    contract_id: str = Field(default=DELTA_DIGEST_CONTRACT_ID)
    safety: DeltaDigestSafetyFraming = Field(default_factory=DeltaDigestSafetyFraming)
    sync_runs_limit_applied: int
    completeness_posture: RecentChangeCompletenessPosture
    recent_change_summary: RecentChangeSummaryResponse = Field(
        description=(
            "Embedded change-intelligence recent summary (same contract id inside). "
            "Digest does not invent a competing aggregation semantics layer."
        )
    )
    source_provenance: list[DeltaDigestSourceProvenance] = Field(default_factory=list)
    sections: list[DeltaDigestSection] = Field(
        description="Normative section order matches cross-domain-delta-digest-contract.md.",
    )
    digest_framing_notes: list[str] = Field(
        default_factory=list,
        description=(
            "Additional operator-facing lines reinforcing bounded interpretation and absence of "
            "cross-domain causal claims."
        ),
    )
