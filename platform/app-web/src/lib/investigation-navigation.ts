/**
 * Navigate to the bounded investigation workspace view while preserving other URL params.
 */

import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";

/** Sync-run window forwarded to nested change-intelligence assembly (1–100). */
export function navigateToInvestigationView(syncRunsLimit = 20): void {
  const bounded = Math.min(100, Math.max(1, Math.floor(syncRunsLimit)));
  const sp = mergeViewIntoSearch(window.location.search, "investigation");
  sp.set("sync_runs_limit", String(bounded));
  replaceUrlSearchParams(sp);
}
