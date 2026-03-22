import { describe, expect, it, vi } from "vitest";

import {
  navigateReadinessDrilldown,
  navigateToReadinessContext,
  READINESS_BLOCKER_PARAM,
  READINESS_CAPABILITY_FEATURE_PARAM,
  READINESS_PREREQUISITE_PARAM,
  readinessBlockerDomId,
  readinessPrerequisiteDomId,
} from "../src/lib/readiness-navigation";

describe("readinessBlockerDomId", () => {
  it("produces a stable id for API blocker keys", () => {
    expect(readinessBlockerDomId("dry_run_contract_missing")).toBe(
      "readiness-blocker-dry_run_contract_missing",
    );
  });
});

describe("readinessPrerequisiteDomId", () => {
  it("produces a stable id for API prerequisite keys", () => {
    expect(readinessPrerequisiteDomId("inventory_read_model")).toBe(
      "readiness-prerequisite-inventory_read_model",
    );
  });
});

describe("navigateToReadinessContext", () => {
  it("sets view=readiness and optional params, replacing the URL search", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=capabilities&limit=5",
      search: "?view=capabilities&limit=5",
    });

    navigateToReadinessContext({
      blocker: "dry_run_contract_missing",
      capabilityFeature: "inventory_read",
    });

    const call = replaceState.mock.calls[0];
    expect(call).toBeDefined();
    const urlArg = call![2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("view")).toBe("readiness");
    expect(next.searchParams.get("limit")).toBe("5");
    expect(next.searchParams.get(READINESS_BLOCKER_PARAM)).toBe("dry_run_contract_missing");
    expect(next.searchParams.get(READINESS_CAPABILITY_FEATURE_PARAM)).toBe("inventory_read");

    replaceState.mockRestore();
    vi.unstubAllGlobals();
  });

  it("clears optional params when omitted", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: `http://localhost/?view=readiness&${READINESS_BLOCKER_PARAM}=x&${READINESS_CAPABILITY_FEATURE_PARAM}=y&${READINESS_PREREQUISITE_PARAM}=inventory_read_model`,
      search: `?view=readiness&${READINESS_BLOCKER_PARAM}=x&${READINESS_CAPABILITY_FEATURE_PARAM}=y&${READINESS_PREREQUISITE_PARAM}=inventory_read_model`,
    });

    navigateToReadinessContext({});

    const call = replaceState.mock.calls[0];
    const urlArg = call![2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("view")).toBe("readiness");
    expect(next.searchParams.has(READINESS_BLOCKER_PARAM)).toBe(false);
    expect(next.searchParams.has(READINESS_CAPABILITY_FEATURE_PARAM)).toBe(false);
    expect(next.searchParams.has(READINESS_PREREQUISITE_PARAM)).toBe(false);

    replaceState.mockRestore();
    vi.unstubAllGlobals();
  });
});

describe("navigateReadinessDrilldown", () => {
  it("sets prerequisite param and preserves other bounded query params", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=readiness&limit=3&readiness_capability_feature=inv",
      search: "?view=readiness&limit=3&readiness_capability_feature=inv",
    });

    navigateReadinessDrilldown({ prerequisite: "inventory_read_model" });

    const call = replaceState.mock.calls[0];
    const urlArg = call![2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("view")).toBe("readiness");
    expect(next.searchParams.get("limit")).toBe("3");
    expect(next.searchParams.get("readiness_capability_feature")).toBe("inv");
    expect(next.searchParams.get(READINESS_PREREQUISITE_PARAM)).toBe("inventory_read_model");
    expect(next.searchParams.has(READINESS_BLOCKER_PARAM)).toBe(false);

    replaceState.mockRestore();
    vi.unstubAllGlobals();
  });
});
