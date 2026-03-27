/**
 * Evidence quality workspace — shell URL params (`view=evidence-quality-workspace`).
 * Optional `sync_runs_limit` aligns with other bounded summaries.
 */

import { applyGlobalSearchQueryEcho } from "./global-search-deeplink";
import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";

export interface NavigateToEvidenceQualityWorkspaceOptions {
  syncRunsLimit?: number;
  echoSearchQuery?: string | null;
}

/** Navigate to the evidence quality workspace (read-only; preserves unrelated query params). */
export function navigateToEvidenceQualityWorkspace(options: NavigateToEvidenceQualityWorkspaceOptions = {}): void {
  const sp = mergeViewIntoSearch(window.location.search, "evidence-quality-workspace");
  const lim = Math.min(100, Math.max(1, Math.floor(options.syncRunsLimit ?? 20)));
  sp.set("sync_runs_limit", String(lim));
  if ("echoSearchQuery" in options) {
    applyGlobalSearchQueryEcho(sp, options.echoSearchQuery);
  }
  replaceUrlSearchParams(sp);
}
