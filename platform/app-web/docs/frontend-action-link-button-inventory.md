# Frontend Action, Link, and Button Inventory

This inventory groups meaningful interactions by behavior. Source evidence comes from `platform/app-web/src/App.tsx`, `platform/app-web/src/components/`, `platform/app-web/src/lib/`, and `platform/app-web/src/features/`.

## A. Shell and global interactions

| Interaction label | UI type | Source | Visible in | User intent | Action performed | API | State/URL changed | Error/loading behavior | Safety implications | Rewrite requirement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sidebar nav item | Button | `components/shell.tsx`, `App.tsx` | All views | Switch workspace | Calls `onSelect`, sets `view` | none | `view` query changes via `replaceState` | none | Must not drop hidden views | Preserve full route map or redirects. |
| Menu | Button | `components/shell.tsx` | All views/mobile | Toggle sidebar | Local `navOpen` | none | local state | none | Accessibility/responsive concern | Preserve keyboard/ARIA behavior. |
| Copy link | Button | `components/shell.tsx`, `App.tsx` | All views | Share current deep link | `navigator.clipboard.writeText(window.location.href)` | none | copy state local | `Link copied` / `Copy failed` | Deep links are product workflow | Preserve exact capability. |
| Reset context | Button | `components/shell.tsx`, `App.tsx` | All views | Clear stale context | Keeps current `view`, deletes other params | none | clears context params | disabled when no context | Prevents hidden stale state | Preserve. |
| Global operator search input/results | Form/results/buttons | `features/global-search/global-operator-search.tsx`, `lib/operator-search-navigation.ts` | All views | Search object and pivot | Calls search endpoint; result actions navigate | `GET /api/v1/operator-search` | `view`, ids, `global_search_q` | loading/error/no hits/ambiguous | Navigation only, not log/metrics search | Preserve grouped results and bounded copy. |

## B. Read-only refresh, retry, and filter interactions

| Interaction label | UI type | Source | Visible in | Action performed | API | State changed | Rewrite requirement |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Retry | Button | `components/query-states.tsx` | API error states | Re-runs query `reload` | current view API | query state | Preserve across all API views. |
| Reload / Reload summary / Reload workspace | Button | Many feature views | Most read-only workspaces | Re-runs current query | current view API | query state | Preserve per-workspace refresh. |
| Read-side query panel | Form inputs | `components/read-side-query-panel.tsx`, feature views | Devices, Policies, Workflows, Audit | Applies bounded limits/history params | `/devices`, `/policies`, `/workflow-history`, `/audit-history` | URL query params | Preserve URL-sync and backend echo. |
| Degraded policy filter | Filter/buttons | `policies/view.tsx`, `lib/url-app-state.ts` | Policies, Overview, Platform Health | Filter by `degraded_policy_v1_posture` | `/policies` | URL param | Preserve all/ok/degraded/unknown semantics. |
| Overview mode toggle | Button | `features/overview/view.tsx`, `lib/overview-mode.ts` | Overview | Switch Standard vs NOC cockpit | existing overview queries | `overview_mode` | Preserve both modes or explicit redesign migration. |
| Maintenance subject editor | Form/buttons | `maintenance-window-workspace` | Maintenance Window | Add/remove repeated subjects | `/maintenance-window-workspace` | `mww_subject` params | Preserve repeated subject semantics. |
| Evidence replay import | File/paste inputs | `features/evidence-replay/evidence-replay-product.tsx`, `lib/evidence-replay/` | Evidence Replay | Parse frozen export file/text | none | local replay state | Preserve JSON/Markdown handling and unsupported-root errors. |

## C. Navigation pivots and object links

| Interaction label | UI type | Source examples | Visible in | User intent | URL changed | Backend object | Risk if lost |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Open dossier | Button/link | `topology-object-dossier-workspace.tsx`, `policy-dossier-workspace.tsx`, `service-dossier-product.tsx`, navigation helpers | Topology, Policies, Services, Overview, search | Move from list/summary to dossier | `topology_workspace=dossier`, `policy_workspace=dossier`, or `view=service-dossier` | topology object / policy / service | Loses object-centered workflow. |
| Open explainability | Button/link | `policy-explainability-workspace.tsx`, policy/service/search helpers | Policies, Service Dossier, Path Explorer, search | Explain policy behavior | `policy_workspace=explainability` or focus params | policy id | Loses policy reasoning workflow. |
| Open Path Explorer | Button/link | `path-explorer-product.tsx`, overview cockpit, policies | Policy surfaces | Path reasoning | `view=path-explorer&path_explorer_policy_id=...` | policy id | Loses path workflow. |
| Open in Topology | Button/link | topology-policy helpers, risk/failure panels | Overview, policy impact, topology risk | Inspect topology object | `view=topology&topology_object=...` | node/link | Loses graph pivot. |
| Open Policies / policy detail | Button/link | related policies, device, topology, history drilldown | Many | Inspect policy row/detail | `view=policies&policy_id=...` | policy id | Loses policy pivot. |
| Open Service Explorer / Service Dossier / Service Impact | Button/link | service helpers, global search, cockpit | Service/policy/NOC/search | Inspect service lens | `view=service-explorer` / `service-dossier` / `service-impact-workspace` | service id | Loses service workflow. |
| Open Investigation / Situation / Operator Briefing | Button/link | most composed workspaces | Many | Escalate context to broader evidence/handoff | `view=investigation`, `situation-room`, `operator-briefing` plus context | policy/topology/service/search context | Loses composed investigation path. |
| Open Evidence Consistency / Evidence Quality / Stability | Button/link | Overview, NOC, maintenance, service, briefing, evidence quality | Many | Review cross-domain posture | target view plus sync/context params | summary/profile ids | Loses evidence review workflows. |
| Open Readiness | Button/link | capabilities/readiness/history drilldowns | Capabilities, Readiness, Workflow/Audit | Inspect blocker/prereq/capability context | `readiness_blocker`, `readiness_prerequisite`, `readiness_capability_feature` | readiness/capability record | Loses planning support. |

## D. Export, report, and replay actions

| Interaction label | UI type | Source | Visible in | Action performed | Backend API | Data downloaded | Error/loading behavior | Safety implications | Rewrite preservation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Export JSON | Button | `components/evidence-export-actions.tsx`, `lib/evidence-export-download.ts` | Policy/topology dossiers, situation, investigation, operator briefing per-surface | Browser download | `/api/v1/exports/...?...format=json` | `evidence_export_v1` or `briefing_export_bundle_v1` JSON | component download state | Not compliance/tamper-evident by default | Preserve route family and copy. |
| Export Markdown | Button | same | same | Browser download | `/api/v1/exports/...?...format=markdown` | Markdown companion | component download state | Human-readable, not canonical truth | Preserve. |
| Briefing archive bundle | Button | `operator-briefing-product.tsx`, `EvidenceExportActions` variant | Operator Briefing | Bundle download | `/api/v1/exports/operator-briefing` | `briefing_export_bundle_v1` | component state | Bundle root is not single-export replay root | Preserve distinction. |
| Impact report download | Button | `components/impact-report-actions.tsx`, `lib/impact-report-download.ts` | Impact Report | Download report JSON/Markdown | `/api/v1/reports/*-impact` | `impact_report_v1` | component state | Report is not evidence export | Preserve `/reports` route. |
| Change safety case download | Button | `components/change-safety-case-actions.tsx`, `lib/change-safety-case-download.ts` | Change Safety Case | Download CSC JSON/Markdown | `/api/v1/reports/change-safety-case/*` | `change_safety_case_v1` | component state | Not safe-to-change proof | Preserve. |
| Maintenance window handoff download | Button | `maintenance-window-workspace` product/navigation | Maintenance Window | Download handoff | `/api/v1/exports/maintenance-window-handoff` | `maintenance_window_handoff_v1` | feature state | Handoff, not approval | Preserve. |
| Evidence replay live pivots | Buttons | `features/evidence-replay/`, `lib/evidence-replay-pivots.ts` | Evidence Replay | Open live workspace from frozen export subject | none directly | none | parse warnings/errors | Frozen file is not live truth | Preserve. |

## E. State-changing backend actions

These interactions require the strongest rewrite protection. They are not broad device actuation; copy and flow must preserve current backend boundaries.

| Interaction label | UI type | Source | Visible in view | User intent | Backend API called | HTTP method/path | State changed | URL changed | Error/loading/disabled | Safety implications | Current copy boundary | Rewrite preservation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Create workflow record | Form + button | `features/workflow-lifecycle/view.tsx` | Workflow Lifecycle | Create durable lifecycle record | `createWorkflowLifecycle` | `POST /api/v1/workflow-lifecycle` | Backend workflow row; local/list reload | sets `workflow_lifecycle_id` | disabled while creating; error text | Record management only | “does not execute changes on devices or controllers” | Preserve as lifecycle, not sync history. |
| Transition workflow lifecycle | Select/input + button | `workflow-lifecycle/view.tsx` | Workflow Lifecycle | Move lifecycle status | `transitionWorkflowLifecycle` | `POST /api/v1/workflow-lifecycle/{id}/transitions` | Backend workflow status/event | current selected id | disabled/no-op if none; reload detail/timeline/list | Bounded state transition | Not dry-run/validation/network execution | Preserve status vocabulary and gating. |
| Run preview | Form + button | `preview-workspace/view.tsx` | Preview Workspace | Create v1 preview | `createPreview` | `POST /api/v1/previews` | Backend preview row | none | busy “Running…”; error text | Not execution; no authority | “not network execution… does not grant execution authority” | Preserve static_local/intention boundary. |
| Run validation | Form + button | `validation-workspace/view.tsx` | Validation Workspace | Create validation result | `createValidation` | `POST /api/v1/validations` | Backend validation row | none | busy “Running…”; error text | Not approval/execution | “not execution or approval” | Preserve unknown/not-applicable first-class states. |
| Create + approve workflow demo shortcut | Button | `safe-action-workspace/view.tsx` | Safe Action | Create prerequisite workflow and mark approved for demo | `createWorkflowLifecycle`, `transitionWorkflowLifecycle` | `POST /workflow-lifecycle`, `POST /workflow-lifecycle/{id}/transitions` | Workflow row/status | local ids only | disabled while busy; error text | Demo shortcut; not production flow | “Production flows should walk planned/dry-run states honestly” | Preserve or replace with safer explicit flow. |
| Create preview + validation | Button | `safe-action-workspace/view.tsx` | Safe Action | Create action prerequisites | `createPreview`, `createValidation` | `POST /previews`, `POST /validations` | Preview/validation rows | local ids only | requires workflow/policy; error text | Gate input, not proof | labels as prerequisites | Preserve prerequisite chain. |
| Create safe action | Button | `safe-action-workspace/view.tsx` | Safe Action | Request bounded action | `createSafeAction`, then safety case/timeline fetch | `POST /api/v1/actions`, `GET /actions/{id}/safety-case`, `GET /actions/{id}/timeline` | Safe action row | local ids only | requires workflow/preview/validation/policy; busy; error | Platform-only intent overlay | “not device or controller configuration push” | Critical preserve. |
| Approve + execute safe action | Button | `safe-action-workspace/view.tsx` | Safe Action | Approve and execute bounded action | `approveSafeAction`, `executeSafeAction` | `POST /actions/{id}/approve`, `POST /actions/{id}/execute` | Action decision/execution status; policy intent overlay server-side | none | disabled until action exists; error | Narrow Phase 5; platform-only | “if prerequisites still current” | Preserve explicit gate states; consider splitting approve and execute in rewrite. |
| Create post_change validation | Button | `rollback-workspace/view.tsx` | Rollback | Create rollback prerequisite validation | `createValidation` | `POST /validations` | Validation row | local id | requires policy id; busy/error | Gate input | post-change validation required | Preserve. |
| Create rollback | Button | `rollback-workspace/view.tsx` | Rollback | Request compensation | `createRollback`, timeline fetch | `POST /api/v1/rollbacks`, `GET /rollbacks/{id}/timeline` | Rollback row | local ids only | requires parent action, validation, policy | Compensation only | “not SR OS / device restore” | Critical preserve. |
| Approve + execute rollback | Button | `rollback-workspace/view.tsx` | Rollback | Approve/execute compensation | `approveRollback`, `executeRollback` | `POST /rollbacks/{id}/approve`, `POST /rollbacks/{id}/execute` | Rollback decision/status | none | disabled until rollback exists; error | Not universal rollback | “if prerequisites still current” | Preserve explicit platform-only semantics. |

## F. Visual-only, unclear, or needs verification

- Many “Open …” pivots are navigation-only and should not be treated as backend state changes unless the source explicitly calls `apiClient` write methods.
- `Evidence Replay` import/parse actions are local-only; they do not call backend and must not be rewritten as live fetch unless intentionally redesigned.
- `Copy link`, `Reset context`, reload, retry, and route-selection buttons are shell/client state only.
- No modal/dialog action system was found; action surfaces are inline cards and forms.

## Validation performed

Files inspected: `platform/app-web/src/App.tsx`, `src/components/*.tsx`, `src/lib/*.ts`, key feature views for safe action, rollback, workflow lifecycle, preview, validation, evidence quality, dossiers, reports, replay, and global search.

Searches performed: button text and action words (`Open`, `Reload`, `Export`, `Copy`, `Approve`, `Execute`, `Cancel`, `Create`, `download`), `apiClient` usages, navigation helper usages.

Known blind spots: Some repeated object pivot buttons are summarized by family rather than listed as separate rows for each JSX instance.

Confidence level: High for state-changing and export/report actions; medium-high for every read-only pivot label.

Recommended follow-up inspection: run an AST-based JSX button inventory before implementation to produce a mechanical checklist for parity tests.
