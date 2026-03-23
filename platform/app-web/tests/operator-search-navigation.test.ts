import { afterEach, describe, expect, it, vi } from "vitest";

import * as policyNav from "../src/lib/policy-dossier-navigation";
import * as topologyNav from "../src/lib/topology-dossier-navigation";
import * as urlAppState from "../src/lib/url-app-state";
import {
  describeOperatorSearchAction,
  familyLabel,
  navigateFromOperatorSearchPivot,
} from "../src/lib/operator-search-navigation";
import { READINESS_CAPABILITY_FEATURE_PARAM } from "../src/lib/readiness-navigation";

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

  it("navigateFromOperatorSearchPivot opens policy dossier from global search", () => {
    const spy = vi.spyOn(policyNav, "navigateToPolicyDossierWorkspace").mockImplementation(() => {});
    navigateFromOperatorSearchPivot({
      view: "policies",
      policy_id: "PE1:static_local:1:100",
    });
    expect(spy).toHaveBeenCalledWith("PE1:static_local:1:100", "global_search");
  });

  it("navigateFromOperatorSearchPivot opens topology dossier from global search", () => {
    const spy = vi.spyOn(topologyNav, "navigateToTopologyDossier").mockImplementation(() => {});
    navigateFromOperatorSearchPivot({
      view: "topology",
      topology_object: "P1--PE1",
      topology_object_kind: "link",
    });
    expect(spy).toHaveBeenCalledWith("P1--PE1", "link", "global_search");
  });

  it("navigateFromOperatorSearchPivot sets devices view and device_id", () => {
    const spy = vi.spyOn(urlAppState, "replaceUrlSearchParams").mockImplementation(() => {});
    const prev = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...prev, search: "?view=overview" },
      writable: true,
    });
    navigateFromOperatorSearchPivot({
      view: "devices",
      device_id: "PE1",
    });
    const sp = spy.mock.calls[0][0] as URLSearchParams;
    expect(sp.get("view")).toBe("devices");
    expect(sp.get("device_id")).toBe("PE1");
    Object.defineProperty(window, "location", { configurable: true, value: prev });
  });

  it("navigateFromOperatorSearchPivot sets capabilities view and feature hint", () => {
    const spy = vi.spyOn(urlAppState, "replaceUrlSearchParams").mockImplementation(() => {});
    const prev = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...prev, search: "?view=overview" },
      writable: true,
    });
    navigateFromOperatorSearchPivot({
      view: "capabilities",
      readiness_capability_feature: "device_inventory",
    });
    const sp = spy.mock.calls[0][0] as URLSearchParams;
    expect(sp.get("view")).toBe("capabilities");
    expect(sp.get(READINESS_CAPABILITY_FEATURE_PARAM)).toBe("device_inventory");
    Object.defineProperty(window, "location", { configurable: true, value: prev });
  });

  it("navigateFromOperatorSearchPivot falls back to navigateToEvidenceView for other views", () => {
    const spy = vi.spyOn(urlAppState, "navigateToEvidenceView").mockImplementation(() => {});
    navigateFromOperatorSearchPivot({ view: "investigation" });
    expect(spy).toHaveBeenCalledWith("investigation");
  });
});
