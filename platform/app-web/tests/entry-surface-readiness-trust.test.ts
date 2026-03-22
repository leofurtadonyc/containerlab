import { describe, expect, it } from "vitest";

import type { DryRunReadinessBlocker, DryRunReadinessSummary } from "../src/api/contracts";
import { formatEntrySurfaceReadinessSummaryLines } from "../src/lib/entry-surface-readiness-trust";

const sampleBlocker: DryRunReadinessBlocker = {
  blocker: "dry_run_contract_missing",
  category: "contract",
  severity: "major",
  evidence_basis: "design_review",
  summary: "Gap.",
  blocked_readiness_scopes: ["planning_depth"],
  related_prerequisites: ["inventory_read_model"],
  notes: [],
};

describe("formatEntrySurfaceReadinessSummaryLines", () => {
  it("formats coarse headline, supporting line, and trust note", () => {
    const readiness: DryRunReadinessSummary = {
      status: "bounded_readiness_support",
      planning_readiness: "readiness_planning_supported",
      phase_recommendation: "remain_phase_2_read_only_foundation",
      summary: "S",
      readiness_scope: "R",
      notes: [],
      strongest_blockers: [],
      bounded_next_steps: [],
      evidence_coverage_counts: {},
      support_posture_counts: {},
      blocker_category_counts: {},
      blocker_severity_counts: {},
      blocked_scope_counts: {},
      assessment_areas: [],
      blockers: [sampleBlocker],
      prerequisites: [],
    };

    const lines = formatEntrySurfaceReadinessSummaryLines(readiness);

    expect(lines.headline).toBe("bounded readiness support");
    expect(lines.supportingLine).toContain("readiness planning supported");
    expect(lines.supportingLine).toContain("1 explicit blocker records");
    expect(lines.trustNote.length).toBeGreaterThan(10);
  });
});
