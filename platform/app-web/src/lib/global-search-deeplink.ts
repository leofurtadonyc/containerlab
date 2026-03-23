/**
 * Client-only URL parameters for global operator search pivots (not sent to app-api).
 * Preserves the effective search string for shareable deep links and breadcrumbs.
 */

export const GLOBAL_SEARCH_QUERY_PARAM = "global_search_q";

export function applyGlobalSearchQueryEcho(
  sp: URLSearchParams,
  echoQuery: string | null | undefined,
): void {
  const q = echoQuery?.trim();
  if (q) {
    sp.set(GLOBAL_SEARCH_QUERY_PARAM, q);
  } else {
    sp.delete(GLOBAL_SEARCH_QUERY_PARAM);
  }
}
