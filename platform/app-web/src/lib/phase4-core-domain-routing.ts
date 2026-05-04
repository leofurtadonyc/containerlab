import { readViewIdFromSearch } from "./url-app-state";

export type CoreDomainFlagId =
  | "next.home"
  | "next.network"
  | "next.governance"
  | "next.policyService";

export type CoreDomainRouteId =
  | "home.overview"
  | "home.platformHealth"
  | "network.devices"
  | "network.topology"
  | "governance.capabilities"
  | "governance.readiness"
  | "policyService.policies"
  | "policyService.serviceExplorer";

interface CoreDomainRoute {
  id: CoreDomainRouteId;
  viewId: string;
  flag: CoreDomainFlagId;
}

const CORE_DOMAIN_ROUTES: readonly CoreDomainRoute[] = [
  { id: "home.overview", viewId: "overview", flag: "next.home" },
  { id: "home.platformHealth", viewId: "platform-health", flag: "next.home" },
  { id: "network.devices", viewId: "devices", flag: "next.network" },
  { id: "network.topology", viewId: "topology", flag: "next.network" },
  { id: "governance.capabilities", viewId: "capabilities", flag: "next.governance" },
  { id: "governance.readiness", viewId: "readiness", flag: "next.governance" },
  { id: "policyService.policies", viewId: "policies", flag: "next.policyService" },
  { id: "policyService.serviceExplorer", viewId: "service-explorer", flag: "next.policyService" },
] as const;

const ROUTE_BY_ID = new Map(CORE_DOMAIN_ROUTES.map((route) => [route.id, route]));
const ROUTE_BY_VIEW_ID = new Map(CORE_DOMAIN_ROUTES.map((route) => [route.viewId, route]));

export const CORE_DOMAIN_ROUTE_IDS = new Set<CoreDomainRouteId>(CORE_DOMAIN_ROUTES.map((route) => route.id));

export const CORE_DOMAIN_FLAG_IDS = [
  "next.home",
  "next.network",
  "next.governance",
  "next.policyService",
] as const;

export interface CoreDomainFlags {
  "next.home": boolean;
  "next.network": boolean;
  "next.governance": boolean;
  "next.policyService": boolean;
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

export function readCoreDomainFlagsFromSearch(
  search: string,
  runtimeEnv?: Partial<Record<string, string | boolean | undefined>>,
): CoreDomainFlags {
  const sp = new URLSearchParams(search);
  const runtime = runtimeEnv ?? {};
  const defaultHome = parseBooleanFlag(String(runtime.VITE_NEXT_HOME_ENABLED ?? "true"), true);
  const defaultNetwork = parseBooleanFlag(String(runtime.VITE_NEXT_NETWORK_ENABLED ?? "true"), true);
  const defaultGovernance = parseBooleanFlag(String(runtime.VITE_NEXT_GOVERNANCE_ENABLED ?? "true"), true);
  const defaultPolicyService = parseBooleanFlag(
    String(runtime.VITE_NEXT_POLICY_SERVICE_ENABLED ?? "true"),
    true,
  );
  return {
    "next.home": parseBooleanFlag(sp.get("next_home"), defaultHome),
    "next.network": parseBooleanFlag(sp.get("next_network"), defaultNetwork),
    "next.governance": parseBooleanFlag(sp.get("next_governance"), defaultGovernance),
    "next.policyService": parseBooleanFlag(sp.get("next_policy_service"), defaultPolicyService),
  };
}

export function findCoreDomainRouteByViewId(viewId: string): CoreDomainRoute | null {
  return ROUTE_BY_VIEW_ID.get(viewId) ?? null;
}

export function findCoreDomainRouteById(routeId: string): CoreDomainRoute | null {
  return ROUTE_BY_ID.get(routeId as CoreDomainRouteId) ?? null;
}

export function readViewIdFromSearchWithCoreRoutes(
  search: string,
  allowed: ReadonlySet<string>,
  flags: CoreDomainFlags,
): string | null {
  const sp = new URLSearchParams(search);
  const route = findCoreDomainRouteById(sp.get("route") ?? "");
  if (route && flags[route.flag]) {
    return route.viewId;
  }
  return readViewIdFromSearch(search, allowed);
}

export function mergeCoreDomainRouteIntoSearch(search: string, routeId: CoreDomainRouteId): URLSearchParams {
  const sp = new URLSearchParams(search);
  const route = ROUTE_BY_ID.get(routeId);
  if (!route) {
    return sp;
  }
  sp.set("route", route.id);
  sp.set("view", route.viewId);
  return sp;
}

export function maybeCanonicalizeCoreDomainAlias(
  search: string,
  flags: CoreDomainFlags,
): URLSearchParams | null {
  const sp = new URLSearchParams(search);
  const routeRaw = sp.get("route");
  const route = routeRaw ? findCoreDomainRouteById(routeRaw) : null;
  if (route && flags[route.flag]) {
    return null;
  }
  const view = sp.get("view");
  if (!view) {
    return null;
  }
  const byView = findCoreDomainRouteByViewId(view);
  if (!byView || !flags[byView.flag]) {
    return null;
  }
  sp.set("route", byView.id);
  return sp;
}
