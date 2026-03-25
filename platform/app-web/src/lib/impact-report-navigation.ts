/**
 * URL helpers for Impact Report (`view=impact-report`).
 */

import { applyGlobalSearchQueryEcho } from "./global-search-deeplink";
import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";
import type { MaintenancePreviewContext } from "../api/contracts";
import type { MaintenancePreviewQuery } from "../api/client";
import {
  MAINTENANCE_LINK_ID_PARAM,
  MAINTENANCE_NODE_ID_PARAM,
  MAINTENANCE_OBJECT_ID_PARAM,
  MAINTENANCE_OBJECT_KIND_PARAM,
  MAINTENANCE_PREVIEW_CONTEXT_PARAM,
  readMaintenancePreviewSubjectFromSearch,
  type MaintenancePreviewSubject,
} from "./maintenance-preview-navigation";

export const IMPACT_REPORT_CONTEXT_PARAM = "impact_report_context";
export const IMPACT_SERVICE_ID_PARAM = "impact_service_id";
export const IMPACT_POLICY_ID_PARAM = "impact_policy_id";

export type ImpactReportRoute =
  | { kind: "setup" }
  | { kind: "invalid"; reason: string }
  | { kind: "service_impact"; serviceId: string }
  | { kind: "policy_impact"; policyId: string }
  | { kind: "maintenance_impact"; query: MaintenancePreviewQuery };

function clearMaintenanceParams(sp: URLSearchParams): void {
  sp.delete(MAINTENANCE_NODE_ID_PARAM);
  sp.delete(MAINTENANCE_LINK_ID_PARAM);
  sp.delete(MAINTENANCE_OBJECT_ID_PARAM);
  sp.delete(MAINTENANCE_OBJECT_KIND_PARAM);
}

function clearImpactAnchors(sp: URLSearchParams): void {
  sp.delete(IMPACT_SERVICE_ID_PARAM);
  sp.delete(IMPACT_POLICY_ID_PARAM);
}

function maintenanceSubjectToQuery(subject: MaintenancePreviewSubject): MaintenancePreviewQuery | null {
  if (subject.kind === "invalid") {
    return null;
  }
  if (subject.kind === "node") {
    return { nodeId: subject.nodeId, previewContext: subject.previewContext };
  }
  if (subject.kind === "link") {
    return { linkId: subject.linkId, previewContext: subject.previewContext };
  }
  return {
    objectId: subject.objectId,
    objectKind: subject.objectKind,
    previewContext: subject.previewContext,
  };
}

export function readImpactReportRouteFromSearch(search: string): ImpactReportRoute {
  const sp = new URLSearchParams(search);
  const ctx = sp.get(IMPACT_REPORT_CONTEXT_PARAM)?.trim();
  if (!ctx) {
    return { kind: "setup" };
  }
  if (ctx === "service_impact") {
    const sid = sp.get(IMPACT_SERVICE_ID_PARAM)?.trim();
    if (!sid) {
      return { kind: "invalid", reason: "Missing impact_service_id for service impact report." };
    }
    return { kind: "service_impact", serviceId: sid };
  }
  if (ctx === "policy_impact") {
    const pid = sp.get(IMPACT_POLICY_ID_PARAM)?.trim();
    if (!pid) {
      return { kind: "invalid", reason: "Missing impact_policy_id for policy impact report." };
    }
    return { kind: "policy_impact", policyId: pid };
  }
  if (ctx === "maintenance_impact") {
    const subj = readMaintenancePreviewSubjectFromSearch(search);
    if (!subj) {
      return { kind: "invalid", reason: "Missing maintenance subject selectors for maintenance impact report." };
    }
    if (subj.kind === "invalid") {
      return {
        kind: "invalid",
        reason:
          "Invalid maintenance subject parameters (use only one of maintenance_node_id, maintenance_link_id, or maintenance_object_id with maintenance_object_kind).",
      };
    }
    const q = maintenanceSubjectToQuery(subj);
    if (!q) {
      return { kind: "invalid", reason: "Could not derive maintenance preview query from URL." };
    }
    return { kind: "maintenance_impact", query: q };
  }
  return { kind: "invalid", reason: `Unknown ${IMPACT_REPORT_CONTEXT_PARAM}=${ctx}.` };
}

export function navigateToImpactReportForService(
  serviceId: string,
  options?: { echoSearchQuery?: string | null },
): void {
  const sp = mergeViewIntoSearch(window.location.search, "impact-report");
  sp.set(IMPACT_REPORT_CONTEXT_PARAM, "service_impact");
  clearImpactAnchors(sp);
  clearMaintenanceParams(sp);
  sp.set(IMPACT_SERVICE_ID_PARAM, serviceId.trim());
  if (options && "echoSearchQuery" in options) {
    applyGlobalSearchQueryEcho(sp, options.echoSearchQuery);
  }
  replaceUrlSearchParams(sp);
}

export function navigateToImpactReportForPolicy(
  policyId: string,
  options?: { echoSearchQuery?: string | null },
): void {
  const sp = mergeViewIntoSearch(window.location.search, "impact-report");
  sp.set(IMPACT_REPORT_CONTEXT_PARAM, "policy_impact");
  clearImpactAnchors(sp);
  clearMaintenanceParams(sp);
  sp.set(IMPACT_POLICY_ID_PARAM, policyId.trim());
  if (options && "echoSearchQuery" in options) {
    applyGlobalSearchQueryEcho(sp, options.echoSearchQuery);
  }
  replaceUrlSearchParams(sp);
}

/** Opens Impact Report setup (choose anchor) with optional `global_search_q` echo — not an anchored report by itself. */
export function navigateToImpactReportHub(echoSearchQuery?: string | null): void {
  const sp = mergeViewIntoSearch(window.location.search, "impact-report");
  sp.delete(IMPACT_REPORT_CONTEXT_PARAM);
  clearImpactAnchors(sp);
  clearMaintenanceParams(sp);
  applyGlobalSearchQueryEcho(sp, echoSearchQuery);
  replaceUrlSearchParams(sp);
}

export interface NavigateToImpactReportMaintenanceOptions {
  nodeId?: string | null;
  linkId?: string | null;
  objectId?: string | null;
  objectKind?: "node" | "link" | null;
  previewContext?: MaintenancePreviewContext | null;
  echoSearchQuery?: string | null;
}

export function navigateToImpactReportForMaintenance(options?: NavigateToImpactReportMaintenanceOptions): void {
  const opt = options ?? {};
  const sp = mergeViewIntoSearch(window.location.search, "impact-report");
  sp.set(IMPACT_REPORT_CONTEXT_PARAM, "maintenance_impact");
  clearImpactAnchors(sp);
  clearMaintenanceParams(sp);

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

  const pctx = opt.previewContext ?? "explicit_subject";
  sp.set(MAINTENANCE_PREVIEW_CONTEXT_PARAM, pctx);

  if ("echoSearchQuery" in opt) {
    applyGlobalSearchQueryEcho(sp, opt.echoSearchQuery);
  }
  replaceUrlSearchParams(sp);
}
