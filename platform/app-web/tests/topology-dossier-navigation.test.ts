import { afterEach, describe, expect, it, vi } from "vitest";

import * as urlAppState from "../src/lib/url-app-state";
import {
  DOSSIER_SOURCE_PARAM,
  TOPOLOGY_WORKSPACE_PARAM,
  navigateToTopologyDossier,
  readDossierSourceFromSearch,
} from "../src/lib/topology-dossier-navigation";

describe("topology dossier navigation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("readDossierSourceFromSearch returns known sources only", () => {
    expect(readDossierSourceFromSearch("?dossier_source=failure_impact")).toBe("failure_impact");
    expect(readDossierSourceFromSearch("?dossier_source=overview_risk")).toBe("overview_risk");
    expect(readDossierSourceFromSearch("?dossier_source=risk_summary")).toBe("risk_summary");
    expect(readDossierSourceFromSearch("?dossier_source=topology_table")).toBe("topology_table");
    expect(readDossierSourceFromSearch("?dossier_source=delta_digest_workspace")).toBe("delta_digest_workspace");
    expect(readDossierSourceFromSearch("?dossier_source=evidence_replay_viewer")).toBe("evidence_replay_viewer");
    expect(readDossierSourceFromSearch("?dossier_source=maintenance_evidence_workspace")).toBe(
      "maintenance_evidence_workspace",
    );
    expect(readDossierSourceFromSearch("?dossier_source=invalid")).toBeNull();
    expect(readDossierSourceFromSearch("")).toBeNull();
  });

  it("navigateToTopologyDossier sets topology view, workspace, object, and dossier_source", () => {
    const spy = vi.spyOn(urlAppState, "replaceUrlSearchParams").mockImplementation(() => {});
    const prev = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...prev, search: "?view=devices&keep=1" },
      writable: true,
    });

    navigateToTopologyDossier("PE1", "node", "risk_summary");

    expect(spy).toHaveBeenCalledTimes(1);
    const sp = spy.mock.calls[0][0] as URLSearchParams;
    expect(sp.get("view")).toBe("topology");
    expect(sp.get("keep")).toBe("1");
    expect(sp.get("topology_object")).toBe("PE1");
    expect(sp.get("topology_object_kind")).toBe("node");
    expect(sp.get(TOPOLOGY_WORKSPACE_PARAM)).toBe("dossier");
    expect(sp.get(DOSSIER_SOURCE_PARAM)).toBe("risk_summary");

    Object.defineProperty(window, "location", { configurable: true, value: prev });
  });
});
