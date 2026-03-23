import type { OperatorSearchHit, OperatorSearchPivotTarget } from "../api/contracts";
import { applyGlobalSearchQueryEcho } from "./global-search-deeplink";
import { navigateToInvestigationView } from "./investigation-navigation";
import { navigateToPolicyDossierWorkspace } from "./policy-dossier-navigation";
import {
  READINESS_CAPABILITY_FEATURE_PARAM,
  navigateToReadinessContext,
} from "./readiness-navigation";
import { navigateToSituationRoomView } from "./situation-room-navigation";
import { navigateToTopologyDossier } from "./topology-dossier-navigation";
import { mergeViewIntoSearch, navigateToEvidenceView, replaceUrlSearchParams } from "./url-app-state";

export interface OperatorSearchNavigateOptions {
  /** Effective query echo (`global_search_q`) for shareable deep links. */
  echoSearchQuery?: string;
}

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
export function navigateFromOperatorSearchPivot(
  pivot: OperatorSearchPivotTarget,
  options?: OperatorSearchNavigateOptions,
): void {
  const echo = options?.echoSearchQuery;
  switch (pivot.view) {
    case "policies":
      if (pivot.policy_id) {
        navigateToPolicyDossierWorkspace(pivot.policy_id, "global_search", echo);
      }
      return;
    case "topology":
      if (pivot.topology_object && pivot.topology_object_kind) {
        navigateToTopologyDossier(
          pivot.topology_object,
          pivot.topology_object_kind,
          "global_search",
          echo,
        );
      }
      return;
    case "devices":
      if (pivot.device_id) {
        const sp = mergeViewIntoSearch(window.location.search, "devices");
        sp.set("device_id", pivot.device_id);
        applyGlobalSearchQueryEcho(sp, echo);
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
      applyGlobalSearchQueryEcho(sp, echo);
      replaceUrlSearchParams(sp);
      return;
    }
    default:
      navigateToEvidenceView(pivot.view);
  }
}

/**
 * Open Investigation with the same bounded object context as the hit, and `inv_from=global_search`.
 */
export function navigateToInvestigationFromOperatorSearchHit(
  hit: OperatorSearchHit,
  echoSearchQuery: string,
): void {
  const p = hit.pivot;
  navigateToInvestigationView(20, {
    invFrom: "global_search",
    echoSearchQuery,
    policyId: p.view === "policies" && p.policy_id ? p.policy_id : undefined,
    deviceId: p.view === "devices" && p.device_id ? p.device_id : undefined,
    topologyObject:
      p.view === "topology" && p.topology_object && p.topology_object_kind
        ? { id: p.topology_object, kind: p.topology_object_kind }
        : undefined,
  });
}

/** Readiness view with capability feature scroll hint (planning-support; same param as capabilities). */
export function navigateToReadinessFromOperatorCapabilityHit(
  feature: string,
  echoSearchQuery: string,
): void {
  navigateToReadinessContext({
    capabilityFeature: feature,
    echoSearchQuery,
  });
}

/** Situation room (evidence pack) preserving search echo. */
export function navigateToSituationRoomFromGlobalSearch(echoSearchQuery: string): void {
  navigateToSituationRoomView(20, echoSearchQuery);
}

export function supportsInvestigationShortcut(objectKind: string): boolean {
  return objectKind === "policy" || objectKind === "device" || objectKind === "topology_node" || objectKind === "topology_link";
}
