/**
 * URL helpers for the Service Dossier view (`view=service-dossier`).
 * Uses the same `service_id` query param as Service Explorer for stable `service_id` round-trip.
 */

import { applyGlobalSearchQueryEcho } from "./global-search-deeplink";
import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";
import { SERVICE_EXPLORER_SERVICE_ID_PARAM, readServiceExplorerServiceIdFromSearch } from "./service-explorer-navigation";

export function readServiceDossierServiceIdFromSearch(search: string): string | null {
  return readServiceExplorerServiceIdFromSearch(search);
}

export interface NavigateToServiceDossierOptions {
  serviceId: string | null;
  echoSearchQuery?: string | null;
}

export function navigateToServiceDossier(options: NavigateToServiceDossierOptions): void {
  const sp = mergeViewIntoSearch(window.location.search, "service-dossier");
  if (options.serviceId) {
    sp.set(SERVICE_EXPLORER_SERVICE_ID_PARAM, options.serviceId);
  } else {
    sp.delete(SERVICE_EXPLORER_SERVICE_ID_PARAM);
  }
  if ("echoSearchQuery" in options) {
    applyGlobalSearchQueryEcho(sp, options.echoSearchQuery);
  }
  replaceUrlSearchParams(sp);
}

/** Open Service Dossier for a single policy row (`service_id=policy:{policy_id}`) — same anchor as Service Explorer for policy. */
export function navigateToServiceDossierForPolicy(
  policyId: string,
  options?: { echoSearchQuery?: string | null },
): void {
  navigateToServiceDossier({
    serviceId: `policy:${policyId}`,
    ...(options && "echoSearchQuery" in options ? { echoSearchQuery: options.echoSearchQuery } : {}),
  });
}
