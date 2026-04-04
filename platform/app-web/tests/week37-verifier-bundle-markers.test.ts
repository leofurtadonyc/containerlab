import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Parity with `verify-core-runtime.sh` grep -F 'operational_stability_summary_v1' on shipped /assets/*.js:
 * stability workspace + Overview/NOC entry must retain contract id strings (distinct from evidence_consistency_summary_v1).
 */
describe("week 37 verifier bundle markers", () => {
  it("retains operational_stability_summary_v1 and profile contract ids in wired sources", () => {
    const nav = readFileSync(join(__dirname, "../src/nav-views.ts"), "utf8");
    const contracts = readFileSync(join(__dirname, "../src/api/contracts.ts"), "utf8");
    const view = readFileSync(join(__dirname, "../src/features/stability-workspace/view.tsx"), "utf8");
    const overview = readFileSync(join(__dirname, "../src/features/overview/stability-overview-entry.tsx"), "utf8");
    expect(nav).toContain("stability-workspace");
    expect(contracts).toContain("operational_stability_summary_v1");
    expect(contracts).toContain("topology_object_stability_profile_v1");
    expect(contracts).toContain("service_stability_profile_v1");
    expect(view).toContain("operational_stability_summary_v1");
    expect(overview).toContain("operational_stability_summary_v1");
  });

  it("retains topology_truth_v1 product marker in Topology view (verify-core-runtime.sh shipped /assets/*.js)", () => {
    const topologyView = readFileSync(join(__dirname, "../src/features/topology/view.tsx"), "utf8");
    expect(topologyView).toContain('data-product-contract="topology_truth_v1"');
    expect(topologyView).toContain("LLDP observations");
  });

  it("retains controller_southbound_session_truth_v2 product marker in Platform Health view", () => {
    const platformHealth = readFileSync(join(__dirname, "../src/features/platform-health/view.tsx"), "utf8");
    expect(platformHealth).toContain('data-product-contract="controller_southbound_session_truth_v2"');
  });
});
