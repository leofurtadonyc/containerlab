import { afterEach, describe, expect, it, vi } from "vitest";

import type { OperatorSearchHit } from "../src/api/contracts";
import * as policyNav from "../src/lib/policy-dossier-navigation";
import * as topologyNav from "../src/lib/topology-dossier-navigation";
import * as urlAppState from "../src/lib/url-app-state";
import * as investigationNav from "../src/lib/investigation-navigation";
import * as situationNav from "../src/lib/situation-room-navigation";
import * as readinessNav from "../src/lib/readiness-navigation";
import * as obNav from "../src/lib/operator-briefing-navigation";
import {
  describeOperatorSearchAction,
  familyLabel,
  navigateFromOperatorSearchPivot,
  navigateToInvestigationFromOperatorSearchHit,
  navigateToOperatorBriefingFromGlobalSearch,
  navigateToReadinessFromOperatorCapabilityHit,
  navigateToSituationRoomFromGlobalSearch,
} from "../src/lib/operator-search-navigation";
import { READINESS_CAPABILITY_FEATURE_PARAM } from "../src/lib/readiness-navigation";
import { GLOBAL_SEARCH_QUERY_PARAM } from "../src/lib/global-search-deeplink";

describe("operator search navigation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("describeOperatorSearchAction returns dossier labels for known kinds", () => {
    expect(describeOperatorSearchAction("policy")).toBe("Open policy dossier");
    expect(describeOperatorSearchAction("topology_node")).toBe("Open topology dossier");
    expect(describeOperatorSearchAction("device")).toBe("Open device");
    expect(describeOperatorSearchAction("capability")).toBe("Open capability");
  });

  it("familyLabel maps API family keys to headings", () => {
    expect(familyLabel("policies")).toBe("Policies");
    expect(familyLabel("topology_nodes")).toBe("Topology nodes");
    expect(familyLabel("unknown")).toBe("unknown");
  });

  it("navigateFromOperatorSearchPivot opens policy dossier with global_search_q echo", () => {
    const spy = vi.spyOn(policyNav, "navigateToPolicyDossierWorkspace").mockImplementation(() => {});
    navigateFromOperatorSearchPivot(
      { view: "policies", policy_id: "PE1:static_local:1:100" },
      { echoSearchQuery: "PE1 static" },
    );
    expect(spy).toHaveBeenCalledWith("PE1:static_local:1:100", "global_search", "PE1 static");
  });

  it("navigateFromOperatorSearchPivot opens topology dossier with echo", () => {
    const spy = vi.spyOn(topologyNav, "navigateToTopologyDossier").mockImplementation(() => {});
    navigateFromOperatorSearchPivot(
      { view: "topology", topology_object: "P1--PE1", topology_object_kind: "link" },
      { echoSearchQuery: "P1" },
    );
    expect(spy).toHaveBeenCalledWith("P1--PE1", "link", "global_search", "P1");
  });

  it("navigateFromOperatorSearchPivot sets devices view, device_id, and global_search_q", () => {
    const spy = vi.spyOn(urlAppState, "replaceUrlSearchParams").mockImplementation(() => {});
    const prev = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...prev, search: "?view=overview" },
      writable: true,
    });
    navigateFromOperatorSearchPivot(
      { view: "devices", device_id: "PE1" },
      { echoSearchQuery: "PE1" },
    );
    const sp = spy.mock.calls[0][0] as URLSearchParams;
    expect(sp.get("view")).toBe("devices");
    expect(sp.get("device_id")).toBe("PE1");
    expect(sp.get(GLOBAL_SEARCH_QUERY_PARAM)).toBe("PE1");
    Object.defineProperty(window, "location", { configurable: true, value: prev });
  });

  it("navigateFromOperatorSearchPivot sets capabilities view, readiness_capability_feature, and echo", () => {
    const spy = vi.spyOn(urlAppState, "replaceUrlSearchParams").mockImplementation(() => {});
    const prev = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...prev, search: "?view=overview" },
      writable: true,
    });
    navigateFromOperatorSearchPivot(
      { view: "capabilities", readiness_capability_feature: "device_inventory" },
      { echoSearchQuery: "inventory" },
    );
    const sp = spy.mock.calls[0][0] as URLSearchParams;
    expect(sp.get("view")).toBe("capabilities");
    expect(sp.get(READINESS_CAPABILITY_FEATURE_PARAM)).toBe("device_inventory");
    expect(sp.get(GLOBAL_SEARCH_QUERY_PARAM)).toBe("inventory");
    Object.defineProperty(window, "location", { configurable: true, value: prev });
  });

  it("navigateFromOperatorSearchPivot falls back to navigateToEvidenceView for other views", () => {
    const spy = vi.spyOn(urlAppState, "navigateToEvidenceView").mockImplementation(() => {});
    navigateFromOperatorSearchPivot({ view: "workflows" });
    expect(spy).toHaveBeenCalledWith("workflows");
  });

  it("navigateToInvestigationFromOperatorSearchHit passes global_search context and echo", () => {
    const spy = vi.spyOn(investigationNav, "navigateToInvestigationView").mockImplementation(() => {});
    const hit: OperatorSearchHit = {
      object_kind: "policy",
      primary_id: "p1",
      title: "t",
      ranking_basis: "exact_id",
      match_reason: "m",
      pivot: { view: "policies", policy_id: "p1" },
    };
    navigateToInvestigationFromOperatorSearchHit(hit, "my query");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toBe(20);
    expect(spy.mock.calls[0][1]).toMatchObject({
      invFrom: "global_search",
      echoSearchQuery: "my query",
      policyId: "p1",
    });
  });

  it("navigateToReadinessFromOperatorCapabilityHit delegates to navigateToReadinessContext", () => {
    const spy = vi.spyOn(readinessNav, "navigateToReadinessContext").mockImplementation(() => {});
    navigateToReadinessFromOperatorCapabilityHit("device_inventory", "inv");
    expect(spy).toHaveBeenCalledWith({
      capabilityFeature: "device_inventory",
      echoSearchQuery: "inv",
    });
  });

  it("navigateToSituationRoomFromGlobalSearch passes echo to situation room navigation", () => {
    const spy = vi.spyOn(situationNav, "navigateToSituationRoomView").mockImplementation(() => {});
    navigateToSituationRoomFromGlobalSearch("sitq");
    expect(spy).toHaveBeenCalledWith(20, "sitq");
  });

  it("navigateToOperatorBriefingFromGlobalSearch opens hub with echo and clearPinnedScope", () => {
    const spy = vi.spyOn(obNav, "navigateToOperatorBriefingView").mockImplementation(() => {});
    navigateToOperatorBriefingFromGlobalSearch("q1");
    expect(spy).toHaveBeenCalledWith(20, {
      invFrom: "global_search",
      echoSearchQuery: "q1",
      clearPinnedScope: true,
    });
  });

  it("navigateToOperatorBriefingFromGlobalSearch passes scoped policy without clearPinnedScope", () => {
    const spy = vi.spyOn(obNav, "navigateToOperatorBriefingView").mockImplementation(() => {});
    navigateToOperatorBriefingFromGlobalSearch("q2", { policyId: "P1" });
    expect(spy).toHaveBeenCalledWith(20, {
      invFrom: "global_search",
      echoSearchQuery: "q2",
      clearPinnedScope: false,
      policyId: "P1",
    });
  });
});
