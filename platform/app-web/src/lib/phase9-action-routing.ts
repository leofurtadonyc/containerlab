export type ActionRouteId = "action.safeAction" | "action.rollback";

type ActionRouteFlagId = "next.safeAction" | "next.rollback";

interface ActionRoute {
  id: ActionRouteId;
  viewId: string;
  flag: ActionRouteFlagId;
}

const ACTION_ROUTES: readonly ActionRoute[] = [
  { id: "action.safeAction", viewId: "safe-action-workspace", flag: "next.safeAction" },
  { id: "action.rollback", viewId: "rollback-workspace", flag: "next.rollback" },
] as const;

const ROUTE_BY_ID = new Map(ACTION_ROUTES.map((route) => [route.id, route]));
const ROUTE_BY_VIEW_ID = new Map(ACTION_ROUTES.map((route) => [route.viewId, route]));

export interface ActionRouteFlags {
  domainEnabled: boolean;
  "next.safeAction": boolean;
  "next.rollback": boolean;
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

export function readActionRouteFlagsFromSearch(
  search: string,
  runtimeEnv?: Partial<Record<string, string | boolean | undefined>>,
): ActionRouteFlags {
  const sp = new URLSearchParams(search);
  const runtime = runtimeEnv ?? {};
  const domainEnabled = parseBooleanFlag(
    sp.get("next_action"),
    parseBooleanFlag(String(runtime.VITE_NEXT_ACTION_ENABLED ?? "true"), true),
  );
  return {
    domainEnabled,
    "next.safeAction": parseBooleanFlag(
      sp.get("next_safe_action"),
      parseBooleanFlag(String(runtime.VITE_NEXT_SAFE_ACTION_ENABLED ?? "true"), true),
    ),
    "next.rollback": parseBooleanFlag(
      sp.get("next_rollback"),
      parseBooleanFlag(String(runtime.VITE_NEXT_ROLLBACK_ENABLED ?? "true"), true),
    ),
  };
}

function isActionRouteEnabled(route: ActionRoute | null, flags: ActionRouteFlags): boolean {
  if (!route) {
    return false;
  }
  return flags.domainEnabled && flags[route.flag];
}

export function readViewIdFromSearchWithActionRoutes(
  search: string,
  flags: ActionRouteFlags,
): string | null {
  const sp = new URLSearchParams(search);
  const route = ROUTE_BY_ID.get((sp.get("route") ?? "") as ActionRouteId) ?? null;
  if (!isActionRouteEnabled(route, flags)) {
    return null;
  }
  return route!.viewId;
}

export function mergeActionRouteIntoSearch(search: string, routeId: ActionRouteId): URLSearchParams {
  const sp = new URLSearchParams(search);
  const route = ROUTE_BY_ID.get(routeId);
  if (!route) {
    return sp;
  }
  sp.set("route", route.id);
  sp.set("view", route.viewId);
  return sp;
}

export function maybeCanonicalizeActionAlias(
  search: string,
  flags: ActionRouteFlags,
): URLSearchParams | null {
  const sp = new URLSearchParams(search);
  const route = ROUTE_BY_ID.get((sp.get("route") ?? "") as ActionRouteId) ?? null;
  if (route) {
    if (!isActionRouteEnabled(route, flags)) {
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
  if (!isActionRouteEnabled(byView, flags)) {
    return null;
  }
  return mergeActionRouteIntoSearch(sp.toString(), byView!.id);
}
