# Frontend New Architecture Implementation Plan

This document turns `frontend-new-architecture-proposal.md` into an execution plan. It is still a planning artifact: do not treat it as permission to rewrite application code until the Phase 0 parity inventories are complete.

## Guiding Decision

Use a **side-by-side migration**. Keep the current UI as the default product while introducing typed route, API, test, shell, and design-system foundations behind flags. Cut over only after route, API, safety-copy, export/report/replay, and state-changing workflow parity is proven.

## Phase 0: Mechanical Parity Baseline

Goal: close the known inventory gaps before implementation starts.

Scope:

| Work package | Output artifact | Source areas | Exit gate |
| --- | --- | --- | --- |
| Feature file inventory | Feature appendix listing every `src/features/**` file, rendered surface, APIs, actions, pivots, tests | `platform/app-web/src/features/` | Every feature file has an owner/migration action. |
| Test inventory | Test appendix mapping each test to protected behavior and migration disposition | `platform/app-web/tests/` | Every test is marked keep, port, replace, or retire with reason. |
| API method inventory | One row per `ApiClient` method with endpoint, HTTP method, request, response, UI use, posture | `platform/app-web/src/api/client.ts` | No grouped method families remain. |
| Contract inventory | Export index for `contracts.ts` and backend schema counterpart where known | `platform/app-web/src/api/contracts.ts`, `platform/app-api/src/app_api/schemas/` | All exports are listed or generated. |
| Route-param inventory | Parse/build inventory for every query param and navigation helper | `src/lib/*navigation*.ts`, `src/features/**/*.tsx`, `src/components/*.tsx` | Every shareable param has a typed owner. |
| Button/link inventory | JSX interaction inventory for buttons, anchors, `onClick`, disabled/loading behavior | `src/components/`, `src/features/` | Every meaningful interaction has an effect classification. |
| Download matrix | Exact endpoint, format, filename, envelope id, replay support/rejection behavior | download helpers, export/report components | `/exports` and `/reports` boundaries are testable. |
| Safety-copy anchors | Exact copy phrase, source location, risk category, assertion | feature/components/tests | Each safety category has regression coverage. |
| Shell metadata inventory | Labels, descriptions, route metadata, copy/reset behavior, fallback | `App.tsx`, `shell.tsx` | New shell has a copy/metadata parity checklist. |
| Runtime serving checklist | Docker/nginx/proxy/verifier checklist | `Dockerfile`, `nginx.conf`, platform scripts | Runtime validation is defined before cutover. |

Out of scope:

- new components;
- route registry implementation;
- CSS/design-system changes;
- feature migration.

Acceptance criteria:

- `frontend-inventory-gap-report.md` gaps 1 through 12 and 15 are either resolved in appendix docs or converted into explicit test work items.
- Gaps 13 and 14 have acceptance criteria before design-system and cutover work.
- The team can answer "what breaks if we lose this file/test/button/endpoint/copy string?" for each high-risk item.

## Phase 1: Route and API Parity Harness

Goal: create the safety net before new UI foundations.

Work packages:

| Work package | Description | Depends on | Acceptance gate |
| --- | --- | --- | --- |
| Route parity spec | Define typed route ids, old aliases, params, canonical object concepts, redirects | Phase 0 route inventory | Every current `view=` id has a migration row. |
| Route tests | Test old `view=` links, parse/build behavior, reset/copy-link expectations | Route parity spec | All old routes parse and serialize. |
| API coverage spec | Define consumed, download-only, backend-only, runtime-only, client-only endpoint posture | Phase 0 API inventory | Every backend route and client method has posture. |
| API path tests | Cover `ApiClient` methods plus download/report/export helpers | API coverage spec | No untested consumed API path remains. |
| Contract guardrail decision | Choose generated OpenAPI client or drift-check harness | Contract inventory | Decision recorded with migration impact. |
| Safety-copy test anchors | Add expected copy anchors for high-risk language categories | Safety-copy inventory | Anchor coverage exists before feature replacement. |

Out of scope:

- changing app navigation;
- replacing `App.tsx`;
- replacing `ApiClient`;
- visual redesign.

Required decisions:

- Keep query-string URLs only, or introduce path routes with query-string compatibility.
- Generate contracts immediately, or first add a route/client drift checker.
- Make safe-action/rollback reject/cancel controls visible, or classify them as hidden/client-only.

Exit gate:

- A failed parity test blocks any feature migration.

## Phase 2: Design-System Foundation

Goal: introduce reusable primitives that preserve current states and safety semantics.

Work packages:

| Work package | Deliverable | Required behavior |
| --- | --- | --- |
| Tokens | Color, spacing, type, border, focus, status/severity tokens | Preserve current warning/error/success distinction without implying safety. |
| Layout primitives | App shell frame, workspace page, object page, split detail, tabbed page | Support current long navigation and narrow screens. |
| Query states | Loading, refreshing, error, empty, sparse, partial, unsupported | Preserve operator copy that explains absence/degradation. |
| Data display | Table, key-value grid, evidence list, timeline, delta list, caveat list | Preserve evidence source/freshness/caveat visibility. |
| Forms | Label, field group, validation message, disabled action area | Preserve accessibility and state-changing action feedback. |
| Action buttons | Navigation, secondary, download, state-changing, destructive/unsafe | State-changing actions must be visually and semantically distinct. |
| Copy/caveat components | Non-claim banner, evidence caveat, backend echo | Bounded language must be reusable, not rewritten per view. |

Out of scope:

- migrating feature behavior;
- merging workspaces;
- changing backend contracts.

Acceptance criteria:

- Primitives render representative states from current UI fixtures.
- Accessibility criteria exist for nav, buttons, forms, file import, tables, tabs, and focus.
- No design token or component name overclaims safety or truth.

## Phase 3: New Shell Behind Flag

Goal: make the new navigation model available without replacing feature content.

Flag posture:

- Default: old shell.
- New shell: `ui=next` or equivalent build/runtime flag.
- Per-domain flags remain off until that domain migrates.

Work packages:

| Work package | Description | Acceptance gate |
| --- | --- | --- |
| Primary nav IA | Home, Network, Policies & Services, Evidence, Change Review, Workflow Controls, Governance | Every old view has a discoverable entry or alias. |
| Breadcrumbs/context bar | Replace route context count with explicit object/tab context | Copy link preserves context. |
| Global search placement | Keep search always visible and navigation-first | Search pivots preserve old params. |
| Copy link/reset context | Preserve full-context copy and per-route reset | Old tests pass under new shell. |
| Old view outlet | Render existing feature components inside new shell where possible | No feature behavior changes yet. |
| Fallback/invalid route | Preserve default overview behavior or tested redirect | Invalid route behavior is explicit. |

Out of scope:

- domain feature rewrites;
- old UI removal.

Rollback:

- Disable new shell flag.
- Keep current shell and old `view=` routes untouched.

## Phase 4: Read-Only Core Domains

Goal: migrate low-write, high-traffic surfaces first.

Order:

1. Home: `overview`, `platform-health`.
2. Network basics: `devices`, base `topology`.
3. Governance basics: `capabilities`, `readiness`.
4. Policy/service inventory shells: base `policies`, `service-explorer`.

For each migrated surface:

| Checklist item | Requirement |
| --- | --- |
| Route | Old `view=` deep link maps to new route. |
| API | Same backend endpoint and query semantics. |
| State | Loading, refreshing, error, empty, sparse, partial covered. |
| Pivots | Object links preserve ids and focus params. |
| Copy | No new production/root-cause/safety claims. |
| Tests | Smoke, route, API, object pivot, and copy tests pass. |

Out of scope:

- action workflows;
- safe-action and rollback;
- removing old feature files.

Rollback:

- Turn off the domain flag.
- Keep old route alias rendering old component.

## Phase 5: Object-Centered Workspaces

Goal: consolidate policy, topology, service, and maintenance object workflows into object pages and tabs.

Migration slices:

| Slice | Current views/panels | New destination | Highest risk |
| --- | --- | --- | --- |
| Policy object | `policies`, dossier, explainability, path, impact, timeline, delta | Policy page tabs | Losing `policy_workspace` and focus params. |
| Topology object | `topology`, object dossier, related policies, failure impact, timeline, delta, stability | Topology Object page tabs | Losing object kind/source/caveat copy. |
| Service object | `service-explorer`, `service-dossier`, timeline, delta, stability, impact | Service page tabs | Encoded `service_id` and catch-all route behavior. |
| Maintenance subject set | `maintenance-preview`, `maintenance-evidence-workspace`, `maintenance-window-workspace` | Maintenance subject tabs | Repeated `mww_subject` and selector semantics. |

Acceptance criteria per slice:

- every old direct route aliases to the new object/tab route;
- all object pivots remain available;
- exports/reports are shown only on supported tabs;
- evidence source/freshness/caveats remain visible;
- no object page infers backend meaning not present in response fields.

Rollback:

- Disable slice flag.
- Keep old object panels and route helpers.

## Phase 6: Evidence and Handoff Workspaces

Goal: migrate composed evidence surfaces while preserving contract boundaries.

Order:

1. `investigation`
2. `situation-room`
3. `operator-briefing`
4. `delta-digest`
5. `evidence-consistency`
6. `evidence-quality-workspace`
7. `stability-workspace`
8. `evidence-replay`

Non-negotiables:

- Do not merge evidence consistency, quality, stability, digest, and situation into a single "truth" surface.
- Preserve `evidence-weakness-explanation` consumption and next-best pivots.
- Preserve evidence replay as frozen/offline import with live pivots only.
- Preserve briefing bundle/export distinctions.

Tests:

- endpoint path coverage;
- sparse/degraded evidence states;
- replay accepted/rejected envelope behavior;
- export bundle boundaries;
- safety-copy anchors for no root cause/no validation/no live truth.

Rollback:

- Disable the evidence domain flag or individual workspace flag.

## Phase 7: Export, Report, and Replay Boundaries

Goal: harden all download-style interactions before action workflows migrate.

Work packages:

| Boundary | Current sources | Preservation requirement |
| --- | --- | --- |
| Evidence export | dossier/situation/investigation/briefing export helpers | Keep `evidence_export_v1` and briefing bundle behavior distinct. |
| Impact report | impact report helpers/components | Keep `/reports/*-impact` separate from `/exports`. |
| Change safety case | CSC helpers/components | Preserve pre-change reasoning and no safe-to-change proof. |
| Maintenance handoff | maintenance window export | Preserve subject-set semantics and filename behavior. |
| Evidence replay | replay parser/import/live pivots | Reject unsupported roots and keep frozen/live distinction. |

Acceptance criteria:

- every path variant is tested;
- every supported format is listed;
- filename behavior is known;
- replay support/rejection behavior is explicit;
- UI copy names the envelope/report family.

Rollback:

- Reuse old download helpers/components.

## Phase 8: Workflow Lifecycle, Preview, and Validation

Goal: migrate lower-risk state-changing workflows before safe action and rollback.

Order:

1. Workflow lifecycle list/detail/timeline.
2. Workflow lifecycle create/transition.
3. Preview list/detail/create.
4. Validation list/detail/create.

Requirements:

- Preserve durable workflow lifecycle vs sync-derived workflow history distinction.
- Preserve preview as bounded, static-local, non-executing.
- Preserve validation as bounded observation, not approval or proof.
- Preserve backend ids and response echo.
- Preserve local busy/error/disabled behavior.

Exit gate:

- Every POST body is covered by tests.
- Every state-changing button has disabled/loading/error assertions.
- No workflow state is stored as product truth in browser storage.

Rollback:

- Keep old workflow/preview/validation components enabled until safe-action phase starts.

## Phase 9: Safe Action and Rollback

Goal: migrate the highest-risk flows last.

Safe action requirements:

- prerequisite chain is visible;
- workflow lifecycle, preview, validation, and action ids are shown;
- safety case remains visible;
- create, approve, and execute preserve backend bodies and response handling;
- reject/cancel/list/detail methods have explicit UI posture;
- copy says platform-only and no device/controller push.

Rollback requirements:

- post-change validation prerequisite is visible;
- compensation-only wording is preserved;
- create, approve, and execute preserve backend bodies and response handling;
- reject/cancel/list/detail methods have explicit UI posture;
- copy says no universal undo and no SR OS/device restore.

Test gates:

- mocked API happy path;
- failed prerequisite path;
- backend error path;
- disabled button path;
- safety-copy anchors;
- route/object id retention where exposed.

Rollback:

- Keep old safe-action and rollback views available until product signoff.
- If any safety-copy or gate test fails, block cutover.

## Phase 10: Runtime Validation and Cutover

Goal: prove the new frontend works in the packaged platform path.

Validation sequence:

1. Run focused frontend tests using the repo-approved validation path.
2. Build packaged app-web image through platform scripts.
3. Deploy the platform runtime where authorized.
4. Run core runtime and auth verifiers from `platform/`.
5. Smoke test old route aliases and new canonical routes.
6. Verify export/report/replay downloads from packaged runtime.
7. Verify feature flag default is correct.

Cutover gate:

- route/API/action/export/replay parity suite is green;
- runtime validation is green or documented as blocked outside frontend control;
- old UI is still recoverable;
- safety-copy review is complete;
- safe-action and rollback signoff is complete;
- no unresolved critical gap remains.

Rollback:

- Flip default flag back to old UI.
- Revert app-web image/tag if needed.
- Keep old route aliases and old tests until after stabilization.

## Phase 11: Old UI Deprecation

Goal: remove old implementation only after confidence, not during cutover.

Removal prerequisites:

- no active domain flag depends on old components;
- old route aliases redirect to tested new canonical routes;
- every old test is ported/replaced/retired with reason;
- safety-copy anchors are owned by new tests;
- product owner accepts route and API migration maps;
- packaged runtime remains green after at least one stabilization pass.

Removal order:

1. unused old feature panels;
2. old shell branches;
3. old route helpers replaced by typed registry aliases;
4. obsolete CSS classes;
5. obsolete tests only after replacement is proven.

Rollback:

- Remove old UI in a dedicated PR so the removal can be reverted independently.

## Suggested PR Sequence

| PR | Theme | Must include | Must not include |
| --- | --- | --- | --- |
| PR 1 | Gap-closing appendices | inventories and migration disposition tables | app source behavior changes |
| PR 2 | Route/API parity tests | route, API, download, safety-copy harnesses | visual rewrite |
| PR 3 | Contract guardrail | OpenAPI generation or drift checker decision/implementation | feature migration |
| PR 4 | Design-system primitives | tokens, query states, layout primitives, component tests | domain behavior changes |
| PR 5 | New shell flag | shell, primary nav, breadcrumbs, search placement | old UI removal |
| PR 6 | Read-only core domains | Home, Network basics, Governance basics | action workflows |
| PR 7 | Policy/service/topology object pages | object tabs and old route aliases | safe action/rollback |
| PR 8 | Maintenance/change review | maintenance tabs, reports, CSC | action execution changes |
| PR 9 | Evidence/handoff/replay | evidence workspaces, replay, exports | safe action/rollback |
| PR 10 | Workflow lifecycle/preview/validation | state-changing forms with tests | safe action/rollback |
| PR 11 | Safe action/rollback | highest-risk flows and signoff | old UI removal |
| PR 12 | Runtime cutover | default flag switch and validation docs | broad cleanup |
| PR 13 | Deprecation | old UI removal | new behavior |

## Workstream Ownership

| Workstream | Owns | Requires coordination with |
| --- | --- | --- |
| Routing | route registry, aliases, params, breadcrumbs | all feature migrations |
| API/contracts | client posture, generated/check contracts, download helpers | backend API owners |
| Design system | primitives, accessibility, visual semantics | safety-copy and feature owners |
| Domain migration | object pages and workspaces | routing/API/design |
| Safety workflows | lifecycle, preview, validation, safe action, rollback | backend and product signoff |
| Testing | parity, smoke, copy, runtime validation | every workstream |
| Runtime | Vite/nginx/image validation | platform deployment owners |

## Blockers to Resolve Before Coding

- Exact `ApiClient` method inventory is not complete.
- Exact route-param inventory is not complete.
- JSX button/link inventory is not complete.
- Contract export inventory is not complete.
- Test inventory is not complete.
- Export/report/download matrix is not complete.
- Safety-copy anchor inventory is not complete.
- Safe-action/rollback reject/cancel UI posture is undecided.
- OpenAPI generation vs drift-check strategy is undecided.

## First Task After This Plan

Create the Phase 0 appendices and parity inventory artifacts. The first coding PR should not begin until those artifacts either exist or are explicitly replaced by generated parity tests.
