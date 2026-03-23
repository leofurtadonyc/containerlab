import { describe, expect, it } from "vitest";

import {
  readPolicyIdForReplay,
  readPolicyIdFromSubjectRef,
  readSyncRunsFromSubjectRef,
  readTopologyPivotForReplay,
  readTopologyPivotFromNestedObjectIdentity,
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

  it("readTopologyPivotFromNestedObjectIdentity reads object_identity", () => {
    expect(
      readTopologyPivotFromNestedObjectIdentity({
        contract_id: "topology_object_dossier_v1",
        object_identity: { object_id: "PE1", object_kind: "node", display_label: "PE1" },
      }),
    ).toEqual({ objectId: "PE1", kind: "node" });
    expect(readTopologyPivotFromNestedObjectIdentity({})).toBeNull();
  });

  it("readTopologyPivotForReplay prefers subject_ref over nested object_identity", () => {
    expect(
      readTopologyPivotForReplay(
        { object_id: "A", topology_object_kind: "node" },
        { object_identity: { object_id: "B", object_kind: "link", display_label: "B" } },
      ),
    ).toEqual({ objectId: "A", kind: "node", source: "subject_ref" });
  });

  it("readTopologyPivotForReplay falls back to nested object_identity", () => {
    expect(
      readTopologyPivotForReplay(
        {},
        {
          object_identity: { object_id: "PE1", object_kind: "node", display_label: "PE1" },
        },
      ),
    ).toEqual({ objectId: "PE1", kind: "node", source: "nested_object_identity" });
  });

  it("readPolicyIdForReplay prefers subject_ref over nested policy_record", () => {
    expect(
      readPolicyIdForReplay(
        { policy_id: "from-ref" },
        { policy_record: { policy_id: "from-nested" } },
      ),
    ).toEqual({ policyId: "from-ref", source: "subject_ref" });
  });

  it("readPolicyIdForReplay falls back to nested.policy_record.policy_id", () => {
    expect(
      readPolicyIdForReplay(
        {},
        { contract_id: "policy_dossier_v1", policy_record: { policy_id: "PE1:pol" } },
      ),
    ).toEqual({ policyId: "PE1:pol", source: "nested_policy_record" });
  });
});
