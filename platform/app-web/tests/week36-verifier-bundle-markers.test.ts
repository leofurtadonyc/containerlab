import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Parity with `verify-core-runtime.sh` structural checks and shipped bundle markers for week 36
 * topology-object evidence + maintenance evidence workspace (contract id strings must survive bundling).
 */
describe("week 36 verifier bundle markers", () => {
  it("retains topology_object_evidence_timeline_v1 and topology_object_evidence_delta_v1 in wired sources", () => {
    const contracts = readFileSync(join(__dirname, "../src/api/contracts.ts"), "utf8");
    const topologyApi = readFileSync(join(__dirname, "../src/features/topology/api.ts"), "utf8");
    const deltaPanel = readFileSync(
      join(__dirname, "../src/features/topology/topology-object-evidence-delta-panel.tsx"),
      "utf8",
    );
    expect(contracts).toContain("topology_object_evidence_timeline_v1");
    expect(contracts).toContain("topology_object_evidence_delta_v1");
    expect(topologyApi).toContain("TopologyObjectEvidenceTimelineResponse");
    expect(topologyApi).toContain("getTopologyObjectEvidenceDelta");
    expect(deltaPanel).toContain("useTopologyObjectEvidenceDeltaQuery");
  });

  it("retains maintenance_evidence_workspace_v1 in navigation and workspace view", () => {
    const nav = readFileSync(join(__dirname, "../src/nav-views.ts"), "utf8");
    const contracts = readFileSync(join(__dirname, "../src/api/contracts.ts"), "utf8");
    const view = readFileSync(
      join(__dirname, "../src/features/maintenance-evidence-workspace/view.tsx"),
      "utf8",
    );
    expect(nav).toContain("maintenance-evidence-workspace");
    expect(contracts).toContain("maintenance_evidence_workspace_v1");
    expect(view).toContain("maintenance_evidence_workspace_v1");
  });
});
