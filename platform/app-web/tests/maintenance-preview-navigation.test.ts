import { describe, expect, it, vi } from "vitest";

import {
  MAINTENANCE_LINK_ID_PARAM,
  MAINTENANCE_NODE_ID_PARAM,
  MAINTENANCE_OBJECT_ID_PARAM,
  MAINTENANCE_OBJECT_KIND_PARAM,
  MAINTENANCE_PREVIEW_CONTEXT_PARAM,
  navigateToMaintenancePreview,
  navigateToMaintenancePreviewForTopologyObject,
  readMaintenancePreviewSubjectFromSearch,
} from "../src/lib/maintenance-preview-navigation";

describe("readMaintenancePreviewSubjectFromSearch", () => {
  it("returns null when no subject params", () => {
    expect(readMaintenancePreviewSubjectFromSearch("?view=maintenance-preview")).toBeNull();
  });

  it("parses maintenance_node_id", () => {
    const s = readMaintenancePreviewSubjectFromSearch(
      `?${MAINTENANCE_NODE_ID_PARAM}=PE1&${MAINTENANCE_PREVIEW_CONTEXT_PARAM}=planning_window`,
    );
    expect(s).toEqual({
      kind: "node",
      nodeId: "PE1",
      previewContext: "planning_window",
    });
  });

  it("parses maintenance_link_id", () => {
    const s = readMaintenancePreviewSubjectFromSearch(`?${MAINTENANCE_LINK_ID_PARAM}=P1--PE1`);
    expect(s).toEqual({
      kind: "link",
      linkId: "P1--PE1",
      previewContext: "explicit_subject",
    });
  });

  it("parses explicit object_id + object_kind", () => {
    const s = readMaintenancePreviewSubjectFromSearch(
      `?${MAINTENANCE_OBJECT_ID_PARAM}=PE1&${MAINTENANCE_OBJECT_KIND_PARAM}=node`,
    );
    expect(s).toEqual({
      kind: "explicit",
      objectId: "PE1",
      objectKind: "node",
      previewContext: "explicit_subject",
    });
  });

  it("returns invalid when selectors conflict", () => {
    const s = readMaintenancePreviewSubjectFromSearch(
      `?${MAINTENANCE_NODE_ID_PARAM}=PE1&${MAINTENANCE_LINK_ID_PARAM}=X`,
    );
    expect(s).toEqual({ kind: "invalid" });
  });
});

describe("navigateToMaintenancePreview", () => {
  it("sets view and maintenance params", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=overview&foo=bar",
      search: "?view=overview&foo=bar",
    });

    navigateToMaintenancePreview({ nodeId: "PE1", previewContext: "topology_drilldown" });

    const urlArg = replaceState.mock.calls[0][2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("view")).toBe("maintenance-preview");
    expect(next.searchParams.get(MAINTENANCE_NODE_ID_PARAM)).toBe("PE1");
    expect(next.searchParams.get(MAINTENANCE_PREVIEW_CONTEXT_PARAM)).toBe("topology_drilldown");
    expect(next.searchParams.get("foo")).toBe("bar");

    replaceState.mockRestore();
  });
});

describe("navigateToMaintenancePreviewForTopologyObject", () => {
  it("sets object_id, object_kind, and default topology_drilldown context", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=policies",
      search: "?view=policies",
    });

    navigateToMaintenancePreviewForTopologyObject("L1", "link");

    const urlArg = replaceState.mock.calls[0][2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("view")).toBe("maintenance-preview");
    expect(next.searchParams.get(MAINTENANCE_OBJECT_ID_PARAM)).toBe("L1");
    expect(next.searchParams.get(MAINTENANCE_OBJECT_KIND_PARAM)).toBe("link");
    expect(next.searchParams.get(MAINTENANCE_PREVIEW_CONTEXT_PARAM)).toBe("topology_drilldown");

    replaceState.mockRestore();
  });

  it("passes echoSearchQuery when provided", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/",
      search: "",
    });

    navigateToMaintenancePreviewForTopologyObject("N1", "node", {
      previewContext: "planning_window",
      echoSearchQuery: "PE",
    });

    const urlArg = replaceState.mock.calls[0][2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("global_search_q")).toBe("PE");
    expect(next.searchParams.get(MAINTENANCE_PREVIEW_CONTEXT_PARAM)).toBe("planning_window");

    replaceState.mockRestore();
  });
});
