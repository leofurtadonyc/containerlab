import { describe, expect, it } from "vitest";

import {
  extractExamplePolicyIdFromDigestNotes,
  extractExampleTopologyNodeIdFromDigestNotes,
} from "../src/lib/delta-digest-pivots";

describe("delta-digest pivot note parsing", () => {
  it("extracts example policy id from backend pivot lines", () => {
    expect(
      extractExamplePolicyIdFromDigestNotes(["Example policy_id for drill-down: PE1:static:1:100."]),
    ).toBe("PE1:static:1:100");
  });

  it("extracts example topology node id from backend pivot lines", () => {
    expect(
      extractExampleTopologyNodeIdFromDigestNotes(["Example topology node_id for drill-down: PE1."]),
    ).toBe("PE1");
  });

  it("returns null when no examples are present", () => {
    expect(extractExamplePolicyIdFromDigestNotes(["Suggested navigation targets (read-only)."])).toBeNull();
    expect(extractExampleTopologyNodeIdFromDigestNotes(["Dossier workspaces: policy_workspace=dossier."])).toBeNull();
  });
});
