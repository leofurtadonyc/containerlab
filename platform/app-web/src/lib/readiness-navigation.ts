/**
 * Bounded read-only navigation from Capabilities into the Readiness shell view.
 * Does not filter backend payloads — URL params are UI context and scroll hints only.
 */

import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";

export const READINESS_BLOCKER_PARAM = "readiness_blocker";
export const READINESS_CAPABILITY_FEATURE_PARAM = "readiness_capability_feature";

/** Stable DOM id for a readiness blocker card (matches URL `readiness_blocker` value). */
export function readinessBlockerDomId(blockerKey: string): string {
  return `readiness-blocker-${blockerKey.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

export function navigateToReadinessContext(options?: {
  blocker?: string;
  capabilityFeature?: string;
}): void {
  const sp = mergeViewIntoSearch(window.location.search, "readiness");
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
  replaceUrlSearchParams(sp);
}
