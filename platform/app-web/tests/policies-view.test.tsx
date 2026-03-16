import { describe, expect, it } from "vitest";

import {
  buildPolicyDetailBlockerSummary,
  describePolicyDetailBlockerReason,
} from "../src/features/policies/view";

describe("policy detail blocker readouts", () => {
  it("maps per-policy detail blockers into explicit blocked posture", () => {
    expect(describePolicyDetailBlockerReason("per_policy_details_unavailable")).toEqual({
      pillValue: "blocked",
      label: "Per-policy detail unavailable",
      detail:
        "Counters show policy presence on this target, but the bounded path cannot yet derive stable per-policy records.",
    });
  });

  it("summarizes explicit blocker posture across target footprints", () => {
    const summary = buildPolicyDetailBlockerSummary([
      "none",
      "per_policy_details_unavailable",
      "collection_partial",
      "not_recorded",
    ]);

    expect(summary).toEqual({
      label: "2 blocked",
      detail:
        "2 of 3 targets with explicit blocker posture remain blocked from stable per-policy detail records. 1 targets are currently detail-ready.",
      breakdown: "Collection partial: 1 • Per-policy detail unavailable: 1",
      blockedTargetCount: 2,
      detailReadyTargetCount: 1,
      notRecordedTargetCount: 1,
    });
  });

  it("stays explicit when blocker reasons are not recorded", () => {
    const summary = buildPolicyDetailBlockerSummary(["not_recorded", "not_recorded"]);

    expect(summary).toEqual({
      label: "Not recorded",
      detail:
        "The backend did not expose explicit per-target detail blocker reasons on this response.",
      breakdown: "",
      blockedTargetCount: 0,
      detailReadyTargetCount: 0,
      notRecordedTargetCount: 2,
    });
  });
});