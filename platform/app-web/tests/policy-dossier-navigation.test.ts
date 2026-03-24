import { afterEach, describe, expect, it, vi } from "vitest";

import * as urlAppState from "../src/lib/url-app-state";
import {
  POLICY_DOSSIER_ENTRY_PARAM,
  POLICY_WORKSPACE_PARAM,
  navigateToPolicyDossierWorkspace,
  navigateToPolicyExplainabilityWorkspace,
  readPolicyDossierEntryFromSearch,
  readPolicyWorkspaceFromSearch,
} from "../src/lib/policy-dossier-navigation";
import {
  POLICY_EVIDENCE_DELTA_FOCUS_PARAM,
  POLICY_EVIDENCE_TIMELINE_FOCUS_PARAM,
} from "../src/lib/topology-policy-navigation";

describe("policy dossier navigation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("readPolicyWorkspaceFromSearch returns standard, dossier, or explainability", () => {
    expect(readPolicyWorkspaceFromSearch("")).toBe("standard");
    expect(readPolicyWorkspaceFromSearch(`?${POLICY_WORKSPACE_PARAM}=dossier`)).toBe("dossier");
    expect(readPolicyWorkspaceFromSearch(`?${POLICY_WORKSPACE_PARAM}=explainability`)).toBe("explainability");
  });

  it("readPolicyDossierEntryFromSearch returns known hints only", () => {
    expect(readPolicyDossierEntryFromSearch("?policy_dossier_entry=policy_table")).toBe("policy_table");
    expect(readPolicyDossierEntryFromSearch("?policy_dossier_entry=workflow_history_drilldown")).toBe(
      "workflow_history_drilldown",
    );
    expect(readPolicyDossierEntryFromSearch("?policy_dossier_entry=delta_digest_workspace")).toBe(
      "delta_digest_workspace",
    );
    expect(readPolicyDossierEntryFromSearch("?policy_dossier_entry=evidence_replay_viewer")).toBe(
      "evidence_replay_viewer",
    );
    expect(readPolicyDossierEntryFromSearch("?policy_dossier_entry=invalid")).toBeNull();
    expect(readPolicyDossierEntryFromSearch("")).toBeNull();
  });

  it("navigateToPolicyDossierWorkspace sets policies view, workspace, policy_id, entry, and clears focus hints", () => {
    const spy = vi.spyOn(urlAppState, "replaceUrlSearchParams").mockImplementation(() => {});
    const prev = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...prev,
        search: `?view=devices&keep=1&${POLICY_EVIDENCE_TIMELINE_FOCUS_PARAM}=v1&${POLICY_EVIDENCE_DELTA_FOCUS_PARAM}=v1`,
      },
      writable: true,
    });

    navigateToPolicyDossierWorkspace("PE1:pol:1", "path_analysis_panel");

    expect(spy).toHaveBeenCalledTimes(1);
    const sp = spy.mock.calls[0][0] as URLSearchParams;
    expect(sp.get("view")).toBe("policies");
    expect(sp.get("keep")).toBe("1");
    expect(sp.get("policy_id")).toBe("PE1:pol:1");
    expect(sp.get(POLICY_WORKSPACE_PARAM)).toBe("dossier");
    expect(sp.get(POLICY_DOSSIER_ENTRY_PARAM)).toBe("path_analysis_panel");
    expect(sp.get(POLICY_EVIDENCE_TIMELINE_FOCUS_PARAM)).toBeNull();
    expect(sp.get(POLICY_EVIDENCE_DELTA_FOCUS_PARAM)).toBeNull();

    Object.defineProperty(window, "location", { configurable: true, value: prev });
  });

  it("navigateToPolicyExplainabilityWorkspace sets explainability workspace and clears dossier entry", () => {
    const spy = vi.spyOn(urlAppState, "replaceUrlSearchParams").mockImplementation(() => {});
    const prev = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...prev,
        search: `?view=policies&${POLICY_DOSSIER_ENTRY_PARAM}=policy_table`,
      },
      writable: true,
    });

    navigateToPolicyExplainabilityWorkspace("PE1:pol:2");

    expect(spy).toHaveBeenCalledTimes(1);
    const sp = spy.mock.calls[0][0] as URLSearchParams;
    expect(sp.get("policy_id")).toBe("PE1:pol:2");
    expect(sp.get(POLICY_WORKSPACE_PARAM)).toBe("explainability");
    expect(sp.get(POLICY_DOSSIER_ENTRY_PARAM)).toBeNull();

    Object.defineProperty(window, "location", { configurable: true, value: prev });
  });
});
