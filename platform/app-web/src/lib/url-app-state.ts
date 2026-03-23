/**
 * Lightweight URL search synchronization for the single-page shell (no router).
 * Dispatches a custom event when `history.replaceState` updates the query string
 * so hooks can re-fetch with new bounded read-side parameters.
 */

import type { DegradedPolicyV1PostureFilter } from "./presentation";
import { PLATFORM_NAV_VIEW_IDS } from "../nav-views";

export const APP_URL_SEARCH_CHANGED = "app:urlsearchchanged";

const DEGRADED_POLICY_V1_POSTURE_PARAM = "degraded_policy_v1_posture";

/** Read `degraded_policy_v1_posture` from the shell query string (Policies page filter). */
export function readDegradedPolicyV1PostureFromSearch(search: string): DegradedPolicyV1PostureFilter {
  const raw = new URLSearchParams(search).get(DEGRADED_POLICY_V1_POSTURE_PARAM);
  if (raw === "degraded" || raw === "unknown" || raw === "ok") {
    return raw;
  }
  return "all";
}

/** Mutates `params` to set or clear the degraded-policy v1 posture filter. */
export function applyDegradedPolicyV1PostureToSearchParams(
  params: URLSearchParams,
  posture: DegradedPolicyV1PostureFilter,
): void {
  if (posture === "all") {
    params.delete(DEGRADED_POLICY_V1_POSTURE_PARAM);
  } else {
    params.set(DEGRADED_POLICY_V1_POSTURE_PARAM, posture);
  }
}

/** Switch to Policies with optional degraded-policy v1 posture pre-selected (read-side drill-down). */
export function navigateToPoliciesWithDegradedPolicyV1Posture(
  posture: DegradedPolicyV1PostureFilter,
): void {
  const sp = mergeViewIntoSearch(window.location.search, "policies");
  applyDegradedPolicyV1PostureToSearchParams(sp, posture);
  replaceUrlSearchParams(sp);
}

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
