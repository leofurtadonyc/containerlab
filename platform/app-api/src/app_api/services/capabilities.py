"""Capability service helpers."""

from collections import Counter
from datetime import UTC, datetime
from typing import Iterable

from app_api.config.settings import get_settings
from app_api.metrics.state import cache_readiness_metrics
from app_api.persistence.readiness import (
    load_latest_readiness_snapshot_reference,
    load_latest_readiness_snapshot_persisted_at,
    persist_readiness_snapshot,
)
from app_api.schemas.capabilities import (
    CapabilityRecord,
    CapabilitiesListResponse,
    DryRunReadinessAssessmentArea,
    DryRunReadinessBlocker,
    DryRunReadinessPrerequisite,
    DryRunReadinessSummary,
)


def _count_values(values: Iterable[str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for value in values:
        counts[value] = counts.get(value, 0) + 1
    return counts


def _build_dry_run_readiness_summary() -> DryRunReadinessSummary:
    """Return one bounded non-executing summary of dry-run-readiness prerequisites."""
    prerequisites = [
        DryRunReadinessPrerequisite(
            prerequisite="inventory_read_model",
            status="ready",
            support_posture="supported",
            evidence_basis="live_validated",
            evidence_coverage="strong",
            related_capabilities=["device_inventory"],
            current_evidence=(
                "Inventory already has a stable live normalized read path and backend-owned "
                "Phase 2 API contract."
            ),
            blocking_gaps=[],
        ),
        DryRunReadinessPrerequisite(
            prerequisite="topology_comparison_evidence",
            status="partial",
            support_posture="partially_supported",
            evidence_basis="persisted_validated",
            evidence_coverage="bounded",
            related_capabilities=[
                "topology_observation",
                "topology_persisted_comparison",
            ],
            current_evidence=(
                "Topology now exposes bounded current-versus-latest-persisted comparison "
                "evidence and serving-mode context."
            ),
            blocking_gaps=[
                "Topology remains intentionally partial and should not yet be treated as full protocol-derived truth.",
            ],
        ),
        DryRunReadinessPrerequisite(
            prerequisite="policy_comparison_evidence",
            status="partial",
            support_posture="partially_supported",
            evidence_basis="persisted_validated",
            evidence_coverage="bounded",
            related_capabilities=[
                "policy_counter_visibility",
                "static_policy_detail",
                "policy_persisted_comparison",
            ],
            current_evidence=(
                "Policy now exposes bounded persisted comparison evidence plus explicit "
                "live-empty, detail-limited, and persisted-fallback semantics."
            ),
            blocking_gaps=[
                "Policy coverage remains bounded and is not yet broad enough for full pre-change policy validation.",
            ],
        ),
        DryRunReadinessPrerequisite(
            prerequisite="workflow_audit_visibility",
            status="partial",
            support_posture="partially_supported",
            evidence_basis="persisted_validated",
            evidence_coverage="partial",
            related_capabilities=[
                "workflow_history_visibility",
                "audit_history_visibility",
            ],
            current_evidence=(
                "Workflow-history and audit-history now expose bounded persisted sync "
                "activity and policy snapshot comparison context."
            ),
            blocking_gaps=[
                "No requested, planned, approved, or executed workflow lifecycle records exist yet.",
            ],
        ),
        DryRunReadinessPrerequisite(
            prerequisite="capability_matrix_precision",
            status="ready",
            support_posture="supported",
            evidence_basis="design_review",
            evidence_coverage="strong",
            related_capabilities=[],
            current_evidence=(
                "The capability matrix now distinguishes delivery tier, evidence basis, "
                "vendor posture, and one bounded future workflow-readiness interpretation "
                "for the current product slice."
            ),
            blocking_gaps=[],
        ),
    ]
    blockers = [
        DryRunReadinessBlocker(
            blocker="workflow_lifecycle_contract_missing",
            category="contract",
            severity="critical",
            evidence_basis="design_review",
            summary=(
                "No backend-owned workflow lifecycle contract exists yet for requested, "
                "planned, approved, dry-run, execution, or rollback states."
            ),
            blocked_readiness_scopes=[
                "planning_depth",
                "workflow_audit_relationships",
                "phase_transition",
            ],
            related_prerequisites=["workflow_audit_visibility"],
            notes=[
                "Current workflow-history remains sync-derived rather than workflow-grade.",
            ],
        ),
        DryRunReadinessBlocker(
            blocker="dry_run_contract_missing",
            category="contract",
            severity="critical",
            evidence_basis="design_review",
            summary=(
                "No dry-run API, preview payload, or diff contract exists yet in the backend."
            ),
            blocked_readiness_scopes=[
                "preview_contracts",
                "planning_depth",
                "phase_transition",
            ],
            related_prerequisites=[
                "topology_comparison_evidence",
                "policy_comparison_evidence",
                "capability_matrix_precision",
            ],
            notes=[
                "Bounded comparison evidence is not the same thing as a preview or diff model.",
            ],
        ),
        DryRunReadinessBlocker(
            blocker="validation_result_contract_missing",
            category="contract",
            severity="critical",
            evidence_basis="design_review",
            summary=(
                "No validation-result schema exists yet for future pre-change or post-change reasoning."
            ),
            blocked_readiness_scopes=["validation_contracts", "phase_transition"],
            related_prerequisites=[
                "topology_comparison_evidence",
                "policy_comparison_evidence",
                "capability_matrix_precision",
            ],
            notes=[
                "Current capability and comparison metadata remain explanatory rather than verdict-producing.",
            ],
        ),
        DryRunReadinessBlocker(
            blocker="topology_truth_still_bounded",
            category="truth",
            severity="major",
            evidence_basis="live_validated",
            summary=(
                "Topology truth remains intentionally bounded and inference-heavy rather than protocol-derived."
            ),
            blocked_readiness_scopes=["validation_contracts", "phase_transition"],
            related_prerequisites=["topology_comparison_evidence"],
            notes=[
                "Bounded topology comparison support is useful, but not workflow-grade path truth.",
            ],
        ),
        DryRunReadinessBlocker(
            blocker="policy_truth_still_bounded",
            category="truth",
            severity="major",
            evidence_basis="live_validated",
            summary=(
                "Policy truth remains intentionally bounded to aggregate counters, static detail when present, and snapshot comparison."
            ),
            blocked_readiness_scopes=["validation_contracts", "phase_transition"],
            related_prerequisites=["policy_comparison_evidence"],
            notes=[
                "The current lab still exposes a live-empty policy posture, which is honest but not workflow-grade policy truth.",
            ],
        ),
        DryRunReadinessBlocker(
            blocker="history_still_sync_derived",
            category="history",
            severity="major",
            evidence_basis="persisted_validated",
            summary=(
                "History remains derived from persisted sync activity and bounded snapshots rather than user or workflow lifecycle events."
            ),
            blocked_readiness_scopes=[
                "workflow_audit_relationships",
                "planning_depth",
                "phase_transition",
            ],
            related_prerequisites=["workflow_audit_visibility"],
            notes=[
                "Current audit visibility is real and useful, but not yet a workflow-grade action record.",
            ],
        ),
    ]
    assessment_areas = [
        DryRunReadinessAssessmentArea(
            area="model_maturity",
            status="mixed",
            summary=(
                "Inventory is stable enough to support future planning, but topology and "
                "policy still remain intentionally partial read-side models."
            ),
            strongest_gaps=[
                "Topology still depends on bounded inferred link evidence rather than protocol-derived adjacency truth.",
                "Policy truth remains bounded to counters, static-policy detail when present, and partial comparison support rather than full per-policy operational truth.",
            ],
        ),
        DryRunReadinessAssessmentArea(
            area="history_maturity",
            status="blocked",
            summary=(
                "History visibility is useful for sync-derived evidence, but it is not yet a "
                "workflow lifecycle or operator-action history foundation."
            ),
            strongest_gaps=[
                "No requested, planned, dry-run-complete, approved, executing, succeeded, failed, or rollback workflow records exist yet.",
                "Workflow-history and audit-history remain derived from persisted sync runs rather than a workflow-grade durable state model.",
            ],
        ),
        DryRunReadinessAssessmentArea(
            area="comparison_maturity",
            status="mixed",
            summary=(
                "The platform now has honest bounded comparison support for inventory, topology, "
                "policy, and persisted snapshot history, but those comparisons are still narrow "
                "and explanatory rather than validation-grade."
            ),
            strongest_gaps=[
                "Current comparisons are aggregate and normalized, not preview, diff, intent-reconciliation, or validation outputs.",
                "Comparison support still depends on bounded persisted evidence and does not yet cover a workflow-grade change model.",
            ],
        ),
        DryRunReadinessAssessmentArea(
            area="capability_maturity",
            status="strong_for_planning",
            summary=(
                "Capability-awareness is now explicit enough to support stricter future dry-run "
                "planning because support status, delivery tier, evidence basis, vendor posture, "
                "and bounded workflow-readiness interpretation are all exposed clearly."
            ),
            strongest_gaps=[
                "The matrix remains descriptive and does not yet drive dry-run eligibility, preview behavior, or validation outcomes.",
                "Future-ready Juniper structure exists, but no Juniper adapter behavior is implemented.",
            ],
        ),
        DryRunReadinessAssessmentArea(
            area="blocker_maturity",
            status="blocked",
            summary=(
                "Blockers are now explicit enough to assess strictly, but the blocker set still "
                "shows contract, truth, and history gaps that remain too severe for any future "
                "dry-run-phase move beyond planning discussion."
            ),
            strongest_gaps=[
                "Critical contract blockers still cover workflow lifecycle, preview or diff contracts, and validation-result schemas.",
                "Truth and history blockers still overlap with phase-transition scope, so the blocker picture remains a hard stop for dry-run-phase readiness beyond planning.",
            ],
        ),
    ]
    return DryRunReadinessSummary(
        status="bounded_readiness_support",
        planning_readiness="readiness_planning_supported",
        phase_recommendation="remain_phase_2_read_only_foundation",
        summary=(
            "The Phase 2 foundation is now strong enough to support a stricter evidence-based "
            "assessment of eventual dry-run-phase planning, but not strong enough to justify "
            "dry-run implementation, dry-run-phase entry, or any phase transition."
        ),
        readiness_scope=(
            "This readiness summary is descriptive only. It exists to show which bounded "
            "read-side foundations are mature enough to inform later dry-run-phase planning "
            "discussion, which blocker families remain too immature, and why the current "
            "platform must still remain fully inside Phase 2."
        ),
        notes=[
            "Readiness support is not dry-run functionality.",
            "The current platform still lacks requested or planned workflow records, dry-run outputs, approvals, rollback handling, and execution semantics.",
            "Any future dry-run work must build on these bounded prerequisites without overstating policy or topology truth.",
            "Planning readiness does not mean implementation readiness.",
            "This stricter assessment is evidence-based, but it still evaluates planning support only rather than readiness to begin dry-run implementation work.",
        ],
        strongest_blockers=[
            "No durable workflow lifecycle model exists yet for requested, planned, dry-run, validation, approval, execution, or rollback stages.",
            "No dry-run API contract, preview payload, diff model, or validation-result schema exists yet.",
            "Topology and policy truth remain intentionally partial, which is still too weak for workflow-grade pre-change intelligence.",
            "History remains sync-derived and snapshot-bounded rather than workflow-grade and user-action-aware.",
        ],
        bounded_next_steps=[
            "Define the future workflow lifecycle model and stage vocabulary in docs and schemas before any API implementation.",
            "Specify dry-run-oriented preview, diff, and validation-result contracts only after the bounded read-side evidence model is documented more strictly.",
            "Deepen policy and topology truth only where live evidence and stable normalized models already justify it.",
            "Preserve the current Phase 2 boundary until workflow records, dry-run contracts, and validation outputs are all real rather than descriptive.",
        ],
        evidence_coverage_counts=_count_values(
            prerequisite.evidence_coverage for prerequisite in prerequisites
        ),
        support_posture_counts=_count_values(
            prerequisite.support_posture for prerequisite in prerequisites
        ),
        blocker_category_counts=_count_values(blocker.category for blocker in blockers),
        blocker_severity_counts=_count_values(blocker.severity for blocker in blockers),
        blocked_scope_counts=_count_values(
            scope for blocker in blockers for scope in blocker.blocked_readiness_scopes
        ),
        assessment_areas=assessment_areas,
        blockers=blockers,
        prerequisites=prerequisites,
    )


def _cache_dry_run_readiness_metrics(
    *,
    dry_run_readiness: DryRunReadinessSummary,
    readiness_persisted_at: datetime | None,
) -> None:
    """Cache the bounded readiness-support metrics used by Prometheus."""
    cache_readiness_metrics(
        status=dry_run_readiness.status,
        planning_readiness=dry_run_readiness.planning_readiness,
        phase_recommendation=dry_run_readiness.phase_recommendation,
        persisted_at_seconds=(
            readiness_persisted_at.timestamp() if readiness_persisted_at is not None else None
        ),
        evidence_coverage_counts=dry_run_readiness.evidence_coverage_counts,
        support_posture_counts=dry_run_readiness.support_posture_counts,
        assessment_area_status_counts=dict(
            Counter(
                (area.area, area.status) for area in dry_run_readiness.assessment_areas
            )
        ),
        blocker_counts_by_category_and_severity=dict(
            Counter(
                (blocker.category, blocker.severity)
                for blocker in dry_run_readiness.blockers
            )
        ),
        blocked_scope_counts=_count_values(
            scope
            for blocker in dry_run_readiness.blockers
            for scope in blocker.blocked_readiness_scopes
        ),
    )


def refresh_readiness_metrics() -> None:
    """Refresh the cached readiness-support metrics without persisting a new snapshot."""
    dry_run_readiness = _build_dry_run_readiness_summary()
    readiness_reference = load_latest_readiness_snapshot_reference()
    _cache_dry_run_readiness_metrics(
        dry_run_readiness=dry_run_readiness,
        readiness_persisted_at=(
            readiness_reference.persisted_at if readiness_reference is not None else None
        ),
    )


def build_capabilities_list_response() -> CapabilitiesListResponse:
    """Build the bounded capability matrix response for the current phase."""
    settings = get_settings()
    dry_run_readiness = _build_dry_run_readiness_summary()
    readiness_persisted_at = persist_readiness_snapshot(
        dry_run_readiness=dry_run_readiness
    )
    readiness_reference = load_latest_readiness_snapshot_reference()
    _cache_dry_run_readiness_metrics(
        dry_run_readiness=dry_run_readiness,
        readiness_persisted_at=readiness_persisted_at,
    )
    items = [
        CapabilityRecord(
            vendor="nokia",
            platform="sros",
            version_scope="current onboarded Nokia SR OS lab targets",
            domain="inventory",
            feature="device_inventory",
            support_status="supported",
            implementation_status="implemented",
            delivery_tier="delivered_read_only",
            evidence_basis="live_validated",
            vendor_posture="current_nokia_focus",
            availability_scope=(
                "Live normalized gNMI-backed inventory across the onboarded "
                "Nokia-first device set."
            ),
            status_detail=(
                "The platform can currently serve this read-only inventory slice "
                "as a stable backend-owned contract for Nokia SR OS targets."
            ),
            caveats=[
                "This support statement is bounded to the current Nokia-first read-only inventory slice.",
                "Juniper inventory support is not implemented yet.",
            ],
            source_of_determination="live_inventory_read_path",
            workflow_readiness_status="supports_planning",
            workflow_readiness_scopes=["planning_depth"],
            workflow_readiness_detail=(
                "Stable inventory coverage is strong enough to support future planning context, "
                "but it does not by itself create preview, validation, or lifecycle contracts."
            ),
            related_readiness_blockers=[],
        ),
        CapabilityRecord(
            vendor="nokia",
            platform="sros",
            version_scope="current onboarded Nokia SR OS lab targets",
            domain="topology",
            feature="topology_observation",
            support_status="partially_supported",
            implementation_status="partial",
            delivery_tier="bounded_partial_read_only",
            evidence_basis="live_validated",
            vendor_posture="current_nokia_focus",
            availability_scope=(
                "Live normalized nodes plus bounded interface-inferred links for "
                "the current Nokia-first lab."
            ),
            status_detail=(
                "The platform can expose useful topology evidence, but the current "
                "slice remains intentionally partial rather than full adjacency or "
                "path truth."
            ),
            caveats=[
                "Link inference is still bounded to interface-name and operational-state evidence.",
                "Controller-derived or protocol-derived topology enrichment is not the current source of truth.",
            ],
            source_of_determination="live_topology_read_path",
            workflow_readiness_status="partial_foundation",
            workflow_readiness_scopes=[
                "planning_depth",
                "validation_contracts",
                "phase_transition",
            ],
            workflow_readiness_detail=(
                "This capability gives future planning useful live topology context, but it "
                "still remains too inference-heavy for workflow-grade validation or any phase move."
            ),
            related_readiness_blockers=[
                "topology_truth_still_bounded",
                "validation_result_contract_missing",
            ],
        ),
        CapabilityRecord(
            vendor="nokia",
            platform="sros",
            version_scope="current persisted topology snapshots",
            domain="topology",
            feature="topology_persisted_comparison",
            support_status="partially_supported",
            implementation_status="partial",
            delivery_tier="bounded_partial_read_only",
            evidence_basis="persisted_validated",
            vendor_posture="current_nokia_focus",
            availability_scope=(
                "Bounded current-versus-latest-persisted comparison over normalized "
                "topology snapshots when the backend already has persisted records."
            ),
            status_detail=(
                "The platform can compare the current topology response with the latest "
                "persisted normalized topology snapshot, but this remains aggregate "
                "comparison evidence rather than drift or protocol-adjacency truth."
            ),
            caveats=[
                "Comparison only exists when persisted topology snapshots are already available.",
                "This does not imply controller-backed topology validation or path computation.",
            ],
            source_of_determination="persisted_topology_snapshot_comparison",
            workflow_readiness_status="partial_foundation",
            workflow_readiness_scopes=[
                "planning_depth",
                "preview_contracts",
                "validation_contracts",
            ],
            workflow_readiness_detail=(
                "Bounded topology comparison can inform future preview and validation design, "
                "but it remains aggregate comparison evidence rather than a workflow-ready diff model."
            ),
            related_readiness_blockers=[
                "dry_run_contract_missing",
                "validation_result_contract_missing",
                "topology_truth_still_bounded",
            ],
        ),
        CapabilityRecord(
            vendor="nokia",
            platform="sros",
            version_scope="current onboarded Nokia SR OS lab targets",
            domain="policy",
            feature="policy_counter_visibility",
            support_status="partially_supported",
            implementation_status="partial",
            delivery_tier="bounded_partial_read_only",
            evidence_basis="live_validated",
            vendor_posture="current_nokia_focus",
            availability_scope=(
                "Live SR policy counters, target-role coverage, and live-empty posture "
                "interpretation for the current Nokia-first lab."
            ),
            status_detail=(
                "The platform can expose bounded policy presence, counter footprint, "
                "and live-empty versus detail-limited semantics, but this is still not "
                "full per-policy operational truth."
            ),
            caveats=[
                "This capability includes honest live-empty and detail-unavailable states.",
                "It does not by itself imply broad per-policy detail coverage.",
            ],
            source_of_determination="live_policy_read_path",
            workflow_readiness_status="partial_foundation",
            workflow_readiness_scopes=["planning_depth", "validation_contracts"],
            workflow_readiness_detail=(
                "Live policy counter visibility gives future planning a bounded policy posture, "
                "but it is still too aggregate for workflow-grade policy validation."
            ),
            related_readiness_blockers=[
                "policy_truth_still_bounded",
                "validation_result_contract_missing",
            ],
        ),
        CapabilityRecord(
            vendor="nokia",
            platform="sros",
            version_scope="current onboarded Nokia SR OS lab targets",
            domain="policy",
            feature="static_policy_detail",
            support_status="partially_supported",
            implementation_status="partial",
            delivery_tier="bounded_partial_read_only",
            evidence_basis="live_validated",
            vendor_posture="current_nokia_focus",
            availability_scope=(
                "Bounded per-policy detail for static local and static non-local policy "
                "records when that Nokia state is present."
            ),
            status_detail=(
                "The platform can render useful static-policy detail and candidate-path "
                "evidence, but broader BGP-signaled and deeper policy semantics remain "
                "outside the current slice."
            ),
            caveats=[
                "Support remains bounded to the currently normalized static-policy read shape.",
                "Write-safe policy workflows are still out of scope.",
            ],
            source_of_determination="live_policy_read_path",
            workflow_readiness_status="partial_foundation",
            workflow_readiness_scopes=["planning_depth", "validation_contracts"],
            workflow_readiness_detail=(
                "Static-policy detail helps future reasoning more than counters alone, but the "
                "current slice remains too narrow for broader workflow-safe policy conclusions."
            ),
            related_readiness_blockers=[
                "policy_truth_still_bounded",
                "validation_result_contract_missing",
            ],
        ),
        CapabilityRecord(
            vendor="nokia",
            platform="sros",
            version_scope="current persisted policy snapshots",
            domain="policy",
            feature="policy_persisted_comparison",
            support_status="partially_supported",
            implementation_status="partial",
            delivery_tier="bounded_partial_read_only",
            evidence_basis="persisted_validated",
            vendor_posture="current_nokia_focus",
            availability_scope=(
                "Bounded current-versus-latest-persisted and persisted-versus-previous "
                "comparison over normalized policy snapshots."
            ),
            status_detail=(
                "The platform can compare persisted normalized policy snapshots and the "
                "current response where records exist, but this remains bounded snapshot "
                "comparison rather than a drift engine."
            ),
            caveats=[
                "Comparison counts only reflect policies that currently have bounded normalized detail records.",
                "Comparison does not imply full policy history or execution validation.",
            ],
            source_of_determination="persisted_policy_snapshot_comparison",
            workflow_readiness_status="partial_foundation",
            workflow_readiness_scopes=[
                "planning_depth",
                "preview_contracts",
                "validation_contracts",
            ],
            workflow_readiness_detail=(
                "Bounded policy comparison is useful future preview context, but it is still "
                "snapshot-based evidence rather than a workflow-ready diff or validation contract."
            ),
            related_readiness_blockers=[
                "dry_run_contract_missing",
                "validation_result_contract_missing",
                "policy_truth_still_bounded",
            ],
        ),
        CapabilityRecord(
            vendor="nokia",
            platform="sros",
            version_scope="current onboarded Nokia SR OS lab targets",
            domain="policy",
            feature="bgp_signaled_policy_detail",
            support_status="unknown",
            implementation_status="planned",
            delivery_tier="future_roadmap",
            evidence_basis="design_review",
            vendor_posture="current_nokia_focus",
            availability_scope=(
                "Planned future policy-depth area only; no stable normalized backend "
                "contract exists yet."
            ),
            status_detail=(
                "The platform does not yet have enough live Nokia evidence or bounded "
                "model coverage to claim this capability honestly."
            ),
            caveats=[
                "Unknown is explicit here because the support picture is not yet validated by stable implementation.",
            ],
            source_of_determination="capability_matrix_review",
            workflow_readiness_status="blocked",
            workflow_readiness_scopes=["validation_contracts", "phase_transition"],
            workflow_readiness_detail=(
                "This missing capability still blocks stronger future workflow reasoning because "
                "policy truth remains too narrow for deeper validation-grade interpretation."
            ),
            related_readiness_blockers=["policy_truth_still_bounded"],
        ),
        CapabilityRecord(
            vendor="nokia",
            platform="sros",
            version_scope="platform-side persisted sync activity only",
            domain="workflow_history",
            feature="workflow_history_visibility",
            support_status="partially_supported",
            implementation_status="partial",
            delivery_tier="bounded_partial_read_only",
            evidence_basis="persisted_validated",
            vendor_posture="current_nokia_focus",
            availability_scope=(
                "Read-only history derived from persisted sync runs rather than an "
                "execution workflow engine."
            ),
            status_detail=(
                "Operators can inspect bounded platform-side sync activity today, but "
                "the platform does not yet expose fuller workflow semantics."
            ),
            caveats=[
                "No approvals, rollback, dry-run, or execution workflow state is implied by this capability.",
            ],
            source_of_determination="persisted_sync_activity_history",
            workflow_readiness_status="partial_foundation",
            workflow_readiness_scopes=[
                "planning_depth",
                "workflow_audit_relationships",
                "phase_transition",
            ],
            workflow_readiness_detail=(
                "Current workflow-history visibility helps future planning understand persisted sync "
                "activity, but it is still not a durable workflow lifecycle foundation."
            ),
            related_readiness_blockers=[
                "workflow_lifecycle_contract_missing",
                "history_still_sync_derived",
            ],
        ),
        CapabilityRecord(
            vendor="nokia",
            platform="sros",
            version_scope="platform-side persisted sync activity only",
            domain="audit_history",
            feature="audit_history_visibility",
            support_status="partially_supported",
            implementation_status="partial",
            delivery_tier="bounded_partial_read_only",
            evidence_basis="persisted_validated",
            vendor_posture="current_nokia_focus",
            availability_scope="Read-only audit-style visibility derived from persisted sync runs.",
            status_detail=(
                "The current audit view is useful for bounded platform-side "
                "visibility, but it is not a complete user-action audit system."
            ),
            caveats=[
                "User-driven audit history and broader action traces are not implemented in this phase.",
            ],
            source_of_determination="persisted_sync_activity_history",
            workflow_readiness_status="partial_foundation",
            workflow_readiness_scopes=["workflow_audit_relationships", "phase_transition"],
            workflow_readiness_detail=(
                "Current audit visibility contributes bounded future workflow context, but it "
                "still lacks workflow-grade actor, approval, and rollback relationships."
            ),
            related_readiness_blockers=[
                "workflow_lifecycle_contract_missing",
                "history_still_sync_derived",
            ],
        ),
        CapabilityRecord(
            vendor="nokia",
            platform="sros",
            version_scope="platform topology only",
            domain="platform_health",
            feature="odl_controller_capability_probe",
            support_status="partially_supported",
            implementation_status="partial",
            delivery_tier="bounded_partial_read_only",
            evidence_basis="platform_probe",
            vendor_posture="current_nokia_focus",
            availability_scope=(
                "Bounded controller reachability and capability hints exposed "
                "through platform health only."
            ),
            status_detail=(
                "The platform now uses one ODL-backed read enrichment for controller "
                "capability discovery without treating ODL as topology or policy truth."
            ),
            caveats=[
                "This does not imply broader controller-backed topology, policy, or workflow support.",
            ],
            source_of_determination="odl_restconf_capability_probe",
            workflow_readiness_status="context_only",
            workflow_readiness_scopes=[],
            workflow_readiness_detail=(
                "This platform-health probe is useful operational context, but it is not a primary "
                "future workflow-readiness foundation for preview, validation, or lifecycle design."
            ),
            related_readiness_blockers=[],
        ),
        CapabilityRecord(
            vendor="juniper",
            platform="junos",
            version_scope="planned next expansion",
            domain="inventory",
            feature="device_inventory",
            support_status="not_implemented_in_platform",
            implementation_status="planned",
            delivery_tier="future_roadmap",
            evidence_basis="roadmap_only",
            vendor_posture="future_juniper_target",
            availability_scope=(
                "Architecture target only; no Juniper inventory adapter or read path "
                "exists today."
            ),
            status_detail=(
                "The platform is designed to grow toward Juniper, but no delivered "
                "Juniper read-only inventory support should be inferred yet."
            ),
            caveats=[
                "This record exists to make the roadmap explicit without implying parity.",
            ],
            source_of_determination="vendor_roadmap",
            workflow_readiness_status="roadmap_only",
            workflow_readiness_scopes=[],
            workflow_readiness_detail=(
                "This roadmap-only record keeps the next vendor step visible, but it contributes "
                "nothing to current workflow-readiness until a real Juniper read path exists."
            ),
            related_readiness_blockers=[],
        ),
        CapabilityRecord(
            vendor="juniper",
            platform="junos",
            version_scope="planned next expansion",
            domain="topology",
            feature="topology_observation",
            support_status="not_implemented_in_platform",
            implementation_status="planned",
            delivery_tier="future_roadmap",
            evidence_basis="roadmap_only",
            vendor_posture="future_juniper_target",
            availability_scope=(
                "Architecture target only; no Juniper topology adapter, normalized "
                "read path, or persisted comparison support exists today."
            ),
            status_detail=(
                "The platform is structured to expand toward Juniper topology visibility "
                "next, but no delivered Juniper topology read-only support should be "
                "inferred yet."
            ),
            caveats=[
                "This record exists to make the next vendor target explicit without implying parity.",
                "No Juniper topology ingestion, persistence, or controller-backed enrichment is implemented.",
            ],
            source_of_determination="vendor_roadmap",
            workflow_readiness_status="roadmap_only",
            workflow_readiness_scopes=[],
            workflow_readiness_detail=(
                "This roadmap-only record preserves future vendor structure, but it does not add "
                "any present workflow-readiness support until Juniper topology evidence is real."
            ),
            related_readiness_blockers=[],
        ),
        CapabilityRecord(
            vendor="juniper",
            platform="junos",
            version_scope="planned next expansion",
            domain="policy",
            feature="policy_counter_visibility",
            support_status="not_implemented_in_platform",
            implementation_status="planned",
            delivery_tier="future_roadmap",
            evidence_basis="roadmap_only",
            vendor_posture="future_juniper_target",
            availability_scope=(
                "Architecture target only; no Juniper policy collector mapping or "
                "backend-owned normalized policy read path exists today."
            ),
            status_detail=(
                "The platform keeps Juniper policy visibility explicit as a future target, "
                "but no Juniper policy capability, counter, or detail support should be "
                "read as implemented yet."
            ),
            caveats=[
                "This is future-ready structure only and does not imply Juniper policy parity.",
                "No Juniper policy comparison, history, or workflow support is implemented.",
            ],
            source_of_determination="vendor_roadmap",
            workflow_readiness_status="roadmap_only",
            workflow_readiness_scopes=[],
            workflow_readiness_detail=(
                "This roadmap-only record keeps future vendor policy direction explicit, but it "
                "does not strengthen current workflow-readiness until real Juniper policy evidence exists."
            ),
            related_readiness_blockers=[],
        ),
    ]
    return CapabilitiesListResponse(
        service="app-api",
        version=settings.app_version,
        phase="phase_2_read_only_foundation",
        generated_at=datetime.now(UTC),
        data_status="bounded_matrix",
        summary=(
            "Phase 2 bounded capability matrix. Support state, implementation status, "
            "delivery tier, evidence basis, vendor posture, and bounded workflow-readiness "
            "interpretation are explicit across the current Nokia-first read-only product "
            "slice, while future Juniper expansion remains structurally visible but "
            "roadmap-only rather than implied parity."
        ),
        count=len(items),
        readiness_snapshot_id=(
            readiness_reference.snapshot_id if readiness_reference is not None else None
        ),
        readiness_persisted_at=readiness_persisted_at,
        domain_counts=_count_values(item.domain for item in items),
        support_counts=_count_values(item.support_status for item in items),
        implementation_counts=_count_values(item.implementation_status for item in items),
        delivery_tier_counts=_count_values(item.delivery_tier for item in items),
        evidence_basis_counts=_count_values(item.evidence_basis for item in items),
        vendor_counts=_count_values(item.vendor for item in items),
        vendor_posture_counts=_count_values(item.vendor_posture for item in items),
        workflow_readiness_counts=_count_values(
            item.workflow_readiness_status for item in items
        ),
        workflow_readiness_scope_counts=_count_values(
            scope for item in items for scope in item.workflow_readiness_scopes
        ),
        dry_run_readiness=dry_run_readiness,
        items=items,
    )
