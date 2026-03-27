import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/** Regression: cross-surface pivots import the bounded topology helper (week 38 Thursday task 01). */
describe("maintenance window workspace cross-surface pivots", () => {
  const files = [
    "../src/features/topology/topology-object-dossier-workspace.tsx",
    "../src/features/topology/topology-failure-impact-panel.tsx",
    "../src/features/maintenance-preview/maintenance-preview-product.tsx",
    "../src/features/maintenance-evidence-workspace/maintenance-evidence-workspace-product.tsx",
    "../src/features/service-impact-workspace/service-impact-workspace-product.tsx",
    "../src/features/service-dossier/service-dossier-product.tsx",
    "../src/features/change-safety-case/change-safety-case-product.tsx",
    "../src/features/stability-workspace/view.tsx",
    "../src/features/policies/policy-explainability-workspace.tsx",
  ];

  it.each(files)("%s wires navigateToMaintenanceWindowWorkspaceForTopologyObject", (rel) => {
    const src = readFileSync(join(__dirname, rel), "utf8");
    expect(src).toContain("navigateToMaintenanceWindowWorkspaceForTopologyObject");
    expect(src).toContain('from "../../lib/maintenance-window-workspace-navigation"');
  });
});

/** Week 38 Thursday task 02 — NOC cockpit, global search, operator briefing. */
describe("maintenance window workspace coordination surfaces (week 38 task 02)", () => {
  const files = [
    "../src/features/global-search/global-operator-search.tsx",
    "../src/features/overview/noc-cockpit-strategic-pivots.tsx",
    "../src/features/overview/noc-cockpit-operator-launch-grid.tsx",
    "../src/features/operator-briefing/operator-briefing-product.tsx",
  ];

  it.each(files)("%s wires navigateToMaintenanceWindowWorkspaceForTopologyObject", (rel) => {
    const src = readFileSync(join(__dirname, rel), "utf8");
    expect(src).toContain("navigateToMaintenanceWindowWorkspaceForTopologyObject");
  });
});
