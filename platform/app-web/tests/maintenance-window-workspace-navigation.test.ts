import { describe, expect, it, vi } from "vitest";

import {
  MAINTENANCE_WINDOW_SUBJECT_PARAM,
  MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS,
  navigateToMaintenanceWindowWorkspace,
  navigateToMaintenanceWindowWorkspaceForTopologyObject,
  readMaintenanceWindowSubjectsFromSearch,
} from "../src/lib/maintenance-window-workspace-navigation";
import { MAINTENANCE_PREVIEW_CONTEXT_PARAM } from "../src/lib/maintenance-preview-navigation";

describe("maintenance window workspace navigation", () => {
  it("readMaintenanceWindowSubjectsFromSearch returns empty when no mww_subject", () => {
    expect(readMaintenanceWindowSubjectsFromSearch("?view=maintenance-window-workspace")).toEqual({ kind: "empty" });
  });

  it("parses repeated mww_subject tokens and dedupes", () => {
    const s = `?view=maintenance-window-workspace&${MAINTENANCE_WINDOW_SUBJECT_PARAM}=node:PE1&${MAINTENANCE_WINDOW_SUBJECT_PARAM}=link:L1&${MAINTENANCE_WINDOW_SUBJECT_PARAM}=node:PE1`;
    const st = readMaintenanceWindowSubjectsFromSearch(s);
    expect(st.kind).toBe("ready");
    if (st.kind === "ready") {
      expect(st.subjects).toHaveLength(2);
      expect(st.subjects.map((x) => `${x.objectKind}:${x.objectId}`).sort()).toEqual(["link:L1", "node:PE1"]);
    }
  });

  it("returns invalid on bad token", () => {
    const st = readMaintenanceWindowSubjectsFromSearch(`?${MAINTENANCE_WINDOW_SUBJECT_PARAM}=badtoken`);
    expect(st.kind).toBe("invalid");
  });

  it("returns invalid when over cap", () => {
    const parts: string[] = [];
    for (let i = 0; i < MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS + 1; i += 1) {
      parts.push(`${MAINTENANCE_WINDOW_SUBJECT_PARAM}=node:n${i}`);
    }
    const st = readMaintenanceWindowSubjectsFromSearch(`?${parts.join("&")}`);
    expect(st.kind).toBe("invalid");
  });

  it("navigateToMaintenanceWindowWorkspace sets view and mww_subject params", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=overview&foo=bar",
      search: "?view=overview&foo=bar",
    });

    navigateToMaintenanceWindowWorkspace({
      subjects: [
        { objectKind: "node", objectId: "PE1" },
        { objectKind: "link", objectId: "P1--PE1" },
      ],
      previewContext: "planning_window",
      syncRunsLimit: 20,
    });

    const urlArg = replaceState.mock.calls[0][2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("view")).toBe("maintenance-window-workspace");
    expect(next.searchParams.getAll(MAINTENANCE_WINDOW_SUBJECT_PARAM).sort()).toEqual(["link:P1--PE1", "node:PE1"]);
    expect(next.searchParams.get(MAINTENANCE_PREVIEW_CONTEXT_PARAM)).toBe("planning_window");
    expect(next.searchParams.get("sync_runs_limit")).toBe("20");
    expect(next.searchParams.get("foo")).toBe("bar");

    replaceState.mockRestore();
  });

  it("navigateToMaintenanceWindowWorkspaceForTopologyObject sets a single mww_subject", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=topology",
      search: "?view=topology",
    });

    navigateToMaintenanceWindowWorkspaceForTopologyObject("PE1", "node", {
      previewContext: "topology_drilldown",
      syncRunsLimit: 12,
    });

    const urlArg = replaceState.mock.calls[0][2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.getAll(MAINTENANCE_WINDOW_SUBJECT_PARAM)).toEqual(["node:PE1"]);
    expect(next.searchParams.get(MAINTENANCE_PREVIEW_CONTEXT_PARAM)).toBe("topology_drilldown");
    expect(next.searchParams.get("sync_runs_limit")).toBe("12");

    replaceState.mockRestore();
  });

  it("navigateToMaintenanceWindowWorkspace applies optional global_search_q echo", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=overview",
      search: "?view=overview",
    });

    navigateToMaintenanceWindowWorkspace({
      subjects: [{ objectKind: "node", objectId: "PE1" }],
      previewContext: "planning_window",
      syncRunsLimit: 10,
      echoSearchQuery: "PE1 static",
    });

    const urlArg = replaceState.mock.calls[0][2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("global_search_q")).toBe("PE1 static");

    replaceState.mockRestore();
  });
});
