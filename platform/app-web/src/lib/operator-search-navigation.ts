import type { OperatorSearchPivotTarget } from "../api/contracts";
import { mergeViewIntoSearch, navigateToEvidenceView, replaceUrlSearchParams } from "./url-app-state";
import { navigateToPolicyDossierWorkspace } from "./policy-dossier-navigation";
import { navigateToTopologyDossier } from "./topology-dossier-navigation";
import { READINESS_CAPABILITY_FEATURE_PARAM } from "./readiness-navigation";

/** Primary action label for a search hit (read-only navigation). */
export function describeOperatorSearchAction(objectKind: string): string {
  switch (objectKind) {
    case "policy":
      return "Open policy dossier";
    case "topology_node":
    case "topology_link":
      return "Open topology dossier";
    case "device":
      return "Open device";
    case "capability":
      return "Open capability";
    default:
      return "Open";
  }
}

export function familyLabel(family: string): string {
  switch (family) {
    case "policies":
      return "Policies";
    case "topology_nodes":
      return "Topology nodes";
    case "topology_links":
      return "Topology links";
    case "devices":
      return "Devices";
    case "capabilities":
      return "Capabilities";
    default:
      return family;
  }
}

/**
 * Navigate to the recommended dossier/detail surface for a pivot from operator search.
 */
export function navigateFromOperatorSearchPivot(pivot: OperatorSearchPivotTarget): void {
  switch (pivot.view) {
    case "policies":
      if (pivot.policy_id) {
        navigateToPolicyDossierWorkspace(pivot.policy_id, "global_search");
      }
      return;
    case "topology":
      if (pivot.topology_object && pivot.topology_object_kind) {
        navigateToTopologyDossier(pivot.topology_object, pivot.topology_object_kind, "global_search");
      }
      return;
    case "devices":
      if (pivot.device_id) {
        const sp = mergeViewIntoSearch(window.location.search, "devices");
        sp.set("device_id", pivot.device_id);
        replaceUrlSearchParams(sp);
      }
      return;
    case "capabilities": {
      const sp = mergeViewIntoSearch(window.location.search, "capabilities");
      if (pivot.readiness_capability_feature) {
        sp.set(READINESS_CAPABILITY_FEATURE_PARAM, pivot.readiness_capability_feature);
      } else {
        sp.delete(READINESS_CAPABILITY_FEATURE_PARAM);
      }
      replaceUrlSearchParams(sp);
      return;
    }
    default:
      navigateToEvidenceView(pivot.view);
  }
}
