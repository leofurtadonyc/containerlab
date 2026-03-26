/**
 * Path Explorer v1 — shell URL params (`view=path-explorer`).
 * Stable anchor: `path_explorer_policy_id` (distinct from Policies `policy_id` to avoid cross-view ambiguity).
 */

import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";

export const PATH_EXPLORER_POLICY_ID_PARAM = "path_explorer_policy_id";

export function readPathExplorerPolicyIdFromSearch(search: string): string | null {
  const raw = new URLSearchParams(search).get(PATH_EXPLORER_POLICY_ID_PARAM);
  const t = raw?.trim();
  return t && t.length > 0 ? t : null;
}

/** Navigate to Path Explorer with a normalized policy_id anchor (read-only shell). */
export function navigateToPathExplorer(policyId: string): void {
  const sp = mergeViewIntoSearch(window.location.search, "path-explorer");
  sp.set(PATH_EXPLORER_POLICY_ID_PARAM, policyId.trim());
  replaceUrlSearchParams(sp);
}

/** Clear the path-explorer policy anchor; keeps `view=path-explorer` if already there. */
export function clearPathExplorerPolicyAnchor(): void {
  const sp = new URLSearchParams(window.location.search);
  sp.delete(PATH_EXPLORER_POLICY_ID_PARAM);
  replaceUrlSearchParams(sp);
}
