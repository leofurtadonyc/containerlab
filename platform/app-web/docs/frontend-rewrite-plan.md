# Frontend Rewrite Plan

Recommended strategy: **hybrid side-by-side rewrite**. Build a new typed shell/design-system/API-client foundation beside the existing UI, migrate domains incrementally, and keep old routes available until parity checks pass. A big-bang replacement is not justified because the current frontend has 31 routes, many deep-link params, and several safety-critical state-changing workflows.

## Phase plan

| Phase | Goal | Scope | Out of scope | Files likely affected | Acceptance criteria | Tests | Risks | Rollback plan |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Inventory and documentation | Freeze current behavior. | Current docs in `platform/app-web/docs/`; route/API/action inventory. | UI changes. | docs only | Docs cite current source paths and risks. | Docs review. | Incomplete inventory. | Addendum docs before coding. |
| 2. Design system foundation | Create consistent primitives. | Tokens, layout, cards, tables, forms, badges, query states. | Route redesign. | `src/components`, `src/styles` or new UI foundation. | Primitives render current states. | Component tests. | CSS churn. | Keep old components until migrated. |
| 3. Route/navigation model | Replace ad hoc `Set<string>` with typed route registry. | View ids, params, navigation builders, redirects. | Feature rewrites. | `src/nav-views.ts`, `src/lib/*navigation*.ts`, new route registry. | All current deep links parse/build. | Route-param parity tests. | Broken deep links. | Fall back to current helpers. |
| 4. API client and contract strategy | Reduce contract drift. | OpenAPI generation or explicit drift check, typed client paths, download helpers. | Backend schema changes unless needed. | `src/api`, tests, possibly scripts. | Every consumed endpoint covered or allowlisted. | API path/contract tests. | Generated churn or incomplete allowlist. | Keep hand-written client during transition. |
| 5. Shell/layout rebuild | Rebuild app shell with parity. | Sidebar/header/global search/copy/reset/context/breadcrumbs. | Feature content migration. | `App.tsx`, shell components. | All views reachable; global search works; copy/reset work. | Shell/nav tests. | Missing nav item. | Feature flag back to old shell. |
| 6. Read-only domain migration | Migrate core domain pages. | Overview, Platform Health, Devices, Topology, Policies, Capabilities, Readiness. | Action workflows. | feature folders. | Data, loading/error/empty, filters, pivots preserved. | View parity tests. | Lost object pivots. | Keep old feature route. |
| 7. Evidence/workspace migration | Migrate composed evidence views. | Investigation, Situation, Delta Digest, Briefing, Evidence Quality, Consistency, Stability, Replay. | State-changing actions. | feature folders/components. | Non-claims, exports/replay, pivots preserved. | View/export/replay tests. | Copy overclaim. | Keep old workspace components. |
| 8. Service/policy/topology object migration | Migrate object-centered workspaces. | Dossiers, Path Explorer, Service Explorer/Dossier/Impact, policy explainability, topology panels. | New backend semantics. | feature folders/lib routes. | Object routes and nested panels parity. | Object route tests. | Deep-link loss. | Old object workspaces remain. |
| 9. Workflow/action migration | Migrate lifecycle, preview, validation. | Create/transition lifecycle, preview form, validation form. | Safe action/rollback execution until later phase. | workflow/preview/validation features. | State-changing behavior equal; copy bounded. | Action form tests. | Incorrect write body. | Old action components. |
| 10. Safe-action and rollback migration | Migrate highest-risk flows last. | Safe Action, Rollback, safety case, timelines, gates. | Broad action redesign. | safe-action/rollback features and tests. | Backend gates and platform-only wording preserved or stronger. | End-to-end mocked API tests. | Safety overclaim/broken gates. | Keep old components until signoff. |
| 11. Export/report migration | Validate all downloads. | Evidence exports, reports, CSC, maintenance handoff, briefing bundle. | New formats. | download helpers/components. | All paths, filenames, unsupported replay roots pass. | Download/replay tests. | Route-family confusion. | Use old helpers. |
| 12. Parity testing | Prove old/new behavior. | Route snapshots, API mocks, copy anchors, state-changing flows. | New UX scope. | tests. | Parity suite green. | Dockerized Vitest. | Missing fixture coverage. | Block cutover. |
| 13. Runtime validation | Validate packaged build. | Build image, deploy if appropriate, verify core runtime. | Host-only default tests. | platform scripts/docs if needed. | Documented platform validation passes or blockers known. | `./scripts/build-images.sh`, `clab deploy`, verifiers when authorized. | Long-running environment failures. | Keep old build image. |
| 14. Cutover plan | Switch default UI. | Route redirects, old/new feature flags, docs. | Removing old UI immediately. | app entry, docs. | Old and new routes behave as expected. | Smoke + parity tests. | Partial cutover. | Flip flag back. |
| 15. Deprecation/removal | Remove old UI after confidence. | Delete old components/routes/tests only after parity. | Behavior changes. | old feature files/tests. | No references; docs updated. | full frontend tests/build. | Removing useful tests. | Revert removal branch. |

## Branch strategy

Use a long-lived rewrite integration branch only if needed, but keep PRs small and reviewable:

- PR 1: docs + route/API/action parity tests.
- PR 2: route registry/API contract guardrail.
- PR 3: shell/design primitives.
- PRs 4+: migrate one domain family at a time.
- Final PR: cutover and old-code removal after parity.

## Feature flags and side-by-side operation

Use a feature flag or route namespace for the new shell during migration, for example `?ui=next` or a build-time flag, while keeping current `view=` routes intact. Do not expose two conflicting product truths; old and new screens should consume the same backend APIs and show the same bounded copy.

## Comparing old and new behavior

- Snapshot route registry: every old view and context param has a new parse/build test.
- Mock API fixtures: render old/new equivalent states for loading/error/empty/success.
- Copy anchors: assert critical non-claim strings for safe action, rollback, preview, validation, exports, replay, impact, change safety, topology/path truth.
- API path parity: assert every client/download helper path.
- Object pivot parity: assert representative policy/service/topology/device/maintenance/search pivots.

## Validation gates

API parity:

- Every method in `apiClient` has a generated or checked endpoint mapping.
- Download helpers are included in route-family tests.
- Backend-only endpoints are allowlisted with reasons.

Navigation parity:

- Every `PLATFORM_NAV_VIEW_IDS` value has a route migration.
- Every known route param is parsed and serialized.
- `Copy link` and reset context are tested.

Safety copy parity:

- Safe action and rollback must still say platform-only/no device push/no universal rollback.
- Preview and validation must still say no execution/approval/proof.
- Evidence consistency/quality/stability/path/topology must avoid root-cause, validation, SLA, and dataplane claims.

Old UI removal criteria:

- New UI passes route/API/action/export/replay parity tests.
- Packaged app-web build passes.
- Review confirms no application source of truth moved into frontend.
- Product owner accepts route migration map.

## Recommended first implementation task after docs

Add a typed route and API parity test harness before any visual rewrite. It should enumerate current `view` ids, known query params, `ApiClient` methods, and download/report/export paths. This creates a safety net for the rewrite and directly addresses the largest drift risk.

## Validation performed

Files inspected: current docs, routing, API client, feature views, tests, backend router aggregation.

Searches performed: route ids, API methods, action/download helpers, tests inventory.

Known blind spots: This plan does not choose visual design or component library.

Confidence level: High.

Recommended follow-up inspection: estimate implementation slices by feature folder size and test coverage before opening the first rewrite PR.
