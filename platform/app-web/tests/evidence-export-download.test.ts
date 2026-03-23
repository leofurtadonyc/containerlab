import { describe, expect, it } from "vitest";

import { buildEvidenceExportRequestPath } from "../src/lib/evidence-export-download";

describe("buildEvidenceExportRequestPath", () => {
  it("encodes policy ids in the path", () => {
    const path = buildEvidenceExportRequestPath(
      { kind: "policy_dossier", policyId: "PE1:static_local:192.0.2.11:100" },
      "json",
    );
    expect(path).toContain("PE1%3Astatic_local%3A192.0.2.11%3A100");
    expect(path).toContain("/api/v1/exports/policies/");
    expect(path).toContain("format=json");
  });

  it("encodes topology object ids", () => {
    const path = buildEvidenceExportRequestPath(
      { kind: "topology_object_dossier", objectId: "P1--PE1" },
      "markdown",
    );
    expect(path).toBe(
      "/api/v1/exports/topology-objects/P1--PE1/dossier?format=markdown",
    );
  });

  it("clamps sync_runs_limit for situation and investigation exports", () => {
    const situation = buildEvidenceExportRequestPath(
      { kind: "situation_room", syncRunsLimit: 500 },
      "json",
    );
    expect(situation).toContain("sync_runs_limit=100");

    const inv = buildEvidenceExportRequestPath(
      { kind: "investigation_workspace", syncRunsLimit: 0 },
      "json",
    );
    expect(inv).toContain("sync_runs_limit=1");
  });
});
