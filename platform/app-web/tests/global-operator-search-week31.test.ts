import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Regression: week 31+ global search deeplinks (composition-only; same operator_search_pivot_v1 API).
 * Ensures shipped UI strings for Service Explorer / explainability / maintenance / impact / change-safety pivots stay present.
 */
describe("global operator search week 31 deeplinks (source contract)", () => {
  it("global-operator-search exposes impact report pivots and hub copy", () => {
    const path = join(__dirname, "../src/features/global-search/global-operator-search.tsx");
    const src = readFileSync(path, "utf8");
    expect(src).toContain("Impact report (policy)");
    expect(src).toContain("Impact report (maintenance)");
    expect(src).toContain("Impact report hub");
    expect(src).toContain("navigateToImpactReportForPolicy");
    expect(src).toContain("navigateToImpactReportHub");
    expect(src).toContain("topology_drilldown");
    expect(src).toContain("Service dossier");
    expect(src).toContain("navigateToServiceDossierForPolicy");
  });

  it("global-operator-search exposes change safety case pivots and hub (week 32)", () => {
    const path = join(__dirname, "../src/features/global-search/global-operator-search.tsx");
    const src = readFileSync(path, "utf8");
    expect(src).toContain("Change safety case (policy)");
    expect(src).toContain("Change safety case (maintenance)");
    expect(src).toContain("Change safety case hub");
    expect(src).toContain("navigateToChangeSafetyCaseForPolicy");
    expect(src).toContain("navigateToChangeSafetyCaseForMaintenance");
    expect(src).toContain("navigateToChangeSafetyCaseHub");
  });

  it("global-operator-search exposes Path Explorer pivot for policy hits (week 34)", () => {
    const path = join(__dirname, "../src/features/global-search/global-operator-search.tsx");
    const src = readFileSync(path, "utf8");
    expect(src).toContain("Path Explorer");
    expect(src).toContain("navigateToPathExplorer");
  });

  it("global-operator-search exposes Service Impact workspace pivot for policy hits (week 34)", () => {
    const path = join(__dirname, "../src/features/global-search/global-operator-search.tsx");
    const src = readFileSync(path, "utf8");
    expect(src).toContain("Service Impact");
    expect(src).toContain("navigateToServiceImpactWorkspace");
    expect(src).toContain("service_impact_workspace_v1");
  });

  it("global-operator-search exposes Maintenance evidence workspace for topology hits (week 36)", () => {
    const path = join(__dirname, "../src/features/global-search/global-operator-search.tsx");
    const src = readFileSync(path, "utf8");
    expect(src).toContain("Maintenance evidence workspace");
    expect(src).toContain("navigateToMaintenanceEvidenceWorkspaceForTopologyObject");
    expect(src).toContain("maintenance_evidence_workspace_v1");
  });

  it("global-operator-search exposes Maintenance window workspace for topology hits (week 38)", () => {
    const path = join(__dirname, "../src/features/global-search/global-operator-search.tsx");
    const src = readFileSync(path, "utf8");
    expect(src).toContain("Maintenance window workspace");
    expect(src).toContain("navigateToMaintenanceWindowWorkspaceForTopologyObject");
    expect(src).toContain("maintenance_window_workspace_v1");
  });
});
