"""Safe action workflows v1 — bounded execution backbone (not preview/validation/evidence)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata

SAFE_ACTION_WORKFLOW_V1_CONTRACT_ID = "safe_action_workflow_v1"

ActionFormalDecision = Literal["allowed", "blocked", "unsupported", "unknown"]
CapabilityDecisionState = Literal["allowed", "blocked", "unsupported", "unknown"]
ApprovalState = Literal["pending", "approved", "rejected", "not_applicable"]
ExecutionStatus = Literal[
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


class SafeActionTruthScopeSummary(BaseModel):
    """Truth sources used for action gating (bounded; honest about layers)."""

    policy_data_status: str
    policy_serving_mode: str
    policies_source_posture: str = "unknown"
    policies_confidence_posture: str = "unknown"
    policies_evidence_kind: str = "unknown"
    action_truth_notes: list[str] = Field(default_factory=list)
    source_layers: list[str] = Field(
        default_factory=lambda: [
            "normalized_policy_inventory",
            "capability_matrix",
            "preview_artifact",
            "validation_artifact",
            "workflow_lifecycle_record",
        ],
        description="Which backend layers informed eligibility (not network proof).",
    )


class SafeActionRollbackHints(BaseModel):
    """Forward-compatible rollback placeholders (execution deferred)."""

    rollback_parent_action_id: str | None = None
    rollback_workflow_id: str | None = None
    rollback_ready_state: str | None = None
    rollback_validation_id: str | None = None
    compensation_reference: str | None = None


class SafeActionSafetyFraming(BaseModel):
    """Explicit separation from preview, validation, evidence deltas, replay, workflow-history."""

    contract_id: str = Field(default=SAFE_ACTION_WORKFLOW_V1_CONTRACT_ID)
    explicit_non_claims: list[str] = Field(
        default_factory=lambda: [
            "This action is not arbitrary multi-vendor configuration push.",
            "v1 persists operator intent metadata in platform Postgres only; it does not push SR OS or device config.",
            "Action outcome is not a preview diff, validation verdict, evidence delta, export, replay, or sync-history row.",
            "Passing prerequisites does not imply network-wide safe-change authority.",
            "Post-check validation is linked by reference only in v1; automated post-check is not mandatory.",
        ]
    )


class SafeActionExecutionResult(BaseModel):
    """Evidence-oriented execution outcome envelope."""

    outcome: Literal["succeeded", "failed", "partially_failed", "unknown"] = "unknown"
    operator_intent_record_id: str | None = None
    applied_intent_state: str | None = None
    applied_policy_id: str | None = None
    notes: list[str] = Field(default_factory=list)


class SafeActionPrerequisiteReadiness(BaseModel):
    """Operator-facing prerequisite breakdown (enforced server-side)."""

    workflow_present: bool = False
    workflow_terminal: bool = False
    workflow_status: str | None = None
    preview_present: bool = False
    preview_allowed: bool = False
    preview_stale_posture: str | None = None
    validation_present: bool = False
    validation_pass: bool = False
    validation_stale_posture: str | None = None
    validation_not_expired: bool = False
    capability_allowed: bool = False
    payload_matches_preview: bool = False
    linkage_matches: bool = False
    policy_is_static_local: bool = False


class SafeActionDetailPayload(BaseModel):
    """One safe action row as API truth."""

    contract_id: str = SAFE_ACTION_WORKFLOW_V1_CONTRACT_ID
    action_id: str
    workflow_id: str | None
    preview_id: str | None
    validation_id: str | None
    action_type: str
    target_kind: str
    target_ids: list[str]
    target_scope: dict[str, object] | None
    requested_payload: dict[str, object]
    requested_at: datetime
    requested_by_actor_type: str
    requested_by_actor_id: str
    requested_by_actor_display_name: str | None
    action_decision: ActionFormalDecision
    capability_decision_state: CapabilityDecisionState
    capability_decision_reason: str | None
    truth_scope_summary: SafeActionTruthScopeSummary
    prerequisite_notes: list[str]
    prerequisite_readiness: SafeActionPrerequisiteReadiness
    approval_required: bool
    approval_state: ApprovalState
    approver_actor_id: str | None
    approver_actor_display_name: str | None
    approved_at: datetime | None
    rejection_reason: str | None
    execution_status: ExecutionStatus
    execution_started_at: datetime | None
    execution_completed_at: datetime | None
    execution_latency_ms: float | None
    execution_error_code: str | None
    execution_error_detail: str | None
    post_check_validation_id: str | None
    rollback: SafeActionRollbackHints
    execution: SafeActionExecutionResult
    description: str | None
    safety_framing: SafeActionSafetyFraming = Field(default_factory=SafeActionSafetyFraming)


class SafeActionCreateRequest(BaseModel):
    """Create one safe action request (v1 narrow slice)."""

    workflow_id: str = Field(min_length=1, max_length=36)
    preview_id: str = Field(min_length=1, max_length=36)
    validation_id: str = Field(min_length=1, max_length=36)
    action_type: str = Field(
        description="v1: policy_static_local_operator_intent_record_v1",
        max_length=128,
    )
    target_kind: Literal["policy"] = "policy"
    target_ids: list[str] = Field(min_length=1, max_length=8)
    target_scope: dict[str, object] | None = None
    requested_payload: dict[str, object]
    idempotency_key: str | None = Field(default=None, max_length=128)
    description: str | None = Field(default=None, max_length=8192)
    requested_by_actor_type: Literal["operator", "api", "system"] = "operator"
    requested_by_actor_id: str = Field(default="operator_api", max_length=255)
    requested_by_actor_display_name: str | None = None
    rollback: SafeActionRollbackHints | None = None


class SafeActionApproveRequest(BaseModel):
    """Approve a pending safe action."""

    actor_id: str = Field(max_length=255)
    actor_display_name: str | None = Field(default=None, max_length=512)
    reason: str | None = Field(default=None, max_length=8192)
    provenance: Literal["operator", "api"] = "operator"


class SafeActionRejectRequest(BaseModel):
    """Reject approval for a pending safe action."""

    actor_id: str = Field(max_length=255)
    actor_display_name: str | None = None
    reason: str = Field(min_length=1, max_length=8192)
    provenance: Literal["operator", "api"] = "operator"


class SafeActionExecuteRequest(BaseModel):
    """Execute an approved safe action (re-validates prerequisites)."""

    actor_id: str = Field(max_length=255)
    provenance: Literal["operator", "api"] = "operator"


class SafeActionCancelRequest(BaseModel):
    """Cancel a non-terminal action."""

    actor_id: str = Field(max_length=255)
    reason: str | None = Field(default=None, max_length=8192)


class SafeActionDetailResponse(ApiResponseMetadata):
    """Detail envelope."""

    action: SafeActionDetailPayload


class SafeActionListItem(BaseModel):
    action_id: str
    action_type: str
    action_decision: ActionFormalDecision
    execution_status: ExecutionStatus
    workflow_id: str | None
    preview_id: str | None
    validation_id: str | None
    requested_at: datetime
    requested_by_actor_id: str


class SafeActionListResponse(ApiResponseMetadata):
    contract_id: str = SAFE_ACTION_WORKFLOW_V1_CONTRACT_ID
    items: list[SafeActionListItem]


class SafeActionEventItem(BaseModel):
    event_id: str
    action_id: str
    event_type: str
    occurred_at: datetime
    actor: str
    reason: str | None
    metadata: dict[str, object]
    provenance: Literal["system", "operator", "api"]


class SafeActionTimelineResponse(ApiResponseMetadata):
    contract_id: str = SAFE_ACTION_WORKFLOW_V1_CONTRACT_ID
    action_id: str
    events: list[SafeActionEventItem]


class SafeActionErrorResponse(BaseModel):
    """Stable error body for blocked/unsupported/unknown/stale paths."""

    code: str
    message: str
    action_id: str | None = None
    action_decision: ActionFormalDecision | None = None
    execution_status: ExecutionStatus | None = None
