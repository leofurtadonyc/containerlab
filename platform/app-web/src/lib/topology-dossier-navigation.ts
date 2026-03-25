/**
 * Client-only navigation for the topology object dossier workspace (read-only shell hints).
 * See `topology_object_dossier_v1` and week 29 dossier UI.
 */

import type { TopologyObjectKind } from "../api/contracts";
import { applyGlobalSearchQueryEcho } from "./global-search-deeplink";
import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";

/** When `dossier`, Topology shows the composed dossier workspace (`topology_workspace=dossier`). */
export const TOPOLOGY_WORKSPACE_PARAM = "topology_workspace";

/**
 * Optional breadcrumb for where the operator opened the dossier from (not sent to app-api).
 * Values are stable for tests and support.
 */
export const DOSSIER_SOURCE_PARAM = "dossier_source";

export type TopologyDossierNavigationSource =
  | "topology_table"
  | "failure_impact"
  | "risk_summary"
  | "overview_risk"
  | "global_search"
  | "delta_digest_workspace"
  | "operator_briefing_workspace"
  | "evidence_replay_viewer"
  | "service_explorer"
  | "service_dossier"
  | "maintenance_preview";

/** Read `dossier_source` from the shell query string. */
export function readDossierSourceFromSearch(search: string): TopologyDossierNavigationSource | null {
  const raw = new URLSearchParams(search).get(DOSSIER_SOURCE_PARAM);
  if (
    raw === "topology_table" ||
    raw === "failure_impact" ||
    raw === "risk_summary" ||
    raw === "overview_risk" ||
    raw === "global_search" ||
    raw === "delta_digest_workspace" ||
    raw === "operator_briefing_workspace" ||
    raw === "evidence_replay_viewer" ||
    raw === "service_explorer" ||
    raw === "service_dossier" ||
    raw === "maintenance_preview"
  ) {
    return raw;
  }
  return null;
}

/**
 * Navigate to Topology with the dossier workspace open for the given object.
 * Sets `topology_workspace=dossier`, `topology_object`, `topology_object_kind`, and optional `dossier_source`.
 */
export function navigateToTopologyDossier(
  objectId: string,
  kind: TopologyObjectKind,
  source: TopologyDossierNavigationSource,
  echoSearchQuery?: string,
): void {
  const sp = mergeViewIntoSearch(window.location.search, "topology");
  sp.set("topology_object", objectId);
  sp.set("topology_object_kind", kind);
  sp.set(TOPOLOGY_WORKSPACE_PARAM, "dossier");
  sp.set(DOSSIER_SOURCE_PARAM, source);
  applyGlobalSearchQueryEcho(sp, echoSearchQuery);
  replaceUrlSearchParams(sp);
}
