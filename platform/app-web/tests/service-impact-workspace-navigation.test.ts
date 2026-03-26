/**
 * Regression: Service Impact Workspace shell params (`view=service-impact-workspace`, `service_impact_workspace_service_id`).
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import * as urlAppState from "../src/lib/url-app-state";
import {
  SERVICE_IMPACT_WORKSPACE_SERVICE_ID_PARAM,
  readServiceImpactWorkspaceServiceIdFromSearch,
  navigateToServiceImpactWorkspace,
} from "../src/lib/service-impact-workspace-navigation";

describe("service-impact-workspace-navigation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("readServiceImpactWorkspaceServiceIdFromSearch returns trimmed id or null", () => {
    expect(readServiceImpactWorkspaceServiceIdFromSearch("")).toBeNull();
    expect(readServiceImpactWorkspaceServiceIdFromSearch(`?${SERVICE_IMPACT_WORKSPACE_SERVICE_ID_PARAM}=`)).toBeNull();
    expect(
      readServiceImpactWorkspaceServiceIdFromSearch(`?${SERVICE_IMPACT_WORKSPACE_SERVICE_ID_PARAM}=policy:p1`),
    ).toBe("policy:p1");
  });

  it("navigateToServiceImpactWorkspace sets view and service anchor, preserving other params", () => {
    const spy = vi.spyOn(urlAppState, "replaceUrlSearchParams").mockImplementation(() => {});
    const prev = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...prev, search: "?view=overview&keep=1" },
      writable: true,
    });

    navigateToServiceImpactWorkspace("color:100");

    expect(spy).toHaveBeenCalledTimes(1);
    const sp = spy.mock.calls[0][0] as URLSearchParams;
    expect(sp.get("view")).toBe("service-impact-workspace");
    expect(sp.get(SERVICE_IMPACT_WORKSPACE_SERVICE_ID_PARAM)).toBe("color:100");
    expect(sp.get("keep")).toBe("1");

    Object.defineProperty(window, "location", { configurable: true, value: prev });
  });
});
