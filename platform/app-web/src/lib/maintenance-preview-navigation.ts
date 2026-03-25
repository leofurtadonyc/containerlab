/**
 * URL helpers for Maintenance Preview (`view=maintenance-preview`).
 */

import { applyGlobalSearchQueryEcho } from "./global-search-deeplink";
import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";
import type { MaintenancePreviewContext } from "../api/contracts";

export const MAINTENANCE_NODE_ID_PARAM = "maintenance_node_id";
export const MAINTENANCE_LINK_ID_PARAM = "maintenance_link_id";
export const MAINTENANCE_OBJECT_ID_PARAM = "maintenance_object_id";
export const MAINTENANCE_OBJECT_KIND_PARAM = "maintenance_object_kind";
export const MAINTENANCE_PREVIEW_CONTEXT_PARAM = "maintenance_preview_context";

const DEFAULT_CONTEXT: MaintenancePreviewContext = "explicit_subject";

function parsePreviewContext(raw: string | null): MaintenancePreviewContext {
  if (
    raw === "planning_window" ||
    raw === "topology_drilldown" ||
    raw === "change_adjacent" ||
    raw === "explicit_subject"
  ) {
    return raw;
  }
  return DEFAULT_CONTEXT;
}

export type MaintenancePreviewSubject =
  | { kind: "node"; nodeId: string; previewContext: MaintenancePreviewContext }
  | { kind: "link"; linkId: string; previewContext: MaintenancePreviewContext }
  | {
      kind: "explicit";
      objectId: string;
      objectKind: "node" | "link";
      previewContext: MaintenancePreviewContext;
    }
  | { kind: "invalid" };

export function readMaintenancePreviewSubjectFromSearch(search: string): MaintenancePreviewSubject | null {
  const sp = new URLSearchParams(search);
  const node = sp.get(MAINTENANCE_NODE_ID_PARAM)?.trim();
  const link = sp.get(MAINTENANCE_LINK_ID_PARAM)?.trim();
  const oid = sp.get(MAINTENANCE_OBJECT_ID_PARAM)?.trim();
  const okind = sp.get(MAINTENANCE_OBJECT_KIND_PARAM)?.trim();
  const ctx = parsePreviewContext(sp.get(MAINTENANCE_PREVIEW_CONTEXT_PARAM));

  if (node) {
    if (link || oid || okind) {
      return { kind: "invalid" };
    }
    return { kind: "node", nodeId: node, previewContext: ctx };
  }
  if (link) {
    if (oid || okind) {
      return { kind: "invalid" };
    }
    return { kind: "link", linkId: link, previewContext: ctx };
  }
  if (oid && okind && (okind === "node" || okind === "link")) {
    return { kind: "explicit", objectId: oid, objectKind: okind, previewContext: ctx };
  }
  if (oid || okind) {
    return { kind: "invalid" };
  }
  return null;
}

export interface NavigateToMaintenancePreviewOptions {
  nodeId?: string | null;
  linkId?: string | null;
  objectId?: string | null;
  objectKind?: "node" | "link" | null;
  previewContext?: MaintenancePreviewContext | null;
  echoSearchQuery?: string | null;
}

export function navigateToMaintenancePreview(options?: NavigateToMaintenancePreviewOptions): void {
  const opt = options ?? {};
  const sp = mergeViewIntoSearch(window.location.search, "maintenance-preview");
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
