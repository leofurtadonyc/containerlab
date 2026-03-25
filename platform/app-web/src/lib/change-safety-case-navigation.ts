/**
 * URL helpers for Change Safety Case (`view=change-safety-case`).
 */

import { applyGlobalSearchQueryEcho } from "./global-search-deeplink";
import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";
import type { MaintenancePreviewContext } from "../api/contracts";
import type { MaintenancePreviewQuery } from "../api/client";
import {
  IMPACT_POLICY_ID_PARAM,
  IMPACT_REPORT_CONTEXT_PARAM,
  IMPACT_SERVICE_ID_PARAM,
} from "./impact-report-navigation";
import {
  MAINTENANCE_LINK_ID_PARAM,
  MAINTENANCE_NODE_ID_PARAM,
  MAINTENANCE_OBJECT_ID_PARAM,
  MAINTENANCE_OBJECT_KIND_PARAM,
  MAINTENANCE_PREVIEW_CONTEXT_PARAM,
  readMaintenancePreviewSubjectFromSearch,
  type MaintenancePreviewSubject,
} from "./maintenance-preview-navigation";

export const CHANGE_SAFETY_CONTEXT_PARAM = "change_safety_context";
export const CHANGE_SAFETY_POLICY_ID_PARAM = "csc_policy_id";
export const CHANGE_SAFETY_SERVICE_ID_PARAM = "csc_service_id";

export type ChangeSafetyCaseRoute =
  | { kind: "setup" }
  | { kind: "invalid"; reason: string }
  | { kind: "policy_change_safety"; policyId: string }
  | { kind: "service_change_safety"; serviceId: string }
  | { kind: "topology_change_safety"; query: MaintenancePreviewQuery };

function clearMaintenanceParams(sp: URLSearchParams): void {
  sp.delete(MAINTENANCE_NODE_ID_PARAM);
  sp.delete(MAINTENANCE_LINK_ID_PARAM);
  sp.delete(MAINTENANCE_OBJECT_ID_PARAM);
  sp.delete(MAINTENANCE_OBJECT_KIND_PARAM);
}

function clearImpactParams(sp: URLSearchParams): void {
  sp.delete(IMPACT_REPORT_CONTEXT_PARAM);
  sp.delete(IMPACT_SERVICE_ID_PARAM);
  sp.delete(IMPACT_POLICY_ID_PARAM);
}

function clearChangeSafetyAnchors(sp: URLSearchParams): void {
  sp.delete(CHANGE_SAFETY_POLICY_ID_PARAM);
  sp.delete(CHANGE_SAFETY_SERVICE_ID_PARAM);
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

export function readChangeSafetyCaseRouteFromSearch(search: string): ChangeSafetyCaseRoute {
  const sp = new URLSearchParams(search);
  const ctx = sp.get(CHANGE_SAFETY_CONTEXT_PARAM)?.trim();
  if (!ctx) {
    return { kind: "setup" };
  }
  if (ctx === "policy_change_safety") {
    const pid = sp.get(CHANGE_SAFETY_POLICY_ID_PARAM)?.trim();
    if (!pid) {
      return { kind: "invalid", reason: "Missing csc_policy_id for policy change safety case." };
    }
    return { kind: "policy_change_safety", policyId: pid };
  }
  if (ctx === "service_change_safety") {
    const sid = sp.get(CHANGE_SAFETY_SERVICE_ID_PARAM)?.trim();
    if (!sid) {
      return { kind: "invalid", reason: "Missing csc_service_id for service change safety case." };
    }
    return { kind: "service_change_safety", serviceId: sid };
  }
  if (ctx === "topology_change_safety") {
    const subj = readMaintenancePreviewSubjectFromSearch(search);
    if (!subj) {
      return { kind: "invalid", reason: "Missing maintenance subject selectors for topology change safety case." };
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
    return { kind: "topology_change_safety", query: q };
  }
  return { kind: "invalid", reason: `Unknown ${CHANGE_SAFETY_CONTEXT_PARAM}=${ctx}.` };
}

/** Opens Change Safety Case setup (quick form) with optional `global_search_q` echo — not an anchored case by itself. */
export function navigateToChangeSafetyCaseHub(echoSearchQuery?: string | null): void {
  const sp = mergeViewIntoSearch(window.location.search, "change-safety-case");
  sp.delete(CHANGE_SAFETY_CONTEXT_PARAM);
  clearChangeSafetyAnchors(sp);
  clearMaintenanceParams(sp);
  clearImpactParams(sp);
  applyGlobalSearchQueryEcho(sp, echoSearchQuery);
  replaceUrlSearchParams(sp);
}

export function navigateToChangeSafetyCaseForPolicy(
  policyId: string,
  options?: { echoSearchQuery?: string | null },
): void {
  const sp = mergeViewIntoSearch(window.location.search, "change-safety-case");
  sp.set(CHANGE_SAFETY_CONTEXT_PARAM, "policy_change_safety");
  clearChangeSafetyAnchors(sp);
  clearMaintenanceParams(sp);
  clearImpactParams(sp);
  sp.set(CHANGE_SAFETY_POLICY_ID_PARAM, policyId.trim());
  if (options && "echoSearchQuery" in options) {
    applyGlobalSearchQueryEcho(sp, options.echoSearchQuery);
  }
  replaceUrlSearchParams(sp);
}

export function navigateToChangeSafetyCaseForService(
  serviceId: string,
  options?: { echoSearchQuery?: string | null },
): void {
  const sp = mergeViewIntoSearch(window.location.search, "change-safety-case");
  sp.set(CHANGE_SAFETY_CONTEXT_PARAM, "service_change_safety");
  clearChangeSafetyAnchors(sp);
  clearMaintenanceParams(sp);
  clearImpactParams(sp);
  sp.set(CHANGE_SAFETY_SERVICE_ID_PARAM, serviceId.trim());
  if (options && "echoSearchQuery" in options) {
    applyGlobalSearchQueryEcho(sp, options.echoSearchQuery);
  }
  replaceUrlSearchParams(sp);
}

export interface NavigateToChangeSafetyCaseMaintenanceOptions {
  nodeId?: string | null;
  linkId?: string | null;
  objectId?: string | null;
  objectKind?: "node" | "link" | null;
  previewContext?: MaintenancePreviewContext | null;
  echoSearchQuery?: string | null;
}

export function navigateToChangeSafetyCaseForMaintenance(
  options?: NavigateToChangeSafetyCaseMaintenanceOptions,
): void {
  const opt = options ?? {};
  const sp = mergeViewIntoSearch(window.location.search, "change-safety-case");
  sp.set(CHANGE_SAFETY_CONTEXT_PARAM, "topology_change_safety");
  clearChangeSafetyAnchors(sp);
  clearImpactParams(sp);
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
