import { describe, expect, it } from "vitest";

import {
  buildPolicyDetailBlockerSummary,
  buildPolicyDetailSourceReadinessSummary,
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

  it("summarizes partially ready source-readiness without replacing blocker posture", () => {
    const summary = buildPolicyDetailSourceReadinessSummary(
      {
        posture: "partially_ready",
        no_policies_observed_target_count: 30,
        detail_unavailable_target_count: 0,
        partial_detail_target_count: 0,
      },
      4,
    );

    expect(summary).toEqual({
      label: "Partially ready",
      detail:
        "The current source-visible slice is mixed: 4 targets are detail-ready while 30 remain live-empty, 0 remain detail-unavailable, and 0 remain partially covered.",
      breakdown: "Detail-ready: 4 • Live-empty: 30 • Detail unavailable: 0 • Partial detail: 0",
      sourceVisibleTargetCount: 34,
    });
  });

  it("summarizes source-detail-unavailable posture explicitly", () => {
    const summary = buildPolicyDetailSourceReadinessSummary(
      {
        posture: "source_detail_unavailable",
        no_policies_observed_target_count: 0,
        detail_unavailable_target_count: 2,
        partial_detail_target_count: 0,
      },
      0,
    );

    expect(summary).toEqual({
      label: "Source detail unavailable",
      detail:
        "Observed SR policy presence exists, but the current bounded source slice still cannot derive stable per-policy detail on 2 source-visible targets.",
      breakdown: "Detail-ready: 0 • Live-empty: 0 • Detail unavailable: 2 • Partial detail: 0",
      sourceVisibleTargetCount: 2,
    });
  });
});