import { describe, expect, it, vi } from "vitest";

import { GLOBAL_SEARCH_QUERY_PARAM } from "../src/lib/global-search-deeplink";
import { navigateToSituationRoomView } from "../src/lib/situation-room-navigation";

describe("navigateToSituationRoomView", () => {
  it("sets view=situation-room and sync_runs_limit, preserving other params", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=overview&foo=bar",
      search: "?view=overview&foo=bar",
    });

    navigateToSituationRoomView(12);

    const call = replaceState.mock.calls[0];
    expect(call).toBeDefined();
    const urlArg = call![2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("view")).toBe("situation-room");
    expect(next.searchParams.get("sync_runs_limit")).toBe("12");
    expect(next.searchParams.get("foo")).toBe("bar");

    replaceState.mockRestore();
  });

  it("sets global_search_q when echo is provided", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=overview",
      search: "?view=overview",
    });

    navigateToSituationRoomView(20, "echo-q");

    const urlArg = replaceState.mock.calls[0][2] as string;
    expect(new URL(urlArg).searchParams.get(GLOBAL_SEARCH_QUERY_PARAM)).toBe("echo-q");

    replaceState.mockRestore();
  });

  it("clamps sync_runs_limit to 1–100", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/",
      search: "",
    });

    navigateToSituationRoomView(500);
    let urlArg = replaceState.mock.calls.at(-1)![2] as string;
    expect(new URL(urlArg).searchParams.get("sync_runs_limit")).toBe("100");

    navigateToSituationRoomView(0);
    urlArg = replaceState.mock.calls.at(-1)![2] as string;
    expect(new URL(urlArg).searchParams.get("sync_runs_limit")).toBe("1");

    replaceState.mockRestore();
  });
});
