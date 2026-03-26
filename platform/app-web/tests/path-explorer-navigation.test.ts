/**
 * Regression: Path Explorer shell params (`view=path-explorer`, `path_explorer_policy_id`).
 *
 * Overlap with closed navigation helpers: uses the same `mergeViewIntoSearch` / `replaceUrlSearchParams`
 * discipline as `policy-dossier-navigation.ts` — **extension** (new destination), not a reopen of Policies URL semantics.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import * as urlAppState from "../src/lib/url-app-state";
import {
  PATH_EXPLORER_POLICY_ID_PARAM,
  readPathExplorerPolicyIdFromSearch,
  navigateToPathExplorer,
} from "../src/lib/path-explorer-navigation";

describe("path-explorer-navigation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("readPathExplorerPolicyIdFromSearch returns trimmed id or null", () => {
    expect(readPathExplorerPolicyIdFromSearch("")).toBeNull();
    expect(readPathExplorerPolicyIdFromSearch("?path_explorer_policy_id=")).toBeNull();
    expect(readPathExplorerPolicyIdFromSearch(`?${PATH_EXPLORER_POLICY_ID_PARAM}=p1`)).toBe("p1");
  });

  it("navigateToPathExplorer sets view=path-explorer and policy anchor, preserving other params", () => {
    const spy = vi.spyOn(urlAppState, "replaceUrlSearchParams").mockImplementation(() => {});
    const prev = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...prev, search: "?view=overview&keep=1" },
      writable: true,
    });

    navigateToPathExplorer("PE1:static_local:192.0.2.11:100");

    expect(spy).toHaveBeenCalledTimes(1);
    const sp = spy.mock.calls[0][0] as URLSearchParams;
    expect(sp.get("view")).toBe("path-explorer");
    expect(sp.get(PATH_EXPLORER_POLICY_ID_PARAM)).toBe("PE1:static_local:192.0.2.11:100");
    expect(sp.get("keep")).toBe("1");

    Object.defineProperty(window, "location", { configurable: true, value: prev });
  });
});
