/**
 * Service Impact Workspace v1 — shell URL params (`view=service-impact-workspace`).
 * Stable anchor: `service_impact_workspace_service_id` (distinct from Service Explorer `service_id` to avoid cross-view ambiguity).
 */

import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";

export const SERVICE_IMPACT_WORKSPACE_SERVICE_ID_PARAM = "service_impact_workspace_service_id";

export function readServiceImpactWorkspaceServiceIdFromSearch(search: string): string | null {
  const raw = new URLSearchParams(search).get(SERVICE_IMPACT_WORKSPACE_SERVICE_ID_PARAM);
  const t = raw?.trim();
  return t && t.length > 0 ? t : null;
}

/** Navigate to Service Impact Workspace with a Service Explorer `service_id` anchor (read-only shell). */
export function navigateToServiceImpactWorkspace(serviceId: string): void {
  const sp = mergeViewIntoSearch(window.location.search, "service-impact-workspace");
  sp.set(SERVICE_IMPACT_WORKSPACE_SERVICE_ID_PARAM, serviceId.trim());
  replaceUrlSearchParams(sp);
}

/** Clear the workspace service anchor; keeps other params. */
export function clearServiceImpactWorkspaceServiceAnchor(): void {
  const sp = new URLSearchParams(window.location.search);
  sp.delete(SERVICE_IMPACT_WORKSPACE_SERVICE_ID_PARAM);
  replaceUrlSearchParams(sp);
}
