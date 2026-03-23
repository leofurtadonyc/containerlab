/**
 * Navigate to the cross-domain delta digest view while preserving other URL params.
 */

import { applyGlobalSearchQueryEcho } from "./global-search-deeplink";
import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";

/** Bounded sync-run window aligned with Overview recent-change and digest assembly (1–100). */
export function navigateToDeltaDigestView(syncRunsLimit = 20, echoSearchQuery?: string): void {
  const bounded = Math.min(100, Math.max(1, Math.floor(syncRunsLimit)));
  const sp = mergeViewIntoSearch(window.location.search, "delta-digest");
  sp.set("sync_runs_limit", String(bounded));
  applyGlobalSearchQueryEcho(sp, echoSearchQuery);
  replaceUrlSearchParams(sp);
}
