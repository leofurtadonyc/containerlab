/**
 * Navigate to the operator briefing workspace while preserving bounded read-side URL params.
 */

import {
  applyGlobalSearchQueryEcho,
  GLOBAL_SEARCH_QUERY_PARAM,
} from "./global-search-deeplink";
import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";
import type { OperatorBriefingQuery } from "../api/client";
import {
  DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT,
  readSyncRunsLimitFromSearch,
} from "./investigation-navigation";

function topologyObjectKindFromParam(raw: string | null): "node" | "link" | null {
  if (raw === "node" || raw === "link") {
    return raw;
  }
  return null;
}

/** Default sync window aligned with Overview recent-change and nested assemblies (1–100). */
export const DEFAULT_OPERATOR_BRIEFING_SYNC_RUNS_LIMIT = 20;

export interface NavigateToOperatorBriefingOptions {
  policyId?: string;
  topologyObject?: { id: string; kind: "node" | "link" };
  /** Echoed by app-api as `inv_from` (not authority). */
  invFrom?: string;
  echoSearchQuery?: string;
  /** Clears `policy_id` and topology object hints for a default hub scope. */
  clearPinnedScope?: boolean;
}

export function navigateToOperatorBriefingView(
  syncRunsLimit = DEFAULT_OPERATOR_BRIEFING_SYNC_RUNS_LIMIT,
  options?: NavigateToOperatorBriefingOptions,
): void {
  const bounded = Math.min(100, Math.max(1, Math.floor(syncRunsLimit)));
  const sp = mergeViewIntoSearch(window.location.search, "operator-briefing");
  sp.set("sync_runs_limit", String(bounded));

  if (options?.clearPinnedScope) {
    sp.delete("policy_id");
    sp.delete("topology_object");
    sp.delete("topology_object_kind");
  }

  if (options?.policyId) {
    sp.set("policy_id", options.policyId);
    if (!options.topologyObject) {
      sp.delete("topology_object");
      sp.delete("topology_object_kind");
    }
  }
  if (options?.topologyObject) {
    sp.set("topology_object", options.topologyObject.id);
    sp.set("topology_object_kind", options.topologyObject.kind);
    if (!options.policyId) {
      sp.delete("policy_id");
    }
  }

  if (options?.invFrom) {
    sp.set("inv_from", options.invFrom);
  } else {
    sp.delete("inv_from");
  }

  applyGlobalSearchQueryEcho(sp, options?.echoSearchQuery);
  replaceUrlSearchParams(sp);
}

/** Reads bounded operator-briefing query fields from the shell URL for API calls. */
export function readOperatorBriefingQueryFromSearch(search: string): OperatorBriefingQuery {
  const syncRunsLimit = readSyncRunsLimitFromSearch(search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT);
  const sp = new URLSearchParams(search);
  const policyId = sp.get("policy_id");
  const topologyObject = sp.get("topology_object");
  const kindParsed = topologyObjectKindFromParam(sp.get("topology_object_kind"));
  const invFrom = sp.get("inv_from");
  const globalSearchQ = sp.get(GLOBAL_SEARCH_QUERY_PARAM);
  const topo = topologyObject?.trim() || undefined;
  return {
    syncRunsLimit,
    policyId: policyId?.trim() || undefined,
    topologyObject: topo,
    topologyObjectKind: topo ? kindParsed ?? undefined : undefined,
    invFrom: invFrom?.trim() || undefined,
    globalSearchQ: globalSearchQ?.trim() || undefined,
  };
}
