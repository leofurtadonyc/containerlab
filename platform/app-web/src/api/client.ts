import type {
  AuditHistoryResponse,
  CapabilitiesListResponse,
  DevicesListResponse,
  ErrorResponse,
  PathAnalysisViewResponse,
  PlatformStatusResponse,
  PoliciesListResponse,
  PolicyTopologyImpactResponse,
  PolicyEvidenceDeltaResponse,
  PolicyEvidenceTimelineResponse,
  ServiceEvidenceDeltaResponse,
  ServiceEvidenceTimelineResponse,
  InvestigationContextAssemblyResponse,
  RecentChangeSummaryResponse,
  SituationPackAssemblyResponse,
  TopologyObjectRelatedPoliciesResponse,
  TopologyResponse,
  TopologyTruthResponse,
  ControllerEvidenceResponse,
  TopologyRiskSummaryResponse,
  FailureImpactViewResponse,
  TopologyObjectDossierResponse,
  TopologyObjectEvidenceDeltaResponse,
  TopologyObjectEvidenceTimelineResponse,
  PolicyDossierResponse,
  PolicyExplainabilityResponse,
  PathExplorerWorkspaceResponse,
  ServiceImpactWorkspaceResponse,
  OperatorSearchResponse,
  WorkflowHistoryResponse,
  WorkflowLifecycleDetailResponse,
  WorkflowLifecycleListResponse,
  WorkflowLifecycleTimelineResponse,
  PreviewDetailResponse,
  PreviewDiffResponse,
  PreviewListResponse,
  PreviewTimelineResponse,
  WorkflowLifecycleStatus,
  CrossDomainDeltaDigestResponse,
  EvidenceConsistencySummaryResponse,
  OperatorBriefingWorkspaceResponse,
  ServiceDetailResponse,
  ServiceDossierResponse,
  ServicesListResponse,
  MaintenancePreviewResponse,
  MaintenanceEvidenceWorkspaceResponse,
  MaintenanceWindowWorkspaceResponse,
  MaintenancePreviewContext,
  ImpactReportResponse,
  ChangeSafetyCaseResponse,
  OperationalStabilitySummaryResponse,
  EvidenceQualitySummaryResponse,
  EvidenceWeaknessExplanationResponse,
  ServiceStabilityProfileResponse,
  TopologyObjectStabilityProfileResponse,
  ValidationDetailResponse,
  ValidationListResponse,
  ValidationTimelineResponse,
  ActionSafetyCaseResponse,
  SafeActionDetailResponse,
  SafeActionListResponse,
  SafeActionTimelineResponse,
  RollbackDetailResponse,
  RollbackListResponse,
  RollbackTimelineResponse,
} from "./contracts";
import {
  buildAuditHistoryQueryString,
  buildDevicesPoliciesQueryString,
  buildWorkflowHistoryQueryString,
  type AuditHistoryReadSideQuery,
  type DevicesPoliciesReadSideQuery,
  type WorkflowHistoryReadSideQuery,
} from "./read-side-query-params";
import { dedupeSubjects } from "../lib/maintenance-window-workspace-navigation";
import type { MaintenanceWindowSubjectRef } from "../lib/maintenance-window-workspace-navigation";

export interface ApiClientConfig {
  baseUrl: string;
}

/** Bounded query for `GET /api/v1/operator-briefing`. */
/** Bounded query for `GET /api/v1/maintenance-preview` (mirrors backend query params). */
export interface MaintenancePreviewQuery {
  nodeId?: string | null;
  linkId?: string | null;
  objectId?: string | null;
  objectKind?: "node" | "link" | null;
  previewContext?: MaintenancePreviewContext;
}

/** Query for `GET /api/v1/maintenance-window-workspace` (repeated `subject=` tokens; backend-owned dedupe). */
export interface MaintenanceWindowWorkspaceQuery {
  subjects: MaintenanceWindowSubjectRef[];
  previewContext: MaintenancePreviewContext;
  syncRunsLimit: number;
}

/** Maps WebUI-normalized subjects to API `subject=node:…` / `subject=link:…` query (preview_context, sync_runs_limit). */
export function buildMaintenanceWindowWorkspaceUrlSearchParams(
  query: MaintenanceWindowWorkspaceQuery,
): URLSearchParams {
  const params = new URLSearchParams();
  const deduped = dedupeSubjects(query.subjects);
  for (const s of deduped) {
    params.append("subject", `${s.objectKind}:${s.objectId}`);
  }
  params.set("preview_context", query.previewContext);
  params.set("sync_runs_limit", String(Math.min(100, Math.max(1, Math.floor(query.syncRunsLimit)))));
  return params;
}

/** Same query string as `GET /api/v1/maintenance-preview` / `GET /api/v1/maintenance-evidence-workspace`. */
export function buildMaintenancePreviewUrlSearchParams(query: MaintenancePreviewQuery): URLSearchParams {
  const params = new URLSearchParams();
  const nid = query.nodeId?.trim();
  const lid = query.linkId?.trim();
  const oid = query.objectId?.trim();
  const ok = query.objectKind ?? null;
  const ctx = query.previewContext ?? "explicit_subject";
  params.set("preview_context", ctx);
  if (nid) {
    params.set("node_id", nid);
  } else if (lid) {
    params.set("link_id", lid);
  } else if (oid && ok) {
    params.set("object_id", oid);
    params.set("object_kind", ok);
  }
  return params;
}

export interface OperatorBriefingQuery {
  syncRunsLimit?: number;
  policyId?: string | null;
  topologyObject?: string | null;
  topologyObjectKind?: "node" | "link" | null;
  invFrom?: string | null;
  globalSearchQ?: string | null;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string = "request_failed",
    readonly requestId?: string,
    readonly details: ErrorResponse["details"] = [],
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export class ApiClient {
  private readonly baseUrl: string;

  constructor(private readonly config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
  }

  async getPlatformStatus(): Promise<PlatformStatusResponse> {
    return this.request<PlatformStatusResponse>("/api/v1/platform/status");
  }

  async getDevices(query?: DevicesPoliciesReadSideQuery): Promise<DevicesListResponse> {
    const qs = query ? buildDevicesPoliciesQueryString(query) : "";
    return this.request<DevicesListResponse>(`/api/v1/devices${qs}`);
  }

  async getTopology(): Promise<TopologyResponse> {
    return this.request<TopologyResponse>("/api/v1/topology");
  }

  /** Deeper topology truth v1 — optional `truth_posture` filters merged nodes/links. */
  async getTopologyTruth(query?: { truthPosture?: string }): Promise<TopologyTruthResponse> {
    const params = new URLSearchParams();
    const posture = query?.truthPosture?.trim();
    if (posture) {
      params.set("truth_posture", posture);
    }
    const qs = params.toString();
    return this.request<TopologyTruthResponse>(`/api/v1/topology/truth${qs ? `?${qs}` : ""}`);
  }

  /** Controller southbound evidence v1 — distinct BGP-LS / PCEP / NETCONF lanes from ODL RESTCONF. */
  async getControllerEvidence(): Promise<ControllerEvidenceResponse> {
    return this.request<ControllerEvidenceResponse>("/api/v1/controller/evidence");
  }

  async getTopologyObjectRelatedPolicies(
    objectId: string,
  ): Promise<TopologyObjectRelatedPoliciesResponse> {
    const encoded = encodeURIComponent(objectId);
    return this.request<TopologyObjectRelatedPoliciesResponse>(
      `/api/v1/topology/objects/${encoded}/related-policies`,
    );
  }

  async getTopologyObjectFailureImpact(objectId: string): Promise<FailureImpactViewResponse> {
    const encoded = encodeURIComponent(objectId);
    return this.request<FailureImpactViewResponse>(
      `/api/v1/topology/objects/${encoded}/failure-impact`,
    );
  }

  async getMaintenancePreview(query: MaintenancePreviewQuery): Promise<MaintenancePreviewResponse> {
    const qs = buildMaintenancePreviewUrlSearchParams(query).toString();
    return this.request<MaintenancePreviewResponse>(`/api/v1/maintenance-preview?${qs}`);
  }

  async getMaintenanceEvidenceWorkspace(
    query: MaintenancePreviewQuery,
  ): Promise<MaintenanceEvidenceWorkspaceResponse> {
    const qs = buildMaintenancePreviewUrlSearchParams(query).toString();
    return this.request<MaintenanceEvidenceWorkspaceResponse>(`/api/v1/maintenance-evidence-workspace?${qs}`);
  }

  async getMaintenanceWindowWorkspace(
    query: MaintenanceWindowWorkspaceQuery,
  ): Promise<MaintenanceWindowWorkspaceResponse> {
    const qs = buildMaintenanceWindowWorkspaceUrlSearchParams(query).toString();
    return this.request<MaintenanceWindowWorkspaceResponse>(`/api/v1/maintenance-window-workspace?${qs}`);
  }

  async getServiceImpactReport(serviceId: string): Promise<ImpactReportResponse> {
    const params = new URLSearchParams();
    params.set("service_id", serviceId.trim());
    return this.request<ImpactReportResponse>(`/api/v1/reports/service-impact?${params.toString()}`);
  }

  async getPolicyImpactReport(policyId: string): Promise<ImpactReportResponse> {
    const params = new URLSearchParams();
    params.set("policy_id", policyId.trim());
    return this.request<ImpactReportResponse>(`/api/v1/reports/policy-impact?${params.toString()}`);
  }

  async getMaintenanceImpactReport(query: MaintenancePreviewQuery): Promise<ImpactReportResponse> {
    const params = new URLSearchParams();
    const nid = query.nodeId?.trim();
    const lid = query.linkId?.trim();
    const oid = query.objectId?.trim();
    const ok = query.objectKind ?? null;
    const ctx = query.previewContext ?? "explicit_subject";
    params.set("preview_context", ctx);
    if (nid) {
      params.set("node_id", nid);
    } else if (lid) {
      params.set("link_id", lid);
    } else if (oid && ok) {
      params.set("object_id", oid);
      params.set("object_kind", ok);
    }
    return this.request<ImpactReportResponse>(`/api/v1/reports/maintenance-impact?${params.toString()}`);
  }

  async getPolicyChangeSafetyCase(policyId: string): Promise<ChangeSafetyCaseResponse> {
    const params = new URLSearchParams();
    params.set("policy_id", policyId.trim());
    return this.request<ChangeSafetyCaseResponse>(
      `/api/v1/reports/change-safety-case/policy?${params.toString()}`,
    );
  }

  async getServiceChangeSafetyCase(serviceId: string): Promise<ChangeSafetyCaseResponse> {
    const params = new URLSearchParams();
    params.set("service_id", serviceId.trim());
    return this.request<ChangeSafetyCaseResponse>(
      `/api/v1/reports/change-safety-case/service?${params.toString()}`,
    );
  }

  async getTopologyChangeSafetyCase(query: MaintenancePreviewQuery): Promise<ChangeSafetyCaseResponse> {
    const params = new URLSearchParams();
    const nid = query.nodeId?.trim();
    const lid = query.linkId?.trim();
    const oid = query.objectId?.trim();
    const ok = query.objectKind ?? null;
    const ctx = query.previewContext ?? "explicit_subject";
    params.set("preview_context", ctx);
    if (nid) {
      params.set("node_id", nid);
    } else if (lid) {
      params.set("link_id", lid);
    } else if (oid && ok) {
      params.set("object_id", oid);
      params.set("object_kind", ok);
    }
    return this.request<ChangeSafetyCaseResponse>(
      `/api/v1/reports/change-safety-case/maintenance?${params.toString()}`,
    );
  }

  async getTopologyRiskSummary(): Promise<TopologyRiskSummaryResponse> {
    return this.request<TopologyRiskSummaryResponse>("/api/v1/topology/risk-summary");
  }

  async getTopologyObjectDossier(objectId: string): Promise<TopologyObjectDossierResponse> {
    const encoded = encodeURIComponent(objectId);
    return this.request<TopologyObjectDossierResponse>(
      `/api/v1/topology/objects/${encoded}/dossier`,
    );
  }

  async getTopologyObjectEvidenceTimeline(objectId: string): Promise<TopologyObjectEvidenceTimelineResponse> {
    const encoded = encodeURIComponent(objectId);
    return this.request<TopologyObjectEvidenceTimelineResponse>(
      `/api/v1/topology/objects/${encoded}/evidence-timeline`,
    );
  }

  async getTopologyObjectEvidenceDelta(objectId: string): Promise<TopologyObjectEvidenceDeltaResponse> {
    const encoded = encodeURIComponent(objectId);
    return this.request<TopologyObjectEvidenceDeltaResponse>(
      `/api/v1/topology/objects/${encoded}/evidence-delta`,
    );
  }

  async getPolicies(query?: DevicesPoliciesReadSideQuery): Promise<PoliciesListResponse> {
    const qs = query ? buildDevicesPoliciesQueryString(query) : "";
    return this.request<PoliciesListResponse>(`/api/v1/policies${qs}`);
  }

  async getServices(limit?: number): Promise<ServicesListResponse> {
    if (limit != null) {
      const bounded = Math.min(500, Math.max(1, Math.floor(limit)));
      return this.request<ServicesListResponse>(`/api/v1/services?limit=${bounded}`);
    }
    return this.request<ServicesListResponse>("/api/v1/services");
  }

  async getService(serviceId: string): Promise<ServiceDetailResponse> {
    const encoded = encodeURIComponent(serviceId);
    return this.request<ServiceDetailResponse>(`/api/v1/services/${encoded}`);
  }

  async getServiceDossier(serviceId: string): Promise<ServiceDossierResponse> {
    const encoded = encodeURIComponent(serviceId);
    return this.request<ServiceDossierResponse>(`/api/v1/services/${encoded}/dossier`);
  }

  async getServiceEvidenceTimeline(serviceId: string): Promise<ServiceEvidenceTimelineResponse> {
    const encoded = encodeURIComponent(serviceId);
    return this.request<ServiceEvidenceTimelineResponse>(`/api/v1/services/${encoded}/evidence-timeline`);
  }

  async getServiceEvidenceDelta(serviceId: string): Promise<ServiceEvidenceDeltaResponse> {
    const encoded = encodeURIComponent(serviceId);
    return this.request<ServiceEvidenceDeltaResponse>(`/api/v1/services/${encoded}/evidence-delta`);
  }

  async getPolicyPathAnalysis(policyId: string): Promise<PathAnalysisViewResponse> {
    const encoded = encodeURIComponent(policyId);
    return this.request<PathAnalysisViewResponse>(`/api/v1/policies/${encoded}/path-analysis`);
  }

  async getPolicyTopologyImpact(policyId: string): Promise<PolicyTopologyImpactResponse> {
    const encoded = encodeURIComponent(policyId);
    return this.request<PolicyTopologyImpactResponse>(`/api/v1/policies/${encoded}/topology-impact`);
  }

  async getPolicyEvidenceTimeline(policyId: string): Promise<PolicyEvidenceTimelineResponse> {
    const encoded = encodeURIComponent(policyId);
    return this.request<PolicyEvidenceTimelineResponse>(`/api/v1/policies/${encoded}/evidence-timeline`);
  }

  async getPolicyEvidenceDelta(policyId: string): Promise<PolicyEvidenceDeltaResponse> {
    const encoded = encodeURIComponent(policyId);
    return this.request<PolicyEvidenceDeltaResponse>(`/api/v1/policies/${encoded}/evidence-delta`);
  }

  async getPolicyDossier(policyId: string): Promise<PolicyDossierResponse> {
    const encoded = encodeURIComponent(policyId);
    return this.request<PolicyDossierResponse>(`/api/v1/policies/${encoded}/dossier`);
  }

  async getPolicyExplainability(policyId: string): Promise<PolicyExplainabilityResponse> {
    const encoded = encodeURIComponent(policyId);
    return this.request<PolicyExplainabilityResponse>(`/api/v1/policies/${encoded}/explainability`);
  }

  async getPathExplorerWorkspace(policyId: string): Promise<PathExplorerWorkspaceResponse> {
    const params = new URLSearchParams();
    params.set("policy_id", policyId.trim());
    return this.request<PathExplorerWorkspaceResponse>(`/api/v1/path-explorer?${params.toString()}`);
  }

  async getServiceImpactWorkspace(serviceId: string): Promise<ServiceImpactWorkspaceResponse> {
    const params = new URLSearchParams();
    params.set("service_id", serviceId.trim());
    return this.request<ServiceImpactWorkspaceResponse>(`/api/v1/service-impact-workspace?${params.toString()}`);
  }

  async getWorkflowHistory(query?: WorkflowHistoryReadSideQuery): Promise<WorkflowHistoryResponse> {
    const qs = query ? buildWorkflowHistoryQueryString(query) : "";
    return this.request<WorkflowHistoryResponse>(`/api/v1/workflow-history${qs}`);
  }

  async getWorkflowLifecycleList(limit = 50): Promise<WorkflowLifecycleListResponse> {
    const params = new URLSearchParams();
    params.set("limit", String(Math.min(100, Math.max(1, Math.floor(limit)))));
    return this.jsonRequest<WorkflowLifecycleListResponse>(
      "GET",
      `/api/v1/workflow-lifecycle?${params.toString()}`,
    );
  }

  async getWorkflowLifecycleDetail(workflowId: string): Promise<WorkflowLifecycleDetailResponse> {
    const encoded = encodeURIComponent(workflowId.trim());
    return this.jsonRequest<WorkflowLifecycleDetailResponse>("GET", `/api/v1/workflow-lifecycle/${encoded}`);
  }

  async getWorkflowLifecycleTimeline(workflowId: string): Promise<WorkflowLifecycleTimelineResponse> {
    const encoded = encodeURIComponent(workflowId.trim());
    return this.jsonRequest<WorkflowLifecycleTimelineResponse>(
      "GET",
      `/api/v1/workflow-lifecycle/${encoded}/timeline`,
    );
  }

  async createWorkflowLifecycle(body: {
    workflow_type: string;
    title: string;
    description?: string | null;
    initial_status?: WorkflowLifecycleStatus;
    target_scope?: Record<string, unknown>;
    capability_decision?: Record<string, unknown>;
    actor?: string;
    provenance?: "operator" | "api";
  }): Promise<WorkflowLifecycleDetailResponse> {
    return this.jsonRequest<WorkflowLifecycleDetailResponse>("POST", "/api/v1/workflow-lifecycle", {
      body: JSON.stringify(body),
    });
  }

  async transitionWorkflowLifecycle(
    workflowId: string,
    body: {
      next_status: WorkflowLifecycleStatus;
      reason?: string | null;
      actor?: string;
      metadata?: Record<string, unknown>;
      provenance?: "operator" | "api";
    },
  ): Promise<WorkflowLifecycleDetailResponse> {
    const encoded = encodeURIComponent(workflowId.trim());
    return this.jsonRequest<WorkflowLifecycleDetailResponse>(
      "POST",
      `/api/v1/workflow-lifecycle/${encoded}/transitions`,
      { body: JSON.stringify(body) },
    );
  }

  async getPreviewList(limit = 50): Promise<PreviewListResponse> {
    const params = new URLSearchParams();
    params.set("limit", String(Math.min(100, Math.max(1, Math.floor(limit)))));
    return this.jsonRequest<PreviewListResponse>("GET", `/api/v1/previews?${params.toString()}`);
  }

  async getPreviewDetail(previewId: string): Promise<PreviewDetailResponse> {
    const encoded = encodeURIComponent(previewId.trim());
    return this.jsonRequest<PreviewDetailResponse>("GET", `/api/v1/previews/${encoded}`);
  }

  async getPreviewDiff(previewId: string): Promise<PreviewDiffResponse> {
    const encoded = encodeURIComponent(previewId.trim());
    return this.jsonRequest<PreviewDiffResponse>("GET", `/api/v1/previews/${encoded}/diff`);
  }

  async getPreviewTimeline(previewId: string): Promise<PreviewTimelineResponse> {
    const encoded = encodeURIComponent(previewId.trim());
    return this.jsonRequest<PreviewTimelineResponse>("GET", `/api/v1/previews/${encoded}/timeline`);
  }

  async createPreview(body: {
    preview_type: string;
    target_kind: "policy";
    target_ids: string[];
    target_scope?: Record<string, unknown> | null;
    requested_action_type?: string;
    requested_payload: Record<string, unknown>;
    workflow_id?: string | null;
    idempotency_key?: string | null;
    actor_type?: "operator" | "system" | "api" | "unknown";
    actor_id?: string;
    actor_display_name?: string | null;
    notes?: string | null;
  }): Promise<PreviewDetailResponse> {
    return this.jsonRequest<PreviewDetailResponse>("POST", "/api/v1/previews", {
      body: JSON.stringify(body),
    });
  }

  async getValidationList(limit = 50): Promise<ValidationListResponse> {
    const params = new URLSearchParams();
    params.set("limit", String(Math.min(100, Math.max(1, Math.floor(limit)))));
    return this.jsonRequest<ValidationListResponse>("GET", `/api/v1/validations?${params.toString()}`);
  }

  async getValidationDetail(validationId: string): Promise<ValidationDetailResponse> {
    const encoded = encodeURIComponent(validationId.trim());
    return this.jsonRequest<ValidationDetailResponse>("GET", `/api/v1/validations/${encoded}`);
  }

  async getValidationTimeline(validationId: string): Promise<ValidationTimelineResponse> {
    const encoded = encodeURIComponent(validationId.trim());
    return this.jsonRequest<ValidationTimelineResponse>("GET", `/api/v1/validations/${encoded}/timeline`);
  }

  async createValidation(body: {
    validation_type: string;
    validation_context: "pre_change" | "post_change";
    target_kind: string;
    target_ids: string[];
    target_scope?: Record<string, unknown> | null;
    requested_checkset?: string[] | null;
    workflow_id?: string | null;
    preview_id?: string | null;
    idempotency_key?: string | null;
    notes?: string | null;
    created_by_actor_type?: "operator" | "api" | "system";
    created_by_actor_id?: string;
    created_by_actor_display_name?: string | null;
  }): Promise<ValidationDetailResponse> {
    return this.jsonRequest<ValidationDetailResponse>("POST", "/api/v1/validations", {
      body: JSON.stringify(body),
    });
  }

  async getSafeActionList(limit = 50): Promise<SafeActionListResponse> {
    const params = new URLSearchParams();
    params.set("limit", String(Math.min(100, Math.max(1, Math.floor(limit)))));
    return this.jsonRequest<SafeActionListResponse>("GET", `/api/v1/actions?${params.toString()}`);
  }

  async getSafeActionDetail(actionId: string): Promise<SafeActionDetailResponse> {
    const encoded = encodeURIComponent(actionId.trim());
    return this.jsonRequest<SafeActionDetailResponse>("GET", `/api/v1/actions/${encoded}`);
  }

  async getSafeActionTimeline(actionId: string): Promise<SafeActionTimelineResponse> {
    const encoded = encodeURIComponent(actionId.trim());
    return this.jsonRequest<SafeActionTimelineResponse>("GET", `/api/v1/actions/${encoded}/timeline`);
  }

  async getActionSafetyCase(actionId: string): Promise<ActionSafetyCaseResponse> {
    const encoded = encodeURIComponent(actionId.trim());
    return this.jsonRequest<ActionSafetyCaseResponse>("GET", `/api/v1/actions/${encoded}/safety-case`);
  }

  async createSafeAction(body: {
    workflow_id: string;
    preview_id: string;
    validation_id: string;
    action_type: string;
    target_kind: "policy";
    target_ids: string[];
    target_scope?: Record<string, unknown> | null;
    requested_payload: Record<string, unknown>;
    idempotency_key?: string | null;
    description?: string | null;
    requested_by_actor_type?: "operator" | "api" | "system";
    requested_by_actor_id?: string;
    requested_by_actor_display_name?: string | null;
  }): Promise<SafeActionDetailResponse> {
    return this.jsonRequest<SafeActionDetailResponse>("POST", "/api/v1/actions", {
      body: JSON.stringify(body),
    });
  }

  async approveSafeAction(
    actionId: string,
    body: { actor_id: string; actor_display_name?: string | null; reason?: string | null; provenance?: "operator" | "api" },
  ): Promise<SafeActionDetailResponse> {
    const encoded = encodeURIComponent(actionId.trim());
    return this.jsonRequest<SafeActionDetailResponse>("POST", `/api/v1/actions/${encoded}/approve`, {
      body: JSON.stringify(body),
    });
  }

  async rejectSafeAction(
    actionId: string,
    body: {
      actor_id: string;
      actor_display_name?: string | null;
      reason: string;
      provenance?: "operator" | "api";
    },
  ): Promise<SafeActionDetailResponse> {
    const encoded = encodeURIComponent(actionId.trim());
    return this.jsonRequest<SafeActionDetailResponse>("POST", `/api/v1/actions/${encoded}/reject`, {
      body: JSON.stringify(body),
    });
  }

  async executeSafeAction(
    actionId: string,
    body: { actor_id: string; provenance?: "operator" | "api" },
  ): Promise<SafeActionDetailResponse> {
    const encoded = encodeURIComponent(actionId.trim());
    return this.jsonRequest<SafeActionDetailResponse>("POST", `/api/v1/actions/${encoded}/execute`, {
      body: JSON.stringify(body),
    });
  }

  async cancelSafeAction(
    actionId: string,
    body: { actor_id: string; reason?: string | null },
  ): Promise<SafeActionDetailResponse> {
    const encoded = encodeURIComponent(actionId.trim());
    return this.jsonRequest<SafeActionDetailResponse>("POST", `/api/v1/actions/${encoded}/cancel`, {
      body: JSON.stringify(body),
    });
  }

  async getRollbackList(limit = 50): Promise<RollbackListResponse> {
    const params = new URLSearchParams();
    params.set("limit", String(Math.min(100, Math.max(1, Math.floor(limit)))));
    return this.jsonRequest<RollbackListResponse>("GET", `/api/v1/rollbacks?${params.toString()}`);
  }

  async getRollbackDetail(rollbackId: string): Promise<RollbackDetailResponse> {
    const encoded = encodeURIComponent(rollbackId.trim());
    return this.jsonRequest<RollbackDetailResponse>("GET", `/api/v1/rollbacks/${encoded}`);
  }

  async getRollbackTimeline(rollbackId: string): Promise<RollbackTimelineResponse> {
    const encoded = encodeURIComponent(rollbackId.trim());
    return this.jsonRequest<RollbackTimelineResponse>("GET", `/api/v1/rollbacks/${encoded}/timeline`);
  }

  async createRollback(body: {
    parent_action_id: string;
    rollback_type: string;
    target_kind: "policy";
    target_ids: string[];
    target_scope?: Record<string, unknown> | null;
    pre_rollback_validation_id: string;
    idempotency_key?: string | null;
    description?: string | null;
    requested_by_actor_type?: "operator" | "api" | "system";
    requested_by_actor_id?: string;
    requested_by_actor_display_name?: string | null;
  }): Promise<RollbackDetailResponse> {
    return this.jsonRequest<RollbackDetailResponse>("POST", "/api/v1/rollbacks", {
      body: JSON.stringify(body),
    });
  }

  async approveRollback(
    rollbackId: string,
    body: { actor_id: string; actor_display_name?: string | null; reason?: string | null; provenance?: "operator" | "api" },
  ): Promise<RollbackDetailResponse> {
    const encoded = encodeURIComponent(rollbackId.trim());
    return this.jsonRequest<RollbackDetailResponse>("POST", `/api/v1/rollbacks/${encoded}/approve`, {
      body: JSON.stringify(body),
    });
  }

  async rejectRollback(
    rollbackId: string,
    body: {
      actor_id: string;
      actor_display_name?: string | null;
      reason: string;
      provenance?: "operator" | "api";
    },
  ): Promise<RollbackDetailResponse> {
    const encoded = encodeURIComponent(rollbackId.trim());
    return this.jsonRequest<RollbackDetailResponse>("POST", `/api/v1/rollbacks/${encoded}/reject`, {
      body: JSON.stringify(body),
    });
  }

  async executeRollback(
    rollbackId: string,
    body: { actor_id: string; provenance?: "operator" | "api" },
  ): Promise<RollbackDetailResponse> {
    const encoded = encodeURIComponent(rollbackId.trim());
    return this.jsonRequest<RollbackDetailResponse>("POST", `/api/v1/rollbacks/${encoded}/execute`, {
      body: JSON.stringify(body),
    });
  }

  async cancelRollback(
    rollbackId: string,
    body: { actor_id: string; reason?: string | null },
  ): Promise<RollbackDetailResponse> {
    const encoded = encodeURIComponent(rollbackId.trim());
    return this.jsonRequest<RollbackDetailResponse>("POST", `/api/v1/rollbacks/${encoded}/cancel`, {
      body: JSON.stringify(body),
    });
  }

  async getAuditHistory(query?: AuditHistoryReadSideQuery): Promise<AuditHistoryResponse> {
    const qs = query ? buildAuditHistoryQueryString(query) : "";
    return this.request<AuditHistoryResponse>(`/api/v1/audit-history${qs}`);
  }

  async getCapabilities(): Promise<CapabilitiesListResponse> {
    return this.request<CapabilitiesListResponse>("/api/v1/capabilities");
  }

  async getRecentChangeSummary(syncRunsLimit = 20): Promise<RecentChangeSummaryResponse> {
    const limit = Math.min(100, Math.max(1, syncRunsLimit));
    return this.request<RecentChangeSummaryResponse>(
      `/api/v1/change-intelligence/recent-summary?sync_runs_limit=${limit}`,
    );
  }

  async getDeltaDigest(syncRunsLimit = 20): Promise<CrossDomainDeltaDigestResponse> {
    const limit = Math.min(100, Math.max(1, syncRunsLimit));
    return this.request<CrossDomainDeltaDigestResponse>(
      `/api/v1/delta-digest?sync_runs_limit=${limit}`,
    );
  }

  async getEvidenceConsistencySummary(syncRunsLimit = 20): Promise<EvidenceConsistencySummaryResponse> {
    const limit = Math.min(100, Math.max(1, syncRunsLimit));
    return this.request<EvidenceConsistencySummaryResponse>(
      `/api/v1/evidence-consistency/summary?sync_runs_limit=${limit}`,
    );
  }

  async getOperationalStabilitySummary(syncRunsLimit = 20): Promise<OperationalStabilitySummaryResponse> {
    const limit = Math.min(100, Math.max(1, syncRunsLimit));
    return this.request<OperationalStabilitySummaryResponse>(
      `/api/v1/stability/summary?sync_runs_limit=${limit}`,
    );
  }

  async getEvidenceQualityWorkspace(syncRunsLimit = 20): Promise<EvidenceQualitySummaryResponse> {
    const limit = Math.min(100, Math.max(1, syncRunsLimit));
    return this.request<EvidenceQualitySummaryResponse>(
      `/api/v1/evidence-quality-workspace?sync_runs_limit=${limit}`,
    );
  }

  async getEvidenceWeaknessExplanation(syncRunsLimit = 20): Promise<EvidenceWeaknessExplanationResponse> {
    const limit = Math.min(100, Math.max(1, syncRunsLimit));
    return this.request<EvidenceWeaknessExplanationResponse>(
      `/api/v1/evidence-weakness-explanation?sync_runs_limit=${limit}`,
    );
  }

  async getTopologyObjectStabilityProfile(objectId: string): Promise<TopologyObjectStabilityProfileResponse> {
    const encoded = encodeURIComponent(objectId.trim());
    return this.request<TopologyObjectStabilityProfileResponse>(
      `/api/v1/topology/objects/${encoded}/stability-profile`,
    );
  }

  async getServiceStabilityProfile(serviceId: string): Promise<ServiceStabilityProfileResponse> {
    const encoded = encodeURIComponent(serviceId.trim());
    return this.request<ServiceStabilityProfileResponse>(`/api/v1/services/${encoded}/stability-profile`);
  }

  async getInvestigationWorkspaceContext(
    syncRunsLimit = 20,
  ): Promise<InvestigationContextAssemblyResponse> {
    const limit = Math.min(100, Math.max(1, syncRunsLimit));
    return this.request<InvestigationContextAssemblyResponse>(
      `/api/v1/investigation-workspace/context?sync_runs_limit=${limit}`,
    );
  }

  async getEvidencePackSituation(syncRunsLimit = 20): Promise<SituationPackAssemblyResponse> {
    const limit = Math.min(100, Math.max(1, syncRunsLimit));
    return this.request<SituationPackAssemblyResponse>(
      `/api/v1/evidence-pack/situation?sync_runs_limit=${limit}`,
    );
  }

  async getOperatorSearch(q: string): Promise<OperatorSearchResponse> {
    const encoded = encodeURIComponent(q);
    return this.request<OperatorSearchResponse>(`/api/v1/operator-search?q=${encoded}`);
  }

  async getOperatorBriefing(query: OperatorBriefingQuery = {}): Promise<OperatorBriefingWorkspaceResponse> {
    const lim = Math.min(100, Math.max(1, Math.floor(query.syncRunsLimit ?? 20)));
    const params = new URLSearchParams();
    params.set("sync_runs_limit", String(lim));
    if (query.policyId?.trim()) {
      params.set("policy_id", query.policyId.trim());
    }
    if (query.topologyObject?.trim()) {
      params.set("topology_object", query.topologyObject.trim());
    }
    if (query.topologyObjectKind) {
      params.set("topology_object_kind", query.topologyObjectKind);
    }
    if (query.invFrom?.trim()) {
      params.set("inv_from", query.invFrom.trim());
    }
    if (query.globalSearchQ?.trim()) {
      params.set("global_search_q", query.globalSearchQ.trim());
    }
    return this.request<OperatorBriefingWorkspaceResponse>(
      `/api/v1/operator-briefing?${params.toString()}`,
    );
  }

  private async request<T>(path: string): Promise<T> {
    return this.jsonRequest<T>("GET", path);
  }

  private async jsonRequest<T>(method: string, path: string, init: RequestInit = {}): Promise<T> {
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        method,
        headers: {
          Accept: "application/json",
          ...(method !== "GET" && method !== "HEAD" ? { "Content-Type": "application/json" } : {}),
          ...init.headers,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to reach the backend API.";
      throw new ApiClientError(message, 0, "network_error");
    }

    const payload = (await this.tryParseJson(response)) as T | ErrorResponse | null;

    if (!response.ok) {
      if (isErrorResponse(payload)) {
        throw new ApiClientError(
          payload.message,
          response.status,
          payload.code,
          payload.request_id,
          payload.details,
        );
      }

      throw new ApiClientError(
        `Request failed with status ${response.status}.`,
        response.status,
      );
    }

    if (payload === null) {
      throw new ApiClientError(
        "Backend returned an empty response for a JSON endpoint.",
        response.status,
        "empty_response",
      );
    }

    return payload as T;
  }

  private async tryParseJson(response: Response): Promise<unknown | null> {
    const responseText = await response.text();

    if (!responseText) {
      return null;
    }

    try {
      return JSON.parse(responseText);
    } catch {
      return null;
    }
  }
}

function isErrorResponse(payload: unknown): payload is ErrorResponse {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  return (
    "code" in payload &&
    "message" in payload &&
    "details" in payload &&
    "request_id" in payload
  );
}

function resolveAppApiBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_APP_API_BASE_URL?.trim();
  const browserFallbackBaseUrl = "";

  if (!configuredBaseUrl) {
    return browserFallbackBaseUrl;
  }

  if (typeof window === "undefined") {
    return configuredBaseUrl;
  }

  try {
    const configuredUrl = new URL(configuredBaseUrl);
    if (configuredUrl.hostname === "app-api") {
      return "";
    }
    return configuredBaseUrl;
  } catch {
    return browserFallbackBaseUrl;
  }
}

export const appApiBaseUrl = resolveAppApiBaseUrl();

export const apiClient = new ApiClient({
  baseUrl: appApiBaseUrl,
});
