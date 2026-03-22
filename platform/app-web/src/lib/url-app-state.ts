/**
 * Lightweight URL search synchronization for the single-page shell (no router).
 * Dispatches a custom event when `history.replaceState` updates the query string
 * so hooks can re-fetch with new bounded read-side parameters.
 */

import { PLATFORM_NAV_VIEW_IDS } from "../nav-views";

export const APP_URL_SEARCH_CHANGED = "app:urlsearchchanged";

/** Navigate to another shell view while preserving other query params (bounded read-side ergonomics). */
export function navigateToEvidenceView(viewId: string): void {
  if (!PLATFORM_NAV_VIEW_IDS.has(viewId)) {
    return;
  }
  const sp = mergeViewIntoSearch(window.location.search, viewId);
  replaceUrlSearchParams(sp);
}

export function getLocationSearchString(): string {
  return window.location.search;
}

export function replaceLocationSearch(nextSearch: string): void {
  const url = new URL(window.location.href);
  url.search = nextSearch.startsWith("?") ? nextSearch : nextSearch ? `?${nextSearch}` : "";
  window.history.replaceState({}, "", url.toString());
  window.dispatchEvent(new Event(APP_URL_SEARCH_CHANGED));
}

export function replaceUrlSearchParams(params: URLSearchParams): void {
  replaceLocationSearch(params.toString());
}

export function readViewIdFromSearch(
  search: string,
  allowed: ReadonlySet<string>,
): string | null {
  const sp = new URLSearchParams(search);
  const raw = sp.get("view");
  if (!raw || !allowed.has(raw)) {
    return null;
  }
  return raw;
}

export function mergeViewIntoSearch(search: string, view: string): URLSearchParams {
  const sp = new URLSearchParams(search);
  sp.set("view", view);
  return sp;
}
