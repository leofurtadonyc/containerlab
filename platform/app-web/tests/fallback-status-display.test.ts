import { describe, expect, it } from "vitest";

import { buildFallbackAwareStatusDisplay } from "../src/lib/presentation";

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
});
