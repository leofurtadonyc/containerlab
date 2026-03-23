import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { navigateOverviewLayoutMode, readOverviewModeFromSearch } from "../src/lib/overview-mode";

describe("readOverviewModeFromSearch", () => {
  it("returns standard when param absent or not cockpit", () => {
    expect(readOverviewModeFromSearch("")).toBe("standard");
    expect(readOverviewModeFromSearch("?view=overview")).toBe("standard");
    expect(readOverviewModeFromSearch("?view=overview&overview_mode=standard")).toBe("standard");
  });

  it("returns cockpit when overview_mode=cockpit", () => {
    expect(readOverviewModeFromSearch("?view=overview&overview_mode=cockpit")).toBe("cockpit");
  });
});

describe("navigateOverviewLayoutMode", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/?view=topology&foo=bar");
  });

  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("sets overview_mode=cockpit and view=overview while preserving other params", () => {
    navigateOverviewLayoutMode("cockpit");
    const url = new URL(window.location.href);
    expect(url.searchParams.get("view")).toBe("overview");
    expect(url.searchParams.get("overview_mode")).toBe("cockpit");
    expect(url.searchParams.get("foo")).toBe("bar");
  });

  it("clears overview_mode when switching to standard", () => {
    window.history.replaceState({}, "", "/?view=overview&overview_mode=cockpit&keep=1");
    navigateOverviewLayoutMode("standard");
    const url = new URL(window.location.href);
    expect(url.searchParams.get("view")).toBe("overview");
    expect(url.searchParams.get("overview_mode")).toBeNull();
    expect(url.searchParams.get("keep")).toBe("1");
  });
});
