"""Action safety case v1 — bounded assembly over existing workflow primitives."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata

ACTION_SAFETY_CASE_V1_CONTRACT_ID = "action_safety_case_v1"

ActionSafetyCasePosture = Literal[
    "ready_for_review",
    "blocked",
    "degraded_evidence",
    "rollback_not_ready",
    "awaiting_validation",
    "not_executable",
    "unknown",
]

ActionSafetyGateSeverity = Literal["blocking", "warning", "missing_evidence"]


class ActionSafetyCaseSafetyFraming(BaseModel):
    contract_id: str = ACTION_SAFETY_CASE_V1_CONTRACT_ID
    authority_posture: Literal["bounded_operator_review_only"] = "bounded_operator_review_only"
    explicit_limitations: list[str] = Field(
        default_factory=lambda: [
            "This safety case does not execute device changes.",
            "This safety case does not claim safe-to-execute authority.",
            "Safe action v1 remains platform-only operator intent overlay; it is not device or controller configuration push.",
            "Rollback readiness is platform rollback orchestration readiness, not proof of device restore.",
            "Controller evidence is supporting read-side posture only; ODL is not the source of truth.",
            "Evidence quality summarizes bounded read-side weakness; weak evidence is not a network-safety verdict.",
        ]
    )


class ActionSafetyCaseReference(BaseModel):
    present: bool
    identifier: str | None = None
    status: str | None = None
    verdict: str | None = None
    summary: str
    route_family: str | None = None
    cited_fields: list[str] = Field(default_factory=list)


class ActionSafetyCaseGate(BaseModel):
    gate_id: str
    severity: ActionSafetyGateSeverity
    summary: str
    cited_fields: list[str] = Field(default_factory=list)


class ActionSafetyCaseNextStep(BaseModel):
    step_id: str
    label: str
    rationale: str
    route_family: str | None = None


class ActionSafetyCaseResponse(ApiResponseMetadata):
    contract_id: str = ACTION_SAFETY_CASE_V1_CONTRACT_ID
    action_id: str
    final_bounded_posture: ActionSafetyCasePosture
    action: ActionSafetyCaseReference
    workflow_lifecycle: ActionSafetyCaseReference
    preview: ActionSafetyCaseReference
    diff_summary: ActionSafetyCaseReference
    validation: ActionSafetyCaseReference
    evidence_quality: ActionSafetyCaseReference
    controller_evidence: ActionSafetyCaseReference
    rollback_readiness: ActionSafetyCaseReference
    blocking_gates: list[ActionSafetyCaseGate] = Field(default_factory=list)
    warning_gates: list[ActionSafetyCaseGate] = Field(default_factory=list)
    missing_evidence: list[ActionSafetyCaseGate] = Field(default_factory=list)
    operator_next_steps: list[ActionSafetyCaseNextStep] = Field(default_factory=list)
    safety_framing: ActionSafetyCaseSafetyFraming = Field(default_factory=ActionSafetyCaseSafetyFraming)
