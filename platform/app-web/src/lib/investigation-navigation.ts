/**
 * Navigate to the bounded investigation workspace view while preserving other URL params.
 */

import {
  FAILURE_IMPACT_ENTRY_PARAM,
  INV_FROM_PARAM,
  RISK_SUMMARY_ENTRY_PARAM,
  type InvestigationNavSourceId,
} from "./investigation-url-context";
import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";

/** Default sync-run window aligned with Overview recent-change summary when the URL omits `sync_runs_limit`. */
export const DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT = 20;

export interface NavigateToInvestigationViewOptions {
  /** When set, records which shell surface opened investigation (`inv_from`); when omitted, clears `inv_from`. */
  invFrom?: InvestigationNavSourceId;
  /** Pins `topology_object` / `topology_object_kind` for investigation breadcrumb context (read-only). */
  topologyObject?: { id: string; kind: "node" | "link" };
  /** When true, sets `failure_impact_entry=v1` (bounded entry from Topology failure-impact panel). */
  failureImpactEntry?: boolean;
  /** When true, sets `risk_summary_entry=v1` (bounded entry from Overview/Topology risk summary panel). */
  riskSummaryEntry?: boolean;
}

/** Bounded sync-run window for nested change-intelligence assembly (1–100). */
export function readSyncRunsLimitFromSearch(
  search: string,
  fallback = DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT,
): number {
  const raw = new URLSearchParams(search).get("sync_runs_limit");
  if (!raw) {
    return fallback;
  }
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) {
    return fallback;
  }
  return Math.min(100, Math.max(1, n));
}

export function navigateToInvestigationView(
  syncRunsLimit = DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT,
  options?: NavigateToInvestigationViewOptions,
): void {
  const bounded = Math.min(100, Math.max(1, Math.floor(syncRunsLimit)));
  const sp = mergeViewIntoSearch(window.location.search, "investigation");
  sp.set("sync_runs_limit", String(bounded));
  if (options?.invFrom) {
    sp.set(INV_FROM_PARAM, options.invFrom);
  } else {
    sp.delete(INV_FROM_PARAM);
  }
  if (options?.topologyObject) {
    sp.set("topology_object", options.topologyObject.id);
    sp.set("topology_object_kind", options.topologyObject.kind);
  }
  if (options?.failureImpactEntry) {
    sp.set(FAILURE_IMPACT_ENTRY_PARAM, "v1");
    sp.delete(RISK_SUMMARY_ENTRY_PARAM);
  } else if (options?.riskSummaryEntry) {
    sp.set(RISK_SUMMARY_ENTRY_PARAM, "v1");
    sp.delete(FAILURE_IMPACT_ENTRY_PARAM);
  } else {
    sp.delete(FAILURE_IMPACT_ENTRY_PARAM);
    sp.delete(RISK_SUMMARY_ENTRY_PARAM);
  }
  replaceUrlSearchParams(sp);
}
