# Frontend Navigation Map

## A. Routing model

The current WebUI uses query-string routing, not React Router. The active workspace is read from `?view=` by `readViewIdFromSearch` in `platform/app-web/src/lib/url-app-state.ts`; the allowed view ids are defined in `platform/app-web/src/nav-views.ts`; `platform/app-web/src/App.tsx` renders the selected view through a `switch`.

Navigation changes call `replaceUrlSearchParams`, which uses `window.history.replaceState` and dispatches the custom `app:urlsearchchanged` event. `App` listens for that event and `popstate`, then re-reads `window.location.search`. Deep links work for any valid `view` plus supported context params. Invalid or absent `view` returns `null` and `App` defaults to `overview`.

Implications for rewrite:

- Browser back/forward is only partially router-like because most app navigation uses `replaceState`, not `pushState`.
- Context params are preserved by most `mergeViewIntoSearch` helpers unless a feature helper explicitly clears stale params.
- There is no nested route hierarchy; hierarchy is represented by query params and workspace modes such as `policy_workspace=dossier`, `policy_workspace=explainability`, `topology_workspace=dossier`, and repeated `mww_subject`.
- `Copy link` and context-aware deep links are first-class product behavior and must be preserved or redirected.

## B. Navigation tree

Registered in `platform/app-web/src/App.tsx`; valid ids in `platform/app-web/src/nav-views.ts`.

| Nav label | View key | Group | Rendered component | Default URL | Related backend APIs | Product domain | Status | Rewrite priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Overview | `overview` | Command Center | `OverviewView` | `?view=overview` | platform/devices/topology/policies/capabilities/change/risk/consistency/stability/evidence-quality | Command center | Active | Critical |
| Platform Health | `platform-health` | Command Center | `PlatformHealthView` | `?view=platform-health` | `/platform/status`, `/controller/evidence` | Runtime health | Active | Critical |
| Investigation | `investigation` | Investigate | `InvestigationView` | `?view=investigation` | `/investigation-workspace/context` | Investigation | Active | High |
| Situation Room | `situation-room` | Investigate | `SituationRoomView` | `?view=situation-room` | `/evidence-pack/situation` | Evidence pack | Active | High |
| Operator Briefing | `operator-briefing` | Investigate | `OperatorBriefingView` | `?view=operator-briefing` | `/operator-briefing`, `/exports/operator-briefing` | Handoff | Active | High |
| Delta Digest | `delta-digest` | Investigate | `DeltaDigestView` | `?view=delta-digest` | `/delta-digest` | Cross-domain delta | Active | High |
| Evidence Consistency | `evidence-consistency` | Investigate | `EvidenceConsistencyView` | `?view=evidence-consistency` | `/evidence-consistency/summary` | Evidence alignment | Active | High |
| Evidence Quality | `evidence-quality-workspace` | Investigate | `EvidenceQualityWorkspaceView` | `?view=evidence-quality-workspace` | `/evidence-quality-workspace`, `/evidence-weakness-explanation` | Collection assurance | Active | High |
| Stability | `stability-workspace` | Investigate | `StabilityWorkspaceView` | `?view=stability-workspace` | `/stability/summary`, stability profiles | Operational stability | Active | High |
| Devices | `devices` | Network Truth | `DevicesView` | `?view=devices` | `/devices` | Inventory | Active | Critical |
| Topology | `topology` | Network Truth | `TopologyView` | `?view=topology` | `/topology`, topology object endpoints, `/controller/evidence` | Topology | Active | Critical |
| Path Explorer | `path-explorer` | Network Truth | `PathExplorerView` | `?view=path-explorer` | `/path-explorer` | Path reasoning | Active | High |
| Policies | `policies` | Services & Policies | `PoliciesView` | `?view=policies` | `/policies`, policy detail endpoints | Policy inventory | Active | Critical |
| Service Explorer | `service-explorer` | Services & Policies | `ServiceExplorerView` | `?view=service-explorer` | `/services`, `/services/{id}` | Service lens | Active | High |
| Service Dossier | `service-dossier` | Services & Policies | `ServiceDossierView` | `?view=service-dossier` | `/services/{id}/dossier` | Service dossier | Active | High |
| Service Impact | `service-impact-workspace` | Services & Policies | `ServiceImpactWorkspaceView` | `?view=service-impact-workspace` | `/service-impact-workspace` | Service impact | Active | High |
| Maintenance Preview | `maintenance-preview` | Change & Safety | `MaintenancePreviewView` | `?view=maintenance-preview` | `/maintenance-preview` | Maintenance planning | Active | High |
| Maintenance Evidence | `maintenance-evidence-workspace` | Change & Safety | `MaintenanceEvidenceWorkspaceView` | `?view=maintenance-evidence-workspace` | `/maintenance-evidence-workspace` | Maintenance evidence | Active | High |
| Maintenance Window | `maintenance-window-workspace` | Change & Safety | `MaintenanceWindowWorkspaceView` | `?view=maintenance-window-workspace` | `/maintenance-window-workspace`, handoff export | Multi-subject maintenance | Active | High |
| Impact Report | `impact-report` | Change & Safety | `ImpactReportView` | `?view=impact-report` | `/reports/*-impact` | Operator report | Active | Medium-high |
| Change Safety Case | `change-safety-case` | Change & Safety | `ChangeSafetyCaseView` | `?view=change-safety-case` | `/reports/change-safety-case/*` | Pre-change reasoning | Active | High |
| Workflow Lifecycle | `workflow-lifecycle` | Change & Safety | `WorkflowLifecycleView` | `?view=workflow-lifecycle` | `/workflow-lifecycle` | Durable workflow records | Active | High |
| Preview Workspace | `preview-workspace` | Change & Safety | `PreviewWorkspaceView` | `?view=preview-workspace` | `/previews` | Preview/diff | Active | High |
| Validation Workspace | `validation-workspace` | Change & Safety | `ValidationWorkspaceView` | `?view=validation-workspace` | `/validations` | Validation records | Active | High |
| Safe Action | `safe-action-workspace` | Change & Safety | `SafeActionWorkspaceView` | `?view=safe-action-workspace` | `/actions`, prerequisite APIs | Bounded safe action | Active, narrow Phase 5 | Critical |
| Rollback | `rollback-workspace` | Change & Safety | `RollbackWorkspaceView` | `?view=rollback-workspace` | `/rollbacks`, `/validations` | Bounded rollback | Active, narrow Phase 5 | Critical |
| Workflows | `workflows` | Governance & Platform | `WorkflowsView` | `?view=workflows` | `/workflow-history` | Sync workflow history | Active | Medium |
| Audit | `audit` | Governance & Platform | `AuditView` | `?view=audit` | `/audit-history` | Bounded audit history | Active | Medium |
| Capabilities | `capabilities` | Governance & Platform | `CapabilitiesView` | `?view=capabilities` | `/capabilities` | Capability matrix | Active | High |
| Readiness | `readiness` | Governance & Platform | `ReadinessView` | `?view=readiness` | `/capabilities`, `/readiness-snapshot-history` | Planning readiness | Active | High |
| Evidence Replay | `evidence-replay` | Governance & Platform | `EvidenceReplayView` | `?view=evidence-replay` | none for import; live pivots only | Frozen export review | Active | Medium-high |

## C. Cross-link map

Representative internal links and pivots found in `platform/app-web/src/lib/`, `platform/app-web/src/features/`, and shared components:

| Source view/component | Target view | URL/query params used | Context passed | Purpose | Backend object involved | Risk if lost |
| --- | --- | --- | --- | --- | --- | --- |
| Shell navigation | Any registered view | `view` | none | Primary navigation | none | User cannot reach workspaces. |
| Shell `Copy link` | Current URL | all current params | full deep link | Handoff/share current context | varies | Deep-link workflow breaks. |
| Shell `Reset context` | Current view | clears all non-`view` params | none | Recover from stale context | varies | Users get stuck in pinned contexts. |
| Global Operator Search | Policies, topology dossier, service explorer/dossier, readiness, investigation, situation, digest, reports | `global_search_q`, ids, workspace params | search hit identity | Object pivoting from search | operator search hits | Search becomes informational only. |
| Overview NOC cockpit | Many workspaces | view-specific ids/anchors | strongest risk/degraded rows | Start investigations from command center | topology/policy/service rows | Cockpit loses operator value. |
| Devices detail | Topology/policies/investigation | `device_id`, topology object params | selected device | Cross-check device against topology/policies | device and topology node | Device page becomes siloed. |
| Topology object selection | Topology dossier/failure/related policies/timeline/delta/stability/maintenance | `topology_object`, `topology_object_kind`, `topology_workspace`, `dossier_source` | node/link id | Object-centered topology investigation | topology object | Object workflows break. |
| Topology related policies | Policies/policy dossier/explainability/service | `policy_id`, `policy_workspace`, `service_id` | related policy id | Pivot topology to policy/service | policy id | Loses topology-policy relationship. |
| Policies table/detail | Policy dossier/explainability/path/timeline/delta/service/impact/change safety | `policy_id`, `policy_workspace`, focus params | selected policy | Policy-centered drilldown | policy id | Policy view becomes flat. |
| Workflow/Audit drilldowns | Devices/topology/policies/readiness/policy timeline | `view`, object ids, focus params | history row artifacts | Evidence replay from sync/audit rows | sync/audit artifacts | History loses explainability. |
| Evidence Quality explanation | Devices/topology/policies/platform/capabilities/service/maintenance/stability/consistency/investigation | next-best pivot ids | backend explanation block | Guided evidence weakness follow-up | evidence quality row | Weakness explanations lose actionability. |
| Investigation/Situation/Briefing | Dossiers, exports, digest, search, evidence replay | policy/topology/inv/search params | assembled context | Handoff between composed workspaces | evidence pack/context | Operators cannot move from summary to detail. |
| Export actions | Browser download | `/api/v1/exports/...` path params | subject identity | Save evidence snapshots | export envelope | Export/report/replay workflow breaks. |
| Impact/Change Safety actions | Browser download | `/api/v1/reports/...` params | report context | Save report/CSC markdown/json | report envelope | Report routes may be confused with exports. |
| Evidence Replay pivots | Live workspaces | subject-derived ids | frozen export subject | Re-open live context from frozen file | export subject | Frozen review cannot connect to live app. |
| Safe Action workspace | Workflow/preview/validation/action APIs | ids in local state | policy/workflow/preview/validation/action ids | Bounded platform-only execution path | action records | Critical gate flow lost. |
| Rollback workspace | Validation/rollback APIs | ids in local state | policy/action/validation/rollback ids | Bounded compensation path | rollback records | Critical rollback flow lost. |

## D. Navigation problems and rewrite opportunities

- There are 31 shell views, which creates cognitive load and makes the sidebar long.
- Many views are composed workspaces with overlapping subjects: service explorer/dossier/impact, policy details/dossier/explainability/path explorer, maintenance preview/evidence/window, evidence consistency/quality/stability/investigation.
- Query params are decentralized across many helpers; rewrite should centralize typed route definitions.
- `replaceState` navigation avoids noisy browser history but weakens back/forward expectations.
- Breadcrumbs are limited; some context appears only as topbar route context count or feature callouts.
- Object-centered navigation exists but is distributed; rewrite should make policy, service, topology object, maintenance subject, and action records first-class route objects.
- Labels such as Change Safety Case, Impact Report, Safe Action, Validation, and Rollback require strict bounded copy to avoid overclaim.

## E. Proposed rewrite constraints

The rewrite must preserve:

- all valid `view` deep links or a documented redirect/migration map;
- object pivots for policy id, service id, topology object id/kind, device id, workflow id, action id, rollback id, and maintenance subjects;
- copy-link and reset-context behavior;
- global search pivots and `global_search_q` echo where currently used;
- evidence export, report download, replay-to-live, and briefing bundle boundaries;
- state-changing workflows for lifecycle, preview, validation, safe action, and rollback, with existing gates and non-claims;
- read-only evidence workflows and next-best pivots;
- the distinction between sync-derived workflow history and durable workflow lifecycle records;
- the distinction between platform-only action/rollback and real device/controller actuation.

## Validation performed

Files inspected: `platform/app-web/src/App.tsx`, `platform/app-web/src/nav-views.ts`, `platform/app-web/src/lib/url-app-state.ts`, `platform/app-web/src/lib/*navigation*.ts`, feature views and product panels, backend route aggregation.

Searches performed: route ids, navigation helpers, `replaceUrlSearchParams`, `navigateTo*`, button/link/action labels, backend endpoint decorators.

Known blind spots: Back/forward behavior was inferred from source, not tested in a browser.

Confidence level: High for route tree and core pivot families; medium for exhaustive every-button cross-link detail.

Recommended follow-up inspection: before implementation, generate a route-param inventory from `src/lib/*.ts` and compare it to tests.
