# Frontend Phase 0 API, Contract, and Endpoint Inventory

This Phase 0 appendix supports the frontend rewrite parity baseline. It enumerates current frontend API methods, download/report/export helpers, backend endpoint posture, and contract-risk families.

Status: **complete for Phase 0**. The `ApiClient` method list is enumerated from `platform/app-web/src/api/client.ts`; `platform/app-web/docs/frontend-phase0-contract-export-index.md` contains the exact TypeScript AST export index for all 316 `contracts.ts` exports, backend schema class-name matches, and direct `ApiClient` response usage. Phase 1 converted this inventory into executable API, backend-route-posture, download/report/export, and contract guardrail tests.

## Summary

| Area | Count / posture | Source |
| --- | --- | --- |
| `ApiClient` async methods | 70 methods | `platform/app-web/src/api/client.ts` |
| Download helper families outside `ApiClient` | 3 major families plus maintenance handoff/replay paths | `platform/app-web/src/lib/*download*.ts`, export/report components |
| Frontend contract exports | 316 exact AST-indexed exports | `platform/app-web/docs/frontend-phase0-contract-export-index.md` |
| Backend router files | 37 files | `platform/app-api/src/app_api/routers/` |

## `ApiClient` Method Inventory

| Method | HTTP | Endpoint / path family | Params/body | Response type | Initial posture |
| --- | --- | --- | --- | --- | --- |
| `getPlatformStatus` | GET | `/api/v1/platform/status` | none | `PlatformStatusResponse` | consumed |
| `getDevices` | GET | `/api/v1/devices` | `limit`, `history_recent_limit` | `DevicesListResponse` | consumed |
| `getTopology` | GET | `/api/v1/topology` | none | `TopologyResponse` | consumed |
| `getTopologyTruth` | GET | `/api/v1/topology/truth` | `truth_posture` | `TopologyTruthResponse` | consumed |
| `getControllerEvidence` | GET | `/api/v1/controller/evidence` | none | `ControllerEvidenceResponse` | consumed |
| `getTopologyObjectRelatedPolicies` | GET | `/api/v1/topology/objects/{id}/related-policies` | `objectId` | `TopologyObjectRelatedPoliciesResponse` | consumed |
| `getTopologyObjectFailureImpact` | GET | `/api/v1/topology/objects/{id}/failure-impact` | `objectId` | `FailureImpactViewResponse` | consumed |
| `getMaintenancePreview` | GET | `/api/v1/maintenance-preview` | maintenance subject query | `MaintenancePreviewResponse` | consumed |
| `getMaintenanceEvidenceWorkspace` | GET | `/api/v1/maintenance-evidence-workspace` | maintenance subject query | `MaintenanceEvidenceWorkspaceResponse` | consumed |
| `getMaintenanceWindowWorkspace` | GET | `/api/v1/maintenance-window-workspace` | repeated subject query | `MaintenanceWindowWorkspaceResponse` | consumed |
| `getServiceImpactReport` | GET | `/api/v1/reports/service-impact` | `service_id` | `ImpactReportResponse` | consumed |
| `getPolicyImpactReport` | GET | `/api/v1/reports/policy-impact` | `policy_id` | `ImpactReportResponse` | consumed |
| `getMaintenanceImpactReport` | GET | `/api/v1/reports/maintenance-impact` | maintenance subject query | `ImpactReportResponse` | consumed |
| `getPolicyChangeSafetyCase` | GET | `/api/v1/reports/change-safety-case/policy` | `policy_id` | `ChangeSafetyCaseResponse` | consumed |
| `getServiceChangeSafetyCase` | GET | `/api/v1/reports/change-safety-case/service` | `service_id` | `ChangeSafetyCaseResponse` | consumed |
| `getTopologyChangeSafetyCase` | GET | `/api/v1/reports/change-safety-case/maintenance` | maintenance subject query | `ChangeSafetyCaseResponse` | consumed |
| `getTopologyRiskSummary` | GET | `/api/v1/topology/risk-summary` | none | `TopologyRiskSummaryResponse` | consumed |
| `getTopologyObjectDossier` | GET | `/api/v1/topology/objects/{id}/dossier` | `objectId` | `TopologyObjectDossierResponse` | consumed |
| `getTopologyObjectEvidenceTimeline` | GET | `/api/v1/topology/objects/{id}/evidence-timeline` | `objectId` | `TopologyObjectEvidenceTimelineResponse` | consumed |
| `getTopologyObjectEvidenceDelta` | GET | `/api/v1/topology/objects/{id}/evidence-delta` | `objectId` | `TopologyObjectEvidenceDeltaResponse` | consumed |
| `getPolicies` | GET | `/api/v1/policies` | `limit`, `history_recent_limit` | `PoliciesListResponse` | consumed |
| `getServices` | GET | `/api/v1/services` | optional `limit` | `ServicesListResponse` | consumed |
| `getService` | GET | `/api/v1/services/{service_id}` | `serviceId` | `ServiceDetailResponse` | consumed |
| `getServiceDossier` | GET | `/api/v1/services/{service_id}/dossier` | `serviceId` | `ServiceDossierResponse` | consumed |
| `getServiceEvidenceTimeline` | GET | `/api/v1/services/{service_id}/evidence-timeline` | `serviceId` | `ServiceEvidenceTimelineResponse` | consumed |
| `getServiceEvidenceDelta` | GET | `/api/v1/services/{service_id}/evidence-delta` | `serviceId` | `ServiceEvidenceDeltaResponse` | consumed |
| `getPolicyPathAnalysis` | GET | `/api/v1/policies/{policy_id}/path-analysis` | `policyId` | `PathAnalysisViewResponse` | consumed |
| `getPolicyTopologyImpact` | GET | `/api/v1/policies/{policy_id}/topology-impact` | `policyId` | `PolicyTopologyImpactResponse` | consumed |
| `getPolicyEvidenceTimeline` | GET | `/api/v1/policies/{policy_id}/evidence-timeline` | `policyId` | `PolicyEvidenceTimelineResponse` | consumed |
| `getPolicyEvidenceDelta` | GET | `/api/v1/policies/{policy_id}/evidence-delta` | `policyId` | `PolicyEvidenceDeltaResponse` | consumed |
| `getPolicyDossier` | GET | `/api/v1/policies/{policy_id}/dossier` | `policyId` | `PolicyDossierResponse` | consumed |
| `getPolicyExplainability` | GET | `/api/v1/policies/{policy_id}/explainability` | `policyId` | `PolicyExplainabilityResponse` | consumed |
| `getPathExplorerWorkspace` | GET | `/api/v1/path-explorer` | `policy_id` | `PathExplorerWorkspaceResponse` | consumed |
| `getServiceImpactWorkspace` | GET | `/api/v1/service-impact-workspace` | `service_id` | `ServiceImpactWorkspaceResponse` | consumed |
| `getWorkflowHistory` | GET | `/api/v1/workflow-history` | read-side query | `WorkflowHistoryResponse` | consumed |
| `getWorkflowLifecycleList` | GET | `/api/v1/workflow-lifecycle` | `limit` | `WorkflowLifecycleListResponse` | consumed |
| `getWorkflowLifecycleDetail` | GET | `/api/v1/workflow-lifecycle/{id}` | `workflowId` | `WorkflowLifecycleDetailResponse` | consumed |
| `getWorkflowLifecycleTimeline` | GET | `/api/v1/workflow-lifecycle/{id}/timeline` | `workflowId` | `WorkflowLifecycleTimelineResponse` | consumed |
| `createWorkflowLifecycle` | POST | `/api/v1/workflow-lifecycle` | workflow body | `WorkflowLifecycleDetailResponse` | state-changing consumed |
| `transitionWorkflowLifecycle` | POST | `/api/v1/workflow-lifecycle/{id}/transitions` | transition body | `WorkflowLifecycleDetailResponse` | state-changing consumed |
| `getPreviewList` | GET | `/api/v1/previews` | `limit` | `PreviewListResponse` | consumed |
| `getPreviewDetail` | GET | `/api/v1/previews/{id}` | `previewId` | `PreviewDetailResponse` | consumed |
| `getPreviewDiff` | GET | `/api/v1/previews/{id}/diff` | `previewId` | `PreviewDiffResponse` | consumed |
| `getPreviewTimeline` | GET | `/api/v1/previews/{id}/timeline` | `previewId` | `PreviewTimelineResponse` | consumed |
| `createPreview` | POST | `/api/v1/previews` | preview body | `PreviewDetailResponse` | state-changing consumed |
| `getValidationList` | GET | `/api/v1/validations` | `limit` | `ValidationListResponse` | consumed |
| `getValidationDetail` | GET | `/api/v1/validations/{id}` | `validationId` | `ValidationDetailResponse` | consumed |
| `getValidationTimeline` | GET | `/api/v1/validations/{id}/timeline` | `validationId` | `ValidationTimelineResponse` | consumed |
| `createValidation` | POST | `/api/v1/validations` | validation body | `ValidationDetailResponse` | state-changing consumed |
| `getSafeActionList` | GET | `/api/v1/actions` | `limit` | `SafeActionListResponse` | client method; UI posture must be verified |
| `getSafeActionDetail` | GET | `/api/v1/actions/{id}` | `actionId` | `SafeActionDetailResponse` | backend-only helper in Phase 1 |
| `getSafeActionTimeline` | GET | `/api/v1/actions/{id}/timeline` | `actionId` | `SafeActionTimelineResponse` | client method; UI posture must be verified |
| `getActionSafetyCase` | GET | `/api/v1/actions/{id}/safety-case` | `actionId` | `ActionSafetyCaseResponse` | consumed |
| `createSafeAction` | POST | `/api/v1/actions` | action body | `SafeActionDetailResponse` | state-changing consumed |
| `approveSafeAction` | POST | `/api/v1/actions/{id}/approve` | approval body | `SafeActionDetailResponse` | state-changing consumed |
| `rejectSafeAction` | POST | `/api/v1/actions/{id}/reject` | rejection body | `SafeActionDetailResponse` | backend-only helper in Phase 1 |
| `executeSafeAction` | POST | `/api/v1/actions/{id}/execute` | actor body | `SafeActionDetailResponse` | state-changing consumed |
| `cancelSafeAction` | POST | `/api/v1/actions/{id}/cancel` | cancel body | `SafeActionDetailResponse` | backend-only helper in Phase 1 |
| `getRollbackList` | GET | `/api/v1/rollbacks` | `limit` | `RollbackListResponse` | client method; UI posture must be verified |
| `getRollbackDetail` | GET | `/api/v1/rollbacks/{id}` | `rollbackId` | `RollbackDetailResponse` | backend-only helper in Phase 1 |
| `getRollbackTimeline` | GET | `/api/v1/rollbacks/{id}/timeline` | `rollbackId` | `RollbackTimelineResponse` | client method; UI posture must be verified |
| `createRollback` | POST | `/api/v1/rollbacks` | rollback body | `RollbackDetailResponse` | state-changing consumed |
| `approveRollback` | POST | `/api/v1/rollbacks/{id}/approve` | approval body | `RollbackDetailResponse` | state-changing consumed |
| `rejectRollback` | POST | `/api/v1/rollbacks/{id}/reject` | rejection body | `RollbackDetailResponse` | backend-only helper in Phase 1 |
| `executeRollback` | POST | `/api/v1/rollbacks/{id}/execute` | actor body | `RollbackDetailResponse` | state-changing consumed |
| `cancelRollback` | POST | `/api/v1/rollbacks/{id}/cancel` | cancel body | `RollbackDetailResponse` | backend-only helper in Phase 1 |
| `getAuditHistory` | GET | `/api/v1/audit-history` | read-side query | `AuditHistoryResponse` | consumed |
| `getCapabilities` | GET | `/api/v1/capabilities` | none | `CapabilitiesListResponse` | consumed |
| `getRecentChangeSummary` | GET | `/api/v1/change-intelligence/recent-summary` | `sync_runs_limit` | `RecentChangeSummaryResponse` | consumed |
| `getDeltaDigest` | GET | `/api/v1/delta-digest` | `sync_runs_limit` | `CrossDomainDeltaDigestResponse` | consumed |
| `getEvidenceConsistencySummary` | GET | `/api/v1/evidence-consistency/summary` | `sync_runs_limit` | `EvidenceConsistencySummaryResponse` | consumed |
| `getOperationalStabilitySummary` | GET | `/api/v1/stability/summary` | `sync_runs_limit` | `OperationalStabilitySummaryResponse` | consumed |
| `getEvidenceQualityWorkspace` | GET | `/api/v1/evidence-quality-workspace` | `sync_runs_limit` | `EvidenceQualitySummaryResponse` | consumed |
| `getEvidenceWeaknessExplanation` | GET | `/api/v1/evidence-weakness-explanation` | `sync_runs_limit` | `EvidenceWeaknessExplanationResponse` | consumed |
| `getTopologyObjectStabilityProfile` | GET | `/api/v1/topology/objects/{id}/stability-profile` | `objectId` | `TopologyObjectStabilityProfileResponse` | consumed |
| `getServiceStabilityProfile` | GET | `/api/v1/services/{service_id}/stability-profile` | `serviceId` | `ServiceStabilityProfileResponse` | consumed |
| `getInvestigationWorkspaceContext` | GET | `/api/v1/investigation-workspace/context` | `sync_runs_limit` | `InvestigationContextAssemblyResponse` | consumed |
| `getEvidencePackSituation` | GET | `/api/v1/evidence-pack/situation` | `sync_runs_limit` | `SituationPackAssemblyResponse` | consumed |
| `getOperatorSearch` | GET | `/api/v1/operator-search` | `q` | `OperatorSearchResponse` | consumed |
| `getOperatorBriefing` | GET | `/api/v1/operator-briefing` | sync/context params | `OperatorBriefingWorkspaceResponse` | consumed |

## Download, Export, Report, and Replay Matrix

| Family | Helper/source | Endpoint path family | Formats | Filename behavior | Rewrite requirement |
| --- | --- | --- | --- | --- | --- |
| Evidence export: policy dossier | `buildEvidenceExportRequestPath` in `src/lib/evidence-export-download.ts` | `/api/v1/exports/policies/{policy_id}/dossier` | `json`, `markdown` | `evidence-export-policy-{id}-{timestamp}.{json|md}` | Preserve as `/exports`, not `/reports`. |
| Evidence export: topology object dossier | same | `/api/v1/exports/topology-objects/{object_id}/dossier` | `json`, `markdown` | `evidence-export-topology-{id}-{timestamp}.{json|md}` | Preserve object id encoding. |
| Evidence export: situation room | same | `/api/v1/exports/situation-room/summary` | `json`, `markdown` | `evidence-export-situation-room-sync{limit}-{timestamp}.{json|md}` | Preserve `sync_runs_limit`. |
| Evidence export: investigation | same | `/api/v1/exports/investigation-workspace/summary` | `json`, `markdown` | `evidence-export-investigation-sync{limit}-{timestamp}.{json|md}` | Preserve `sync_runs_limit`. |
| Operator briefing bundle | same | `/api/v1/exports/operator-briefing` | `json`, `markdown` | `briefing-export-bundle-sync{limit}-{timestamp}.{json|md}` | Preserve briefing bundle identity. |
| Impact report: service | `buildImpactReportRequestPath` in `src/lib/impact-report-download.ts` | `/api/v1/reports/service-impact` | `json`, `markdown` | `impact-report-service-{id}-{timestamp}.{json|md}` | Preserve `/reports` boundary. |
| Impact report: policy | same | `/api/v1/reports/policy-impact` | `json`, `markdown` | `impact-report-policy-{id}-{timestamp}.{json|md}` | Preserve `/reports` boundary. |
| Impact report: maintenance | same | `/api/v1/reports/maintenance-impact` | `json`, `markdown` | `impact-report-maintenance-{subject}-{timestamp}.{json|md}` | Preserve maintenance subject params. |
| Change safety case: policy | `buildChangeSafetyCaseRequestPath` in `src/lib/change-safety-case-download.ts` | `/api/v1/reports/change-safety-case/policy` | `json`, `markdown` | `change-safety-case-policy-{id}-{timestamp}.{json|md}` | Preserve CSC non-claim copy. |
| Change safety case: service | same | `/api/v1/reports/change-safety-case/service` | `json`, `markdown` | `change-safety-case-service-{id}-{timestamp}.{json|md}` | Preserve CSC non-claim copy. |
| Change safety case: maintenance | same | `/api/v1/reports/change-safety-case/maintenance` | `json`, `markdown` | `change-safety-case-topology-{subject}-{timestamp}.{json|md}` | Preserve maintenance/topology selector mapping. |
| Maintenance window handoff | maintenance window workspace/export helpers | `/api/v1/exports/maintenance-window-handoff` | export-defined | handoff-specific | Preserve distinct from live workspace and reports. |
| Evidence replay | `src/lib/evidence-replay/` and replay tests | local import + live pivots | imported envelope | no download | Preserve frozen/offline import and unsupported-root rejection. |

## Backend Endpoint Posture

| Backend router/source | Endpoint family | Initial posture |
| --- | --- | --- |
| `routers/platform.py` | `/api/v1/platform/status` | consumed |
| `routers/health.py` | `/api/v1/health` | runtime/backend-only for WebUI unless explicitly surfaced |
| `routers/devices.py` | `/api/v1/devices` | consumed |
| `routers/topology.py` | `/api/v1/topology`, `/topology/truth`, `/topology/risk-summary`, `/topology/objects/*` | consumed |
| `routers/controller_evidence.py` | `/api/v1/controller/evidence` | aggregate consumed |
| `routers/controller_evidence.py` | `/api/v1/controller/evidence/bgpls`, `/pcep`, `/netconf` | backend-only/lane-only unless lane UI added |
| `routers/policies.py` | `/api/v1/policies`, policy detail families | consumed |
| `routers/services.py` | `/api/v1/services`, service detail/timeline/delta/stability/dossier | consumed; route ordering high-risk |
| `routers/service_stability_profile.py` | service stability profile | consumed |
| `routers/topology_object_stability_profile.py` | topology object stability profile | consumed |
| `routers/path_explorer.py` | `/api/v1/path-explorer` | consumed |
| `routers/service_impact_workspace.py` | `/api/v1/service-impact-workspace` | consumed |
| `routers/maintenance_preview.py` | `/api/v1/maintenance-preview` | consumed |
| `routers/maintenance_evidence_workspace.py` | `/api/v1/maintenance-evidence-workspace` | consumed |
| `routers/maintenance_window_workspace.py` | `/api/v1/maintenance-window-workspace` | consumed |
| `routers/reports.py` | impact report endpoints | consumed via client and download helpers |
| `routers/change_safety_case.py` | change safety case endpoints | consumed via client and download helpers |
| `routers/exports.py` | evidence exports, briefing bundle, maintenance handoff | download-only consumed |
| `routers/workflow_history.py` | `/api/v1/workflow-history` | consumed |
| `routers/audit_history.py` | `/api/v1/audit-history` | consumed |
| `routers/workflow_lifecycle.py` | `/api/v1/workflow-lifecycle...` | consumed; state-changing |
| `routers/preview_engine.py` | `/api/v1/previews...` | consumed; state-changing create |
| `routers/validation_engine.py` | `/api/v1/validations...` | consumed; state-changing create |
| `routers/safe_actions.py` | `/api/v1/actions...` | consumed; highest-risk state-changing |
| `routers/rollback_orchestration.py` | `/api/v1/rollbacks...` | consumed; highest-risk state-changing |
| `routers/change_intelligence.py` | `/api/v1/change-intelligence/recent-summary` | consumed |
| `routers/delta_digest.py` | `/api/v1/delta-digest` | consumed |
| `routers/evidence_consistency.py` | `/api/v1/evidence-consistency/summary` | consumed |
| `routers/evidence_quality_workspace.py` | `/api/v1/evidence-quality-workspace` | consumed |
| `routers/evidence_weakness_explanation.py` | `/api/v1/evidence-weakness-explanation` | consumed |
| `routers/operational_stability_summary.py` | stability summary | consumed |
| `routers/investigation_workspace.py` | investigation context | consumed |
| `routers/evidence_pack.py` | situation pack | consumed |
| `routers/operator_briefing.py` | operator briefing | consumed |
| `routers/operator_search.py` | operator search | consumed |
| `routers/capabilities.py` | capabilities | consumed |
| `routers/readiness_snapshot_history.py` | readiness snapshot history | backend/product-facing; frontend posture needs verification |

## Contract Risk Families

The current manual `contracts.ts` mirror should be replaced by generation or guarded by drift checks. High-risk export families include:

| Contract family | Examples | Risk |
| --- | --- | --- |
| Platform/read-path metadata | `ApiResponseMetadata`, `ReadSideQueryEcho`, `PlatformStatusResponse` | Losing query echo or degraded posture copy. |
| Topology truth/controller evidence | `TopologyTruthResponse`, `ControllerEvidenceResponse`, lane/posture unions | Overclaiming topology/controller truth. |
| Policy/path/explainability | `PathAnalysisViewResponse`, `PolicyDossierResponse`, `PolicyExplainabilityResponse` | Overclaiming dataplane proof or workflow authority. |
| Evidence timeline/delta | policy/service/topology timeline and delta types | Overclaiming forensic chronology or drift truth. |
| Maintenance | `MaintenancePreviewResponse`, `MaintenanceEvidenceWorkspaceResponse`, `MaintenanceWindowWorkspaceResponse` | Losing sparse/selector/preview-context semantics. |
| Reports/CSC | `ImpactReportResponse`, `ChangeSafetyCaseResponse` | Confusing reports with exports or safety proof. |
| Preview/validation | `Preview*`, `Validation*` | Treating preview/validation as execution/proof/approval. |
| Safe action | `SafeAction*`, `ActionSafetyCase*` | Losing platform-only action gates. |
| Rollback | `Rollback*` | Losing compensation-only rollback gates. |
| Evidence quality/weakness/stability | `EvidenceQuality*`, `EvidenceWeakness*`, `OperationalStability*` | Overclaiming root cause, prediction, or validation. |
| Operator search/briefing/replay | `OperatorSearch*`, `OperatorBriefing*`, evidence export/replay types | Losing navigation-first search and frozen/live distinction. |

## Phase 0 Closure

- Exact `contracts.ts` export index: complete in `platform/app-web/docs/frontend-phase0-contract-export-index.md`.
- API path tests: complete in `platform/app-web/tests/frontend-phase1-api-parity.test.ts`.
- Backend route posture coverage: complete in `platform/app-web/tests/frontend-phase1-backend-route-posture.test.ts`.
- Contract guardrail decision: complete in `platform/app-web/tests/frontend-phase1-contract-guardrail.test.ts`; Phase 1 uses drift-check first and defers generated OpenAPI clients until after route/API parity remains green.
