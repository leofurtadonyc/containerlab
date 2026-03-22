import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";

/** Navigate to Policies with a specific policy selected (bounded read-side `view=` + `policy_id`). */
export function navigateToPoliciesPolicy(policyId: string): void {
  const sp = mergeViewIntoSearch(window.location.search, "policies");
  sp.set("policy_id", policyId);
  replaceUrlSearchParams(sp);
}
