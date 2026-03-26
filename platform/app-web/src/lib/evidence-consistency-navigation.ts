/**
 * Navigate to the evidence consistency workspace while preserving other URL params.
 */

import { applyGlobalSearchQueryEcho } from "./global-search-deeplink";
import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";

/** Bounded sync-run window aligned with Overview / digest assembly (1–100). */
export function navigateToEvidenceConsistencyWorkspace(syncRunsLimit = 20, echoSearchQuery?: string): void {
  const bounded = Math.min(100, Math.max(1, Math.floor(syncRunsLimit)));
  const sp = mergeViewIntoSearch(window.location.search, "evidence-consistency");
  sp.set("sync_runs_limit", String(bounded));
  applyGlobalSearchQueryEcho(sp, echoSearchQuery);
  replaceUrlSearchParams(sp);
}
