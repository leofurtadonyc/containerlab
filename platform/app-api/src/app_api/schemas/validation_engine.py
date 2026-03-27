"""Validation engine v1 schemas (Phase 2; verdicts are not execution or approval)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata

VALIDATION_ENGINE_V1_CONTRACT_ID = "validation_engine_policy_read_model_observability_v1"

ValidationContext = Literal["pre_change", "post_change"]
ValidationStatus = Literal[
    "received",
    "blocked",
    "unsupported",
    "unknown",
    "running",
    "completed",
    "expired",
    "invalid",
]
CapabilityDecisionState = Literal["allowed", "blocked", "unsupported", "unknown"]
OverallVerdict = Literal["pass", "fail", "unknown", "not_applicable"]
CheckVerdict = Literal["pass", "fail", "unknown", "not_applicable"]
ConfidenceState = Literal["high", "medium", "low", "unknown"]
StalePosture = Literal["current", "truth_changed", "unknown"]


class ValidationLinkageHints(BaseModel):
    """Forward-compatible nullable linkage placeholders (not execution hooks)."""

    approval_record_ids: list[str] = Field(default_factory=list)
    execution_reference: str | None = None
    rollback_parent_workflow_id: str | None = None
    post_check_validation_parent_id: str | None = None
    validation_supersedes_validation_id: str | None = None
    capability_decision_id: str | None = None


class ValidationTruthScopeSummary(BaseModel):
    """Explicit truth-source posture for validation (bounded Phase 2)."""

    policy_data_status: str
    policy_serving_mode: str
    policies_source_posture: str
    policies_confidence_posture: str
    policies_evidence_kind: str
    policy_truth_notes: list[str] = Field(default_factory=list)
    validation_truth_notes: list[str] = Field(default_factory=list)


class ValidationEvidenceItem(BaseModel):
    """One evidence attachment backing a check or overall result."""

    evidence_id: str
    evidence_type: str
    evidence_source: str
    observed_at: datetime | None = None
    summary: str
    provenance: str
    confidence_notes: list[str] = Field(default_factory=list)


class ValidationCheckResult(BaseModel):
    """Normalized validation check outcome."""

    check_id: str
    check_name: str
    check_type: str
    check_context: ValidationContext
    verdict: CheckVerdict
    reason: str
    confidence_state: ConfidenceState = "medium"
    source: str
    evidence_refs: list[str] = Field(default_factory=list)
    before_summary: str | None = None
    after_summary: str | None = None
    target_scope: str | None = None
    unknown_reason: str | None = None
    not_applicable_reason: str | None = None


class ValidationSafetyFraming(BaseModel):
    """Explicit non-claims for operator surfaces."""

    explicit_non_claims: list[str] = Field(
        default_factory=lambda: [
            "Validation output is not network execution or approval.",
            "Validation is not a preview diff, evidence delta, export, replay, or sync-history artifact.",
            "A passing validation does not imply a change is safe to execute or should be approved.",
            "Unknown and not-applicable verdicts are first-class outcomes and must not be read as pass.",
        ]
    )


class ValidationResultPayload(BaseModel):
    """Aggregated validation outcome envelope."""

    contract_id: str = VALIDATION_ENGINE_V1_CONTRACT_ID
    validation_id: str
    validation_type: str
    validation_context: ValidationContext
    overall_verdict: OverallVerdict
    verdict_summary: str
    checks: list[ValidationCheckResult]
    evidence: list[ValidationEvidenceItem]
    aggregation_notes: list[str] = Field(default_factory=list)
    stale_posture: StalePosture = "current"
    capability_decision_state: CapabilityDecisionState
    capability_decision_reason: str | None = None
    truth_scope_summary: ValidationTruthScopeSummary
    linkage: ValidationLinkageHints = Field(default_factory=ValidationLinkageHints)
    safety_framing: ValidationSafetyFraming = Field(default_factory=ValidationSafetyFraming)


class ValidationCreateRequest(BaseModel):
    """Create one validation request (v1: bounded policy read-model observability)."""

    validation_type: str = Field(
        min_length=1,
        max_length=128,
        description="v1: policy_read_model_observability_v1",
    )
    validation_context: ValidationContext
    target_kind: str = Field(description="v1: policy")
    target_ids: list[str] = Field(min_length=1, max_length=32)
    target_scope: dict[str, object] | None = None
    requested_checkset: list[str] | None = Field(
        default=None,
        description="Optional subset of stable check ids; default is engine-defined v1 set.",
    )
    workflow_id: str | None = None
    preview_id: str | None = None
    idempotency_key: str | None = Field(default=None, max_length=128)
    notes: str | None = None
    created_by_actor_type: Literal["operator", "api", "system"] = "api"
    created_by_actor_id: str = "validation-api"
    created_by_actor_display_name: str | None = None
    extension_hints: ValidationLinkageHints | None = None


class ValidationDetailResponse(ApiResponseMetadata):
    """One validation with payload."""

    validation_id: str
    workflow_id: str | None
    preview_id: str | None
    validation_type: str
    validation_context: ValidationContext
    target_kind: str
    target_ids: list[str]
    target_scope: dict[str, object] | None
    requested_checkset: list[str] | None
    created_at: datetime
    created_by_actor_type: str
    created_by_actor_id: str
    created_by_actor_display_name: str | None
    validation_status: ValidationStatus
    capability_decision_state: CapabilityDecisionState
    capability_decision_reason: str | None
    truth_scope_summary: ValidationTruthScopeSummary
    truth_fingerprint: str | None
    overall_verdict: OverallVerdict | None
    stale_posture: StalePosture
    expires_at: datetime | None
    notes: str | None
    extension_hints: ValidationLinkageHints | None
    processing_duration_ms: float | None
    result: ValidationResultPayload


class ValidationListItem(BaseModel):
    """Summary row for validation list."""

    validation_id: str
    validation_type: str
    validation_context: ValidationContext
    validation_status: ValidationStatus
    overall_verdict: OverallVerdict | None
    capability_decision_state: CapabilityDecisionState
    created_at: datetime
    workflow_id: str | None
    preview_id: str | None


class ValidationListResponse(ApiResponseMetadata):
    """Newest-first validation list."""

    items: list[ValidationListItem]


class ValidationEventItem(BaseModel):
    """One validation lifecycle event."""

    event_id: str
    validation_id: str
    event_type: str
    occurred_at: datetime
    actor: str
    reason: str | None
    metadata: dict[str, object]
    provenance: Literal["system", "operator", "api"]


class ValidationTimelineResponse(ApiResponseMetadata):
    """Ordered validation events."""

    validation_id: str
    events: list[ValidationEventItem]
