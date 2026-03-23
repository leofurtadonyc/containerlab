/**
 * Client-only shell parameters that preserve investigation entry context across pivots.
 * Not sent to app-api; used for operator UX (breadcrumbs / return navigation).
 */

export const INV_FROM_PARAM = "inv_from";

/** When `v1`, investigation was opened from Topology **Failure impact (v1)** (read-only framing). */
export const FAILURE_IMPACT_ENTRY_PARAM = "failure_impact_entry";

/** Shell views that may set `inv_from` when opening the investigation workspace. */
export const INVESTIGATION_NAV_SOURCE_IDS = [
  "overview",
  "situation-room",
  "topology",
  "devices",
  "policies",
] as const;

export type InvestigationNavSourceId = (typeof INVESTIGATION_NAV_SOURCE_IDS)[number];

const INV_FROM_SET = new Set<string>(INVESTIGATION_NAV_SOURCE_IDS);

export function isInvestigationNavSourceId(value: string): value is InvestigationNavSourceId {
  return INV_FROM_SET.has(value);
}

export function labelForInvestigationNavSource(id: InvestigationNavSourceId): string {
  switch (id) {
    case "overview":
      return "Overview";
    case "situation-room":
      return "Situation room";
    case "topology":
      return "Topology";
    case "devices":
      return "Devices";
    case "policies":
      return "Policies";
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

export interface InvestigationNavContextParsed {
  invFrom: InvestigationNavSourceId | null;
  deviceId: string | null;
  policyId: string | null;
  topologyObjectId: string | null;
  topologyObjectKind: string | null;
  /** Present when shell recorded entry from the Topology failure-impact panel (`failure_impact_entry=v1`). */
  failureImpactEntry: "v1" | null;
}

export function parseInvestigationNavContext(search: string): InvestigationNavContextParsed {
  const sp = new URLSearchParams(search);
  const raw = sp.get(INV_FROM_PARAM);
  const invFrom =
    raw && isInvestigationNavSourceId(raw) ? (raw as InvestigationNavSourceId) : null;
  const rawFi = sp.get(FAILURE_IMPACT_ENTRY_PARAM);
  const failureImpactEntry = rawFi === "v1" ? ("v1" as const) : null;
  return {
    invFrom,
    deviceId: sp.get("device_id"),
    policyId: sp.get("policy_id"),
    topologyObjectId: sp.get("topology_object"),
    topologyObjectKind: sp.get("topology_object_kind"),
    failureImpactEntry,
  };
}
