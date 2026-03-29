"""Rollback orchestration v1 — bounded compensation (not device restore)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata

ROLLBACK_ORCHESTRATION_V1_CONTRACT_ID = "rollback_orchestration_v1"

RollbackFormalDecision = Literal["allowed", "blocked", "unsupported", "unknown"]
CapabilityDecisionState = Literal["allowed", "blocked", "unsupported", "unknown"]
ApprovalState = Literal["pending", "approved", "rejected", "not_applicable"]
RollbackStatus = Literal[
    "received",
    "blocked",
    "unsupported",
    "unknown",
    "awaiting_approval",
    "ready_to_execute",
    "executing",
    "succeeded",
    "failed",
    "partially_failed",
    "cancelled",
    "invalid",
]


class RollbackTruthScopeSummary(BaseModel):
    """Truth layers used for rollback gating (mirrors safe action honesty)."""

    policy_data_status: str
    policy_serving_mode: str
    policies_source_posture: str = "unknown"
    policies_confidence_posture: str = "unknown"
    policies_evidence_kind: str = "unknown"
    rollback_truth_notes: list[str] = Field(default_factory=list)
    source_layers: list[str] = Field(
        default_factory=lambda: [
            "normalized_policy_inventory",
            "capability_matrix",
            "parent_safe_action_row",
            "pre_rollback_validation_artifact",
            "policy_operator_intent_record_chain",
            "workflow_lifecycle_record",
        ],
    )


class RollbackSafetyFraming(BaseModel):
    """Explicit non-claims for rollback v1."""

    contract_id: str = Field(default=ROLLBACK_ORCHESTRATION_V1_CONTRACT_ID)
    explicit_non_claims: list[str] = Field(
        default_factory=lambda: [
            "v1 rollback compensates platform operator intent overlay in Postgres only; it does not revert SR OS or device configuration.",
            "Rollback is not a preview diff, validation verdict, evidence delta, export, or replay.",
            "When no prior intent overlay exists in the chain, restore defaults to unknown semantics.",
            "Passing prerequisites does not imply network-wide recovery authority.",
        ],
    )


class RollbackExecutionResult(BaseModel):
    """Durable execution outcome for one rollback."""

    outcome: Literal["succeeded", "failed", "partially_failed", "unknown"] = "unknown"
    compensation_intent_record_id: str | None = None
    restored_intent_state: str | None = None
    applied_policy_id: str | None = None
    restoration_semantics: str | None = None
    notes: list[str] = Field(default_factory=list)


class RollbackPrerequisiteReadiness(BaseModel):
    """Server-enforced prerequisite breakdown."""

    parent_action_present: bool = False
    parent_execution_succeeded: bool = False
    parent_action_type_supported: bool = False
    parent_not_already_compensated: bool = False
    no_conflicting_rollback: bool = False
    pre_rollback_validation_present: bool = False
    pre_rollback_validation_pass: bool = False
    pre_rollback_validation_stale_current: bool = False
    pre_rollback_validation_not_expired: bool = False
    capability_allowed: bool = False
    policy_is_static_local: bool = False
    prior_state_or_unknown_restore_identified: bool = False


class RollbackDetailPayload(BaseModel):
    """One rollback request row as API truth."""

    contract_id: str = ROLLBACK_ORCHESTRATION_V1_CONTRACT_ID
    rollback_id: str
    workflow_id: str | None
    parent_workflow_id: str | None
    parent_action_id: str
    parent_preview_id: str | None
    parent_validation_id: str | None
    pre_rollback_validation_id: str | None
    post_rollback_validation_id: str | None
    rollback_type: str
    target_kind: str
    target_ids: list[str]
    target_scope: dict[str, object] | None
    rollback_payload: dict[str, object]
    requested_at: datetime
    requested_by_actor_type: str
    requested_by_actor_id: str
    requested_by_actor_display_name: str | None
    rollback_decision: RollbackFormalDecision
    capability_decision_state: CapabilityDecisionState
    capability_decision_reason: str | None
    truth_scope_summary: RollbackTruthScopeSummary
    prerequisite_notes: list[str]
    prerequisite_readiness: RollbackPrerequisiteReadiness
    restoration_semantics: str
    approval_required: bool
    approval_state: ApprovalState
    approver_actor_id: str | None
    approver_actor_display_name: str | None
    approved_at: datetime | None
    rejection_reason: str | None
    rollback_status: RollbackStatus
    execution_started_at: datetime | None
    execution_completed_at: datetime | None
    execution_latency_ms: float | None
    execution_error_code: str | None
    execution_error_detail: str | None
    result_json: dict[str, object]
    description: str | None
    execution: RollbackExecutionResult
    safety_framing: RollbackSafetyFraming = Field(default_factory=RollbackSafetyFraming)


class RollbackCreateRequest(BaseModel):
    """Create one rollback request (v1: operator intent overlay compensation)."""

    parent_action_id: str = Field(min_length=1, max_length=36)
    rollback_type: str = Field(
        default="policy_operator_intent_rollback_v1",
        max_length=128,
    )
    target_kind: Literal["policy"] = "policy"
    target_ids: list[str] = Field(min_length=1, max_length=8)
    target_scope: dict[str, object] | None = None
    pre_rollback_validation_id: str = Field(min_length=1, max_length=36)
    idempotency_key: str | None = Field(default=None, max_length=128)
    description: str | None = Field(default=None, max_length=8192)
    requested_by_actor_type: Literal["operator", "api", "system"] = "operator"
    requested_by_actor_id: str = Field(default="operator_api", max_length=255)
    requested_by_actor_display_name: str | None = None


class RollbackApproveRequest(BaseModel):
    actor_id: str = Field(max_length=255)
    actor_display_name: str | None = Field(default=None, max_length=512)
    reason: str | None = Field(default=None, max_length=8192)
    provenance: Literal["operator", "api"] = "operator"


class RollbackRejectRequest(BaseModel):
    actor_id: str = Field(max_length=255)
    actor_display_name: str | None = None
    reason: str = Field(min_length=1, max_length=8192)
    provenance: Literal["operator", "api"] = "operator"


class RollbackExecuteRequest(BaseModel):
    actor_id: str = Field(max_length=255)
    provenance: Literal["operator", "api"] = "operator"


class RollbackCancelRequest(BaseModel):
    actor_id: str = Field(max_length=255)
    reason: str | None = Field(default=None, max_length=8192)


class RollbackDetailResponse(ApiResponseMetadata):
    rollback: RollbackDetailPayload


class RollbackListItem(BaseModel):
    rollback_id: str
    rollback_type: str
    rollback_decision: RollbackFormalDecision
    rollback_status: RollbackStatus
    parent_action_id: str
    workflow_id: str | None
    requested_at: datetime
    requested_by_actor_id: str


class RollbackListResponse(ApiResponseMetadata):
    contract_id: str = ROLLBACK_ORCHESTRATION_V1_CONTRACT_ID
    items: list[RollbackListItem]


class RollbackEventItem(BaseModel):
    event_id: str
    rollback_id: str
    event_type: str
    occurred_at: datetime
    actor: str
    reason: str | None
    metadata: dict[str, object]
    provenance: Literal["system", "operator", "api"]


class RollbackTimelineResponse(ApiResponseMetadata):
    contract_id: str = ROLLBACK_ORCHESTRATION_V1_CONTRACT_ID
    rollback_id: str
    events: list[RollbackEventItem]
