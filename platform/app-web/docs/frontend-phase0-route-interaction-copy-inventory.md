# Frontend Phase 0 Route, Interaction, and Safety-Copy Inventory

This Phase 0 appendix captures the current route model, route params, navigation helpers, meaningful interaction families, and safety-copy anchors that must be preserved or tested during the frontend rewrite.

Status: **complete for Phase 0**. Route and param inventories are source-backed here; `platform/app-web/docs/frontend-phase0-jsx-interaction-inventory.md` contains the AST-generated inventory of all JSX control elements; `platform/app-web/docs/frontend-phase0-safety-copy-source-anchors.md` contains exact high-risk copy source anchors. Phase 1 converted the route, interaction, copy, download/report/export, and state-changing posture follow-ups into executable parity tests.

## Current Route Model

The current app uses query-string routing:

- active route key: `view`
- valid ids: `PLATFORM_NAV_VIEW_IDS` in `platform/app-web/src/nav-views.ts`
- parser: `readViewIdFromSearch`
- navigation builder: `mergeViewIntoSearch`
- navigation side effect: `replaceUrlSearchParams`, which calls `history.replaceState` and dispatches `app:urlsearchchanged`
- default route: `overview`

## Current View IDs

| View id | Current group | Rendered component | Phase 0 route disposition |
| --- | --- | --- | --- |
| `overview` | Command Center | `OverviewView` | Keep alias; map to Home. |
| `platform-health` | Command Center | `PlatformHealthView` | Keep alias; map to Home/Platform Status. |
| `investigation` | Investigate | `InvestigationView` | Keep alias; map to Evidence/Investigation. |
| `situation-room` | Investigate | `SituationRoomView` | Keep alias; map to Evidence/Situation. |
| `operator-briefing` | Investigate | `OperatorBriefingView` | Keep alias; map to Evidence/Briefing. |
| `delta-digest` | Investigate | `DeltaDigestView` | Keep alias; map to Evidence/Delta Digest. |
| `evidence-consistency` | Investigate | `EvidenceConsistencyView` | Keep alias; map to Evidence/Consistency. |
| `evidence-quality-workspace` | Investigate | `EvidenceQualityWorkspaceView` | Keep alias; map to Evidence Quality. |
| `stability-workspace` | Investigate | `StabilityWorkspaceView` | Keep alias; map to Evidence/Stability. |
| `devices` | Network Truth | `DevicesView` | Keep alias; map to Network/Devices. |
| `topology` | Network Truth | `TopologyView` | Keep alias; map to Network/Topology and Topology Object. |
| `path-explorer` | Network Truth | `PathExplorerView` | Keep alias; map to Policy Path tab or dedicated Path Explorer. |
| `policies` | Services & Policies | `PoliciesView` | Keep alias; map to Policy inventory/object page. |
| `service-explorer` | Services & Policies | `ServiceExplorerView` | Keep alias; map to Service inventory/detail. |
| `service-dossier` | Services & Policies | `ServiceDossierView` | Keep alias; map to Service `dossier` tab. |
| `service-impact-workspace` | Services & Policies | `ServiceImpactWorkspaceView` | Keep alias; map to Service `impact` tab. |
| `maintenance-preview` | Change & Safety | `MaintenancePreviewView` | Keep alias; map to Maintenance `preview` tab. |
| `maintenance-evidence-workspace` | Change & Safety | `MaintenanceEvidenceWorkspaceView` | Keep alias; map to Maintenance `evidence` tab. |
| `maintenance-window-workspace` | Change & Safety | `MaintenanceWindowWorkspaceView` | Keep alias; preserve repeated subjects. |
| `impact-report` | Change & Safety | `ImpactReportView` | Keep alias; preserve `/reports` boundary. |
| `change-safety-case` | Change & Safety | `ChangeSafetyCaseView` | Keep alias; preserve CSC copy. |
| `workflow-lifecycle` | Change & Safety | `WorkflowLifecycleView` | Keep alias; durable lifecycle records. |
| `preview-workspace` | Change & Safety | `PreviewWorkspaceView` | Keep alias; preview records. |
| `validation-workspace` | Change & Safety | `ValidationWorkspaceView` | Keep alias; validation records. |
| `safe-action-workspace` | Change & Safety | `SafeActionWorkspaceView` | Keep alias; highest-risk action flow. |
| `rollback-workspace` | Change & Safety | `RollbackWorkspaceView` | Keep alias; highest-risk rollback flow. |
| `workflows` | Governance & Platform | `WorkflowsView` | Keep alias; sync-derived history. |
| `audit` | Governance & Platform | `AuditView` | Keep alias; audit history. |
| `capabilities` | Governance & Platform | `CapabilitiesView` | Keep alias; capability matrix. |
| `readiness` | Governance & Platform | `ReadinessView` | Keep alias; readiness anchors. |
| `evidence-replay` | Governance & Platform | `EvidenceReplayView` | Keep alias; frozen replay. |

## Route Params and Navigation Helpers

| Param/helper family | Params | Source files | New route owner |
| --- | --- | --- | --- |
| Shell route | `view` | `src/nav-views.ts`, `src/App.tsx`, `src/lib/url-app-state.ts` | Typed route registry. |
| Copy/reset context | all query params except reset keeps `view` | `src/App.tsx`, `src/components/shell.tsx` | Shell route actions. |
| Overview layout | `overview_mode` | `src/lib/overview-mode.ts` | Home route tab/mode. |
| Read-side query | `limit`, `history_recent_limit` | `src/api/client.ts`, read-side components/tests | Devices/Policies/Governance routes. |
| Degraded policy filter | `degraded_policy_v1_posture` | `src/lib/url-app-state.ts`, `policies/view.tsx` | Policy inventory filter. |
| Policy object/workspace | `policy_id`, `policy_workspace`, `policy_dossier_entry`, `policy_explainability_focus`, `policy_evidence_timeline_focus`, `policy_evidence_delta_focus` | `src/lib/policy-dossier-navigation.ts`, `src/lib/topology-policy-navigation.ts`, `policies/*` | Policy page tabs/focus. |
| Topology object/workspace | `topology_object`, `topology_object_kind`, `topology_workspace`, `dossier_source` | `src/lib/topology-dossier-navigation.ts`, `src/lib/topology-policy-navigation.ts`, `topology/*` | Topology Object page tabs. |
| Path Explorer | `path_explorer_policy_id` | `src/lib/path-explorer-navigation.ts` | Policy Path tab or path workspace. |
| Service Explorer/Dossier/Impact | `service_id`, `service_impact_workspace_service_id` | `src/lib/service-explorer-navigation.ts`, `src/lib/service-dossier-navigation.ts`, `src/lib/service-impact-workspace-navigation.ts` | Service page tabs. |
| Maintenance single subject | `maintenance_node_id`, `maintenance_link_id`, `maintenance_object_id`, `maintenance_object_kind`, `maintenance_preview_context` | `src/lib/maintenance-preview-navigation.ts` | Maintenance subject route. |
| Maintenance window subject set | repeated `mww_subject` | `src/lib/maintenance-window-workspace-navigation.ts` | Maintenance window route with subject array. |
| Change safety case | `change_safety_context`, `csc_policy_id`, `csc_service_id`, maintenance subject params | `src/lib/change-safety-case-navigation.ts` | Change Safety Case route. |
| Impact report | `impact_report_context`, `impact_service_id`, `impact_policy_id`, maintenance subject params | `src/lib/impact-report-navigation.ts` | Impact Report route. |
| Investigation context | `sync_runs_limit`, `inv_from`, `failure_impact_entry`, `risk_summary_entry` | `src/lib/investigation-navigation.ts`, `src/lib/investigation-url-context.ts` | Evidence/Investigation route. |
| Global search echo | `global_search_q` | `src/lib/global-search-deeplink.ts`, `src/lib/operator-search-navigation.ts` | Search route context. |
| Readiness anchors | `readiness_blocker`, `readiness_prerequisite`, `readiness_capability_feature` | `src/lib/readiness-navigation.ts` | Readiness route anchors. |
| Operator briefing | `sync_runs_limit`, `policy_id`, `topology_object`, `topology_object_kind`, `inv_from`, `global_search_q` | `src/lib/operator-briefing-navigation.ts` | Briefing context route. |
| Stability anchors | topology object params, `service_id`, `sync_runs_limit` | `src/lib/stability-workspace-navigation.ts` | Stability object route. |

## Navigation Helper Inventory

| Helper/source | Current behavior | Rewrite parity requirement |
| --- | --- | --- |
| `navigateToEvidenceView` | Switches `view` while preserving context params. | Preserve or intentionally clear stale params by route rule. |
| `navigateToPoliciesWithDegradedPolicyV1Posture` | Opens Policies with degraded policy filter. | Preserve as Policy inventory filter. |
| `navigateToTopologyDossier` | Opens Topology object dossier with source context. | Map to Topology Object `dossier` tab. |
| `navigateToPolicyDossierWorkspace` | Opens Policy dossier with source/entry. | Map to Policy `dossier` tab. |
| `navigateToPolicyExplainabilityWorkspace` | Opens Policy explainability with focus. | Map to Policy `explainability` tab. |
| `navigateToPoliciesPolicy*` | Opens policy-focused panels/timeline/delta. | Map to Policy page focus anchors. |
| `navigateToPathExplorer` | Opens Path Explorer for policy id. | Preserve alias to path workspace/tab. |
| `navigateToServiceExplorer` | Opens service list/detail. | Preserve `service_id`. |
| `navigateToServiceDossier` | Opens service dossier. | Map to Service `dossier` tab. |
| `navigateToServiceImpactWorkspace` | Opens service impact workspace. | Map to Service `impact` tab. |
| `navigateToMaintenancePreview*` | Opens maintenance preview for object/subject. | Preserve selector params. |
| `navigateToMaintenanceEvidenceWorkspace*` | Opens maintenance evidence for object/subject. | Preserve selector params. |
| `navigateToMaintenanceWindowWorkspace*` | Opens maintenance subject set. | Preserve repeated `mww_subject`. |
| `navigateToImpactReport*` | Opens report workspace. | Preserve `/reports` identity and context. |
| `navigateToChangeSafetyCase*` | Opens CSC workspace. | Preserve CSC context and non-claim copy. |
| `navigateToDeltaDigestView` | Opens digest with sync/search echo. | Preserve Evidence/Delta Digest route. |
| `navigateToSituationRoomView` | Opens situation room with sync/search echo. | Preserve Evidence/Situation route. |
| `navigateToInvestigationView` | Opens investigation with sync/context. | Preserve Investigation route context. |
| `navigateToOperatorBriefingView` | Opens briefing with context. | Preserve briefing route context. |
| `navigateFromOperatorSearchPivot` | Dispatches search hit pivots to domain routes. | Preserve navigation-first global search. |
| `navigateReadinessDrilldown` / `navigateToReadinessContext` | Opens readiness anchors. | Preserve anchor semantics and focus. |
| `navigateForInvestigationContextDomain` | Opens domain from investigation context. | Preserve next-best inspection pivots. |

## Interaction Families

| Interaction family | Source examples | Effect | Rewrite requirement |
| --- | --- | --- | --- |
| Shell sidebar item | `AppShell` via `onSelect` in `App.tsx` | URL route update | Preserve all old views or redirects. |
| Shell copy link | `handleCopyLink` in `App.tsx` | clipboard write of current URL | Preserve full query context. |
| Shell reset context | `handleResetContext` in `App.tsx` | clears all non-`view` params | Preserve or replace with explicit route reset behavior. |
| Error retry | `ErrorState onRetry` across views | reloads API query or resyncs URL | Preserve loading/error branch behavior. |
| Reload buttons | overview/evidence/governance/device/policy views | API reload | Preserve refreshing vs initial loading distinction. |
| Load workspace forms | `path-explorer`, `service-impact-workspace`, maintenance setup views | set route params and refetch | Preserve form labels and query semantics. |
| Object selection buttons | Devices, topology, policies, service, audit/workflows | local selection and/or route pivot | Preserve object identity and shareable context. |
| Object pivot buttons | service/policy/topology/evidence components | route update | Preserve deep links and source context. |
| Download/export buttons | evidence export/report/CSC components | browser download from `/api/v1/exports` or `/api/v1/reports` | Preserve path family and envelope copy. |
| Evidence replay import | replay view/product | local file parse, no backend truth | Preserve frozen/offline boundary and live pivots. |
| Workflow lifecycle create/transition | `workflow-lifecycle/view.tsx` | POST lifecycle records/transitions | Preserve durable workflow record copy. |
| Preview/validation create | `preview-workspace`, `validation-workspace`, `safe-action-workspace` | POST preview/validation | Preserve non-execution/non-proof copy. |
| Safe action create/approve/execute | `safe-action-workspace/view.tsx` | POST `/actions`, approve, execute | Preserve gates, ids, disabled/busy state, platform-only copy. |
| Rollback create/approve/execute | `rollback-workspace/view.tsx` | POST `/rollbacks`, approve, execute | Preserve gates, ids, disabled/busy state, compensation-only copy. |

## State-Changing Control Inventory

| Surface | Visible controls | Backend methods | Phase 0 posture |
| --- | --- | --- | --- |
| Workflow Lifecycle | create workflow record; transition selected workflow | `createWorkflowLifecycle`, `transitionWorkflowLifecycle` | Visible state-changing; must port with tests. |
| Preview Workspace | create preview | `createPreview` | Visible state-changing; must port with tests. |
| Validation Workspace | create validation | `createValidation` | Visible state-changing; must port with tests. |
| Safe Action | create/approve workflow demo, create preview+validation, create action, approve+execute | `createWorkflowLifecycle`, `transitionWorkflowLifecycle`, `createPreview`, `createValidation`, `createSafeAction`, `approveSafeAction`, `executeSafeAction`, `getActionSafetyCase` | Highest risk; migrate last. |
| Safe Action hidden/helper methods | list/detail/reject/cancel backend-only; timeline consumed after visible flows | `getSafeActionList`, `getSafeActionDetail`, `getSafeActionTimeline`, `rejectSafeAction`, `cancelSafeAction` | Phase 1 posture resolved; do not surface hidden methods until a workflow-control IA decision changes it. |
| Rollback | create rollback, approve+execute rollback | `createRollback`, `approveRollback`, `executeRollback` plus validation prerequisites | Highest risk; migrate last. |
| Rollback hidden/helper methods | list/detail/reject/cancel backend-only; timeline consumed after visible flows | `getRollbackList`, `getRollbackDetail`, `getRollbackTimeline`, `rejectRollback`, `cancelRollback` | Phase 1 posture resolved; do not surface hidden methods until a workflow-control IA decision changes it. |

Phase 1 posture closure:

- Safe Action list/detail/reject/cancel: backend-only for Phase 1.
- Safe Action timeline: consumed after visible create/execute flows.
- Rollback list/detail/reject/cancel: backend-only for Phase 1.
- Rollback timeline: consumed after visible create/execute flows.

## Safety-Copy Anchor Inventory

| Category | Current source examples | Copy intent to preserve |
| --- | --- | --- |
| Safe action boundary | `src/features/safe-action-workspace/view.tsx` | Bounded safe action is a platform intent overlay only; not preview diff, validation verdict, evidence export, replay, or sync-history replacement. |
| Safe action final posture | `src/features/safe-action-workspace/view.tsx` | Final bounded posture is operator review language, not safe-to-execute proof. |
| Preview | `src/api/contracts.ts`, `preview-workspace`, safe-action prerequisite copy | Preview is dry-run/static-local; not execution. |
| Validation | `src/api/contracts.ts`, `validation-workspace`, safe-action prerequisite copy | Validation is bounded read-model observation; not approval/proof. |
| Rollback | `src/features/rollback-workspace/view.tsx`, rollback contracts/tests | Rollback is compensation-only; not universal undo or device restore. |
| Evidence replay | `src/features/evidence-replay/*`, replay tests | Replay is frozen/offline; not live product truth. |
| Exports/reports | export/report helpers and components | Evidence export, impact report, briefing bundle, maintenance handoff, and CSC are distinct envelope/report families. |
| Topology/path truth | topology/path panels and contracts | Topology/path views do not prove universal topology truth, dataplane truth, or TE behavior. |
| Evidence consistency/quality/stability | evidence/stability views and contracts | Do not claim root cause, validation, prediction, incident authority, or drift truth. |
| Controller/ODL evidence | platform health/topology/controller evidence contracts | Controller evidence is bounded helper evidence, not product source of truth. |

## Phase 0 Closure

- Typed route parse/build parity tests: complete in `platform/app-web/tests/frontend-phase1-route-parity.test.ts`.
- Route-param ownership: complete in this appendix and executable route parity data.
- AST-generated JSX interaction inventory: complete in `platform/app-web/docs/frontend-phase0-jsx-interaction-inventory.md`.
- Exact source-line safety-copy anchors: complete in `platform/app-web/docs/frontend-phase0-safety-copy-source-anchors.md` and protected by `platform/app-web/tests/frontend-phase1-safety-copy-parity.test.ts`.
