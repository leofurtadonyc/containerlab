import { afterEach, describe, expect, it, vi } from "vitest";

import * as urlAppState from "../src/lib/url-app-state";
import { navigateToEvidenceQualityWorkspace } from "../src/lib/evidence-quality-workspace-navigation";

describe("evidence-quality-workspace-navigation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("navigateToEvidenceQualityWorkspace sets view=evidence-quality-workspace and sync_runs_limit", () => {
    const spy = vi.spyOn(urlAppState, "replaceUrlSearchParams").mockImplementation(() => {});
    const prev = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...prev, search: "?view=topology&keep=1" },
      writable: true,
    });

    navigateToEvidenceQualityWorkspace({ syncRunsLimit: 25 });

    expect(spy).toHaveBeenCalledTimes(1);
    const sp = spy.mock.calls[0][0] as URLSearchParams;
    expect(sp.get("view")).toBe("evidence-quality-workspace");
    expect(sp.get("keep")).toBe("1");
    expect(sp.get("sync_runs_limit")).toBe("25");

    Object.defineProperty(window, "location", { configurable: true, value: prev });
  });
});
