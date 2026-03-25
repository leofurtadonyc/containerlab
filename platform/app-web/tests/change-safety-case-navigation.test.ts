import { describe, expect, it, vi } from "vitest";

import {
  CHANGE_SAFETY_CONTEXT_PARAM,
  CHANGE_SAFETY_POLICY_ID_PARAM,
  CHANGE_SAFETY_SERVICE_ID_PARAM,
  navigateToChangeSafetyCaseForPolicy,
  navigateToChangeSafetyCaseForService,
  navigateToChangeSafetyCaseHub,
  readChangeSafetyCaseRouteFromSearch,
} from "../src/lib/change-safety-case-navigation";
import { MAINTENANCE_NODE_ID_PARAM } from "../src/lib/maintenance-preview-navigation";

describe("change safety case navigation readers", () => {
  it("readChangeSafetyCaseRouteFromSearch returns setup when context missing", () => {
    expect(readChangeSafetyCaseRouteFromSearch("?view=change-safety-case")).toEqual({ kind: "setup" });
  });

  it("readChangeSafetyCaseRouteFromSearch parses policy anchor", () => {
    const s = `?view=change-safety-case&${CHANGE_SAFETY_CONTEXT_PARAM}=policy_change_safety&${CHANGE_SAFETY_POLICY_ID_PARAM}=PE1%3Ax%3A1`;
    const r = readChangeSafetyCaseRouteFromSearch(s);
    expect(r).toEqual({ kind: "policy_change_safety", policyId: "PE1:x:1" });
  });

  it("readChangeSafetyCaseRouteFromSearch parses service anchor", () => {
    const s = `?view=change-safety-case&${CHANGE_SAFETY_CONTEXT_PARAM}=service_change_safety&${CHANGE_SAFETY_SERVICE_ID_PARAM}=color%3A100`;
    const r = readChangeSafetyCaseRouteFromSearch(s);
    expect(r).toEqual({ kind: "service_change_safety", serviceId: "color:100" });
  });

  it("readChangeSafetyCaseRouteFromSearch parses topology anchor via maintenance_node_id", () => {
    const s = `?view=change-safety-case&${CHANGE_SAFETY_CONTEXT_PARAM}=topology_change_safety&${MAINTENANCE_NODE_ID_PARAM}=PE1`;
    const r = readChangeSafetyCaseRouteFromSearch(s);
    expect(r.kind).toBe("topology_change_safety");
    if (r.kind === "topology_change_safety") {
      expect(r.query.nodeId).toBe("PE1");
    }
  });
});

describe("navigateToChangeSafetyCaseForPolicy", () => {
  it("sets view and policy anchor", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=policies",
      search: "?view=policies",
    });

    navigateToChangeSafetyCaseForPolicy("PE1:static:1:100");

    const urlArg = replaceState.mock.calls[0][2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("view")).toBe("change-safety-case");
    expect(next.searchParams.get(CHANGE_SAFETY_CONTEXT_PARAM)).toBe("policy_change_safety");
    expect(next.searchParams.get(CHANGE_SAFETY_POLICY_ID_PARAM)).toBe("PE1:static:1:100");

    replaceState.mockRestore();
  });
});

describe("navigateToChangeSafetyCaseHub", () => {
  it("clears change_safety_context for setup view", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=change-safety-case&change_safety_context=policy_change_safety&csc_policy_id=x",
      search: "?view=change-safety-case&change_safety_context=policy_change_safety&csc_policy_id=x",
    });

    navigateToChangeSafetyCaseHub();

    const urlArg = replaceState.mock.calls[0][2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("view")).toBe("change-safety-case");
    expect(next.searchParams.get(CHANGE_SAFETY_CONTEXT_PARAM)).toBeNull();
    expect(next.searchParams.get(CHANGE_SAFETY_POLICY_ID_PARAM)).toBeNull();

    replaceState.mockRestore();
  });
});

describe("navigateToChangeSafetyCaseForService", () => {
  it("sets view and service anchor", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=overview",
      search: "?view=overview",
    });

    navigateToChangeSafetyCaseForService("color:100");

    const urlArg = replaceState.mock.calls[0][2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("view")).toBe("change-safety-case");
    expect(next.searchParams.get(CHANGE_SAFETY_CONTEXT_PARAM)).toBe("service_change_safety");
    expect(next.searchParams.get(CHANGE_SAFETY_SERVICE_ID_PARAM)).toBe("color:100");

    replaceState.mockRestore();
  });
});
