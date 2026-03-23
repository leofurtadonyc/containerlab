import { afterEach, describe, expect, it, vi } from "vitest";

import * as urlAppState from "../src/lib/url-app-state";
import { navigateToOperatorBriefingView } from "../src/lib/operator-briefing-navigation";

describe("operator briefing navigation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("navigateToOperatorBriefingView sets view, sync_runs_limit, and policy scope without stale topology", () => {
    const spy = vi.spyOn(urlAppState, "replaceUrlSearchParams").mockImplementation(() => {});
    const prev = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...prev, search: "?view=topology&topology_object=OLD&topology_object_kind=node&sync_runs_limit=5" },
      writable: true,
    });
    navigateToOperatorBriefingView(12, { policyId: "P1", invFrom: "policies" });
    const sp = spy.mock.calls[0][0] as URLSearchParams;
    expect(sp.get("view")).toBe("operator-briefing");
    expect(sp.get("sync_runs_limit")).toBe("12");
    expect(sp.get("policy_id")).toBe("P1");
    expect(sp.get("topology_object")).toBeNull();
    expect(sp.get("inv_from")).toBe("policies");
    Object.defineProperty(window, "location", { configurable: true, value: prev });
  });

  it("navigateToOperatorBriefingView sets topology scope without stale policy_id", () => {
    const spy = vi.spyOn(urlAppState, "replaceUrlSearchParams").mockImplementation(() => {});
    const prev = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...prev, search: "?view=policies&policy_id=OLD&sync_runs_limit=3" },
      writable: true,
    });
    navigateToOperatorBriefingView(9, {
      topologyObject: { id: "N1", kind: "node" },
      invFrom: "topology",
    });
    const sp = spy.mock.calls[0][0] as URLSearchParams;
    expect(sp.get("policy_id")).toBeNull();
    expect(sp.get("topology_object")).toBe("N1");
    expect(sp.get("topology_object_kind")).toBe("node");
    Object.defineProperty(window, "location", { configurable: true, value: prev });
  });
});
