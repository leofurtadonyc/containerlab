import type { TopologyObjectKind } from "../api/contracts";
import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";

/**
 * Client-only shell hint: Policies view scrolls to and briefly emphasizes the evidence timeline
 * panel (`policy-evidence-timeline`). Not sent to app-api.
 */
export const POLICY_EVIDENCE_TIMELINE_FOCUS_PARAM = "policy_evidence_timeline_focus";

/**
 * Client-only shell hint: Policies view scrolls to and briefly emphasizes the evidence delta
 * panel (`policy-evidence-delta`). Not sent to app-api.
 */
export const POLICY_EVIDENCE_DELTA_FOCUS_PARAM = "policy_evidence_delta_focus";

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

/**
 * Navigate to Policies with `policy_id` and a client-only focus hint so the evidence timeline panel
 * scrolls into view after load (used from workflow/audit history drillthroughs).
 */
export function navigateToPoliciesPolicyEvidenceTimelineFocus(policyId: string): void {
  const sp = mergeViewIntoSearch(window.location.search, "policies");
  sp.set("policy_id", policyId);
  sp.set(POLICY_EVIDENCE_TIMELINE_FOCUS_PARAM, "v1");
  replaceUrlSearchParams(sp);
}

/**
 * Navigate to Policies with `policy_id` and a client-only focus hint so the evidence delta panel
 * scrolls into view after load (parallels {@link navigateToPoliciesPolicyEvidenceTimelineFocus}).
 */
export function navigateToPoliciesPolicyEvidenceDeltaFocus(policyId: string): void {
  const sp = mergeViewIntoSearch(window.location.search, "policies");
  sp.set("policy_id", policyId);
  sp.set(POLICY_EVIDENCE_DELTA_FOCUS_PARAM, "v1");
  replaceUrlSearchParams(sp);
}

/** Scroll to the evidence-timeline detail card without changing the URL (for use when already on Policies). */
export function scrollToPolicyEvidenceTimelineCard(): void {
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
