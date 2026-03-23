import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";

/** URL param for [`noc-cockpit-contract.md`](../../docs/noc-cockpit-contract.md) layout on Overview. */
export const OVERVIEW_MODE_PARAM = "overview_mode";

export type OverviewLayoutMode = "standard" | "cockpit";

export function readOverviewModeFromSearch(search: string): OverviewLayoutMode {
  return new URLSearchParams(search).get(OVERVIEW_MODE_PARAM) === "cockpit" ? "cockpit" : "standard";
}

/** Switch Overview between standard cards and NOC cockpit composition (preserves other query params). */
export function navigateOverviewLayoutMode(mode: OverviewLayoutMode): void {
  const sp = mergeViewIntoSearch(window.location.search, "overview");
  if (mode === "cockpit") {
    sp.set(OVERVIEW_MODE_PARAM, "cockpit");
  } else {
    sp.delete(OVERVIEW_MODE_PARAM);
  }
  replaceUrlSearchParams(sp);
}
