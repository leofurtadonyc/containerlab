/**
 * Bounded read-only navigation from Capabilities into the Readiness shell view.
 * Does not filter backend payloads — URL params are UI context and scroll hints only.
 */

import { applyGlobalSearchQueryEcho } from "./global-search-deeplink";
import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";

export const READINESS_BLOCKER_PARAM = "readiness_blocker";
export const READINESS_PREREQUISITE_PARAM = "readiness_prerequisite";
export const READINESS_CAPABILITY_FEATURE_PARAM = "readiness_capability_feature";

/** Stable DOM id for a readiness blocker card (matches URL `readiness_blocker` value). */
export function readinessBlockerDomId(blockerKey: string): string {
  return `readiness-blocker-${blockerKey.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

/** Stable DOM id for a prerequisite card (matches URL `readiness_prerequisite` value). */
export function readinessPrerequisiteDomId(prerequisiteKey: string): string {
  return `readiness-prerequisite-${prerequisiteKey.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

/**
 * Updates only blocker/prerequisite drilldown params on the current Readiness URL.
 * Preserves `readiness_capability_feature` and other bounded read-side params.
 */
export function navigateReadinessDrilldown(options: {
  blocker?: string | null;
  prerequisite?: string | null;
}): void {
  const sp = mergeViewIntoSearch(window.location.search, "readiness");
  sp.delete(READINESS_BLOCKER_PARAM);
  sp.delete(READINESS_PREREQUISITE_PARAM);
  if (options.blocker) {
    sp.set(READINESS_BLOCKER_PARAM, options.blocker);
  } else if (options.prerequisite) {
    sp.set(READINESS_PREREQUISITE_PARAM, options.prerequisite);
  }
  replaceUrlSearchParams(sp);
}

export function navigateToReadinessContext(options?: {
  blocker?: string;
  capabilityFeature?: string;
  echoSearchQuery?: string;
}): void {
  const sp = mergeViewIntoSearch(window.location.search, "readiness");
  sp.delete(READINESS_PREREQUISITE_PARAM);
  if (options?.blocker) {
    sp.set(READINESS_BLOCKER_PARAM, options.blocker);
  } else {
    sp.delete(READINESS_BLOCKER_PARAM);
  }
  if (options?.capabilityFeature) {
    sp.set(READINESS_CAPABILITY_FEATURE_PARAM, options.capabilityFeature);
  } else {
    sp.delete(READINESS_CAPABILITY_FEATURE_PARAM);
  }
  applyGlobalSearchQueryEcho(sp, options?.echoSearchQuery);
  replaceUrlSearchParams(sp);
}
