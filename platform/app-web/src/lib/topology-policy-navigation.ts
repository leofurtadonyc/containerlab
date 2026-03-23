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
  scrollToPolicyPathAnalysisCard();
}

/** Scroll to the path-analysis detail card without changing the URL (for use when already on Policies). */
export function scrollToPolicyPathAnalysisCard(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.setTimeout(() => {
    document.getElementById("policy-path-analysis")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 0);
}

/** Same pattern as path analysis: focus the evidence-timeline card (`#policy-evidence-timeline`). */
export function navigateToPoliciesPolicyEvidenceTimeline(policyId: string): void {
  navigateToPoliciesPolicy(policyId);
  if (typeof window === "undefined") {
    return;
  }
  window.setTimeout(() => {
    document.getElementById("policy-evidence-timeline")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 0);
}

/** Navigate to Topology with a node or link focused (bounded `topology_object` + `topology_object_kind`). */
export function navigateToTopologyObject(objectId: string, kind: TopologyObjectKind): void {
  const sp = mergeViewIntoSearch(window.location.search, "topology");
  sp.set("topology_object", objectId);
  sp.set("topology_object_kind", kind);
  replaceUrlSearchParams(sp);
}
