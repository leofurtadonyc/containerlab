import { applyGlobalSearchQueryEcho } from "./global-search-deeplink";
import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";
import {
  POLICY_EVIDENCE_DELTA_FOCUS_PARAM,
  POLICY_EVIDENCE_TIMELINE_FOCUS_PARAM,
} from "./topology-policy-navigation";

/** When `dossier` or `explainability`, Policies shows the composed workspace for that contract. */
export const POLICY_WORKSPACE_PARAM = "policy_workspace";

/** Client-only scroll hint into the explainability workspace (`policy_explainability_workspace_v1` WebUI). */
export const POLICY_EXPLAINABILITY_FOCUS_PARAM = "policy_explainability_focus";

const POLICY_EXPLAINABILITY_FOCUS_SET = new Set(["candidates", "path_story", "caveats"]);

export type PolicyExplainabilityFocus = "candidates" | "path_story" | "caveats";

export function readPolicyExplainabilityFocusFromSearch(search: string): PolicyExplainabilityFocus | null {
  const raw = new URLSearchParams(search).get(POLICY_EXPLAINABILITY_FOCUS_PARAM);
  if (!raw || !POLICY_EXPLAINABILITY_FOCUS_SET.has(raw)) {
    return null;
  }
  return raw as PolicyExplainabilityFocus;
}

export type PolicyWorkspaceMode = "standard" | "dossier" | "explainability";

/** Client-only breadcrumb: where the operator opened the policy dossier (not sent to app-api). */
export const POLICY_DOSSIER_ENTRY_PARAM = "policy_dossier_entry";

const KNOWN_POLICY_DOSSIER_ENTRY_VALUES = new Set([
  "policy_table",
  "policy_detail",
  "path_analysis_panel",
  "topology_impact_panel",
  "evidence_timeline_panel",
  "evidence_delta_panel",
  "workflow_history_drilldown",
  "audit_history_drilldown",
  "overview_operator_workspace",
  "overview_noc_cockpit",
  "topology_related_policies_panel",
  "global_search",
  "delta_digest_workspace",
  "operator_briefing_workspace",
  "evidence_replay_viewer",
  "service_explorer",
]);

export function readPolicyWorkspaceFromSearch(search: string): PolicyWorkspaceMode {
  const raw = new URLSearchParams(search).get(POLICY_WORKSPACE_PARAM);
  if (raw === "dossier") {
    return "dossier";
  }
  if (raw === "explainability") {
    return "explainability";
  }
  return "standard";
}

export function readPolicyWorkspaceFromUrl(): PolicyWorkspaceMode {
  if (typeof window === "undefined") {
    return "standard";
  }
  return readPolicyWorkspaceFromSearch(window.location.search);
}

/** Navigate to Policies with `policy_id` and dossier workspace (read-only composed briefing). */
export function navigateToPolicyDossierWorkspace(
  policyId: string,
  entryHint?: string,
  echoSearchQuery?: string,
): void {
  const sp = mergeViewIntoSearch(window.location.search, "policies");
  sp.set("policy_id", policyId);
  sp.set(POLICY_WORKSPACE_PARAM, "dossier");
  sp.delete(POLICY_EVIDENCE_TIMELINE_FOCUS_PARAM);
  sp.delete(POLICY_EVIDENCE_DELTA_FOCUS_PARAM);
  sp.delete(POLICY_EXPLAINABILITY_FOCUS_PARAM);
  if (entryHint) {
    sp.set(POLICY_DOSSIER_ENTRY_PARAM, entryHint);
  } else {
    sp.delete(POLICY_DOSSIER_ENTRY_PARAM);
  }
  applyGlobalSearchQueryEcho(sp, echoSearchQuery);
  replaceUrlSearchParams(sp);
}

/** Navigate to Policies with `policy_id` and explainability workspace (`policy_explainability_workspace_v1`). */
export function navigateToPolicyExplainabilityWorkspace(
  policyId: string,
  echoSearchQuery?: string,
  focus?: PolicyExplainabilityFocus,
): void {
  const sp = mergeViewIntoSearch(window.location.search, "policies");
  sp.set("policy_id", policyId);
  sp.set(POLICY_WORKSPACE_PARAM, "explainability");
  sp.delete(POLICY_DOSSIER_ENTRY_PARAM);
  sp.delete(POLICY_EVIDENCE_TIMELINE_FOCUS_PARAM);
  sp.delete(POLICY_EVIDENCE_DELTA_FOCUS_PARAM);
  if (focus) {
    sp.set(POLICY_EXPLAINABILITY_FOCUS_PARAM, focus);
  } else {
    sp.delete(POLICY_EXPLAINABILITY_FOCUS_PARAM);
  }
  applyGlobalSearchQueryEcho(sp, echoSearchQuery);
  replaceUrlSearchParams(sp);
}

/** Returns `policy_dossier_entry` when it matches a known client-only hint; otherwise `null`. */
export function readPolicyDossierEntryFromSearch(search: string): string | null {
  const raw = new URLSearchParams(search).get(POLICY_DOSSIER_ENTRY_PARAM);
  if (!raw || !KNOWN_POLICY_DOSSIER_ENTRY_VALUES.has(raw)) {
    return null;
  }
  return raw;
}

/** Leave dossier workspace; keep `policy_id` and other bounded params. */
export function navigateToPoliciesStandardPanels(): void {
  const sp = new URLSearchParams(window.location.search);
  sp.delete(POLICY_WORKSPACE_PARAM);
  sp.delete(POLICY_DOSSIER_ENTRY_PARAM);
  sp.delete(POLICY_EXPLAINABILITY_FOCUS_PARAM);
  replaceUrlSearchParams(sp);
}
