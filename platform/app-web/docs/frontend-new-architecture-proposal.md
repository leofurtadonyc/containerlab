# Frontend New Architecture Proposal

## Executive Summary

The recommended frontend architecture is a **hybrid side-by-side rewrite**: introduce a new typed route model, object-centered information architecture, design-system foundation, and contract-checked API layer alongside the current UI, then migrate domain families incrementally behind a feature flag. Do not start with a big-bang replacement.

This proposal is based on:

- `platform/app-web/docs/frontend-current-state-inventory.md`
- `platform/app-web/docs/frontend-navigation-map.md`
- `platform/app-web/docs/frontend-action-link-button-inventory.md`
- `platform/app-web/docs/frontend-api-dependency-map.md`
- `platform/app-web/docs/frontend-workflow-map.md`
- `platform/app-web/docs/frontend-rewrite-requirements.md`
- `platform/app-web/docs/frontend-rewrite-risk-register.md`
- `platform/app-web/docs/frontend-rewrite-plan.md`
- `platform/app-web/docs/frontend-inventory-gap-report.md`

Before implementation, the rewrite must close or convert into parity tests the known inventory gaps from `frontend-inventory-gap-report.md`: feature-file inventory, exact `ApiClient` method inventory, contract export index, route-param inventory, JSX button/link inventory, download matrix, test inventory, and safety-copy anchor inventory.

## 1. Proposed Information Architecture

The current UI has 31 top-level `view=` routes. The new IA should reduce cognitive load by making the main structure object-centered while preserving all current capabilities.

### Primary Areas

1. **Home**
   - Purpose: entry, platform posture, NOC cockpit, recent evidence, search.
   - Current sources: `overview`, `platform-health`.

2. **Network**
   - Purpose: device and topology truth exploration.
   - Current sources: `devices`, `topology`, `path-explorer`.

3. **Policies & Services**
   - Purpose: policy/service inventory, dossiers, path/explainability, evidence chronology/delta, service impact.
   - Current sources: `policies`, `service-explorer`, `service-dossier`, `service-impact-workspace`, `path-explorer`.

4. **Evidence**
   - Purpose: investigation, situation, briefing, digest, evidence quality, consistency, stability, replay.
   - Current sources: `investigation`, `situation-room`, `operator-briefing`, `delta-digest`, `evidence-consistency`, `evidence-quality-workspace`, `stability-workspace`, `evidence-replay`.

5. **Change Review**
   - Purpose: maintenance preview/evidence/window, impact reports, change safety case.
   - Current sources: `maintenance-preview`, `maintenance-evidence-workspace`, `maintenance-window-workspace`, `impact-report`, `change-safety-case`.

6. **Workflow Controls**
   - Purpose: durable lifecycle, preview, validation, safe action, rollback.
   - Current sources: `workflow-lifecycle`, `preview-workspace`, `validation-workspace`, `safe-action-workspace`, `rollback-workspace`.

7. **Governance**
   - Purpose: sync-derived workflow history, audit history, capabilities, readiness.
   - Current sources: `workflows`, `audit`, `capabilities`, `readiness`.

### IA Principle

Top-level navigation should represent operator intent, not implementation history. The old `view=` values should remain deep-link-compatible, but the new navigation can expose fewer primary groups by nesting related object workspaces under policy, service, topology, and maintenance object pages.

## 2. New Navigation Model

Use three layers:

1. **Primary navigation**
   - Home
   - Network
   - Policies & Services
   - Evidence
   - Change Review
   - Workflow Controls
   - Governance

2. **Object navigation**
   - Object switcher and breadcrumbs for:
     - `device_id`
     - `topology_object` + `topology_object_kind`
     - `policy_id`
     - `service_id`
     - maintenance subject(s)
     - `workflow_lifecycle_id`
     - action / rollback ids when exposed

3. **Workspace tabs**
   - Object-local tabs replace many current workspace mode params:
     - Policy: Summary, Dossier, Explainability, Path, Topology Impact, Evidence Timeline, Evidence Delta, Reports.
     - Topology Object: Summary, Dossier, Related Policies, Failure Impact, Risk, Evidence Timeline, Evidence Delta, Stability, Maintenance.
     - Service: Explorer Detail, Dossier, Evidence Timeline, Evidence Delta, Stability, Impact, Reports.
     - Maintenance: Preview, Evidence, Window, Impact Report, Change Safety Case.

Global search remains always visible and navigation-first.

## 3. Route Model

### Recommendation

Adopt a typed route registry while preserving the current query-string route contract during migration.

The new router model should support:

- old `?view=...` compatibility;
- typed route ids;
- typed params per route;
- parse/build functions;
- redirects from old view/mode combinations to new canonical routes;
- testable route metadata: label, IA area, object kind, backend dependencies, safety-copy category.

### Compatibility Approach

Keep current URLs valid:

```text
?view=policies&policy_id=...&policy_workspace=dossier
?view=topology&topology_object=...&topology_object_kind=node&topology_workspace=dossier
?view=maintenance-window-workspace&mww_subject=node:...
```

Map them to canonical internal route objects:

```text
PolicyRoute({ policyId, tab: "dossier" })
TopologyObjectRoute({ objectId, objectKind, tab: "dossier" })
MaintenanceWindowRoute({ subjects })
```

The rewrite may continue using query strings in the browser, but internal code should not pass raw `URLSearchParams` around feature components.

## 4. Object-Centered Navigation Strategy

Objects should become first-class navigation anchors:

| Object | Canonical identity | Current params | New navigation behavior |
| --- | --- | --- | --- |
| Device | `device_id` | `device_id` | Device detail with topology/policy/service/evidence pivots. |
| Topology object | `object_id` + `object_kind` | `topology_object`, `topology_object_kind` | Object page with tabs for dossier, impact, evidence, stability, maintenance. |
| Policy | `policy_id` | `policy_id`, `policy_workspace`, focus params | Policy page with tabs for inventory, dossier, explainability, path, impact, timeline, delta. |
| Service | `service_id` | `service_id`, service-specific ids | Service page with explorer detail, dossier, timeline, delta, stability, impact. |
| Maintenance subject | node/link/object selectors or `mww_subject[]` | `maintenance_*`, `mww_subject` | Maintenance subject set with preview/evidence/window/report tabs. |
| Workflow lifecycle | `workflow_lifecycle_id` | `workflow_lifecycle_id` | Workflow record page with detail/timeline/transitions. |
| Evidence export | file envelope | local replay state | Replay page with frozen snapshot and live pivots. |
| Safe action / rollback | backend ids | local current UI ids; client methods support detail/timeline | Action/rollback detail should become routable if exposed in new UI. |

Object pages must show:

- identity and source;
- evidence strength and freshness;
- related objects;
- available workspaces/tabs;
- explicit caveats/non-claims;
- exports/reports only where backend contracts support them.

## 5. Workspace Consolidation Strategy

Consolidate by object and operator task, not by week/history.

### Keep As Distinct Workspaces

- Global Search: always-on command surface.
- Evidence Replay: distinct frozen-file workflow.
- Safe Action: distinct high-risk workflow.
- Rollback: distinct high-risk workflow.
- Workflow Lifecycle: distinct backend record workflow.
- Audit and sync-derived Workflows: distinct governance/history surfaces.

### Consolidate Into Object Pages

- `policy-dossier`, `policy-explainability`, policy path/timeline/delta panels should become tabs under Policy.
- `topology-object-dossier`, related policies, failure impact, timeline/delta/stability should become tabs under Topology Object.
- `service-explorer`, `service-dossier`, service timeline/delta/stability/impact should become tabs under Service.
- `maintenance-preview`, `maintenance-evidence-workspace`, `maintenance-window-workspace`, maintenance impact report, and topology change safety case should be adjacent tabs under Maintenance.

### Consolidate Evidence Summaries Carefully

Evidence workspaces should remain navigable, but the new IA can group them under Evidence:

- Investigation
- Situation Room
- Operator Briefing
- Delta Digest
- Evidence Consistency
- Evidence Quality
- Stability

Do not merge these into a single “truth” workspace. They represent different backend contracts and must keep their boundaries.

## 6. Design System Approach

Introduce a small product design system before migrating features.

### Foundations

- tokens: color, spacing, typography, elevation, status/severity colors;
- layout: shell, split page, object page, workspace page, detail pane;
- data display: table, key-value grid, evidence list, timeline, delta list, caveat list;
- status: status pill, evidence confidence badge, freshness badge, warning/caveat callout;
- forms: labeled input, select, textarea, field group, validation message;
- actions: primary, secondary, destructive/unsafe, download, navigation pivot;
- query states: loading, refreshing, error, empty, sparse, unsupported, partial.

### Safety Design Rules

- State-changing buttons must be visually distinct from navigation buttons.
- Safe action and rollback buttons must have gate context visible nearby.
- Export/report/download buttons must show the envelope family.
- Evidence replay must visually indicate frozen/offline mode.
- No green “safe” affordance unless the backend contract supports that exact semantics.

## 7. Component Hierarchy

Proposed hierarchy:

```text
AppRoot
  AppProviders
    RouteProvider
    ApiProvider
    SafetyCopyProvider
  AppShell
    PrimaryNavigation
    GlobalOperatorSearch
    Breadcrumbs
    RouteContextBar
    MainRouteOutlet
      HomeArea
      NetworkArea
      PolicyServiceArea
      EvidenceArea
      ChangeReviewArea
      WorkflowControlsArea
      GovernanceArea
```

Object page hierarchy:

```text
ObjectPageLayout
  ObjectHeader
  EvidencePostureStrip
  ObjectTabs
  ObjectActionBar
  ObjectTabPanel
    QueryBoundary
    DomainSection
    PivotList
    CaveatList
```

Action workflow hierarchy:

```text
ActionWorkflowLayout
  SafetyBoundaryHeader
  PrerequisiteStepper
  BackendRecordPanel
  TimelinePanel
  SafetyCasePanel
  ExplicitNonClaims
```

Keep components mostly presentational. Backend interpretation should arrive through API responses, not be recalculated in React components.

## 8. API Client Strategy

### Recommendation

Use a two-step API strategy:

1. **Immediately add a contract drift guardrail** before rewrite coding.
2. **Move toward generated or schema-checked types** from FastAPI OpenAPI once the route inventory is stable.

### Client Layers

```text
api/generated-or-checked-contracts
api/http-client
api/domain-clients
features/*/queries
components
```

### Rules

- Backend schemas remain product truth.
- Every endpoint has one typed method or documented backend-only status.
- Download/report/export helpers are part of API coverage, not exceptions.
- `/reports` and `/exports` must remain separate domain clients.
- Service routes require special tests because `/services/{service_id:path}` can shadow subroutes.
- API errors should use one normalized UI error shape with request id/code/details preserved.

## 9. State Management Strategy

### Keep State Minimal

No global app state store is required for product truth. The backend and URL remain sources of truth.

Use:

- typed route state for shareable context;
- local component state for forms, temporary selections, replay import contents, and in-progress action steps;
- query state for fetched data, loading, refresh, and errors;
- derived state for labels, grouping, sorting, and presentation only.

### Query Strategy

The current `useApiQuery` pattern can evolve into a small typed query layer. Do not introduce a complex cache unless there is a proven need. If a query library is introduced later, it must preserve:

- explicit reload actions;
- refreshing vs initial loading;
- per-view empty/error/sparse copy;
- no frontend-owned business interpretation.

### URL Strategy

Every shareable operator context should be in the route:

- selected object ids;
- workspace tabs;
- filters;
- sync/run limits;
- search echo;
- focus hints;
- maintenance subjects.

Short-lived form contents should remain local unless a requirement says otherwise.

## 10. Testing Strategy

Testing must start before visual migration.

### Required Test Layers

1. **Route parity tests**
   - Every old `view=` route parses.
   - Every old context param has a typed route equivalent.
   - Old-to-new redirects are tested.

2. **API path tests**
   - Every `ApiClient` method is listed.
   - Every download/report/export path is listed.
   - Backend-only endpoints are allowlisted with reasons.

3. **Contract guard tests**
   - OpenAPI/client path coverage or generated type validation.
   - Service route shadowing tests.

4. **View smoke tests**
   - Loading, error, empty, sparse, and success states for each migrated view.

5. **Object pivot tests**
   - Policy, service, topology, device, maintenance, search, history, evidence quality pivots.

6. **Safety copy tests**
   - Safe action: platform-only, no device/controller push.
   - Rollback: compensation-only, no universal undo/device restore.
   - Preview/validation: no execution/approval/proof.
   - Evidence/replay/report/export: correct envelope boundaries.

7. **State-changing action tests**
   - Workflow lifecycle create/transition.
   - Preview create.
   - Validation create.
   - Safe action prerequisites/create/approve/execute.
   - Rollback validation/create/approve/execute.
   - Explicit posture for reject/cancel methods: exposed, hidden, or client-only.

8. **Runtime tests**
   - Dockerized Vitest for focused frontend tests.
   - Packaged platform build/deploy/verify before cutover.

## 11. Migration Strategy

### Recommended Order

1. Close mechanical inventory gaps or convert them into tests.
2. Add typed route registry and API coverage guardrail.
3. Build design-system primitives.
4. Build new shell behind feature flag.
5. Migrate read-only core domains.
6. Migrate object workspaces.
7. Migrate evidence/composed workspaces.
8. Migrate export/report/replay.
9. Migrate workflow lifecycle, preview, validation.
10. Migrate safe action and rollback last.
11. Run parity and runtime validation.
12. Cut over.
13. Remove old UI only after acceptance.

### Side-by-Side vs In-Place Recommendation

Use **side-by-side with a feature flag** for shell and feature migration, then **in-place cutover** only when parity gates pass.

Rationale:

- current UI has many routes and deep links;
- action/rollback flows are safety-sensitive;
- tests protect historical contracts;
- the rewrite needs typed route/API foundations before visual replacement;
- old UI provides a live parity reference.

## 12. Feature Flag Strategy

Use two levels of flags:

1. **Global shell flag**
   - Example: `ui=next` query param or build-time `VITE_APP_WEB_NEXT_UI_ENABLED`.
   - Purpose: run new shell beside old shell.

2. **Per-domain migration flags**
   - Example internal ids:
     - `next.home`
     - `next.network`
     - `next.policyService`
     - `next.evidence`
     - `next.changeReview`
     - `next.workflowControls`
     - `next.governance`

Rules:

- Flags must not change backend semantics.
- Flags must not create two different product truths.
- Old and new paths must consume the same backend APIs during parity.
- The default remains old UI until cutover criteria pass.

## 13. Old-to-New View Mapping

| Old view | New IA location | New route/object concept | Migration note |
| --- | --- | --- | --- |
| `overview` | Home | Home dashboard + cockpit mode | Preserve standard/NOC behavior. |
| `platform-health` | Home / Governance | Platform status page | Keep direct route. |
| `devices` | Network | Device inventory/object page | Preserve `device_id`. |
| `topology` | Network | Topology map/list + Topology Object page | Map `topology_workspace=dossier` to object tab. |
| `path-explorer` | Policies & Services / Network | Policy Path tab or dedicated Path Explorer | Preserve direct deep link. |
| `policies` | Policies & Services | Policy inventory + Policy page tabs | Map `policy_workspace` and focus params to tabs. |
| `service-explorer` | Policies & Services | Service inventory/detail | Preserve `service_id`. |
| `service-dossier` | Policies & Services | Service page `dossier` tab | Preserve direct route alias. |
| `service-impact-workspace` | Policies & Services / Change Review | Service page `impact` tab | Preserve direct route alias. |
| `investigation` | Evidence | Investigation workspace | Preserve `inv_from` and object context. |
| `situation-room` | Evidence | Situation workspace | Preserve sync limit. |
| `operator-briefing` | Evidence | Briefing workspace | Preserve context params and export bundle. |
| `delta-digest` | Evidence | Delta Digest workspace | Preserve global search echo. |
| `evidence-consistency` | Evidence | Evidence Consistency workspace | Preserve sync limit and pivots. |
| `evidence-quality-workspace` | Evidence | Evidence Quality workspace | Preserve weakness explanation panel. |
| `stability-workspace` | Evidence | Stability workspace with optional object/service profiles | Preserve anchors. |
| `evidence-replay` | Evidence | Frozen Evidence Replay | Must remain separate from live evidence. |
| `maintenance-preview` | Change Review | Maintenance subject `preview` tab | Preserve selectors. |
| `maintenance-evidence-workspace` | Change Review | Maintenance subject `evidence` tab | Preserve direct route alias. |
| `maintenance-window-workspace` | Change Review | Maintenance window subject set | Preserve repeated `mww_subject`. |
| `impact-report` | Change Review | Report workspace | Preserve `/reports` boundary. |
| `change-safety-case` | Change Review | Change Safety Case workspace | Preserve not-safe-to-change copy. |
| `workflow-lifecycle` | Workflow Controls | Workflow lifecycle records | Preserve create/transition. |
| `preview-workspace` | Workflow Controls | Preview records/workflow | Preserve v1 static-local boundary. |
| `validation-workspace` | Workflow Controls | Validation records/workflow | Preserve unknown/not-proof copy. |
| `safe-action-workspace` | Workflow Controls | Safe Action workflow | Preserve platform-only gates. |
| `rollback-workspace` | Workflow Controls | Rollback workflow | Preserve compensation-only gates. |
| `workflows` | Governance | Sync-derived workflow history | Preserve distinction from lifecycle. |
| `audit` | Governance | Audit history | Preserve bounded audit framing. |
| `capabilities` | Governance | Capabilities matrix | Preserve readiness pivots. |
| `readiness` | Governance | Readiness planning support | Preserve blocker/prereq/capability params. |

## 14. Old-to-New API Usage Mapping

| Current API family | Current consumers | New architecture owner | Migration rule |
| --- | --- | --- | --- |
| Platform/status/health | Overview, Platform Health | Home / Platform Status | Preserve as core runtime posture; no direct Prometheus/Grafana. |
| Devices | Devices, Overview, pivots | Network domain client | Preserve read-side query and `device_id`. |
| Topology and topology object APIs | Topology, dossiers, maintenance, stability | Network object client | Preserve object identity and all object tabs. |
| Policies and policy detail APIs | Policies, Path, Explainability, Dossier | Policy object client | Preserve all policy tabs and focus aliases. |
| Services APIs | Service Explorer, Dossier, Impact, Stability | Service object client | Preserve encoded `service_id` and route-order tests. |
| Capabilities/readiness | Capabilities, Readiness, Overview, history pivots | Governance client | Preserve planning-support copy. |
| Workflow/audit history | Workflows, Audit | Governance history client | Preserve sync-derived distinction. |
| Investigation/situation/digest/briefing | Evidence workspaces | Evidence client | Preserve separate contract boundaries. |
| Evidence quality/weakness/consistency/stability | Evidence workspaces and Overview | Evidence posture client | Preserve no root-cause/validation claims. |
| Maintenance preview/evidence/window | Maintenance workspaces | Change Review client | Preserve subject selectors and repeated subjects. |
| Reports and change safety case | Impact Report, Change Safety Case | Reports client | Keep `/reports` separate from `/exports`. |
| Evidence exports and handoff | Dossiers, briefing, situation/investigation, maintenance window | Export client | Keep envelope ids and replay behavior explicit. |
| Evidence replay parsing | Evidence Replay | Replay adapter | No backend live fetch for import; pivots only. |
| Workflow lifecycle/preview/validation/actions/rollbacks | Workflow Controls | Workflow/action client | Preserve state-changing gates and copy. |
| Operator search | Global search | Search client | Always visible, navigation-first. |

## 15. Old-to-New Interaction Mapping

| Current interaction family | New interaction pattern | Preservation rule |
| --- | --- | --- |
| Sidebar nav buttons | Primary nav + workspace tabs | All old routes redirect or remain aliases. |
| Copy link | Share current route | Preserve full object/tab/query context. |
| Reset context | Clear object/tab/filter context | Preserve per-route reset behavior. |
| Global search | Command palette/search bar | Preserve grouped results and `global_search_q`. |
| Reload/retry | Query state actions | Preserve initial loading vs refreshing distinction. |
| Read-side filters | URL-backed filters | Preserve backend echo display. |
| Object pivots | Object links and tabs | Preserve policy/service/topology/device/maintenance deep links. |
| Export JSON/Markdown | Export action group | Preserve `/exports` envelope identity. |
| Report downloads | Report action group | Preserve `/reports` identity. |
| Evidence replay import | Frozen replay import panel | Preserve local-only parse and live pivots. |
| Preview/validation forms | Workflow control forms | Preserve backend body semantics and bounded copy. |
| Safe action controls | Gated action stepper | Preserve prerequisite chain, safety case, platform-only execution. |
| Rollback controls | Gated rollback stepper | Preserve post-change validation prerequisite and compensation-only copy. |

## 16. Safety-Copy Preservation Plan

Before implementation, create a safety-copy anchor inventory from current source. The new UI must preserve these categories:

- **Safe Action:** platform-only policy intent overlay; not device/controller configuration push.
- **Rollback:** compensation-only; not SR OS/device restore; not universal undo.
- **Preview:** bounded static-local intent preview; not execution; does not grant authority.
- **Validation:** bounded read-model observability; not approval, proof, or action outcome.
- **Change Safety Case:** pre-change reasoning; not safe-to-change proof.
- **Impact Report:** operator communication; not SLA/blast-radius proof.
- **Evidence Export:** point-in-time envelope; not compliance/tamper evidence by default.
- **Evidence Replay:** frozen/offline review; not live truth.
- **Evidence Consistency/Quality/Stability:** not validation, drift truth, root cause, prediction, or incident authority.
- **Topology/Path:** not universal topology truth, dataplane truth, or TE proof.
- **ODL/Controller:** bounded helper/controller evidence; not source of truth.

Testing requirement: each category must have at least one copy anchor assertion before cutover.

## 17. Cutover Criteria

Cutover may happen only when:

- old-to-new route mapping is complete;
- every old `view=` deep link works or redirects;
- route-param parity tests pass;
- exact `ApiClient` and download path inventories are covered;
- frontend contract or OpenAPI drift check passes;
- all current test behavior is ported/replaced and documented;
- safety-copy anchors pass;
- safe-action and rollback flows pass mocked API tests;
- export/report/replay boundaries pass tests;
- global search and object pivots pass tests;
- packaged app-web build passes;
- documented platform validation path is run or explicitly blocked with reason;
- old UI is still available until final signoff.

## 18. Rollback Plan

Rollback has two meanings here: frontend deployment rollback, not network rollback.

### During Migration

- Keep old UI as default.
- Gate new UI with `ui=next` or a build-time flag.
- Keep old route helpers and old feature components until parity is proven.
- If a migrated domain fails, disable only that domain flag.

### At Cutover

- Retain old UI code for one release window or one stabilization branch.
- Keep old `view=` aliases active.
- Keep old tests until new tests prove equivalent behavior.
- If packaged runtime fails, revert the app-web image/tag or disable the new UI flag.

### After Cutover

- Remove old UI only after:
  - parity tests pass;
  - runtime validation passes;
  - route redirects are documented;
  - product safety copy review is complete;
  - no unresolved critical rewrite risks remain.

## 19. Open Decisions

- Whether to continue pure query-string URLs or introduce path-based routes with query-string compatibility.
- Whether to generate TypeScript contracts from OpenAPI now or start with a drift-check script.
- Whether to introduce a query library or keep a local `useApiQuery` derivative.
- How long to keep the old UI after cutover.
- Whether reject/cancel safe-action and rollback controls should become visible in the new UI or remain client/backoffice capability only.

## 20. Final Recommendation

Proceed with architecture planning and parity harness work, not visual implementation. The first implementation task should be a typed route/API/download parity harness plus safety-copy anchor inventory. After that, build the new shell and design system side-by-side, then migrate domains by object family, leaving safe action and rollback until last.

Do not approve frontend replacement until the known limits from `frontend-inventory-gap-report.md` are resolved or covered by tests.
