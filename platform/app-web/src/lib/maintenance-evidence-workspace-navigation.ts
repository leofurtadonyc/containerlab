/**
 * URL helpers for Maintenance Evidence Workspace (`view=maintenance-evidence-workspace`).
 * Subject selectors mirror Maintenance Preview (`maintenance_node_id`, `maintenance_link_id`, …).
 */

import type { MaintenancePreviewContext } from "../api/contracts";
import { applyGlobalSearchQueryEcho } from "./global-search-deeplink";
import {
  MAINTENANCE_LINK_ID_PARAM,
  MAINTENANCE_NODE_ID_PARAM,
  MAINTENANCE_OBJECT_ID_PARAM,
  MAINTENANCE_OBJECT_KIND_PARAM,
  MAINTENANCE_PREVIEW_CONTEXT_PARAM,
} from "./maintenance-preview-navigation";
import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";

export {
  readMaintenancePreviewSubjectFromSearch,
  type MaintenancePreviewSubject,
} from "./maintenance-preview-navigation";

const DEFAULT_CONTEXT: MaintenancePreviewContext = "explicit_subject";

export interface NavigateToMaintenanceEvidenceWorkspaceOptions {
  nodeId?: string | null;
  linkId?: string | null;
  objectId?: string | null;
  objectKind?: "node" | "link" | null;
  previewContext?: MaintenancePreviewContext | null;
  echoSearchQuery?: string | null;
}

export function navigateToMaintenanceEvidenceWorkspace(options?: NavigateToMaintenanceEvidenceWorkspaceOptions): void {
  const opt = options ?? {};
  const sp = mergeViewIntoSearch(window.location.search, "maintenance-evidence-workspace");
  sp.delete(MAINTENANCE_NODE_ID_PARAM);
  sp.delete(MAINTENANCE_LINK_ID_PARAM);
  sp.delete(MAINTENANCE_OBJECT_ID_PARAM);
  sp.delete(MAINTENANCE_OBJECT_KIND_PARAM);

  const nid = opt.nodeId?.trim();
  const lid = opt.linkId?.trim();
  const oid = opt.objectId?.trim();
  const ok = opt.objectKind ?? null;

  if (nid) {
    sp.set(MAINTENANCE_NODE_ID_PARAM, nid);
  } else if (lid) {
    sp.set(MAINTENANCE_LINK_ID_PARAM, lid);
  } else if (oid && ok) {
    sp.set(MAINTENANCE_OBJECT_ID_PARAM, oid);
    sp.set(MAINTENANCE_OBJECT_KIND_PARAM, ok);
  }

  const pctx = opt.previewContext ?? DEFAULT_CONTEXT;
  sp.set(MAINTENANCE_PREVIEW_CONTEXT_PARAM, pctx);

  if ("echoSearchQuery" in opt) {
    applyGlobalSearchQueryEcho(sp, opt.echoSearchQuery);
  }
  replaceUrlSearchParams(sp);
}

export function navigateToMaintenanceEvidenceWorkspaceForTopologyObject(
  objectId: string,
  objectKind: "node" | "link",
  options?: {
    previewContext?: MaintenancePreviewContext;
    echoSearchQuery?: string | null;
  },
): void {
  navigateToMaintenanceEvidenceWorkspace({
    objectId,
    objectKind,
    previewContext: options?.previewContext ?? "topology_drilldown",
    ...(options?.echoSearchQuery !== undefined ? { echoSearchQuery: options.echoSearchQuery } : {}),
  });
}
