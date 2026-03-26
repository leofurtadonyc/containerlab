import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Week 36: NOC cockpit surfaces maintenance evidence workspace alongside preview (navigation-only). */
describe("NOC cockpit maintenance evidence workspace (week 36)", () => {
  it("strategic pivots include maintenance evidence workspace helper", () => {
    const src = readFileSync(join(__dirname, "../src/features/overview/noc-cockpit-strategic-pivots.tsx"), "utf8");
    expect(src).toContain("navigateToMaintenanceEvidenceWorkspaceForTopologyObject");
    expect(src).toContain("Maintenance evidence workspace (top risk)");
  });

  it("operator launch grid includes maintenance evidence workspace actions", () => {
    const src = readFileSync(join(__dirname, "../src/features/overview/noc-cockpit-operator-launch-grid.tsx"), "utf8");
    expect(src).toContain("Maintenance evidence workspace (top risk row)");
    expect(src).toContain("Maintenance evidence workspace (first topology node)");
  });

  it("operator briefing product exposes maintenance evidence pivot + export honesty", () => {
    const src = readFileSync(join(__dirname, "../src/features/operator-briefing/operator-briefing-product.tsx"), "utf8");
    expect(src).toContain("navigateToMaintenanceEvidenceWorkspaceForTopologyObject");
    expect(src).toContain("included in briefing bundle members");
  });
});
