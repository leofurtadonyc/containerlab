import { describe, expect, it } from "vitest";

import { PLATFORM_NAV_VIEW_IDS } from "../src/nav-views";
import {
  applyDegradedPolicyV1PostureToSearchParams,
  mergeViewIntoSearch,
  readDegradedPolicyV1PostureFromSearch,
  readViewIdFromSearch,
} from "../src/lib/url-app-state";
import {
  CHANGE_SAFETY_CONTEXT_PARAM,
  CHANGE_SAFETY_POLICY_ID_PARAM,
  CHANGE_SAFETY_SERVICE_ID_PARAM,
  readChangeSafetyCaseRouteFromSearch,
} from "../src/lib/change-safety-case-navigation";
import {
  IMPACT_POLICY_ID_PARAM,
  IMPACT_REPORT_CONTEXT_PARAM,
  IMPACT_SERVICE_ID_PARAM,
  readImpactReportRouteFromSearch,
} from "../src/lib/impact-report-navigation";
import {
  MAINTENANCE_LINK_ID_PARAM,
  MAINTENANCE_NODE_ID_PARAM,
  MAINTENANCE_OBJECT_ID_PARAM,
  MAINTENANCE_OBJECT_KIND_PARAM,
  MAINTENANCE_PREVIEW_CONTEXT_PARAM,
  readMaintenancePreviewSubjectFromSearch,
} from "../src/lib/maintenance-preview-navigation";
import {
  MAINTENANCE_WINDOW_SUBJECT_PARAM,
  readMaintenanceWindowSubjectsFromSearch,
} from "../src/lib/maintenance-window-workspace-navigation";
import {
  POLICY_DOSSIER_ENTRY_PARAM,
  POLICY_EXPLAINABILITY_FOCUS_PARAM,
  POLICY_WORKSPACE_PARAM,
  readPolicyDossierEntryFromSearch,
  readPolicyExplainabilityFocusFromSearch,
  readPolicyWorkspaceFromSearch,
} from "../src/lib/policy-dossier-navigation";
import {
  POLICY_EVIDENCE_DELTA_FOCUS_PARAM,
  POLICY_EVIDENCE_TIMELINE_FOCUS_PARAM,
} from "../src/lib/topology-policy-navigation";
import { readSyncRunsLimitFromSearch } from "../src/lib/investigation-navigation";
import {
  FAILURE_IMPACT_ENTRY_PARAM,
  INV_FROM_PARAM,
  RISK_SUMMARY_ENTRY_PARAM,
} from "../src/lib/investigation-url-context";
import { GLOBAL_SEARCH_QUERY_PARAM } from "../src/lib/global-search-deeplink";
import {
  READINESS_BLOCKER_PARAM,
  READINESS_CAPABILITY_FEATURE_PARAM,
  READINESS_PREREQUISITE_PARAM,
} from "../src/lib/readiness-navigation";
import { OVERVIEW_MODE_PARAM, readOverviewModeFromSearch } from "../src/lib/overview-mode";
import { readWorkflowLifecycleIdFromSearch } from "../src/features/workflow-lifecycle/api";

const EXPECTED_ROUTE_DESTINATIONS = {
  overview: "Home",
  "platform-health": "Home / Platform Status",
  investigation: "Evidence / Investigation",
  "situation-room": "Evidence / Situation",
  "operator-briefing": "Evidence / Briefing",
  "delta-digest": "Evidence / Delta Digest",
  "evidence-consistency": "Evidence / Consistency",
  "evidence-quality-workspace": "Evidence Quality",
  "stability-workspace": "Evidence / Stability",
  devices: "Network / Devices",
  topology: "Network / Topology and Topology Object",
  "path-explorer": "Policy Path or Path Explorer",
  policies: "Policy inventory and object page",
  "service-explorer": "Service inventory/detail",
  "service-dossier": "Service dossier tab",
  "service-impact-workspace": "Service impact tab",
  "maintenance-preview": "Maintenance preview tab",
  "maintenance-evidence-workspace": "Maintenance evidence tab",
  "maintenance-window-workspace": "Maintenance window subject set",
  "impact-report": "Impact Report",
  "change-safety-case": "Change Safety Case",
  "workflow-lifecycle": "Workflow lifecycle records",
  "preview-workspace": "Preview records",
  "validation-workspace": "Validation records",
  "safe-action-workspace": "Safe Action workflow",
  "rollback-workspace": "Rollback workflow",
  workflows: "Governance / Sync-derived workflow history",
  audit: "Governance / Audit history",
  capabilities: "Governance / Capabilities",
  readiness: "Governance / Readiness",
  "evidence-replay": "Evidence / Frozen replay",
} as const;

const EXPECTED_PARAM_OWNERS = {
  view: "Shell",
  [OVERVIEW_MODE_PARAM]: "Overview",
  limit: "Read-side",
  history_recent_limit: "Read-side",
  degraded_policy_v1_posture: "Policy",
  policy_id: "Policy",
  [POLICY_WORKSPACE_PARAM]: "Policy",
  [POLICY_DOSSIER_ENTRY_PARAM]: "Policy",
  [POLICY_EXPLAINABILITY_FOCUS_PARAM]: "Policy",
  [POLICY_EVIDENCE_TIMELINE_FOCUS_PARAM]: "Policy",
  [POLICY_EVIDENCE_DELTA_FOCUS_PARAM]: "Policy",
  topology_object: "Topology",
  topology_object_kind: "Topology",
  topology_workspace: "Topology",
  dossier_source: "Topology",
  path_explorer_policy_id: "Path Explorer",
  service_id: "Service",
  service_impact_workspace_service_id: "Service",
  [MAINTENANCE_NODE_ID_PARAM]: "Maintenance",
  [MAINTENANCE_LINK_ID_PARAM]: "Maintenance",
  [MAINTENANCE_OBJECT_ID_PARAM]: "Maintenance",
  [MAINTENANCE_OBJECT_KIND_PARAM]: "Maintenance",
  [MAINTENANCE_PREVIEW_CONTEXT_PARAM]: "Maintenance",
  [MAINTENANCE_WINDOW_SUBJECT_PARAM]: "Maintenance Window",
  [IMPACT_REPORT_CONTEXT_PARAM]: "Impact Report",
  [IMPACT_SERVICE_ID_PARAM]: "Impact Report",
  [IMPACT_POLICY_ID_PARAM]: "Impact Report",
  [CHANGE_SAFETY_CONTEXT_PARAM]: "Change Safety Case",
  [CHANGE_SAFETY_POLICY_ID_PARAM]: "Change Safety Case",
  [CHANGE_SAFETY_SERVICE_ID_PARAM]: "Change Safety Case",
  sync_runs_limit: "Evidence",
  [INV_FROM_PARAM]: "Investigation",
  [FAILURE_IMPACT_ENTRY_PARAM]: "Investigation",
  [RISK_SUMMARY_ENTRY_PARAM]: "Investigation",
  [GLOBAL_SEARCH_QUERY_PARAM]: "Global Search",
  [READINESS_BLOCKER_PARAM]: "Readiness",
  [READINESS_PREREQUISITE_PARAM]: "Readiness",
  [READINESS_CAPABILITY_FEATURE_PARAM]: "Readiness",
  workflow_lifecycle_id: "Workflow Lifecycle",
} as const;

describe("Phase 1 route id parity", () => {
  it("keeps the current nav-view ids aligned with the Phase 1 route inventory", () => {
    expect([...PLATFORM_NAV_VIEW_IDS].sort()).toEqual(Object.keys(EXPECTED_ROUTE_DESTINATIONS).sort());
  });

  it("accepts every current view id and rejects unknown or absent view values", () => {
    for (const viewId of Object.keys(EXPECTED_ROUTE_DESTINATIONS)) {
      expect(readViewIdFromSearch(`?view=${viewId}`, PLATFORM_NAV_VIEW_IDS)).toBe(viewId);
    }

    expect(readViewIdFromSearch("", PLATFORM_NAV_VIEW_IDS)).toBeNull();
    expect(readViewIdFromSearch("?view=not-a-view", PLATFORM_NAV_VIEW_IDS)).toBeNull();
  });

  it("preserves context params when switching views through mergeViewIntoSearch", () => {
    const sp = mergeViewIntoSearch("?policy_id=p1&global_search_q=PE1", "policies");
    expect(sp.get("view")).toBe("policies");
    expect(sp.get("policy_id")).toBe("p1");
    expect(sp.get(GLOBAL_SEARCH_QUERY_PARAM)).toBe("PE1");
  });

  it("documents every Phase 1 query param owner", () => {
    expect(Object.keys(EXPECTED_PARAM_OWNERS).sort()).toMatchInlineSnapshot(`
      [
        "change_safety_context",
        "csc_policy_id",
        "csc_service_id",
        "degraded_policy_v1_posture",
        "dossier_source",
        "failure_impact_entry",
        "global_search_q",
        "history_recent_limit",
        "impact_policy_id",
        "impact_report_context",
        "impact_service_id",
        "inv_from",
        "limit",
        "maintenance_link_id",
        "maintenance_node_id",
        "maintenance_object_id",
        "maintenance_object_kind",
        "maintenance_preview_context",
        "mww_subject",
        "overview_mode",
        "path_explorer_policy_id",
        "policy_dossier_entry",
        "policy_evidence_delta_focus",
        "policy_evidence_timeline_focus",
        "policy_explainability_focus",
        "policy_id",
        "policy_workspace",
        "readiness_blocker",
        "readiness_capability_feature",
        "readiness_prerequisite",
        "risk_summary_entry",
        "service_id",
        "service_impact_workspace_service_id",
        "sync_runs_limit",
        "topology_object",
        "topology_object_kind",
        "topology_workspace",
        "view",
        "workflow_lifecycle_id",
      ]
    `);
  });
});

describe("Phase 1 route param parser parity", () => {
  it("parses policy workspace, dossier entry, explainability focus, and degraded filter params", () => {
    const search =
      "?view=policies&policy_id=p1&policy_workspace=dossier&policy_dossier_entry=global_search&policy_explainability_focus=caveats&degraded_policy_v1_posture=degraded";
    expect(readPolicyWorkspaceFromSearch(search)).toBe("dossier");
    expect(readPolicyDossierEntryFromSearch(search)).toBe("global_search");
    expect(readPolicyExplainabilityFocusFromSearch(search)).toBe("caveats");
    expect(readDegradedPolicyV1PostureFromSearch(search)).toBe("degraded");

    const sp = new URLSearchParams("?view=policies");
    applyDegradedPolicyV1PostureToSearchParams(sp, "unknown");
    expect(sp.get("degraded_policy_v1_posture")).toBe("unknown");
  });

  it("parses maintenance single-subject and multi-subject params", () => {
    expect(
      readMaintenancePreviewSubjectFromSearch(
        "?maintenance_object_id=PE1&maintenance_object_kind=node&maintenance_preview_context=topology_drilldown",
      ),
    ).toEqual({ kind: "explicit", objectId: "PE1", objectKind: "node", previewContext: "topology_drilldown" });

    expect(
      readMaintenanceWindowSubjectsFromSearch(
        "?mww_subject=link:P1--PE1&mww_subject=node:PE1&mww_subject=node:PE1&maintenance_preview_context=planning_window&sync_runs_limit=500",
      ),
    ).toEqual({
      kind: "ready",
      subjects: [
        { objectKind: "link", objectId: "P1--PE1" },
        { objectKind: "node", objectId: "PE1" },
      ],
      previewContext: "planning_window",
      syncRunsLimit: 100,
    });
  });

  it("parses report and change-safety-case route contexts", () => {
    expect(
      readImpactReportRouteFromSearch("?impact_report_context=service_impact&impact_service_id=svc:1"),
    ).toEqual({ kind: "service_impact", serviceId: "svc:1" });

    expect(
      readChangeSafetyCaseRouteFromSearch("?change_safety_context=policy_change_safety&csc_policy_id=p1"),
    ).toEqual({ kind: "policy_change_safety", policyId: "p1" });
  });

  it("bounds evidence sync windows and preserves workflow selection params", () => {
    expect(readSyncRunsLimitFromSearch("?sync_runs_limit=500")).toBe(100);
    expect(readSyncRunsLimitFromSearch("?sync_runs_limit=0")).toBe(1);
    expect(readSyncRunsLimitFromSearch("?sync_runs_limit=not-a-number", 33)).toBe(33);
    expect(readWorkflowLifecycleIdFromSearch("?workflow_lifecycle_id=wf-1")).toBe("wf-1");
  });

  it("keeps reset-context semantics explicit: only view survives", () => {
    const activeView = "policies";
    const reset = new URLSearchParams();
    reset.set("view", activeView);
    expect(reset.toString()).toBe("view=policies");
  });

  it("parses overview mode while preserving unknown values as standard mode", () => {
    expect(readOverviewModeFromSearch("?overview_mode=cockpit")).toBe("cockpit");
    expect(readOverviewModeFromSearch("?overview_mode=unknown")).toBe("standard");
  });
});
