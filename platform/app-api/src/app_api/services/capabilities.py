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
                "topology_truth_merge",
                "controller_southbound_session_truth",
            ],
            current_evidence=(
                "Topology now exposes bounded current-versus-latest-persisted comparison "
                "evidence, backend-owned deeper topology truth, and controller southbound "
                "session-truth context."
            ),
            blocking_gaps=[
                "Even with deeper topology truth and controller session evidence, topology remains intentionally partial and should not yet be treated as full protocol-derived truth.",
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
                "Durable workflow lifecycle records exist, but adoption may be sparse; "
                "audit-history remains sync-derived rather than a full operator-action log.",
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
                "Bounded topology comparison, deeper topology truth, and controller southbound session evidence are useful, but they do not yet provide workflow-grade adjacency or path truth.",
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
                "Inventory is stable enough to support future planning, and topology now has "
                "deeper merged truth plus controller southbound session-truth context, but topology "
                "and policy still remain intentionally partial read-side models."
            ),
            strongest_gaps=[
                "Topology still depends primarily on bounded inferred link evidence; deeper topology truth and controller session evidence do not yet provide protocol-derived adjacency truth across the graph.",
                "Policy truth remains bounded to counters, static-policy detail when present, and partial comparison support rather than full per-policy operational truth.",
            ],
        ),
        DryRunReadinessAssessmentArea(
            area="history_maturity",
            status="mixed",
            summary=(
                "Durable workflow lifecycle records can exist, but audit-history remains "
                "sync-derived and is not a full operator-action history foundation."
            ),
            strongest_gaps=[
                "Workflow adoption may be sparse; workflow-history and audit-history remain "
                "derived from persisted sync runs rather than a complete workflow-grade model.",
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
                "A bounded backend-owned preview/diff exists for one narrow static_local intent "
                "slice; it is not a full validation or multi-family change model.",
                "Comparison support still depends on bounded persisted evidence and does not yet "
                "cover workflow-grade execution or rollback semantics.",
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
                "The matrix is still descriptive for most features; preview eligibility is "
                "enforced only for the narrow preview engine v1 scope.",
                "Future-ready Juniper structure exists, but no Juniper adapter behavior is implemented.",
            ],
        ),
        DryRunReadinessAssessmentArea(
            area="blocker_maturity",
            status="blocked",
            summary=(
                "Blockers are explicit: workflow lifecycle and bounded preview contracts exist, "
                "but validation schemas, truth depth, and history fidelity still block "
                "dry-run-phase entry or phase transition."
            ),
            strongest_gaps=[
                "Validation-result and execution contracts remain missing.",
                "Truth and history blockers still overlap with phase-transition scope.",
            ],
        ),
    ]
    return DryRunReadinessSummary(
        status="bounded_readiness_support",
        planning_readiness="readiness_planning_supported",
        phase_recommendation="remain_phase_2_read_only_foundation",
        summary=(
            "The Phase 2 foundation includes durable workflow lifecycle records and a bounded "
            "backend-owned preview/diff for one narrow static_local intent slice plus deeper topology "
            "truth and controller southbound session-truth context. Validation outputs, execution, "
            "and phase transition remain out of scope."
        ),
        readiness_scope=(
            "This readiness summary is descriptive only. It exists to show which bounded "
            "read-side foundations are mature enough to inform later dry-run-phase planning "
            "discussion, which blocker families remain too immature, and why the current "
            "platform must still remain fully inside Phase 2."
        ),
        notes=[
            "Readiness support is not execution authority.",
            "Preview engine v1 is bounded, capability-gated, and does not perform validation verdicts or network changes.",
            "Deeper topology truth and controller southbound session-truth improve read-side context, not workflow authority or full adjacency/path truth.",
            "Validation outputs, approvals, rollback execution, and broader dry-run families remain future work.",
            "Planning readiness does not mean phase transition readiness.",
        ],
        strongest_blockers=[
            "No validation-result schema exists yet for pre-change or post-change verdicts.",
            "Topology and policy truth remain intentionally partial for workflow-grade pre-change intelligence.",
            "History remains sync-derived and snapshot-bounded rather than a full operator-action record.",
        ],
        bounded_next_steps=[
            "Extend preview only along documented contracts; avoid silent broadening beyond proven normalized models.",
            "Specify validation-result contracts before treating previews as execution prerequisites.",
            "Deepen policy and topology truth only where live evidence and stable normalized models justify it.",
            "Preserve Phase 2 read-only boundaries until phase transition is explicitly authorized.",
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
    readiness_evaluated_at: datetime,
    readiness_persisted_at: datetime | None,
) -> None:
    """Cache the bounded readiness-support metrics used by Prometheus."""
    cache_readiness_metrics(
        status=dry_run_readiness.status,
        planning_readiness=dry_run_readiness.planning_readiness,
        phase_recommendation=dry_run_readiness.phase_recommendation,
        evaluation_at_seconds=readiness_evaluated_at.timestamp(),
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
    readiness_evaluated_at = datetime.now(UTC)
    dry_run_readiness = _build_dry_run_readiness_summary()
    readiness_reference = load_latest_readiness_snapshot_reference()
    _cache_dry_run_readiness_metrics(
        dry_run_readiness=dry_run_readiness,
        readiness_evaluated_at=readiness_evaluated_at,
        readiness_persisted_at=(
            readiness_reference.persisted_at if readiness_reference is not None else None
        ),
    )


def build_capabilities_list_response() -> CapabilitiesListResponse:
    """Build the bounded capability matrix response for the current phase."""
    settings = get_settings()
    generated_at = datetime.now(UTC)
    dry_run_readiness = _build_dry_run_readiness_summary()
    readiness_persisted_at = persist_readiness_snapshot(
        dry_run_readiness=dry_run_readiness
    )
    readiness_reference = load_latest_readiness_snapshot_reference()
    _cache_dry_run_readiness_metrics(
        dry_run_readiness=dry_run_readiness,
        readiness_evaluated_at=generated_at,
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
                "Controller-derived topology and controller southbound session truth now exist as bounded backend-owned context, but the normalized topology baseline remains the primary source of truth.",
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
            version_scope="current merged gNMI plus bounded controller export view",
            domain="topology",
            feature="topology_truth_merge",
            support_status="partially_supported",
            implementation_status="partial",
            delivery_tier="bounded_partial_read_only",
            evidence_basis="live_validated",
            vendor_posture="current_nokia_focus",
            availability_scope=(
                "Backend-owned deeper topology truth v1 that merges normalized gNMI topology "
                "with optional bounded controller export when reachable."
            ),
            status_detail=(
                "The platform now exposes a deeper topology truth slice with per-object posture, "
                "provenance, freshness, and disagreements, but it remains a bounded merged read "
                "model rather than adjacency, dataplane, or TE truth."
            ),
            caveats=[
                "Controller inputs remain bounded enrichment only; the backend owns the merged read model.",
                "Protocol-confirmed links and controller-correlated scope markers do not imply path validation or full graph completeness.",
            ],
            source_of_determination="topology_truth_v1_live_route",
            workflow_readiness_status="partial_foundation",
            workflow_readiness_scopes=["planning_depth", "validation_contracts", "phase_transition"],
            workflow_readiness_detail=(
                "Deeper topology truth gives future planning more source-aware topology context, "
                "but it remains intentionally partial and does not remove validation-grade topology blockers."
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
            version_scope="current normalized topology object pivots",
            domain="topology",
            feature="topology_related_policy_pivots",
            support_status="supported",
            implementation_status="partial",
            delivery_tier="bounded_partial_read_only",
            evidence_basis="live_validated",
            vendor_posture="current_nokia_focus",
            availability_scope=(
                "Read-only related-policies and topology-impact pivots over the current normalized "
                "topology and policy inventory slices."
            ),
            status_detail=(
                "The platform can currently pivot between topology objects and related policy records "
                "using stable bounded read-only contracts, while keeping the relationship semantics "
                "explicitly string-aligned rather than dependency or dataplane truth."
            ),
            caveats=[
                "These pivots are exact string-equality interpretation surfaces, not blast-radius, dependency, or forwarding truth.",
                "Completeness remains bounded to the current normalized topology and policy inventory slices.",
            ],
            source_of_determination="topology_related_policies_live_routes",
            workflow_readiness_status="partial_foundation",
            workflow_readiness_scopes=["planning_depth"],
            workflow_readiness_detail=(
                "These pivots improve future planning navigation and interpretation, but they do not create validation-grade dependency semantics."
            ),
            related_readiness_blockers=["topology_truth_still_bounded"],
        ),
        CapabilityRecord(
            vendor="nokia",
            platform="sros",
            version_scope="current topology object interpretation surfaces",
            domain="topology",
            feature="topology_failure_impact",
            support_status="supported",
            implementation_status="partial",
            delivery_tier="bounded_partial_read_only",
            evidence_basis="live_validated",
            vendor_posture="current_nokia_focus",
            availability_scope=(
                "Read-only failure-impact v1 rollups for normalized topology nodes and links using "
                "existing related-policy and degraded-policy evidence."
            ),
            status_detail=(
                "The platform now exposes bounded per-object failure-impact interpretation, but it "
                "remains relationship-based evidence assembly rather than failure simulation, blast "
                "radius, or safe-change authority."
            ),
            caveats=[
                "Failure-impact v1 is subset-scoped to related policy evidence for the selected object.",
                "It does not simulate failures, dependencies, dataplane behavior, or policy binding to a specific adjacency.",
            ],
            source_of_determination="failure_impact_v1_live_route",
            workflow_readiness_status="partial_foundation",
            workflow_readiness_scopes=["planning_depth"],
            workflow_readiness_detail=(
                "Failure-impact v1 improves future planning interpretation for one object at a time, but it is not validation, dependency, or execution authority."
            ),
            related_readiness_blockers=["topology_truth_still_bounded"],
        ),
        CapabilityRecord(
            vendor="nokia",
            platform="sros",
            version_scope="current topology-wide attention summary",
            domain="topology",
            feature="topology_risk_summary",
            support_status="supported",
            implementation_status="partial",
            delivery_tier="bounded_partial_read_only",
            evidence_basis="live_validated",
            vendor_posture="current_nokia_focus",
            availability_scope=(
                "Read-only topology risk summary v1 ranking across the current normalized topology "
                "object set."
            ),
            status_detail=(
                "The platform can currently rank topology objects for operator attention using published "
                "related-policy and degraded-policy inputs, without claiming SLA risk, traffic risk, or optimization authority."
            ),
            caveats=[
                "Ranking is subset-scoped and evidence-derived only; it is not blast radius or service risk truth.",
                "The ranking remains bounded by current topology and policy inventory completeness.",
            ],
            source_of_determination="topology_risk_summary_v1_live_route",
            workflow_readiness_status="partial_foundation",
            workflow_readiness_scopes=["planning_depth"],
            workflow_readiness_detail=(
                "This summary helps future planning prioritize bounded review targets, but it does not become validation, severity, or safe-change authority."
            ),
            related_readiness_blockers=["topology_truth_still_bounded"],
        ),
        CapabilityRecord(
            vendor="nokia",
            platform="sros",
            version_scope="current topology object composed read-only workspaces",
            domain="topology",
            feature="topology_object_dossier",
            support_status="supported",
            implementation_status="partial",
            delivery_tier="bounded_partial_read_only",
            evidence_basis="live_validated",
            vendor_posture="current_nokia_focus",
            availability_scope=(
                "Read-only topology object dossier composition over related-policy, failure-impact, and adjacent topology object evidence slices."
            ),
            status_detail=(
                "The platform now exposes a topology object dossier workspace for bounded operator drill-through, while keeping the composed result explicitly read-only and non-authoritative."
            ),
            caveats=[
                "The dossier is a composition surface over existing contracts, not a new topology truth domain.",
                "It does not replace per-slice non-claims or imply write/workflow authority.",
            ],
            source_of_determination="topology_object_dossier_v1_live_route",
            workflow_readiness_status="context_only",
            workflow_readiness_scopes=[],
            workflow_readiness_detail=(
                "The dossier improves operator context and navigation, but it is not itself a foundational preview, validation, or lifecycle contract."
            ),
            related_readiness_blockers=[],
        ),
        CapabilityRecord(
            vendor="nokia",
            platform="sros",
            version_scope="current topology object evidence chronology and comparison",
            domain="topology",
            feature="topology_object_evidence_history",
            support_status="supported",
            implementation_status="partial",
            delivery_tier="bounded_partial_read_only",
            evidence_basis="live_validated",
            vendor_posture="current_nokia_focus",
            availability_scope=(
                "Read-only topology object evidence timeline and delta surfaces over the current and persisted normalized topology/policy evidence families."
            ),
            status_detail=(
                "The platform now exposes bounded object-scoped evidence timeline and delta interpretation surfaces, while keeping them explicitly separate from drift truth, dataplane history, or workflow chronology."
            ),
            caveats=[
                "These surfaces are chronology and comparison aids only, not topology drift authority or packet-path history.",
                "Coverage remains bounded by persisted snapshot availability and the current normalized object identity rules.",
            ],
            source_of_determination="topology_object_evidence_timeline_delta_live_routes",
            workflow_readiness_status="context_only",
            workflow_readiness_scopes=[],
            workflow_readiness_detail=(
                "These history surfaces improve operator inspection context, but they do not create validation results, execution history, or workflow-grade audit semantics."
            ),
            related_readiness_blockers=[],
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
                "ODL is optional helper input only; app-api remains the translator and product contract owner.",
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
            vendor="nokia",
            platform="sros",
            version_scope="current bounded ODL southbound helper integration",
            domain="platform_health",
            feature="controller_southbound_session_truth",
            support_status="partially_supported",
            implementation_status="partial",
            delivery_tier="bounded_partial_read_only",
            evidence_basis="live_validated",
            vendor_posture="current_nokia_focus",
            availability_scope=(
                "Read-only controller southbound session truth for BGP-LS, PCEP, and NETCONF lanes exposed through bounded ODL RESTCONF integration."
            ),
            status_detail=(
                "The platform now exposes explicit controller southbound session truth with per-lane posture, object visibility, session posture, evidence strength, and derivation mode, while keeping controller reachability separate from southbound protocol truth."
            ),
            caveats=[
                "Controller-exported lane evidence is bounded and does not imply dataplane, TE, or path-validation truth.",
                "Native session trees can be absent or partial; fallback derivation remains explicit rather than hidden.",
            ],
            source_of_determination="controller_southbound_session_truth_v2_live_route",
            workflow_readiness_status="partial_foundation",
            workflow_readiness_scopes=["planning_depth", "validation_contracts"],
            workflow_readiness_detail=(
                "Controller southbound session truth improves future planning context for controller-assisted topology reasoning, but it remains too bounded for workflow-grade validation or phase transition claims."
            ),
            related_readiness_blockers=[
                "topology_truth_still_bounded",
                "validation_result_contract_missing",
            ],
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
        generated_at=generated_at,
        data_status="bounded_matrix",
        summary=(
            "Phase 2 bounded capability matrix. Support state, implementation status, "
            "delivery tier, evidence basis, vendor posture, and bounded workflow-readiness "
            "interpretation are explicit across the current Nokia-first read-only product "
            "slice, including deeper topology truth, controller southbound session truth, "
            "and topology drill-through interpretation surfaces, while future Juniper expansion remains structurally visible but "
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
