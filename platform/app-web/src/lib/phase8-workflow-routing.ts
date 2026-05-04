export type WorkflowRouteId =
  | "workflow.lifecycle"
  | "workflow.preview"
  | "workflow.validation";

type WorkflowRouteFlagId =
  | "next.workflowLifecycle"
  | "next.previewWorkspace"
  | "next.validationWorkspace";

interface WorkflowRoute {
  id: WorkflowRouteId;
  viewId: string;
  flag: WorkflowRouteFlagId;
}

const WORKFLOW_ROUTES: readonly WorkflowRoute[] = [
  { id: "workflow.lifecycle", viewId: "workflow-lifecycle", flag: "next.workflowLifecycle" },
  { id: "workflow.preview", viewId: "preview-workspace", flag: "next.previewWorkspace" },
  { id: "workflow.validation", viewId: "validation-workspace", flag: "next.validationWorkspace" },
] as const;

const ROUTE_BY_ID = new Map(WORKFLOW_ROUTES.map((route) => [route.id, route]));
const ROUTE_BY_VIEW_ID = new Map(WORKFLOW_ROUTES.map((route) => [route.viewId, route]));

export interface WorkflowRouteFlags {
  domainEnabled: boolean;
  "next.workflowLifecycle": boolean;
  "next.previewWorkspace": boolean;
  "next.validationWorkspace": boolean;
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

export function readWorkflowRouteFlagsFromSearch(
  search: string,
  runtimeEnv?: Partial<Record<string, string | boolean | undefined>>,
): WorkflowRouteFlags {
  const sp = new URLSearchParams(search);
  const runtime = runtimeEnv ?? {};
  const domainEnabled = parseBooleanFlag(
    sp.get("next_workflow"),
    parseBooleanFlag(String(runtime.VITE_NEXT_WORKFLOW_ENABLED ?? "true"), true),
  );
  return {
    domainEnabled,
    "next.workflowLifecycle": parseBooleanFlag(
      sp.get("next_workflow_lifecycle"),
      parseBooleanFlag(String(runtime.VITE_NEXT_WORKFLOW_LIFECYCLE_ENABLED ?? "true"), true),
    ),
    "next.previewWorkspace": parseBooleanFlag(
      sp.get("next_preview_workspace"),
      parseBooleanFlag(String(runtime.VITE_NEXT_PREVIEW_WORKSPACE_ENABLED ?? "true"), true),
    ),
    "next.validationWorkspace": parseBooleanFlag(
      sp.get("next_validation_workspace"),
      parseBooleanFlag(String(runtime.VITE_NEXT_VALIDATION_WORKSPACE_ENABLED ?? "true"), true),
    ),
  };
}

function isWorkflowRouteEnabled(route: WorkflowRoute | null, flags: WorkflowRouteFlags): boolean {
  if (!route) {
    return false;
  }
  return flags.domainEnabled && flags[route.flag];
}

export function findWorkflowRouteByViewId(viewId: string): WorkflowRoute | null {
  return ROUTE_BY_VIEW_ID.get(viewId) ?? null;
}

export function readViewIdFromSearchWithWorkflowRoutes(
  search: string,
  flags: WorkflowRouteFlags,
): string | null {
  const sp = new URLSearchParams(search);
  const route = ROUTE_BY_ID.get((sp.get("route") ?? "") as WorkflowRouteId) ?? null;
  if (!isWorkflowRouteEnabled(route, flags)) {
    return null;
  }
  return route!.viewId;
}

export function mergeWorkflowRouteIntoSearch(search: string, routeId: WorkflowRouteId): URLSearchParams {
  const sp = new URLSearchParams(search);
  const route = ROUTE_BY_ID.get(routeId);
  if (!route) {
    return sp;
  }
  sp.set("route", route.id);
  sp.set("view", route.viewId);
  return sp;
}

export function maybeCanonicalizeWorkflowAlias(
  search: string,
  flags: WorkflowRouteFlags,
): URLSearchParams | null {
  const sp = new URLSearchParams(search);
  const route = ROUTE_BY_ID.get((sp.get("route") ?? "") as WorkflowRouteId) ?? null;
  if (route) {
    if (!isWorkflowRouteEnabled(route, flags)) {
      return null;
    }
    if (sp.get("view") === route.viewId) {
      return null;
    }
    const next = new URLSearchParams(sp);
    next.set("view", route.viewId);
    return next;
  }
  const byView = ROUTE_BY_VIEW_ID.get(sp.get("view") ?? "") ?? null;
  if (!isWorkflowRouteEnabled(byView, flags)) {
    return null;
  }
  return mergeWorkflowRouteIntoSearch(sp.toString(), byView!.id);
}
