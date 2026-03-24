import { describe, expect, it, vi } from "vitest";

import {
  SERVICE_EXPLORER_SERVICE_ID_PARAM,
  navigateToServiceExplorer,
  navigateToServiceExplorerForPolicy,
  readServiceExplorerLimitFromSearch,
  readServiceExplorerServiceIdFromSearch,
} from "../src/lib/service-explorer-navigation";

describe("service-explorer navigation readers", () => {
  it("reads service_id from search", () => {
    expect(readServiceExplorerServiceIdFromSearch(`?${SERVICE_EXPLORER_SERVICE_ID_PARAM}=policy%3Aa%3Ab`)).toBe(
      "policy:a:b",
    );
    expect(readServiceExplorerServiceIdFromSearch("?")).toBeNull();
  });

  it("reads bounded limit from search", () => {
    expect(readServiceExplorerLimitFromSearch("?limit=50")).toBe(50);
    expect(readServiceExplorerLimitFromSearch("?limit=9999")).toBe(500);
    expect(readServiceExplorerLimitFromSearch("")).toBeNull();
  });
});

describe("navigateToServiceExplorer", () => {
  it("sets view=service-explorer, service_id, and preserves unrelated params including limit", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=overview&limit=25&foo=bar",
      search: "?view=overview&limit=25&foo=bar",
    });

    navigateToServiceExplorer({ serviceId: "color:100" });

    const urlArg = replaceState.mock.calls[0][2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("view")).toBe("service-explorer");
    expect(next.searchParams.get(SERVICE_EXPLORER_SERVICE_ID_PARAM)).toBe("color:100");
    expect(next.searchParams.get("limit")).toBe("25");
    expect(next.searchParams.get("foo")).toBe("bar");

    replaceState.mockRestore();
  });

  it("clears service_id and limit when both passed as null", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=service-explorer&limit=25&service_id=color%3A100",
      search: "?view=service-explorer&limit=25&service_id=color%3A100",
    });

    navigateToServiceExplorer({ serviceId: null, limit: null });

    const urlArg = replaceState.mock.calls[0][2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("view")).toBe("service-explorer");
    expect(next.searchParams.get(SERVICE_EXPLORER_SERVICE_ID_PARAM)).toBeNull();
    expect(next.searchParams.get("limit")).toBeNull();

    replaceState.mockRestore();
  });

  it("sets global_search_q when echoSearchQuery is provided", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=overview",
      search: "?view=overview",
    });

    navigateToServiceExplorer({
      serviceId: "policy:PE1:a:1",
      echoSearchQuery: "static",
    });

    const urlArg = replaceState.mock.calls[0][2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("view")).toBe("service-explorer");
    expect(next.searchParams.get("service_id")).toBe("policy:PE1:a:1");
    expect(next.searchParams.get("global_search_q")).toBe("static");

    replaceState.mockRestore();
  });

  it("updates limit without clearing service_id when only limit is provided", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=service-explorer&service_id=headend%3APE1",
      search: "?view=service-explorer&service_id=headend%3APE1",
    });

    navigateToServiceExplorer({ limit: 10 });

    const urlArg = replaceState.mock.calls[0][2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get(SERVICE_EXPLORER_SERVICE_ID_PARAM)).toBe("headend:PE1");
    expect(next.searchParams.get("limit")).toBe("10");

    replaceState.mockRestore();
  });

  it("navigateToServiceExplorerForPolicy prefixes policy: service_id", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/",
      search: "",
    });

    navigateToServiceExplorerForPolicy("PE1:static:1:100");

    const urlArg = replaceState.mock.calls[0][2] as string;
    expect(new URL(urlArg).searchParams.get("service_id")).toBe("policy:PE1:static:1:100");

    replaceState.mockRestore();
  });
});
