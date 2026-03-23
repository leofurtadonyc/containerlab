import { afterEach, describe, expect, it, vi } from "vitest";

import * as urlAppState from "../src/lib/url-app-state";
import { navigateToDeltaDigestView } from "../src/lib/delta-digest-navigation";

describe("delta digest navigation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("navigateToDeltaDigestView sets view=delta-digest and sync_runs_limit", () => {
    const spy = vi.spyOn(urlAppState, "replaceUrlSearchParams").mockImplementation(() => {});
    const prev = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...prev, search: "?view=overview&keep=1" },
      writable: true,
    });

    navigateToDeltaDigestView(25);

    expect(spy).toHaveBeenCalledTimes(1);
    const sp = spy.mock.calls[0][0] as URLSearchParams;
    expect(sp.get("view")).toBe("delta-digest");
    expect(sp.get("keep")).toBe("1");
    expect(sp.get("sync_runs_limit")).toBe("25");

    Object.defineProperty(window, "location", { configurable: true, value: prev });
  });
});
