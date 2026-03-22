import { describe, expect, it } from "vitest";

import {
  mergeViewIntoSearch,
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
