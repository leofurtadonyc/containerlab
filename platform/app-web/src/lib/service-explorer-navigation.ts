/**
 * URL helpers for the Service Explorer view (`view=service-explorer`).
 */

import { applyGlobalSearchQueryEcho } from "./global-search-deeplink";
import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";

/** When set, Service Explorer shows detail for this `service_id` (e.g. `policy:…`, `color:100`). */
export const SERVICE_EXPLORER_SERVICE_ID_PARAM = "service_id";

const READ_SIDE_PRIMARY_LIST_LIMIT_MAX = 500;

/** Read optional bounded primary-list limit for `GET /api/v1/services` (same echo as policies `limit`). */
export function readServiceExplorerLimitFromSearch(search: string): number | null {
  const raw = new URLSearchParams(search).get("limit");
  if (!raw) {
    return null;
  }
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) {
    return null;
  }
  return Math.min(READ_SIDE_PRIMARY_LIST_LIMIT_MAX, Math.max(1, n));
}

export function readServiceExplorerServiceIdFromSearch(search: string): string | null {
  const raw = new URLSearchParams(search).get(SERVICE_EXPLORER_SERVICE_ID_PARAM);
  const trimmed = raw?.trim();
  return trimmed ? trimmed : null;
}

export interface NavigateToServiceExplorerOptions {
  /** When set, open detail for this id; when `null` or omitted, clear and show the list. */
  serviceId?: string | null;
  /**
   * Optional list truncation (1–500). When this key is **omitted**, existing `limit=` in the URL is preserved.
   * Pass `null` to clear `limit` (full list on next load).
   */
  limit?: number | null;
  /**
   * When this key is present, sets or clears `global_search_q` (operator search echo). When **omitted**, existing
   * `global_search_q` in the URL is preserved.
   */
  echoSearchQuery?: string | null;
}

export function navigateToServiceExplorer(options?: NavigateToServiceExplorerOptions): void {
  const sp = mergeViewIntoSearch(window.location.search, "service-explorer");
  if (options?.serviceId) {
    sp.set(SERVICE_EXPLORER_SERVICE_ID_PARAM, options.serviceId);
  } else if (options && "serviceId" in options && options.serviceId === null) {
    sp.delete(SERVICE_EXPLORER_SERVICE_ID_PARAM);
  }
  if (options && "limit" in options) {
    if (options.limit != null && options.limit > 0) {
      sp.set("limit", String(Math.min(READ_SIDE_PRIMARY_LIST_LIMIT_MAX, Math.max(1, Math.floor(options.limit)))));
    } else {
      sp.delete("limit");
    }
  }
  if (options && "echoSearchQuery" in options) {
    applyGlobalSearchQueryEcho(sp, options.echoSearchQuery);
  }
  replaceUrlSearchParams(sp);
}

/** Open Service Explorer detail for a single policy row (`service_id=policy:{policy_id}`). */
export function navigateToServiceExplorerForPolicy(
  policyId: string,
  options?: { echoSearchQuery?: string | null },
): void {
  navigateToServiceExplorer({
    serviceId: `policy:${policyId}`,
    ...(options && "echoSearchQuery" in options ? { echoSearchQuery: options.echoSearchQuery } : {}),
  });
}
