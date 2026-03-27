"""Dry-run / preview / diff engine v1 schemas (Phase 2; not actuation)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata

PREVIEW_ENGINE_V1_CONTRACT_ID = "preview_engine_policy_static_local_intent_v1"

PreviewDecisionState = Literal["allowed", "blocked", "unsupported", "unknown"]
PreviewStatus = Literal[
    "received",
    "generated",
    "blocked",
    "unsupported",
    "unknown",
    "invalid",
    "expired",
]
PreviewChangeKind = Literal["add", "remove", "modify", "no_change", "unknown"]
ConfidenceState = Literal["high", "medium", "low", "unknown"]
StalePosture = Literal["current", "truth_changed", "unknown"]


class PreviewLinkageHints(BaseModel):
    """Forward-compatible nullable linkage placeholders (not execution hooks)."""

    validation_result_ids: list[str] = Field(default_factory=list)
    execution_reference: str | None = None
    rollback_parent_workflow_id: str | None = None
    approval_record_ids: list[str] = Field(default_factory=list)
    preview_supersedes_preview_id: str | None = None
    capability_decision_id: str | None = None


class PreviewTruthScopeSummary(BaseModel):
    """Explicit truth-source posture for preview (bounded Phase 2)."""

    policy_data_status: str
    policy_serving_mode: str
    policies_source_posture: str = Field(
        description="Echo of policies evidence confidence source posture.",
    )
    policies_confidence_posture: str
    policies_evidence_kind: str
    capability_feature_checked: str = "static_policy_detail"
    capability_support_status: str
    policy_truth_notes: list[str] = Field(default_factory=list)


class PreviewChangeItem(BaseModel):
    """One normalized change line in the diff."""

    field_name: str
    change_kind: PreviewChangeKind
    before_value: str | None = None
    after_value: str | None = None
    confidence_state: ConfidenceState = "medium"
    reason: str | None = None
    source: str = "normalized_policy_inventory"


class PreviewDiffModel(BaseModel):
    """Backend-owned diff envelope (not raw vendor config)."""

    diff_id: str
    diff_type: Literal["policy_intent_state_v1"] = "policy_intent_state_v1"
    change_items: list[PreviewChangeItem]
    before_summary: str
    after_summary: str
    change_scope: str
    risk_hints: list[str] = Field(default_factory=list)
    unknown_items: list[str] = Field(default_factory=list)
    unsupported_items: list[str] = Field(default_factory=list)
    capability_notes: list[str] = Field(default_factory=list)
    truth_notes: list[str] = Field(default_factory=list)


class PreviewSafetyFraming(BaseModel):
    """Explicit non-claims for operator surfaces."""

    explicit_non_claims: list[str] = Field(
        default_factory=lambda: [
            "Preview output is not network execution.",
            "Preview is not a validation verdict or post-change result.",
            "Preview is not evidence export, replay, or sync-history delta semantics.",
            "Successful preview does not imply execution authority or approval.",
        ]
    )


class PreviewDetailPayload(BaseModel):
    """Full preview result (detail + diff + framing)."""

    contract_id: str = PREVIEW_ENGINE_V1_CONTRACT_ID
    preview_id: str
    workflow_id: str | None = None
    preview_type: str
    target_kind: str
    target_ids: list[str]
    requested_action_type: str
    requested_payload: dict[str, object]
    created_at: datetime
    created_by_actor_type: str
    created_by_actor_id: str
    created_by_actor_display_name: str | None = None
    preview_status: PreviewStatus
    capability_decision_state: PreviewDecisionState
    capability_decision_reason: str | None = None
    capability_decision_source: str
    truth_scope_summary: PreviewTruthScopeSummary
    truth_fingerprint: str | None = None
    stale_posture: StalePosture = "unknown"
    notes: str | None = None
    linkage_hints: PreviewLinkageHints = Field(default_factory=PreviewLinkageHints)
    diff: PreviewDiffModel | None = None
    safety_framing: PreviewSafetyFraming = Field(default_factory=PreviewSafetyFraming)


class PreviewCreateRequest(BaseModel):
    """Create a preview request (v1 scope: static_local intent only)."""

    preview_type: str = Field(
        description="Must be policy_static_local_intent_preview_v1 for v1.",
    )
    target_kind: Literal["policy"] = "policy"
    target_ids: list[str] = Field(
        min_length=1,
        description="Policy identifiers in normalized inventory order; v1 uses target_ids[0].",
    )
    target_scope: dict[str, object] | None = None
    requested_action_type: str = Field(
        default="intent_state_change",
        description="V1 bounded action label.",
    )
    requested_payload: dict[str, object] = Field(
        description='Must include proposed_intent_state: "declared" | "unknown".',
    )
    workflow_id: str | None = Field(
        default=None,
        description="Optional durable workflow lifecycle id to attach.",
    )
    idempotency_key: str | None = Field(
        default=None,
        max_length=128,
        description="If set, identical key returns the same preview_id when present.",
    )
    actor_type: Literal["operator", "system", "api", "unknown"] = "api"
    actor_id: str = "api"
    actor_display_name: str | None = None
    notes: str | None = None


class PreviewDetailResponse(BaseModel):
    """Single preview detail."""

    metadata: ApiResponseMetadata
    preview: PreviewDetailPayload


class PreviewDiffResponse(BaseModel):
    """Preview diff only (same diff as nested in detail)."""

    metadata: ApiResponseMetadata
    preview_id: str
    stale_posture: StalePosture
    truth_fingerprint: str | None = None
    current_truth_fingerprint: str | None = None
    diff: PreviewDiffModel | None = None
    capability_decision_state: PreviewDecisionState
    capability_decision_reason: str | None = None
    safety_framing: PreviewSafetyFraming = Field(default_factory=PreviewSafetyFraming)


class PreviewListItem(BaseModel):
    """Summary row for list endpoint."""

    preview_id: str
    preview_type: str
    preview_status: PreviewStatus
    capability_decision_state: PreviewDecisionState
    capability_decision_reason: str | None = None
    workflow_id: str | None = None
    created_at: datetime
    target_kind: str
    target_ids: list[str]


class PreviewListResponse(BaseModel):
    """List of preview requests (newest first)."""

    metadata: ApiResponseMetadata
    contract_id: str = PREVIEW_ENGINE_V1_CONTRACT_ID
    items: list[PreviewListItem]


class PreviewEventItem(BaseModel):
    """One preview timeline event."""

    event_id: str
    preview_id: str
    event_type: str
    occurred_at: datetime
    actor: str
    reason: str | None = None
    metadata: dict[str, object] = Field(default_factory=dict)
    provenance: Literal["system", "operator", "api"] = "api"


class PreviewTimelineResponse(BaseModel):
    """Ordered preview events."""

    metadata: ApiResponseMetadata
    contract_id: str = PREVIEW_ENGINE_V1_CONTRACT_ID
    preview_id: str
    events: list[PreviewEventItem]
