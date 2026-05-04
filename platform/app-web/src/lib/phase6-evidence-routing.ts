export type EvidenceRouteId =
  | "evidence.investigation"
  | "evidence.situationRoom"
  | "evidence.operatorBriefing"
  | "evidence.deltaDigest"
  | "evidence.consistency"
  | "evidence.quality"
  | "evidence.stability"
  | "evidence.replay";

type EvidenceFlagId =
  | "next.evidence.investigation"
  | "next.evidence.situationRoom"
  | "next.evidence.operatorBriefing"
  | "next.evidence.deltaDigest"
  | "next.evidence.consistency"
  | "next.evidence.quality"
  | "next.evidence.stability"
  | "next.evidence.replay";

interface EvidenceRoute {
  id: EvidenceRouteId;
  viewId: string;
  flag: EvidenceFlagId;
}

const EVIDENCE_ROUTES: readonly EvidenceRoute[] = [
  { id: "evidence.investigation", viewId: "investigation", flag: "next.evidence.investigation" },
  { id: "evidence.situationRoom", viewId: "situation-room", flag: "next.evidence.situationRoom" },
  { id: "evidence.operatorBriefing", viewId: "operator-briefing", flag: "next.evidence.operatorBriefing" },
  { id: "evidence.deltaDigest", viewId: "delta-digest", flag: "next.evidence.deltaDigest" },
  { id: "evidence.consistency", viewId: "evidence-consistency", flag: "next.evidence.consistency" },
  { id: "evidence.quality", viewId: "evidence-quality-workspace", flag: "next.evidence.quality" },
  { id: "evidence.stability", viewId: "stability-workspace", flag: "next.evidence.stability" },
  { id: "evidence.replay", viewId: "evidence-replay", flag: "next.evidence.replay" },
] as const;

const ROUTE_BY_ID = new Map(EVIDENCE_ROUTES.map((route) => [route.id, route]));
const ROUTE_BY_VIEW_ID = new Map(EVIDENCE_ROUTES.map((route) => [route.viewId, route]));

export interface EvidenceRouteFlags {
  domainEnabled: boolean;
  "next.evidence.investigation": boolean;
  "next.evidence.situationRoom": boolean;
  "next.evidence.operatorBriefing": boolean;
  "next.evidence.deltaDigest": boolean;
  "next.evidence.consistency": boolean;
  "next.evidence.quality": boolean;
  "next.evidence.stability": boolean;
  "next.evidence.replay": boolean;
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

export function readEvidenceRouteFlagsFromSearch(
  search: string,
  runtimeEnv?: Partial<Record<string, string | boolean | undefined>>,
): EvidenceRouteFlags {
  const sp = new URLSearchParams(search);
  const runtime = runtimeEnv ?? {};
  const domainEnabled = parseBooleanFlag(
    sp.get("next_evidence"),
    parseBooleanFlag(String(runtime.VITE_NEXT_EVIDENCE_ENABLED ?? "true"), true),
  );
  return {
    domainEnabled,
    "next.evidence.investigation": parseBooleanFlag(
      sp.get("next_evidence_investigation"),
      parseBooleanFlag(String(runtime.VITE_NEXT_EVIDENCE_INVESTIGATION_ENABLED ?? "true"), true),
    ),
    "next.evidence.situationRoom": parseBooleanFlag(
      sp.get("next_evidence_situation_room"),
      parseBooleanFlag(String(runtime.VITE_NEXT_EVIDENCE_SITUATION_ROOM_ENABLED ?? "true"), true),
    ),
    "next.evidence.operatorBriefing": parseBooleanFlag(
      sp.get("next_evidence_operator_briefing"),
      parseBooleanFlag(String(runtime.VITE_NEXT_EVIDENCE_OPERATOR_BRIEFING_ENABLED ?? "true"), true),
    ),
    "next.evidence.deltaDigest": parseBooleanFlag(
      sp.get("next_evidence_delta_digest"),
      parseBooleanFlag(String(runtime.VITE_NEXT_EVIDENCE_DELTA_DIGEST_ENABLED ?? "true"), true),
    ),
    "next.evidence.consistency": parseBooleanFlag(
      sp.get("next_evidence_consistency"),
      parseBooleanFlag(String(runtime.VITE_NEXT_EVIDENCE_CONSISTENCY_ENABLED ?? "true"), true),
    ),
    "next.evidence.quality": parseBooleanFlag(
      sp.get("next_evidence_quality"),
      parseBooleanFlag(String(runtime.VITE_NEXT_EVIDENCE_QUALITY_ENABLED ?? "true"), true),
    ),
    "next.evidence.stability": parseBooleanFlag(
      sp.get("next_evidence_stability"),
      parseBooleanFlag(String(runtime.VITE_NEXT_EVIDENCE_STABILITY_ENABLED ?? "true"), true),
    ),
    "next.evidence.replay": parseBooleanFlag(
      sp.get("next_evidence_replay"),
      parseBooleanFlag(String(runtime.VITE_NEXT_EVIDENCE_REPLAY_ENABLED ?? "true"), true),
    ),
  };
}

export function findEvidenceRouteByViewId(viewId: string): EvidenceRoute | null {
  return ROUTE_BY_VIEW_ID.get(viewId) ?? null;
}

function isEvidenceRouteEnabled(route: EvidenceRoute | null, flags: EvidenceRouteFlags): boolean {
  if (!route) {
    return false;
  }
  return flags.domainEnabled && flags[route.flag];
}

export function readViewIdFromSearchWithEvidenceRoutes(
  search: string,
  flags: EvidenceRouteFlags,
): string | null {
  const sp = new URLSearchParams(search);
  const route = ROUTE_BY_ID.get((sp.get("route") ?? "") as EvidenceRouteId) ?? null;
  if (!isEvidenceRouteEnabled(route, flags)) {
    return null;
  }
  return route!.viewId;
}

export function mergeEvidenceRouteIntoSearch(search: string, routeId: EvidenceRouteId): URLSearchParams {
  const sp = new URLSearchParams(search);
  const route = ROUTE_BY_ID.get(routeId);
  if (!route) {
    return sp;
  }
  sp.set("route", route.id);
  sp.set("view", route.viewId);
  return sp;
}

export function maybeCanonicalizeEvidenceAlias(
  search: string,
  flags: EvidenceRouteFlags,
): URLSearchParams | null {
  const sp = new URLSearchParams(search);
  const route = ROUTE_BY_ID.get((sp.get("route") ?? "") as EvidenceRouteId) ?? null;
  if (route) {
    if (!isEvidenceRouteEnabled(route, flags)) {
      return null;
    }
    if (sp.get("view") === route.viewId) {
      return null;
    }
    const next = new URLSearchParams(sp);
    next.set("view", route.viewId);
    return next;
  }

  const viewId = sp.get("view") ?? "";
  const byView = ROUTE_BY_VIEW_ID.get(viewId) ?? null;
  if (!isEvidenceRouteEnabled(byView, flags)) {
    return null;
  }
  return mergeEvidenceRouteIntoSearch(sp.toString(), byView!.id);
}
