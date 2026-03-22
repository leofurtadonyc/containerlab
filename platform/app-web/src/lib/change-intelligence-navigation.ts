import type { ChangeEvidenceDomain } from "../api/contracts";

const PRODUCT_SURFACE_DOMAINS = new Set<ChangeEvidenceDomain>(["devices", "topology", "policies"]);

/** Domains that map to the Devices, Topology, and Policies shell views (read-only `view=` navigation). */
export function isChangeIntelligenceProductSurfaceDomain(
  domain: ChangeEvidenceDomain,
): domain is "devices" | "topology" | "policies" {
  return PRODUCT_SURFACE_DOMAINS.has(domain);
}
