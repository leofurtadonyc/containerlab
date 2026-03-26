/**
 * Stability workspace — shell URL params (`view=stability-workspace`).
 * Reuses `topology_object` / `topology_object_kind` and Service Explorer `service_id` anchors.
 */

import { applyGlobalSearchQueryEcho } from "./global-search-deeplink";
import { SERVICE_EXPLORER_SERVICE_ID_PARAM } from "./service-explorer-navigation";
import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";

export function readStabilityWorkspaceTopologyFromSearch(
  search: string,
): { objectId: string; kind: "node" | "link" } | null {
  const sp = new URLSearchParams(search);
  const oid = sp.get("topology_object")?.trim();
  const kind = sp.get("topology_object_kind")?.trim();
  if (!oid || (kind !== "node" && kind !== "link")) {
    return null;
  }
  return { objectId: oid, kind };
}

export function readStabilityWorkspaceServiceIdFromSearch(search: string): string | null {
  const raw = new URLSearchParams(search).get(SERVICE_EXPLORER_SERVICE_ID_PARAM);
  const t = raw?.trim();
  return t && t.length > 0 ? t : null;
}

export interface NavigateToStabilityWorkspaceOptions {
  syncRunsLimit?: number;
  /** When `null`, clears topology anchors. When set, pins node/link selection. */
  topologyObject?: { id: string; kind: "node" | "link" } | null;
  /** When `null`, clears `service_id`. When set, pins service stability profile anchor. */
  serviceId?: string | null;
  echoSearchQuery?: string | null;
}

/** Navigate to the stability workspace (read-only; preserves unrelated query params). */
export function navigateToStabilityWorkspace(options: NavigateToStabilityWorkspaceOptions = {}): void {
  const sp = mergeViewIntoSearch(window.location.search, "stability-workspace");
  const lim = Math.min(100, Math.max(1, Math.floor(options.syncRunsLimit ?? 20)));
  sp.set("sync_runs_limit", String(lim));
  if (options.topologyObject === null) {
    sp.delete("topology_object");
    sp.delete("topology_object_kind");
  } else if (options.topologyObject) {
    sp.set("topology_object", options.topologyObject.id);
    sp.set("topology_object_kind", options.topologyObject.kind);
  }
  if (options.serviceId === null) {
    sp.delete(SERVICE_EXPLORER_SERVICE_ID_PARAM);
  } else if (options.serviceId?.trim()) {
    sp.set(SERVICE_EXPLORER_SERVICE_ID_PARAM, options.serviceId.trim());
  }
  if ("echoSearchQuery" in options) {
    applyGlobalSearchQueryEcho(sp, options.echoSearchQuery);
  }
  replaceUrlSearchParams(sp);
}
