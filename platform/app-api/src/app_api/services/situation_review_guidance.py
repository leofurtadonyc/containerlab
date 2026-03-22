"""Bounded situation-pack review prompts and explicit missing-evidence notes (Phase 2, read-only)."""

from __future__ import annotations

from app_api.schemas.evidence_pack import (
    SITUATION_REVIEW_FRAMING,
    SituationReviewGuidance,
    SituationReviewNavigationPrompt,
)
from app_api.schemas.investigation_workspace import InvestigationContextAssemblyResponse
from app_api.schemas.readiness_snapshot_history import ReadinessSnapshotHistoryResponse
from app_api.schemas.workflow_history import WorkflowHistoryResponse
from app_api.schemas.audit_history import AuditHistoryResponse
from app_api.schemas.devices import DevicesListResponse
from app_api.schemas.topology import TopologyResponse
from app_api.schemas.policies import PoliciesListResponse

_CHANGE_DOMAIN_LABELS: dict[str, str] = {
    "devices": "Devices",
    "topology": "Topology",
    "policies": "Policies",
    "readiness": "Readiness",
    "workflow_history": "Workflow history",
    "audit_history": "Audit history",
}

_CHANGE_DOMAIN_TO_VIEW: dict[str, str] = {
    "devices": "devices",
    "topology": "topology",
    "policies": "policies",
    "readiness": "readiness",
    "workflow_history": "workflows",
    "audit_history": "audit",
}


def _explicit_missing_evidence_notes(
    *,
    devices: DevicesListResponse,
    topology: TopologyResponse,
    policies: PoliciesListResponse,
    readiness: ReadinessSnapshotHistoryResponse,
    workflow_history: WorkflowHistoryResponse,
    audit_history: AuditHistoryResponse,
    recent_change: RecentChangeSummaryResponse,
) -> list[str]:
    out: list[str] = []
    for slice in recent_change.domains:
        if slice.evidence_status in ("absent", "partial"):
            label = _CHANGE_DOMAIN_LABELS.get(slice.domain, slice.domain)
            out.append(f"{label} ({slice.evidence_status}): {slice.headline}")

    if readiness.data_status == "empty":
        out.append(
            "Readiness snapshot history: no persisted rows in this workspace for the list "
            "returned in this pack.",
        )

    degraded_core = (
        devices.data_status == "degraded"
        or topology.data_status == "degraded"
        or policies.data_status == "degraded"
    )
    if degraded_core:
        out.append(
            "Devices, topology, or policies include a degraded read-side posture in this "
            "assembly—see full pages for collector health and fallback detail.",
        )

    if workflow_history.data_status == "empty" and audit_history.data_status == "empty":
        out.append(
            "Workflow history and audit history are both empty here—no persisted sync-substrate "
            "events in the bounded loads included in this pack.",
        )

    return out[:16]


def _review_navigation_prompts(
    *,
    devices: DevicesListResponse,
    topology: TopologyResponse,
    policies: PoliciesListResponse,
    readiness: ReadinessSnapshotHistoryResponse,
    workflow_history: WorkflowHistoryResponse,
    audit_history: AuditHistoryResponse,
    recent_change,
) -> list[SituationReviewNavigationPrompt]:
    prompts: list[SituationReviewNavigationPrompt] = []
    for slice in recent_change.domains:
        if slice.evidence_status not in ("absent", "partial"):
            continue
        view = _CHANGE_DOMAIN_TO_VIEW.get(slice.domain)
        if view is None:
            continue
        label = _CHANGE_DOMAIN_LABELS.get(slice.domain, slice.domain)
        pid = f"situation-review-{slice.domain}-{slice.evidence_status}"
        prompts.append(
            SituationReviewNavigationPrompt(
                prompt_id=pid,
                headline=f"Review {label} read surface",
                rationale=(
                    f"Recent change slice is {slice.evidence_status} in the bounded window: "
                    f"{slice.headline}"
                ),
                framing_rule="evidence_navigation_only",
                product_view=view,
            )
        )

    if readiness.data_status == "empty":
        prompts.append(
            SituationReviewNavigationPrompt(
                prompt_id="situation-review-readiness-history-empty",
                headline="Review readiness snapshot history",
                rationale=(
                    "Readiness snapshot history returned no rows in this bounded assembly—open "
                    "the full readiness surface for list semantics and persistence."
                ),
                framing_rule="evidence_navigation_only",
                product_view="readiness",
            )
        )

    degraded_core = (
        devices.data_status == "degraded"
        or topology.data_status == "degraded"
        or policies.data_status == "degraded"
    )
    if degraded_core:
        prompts.append(
            SituationReviewNavigationPrompt(
                prompt_id="situation-review-core-surfaces-degraded",
                headline="Review collector health and core read surfaces",
                rationale=(
                    "Devices, topology, or policies include a degraded read-side posture in this "
                    "pack—use platform health and per-domain pages for full collector context."
                ),
                framing_rule="evidence_navigation_only",
                product_view="platform-health",
            )
        )

    if workflow_history.data_status == "empty" and audit_history.data_status == "empty":
        prompts.append(
            SituationReviewNavigationPrompt(
                prompt_id="situation-review-workflow-audit-substrate-empty",
                headline="Review workflow and audit history surfaces",
                rationale=(
                    "Workflow history and audit history are both empty in this bounded load—open "
                    "each surface to confirm sync-substrate semantics and limits."
                ),
                framing_rule="evidence_navigation_only",
                product_view="workflows",
            )
        )

    prompts.sort(key=lambda p: p.prompt_id)
    return prompts[:10]


def build_situation_review_guidance(
    *,
    devices: DevicesListResponse,
    topology: TopologyResponse,
    policies: PoliciesListResponse,
    readiness: ReadinessSnapshotHistoryResponse,
    workflow_history: WorkflowHistoryResponse,
    audit_history: AuditHistoryResponse,
    investigation_context: InvestigationContextAssemblyResponse,
) -> SituationReviewGuidance:
    """Derive bounded review framing, gap notes, and navigation prompts from existing payloads only."""
    rc = investigation_context.recent_change
    notes = _explicit_missing_evidence_notes(
        devices=devices,
        topology=topology,
        policies=policies,
        readiness=readiness,
        workflow_history=workflow_history,
        audit_history=audit_history,
        recent_change=rc,
    )
    prompts = _review_navigation_prompts(
        devices=devices,
        topology=topology,
        policies=policies,
        readiness=readiness,
        workflow_history=workflow_history,
        audit_history=audit_history,
        recent_change=rc,
    )
    return SituationReviewGuidance(
        review_framing=SITUATION_REVIEW_FRAMING,
        explicit_missing_evidence_notes=notes,
        review_navigation_prompts=prompts,
    )
