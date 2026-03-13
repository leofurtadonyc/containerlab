"""Capability service helpers."""

from datetime import UTC, datetime
from typing import Iterable

from app_api.config.settings import get_settings
from app_api.persistence.readiness import persist_readiness_snapshot
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
                "and vendor posture for the current product slice."
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
                "planning because support status, delivery tier, evidence basis, and vendor posture "
                "are all exposed clearly."
            ),
            strongest_gaps=[
                "The matrix remains descriptive and does not yet drive dry-run eligibility, preview behavior, or validation outcomes.",
                "Future-ready Juniper structure exists, but no Juniper adapter behavior is implemented.",
            ],
        ),
    ]
    return DryRunReadinessSummary(
        status="bounded_readiness_support",
        planning_readiness="readiness_planning_supported",
        phase_recommendation="remain_phase_2_read_only_foundation",
        summary=(
            "The Phase 2 foundation is now strong enough to support stricter future dry-run "
            "planning assessment, but not strong enough to justify dry-run implementation or "
            "a phase transition."
        ),
        readiness_scope=(
            "This readiness summary is descriptive only. It exists to show which bounded "
            "read-side foundations are mature enough to inform later dry-run planning and "
            "which blockers still prevent any workflow-phase move."
        ),
        notes=[
            "Readiness support is not dry-run functionality.",
            "The current platform still lacks requested or planned workflow records, dry-run outputs, approvals, rollback handling, and execution semantics.",
            "Any future dry-run work must build on these bounded prerequisites without overstating policy or topology truth.",
            "Planning readiness does not mean implementation readiness.",
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
        assessment_areas=assessment_areas,
        blockers=blockers,
        prerequisites=prerequisites,
    )


def build_capabilities_list_response() -> CapabilitiesListResponse:
    """Build the bounded capability matrix response for the current phase."""
    settings = get_settings()
    dry_run_readiness = _build_dry_run_readiness_summary()
    readiness_persisted_at = persist_readiness_snapshot(
        dry_run_readiness=dry_run_readiness
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
            "delivery tier, evidence basis, and vendor posture are explicit across the "
            "current Nokia-first read-only product slice, while future Juniper expansion "
            "remains structurally visible but roadmap-only rather than implied parity."
        ),
        count=len(items),
        readiness_persisted_at=readiness_persisted_at,
        domain_counts=_count_values(item.domain for item in items),
        support_counts=_count_values(item.support_status for item in items),
        implementation_counts=_count_values(item.implementation_status for item in items),
        delivery_tier_counts=_count_values(item.delivery_tier for item in items),
        evidence_basis_counts=_count_values(item.evidence_basis for item in items),
        vendor_counts=_count_values(item.vendor for item in items),
        vendor_posture_counts=_count_values(item.vendor_posture for item in items),
        dry_run_readiness=dry_run_readiness,
        items=items,
    )
