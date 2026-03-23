import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";

/** When `dossier`, Policies shows the composed policy dossier workspace (`policy_dossier_v1`). */
export const POLICY_WORKSPACE_PARAM = "policy_workspace";

export function readPolicyWorkspaceFromSearch(search: string): "standard" | "dossier" {
  return new URLSearchParams(search).get(POLICY_WORKSPACE_PARAM) === "dossier" ? "dossier" : "standard";
}

export function readPolicyWorkspaceFromUrl(): "standard" | "dossier" {
  if (typeof window === "undefined") {
    return "standard";
  }
  return readPolicyWorkspaceFromSearch(window.location.search);
}

/** Navigate to Policies with `policy_id` and dossier workspace (read-only composed briefing). */
export function navigateToPolicyDossierWorkspace(policyId: string, entryHint?: string): void {
  const sp = mergeViewIntoSearch(window.location.search, "policies");
  sp.set("policy_id", policyId);
  sp.set(POLICY_WORKSPACE_PARAM, "dossier");
  if (entryHint) {
    sp.set("policy_dossier_entry", entryHint);
  } else {
    sp.delete("policy_dossier_entry");
  }
  replaceUrlSearchParams(sp);
}

/** Leave dossier workspace; keep `policy_id` and other bounded params. */
export function navigateToPoliciesStandardPanels(): void {
  const sp = new URLSearchParams(window.location.search);
  sp.delete(POLICY_WORKSPACE_PARAM);
  replaceUrlSearchParams(sp);
}
