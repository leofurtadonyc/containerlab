import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiClient } from "../src/api/client";

const __dirname = dirname(fileURLToPath(import.meta.url));

type QueryValue = string | string[];

interface ApiParityCase {
  name: string;
  posture: "consumed" | "state-changing consumed" | "client-method hidden";
  risk: "normal" | "high" | "critical";
  responseContract: string;
  call: (client: ApiClient) => Promise<unknown>;
  expected: {
    method: "GET" | "POST";
    pathname: string;
    query?: Record<string, QueryValue>;
    body?: unknown;
  };
}

const workflowCreateBody = {
  workflow_type: "maintenance",
  title: "Window prep",
  description: "Bounded workflow",
  initial_status: "draft",
  target_scope: { policy_id: "p:a" },
  capability_decision: { supported: true },
  actor: "operator",
  provenance: "operator",
} satisfies Parameters<ApiClient["createWorkflowLifecycle"]>[0];

const workflowTransitionBody = {
  next_status: "ready",
  reason: "Evidence reviewed",
  actor: "operator",
  metadata: { source: "phase1" },
  provenance: "operator",
} satisfies Parameters<ApiClient["transitionWorkflowLifecycle"]>[1];

const previewCreateBody = {
  preview_type: "policy_update",
  target_kind: "policy",
  target_ids: ["p:a"],
  target_scope: { color: 100 },
  requested_action_type: "update_policy",
  requested_payload: { bandwidth: "1g" },
  workflow_id: "wf:1",
  idempotency_key: "idem-preview",
  actor_type: "operator",
  actor_id: "op",
  actor_display_name: "Operator",
  notes: "preview only",
} satisfies Parameters<ApiClient["createPreview"]>[0];

const validationCreateBody = {
  validation_type: "pre_change",
  validation_context: "pre_change",
  target_kind: "policy",
  target_ids: ["p:a"],
  target_scope: { color: 100 },
  requested_checkset: ["syntax"],
  workflow_id: "wf:1",
  preview_id: "prev:1",
  idempotency_key: "idem-validation",
  notes: "validate evidence",
  created_by_actor_type: "operator",
  created_by_actor_id: "op",
  created_by_actor_display_name: "Operator",
} satisfies Parameters<ApiClient["createValidation"]>[0];

const actionCreateBody = {
  workflow_id: "wf:1",
  preview_id: "prev:1",
  validation_id: "val:1",
  action_type: "apply_policy_change",
  target_kind: "policy",
  target_ids: ["p:a"],
  target_scope: { color: 100 },
  requested_payload: { policy: "candidate" },
  idempotency_key: "idem-action",
  description: "platform-side request",
  requested_by_actor_type: "operator",
  requested_by_actor_id: "op",
  requested_by_actor_display_name: "Operator",
} satisfies Parameters<ApiClient["createSafeAction"]>[0];

const approvalBody = {
  actor_id: "op",
  actor_display_name: "Operator",
  reason: "approved in lab",
  provenance: "operator",
} satisfies Parameters<ApiClient["approveSafeAction"]>[1];

const rejectionBody = {
  actor_id: "op",
  actor_display_name: "Operator",
  reason: "missing evidence",
  provenance: "operator",
} satisfies Parameters<ApiClient["rejectSafeAction"]>[1];

const executeBody = {
  actor_id: "op",
  provenance: "operator",
} satisfies Parameters<ApiClient["executeSafeAction"]>[1];

const cancelBody = {
  actor_id: "op",
  reason: "operator canceled",
} satisfies Parameters<ApiClient["cancelSafeAction"]>[1];

const rollbackCreateBody = {
  parent_action_id: "act:1",
  rollback_type: "compensating_change",
  target_kind: "policy",
  target_ids: ["p:a"],
  target_scope: { color: 100 },
  pre_rollback_validation_id: "val:2",
  idempotency_key: "idem-rollback",
  description: "compensation request",
  requested_by_actor_type: "operator",
  requested_by_actor_id: "op",
  requested_by_actor_display_name: "Operator",
} satisfies Parameters<ApiClient["createRollback"]>[0];

const CASES: ApiParityCase[] = [
  c("getPlatformStatus", "consumed", "normal", "PlatformStatusResponse", (client) => client.getPlatformStatus(), "GET", "/api/v1/platform/status"),
  c("getDevices", "consumed", "normal", "DevicesListResponse", (client) => client.getDevices({ limit: 7, history_recent_limit: 8 }), "GET", "/api/v1/devices", { limit: "7", history_recent_limit: "8" }),
  c("getTopology", "consumed", "normal", "TopologyResponse", (client) => client.getTopology(), "GET", "/api/v1/topology"),
  c("getTopologyTruth", "consumed", "high", "TopologyTruthResponse", (client) => client.getTopologyTruth({ truthPosture: "physical_confirmed" }), "GET", "/api/v1/topology/truth", { truth_posture: "physical_confirmed" }),
  c("getControllerEvidence", "consumed", "high", "ControllerEvidenceResponse", (client) => client.getControllerEvidence(), "GET", "/api/v1/controller/evidence"),
  c("getTopologyObjectRelatedPolicies", "consumed", "high", "TopologyObjectRelatedPoliciesResponse", (client) => client.getTopologyObjectRelatedPolicies("node:a:b"), "GET", "/api/v1/topology/objects/node%3Aa%3Ab/related-policies"),
  c("getTopologyObjectFailureImpact", "consumed", "high", "FailureImpactViewResponse", (client) => client.getTopologyObjectFailureImpact("node:a:b"), "GET", "/api/v1/topology/objects/node%3Aa%3Ab/failure-impact"),
  c("getMaintenancePreview", "consumed", "high", "MaintenancePreviewResponse", (client) => client.getMaintenancePreview({ objectId: "PE1", objectKind: "node", previewContext: "topology_drilldown" }), "GET", "/api/v1/maintenance-preview", { preview_context: "topology_drilldown", object_id: "PE1", object_kind: "node" }),
  c("getMaintenanceEvidenceWorkspace", "consumed", "high", "MaintenanceEvidenceWorkspaceResponse", (client) => client.getMaintenanceEvidenceWorkspace({ nodeId: "PE1", previewContext: "planning_window" }), "GET", "/api/v1/maintenance-evidence-workspace", { preview_context: "planning_window", node_id: "PE1" }),
  c("getMaintenanceWindowWorkspace", "consumed", "high", "MaintenanceWindowWorkspaceResponse", (client) => client.getMaintenanceWindowWorkspace({ subjects: [{ objectKind: "node", objectId: "PE1" }, { objectKind: "link", objectId: "P1--PE1" }], previewContext: "planning_window", syncRunsLimit: 20 }), "GET", "/api/v1/maintenance-window-workspace", { subject: ["link:P1--PE1", "node:PE1"], preview_context: "planning_window", sync_runs_limit: "20" }),
  c("getServiceImpactReport", "consumed", "high", "ImpactReportResponse", (client) => client.getServiceImpactReport("svc:a"), "GET", "/api/v1/reports/service-impact", { service_id: "svc:a" }),
  c("getPolicyImpactReport", "consumed", "high", "ImpactReportResponse", (client) => client.getPolicyImpactReport("p:a"), "GET", "/api/v1/reports/policy-impact", { policy_id: "p:a" }),
  c("getMaintenanceImpactReport", "consumed", "high", "ImpactReportResponse", (client) => client.getMaintenanceImpactReport({ linkId: "P1--PE1", previewContext: "planning_window" }), "GET", "/api/v1/reports/maintenance-impact", { preview_context: "planning_window", link_id: "P1--PE1" }),
  c("getPolicyChangeSafetyCase", "consumed", "high", "ChangeSafetyCaseResponse", (client) => client.getPolicyChangeSafetyCase("p:a"), "GET", "/api/v1/reports/change-safety-case/policy", { policy_id: "p:a" }),
  c("getServiceChangeSafetyCase", "consumed", "high", "ChangeSafetyCaseResponse", (client) => client.getServiceChangeSafetyCase("svc:a"), "GET", "/api/v1/reports/change-safety-case/service", { service_id: "svc:a" }),
  c("getTopologyChangeSafetyCase", "consumed", "high", "ChangeSafetyCaseResponse", (client) => client.getTopologyChangeSafetyCase({ objectId: "PE1", objectKind: "node", previewContext: "change_adjacent" }), "GET", "/api/v1/reports/change-safety-case/maintenance", { preview_context: "change_adjacent", object_id: "PE1", object_kind: "node" }),
  c("getTopologyRiskSummary", "consumed", "normal", "TopologyRiskSummaryResponse", (client) => client.getTopologyRiskSummary(), "GET", "/api/v1/topology/risk-summary"),
  c("getTopologyObjectDossier", "consumed", "high", "TopologyObjectDossierResponse", (client) => client.getTopologyObjectDossier("node:a:b"), "GET", "/api/v1/topology/objects/node%3Aa%3Ab/dossier"),
  c("getTopologyObjectEvidenceTimeline", "consumed", "high", "TopologyObjectEvidenceTimelineResponse", (client) => client.getTopologyObjectEvidenceTimeline("node:a:b"), "GET", "/api/v1/topology/objects/node%3Aa%3Ab/evidence-timeline"),
  c("getTopologyObjectEvidenceDelta", "consumed", "high", "TopologyObjectEvidenceDeltaResponse", (client) => client.getTopologyObjectEvidenceDelta("node:a:b"), "GET", "/api/v1/topology/objects/node%3Aa%3Ab/evidence-delta"),
  c("getPolicies", "consumed", "normal", "PoliciesListResponse", (client) => client.getPolicies({ limit: 9, history_recent_limit: 10 }), "GET", "/api/v1/policies", { limit: "9", history_recent_limit: "10" }),
  c("getServices", "consumed", "high", "ServicesListResponse", (client) => client.getServices(999), "GET", "/api/v1/services", { limit: "500" }),
  c("getService", "consumed", "high", "ServiceDetailResponse", (client) => client.getService("svc:a:b"), "GET", "/api/v1/services/svc%3Aa%3Ab"),
  c("getServiceDossier", "consumed", "high", "ServiceDossierResponse", (client) => client.getServiceDossier("svc:a:b"), "GET", "/api/v1/services/svc%3Aa%3Ab/dossier"),
  c("getServiceEvidenceTimeline", "consumed", "high", "ServiceEvidenceTimelineResponse", (client) => client.getServiceEvidenceTimeline("svc:a:b"), "GET", "/api/v1/services/svc%3Aa%3Ab/evidence-timeline"),
  c("getServiceEvidenceDelta", "consumed", "high", "ServiceEvidenceDeltaResponse", (client) => client.getServiceEvidenceDelta("svc:a:b"), "GET", "/api/v1/services/svc%3Aa%3Ab/evidence-delta"),
  c("getPolicyPathAnalysis", "consumed", "high", "PathAnalysisViewResponse", (client) => client.getPolicyPathAnalysis("p:a"), "GET", "/api/v1/policies/p%3Aa/path-analysis"),
  c("getPolicyTopologyImpact", "consumed", "high", "PolicyTopologyImpactResponse", (client) => client.getPolicyTopologyImpact("p:a"), "GET", "/api/v1/policies/p%3Aa/topology-impact"),
  c("getPolicyEvidenceTimeline", "consumed", "high", "PolicyEvidenceTimelineResponse", (client) => client.getPolicyEvidenceTimeline("p:a"), "GET", "/api/v1/policies/p%3Aa/evidence-timeline"),
  c("getPolicyEvidenceDelta", "consumed", "high", "PolicyEvidenceDeltaResponse", (client) => client.getPolicyEvidenceDelta("p:a"), "GET", "/api/v1/policies/p%3Aa/evidence-delta"),
  c("getPolicyDossier", "consumed", "high", "PolicyDossierResponse", (client) => client.getPolicyDossier("p:a"), "GET", "/api/v1/policies/p%3Aa/dossier"),
  c("getPolicyExplainability", "consumed", "high", "PolicyExplainabilityResponse", (client) => client.getPolicyExplainability("p:a"), "GET", "/api/v1/policies/p%3Aa/explainability"),
  c("getPathExplorerWorkspace", "consumed", "high", "PathExplorerWorkspaceResponse", (client) => client.getPathExplorerWorkspace("p:a"), "GET", "/api/v1/path-explorer", { policy_id: "p:a" }),
  c("getServiceImpactWorkspace", "consumed", "high", "ServiceImpactWorkspaceResponse", (client) => client.getServiceImpactWorkspace("svc:a"), "GET", "/api/v1/service-impact-workspace", { service_id: "svc:a" }),
  c("getWorkflowHistory", "consumed", "normal", "WorkflowHistoryResponse", (client) => client.getWorkflowHistory({ limit: 11, sync_runs_limit: 12 }), "GET", "/api/v1/workflow-history", { limit: "11", sync_runs_limit: "12" }),
  c("getWorkflowLifecycleList", "consumed", "normal", "WorkflowLifecycleListResponse", (client) => client.getWorkflowLifecycleList(500), "GET", "/api/v1/workflow-lifecycle", { limit: "100" }),
  c("getWorkflowLifecycleDetail", "consumed", "normal", "WorkflowLifecycleDetailResponse", (client) => client.getWorkflowLifecycleDetail("wf:a"), "GET", "/api/v1/workflow-lifecycle/wf%3Aa"),
  c("getWorkflowLifecycleTimeline", "consumed", "normal", "WorkflowLifecycleTimelineResponse", (client) => client.getWorkflowLifecycleTimeline("wf:a"), "GET", "/api/v1/workflow-lifecycle/wf%3Aa/timeline"),
  c("createWorkflowLifecycle", "state-changing consumed", "critical", "WorkflowLifecycleDetailResponse", (client) => client.createWorkflowLifecycle(workflowCreateBody), "POST", "/api/v1/workflow-lifecycle", undefined, workflowCreateBody),
  c("transitionWorkflowLifecycle", "state-changing consumed", "critical", "WorkflowLifecycleDetailResponse", (client) => client.transitionWorkflowLifecycle("wf:a", workflowTransitionBody), "POST", "/api/v1/workflow-lifecycle/wf%3Aa/transitions", undefined, workflowTransitionBody),
  c("getPreviewList", "consumed", "normal", "PreviewListResponse", (client) => client.getPreviewList(500), "GET", "/api/v1/previews", { limit: "100" }),
  c("getPreviewDetail", "consumed", "normal", "PreviewDetailResponse", (client) => client.getPreviewDetail("prev:a"), "GET", "/api/v1/previews/prev%3Aa"),
  c("getPreviewDiff", "consumed", "normal", "PreviewDiffResponse", (client) => client.getPreviewDiff("prev:a"), "GET", "/api/v1/previews/prev%3Aa/diff"),
  c("getPreviewTimeline", "consumed", "normal", "PreviewTimelineResponse", (client) => client.getPreviewTimeline("prev:a"), "GET", "/api/v1/previews/prev%3Aa/timeline"),
  c("createPreview", "state-changing consumed", "critical", "PreviewDetailResponse", (client) => client.createPreview(previewCreateBody), "POST", "/api/v1/previews", undefined, previewCreateBody),
  c("getValidationList", "consumed", "normal", "ValidationListResponse", (client) => client.getValidationList(500), "GET", "/api/v1/validations", { limit: "100" }),
  c("getValidationDetail", "consumed", "normal", "ValidationDetailResponse", (client) => client.getValidationDetail("val:a"), "GET", "/api/v1/validations/val%3Aa"),
  c("getValidationTimeline", "consumed", "normal", "ValidationTimelineResponse", (client) => client.getValidationTimeline("val:a"), "GET", "/api/v1/validations/val%3Aa/timeline"),
  c("createValidation", "state-changing consumed", "critical", "ValidationDetailResponse", (client) => client.createValidation(validationCreateBody), "POST", "/api/v1/validations", undefined, validationCreateBody),
  c("getSafeActionList", "client-method hidden", "critical", "SafeActionListResponse", (client) => client.getSafeActionList(500), "GET", "/api/v1/actions", { limit: "100" }),
  c("getSafeActionDetail", "client-method hidden", "critical", "SafeActionDetailResponse", (client) => client.getSafeActionDetail("act:a"), "GET", "/api/v1/actions/act%3Aa"),
  c("getSafeActionTimeline", "client-method hidden", "critical", "SafeActionTimelineResponse", (client) => client.getSafeActionTimeline("act:a"), "GET", "/api/v1/actions/act%3Aa/timeline"),
  c("getActionSafetyCase", "consumed", "critical", "ActionSafetyCaseResponse", (client) => client.getActionSafetyCase("act:a"), "GET", "/api/v1/actions/act%3Aa/safety-case"),
  c("createSafeAction", "state-changing consumed", "critical", "SafeActionDetailResponse", (client) => client.createSafeAction(actionCreateBody), "POST", "/api/v1/actions", undefined, actionCreateBody),
  c("approveSafeAction", "state-changing consumed", "critical", "SafeActionDetailResponse", (client) => client.approveSafeAction("act:a", approvalBody), "POST", "/api/v1/actions/act%3Aa/approve", undefined, approvalBody),
  c("rejectSafeAction", "client-method hidden", "critical", "SafeActionDetailResponse", (client) => client.rejectSafeAction("act:a", rejectionBody), "POST", "/api/v1/actions/act%3Aa/reject", undefined, rejectionBody),
  c("executeSafeAction", "state-changing consumed", "critical", "SafeActionDetailResponse", (client) => client.executeSafeAction("act:a", executeBody), "POST", "/api/v1/actions/act%3Aa/execute", undefined, executeBody),
  c("cancelSafeAction", "client-method hidden", "critical", "SafeActionDetailResponse", (client) => client.cancelSafeAction("act:a", cancelBody), "POST", "/api/v1/actions/act%3Aa/cancel", undefined, cancelBody),
  c("getRollbackList", "client-method hidden", "critical", "RollbackListResponse", (client) => client.getRollbackList(500), "GET", "/api/v1/rollbacks", { limit: "100" }),
  c("getRollbackDetail", "client-method hidden", "critical", "RollbackDetailResponse", (client) => client.getRollbackDetail("rb:a"), "GET", "/api/v1/rollbacks/rb%3Aa"),
  c("getRollbackTimeline", "client-method hidden", "critical", "RollbackTimelineResponse", (client) => client.getRollbackTimeline("rb:a"), "GET", "/api/v1/rollbacks/rb%3Aa/timeline"),
  c("createRollback", "state-changing consumed", "critical", "RollbackDetailResponse", (client) => client.createRollback(rollbackCreateBody), "POST", "/api/v1/rollbacks", undefined, rollbackCreateBody),
  c("approveRollback", "state-changing consumed", "critical", "RollbackDetailResponse", (client) => client.approveRollback("rb:a", approvalBody), "POST", "/api/v1/rollbacks/rb%3Aa/approve", undefined, approvalBody),
  c("rejectRollback", "client-method hidden", "critical", "RollbackDetailResponse", (client) => client.rejectRollback("rb:a", rejectionBody), "POST", "/api/v1/rollbacks/rb%3Aa/reject", undefined, rejectionBody),
  c("executeRollback", "state-changing consumed", "critical", "RollbackDetailResponse", (client) => client.executeRollback("rb:a", executeBody), "POST", "/api/v1/rollbacks/rb%3Aa/execute", undefined, executeBody),
  c("cancelRollback", "client-method hidden", "critical", "RollbackDetailResponse", (client) => client.cancelRollback("rb:a", cancelBody), "POST", "/api/v1/rollbacks/rb%3Aa/cancel", undefined, cancelBody),
  c("getAuditHistory", "consumed", "normal", "AuditHistoryResponse", (client) => client.getAuditHistory({ limit: 12, sync_runs_limit: 13, readiness_snapshot_history_limit: 14 }), "GET", "/api/v1/audit-history", { limit: "12", sync_runs_limit: "13", readiness_snapshot_history_limit: "14" }),
  c("getCapabilities", "consumed", "normal", "CapabilitiesListResponse", (client) => client.getCapabilities(), "GET", "/api/v1/capabilities"),
  c("getRecentChangeSummary", "consumed", "normal", "RecentChangeSummaryResponse", (client) => client.getRecentChangeSummary(500), "GET", "/api/v1/change-intelligence/recent-summary", { sync_runs_limit: "100" }),
  c("getDeltaDigest", "consumed", "normal", "CrossDomainDeltaDigestResponse", (client) => client.getDeltaDigest(500), "GET", "/api/v1/delta-digest", { sync_runs_limit: "100" }),
  c("getEvidenceConsistencySummary", "consumed", "normal", "EvidenceConsistencySummaryResponse", (client) => client.getEvidenceConsistencySummary(500), "GET", "/api/v1/evidence-consistency/summary", { sync_runs_limit: "100" }),
  c("getOperationalStabilitySummary", "consumed", "normal", "OperationalStabilitySummaryResponse", (client) => client.getOperationalStabilitySummary(500), "GET", "/api/v1/stability/summary", { sync_runs_limit: "100" }),
  c("getEvidenceQualityWorkspace", "consumed", "normal", "EvidenceQualitySummaryResponse", (client) => client.getEvidenceQualityWorkspace(500), "GET", "/api/v1/evidence-quality-workspace", { sync_runs_limit: "100" }),
  c("getEvidenceWeaknessExplanation", "consumed", "high", "EvidenceWeaknessExplanationResponse", (client) => client.getEvidenceWeaknessExplanation(500), "GET", "/api/v1/evidence-weakness-explanation", { sync_runs_limit: "100" }),
  c("getTopologyObjectStabilityProfile", "consumed", "high", "TopologyObjectStabilityProfileResponse", (client) => client.getTopologyObjectStabilityProfile("node:a:b"), "GET", "/api/v1/topology/objects/node%3Aa%3Ab/stability-profile"),
  c("getServiceStabilityProfile", "consumed", "high", "ServiceStabilityProfileResponse", (client) => client.getServiceStabilityProfile("svc:a:b"), "GET", "/api/v1/services/svc%3Aa%3Ab/stability-profile"),
  c("getInvestigationWorkspaceContext", "consumed", "normal", "InvestigationContextAssemblyResponse", (client) => client.getInvestigationWorkspaceContext(500), "GET", "/api/v1/investigation-workspace/context", { sync_runs_limit: "100" }),
  c("getEvidencePackSituation", "consumed", "normal", "SituationPackAssemblyResponse", (client) => client.getEvidencePackSituation(500), "GET", "/api/v1/evidence-pack/situation", { sync_runs_limit: "100" }),
  c("getOperatorSearch", "consumed", "normal", "OperatorSearchResponse", (client) => client.getOperatorSearch("PE1:static"), "GET", "/api/v1/operator-search", { q: "PE1:static" }),
  c("getOperatorBriefing", "consumed", "normal", "OperatorBriefingWorkspaceResponse", (client) => client.getOperatorBriefing({ syncRunsLimit: 500, policyId: "p:a", topologyObject: "PE1", topologyObjectKind: "node", invFrom: "overview", globalSearchQ: "PE1" }), "GET", "/api/v1/operator-briefing", { sync_runs_limit: "100", policy_id: "p:a", topology_object: "PE1", topology_object_kind: "node", inv_from: "overview", global_search_q: "PE1" }),
];

function c(
  name: string,
  posture: ApiParityCase["posture"],
  risk: ApiParityCase["risk"],
  responseContract: string,
  call: ApiParityCase["call"],
  method: ApiParityCase["expected"]["method"],
  pathname: string,
  query?: Record<string, QueryValue>,
  body?: unknown,
): ApiParityCase {
  return { name, posture, risk, responseContract, call, expected: { method, pathname, query, body } };
}

describe("Phase 1 ApiClient parity", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("has one parity case for every async ApiClient method", () => {
    const src = readFileSync(join(__dirname, "../src/api/client.ts"), "utf8");
    const methodNames = [...src.matchAll(/^  async ([a-zA-Z0-9_]+)\(/gm)].map((match) => match[1]).sort();
    expect(CASES.map((apiCase) => apiCase.name).sort()).toEqual(methodNames);
  });

  it.each(CASES)("$name keeps $method $pathname mapped to $responseContract", async (apiCase) => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "{}",
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await apiCase.call(new ApiClient({ baseUrl: "http://api" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [rawUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const url = new URL(rawUrl);
    expect(url.pathname).toBe(apiCase.expected.pathname);
    expect(init.method).toBe(apiCase.expected.method);
    expect(init.headers).toMatchObject({ Accept: "application/json" });

    for (const [key, value] of Object.entries(apiCase.expected.query ?? {})) {
      if (Array.isArray(value)) {
        expect(url.searchParams.getAll(key)).toEqual(value);
      } else {
        expect(url.searchParams.get(key)).toBe(value);
      }
    }

    if (apiCase.expected.query) {
      expect([...new Set(url.searchParams.keys())].sort()).toEqual(Object.keys(apiCase.expected.query).sort());
    } else {
      expect(url.search).toBe("");
    }

    if (apiCase.expected.method === "POST") {
      expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
      expect(JSON.parse(String(init.body))).toEqual(apiCase.expected.body);
    } else {
      expect(init.body).toBeUndefined();
    }
  });

  it("keeps state-changing and hidden client methods visible in the parity inventory", () => {
    expect(CASES.filter((apiCase) => apiCase.posture === "state-changing consumed").map((apiCase) => apiCase.name)).toMatchInlineSnapshot(`
      [
        "createWorkflowLifecycle",
        "transitionWorkflowLifecycle",
        "createPreview",
        "createValidation",
        "createSafeAction",
        "approveSafeAction",
        "executeSafeAction",
        "createRollback",
        "approveRollback",
        "executeRollback",
      ]
    `);
    expect(CASES.filter((apiCase) => apiCase.posture === "client-method hidden").map((apiCase) => apiCase.name)).toMatchInlineSnapshot(`
      [
        "getSafeActionList",
        "getSafeActionDetail",
        "getSafeActionTimeline",
        "rejectSafeAction",
        "cancelSafeAction",
        "getRollbackList",
        "getRollbackDetail",
        "getRollbackTimeline",
        "rejectRollback",
        "cancelRollback",
      ]
    `);
  });
});
