import { describe, expect, it, vi } from "vitest";

import {
  IMPACT_POLICY_ID_PARAM,
  IMPACT_REPORT_CONTEXT_PARAM,
  IMPACT_SERVICE_ID_PARAM,
  navigateToImpactReportForPolicy,
  navigateToImpactReportForService,
  navigateToImpactReportForMaintenance,
  navigateToImpactReportHub,
  readImpactReportRouteFromSearch,
} from "../src/lib/impact-report-navigation";
import { MAINTENANCE_NODE_ID_PARAM } from "../src/lib/maintenance-preview-navigation";
import { GLOBAL_SEARCH_QUERY_PARAM } from "../src/lib/global-search-deeplink";

describe("readImpactReportRouteFromSearch", () => {
  it("returns setup when no impact_report_context", () => {
    expect(readImpactReportRouteFromSearch("?view=impact-report")).toEqual({ kind: "setup" });
  });

  it("parses service_impact", () => {
    const r = readImpactReportRouteFromSearch(
      `?view=impact-report&${IMPACT_REPORT_CONTEXT_PARAM}=service_impact&${IMPACT_SERVICE_ID_PARAM}=color%3A100`,
    );
    expect(r).toEqual({ kind: "service_impact", serviceId: "color:100" });
  });

  it("parses policy_impact", () => {
    const r = readImpactReportRouteFromSearch(
      `?${IMPACT_REPORT_CONTEXT_PARAM}=policy_impact&${IMPACT_POLICY_ID_PARAM}=p1`,
    );
    expect(r).toEqual({ kind: "policy_impact", policyId: "p1" });
  });

  it("parses maintenance_impact with maintenance_node_id", () => {
    const r = readImpactReportRouteFromSearch(
      `?${IMPACT_REPORT_CONTEXT_PARAM}=maintenance_impact&${MAINTENANCE_NODE_ID_PARAM}=PE1`,
    );
    expect(r).toEqual({
      kind: "maintenance_impact",
      query: { nodeId: "PE1", previewContext: "explicit_subject" },
    });
  });
});

describe("navigateToImpactReportForService", () => {
  it("sets view impact-report and service anchor", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=overview",
      search: "?view=overview",
    });

    navigateToImpactReportForService("color:100");

    const urlArg = replaceState.mock.calls[0][2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("view")).toBe("impact-report");
    expect(next.searchParams.get(IMPACT_REPORT_CONTEXT_PARAM)).toBe("service_impact");
    expect(next.searchParams.get(IMPACT_SERVICE_ID_PARAM)).toBe("color:100");

    replaceState.mockRestore();
  });
});

describe("navigateToImpactReportHub", () => {
  it("opens impact-report without anchors and sets global_search_q", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/",
      search: `?view=impact-report&${IMPACT_REPORT_CONTEXT_PARAM}=policy_impact&${IMPACT_POLICY_ID_PARAM}=old`,
    });

    navigateToImpactReportHub("hub echo");

    const urlArg = replaceState.mock.calls[0][2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("view")).toBe("impact-report");
    expect(next.searchParams.get(IMPACT_REPORT_CONTEXT_PARAM)).toBeNull();
    expect(next.searchParams.get(IMPACT_POLICY_ID_PARAM)).toBeNull();
    expect(next.searchParams.get(GLOBAL_SEARCH_QUERY_PARAM)).toBe("hub echo");

    replaceState.mockRestore();
  });
});

describe("navigateToImpactReportForPolicy", () => {
  it("sets policy anchor", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/",
      search: "",
    });

    navigateToImpactReportForPolicy("PE1:static:1:100");

    const urlArg = replaceState.mock.calls[0][2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("view")).toBe("impact-report");
    expect(next.searchParams.get(IMPACT_REPORT_CONTEXT_PARAM)).toBe("policy_impact");
    expect(next.searchParams.get(IMPACT_POLICY_ID_PARAM)).toBe("PE1:static:1:100");

    replaceState.mockRestore();
  });

  it("sets global_search_q when echoSearchQuery is passed", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/",
      search: "",
    });

    navigateToImpactReportForPolicy("p1", { echoSearchQuery: "  q1  " });

    const urlArg = replaceState.mock.calls[0][2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get(GLOBAL_SEARCH_QUERY_PARAM)).toBe("q1");

    replaceState.mockRestore();
  });
});

describe("navigateToImpactReportForMaintenance", () => {
  it("sets maintenance_impact and node_id", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/",
      search: "",
    });

    navigateToImpactReportForMaintenance({ nodeId: "PE1", previewContext: "planning_window" });

    const urlArg = replaceState.mock.calls[0][2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("view")).toBe("impact-report");
    expect(next.searchParams.get(IMPACT_REPORT_CONTEXT_PARAM)).toBe("maintenance_impact");
    expect(next.searchParams.get(MAINTENANCE_NODE_ID_PARAM)).toBe("PE1");

    replaceState.mockRestore();
  });
});
