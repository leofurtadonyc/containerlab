import type {
  DryRunReadinessAssessmentArea,
  DryRunReadinessBlocker,
  DryRunReadinessPrerequisite,
  DryRunReadinessSummary,
} from "../api/contracts";

export const FALLBACK_DRY_RUN_READINESS: DryRunReadinessSummary = {
  status: "foundation_strengthening",
  planning_readiness: "more_foundation_needed",
  phase_recommendation: "remain_phase_2_read_only_foundation",
  summary:
    "Dry-run-readiness support is not available from the current backend response.",
  readiness_scope:
    "This WebUI view is falling back safely because the running backend has not exposed the bounded readiness summary yet.",
  notes: [
    "The readiness view remains usable even when this newer readiness metadata has not been rolled out.",
    "This fallback does not imply any dry-run functionality.",
  ],
  strongest_blockers: [
    "No stricter readiness assessment is available from the current backend response.",
  ],
  bounded_next_steps: [
    "Keep the platform in Phase 2 until the backend exposes a stricter readiness assessment.",
  ],
  evidence_coverage_counts: {},
  support_posture_counts: {},
  blocker_category_counts: {},
  blocker_severity_counts: {},
  blocked_scope_counts: {},
  assessment_areas: [],
  blockers: [],
  prerequisites: [],
};

export function describeDryRunReadinessStatus(value: string): string {
  switch (value) {
    case "bounded_readiness_support":
      return "The read-only foundation is strong enough to expose bounded prerequisite readiness for future dry-run work.";
    default:
      return "The current read-only foundation still needs more strengthening before even bounded dry-run readiness should be exposed.";
  }
}

export function describePlanningReadiness(value: string): string {
  switch (value) {
    case "readiness_planning_supported":
      return "The current read-only foundation is strong enough to support stricter future dry-run planning, but not implementation.";
    default:
      return "The current read-only foundation still needs more strengthening before even bounded dry-run planning should be treated as credible.";
  }
}

export function describeAssessmentAreaStatus(value: string): string {
  switch (value) {
    case "strong_for_planning":
      return "This area is strong enough to support future planning discussions.";
    case "mixed":
      return "This area has useful foundations but still retains important blockers or truth gaps.";
    default:
      return "This area is still a hard blocker for any credible dry-run phase planning.";
  }
}

export function describeEvidenceCoverage(value: string): string {
  switch (value) {
    case "strong":
      return "Evidence is stable enough to support the bounded readiness claim for this prerequisite.";
    case "bounded":
      return "Evidence exists and is useful, but the truth slice remains intentionally bounded.";
    case "partial":
      return "Some evidence exists, but it is still incomplete for stronger readiness reasoning.";
    default:
      return "The current platform evidence is blocked from supporting this prerequisite more strongly.";
  }
}

export function describeReadinessBlockerSeverity(value: string): string {
  switch (value) {
    case "critical":
      return "This blocker prevents any stronger readiness claim for future dry-run reasoning.";
    default:
      return "This blocker is important, but it sits below the contract-level blockers that fully stop readiness progress.";
  }
}

export function describeReadinessBlockerCategory(value: string): string {
  switch (value) {
    case "contract":
      return "This blocker exists because stable backend-owned contracts do not exist yet.";
    case "truth":
      return "This blocker exists because the current truth model remains intentionally bounded.";
    default:
      return "This blocker exists because durable history is still too narrow for workflow-grade reasoning.";
  }
}

function normalizeReadinessPrerequisite(
  value: Partial<DryRunReadinessPrerequisite>,
): DryRunReadinessPrerequisite {
  return {
    prerequisite: value.prerequisite ?? "capability_matrix_precision",
    status: value.status ?? "not_ready",
    support_posture: value.support_posture ?? "unknown",
    evidence_basis: value.evidence_basis ?? "design_review",
    evidence_coverage: value.evidence_coverage ?? "blocked",
    related_capabilities: value.related_capabilities ?? [],
    current_evidence:
      value.current_evidence ?? "No bounded prerequisite evidence was provided by the backend.",
    blocking_gaps: value.blocking_gaps ?? [],
  };
}

function normalizeReadinessBlocker(
  value: Partial<DryRunReadinessBlocker>,
): DryRunReadinessBlocker {
  return {
    blocker: value.blocker ?? "workflow_lifecycle_contract_missing",
    category: value.category ?? "contract",
    severity: value.severity ?? "major",
    evidence_basis: value.evidence_basis ?? "design_review",
    summary: value.summary ?? "No blocker summary was provided by the backend.",
    blocked_readiness_scopes: value.blocked_readiness_scopes ?? [],
    related_prerequisites: value.related_prerequisites ?? [],
    notes: value.notes ?? [],
  };
}

function normalizeReadinessAssessmentArea(
  value: Partial<DryRunReadinessAssessmentArea>,
): DryRunReadinessAssessmentArea {
  return {
    area: value.area ?? "capability_maturity",
    status: value.status ?? "blocked",
    summary: value.summary ?? "No assessment summary was provided by the backend.",
    strongest_gaps: value.strongest_gaps ?? [],
  };
}

export function normalizeDryRunReadiness(
  value: Partial<DryRunReadinessSummary> | undefined,
): DryRunReadinessSummary {
  return {
    ...FALLBACK_DRY_RUN_READINESS,
    ...value,
    notes: value?.notes ?? FALLBACK_DRY_RUN_READINESS.notes,
    strongest_blockers:
      value?.strongest_blockers ?? FALLBACK_DRY_RUN_READINESS.strongest_blockers,
    bounded_next_steps:
      value?.bounded_next_steps ?? FALLBACK_DRY_RUN_READINESS.bounded_next_steps,
    evidence_coverage_counts:
      value?.evidence_coverage_counts ?? FALLBACK_DRY_RUN_READINESS.evidence_coverage_counts,
    support_posture_counts:
      value?.support_posture_counts ?? FALLBACK_DRY_RUN_READINESS.support_posture_counts,
    blocker_category_counts:
      value?.blocker_category_counts ?? FALLBACK_DRY_RUN_READINESS.blocker_category_counts,
    blocker_severity_counts:
      value?.blocker_severity_counts ?? FALLBACK_DRY_RUN_READINESS.blocker_severity_counts,
    blocked_scope_counts:
      value?.blocked_scope_counts ?? FALLBACK_DRY_RUN_READINESS.blocked_scope_counts,
    assessment_areas:
      value?.assessment_areas?.map((item) => normalizeReadinessAssessmentArea(item)) ??
      FALLBACK_DRY_RUN_READINESS.assessment_areas,
    blockers:
      value?.blockers?.map((item) => normalizeReadinessBlocker(item)) ??
      FALLBACK_DRY_RUN_READINESS.blockers,
    prerequisites:
      value?.prerequisites?.map((item) => normalizeReadinessPrerequisite(item)) ??
      FALLBACK_DRY_RUN_READINESS.prerequisites,
  };
}
