import { afterEach, describe, expect, it, vi } from "vitest";

import * as urlAppState from "../src/lib/url-app-state";
import { navigateToStabilityWorkspace } from "../src/lib/stability-workspace-navigation";

describe("stability workspace navigation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("navigateToStabilityWorkspace sets view=stability-workspace, sync_runs_limit, topology, and service_id", () => {
    const spy = vi.spyOn(urlAppState, "replaceUrlSearchParams").mockImplementation(() => {});
    const prev = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...prev, search: "?view=overview&keep=1" },
      writable: true,
    });

    navigateToStabilityWorkspace({
      syncRunsLimit: 30,
      topologyObject: { id: "PE1", kind: "node" },
      serviceId: "policy:test",
    });

    expect(spy).toHaveBeenCalledTimes(1);
    const sp = spy.mock.calls[0][0] as URLSearchParams;
    expect(sp.get("view")).toBe("stability-workspace");
    expect(sp.get("keep")).toBe("1");
    expect(sp.get("sync_runs_limit")).toBe("30");
    expect(sp.get("topology_object")).toBe("PE1");
    expect(sp.get("topology_object_kind")).toBe("node");
    expect(sp.get("service_id")).toBe("policy:test");

    Object.defineProperty(window, "location", { configurable: true, value: prev });
  });

  it("navigateToStabilityWorkspace clears topology when topologyObject is null", () => {
    const spy = vi.spyOn(urlAppState, "replaceUrlSearchParams").mockImplementation(() => {});
    const prev = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...prev, search: "?view=stability-workspace&topology_object=N1&topology_object_kind=node" },
      writable: true,
    });

    navigateToStabilityWorkspace({ topologyObject: null });

    const sp = spy.mock.calls[0][0] as URLSearchParams;
    expect(sp.get("topology_object")).toBeNull();
    expect(sp.get("topology_object_kind")).toBeNull();

    Object.defineProperty(window, "location", { configurable: true, value: prev });
  });
});
