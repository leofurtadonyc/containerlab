import { describe, expect, it, vi } from "vitest";

import {
  navigateToMaintenanceEvidenceWorkspace,
  navigateToMaintenanceEvidenceWorkspaceForTopologyObject,
  readMaintenancePreviewSubjectFromSearch,
} from "../src/lib/maintenance-evidence-workspace-navigation";
import {
  MAINTENANCE_LINK_ID_PARAM,
  MAINTENANCE_NODE_ID_PARAM,
  MAINTENANCE_OBJECT_ID_PARAM,
  MAINTENANCE_OBJECT_KIND_PARAM,
  MAINTENANCE_PREVIEW_CONTEXT_PARAM,
} from "../src/lib/maintenance-preview-navigation";

describe("maintenance evidence workspace navigation", () => {
  it("readMaintenancePreviewSubjectFromSearch is shared with maintenance preview params", () => {
    const s = readMaintenancePreviewSubjectFromSearch(`?${MAINTENANCE_NODE_ID_PARAM}=PE1`);
    expect(s).toEqual({
      kind: "node",
      nodeId: "PE1",
      previewContext: "explicit_subject",
    });
  });

  it("navigateToMaintenanceEvidenceWorkspace sets view and maintenance params", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=overview&foo=bar",
      search: "?view=overview&foo=bar",
    });

    navigateToMaintenanceEvidenceWorkspace({ nodeId: "PE1", previewContext: "topology_drilldown" });

    const urlArg = replaceState.mock.calls[0][2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("view")).toBe("maintenance-evidence-workspace");
    expect(next.searchParams.get(MAINTENANCE_NODE_ID_PARAM)).toBe("PE1");
    expect(next.searchParams.get(MAINTENANCE_PREVIEW_CONTEXT_PARAM)).toBe("topology_drilldown");
    expect(next.searchParams.get("foo")).toBe("bar");

    replaceState.mockRestore();
  });

  it("navigateToMaintenanceEvidenceWorkspaceForTopologyObject sets object selectors", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=policies",
      search: "?view=policies",
    });

    navigateToMaintenanceEvidenceWorkspaceForTopologyObject("L1", "link");

    const urlArg = replaceState.mock.calls[0][2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("view")).toBe("maintenance-evidence-workspace");
    expect(next.searchParams.get(MAINTENANCE_OBJECT_ID_PARAM)).toBe("L1");
    expect(next.searchParams.get(MAINTENANCE_OBJECT_KIND_PARAM)).toBe("link");
    expect(next.searchParams.get(MAINTENANCE_PREVIEW_CONTEXT_PARAM)).toBe("topology_drilldown");

    replaceState.mockRestore();
  });
});
