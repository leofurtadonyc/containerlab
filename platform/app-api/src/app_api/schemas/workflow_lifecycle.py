"""Workflow lifecycle foundation (durable records, not network actuation).

See ``platform/docs/workflow-lifecycle-contract.md``.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata

WORKFLOW_LIFECYCLE_RECORD_V1_CONTRACT_ID = "workflow_lifecycle_record_v1"
WORKFLOW_LIFECYCLE_TIMELINE_V1_CONTRACT_ID = "workflow_lifecycle_timeline_v1"
WORKFLOW_LIFECYCLE_LIST_V1_CONTRACT_ID = "workflow_lifecycle_list_v1"

WorkflowLifecycleStatus = Literal[
    "requested",
    "planned",
    "approved",
    "rejected",
    "dry_run_ready",
    "executing",
    "succeeded",
    "failed",
    "cancelled",
]

WorkflowLifecycleExplicitNonClaim = Literal[
    "not_network_actuation",
    "not_dry_run_engine",
    "not_validation_engine",
    "not_approval_policy_engine",
    "not_sync_run_history",
    "not_evidence_export_semantics",
    "actor_identity_placeholder",
]

DEFAULT_WORKFLOW_LIFECYCLE_EXPLICIT_NON_CLAIMS: list[WorkflowLifecycleExplicitNonClaim] = [
    "not_network_actuation",
    "not_dry_run_engine",
    "not_validation_engine",
    "not_approval_policy_engine",
    "not_sync_run_history",
    "not_evidence_export_semantics",
    "actor_identity_placeholder",
]


class WorkflowLifecycleSafetyFraming(BaseModel):
    """Honest bounded framing for workflow lifecycle APIs."""

    contract_id: str = Field(default=WORKFLOW_LIFECYCLE_RECORD_V1_CONTRACT_ID)
    explicit_non_claims: list[WorkflowLifecycleExplicitNonClaim] = Field(
        default_factory=lambda: list(DEFAULT_WORKFLOW_LIFECYCLE_EXPLICIT_NON_CLAIMS)
    )


class WorkflowLifecycleRecord(BaseModel):
    """One durable workflow lifecycle row."""

    contract_id: str = Field(default=WORKFLOW_LIFECYCLE_RECORD_V1_CONTRACT_ID)
    workflow_id: str
    workflow_type: str
    workflow_status: WorkflowLifecycleStatus
    title: str
    description: str | None = None
    target_scope: dict[str, object] = Field(default_factory=dict)
    capability_decision: dict[str, object] = Field(default_factory=dict)
    actor_created: str
    actor_updated: str | None = None
    audit_attachment_hint: dict[str, object] | None = None
    created_at: datetime
    updated_at: datetime
    safety_framing: WorkflowLifecycleSafetyFraming = Field(default_factory=WorkflowLifecycleSafetyFraming)


class WorkflowLifecycleEventItem(BaseModel):
    """One transition or lifecycle event."""

    event_id: str
    workflow_id: str
    prior_status: WorkflowLifecycleStatus | None
    next_status: WorkflowLifecycleStatus
    event_type: str
    occurred_at: datetime
    actor: str
    reason: str | None = None
    metadata: dict[str, object] = Field(default_factory=dict)
    provenance: Literal["system", "operator", "api"]


class WorkflowLifecycleListResponse(ApiResponseMetadata):
    """List durable workflow lifecycle records."""

    contract_id: str = Field(default=WORKFLOW_LIFECYCLE_LIST_V1_CONTRACT_ID)
    items: list[WorkflowLifecycleRecord]
    safety_framing: WorkflowLifecycleSafetyFraming = Field(default_factory=WorkflowLifecycleSafetyFraming)


class WorkflowLifecycleDetailResponse(BaseModel):
    """Single workflow with embedded safety framing."""

    contract_id: str = Field(default=WORKFLOW_LIFECYCLE_RECORD_V1_CONTRACT_ID)
    workflow: WorkflowLifecycleRecord
    safety_framing: WorkflowLifecycleSafetyFraming = Field(default_factory=WorkflowLifecycleSafetyFraming)


class WorkflowLifecycleTimelineResponse(ApiResponseMetadata):
    """Ordered transition history for one workflow."""

    contract_id: str = Field(default=WORKFLOW_LIFECYCLE_TIMELINE_V1_CONTRACT_ID)
    workflow_id: str
    events: list[WorkflowLifecycleEventItem]
    safety_framing: WorkflowLifecycleSafetyFraming = Field(default_factory=WorkflowLifecycleSafetyFraming)


class WorkflowLifecycleCreateRequest(BaseModel):
    """Create a workflow lifecycle record (record management only)."""

    workflow_type: str = Field(min_length=1, max_length=96)
    title: str = Field(min_length=1, max_length=2048)
    description: str | None = Field(default=None, max_length=8192)
    initial_status: WorkflowLifecycleStatus = "requested"
    target_scope: dict[str, object] = Field(default_factory=dict)
    capability_decision: dict[str, object] = Field(default_factory=dict)
    actor: str = Field(default="operator_placeholder", max_length=255)
    provenance: Literal["operator", "api"] = "api"


class WorkflowLifecycleTransitionRequest(BaseModel):
    """Apply a bounded status transition (record management only)."""

    next_status: WorkflowLifecycleStatus
    reason: str | None = Field(default=None, max_length=8192)
    actor: str = Field(default="operator_placeholder", max_length=255)
    metadata: dict[str, object] = Field(default_factory=dict)
    provenance: Literal["operator", "api"] = "api"
