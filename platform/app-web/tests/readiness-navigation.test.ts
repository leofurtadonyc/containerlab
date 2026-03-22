import { describe, expect, it, vi } from "vitest";

import {
  navigateToReadinessContext,
  READINESS_BLOCKER_PARAM,
  READINESS_CAPABILITY_FEATURE_PARAM,
  readinessBlockerDomId,
} from "../src/lib/readiness-navigation";

describe("readinessBlockerDomId", () => {
  it("produces a stable id for API blocker keys", () => {
    expect(readinessBlockerDomId("dry_run_contract_missing")).toBe(
      "readiness-blocker-dry_run_contract_missing",
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
      href: `http://localhost/?view=readiness&${READINESS_BLOCKER_PARAM}=x&${READINESS_CAPABILITY_FEATURE_PARAM}=y`,
      search: `?view=readiness&${READINESS_BLOCKER_PARAM}=x&${READINESS_CAPABILITY_FEATURE_PARAM}=y`,
    });

    navigateToReadinessContext({});

    const call = replaceState.mock.calls[0];
    const urlArg = call![2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("view")).toBe("readiness");
    expect(next.searchParams.has(READINESS_BLOCKER_PARAM)).toBe(false);
    expect(next.searchParams.has(READINESS_CAPABILITY_FEATURE_PARAM)).toBe(false);

    replaceState.mockRestore();
    vi.unstubAllGlobals();
  });
});
