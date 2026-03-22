import type { ChangeEvidenceDomain } from "../api/contracts";

const PRODUCT_SURFACE_DOMAINS = new Set<ChangeEvidenceDomain>(["devices", "topology", "policies"]);

/** Domains that map to the Devices, Topology, and Policies shell views (read-only `view=` navigation). */
export function isChangeIntelligenceProductSurfaceDomain(
  domain: ChangeEvidenceDomain,
): domain is "devices" | "topology" | "policies" {
  return PRODUCT_SURFACE_DOMAINS.has(domain);
}

/** Domains whose aggregation maps to Workflow history / Audit history shell views (sync-derived lists, not filtered by the summary). */
export function isChangeIntelligenceHistorySurfaceDomain(
  domain: ChangeEvidenceDomain,
): domain is "workflow_history" | "audit_history" {
  return domain === "workflow_history" || domain === "audit_history";
}

export function viewIdForChangeIntelligenceHistoryDomain(
  domain: "workflow_history" | "audit_history",
): "workflows" | "audit" {
  return domain === "workflow_history" ? "workflows" : "audit";
}
