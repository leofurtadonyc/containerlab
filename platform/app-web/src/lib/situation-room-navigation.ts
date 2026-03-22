/**
 * Navigate to the bounded situation room (evidence pack) view while preserving other URL params.
 */

import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";

/** Sync-run window aligned with Overview recent-change and nested history loads (1–100). */
export function navigateToSituationRoomView(syncRunsLimit = 20): void {
  const bounded = Math.min(100, Math.max(1, Math.floor(syncRunsLimit)));
  const sp = mergeViewIntoSearch(window.location.search, "situation-room");
  sp.set("sync_runs_limit", String(bounded));
  replaceUrlSearchParams(sp);
}
