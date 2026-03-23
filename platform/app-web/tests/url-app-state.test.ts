import { describe, expect, it } from "vitest";

import {
  applyDegradedPolicyV1PostureToSearchParams,
  mergeViewIntoSearch,
  readDegradedPolicyV1PostureFromSearch,
  readViewIdFromSearch,
} from "../src/lib/url-app-state";

describe("readViewIdFromSearch", () => {
  it("returns allowed view id", () => {
    const allowed = new Set(["devices", "overview"]);
    expect(readViewIdFromSearch("?view=devices", allowed)).toBe("devices");
  });

  it("returns null for unknown view", () => {
    const allowed = new Set(["devices"]);
    expect(readViewIdFromSearch("?view=unknown", allowed)).toBeNull();
  });
});

describe("mergeViewIntoSearch", () => {
  it("sets view and preserves other params", () => {
    const sp = mergeViewIntoSearch("?limit=5", "policies");
    expect(sp.get("view")).toBe("policies");
    expect(sp.get("limit")).toBe("5");
  });
});

describe("readDegradedPolicyV1PostureFromSearch", () => {
  it("returns all when param absent", () => {
    expect(readDegradedPolicyV1PostureFromSearch("")).toBe("all");
    expect(readDegradedPolicyV1PostureFromSearch("?view=policies")).toBe("all");
  });

  it("returns degraded when set", () => {
    expect(readDegradedPolicyV1PostureFromSearch("?degraded_policy_v1_posture=degraded")).toBe("degraded");
  });
});

describe("applyDegradedPolicyV1PostureToSearchParams", () => {
  it("sets and clears degraded_policy_v1_posture", () => {
    const sp = new URLSearchParams("?view=policies");
    applyDegradedPolicyV1PostureToSearchParams(sp, "degraded");
    expect(sp.get("degraded_policy_v1_posture")).toBe("degraded");
    applyDegradedPolicyV1PostureToSearchParams(sp, "all");
    expect(sp.get("degraded_policy_v1_posture")).toBeNull();
  });
});
