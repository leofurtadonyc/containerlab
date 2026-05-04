# Frontend Current State Inventory

## A. Frontend executive summary

The current frontend is the operator-facing product UI for the platform, implemented as a React 18 + Vite + TypeScript single-page application in `platform/app-web`. It is served as a static production build through nginx and proxies `/api` to `app-api`; local development uses Vite with a `/api` proxy. Implemented in `platform/app-web/package.json`, `platform/app-web/vite.config.ts`, `platform/app-web/nginx.conf`, `platform/app-web/src/main.tsx`, and `platform/app-web/src/App.tsx`.

Routing is not React Router. The shell uses query-string routing through `?view=...`; valid view ids are centralized in `platform/app-web/src/nav-views.ts`, selected by `platform/app-web/src/App.tsx`, and manipulated by helpers in `platform/app-web/src/lib/url-app-state.ts` plus feature-specific navigation helpers under `platform/app-web/src/lib/`. Invalid or missing `view` values fall back to `overview`.

The frontend talks to the backend only through the hand-written typed API layer in `platform/app-web/src/api/client.ts` and TypeScript contracts in `platform/app-web/src/api/contracts.ts`. It does not call Postgres, Prometheus, Grafana, ODL, or gNMI directly. Most feature modules expose small `api.ts` hooks that wrap `apiClient` through `useApiQuery` in `platform/app-web/src/api/use-api-query.ts`.

The UI handles loading, error, empty, refresh, and partial states through shared query-state components (`platform/app-web/src/components/query-states.tsx`) plus per-view cards and bounded safety copy. It currently does well at preserving product honesty: read-only workspaces repeatedly distinguish evidence, interpretation, reports, exports, replay, preview, validation, safe action, and rollback. It is confusing and drift-prone because it now contains 31 shell views, many cross-surface pivots, hand-written API contracts, and several composed workspaces whose labels can be mistaken for production authority if rewritten carelessly.

Current maturity classification: **feature-rich bounded MVP**. It is richer than a read-only MVP because it includes workflow lifecycle, preview, validation, safe-action, and rollback surfaces, but it is not an operational beta or production candidate because most surfaces remain bounded interpretation over existing evidence, and the action/rollback slice is platform-only and narrow. This is consistent with `agent/sdn/01-CURRENT-PHASE.md`, `agent/sdn/03-CURRENT-STATUS.md`, `agent/sdn/999-PROJECT-HANDOFF.md`, and the implementation in `platform/app-web/src/App.tsx`.

## B. Application structure

| Path | Purpose | Depends on | Used by | Rewrite importance | Safe to replace | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `platform/app-web/src/main.tsx` | React entrypoint; imports global styles and renders `App`. | React, styles, `App`. | Browser bootstrap. | High. | Yes, if shell contract preserved. | Source of CSS import order. |
| `platform/app-web/src/App.tsx` | Application shell composition, nav groups, `view` switch, copy link/reset context, global search slot. | `nav-views`, `url-app-state`, shell, all view components. | Whole SPA. | Critical. | Replace only with route parity. | Defines visible navigation groups and default fallback. |
| `platform/app-web/src/nav-views.ts` | Single set of valid query-string route ids. | None. | `App`, `url-app-state`. | Critical. | Replace with typed router map. | Preserve or redirect all current ids. |
| `platform/app-web/src/components/shell.tsx` | Sidebar navigation, topbar, global command slot, copy link, reset context, responsive menu. | React. | `App`. | Critical. | Yes with UX parity. | Includes skip link and context-count display. |
| `platform/app-web/src/api/client.ts` | Typed API client and request/error handling. | `contracts.ts`, query-param helpers. | Feature hooks and some action views. | Critical. | Replace with generated or checked client. | Manual contract drift risk. |
| `platform/app-web/src/api/contracts.ts` | Hand-written TypeScript mirror of backend Pydantic contracts. | None. | `client.ts`, feature components. | Critical. | Replace with generated types if backend source remains canonical. | Must not become product truth. |
| `platform/app-web/src/api/use-api-query.ts` | Minimal async query hook with loading/error/refresh state. | `ApiClientError`. | Most feature `api.ts` hooks. | High. | Yes. | No caching/global state. |
| `platform/app-web/src/lib/` | URL state, pivots, download helpers, presentation helpers. | `url-app-state`, contracts. | Cross-view navigation and downloads. | Critical. | Replace with typed route model. | Many rewrite-critical query names live here. |
| `platform/app-web/src/components/query-states.tsx` | Shared loading/error/empty/retry UI. | `ApiClientError`. | Most views. | High. | Yes. | Preserve retry patterns. |
| `platform/app-web/src/components/evidence-export-actions.tsx` | Export JSON/Markdown download UI for evidence exports and briefing bundle. | `evidence-export-download.ts`. | Dossiers, situation/investigation/briefing. | High. | Yes with download parity. | Must keep report/export/replay boundary honest. |
| `platform/app-web/src/components/impact-report-actions.tsx` | Impact report download actions. | `impact-report-download.ts`. | Impact report surfaces. | Medium. | Yes. | Report routes are `/reports`, not `/exports`. |
| `platform/app-web/src/components/change-safety-case-actions.tsx` | Change safety case download actions. | `change-safety-case-download.ts`. | Change Safety Case. | Medium. | Yes. | Not `evidence_export_v1`. |
| `platform/app-web/src/features/` | Feature workspaces and product panels. | API hooks, lib navigation, shared components. | `App` and nested views. | Critical. | Replace incrementally. | Current product capability is here. |
| `platform/app-web/src/styles.css`, `src/styles/` | Global legacy and modular CSS. | CSS class names used across app. | Whole UI. | Medium. | Yes. | Current CSS is broad and class-driven. |
| `platform/app-web/tests/` | Vitest/jsdom coverage for views, navigation, client paths, markers, exports/replay. | Vitest setup. | Validation. | Critical. | Replace only with equal coverage. | Week-numbered tests are contract guards, not stale tests. |

## C. Current UI surface inventory

Every current shell view is registered in `platform/app-web/src/nav-views.ts` and rendered by `platform/app-web/src/App.tsx`.

| View | Route key | Nav group | Source file(s) | Main APIs consumed | State and actions | Tests / rewrite requirement |
| --- | --- | --- | --- | --- | --- | --- |
| Overview | `overview` | Command Center | `src/features/overview/view.tsx`, `src/features/overview/api.ts`, overview panels | `/platform/status`, `/devices`, `/topology`, `/policies`, `/capabilities`, `/change-intelligence/recent-summary`, `/topology/risk-summary`, `/evidence-consistency/summary`, `/stability/summary`, `/evidence-quality-workspace` | `overview_mode`, reload slices, NOC cockpit toggle, many pivots. | `tests/overview-view.test.tsx`, `tests/overview-mode.test.ts`; preserve launch surface and standard/cockpit split. |
| Platform Health | `platform-health` | Command Center | `src/features/platform-health/view.tsx`, `api.ts` | `/platform/status`, `/controller/evidence`, `/change-intelligence/recent-summary` | Reload, degraded policy pivots, evidence cards. | `tests/platform-health-view.test.tsx`; preserve component/read-path honesty. |
| Investigation | `investigation` | Investigate | `src/features/investigation/` | `/investigation-workspace/context` | `sync_runs_limit`, `inv_from`, topology/policy/device context params, reload, pivots. | `tests/investigation-view.test.tsx`; preserve read-only non-authority copy. |
| Situation Room | `situation-room` | Investigate | `src/features/situation-room/` | `/evidence-pack/situation` | `sync_runs_limit`, reload, domain pivots, export-adjacent context. | `tests/situation-room-view.test.tsx`; preserve evidence-pack boundaries. |
| Operator Briefing | `operator-briefing` | Investigate | `src/features/operator-briefing/` | `/operator-briefing`, `/exports/operator-briefing`, per-surface export routes | `sync_runs_limit`, policy/topology/global-search context, reload, export actions, pivots. | `tests/operator-briefing-view.test.tsx`; preserve live vs bundle vs export framing. |
| Delta Digest | `delta-digest` | Investigate | `src/features/delta-digest/` | `/delta-digest` | `sync_runs_limit`, reload, pivots to investigation/situation/dossiers/domains. | `tests/delta-digest-view.test.tsx`; preserve non-causal copy. |
| Evidence Consistency | `evidence-consistency` | Investigate | `src/features/evidence-consistency/` | `/evidence-consistency/summary` | `sync_runs_limit`, reload, row pivots. | `tests/evidence-consistency-view.test.tsx`; preserve “not validation/drift truth”. |
| Evidence Quality | `evidence-quality-workspace` | Investigate | `src/features/evidence-quality-workspace/` | `/evidence-quality-workspace`, `/evidence-weakness-explanation` | `sync_runs_limit`, reload summary/explanation, next-best pivots. | `tests/evidence-quality-workspace-view.test.tsx`; preserve backend explanation consumption and non-root-cause copy. |
| Stability | `stability-workspace` | Investigate | `src/features/stability-workspace/` | `/stability/summary`, optional topology/service stability profiles | `sync_runs_limit`, optional `topology_object`, `topology_object_kind`, `service_id`, reload. | `tests/stability-workspace-view.test.tsx`; preserve optional anchored profile behavior. |
| Devices | `devices` | Network Truth | `src/features/devices/` | `/devices`, plus topology related policies from detail panels where applicable | `limit`, `history_recent_limit`, `device_id`, reload, history/query filters. | `tests/devices-view.test.tsx`; preserve inventory/history/read-side query. |
| Topology | `topology` | Network Truth | `src/features/topology/` | `/topology`, `/topology/truth`, `/controller/evidence`, risk/related/failure/dossier/timeline/delta endpoints | `topology_object`, `topology_object_kind`, `topology_workspace`, `dossier_source`, filters, selection, reload. | `tests/topology-view.test.tsx`; preserve object-centered pivots and dossier workspace. |
| Path Explorer | `path-explorer` | Network Truth | `src/features/path-explorer/` | `/path-explorer?policy_id=` | `path_explorer_policy_id`, reload, pivots to Policies/explainability/dossier. | `tests/path-explorer-product.test.tsx`; preserve policy anchor. |
| Policies | `policies` | Services & Policies | `src/features/policies/` | `/policies`, policy path/topology/timeline/delta/dossier/explainability endpoints | `policy_id`, `policy_workspace`, `degraded_policy_v1_posture`, focus params, reload. | `tests/policies-view.test.tsx`; preserve policy detail panels and workspace toggles. |
| Service Explorer | `service-explorer` | Services & Policies | `src/features/service-explorer/` | `/services`, `/services/{service_id}`, service timeline/delta | `service_id`, `limit`, reload, pivots to service dossier, policy dossier, explainability, node dossier. | `tests/service-explorer-navigation.test.ts`; preserve service id encodings. |
| Service Dossier | `service-dossier` | Services & Policies | `src/features/service-dossier/` | `/services/{service_id}/dossier`, nested service timeline/delta panels | `service_id`, reload, pivots and report action. | `tests/service-dossier-view.test.tsx`; preserve composed workspace. |
| Service Impact | `service-impact-workspace` | Services & Policies | `src/features/service-impact-workspace/` | `/service-impact-workspace?service_id=` | `service_impact_workspace_service_id`, reload, maintenance/stability/report pivots. | `tests/service-impact-workspace-product.test.tsx`; preserve impact non-claims. |
| Maintenance Preview | `maintenance-preview` | Change & Safety | `src/features/maintenance-preview/` | `/maintenance-preview` | `maintenance_node_id`, `maintenance_link_id`, `maintenance_object_id`, `maintenance_object_kind`, `maintenance_preview_context`, setup form, reload. | `tests/maintenance-preview-navigation.test.ts`; preserve “not approval/simulation”. |
| Maintenance Evidence | `maintenance-evidence-workspace` | Change & Safety | `src/features/maintenance-evidence-workspace/` | `/maintenance-evidence-workspace` | Same maintenance subject params, reload, pivots. | `tests/maintenance-evidence-workspace-product.test.tsx`; preserve nested evidence boundaries. |
| Maintenance Window | `maintenance-window-workspace` | Change & Safety | `src/features/maintenance-window-workspace/` | `/maintenance-window-workspace`, `/exports/maintenance-window-handoff` | Repeated `mww_subject`, `preview_context`, `sync_runs_limit`, subject editing, handoff download. | `tests/maintenance-window-workspace-view.test.tsx`; preserve multi-subject URL semantics. |
| Impact Report | `impact-report` | Change & Safety | `src/features/impact-report/` | `/reports/service-impact`, `/reports/policy-impact`, `/reports/maintenance-impact` | Context params for service/policy/maintenance, report download. | `tests/impact-report-navigation.test.ts`; preserve `/reports` vs `/exports`. |
| Change Safety Case | `change-safety-case` | Change & Safety | `src/features/change-safety-case/` | `/reports/change-safety-case/policy`, `/service`, `/maintenance` | `change_safety_context`, `csc_policy_id`, `csc_service_id`, maintenance selectors, download. | `tests/change-safety-case-view.test.tsx`; preserve not-safe-to-change copy. |
| Workflow Lifecycle | `workflow-lifecycle` | Change & Safety | `src/features/workflow-lifecycle/` | `/workflow-lifecycle`, detail, timeline, transitions | Create record, select `workflow_lifecycle_id`, transition status. | `tests/workflow-lifecycle-view.test.tsx`; preserve distinction from sync history. |
| Preview Workspace | `preview-workspace` | Change & Safety | `src/features/preview-workspace/view.tsx` | `POST /previews`, list/detail/diff/timeline client methods | Form: `policy_id`, proposed `intent_state`; run preview; show JSON. | No dedicated file shown in list beyond client path tests; preserve v1 static_local boundary. |
| Validation Workspace | `validation-workspace` | Change & Safety | `src/features/validation-workspace/view.tsx` | `POST /validations`, list/detail/timeline client methods | Form: `policy_id`, `validation_context`; run validation; show JSON. | Preserve unknown/not-applicable verdict honesty. |
| Safe Action | `safe-action-workspace` | Change & Safety | `src/features/safe-action-workspace/view.tsx` | `/workflow-lifecycle`, `/previews`, `/validations`, `/actions`, `/actions/{id}/safety-case` | Create+approve workflow demo shortcut, create preview+validation, create action, approve+execute. | `tests/safe-action-workspace-view.test.tsx`; preserve platform-only non-device effect and gates. |
| Rollback | `rollback-workspace` | Change & Safety | `src/features/rollback-workspace/view.tsx` | `/validations`, `/rollbacks`, approve/execute/timeline | Create post-change validation, create rollback, approve+execute. | `tests/rollback-workspace-view.test.tsx`; preserve compensation-only copy. |
| Workflows | `workflows` | Governance & Platform | `src/features/workflows/` | `/workflow-history` | Read-side query params, selection, history drilldown, reload. | `tests/workflows-view.test.tsx`; preserve sync-history vs lifecycle distinction. |
| Audit | `audit` | Governance & Platform | `src/features/audit/` | `/audit-history` | Read-side query params, selection, history/readiness/policy drilldowns, reload. | `tests/audit-view.test.tsx`; preserve bounded audit copy. |
| Capabilities | `capabilities` | Governance & Platform | `src/features/capabilities/` | `/capabilities` | Reload, readiness/capability pivots. | `tests/capabilities-view.test.tsx`; preserve support-matrix honesty. |
| Readiness | `readiness` | Governance & Platform | `src/features/readiness/` | `/capabilities`, `/readiness-snapshot-history` through view hooks | `readiness_blocker`, `readiness_prerequisite`, `readiness_capability_feature`, reload, drilldown focus. | `tests/readiness-view.test.tsx`; preserve planning-support only. |
| Evidence Replay | `evidence-replay` | Governance & Platform | `src/features/evidence-replay/` | No live fetch for imported file; pivots to live views | File/paste import, parse JSON/Markdown export, live pivots. | `tests/evidence-replay-view.test.tsx`; preserve frozen-vs-live boundary. |

## D. Shared UI patterns

- **Shell layout:** `AppShell` in `platform/app-web/src/components/shell.tsx` renders grouped sidebar navigation, topbar, global search, environment badge, context parameter count, copy link, reset context, mobile menu, and skip link.
- **Navigation:** Route changes use `window.history.replaceState` through `replaceUrlSearchParams`; a custom `app:urlsearchchanged` event updates hooks. Implemented in `platform/app-web/src/lib/url-app-state.ts`.
- **Query state:** `useApiQuery` provides `data`, `error`, `isLoading`, `isRefreshing`, and `reload`. `LoadingState`, `ErrorState`, `EmptyState`, `QueryStateSummaryCard`, and `QueryStateDetailCard` provide common UI.
- **Cards/tables/badges:** Detail cards, summary cards, data tables, `StatusPill`, `IdentifierChip`, trust cue cards, and workspace headers are reused across views.
- **Filters/forms:** Read-side query panels (`limit`, history/sync limits), policy degraded filters, selected object/detail ids, and action forms live in component state and/or URL state.
- **Exports/downloads:** Evidence exports use `/api/v1/exports/...`; impact reports and change safety cases use `/api/v1/reports/...`; replay explicitly rejects report/workspace roots that are not `evidence_export_v1`.
- **Modals/dialogs:** No central modal system was found in inspected files; workflows use inline forms/cards.
- **Loading/error/empty:** Every primary API-backed view has a loading path, retry/error path, and empty/sparse path, with many feature-specific callouts for unsupported, partial, or missing evidence.

## E. Frontend state model

- **URL/query-string state:** Primary route is `view`; context params include object ids, workspace modes, filters, focus hints, sync limits, maintenance subjects, search echoes, and report/action contexts. Defined across `platform/app-web/src/lib/*.ts` and read by views.
- **Local component state:** Forms and selected inputs for preview, validation, workflow lifecycle, safe action, rollback, maintenance setup, and import/replay are local React state.
- **Fetched API state:** `useApiQuery` stores response/error/loading in component scope; no global cache exists.
- **Derived UI state:** Summary cards, ordering, labels, posture classes, and route context counts are derived in components and helpers.
- **Form state:** Action/workflow/preview/validation/rollback forms are local and not persisted.
- **Selection state:** Selection is usually URL-backed (`policy_id`, `topology_object`, `service_id`, `workflow_lifecycle_id`, `device_id`) so deep links work.
- **Filter state:** Read-side limits and degraded policy filter are URL-backed; some table/summary choices are derived.
- **Refresh/retry state:** `reload` from `useApiQuery`; views expose `Reload`, `Retry`, or refresh state copy.
- **Persistence:** No local storage/session storage was found in inspected app code; replay file contents and forms are local only.
- **Global state management:** None; no Redux/Zustand/React Query. The URL is the shared app state bus.

## F. Current frontend maturity

Classification: **feature-rich bounded MVP**.

Justification: The WebUI has a broad operator surface, rich navigation, typed backend client, meaningful tests, and real state-changing surfaces for workflow lifecycle, preview, validation, safe action, and rollback. It is still bounded because most workspaces are read-only interpretation/navigation over existing evidence, contracts are manually synchronized, production security is not present, and safe-action/rollback are narrow platform-only workflows rather than broad network actuation.

## Validation performed

Files inspected: `agent/sdn/04-SESSION-BOOTSTRAP-PROMPT.md`, `agent/sdn/00-RULES-INDEX.md`, `agent/sdn/01-CURRENT-PHASE.md`, `agent/sdn/03-CURRENT-STATUS.md`, `agent/sdn/37-platform-direction-and-delivery-guardrail.md`, `agent/sdn/999-PROJECT-HANDOFF.md`, `agent/sdn/999-AGENT-BOOTSTRAP.md`, `agent/sdn/999-DRIFT-REPORT.md`, `agent/sdn/999-NEXT-TASKS.md`, `platform/app-web/README.md`, `package.json`, `vite.config.ts`, `tsconfig.json`, `src/main.tsx`, `src/App.tsx`, `src/nav-views.ts`, `src/api/client.ts`, `src/api/contracts.ts`, `src/api/use-api-query.ts`, `src/components/shell.tsx`, `src/components/query-states.tsx`, key feature views, `platform/app-api/src/app_api/api/v1/router.py`, backend router list.

Searches performed: feature file inventory, test inventory, component/lib inventory, API client method list, frontend `apiClient` usage, backend router endpoint decorators, action/export/reload/copy button text.

Known blind spots: This inventory is source-inspection based and did not run the app or execute visual walkthroughs. It summarizes many repeated per-view controls rather than reproducing every JSX button instance verbatim.

Confidence level: High for route/API/view inventory; medium-high for exhaustive micro-interaction copy.

Recommended follow-up inspection: run focused source audits for each feature folder before rewriting that feature, and add a generated/current route-to-client contract check before implementation starts.
