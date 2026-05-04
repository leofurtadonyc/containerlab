# Frontend API Dependency Map

## A. Frontend-consumed backend APIs

Frontend client methods are implemented in `platform/app-web/src/api/client.ts`; TypeScript response contracts are in `platform/app-web/src/api/contracts.ts`; backend routes are included by `platform/app-api/src/app_api/api/v1/router.py`.

| Frontend method | Backend endpoint | HTTP | Request params/body | Response type | Backend schema/router | Views/actions using it | Loading/error handling | Contract drift risk | Rewrite requirement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `getPlatformStatus` | `/api/v1/platform/status` | GET | none | `PlatformStatusResponse` | `schemas/platform.py`, `routers/platform.py` | Overview, Platform Health | `useApiQuery`, retry cards | Medium | Preserve as core runtime posture. |
| `getDevices` | `/api/v1/devices` | GET | `limit`, `history_recent_limit` | `DevicesListResponse` | `schemas/devices.py`, `routers/devices.py` | Devices, Overview | `useApiQuery`, read-side echo | Medium | Preserve query echo and history semantics. |
| `getTopology` | `/api/v1/topology` | GET | none | `TopologyResponse` | `schemas/topology.py`, `routers/topology.py` | Topology, Overview | `useApiQuery` | Medium | Preserve topology coverage and object ids. |
| `getTopologyTruth` | `/api/v1/topology/truth` | GET | optional `truth_posture` | `TopologyTruthResponse` | `schemas/topology_truth.py`, `routers/topology.py` | Topology | feature loading/error | Medium | Preserve bounded multi-source truth copy. |
| `getControllerEvidence` | `/api/v1/controller/evidence` | GET | none | `ControllerEvidenceResponse` | `schemas/controller_evidence.py`, `routers/controller_evidence.py` | Platform Health, Topology | feature loading/error | Medium | Preserve ODL bounded-helper framing. |
| `getTopologyRiskSummary` | `/api/v1/topology/risk-summary` | GET | none | `TopologyRiskSummaryResponse` | `schemas/topology_risk_summary.py`, `routers/topology.py` | Overview, Topology, NOC | `useApiQuery` | Medium | Preserve “not traffic/SLA risk” copy. |
| `getTopologyObjectRelatedPolicies` | `/api/v1/topology/objects/{id}/related-policies` | GET | path `object_id` | `TopologyObjectRelatedPoliciesResponse` | `schemas/topology_related_policies.py`, `routers/topology.py` | Topology, Devices | panel loading/error | Medium | Preserve string-match limitation. |
| `getTopologyObjectFailureImpact` | `/api/v1/topology/objects/{id}/failure-impact` | GET | path `object_id` | `FailureImpactViewResponse` | `schemas/failure_impact.py`, `routers/topology.py` | Topology | panel loading/error | Medium | Preserve non-blast-radius copy. |
| `getTopologyObjectDossier` | `/api/v1/topology/objects/{id}/dossier` | GET | path `object_id` | `TopologyObjectDossierResponse` | `schemas/topology_object_dossier.py`, `routers/topology.py` | Topology dossier | panel loading/error | Medium | Preserve object workspace. |
| `getTopologyObjectEvidenceTimeline` | `/api/v1/topology/objects/{id}/evidence-timeline` | GET | path `object_id` | `TopologyObjectEvidenceTimelineResponse` | `schemas/topology_object_evidence_timeline.py`, `routers/topology.py` | Topology, topology dossier | panel loading/error | Medium | Preserve non-forensic chronology copy. |
| `getTopologyObjectEvidenceDelta` | `/api/v1/topology/objects/{id}/evidence-delta` | GET | path `object_id` | `TopologyObjectEvidenceDeltaResponse` | `schemas/topology_object_evidence_delta.py`, `routers/topology.py` | Topology, topology dossier | panel loading/error | Medium | Preserve non-drift verdict copy. |
| `getTopologyObjectStabilityProfile` | `/api/v1/topology/objects/{id}/stability-profile` | GET | path `object_id` | `TopologyObjectStabilityProfileResponse` | `schemas/topology_object_stability_profile.py`, `routers/topology_object_stability_profile.py` | Stability Workspace | optional profile loading | Medium | Preserve optional anchored profile. |
| `getPolicies` | `/api/v1/policies` | GET | `limit`, `history_recent_limit` | `PoliciesListResponse` | `schemas/policies.py`, `routers/policies.py` | Policies, Overview | `useApiQuery`, filters | Medium | Preserve degraded/history query semantics. |
| `getPolicyPathAnalysis` | `/api/v1/policies/{id}/path-analysis` | GET | path `policy_id` | `PathAnalysisViewResponse` | `schemas/path_analysis.py`, `routers/policies.py` | Policies, Path Explorer | panel loading/error/404 | Medium | Preserve non-dataplane proof copy. |
| `getPolicyTopologyImpact` | `/api/v1/policies/{id}/topology-impact` | GET | path `policy_id` | `PolicyTopologyImpactResponse` | `schemas/policy_topology_impact.py`, `routers/policies.py` | Policies | panel loading/error/404 | Medium | Preserve non-blast-radius copy. |
| `getPolicyEvidenceTimeline` | `/api/v1/policies/{id}/evidence-timeline` | GET | path `policy_id` | `PolicyEvidenceTimelineResponse` | `schemas/policy_evidence_timeline.py`, `routers/policies.py` | Policies, history drilldowns | panel loading/error/404 | Medium | Preserve timeline focus params. |
| `getPolicyEvidenceDelta` | `/api/v1/policies/{id}/evidence-delta` | GET | path `policy_id` | `PolicyEvidenceDeltaResponse` | `schemas/policy_evidence_delta.py`, `routers/policies.py` | Policies | panel loading/error/404 | Medium | Preserve comparison-status honesty. |
| `getPolicyDossier` | `/api/v1/policies/{id}/dossier` | GET | path `policy_id` | `PolicyDossierResponse` | `schemas/policy_dossier.py`, `routers/policies.py` | Policies, briefing/export | panel loading/error/404 | Medium | Preserve workspace mode. |
| `getPolicyExplainability` | `/api/v1/policies/{id}/explainability` | GET | path `policy_id` | `PolicyExplainabilityResponse` | `schemas/policy_explainability.py`, `routers/policies.py` | Policies, Path Explorer | panel loading/error/404 | Medium | Preserve candidate/unknown states. |
| `getServices` | `/api/v1/services` | GET | optional `limit` | `ServicesListResponse` | `schemas/service_explorer.py`, `routers/services.py` | Service Explorer | list loading/error | Medium-high | Preserve service id encoding and catch-all route order. |
| `getService` | `/api/v1/services/{service_id}` | GET | path service id | `ServiceDetailResponse` | same | Service Explorer | detail loading/error | Medium-high | Preserve URL encoding for `policy:` ids. |
| `getServiceDossier` | `/api/v1/services/{service_id}/dossier` | GET | path service id | `ServiceDossierResponse` | `schemas/service_dossier.py`, `routers/services.py` | Service Dossier | view loading/error | Medium-high | Router ordering risk; preserve. |
| `getServiceEvidenceTimeline` | `/api/v1/services/{service_id}/evidence-timeline` | GET | path service id | `ServiceEvidenceTimelineResponse` | `schemas/service_evidence_timeline.py`, `routers/services.py` | Service Explorer/Dossier | panel loading/error | Medium-high | Preserve route path before catch-all assumptions. |
| `getServiceEvidenceDelta` | `/api/v1/services/{service_id}/evidence-delta` | GET | path service id | `ServiceEvidenceDeltaResponse` | `schemas/service_evidence_delta.py`, `routers/services.py` | Service Explorer/Dossier | panel loading/error | Medium-high | Preserve comparison-status copy. |
| `getServiceStabilityProfile` | `/api/v1/services/{service_id}/stability-profile` | GET | path service id | `ServiceStabilityProfileResponse` | `schemas/service_stability_profile.py`, `routers/service_stability_profile.py` | Stability Workspace | optional profile loading | High | Must remain registered before catch-all route. |
| `getPathExplorerWorkspace` | `/api/v1/path-explorer` | GET | `policy_id` | `PathExplorerWorkspaceResponse` | `schemas/path_explorer.py`, `routers/path_explorer.py` | Path Explorer | view loading/error | Medium | Preserve path-explorer policy anchor. |
| `getServiceImpactWorkspace` | `/api/v1/service-impact-workspace` | GET | `service_id` | `ServiceImpactWorkspaceResponse` | `schemas/service_impact_workspace.py`, `routers/service_impact_workspace.py` | Service Impact | view loading/error | Medium | Preserve non-blast-radius framing. |
| `getCapabilities` | `/api/v1/capabilities` | GET | none | `CapabilitiesListResponse` | `schemas/capabilities.py`, `routers/capabilities.py` | Capabilities, Readiness, Overview | `useApiQuery` | Medium | Preserve capability/readiness links. |
| `getWorkflowHistory` | `/api/v1/workflow-history` | GET | read-side limits | `WorkflowHistoryResponse` | `schemas/workflow_history.py`, `routers/workflow_history.py` | Workflows | `useApiQuery`, drilldowns | Medium | Preserve distinction from lifecycle. |
| `getAuditHistory` | `/api/v1/audit-history` | GET | read-side limits | `AuditHistoryResponse` | `schemas/audit_history.py`, `routers/audit_history.py` | Audit | `useApiQuery`, drilldowns | Medium | Preserve bounded audit copy. |
| `getWorkflowLifecycleList/Detail/Timeline` | `/api/v1/workflow-lifecycle...` | GET | limit/path id | workflow lifecycle types | `schemas/workflow_lifecycle.py`, `routers/workflow_lifecycle.py` | Workflow Lifecycle, Safe Action prerequisites | loading/error | High | Preserve lifecycle state model. |
| `createWorkflowLifecycle` | `/api/v1/workflow-lifecycle` | POST | workflow body | `WorkflowLifecycleDetailResponse` | same | Workflow Lifecycle, Safe Action demo | local busy/error | High | State-changing; preserve bounded record copy. |
| `transitionWorkflowLifecycle` | `/api/v1/workflow-lifecycle/{id}/transitions` | POST | next status body | `WorkflowLifecycleDetailResponse` | same | Workflow Lifecycle, Safe Action demo | local busy/error | High | State-changing; preserve status gates. |
| `getPreview*`, `createPreview` | `/api/v1/previews...` | GET/POST | limit/path/body | preview types | `schemas/preview_engine.py`, `routers/preview_engine.py` | Preview Workspace, Safe Action | local or query loading/error | High | Preserve v1 static_local preview boundary. |
| `getValidation*`, `createValidation` | `/api/v1/validations...` | GET/POST | limit/path/body | validation types | `schemas/validation_engine.py`, `routers/validation_engine.py` | Validation Workspace, Safe Action, Rollback | local or query loading/error | High | Preserve “not proof/approval” copy. |
| `getSafeAction*`, `create/approve/reject/execute/cancelSafeAction`, `getActionSafetyCase` | `/api/v1/actions...` | GET/POST | path/body | safe action types | `schemas/safe_actions.py`, `schemas/action_safety_case.py`, `routers/safe_actions.py` | Safe Action | local busy/error, disabled buttons | Critical | Preserve platform-only effect and gates. |
| `getRollback*`, `create/approve/reject/execute/cancelRollback` | `/api/v1/rollbacks...` | GET/POST | path/body | rollback types | `schemas/rollback_orchestration.py`, `routers/rollback_orchestration.py` | Rollback | local busy/error, disabled buttons | Critical | Preserve compensation-only semantics. |
| `getRecentChangeSummary` | `/api/v1/change-intelligence/recent-summary` | GET | `sync_runs_limit` | `RecentChangeSummaryResponse` | `schemas/change_intelligence.py`, `routers/change_intelligence.py` | Overview, Platform Health | `useApiQuery` | Medium | Preserve no root cause/no safe-to-change claims. |
| `getInvestigationWorkspaceContext` | `/api/v1/investigation-workspace/context` | GET | `sync_runs_limit` | `InvestigationContextAssemblyResponse` | `schemas/investigation_workspace.py`, `routers/investigation_workspace.py` | Investigation | `useApiQuery` | Medium | Preserve read-only assembly semantics. |
| `getEvidencePackSituation` | `/api/v1/evidence-pack/situation` | GET | `sync_runs_limit` | `SituationPackAssemblyResponse` | `schemas/evidence_pack.py`, `routers/evidence_pack.py` | Situation Room | `useApiQuery` | Medium | Preserve evidence-pack non-claims. |
| `getDeltaDigest` | `/api/v1/delta-digest` | GET | `sync_runs_limit` | `CrossDomainDeltaDigestResponse` | `schemas/delta_digest.py`, `routers/delta_digest.py` | Delta Digest, Overview | `useApiQuery` | Medium | Preserve non-causal digest copy. |
| `getEvidenceConsistencySummary` | `/api/v1/evidence-consistency/summary` | GET | `sync_runs_limit` | `EvidenceConsistencySummaryResponse` | `schemas/evidence_consistency_summary.py`, `routers/evidence_consistency.py` | Evidence Consistency, Overview | `useApiQuery` | Medium | Preserve not-validation/not-drift truth. |
| `getOperationalStabilitySummary` | `/api/v1/stability/summary` | GET | `sync_runs_limit` | `OperationalStabilitySummaryResponse` | `schemas/operational_stability_summary.py`, `routers/operational_stability_summary.py` | Stability, Overview | `useApiQuery` | Medium | Preserve not prediction authority. |
| `getEvidenceQualityWorkspace` | `/api/v1/evidence-quality-workspace` | GET | `sync_runs_limit` | `EvidenceQualitySummaryResponse` | `schemas/evidence_quality_workspace.py`, `routers/evidence_quality_workspace.py` | Evidence Quality, Overview | `useApiQuery` | Medium | Preserve collection/read-path framing. |
| `getEvidenceWeaknessExplanation` | `/api/v1/evidence-weakness-explanation` | GET | `sync_runs_limit` | `EvidenceWeaknessExplanationResponse` | `schemas/evidence_weakness_explanation.py`, `routers/evidence_weakness_explanation.py` | Evidence Quality | `useApiQuery`, panel fallback | Medium | Current code consumes this; preserve next-best pivots. |
| `getMaintenancePreview` | `/api/v1/maintenance-preview` | GET | subject selectors + `preview_context` | `MaintenancePreviewResponse` | `schemas/maintenance_preview.py`, `routers/maintenance_preview.py` | Maintenance Preview | view loading/error | Medium | Preserve selector validation and non-simulation copy. |
| `getMaintenanceEvidenceWorkspace` | `/api/v1/maintenance-evidence-workspace` | GET | same subject selectors | `MaintenanceEvidenceWorkspaceResponse` | `schemas/maintenance_evidence_workspace.py`, `routers/maintenance_evidence_workspace.py` | Maintenance Evidence | view loading/error | Medium | Preserve nested contracts. |
| `getMaintenanceWindowWorkspace` | `/api/v1/maintenance-window-workspace` | GET | repeated `subject`, `preview_context`, `sync_runs_limit` | `MaintenanceWindowWorkspaceResponse` | `schemas/maintenance_window_workspace.py`, `routers/maintenance_window_workspace.py` | Maintenance Window | view loading/error | High | Preserve repeated subject semantics. |
| `getOperatorSearch` | `/api/v1/operator-search` | GET | `q` | `OperatorSearchResponse` | `schemas/operator_search.py`, `routers/operator_search.py` | Global search | inline loading/error/no hits | Medium | Preserve navigation-first search. |
| `getOperatorBriefing` | `/api/v1/operator-briefing` | GET | sync/context params | `OperatorBriefingWorkspaceResponse` | `schemas/operator_briefing.py`, `routers/operator_briefing.py` | Operator Briefing | view loading/error | Medium | Preserve context echo and exports. |
| Report methods | `/api/v1/reports/...` | GET | service/policy/maintenance selectors | `ImpactReportResponse` / `ChangeSafetyCaseResponse` | `schemas/impact_report.py`, `schemas/change_safety_case.py` | Impact Report, Change Safety Case | view/download loading/error | High | Preserve `/reports` vs `/exports`. |

## B. Download-only backend APIs consumed outside `ApiClient`

| Helper | Backend endpoint | Source file | Views using it | Notes |
| --- | --- | --- | --- | --- |
| `buildEvidenceExportRequestPath` / `downloadEvidenceExport` | `/api/v1/exports/policies/{id}/dossier`, `/topology-objects/{id}/dossier`, `/situation-room/summary`, `/investigation-workspace/summary`, `/operator-briefing` | `platform/app-web/src/lib/evidence-export-download.ts` | Dossiers, Situation, Investigation, Operator Briefing | Evidence export/bundle downloads; not reports. |
| `buildImpactReportRequestPath` / `downloadImpactReport` | `/api/v1/reports/service-impact`, `/policy-impact`, `/maintenance-impact` | `platform/app-web/src/lib/impact-report-download.ts` | Impact Report | Report download, not evidence export. |
| `buildChangeSafetyCaseRequestPath` / `downloadChangeSafetyCase` | `/api/v1/reports/change-safety-case/policy`, `/service`, `/maintenance` | `platform/app-web/src/lib/change-safety-case-download.ts` | Change Safety Case | CSC report download; replay rejects root. |
| Maintenance handoff download path | `/api/v1/exports/maintenance-window-handoff` | maintenance-window workspace files | Maintenance Window | Handoff export distinct from workspace live view. |

## C. Product-facing backend APIs not consumed, or only partially consumed

Current source inspection found `GET /api/v1/evidence-weakness-explanation` **is consumed** by `platform/app-web/src/features/evidence-quality-workspace/api.ts` and rendered by `platform/app-web/src/features/evidence-quality-workspace/view.tsx`. Older drift docs that said it was unwired should be treated as stale for the current frontend.

Backend APIs that appear product-facing but are not primary WebUI views:

| Backend endpoint | Source router | Likely product domain | Should rewrite consume it? | Evidence |
| --- | --- | --- | --- | --- |
| `/api/v1/controller/evidence/bgpls` | `routers/controller_evidence.py` | Controller lane detail | Unknown/no unless lane-specific UI is desired | `ApiClient` consumes aggregate `/controller/evidence`; lane-only methods not found. |
| `/api/v1/controller/evidence/pcep` | same | Controller lane detail | Unknown/no | Same. |
| `/api/v1/controller/evidence/netconf` | same | Controller lane detail | Unknown/no | Same. |
| `/api/v1/health` | `routers/health.py` | Runtime health | Usually no; platform health uses `/platform/status` | Not in `ApiClient`; nginx/runtime may use it. |
| `/api/v1/previews`, `/validations`, `/actions`, `/rollbacks` list/detail routes | respective routers | Workflow/action inspection | Partial | Client methods exist; current views focus mostly creation/detail JSON rather than full list explorers for preview/validation/action/rollback. |

## D. Manual contract synchronization risks

`platform/app-web/src/api/contracts.ts` manually mirrors Pydantic schemas under `platform/app-api/src/app_api/schemas/`. The frontend does not generate types from FastAPI OpenAPI. Drift can occur when:

- backend response fields change without updating frontend types;
- a backend route is added without a client method or documented backend-only status;
- route ordering changes under `/services/{service_id:path}`;
- download helpers add paths outside `ApiClient` and escape generic path checks;
- safety copy in frontend implies semantics broader than backend contract fields.

Rewrite requirement: either generate frontend contracts from OpenAPI or add a checked route-to-client inventory with explicit allowlisted backend-only endpoints. The backend schemas remain the product truth.

## Validation performed

Files inspected: `platform/app-web/src/api/client.ts`, `platform/app-web/src/api/contracts.ts`, all feature `api.ts` files found by search, `platform/app-api/src/app_api/api/v1/router.py`, backend route decorators in `platform/app-api/src/app_api/routers/*.py`.

Searches performed: `async` methods in `ApiClient`, `apiClient.*` usage, backend `@router.get/post`, evidence weakness usage.

Known blind spots: This map does not list every field in every response schema; it maps endpoint dependencies and rewrite risk.

Confidence level: High for endpoint/method mapping; medium for backend-only intent.

Recommended follow-up inspection: create an automated OpenAPI/client coverage check before starting the rewrite.
