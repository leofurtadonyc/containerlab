import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MaintenanceWindowWorkspaceView } from "../src/features/maintenance-window-workspace/view";

describe("MaintenanceWindowWorkspaceView", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders setup when no mww_subject in URL", () => {
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=maintenance-window-workspace",
      search: "?view=maintenance-window-workspace",
    });
    const html = renderToStaticMarkup(<MaintenanceWindowWorkspaceView />);
    expect(html).toContain("Maintenance window workspace");
    expect(html).toContain("Add subject");
    expect(html).toContain("Load maintenance window workspace");
  });

  it("renders invalid state for bad subject token", () => {
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=maintenance-window-workspace&mww_subject=bogus",
      search: "?view=maintenance-window-workspace&mww_subject=bogus",
    });
    const html = renderToStaticMarkup(<MaintenanceWindowWorkspaceView />);
    expect(html).toContain("Unable to load data");
    expect(html).toContain("Invalid subject token");
  });
});
