import { describe, expect, it } from "vitest";

import {
  readPolicyIdFromSubjectRef,
  readSyncRunsFromSubjectRef,
  readTopologyPivotFromSubjectRef,
} from "../src/lib/evidence-replay/evidence-replay-pivots";

describe("evidence-replay-pivots", () => {
  it("readSyncRunsFromSubjectRef bounds numeric and string limits", () => {
    expect(readSyncRunsFromSubjectRef({ sync_runs_limit: 5 })).toBe(5);
    expect(readSyncRunsFromSubjectRef({ sync_runs_limit: 500 })).toBe(100);
    expect(readSyncRunsFromSubjectRef({ sync_runs_limit: "12" })).toBe(12);
    expect(readSyncRunsFromSubjectRef({})).toBe(20);
  });

  it("readPolicyIdFromSubjectRef reads policy_id", () => {
    expect(readPolicyIdFromSubjectRef({ policy_id: "PE1:pol:1" })).toBe("PE1:pol:1");
    expect(readPolicyIdFromSubjectRef({})).toBeNull();
  });

  it("readTopologyPivotFromSubjectRef reads object_id and topology_object_kind", () => {
    expect(readTopologyPivotFromSubjectRef({ object_id: "PE1", topology_object_kind: "node" })).toEqual({
      objectId: "PE1",
      kind: "node",
    });
    expect(readTopologyPivotFromSubjectRef({ object_id: "L1", object_kind: "link" })).toEqual({
      objectId: "L1",
      kind: "link",
    });
    expect(readTopologyPivotFromSubjectRef({ object_id: "X" })).toBeNull();
  });
});
