import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { MaintenanceWindowWorkspaceResponse } from "../src/api/contracts";
import { MaintenanceWindowWorkspaceProduct } from "../src/features/maintenance-window-workspace/maintenance-window-workspace-product";

const baseMeta = {
  service: "app-api",
  version: "0.1.0",
  phase: "phase_2_read_only_foundation" as const,
  generated_at: "2025-01-01T00:00:00Z",
};

const fixture: MaintenanceWindowWorkspaceResponse = {
  metadata: baseMeta,
  contract_id: "maintenance_window_workspace_v1",
  window_framing_summary: "Test framing.",
  preview_context: "planning_window",
  subject_cap_applied: 16,
  subjects_requested: 2,
  subjects_resolved: 2,
  selected_subjects: ["link:L1", "node:PE1"],
  subject_strip: [
    {
      object_kind: "node",
      object_id: "PE1",
      display_name: "PE1",
      sparse_preview: false,
      related_policy_count: 2,
      related_services_total: 3,
    },
    {
      object_kind: "link",
      object_id: "L1",
      display_name: "L1",
      sparse_preview: true,
      related_policy_count: 0,
      related_services_total: 0,
    },
  ],
  subject_resolution_failures: [
    {
      object_kind: "node",
      object_id: "missing",
      reason: "Topology object not found",
    },
  ],
  deduped_affected_services: [
    {
      service_id: "policy:pol-1",
      kind: "policy",
      member_count: 2,
      degraded_group_posture: "degraded",
      touched_by_subjects: ["node:PE1"],
    },
  ],
  deduped_related_policies: [
    {
      policy_id: "pol-1",
      policy_name: "Alpha",
      touched_by_subjects: ["node:PE1", "link:L1"],
    },
  ],
  merged_assembly_caveats: ["caveat one"],
  merged_evidence_gap_notes: ["gap one"],
  stability_cue_summary: "operational_stability_posture='quiet_or_stable_evidence'",
  stability_summary_unavailable_note: null,
  tension_cue_rows: [
    { summary: "Tension A", detail: "detail", category: "freshness_or_serving_mismatch" },
  ],
  evidence_consistency_unavailable_note: null,
  explicit_non_claims: ["maintenance_window_workspace_v1 is composed read-only…"],
  source_contract_ids: ["maintenance_window_workspace_v1", "maintenance_preview_v1"],
  sync_runs_limit_applied: 20,
  recommended_api_pivots: ["GET /api/v1/maintenance-preview — …"],
};

describe("MaintenanceWindowWorkspaceProduct", () => {
  it("renders major rollup sections and non-authoritative copy", () => {
    const html = renderToStaticMarkup(
      <MaintenanceWindowWorkspaceProduct data={fixture} onReload={() => undefined} onChangeSubjects={() => undefined} />,
    );
    expect(html).toContain("data-contract=\"maintenance_window_workspace_v1\"");
    expect(html).toContain("data-section=\"selected-subjects\"");
    expect(html).toContain("data-section=\"deduped-services\"");
    expect(html).toContain("data-section=\"deduped-policies\"");
    expect(html).toContain("data-section=\"evidence-gaps\"");
    expect(html).toContain("data-section=\"stability-cues\"");
    expect(html).toContain("data-section=\"tension-cues\"");
    expect(html).toContain("data-section=\"non-claims\"");
    expect(html).toContain("union summaries");
    expect(html).toContain("policy:pol-1");
    expect(html).toContain("pol-1");
    expect(html).toContain("Partial resolution");
    expect(html).toContain("not hidden completeness");
    expect(html).toContain("Explicit non-claims");
  });

  it("renders empty dedupe sections honestly", () => {
    const empty: MaintenanceWindowWorkspaceResponse = {
      ...fixture,
      deduped_affected_services: [],
      deduped_related_policies: [],
      merged_evidence_gap_notes: [],
      tension_cue_rows: [],
      merged_assembly_caveats: [],
    };
    const html = renderToStaticMarkup(
      <MaintenanceWindowWorkspaceProduct data={empty} onReload={() => undefined} onChangeSubjects={() => undefined} />,
    );
    expect(html).toContain("No service groupings appeared");
    expect(html).toContain("No related policy rows");
    expect(html).toContain("No merged gap lines");
  });
});
