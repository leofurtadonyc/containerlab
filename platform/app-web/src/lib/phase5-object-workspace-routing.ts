import {
  MAINTENANCE_NODE_ID_PARAM,
  MAINTENANCE_LINK_ID_PARAM,
  MAINTENANCE_OBJECT_ID_PARAM,
} from "./maintenance-preview-navigation";
import { MAINTENANCE_WINDOW_SUBJECT_PARAM } from "./maintenance-window-workspace-navigation";
import { POLICY_WORKSPACE_PARAM } from "./policy-dossier-navigation";
import { SERVICE_EXPLORER_SERVICE_ID_PARAM } from "./service-explorer-navigation";
import { SERVICE_IMPACT_WORKSPACE_SERVICE_ID_PARAM } from "./service-impact-workspace-navigation";
import { POLICY_EVIDENCE_DELTA_FOCUS_PARAM, POLICY_EVIDENCE_TIMELINE_FOCUS_PARAM } from "./topology-policy-navigation";
import { TOPOLOGY_WORKSPACE_PARAM } from "./topology-dossier-navigation";

export const POLICY_TAB_PARAM = "policy_tab";
export const TOPOLOGY_TAB_PARAM = "topology_tab";
export const SERVICE_TAB_PARAM = "service_tab";
export const MAINTENANCE_TAB_PARAM = "maintenance_tab";

type ObjectWorkspaceFlagId =
  | "next.policyObject"
  | "next.topologyObject"
  | "next.serviceObject"
  | "next.maintenanceObject";

export type ObjectWorkspaceRouteId =
  | "policy.object"
  | "topology.object"
  | "service.object"
  | "maintenance.subjectSet";

interface ObjectWorkspaceRoute {
  id: ObjectWorkspaceRouteId;
  flag: ObjectWorkspaceFlagId;
}

const OBJECT_WORKSPACE_ROUTES: readonly ObjectWorkspaceRoute[] = [
  { id: "policy.object", flag: "next.policyObject" },
  { id: "topology.object", flag: "next.topologyObject" },
  { id: "service.object", flag: "next.serviceObject" },
  { id: "maintenance.subjectSet", flag: "next.maintenanceObject" },
] as const;

const ROUTE_BY_ID = new Map(OBJECT_WORKSPACE_ROUTES.map((route) => [route.id, route]));

export interface ObjectWorkspaceFlags {
  "next.policyObject": boolean;
  "next.topologyObject": boolean;
  "next.serviceObject": boolean;
  "next.maintenanceObject": boolean;
}

function parseBooleanFlag(raw: string | null | undefined, fallback: boolean): boolean {
  if (!raw) {
    return fallback;
  }
  const normalized = raw.trim().toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "on" || normalized === "yes") {
    return true;
  }
  if (normalized === "0" || normalized === "false" || normalized === "off" || normalized === "no") {
    return false;
  }
  return fallback;
}

export function readObjectWorkspaceFlagsFromSearch(
  search: string,
  runtimeEnv?: Partial<Record<string, string | boolean | undefined>>,
): ObjectWorkspaceFlags {
  const sp = new URLSearchParams(search);
  const runtime = runtimeEnv ?? {};
  return {
    "next.policyObject": parseBooleanFlag(
      sp.get("next_policy_object"),
      parseBooleanFlag(String(runtime.VITE_NEXT_POLICY_OBJECT_ENABLED ?? "true"), true),
    ),
    "next.topologyObject": parseBooleanFlag(
      sp.get("next_topology_object"),
      parseBooleanFlag(String(runtime.VITE_NEXT_TOPOLOGY_OBJECT_ENABLED ?? "true"), true),
    ),
    "next.serviceObject": parseBooleanFlag(
      sp.get("next_service_object"),
      parseBooleanFlag(String(runtime.VITE_NEXT_SERVICE_OBJECT_ENABLED ?? "true"), true),
    ),
    "next.maintenanceObject": parseBooleanFlag(
      sp.get("next_maintenance_object"),
      parseBooleanFlag(String(runtime.VITE_NEXT_MAINTENANCE_OBJECT_ENABLED ?? "true"), true),
    ),
  };
}

function isRouteEnabled(routeId: string, flags: ObjectWorkspaceFlags): boolean {
  const route = ROUTE_BY_ID.get(routeId as ObjectWorkspaceRouteId);
  return route ? flags[route.flag] : false;
}

function normalizePolicyTab(sp: URLSearchParams): string {
  const explicit = sp.get(POLICY_TAB_PARAM);
  if (explicit) {
    return explicit;
  }
  const workspace = sp.get(POLICY_WORKSPACE_PARAM);
  if (workspace === "dossier") {
    return "dossier";
  }
  if (workspace === "explainability") {
    return "explainability";
  }
  if (sp.get(POLICY_EVIDENCE_TIMELINE_FOCUS_PARAM)) {
    return "timeline";
  }
  if (sp.get(POLICY_EVIDENCE_DELTA_FOCUS_PARAM)) {
    return "delta";
  }
  if (sp.get("path_explorer_policy_id")) {
    return "path";
  }
  return "overview";
}

function normalizeTopologyTab(sp: URLSearchParams): string {
  const explicit = sp.get(TOPOLOGY_TAB_PARAM);
  if (explicit) {
    return explicit;
  }
  if (sp.get(TOPOLOGY_WORKSPACE_PARAM) === "dossier") {
    return "dossier";
  }
  return "overview";
}

function normalizeServiceTab(sp: URLSearchParams): string {
  const explicit = sp.get(SERVICE_TAB_PARAM);
  if (explicit) {
    return explicit;
  }
  const view = sp.get("view");
  if (view === "service-dossier") {
    return "dossier";
  }
  if (view === "service-impact-workspace") {
    return "impact";
  }
  return "overview";
}

function normalizeMaintenanceTab(sp: URLSearchParams): string {
  const explicit = sp.get(MAINTENANCE_TAB_PARAM);
  if (explicit) {
    return explicit;
  }
  const view = sp.get("view");
  if (view === "maintenance-evidence-workspace") {
    return "evidence";
  }
  if (view === "maintenance-window-workspace") {
    return "window";
  }
  return "preview";
}

function viewAliasForObjectRoute(routeId: ObjectWorkspaceRouteId, tab: string): string {
  if (routeId === "policy.object") {
    return "policies";
  }
  if (routeId === "topology.object") {
    return "topology";
  }
  if (routeId === "service.object") {
    return tab === "dossier" ? "service-dossier" : tab === "impact" ? "service-impact-workspace" : "service-explorer";
  }
  return tab === "evidence"
    ? "maintenance-evidence-workspace"
    : tab === "window"
      ? "maintenance-window-workspace"
      : "maintenance-preview";
}

function inferObjectRouteFromAlias(sp: URLSearchParams): { routeId: ObjectWorkspaceRouteId; tab: string } | null {
  const view = sp.get("view");
  if (!view) {
    return null;
  }
  if (view === "policies" && sp.get("policy_id")) {
    return { routeId: "policy.object", tab: normalizePolicyTab(sp) };
  }
  if (view === "topology" && sp.get("topology_object")) {
    return { routeId: "topology.object", tab: normalizeTopologyTab(sp) };
  }
  if (view === "service-explorer" && sp.get(SERVICE_EXPLORER_SERVICE_ID_PARAM)) {
    return { routeId: "service.object", tab: normalizeServiceTab(sp) };
  }
  if (view === "service-dossier" && sp.get(SERVICE_EXPLORER_SERVICE_ID_PARAM)) {
    return { routeId: "service.object", tab: normalizeServiceTab(sp) };
  }
  if (view === "service-impact-workspace" && sp.get(SERVICE_IMPACT_WORKSPACE_SERVICE_ID_PARAM)) {
    return { routeId: "service.object", tab: normalizeServiceTab(sp) };
  }
  if (
    view === "maintenance-preview" &&
    (sp.get(MAINTENANCE_OBJECT_ID_PARAM) || sp.get(MAINTENANCE_NODE_ID_PARAM) || sp.get(MAINTENANCE_LINK_ID_PARAM))
  ) {
    return { routeId: "maintenance.subjectSet", tab: normalizeMaintenanceTab(sp) };
  }
  if (view === "maintenance-evidence-workspace") {
    return { routeId: "maintenance.subjectSet", tab: normalizeMaintenanceTab(sp) };
  }
  if (view === "maintenance-window-workspace" && sp.getAll(MAINTENANCE_WINDOW_SUBJECT_PARAM).length > 0) {
    return { routeId: "maintenance.subjectSet", tab: normalizeMaintenanceTab(sp) };
  }
  return null;
}

export function readViewIdFromSearchWithObjectRoutes(
  search: string,
  flags: ObjectWorkspaceFlags,
): string | null {
  const sp = new URLSearchParams(search);
  const route = sp.get("route");
  if (!route || !isRouteEnabled(route, flags)) {
    return null;
  }
  const routeId = route as ObjectWorkspaceRouteId;
  const tab =
    routeId === "policy.object"
      ? normalizePolicyTab(sp)
      : routeId === "topology.object"
        ? normalizeTopologyTab(sp)
        : routeId === "service.object"
          ? normalizeServiceTab(sp)
          : normalizeMaintenanceTab(sp);
  return viewAliasForObjectRoute(routeId, tab);
}

export function mergeObjectWorkspaceRouteIntoSearch(
  search: string,
  routeId: ObjectWorkspaceRouteId,
  tab: string,
): URLSearchParams {
  const sp = new URLSearchParams(search);
  sp.set("route", routeId);
  if (routeId === "policy.object") {
    sp.set(POLICY_TAB_PARAM, tab);
  } else if (routeId === "topology.object") {
    sp.set(TOPOLOGY_TAB_PARAM, tab);
  } else if (routeId === "service.object") {
    sp.set(SERVICE_TAB_PARAM, tab);
  } else {
    sp.set(MAINTENANCE_TAB_PARAM, tab);
  }
  sp.set("view", viewAliasForObjectRoute(routeId, tab));
  if (routeId === "service.object" && !sp.get(SERVICE_EXPLORER_SERVICE_ID_PARAM)) {
    const impactServiceId = sp.get(SERVICE_IMPACT_WORKSPACE_SERVICE_ID_PARAM);
    if (impactServiceId) {
      sp.set(SERVICE_EXPLORER_SERVICE_ID_PARAM, impactServiceId);
    }
  }
  return sp;
}

export function maybeCanonicalizeObjectWorkspaceAlias(
  search: string,
  flags: ObjectWorkspaceFlags,
): URLSearchParams | null {
  const sp = new URLSearchParams(search);
  const routeRaw = sp.get("route");
  if (routeRaw && isRouteEnabled(routeRaw, flags)) {
    const routeId = routeRaw as ObjectWorkspaceRouteId;
    const tab =
      routeId === "policy.object"
        ? normalizePolicyTab(sp)
        : routeId === "topology.object"
          ? normalizeTopologyTab(sp)
          : routeId === "service.object"
            ? normalizeServiceTab(sp)
            : normalizeMaintenanceTab(sp);
    const viewAlias = viewAliasForObjectRoute(routeId, tab);
    if (sp.get("view") === viewAlias) {
      return null;
    }
    const next = new URLSearchParams(sp);
    next.set("view", viewAlias);
    return next;
  }

  const inferred = inferObjectRouteFromAlias(sp);
  if (!inferred || !isRouteEnabled(inferred.routeId, flags)) {
    return null;
  }
  return mergeObjectWorkspaceRouteIntoSearch(sp.toString(), inferred.routeId, inferred.tab);
}
