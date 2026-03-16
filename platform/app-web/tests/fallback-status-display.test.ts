import { describe, expect, it } from "vitest";

import {
  buildFallbackAwareStatusDisplay,
  buildRowPostureStatusDisplay,
  formatRowCurrentPosture,
} from "../src/lib/presentation";

describe("fallback-aware status display", () => {
  it("keeps live status values unchanged", () => {
    expect(buildFallbackAwareStatusDisplay("ok", "live_collector")).toEqual({
      pillValue: "ok",
      note: null,
    });
  });

  it("relabels persisted fallback values as stale snapshot posture", () => {
    expect(
      buildFallbackAwareStatusDisplay("ok", "persisted_fallback", "Last recorded sync"),
    ).toEqual({
      pillValue: "persisted_fallback",
      note: "Last recorded sync: ok",
    });
  });

  it("keeps empty scaffold posture explicit", () => {
    expect(buildFallbackAwareStatusDisplay("unknown", "empty_scaffold")).toEqual({
      pillValue: "empty_scaffold",
      note: null,
    });
  });

  it("keeps current row values unchanged when backend posture is current", () => {
    expect(buildRowPostureStatusDisplay("current", "ok", "ok", "Last recorded collector")).toEqual({
      pillValue: "ok",
      note: null,
    });
  });

  it("shows stale row posture with a last-recorded note", () => {
    expect(
      buildRowPostureStatusDisplay(
        "stale",
        "degraded",
        "degraded",
        "Last recorded state",
      ),
    ).toEqual({
      pillValue: "stale",
      note: "Last recorded state: degraded",
    });
  });

  it("formats row current posture for operator-facing detail panels", () => {
    expect(formatRowCurrentPosture("current")).toBe("Current");
    expect(formatRowCurrentPosture("stale")).toBe("Stale fallback");
  });
});
