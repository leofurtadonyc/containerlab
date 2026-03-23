import type { TopologyObjectKind } from "../api/contracts";
import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";

/** Navigate to Policies with a specific policy selected (bounded read-side `view=` + `policy_id`). */
export function navigateToPoliciesPolicy(policyId: string): void {
  const sp = mergeViewIntoSearch(window.location.search, "policies");
  sp.set("policy_id", policyId);
  replaceUrlSearchParams(sp);
}

/** Same as {@link navigateToPoliciesPolicy}, then scroll to the path-analysis card (`#policy-path-analysis`). */
export function navigateToPoliciesPolicyPathAnalysis(policyId: string): void {
  navigateToPoliciesPolicy(policyId);
  if (typeof window !== "undefined") {
    window.setTimeout(() => {
      document.getElementById("policy-path-analysis")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }
}

/** Navigate to Topology with a node or link focused (bounded `topology_object` + `topology_object_kind`). */
export function navigateToTopologyObject(objectId: string, kind: TopologyObjectKind): void {
  const sp = mergeViewIntoSearch(window.location.search, "topology");
  sp.set("topology_object", objectId);
  sp.set("topology_object_kind", kind);
  replaceUrlSearchParams(sp);
}
