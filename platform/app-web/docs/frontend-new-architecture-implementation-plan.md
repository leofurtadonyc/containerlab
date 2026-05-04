# Frontend New Architecture Implementation Plan

This document turns `frontend-new-architecture-proposal.md` into an execution plan. Phase 0 inventory closure and Phase 1 executable parity gates are complete; do not treat that as permission to rewrite feature UI until the later shell, design-system, and migration phase gates are satisfied.

## Guiding Decision

Use a **side-by-side migration**. Keep the current UI as the default product while introducing typed route, API, test, shell, and design-system foundations behind flags. Cut over only after route, API, safety-copy, export/report/replay, and state-changing workflow parity is proven.

## Phase 0: Mechanical Parity Baseline

Goal: close the known inventory gaps before implementation starts.

Current status: **complete**. The appendices now provide source-backed inventories for feature/test files, API methods, route params, interactions, safety copy, style/accessibility, runtime validation, an exact `contracts.ts` export index, an AST-generated JSX interaction inventory, and exact safety-copy source anchors. Phase 1 has converted the required route/API/download/copy/posture follow-ups into executable parity tests.

Appendix artifacts:

- `platform/app-web/docs/frontend-phase0-feature-test-inventory.md`
- `platform/app-web/docs/frontend-phase0-api-contract-inventory.md`
- `platform/app-web/docs/frontend-phase0-route-interaction-copy-inventory.md`
- `platform/app-web/docs/frontend-phase0-design-runtime-checklist.md`
- `platform/app-web/docs/frontend-phase0-contract-export-index.md`
- `platform/app-web/docs/frontend-phase0-jsx-interaction-inventory.md`
- `platform/app-web/docs/frontend-phase0-safety-copy-source-anchors.md`

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

Inventory findings now captured:

- `platform/app-web/src/features/` contains 107 feature files.
- `platform/app-web/tests/` contains 101 `*.test.*` files.
- `platform/app-web/src/components/` contains 16 shared component files.
- `platform/app-web/src/lib/` contains 50 TypeScript library/helper files.
- Current shell routing has 31 valid `view` ids.
- `ApiClient` exposes 70 async methods; those correspond to a larger operation set because list/detail/timeline/action families expand into multiple backend routes.
- `contracts.ts` has 316 exported mirrors; `frontend-phase0-contract-export-index.md` records the exact TypeScript AST export index, backend schema class-name matches, and direct `ApiClient` response usage.
- Backend route posture now has executable consumed/download-only/backend-only/runtime-only classifications in the Phase 1 route-posture harness.
- `platform/app-web/src/**/*.tsx` contains 800 indexed JSX control elements in the AST-generated interaction appendix.
- High-risk safety copy now has exact phrase/source-location anchors in `frontend-phase0-safety-copy-source-anchors.md`.
- Styling is layered across `styles.css`, `tokens.css`, `base.css`, `shell.css`, and `workspace.css`; `styles.css` remains a large feature-class monolith.
- Accessibility baseline includes skip/main shell behavior, focus-visible styling, nav state, and labeled controls in many surfaces; `aria-live` usage still needs a rewrite decision.
- Runtime remains Vite build into nginx on port 8088 with `/api/` proxied to `app-api:8000` and packaged validation through the platform scripts.

Out of scope:

- new components;
- route registry implementation;
- CSS/design-system changes;
- feature migration.

Acceptance criteria:

- `frontend-inventory-gap-report.md` gaps 1 through 12 and 15 are covered by appendix docs and have Phase 1 parity-test follow-ups.
- Gaps 13 and 14 have design-system/accessibility acceptance criteria before shell/design work.
- The team can answer "what breaks if we lose this file/test/button/endpoint/copy string?" for each high-risk item.
- No Phase 0 inventory blockers remain. Design-system accessibility implementation items, such as `aria-live` policy and flagged shell runtime smoke checks, are Phase 2/Phase 3 acceptance gates rather than Phase 0 inventory work.

## Phase 1: Route and API Parity Harness

Goal: create the safety net before new UI foundations.

Current status: **complete for the first executable parity gate**. The Phase 1 harness now exists in `platform/app-web/tests/frontend-phase1-*.test.ts` and covers route ids, route params, copy/reset semantics, `ApiClient` paths/bodies, download/report/export/replay boundaries, backend route posture, safety-copy anchors, current-test migration dispositions, and the Phase 1 contract guardrail decision.

Detailed plan:

- `platform/app-web/docs/frontend-phase1-route-api-parity-harness-plan.md`

Work packages:

| Work package | Description | Depends on | Acceptance gate |
| --- | --- | --- | --- |
| Route parity spec | Define typed route ids, old aliases, params, canonical object concepts, redirects | Phase 0 route inventory | Every current `view=` id has a migration row. |
| Route tests | Test old `view=` links, parse/build behavior, reset/copy-link expectations | Route parity spec | All old routes parse and serialize. |
| API coverage spec | Define consumed, download-only, backend-only, runtime-only, client-only endpoint posture | Phase 0 API inventory | Every backend route and client method has posture. |
| API path tests | Cover `ApiClient` methods plus download/report/export helpers | API coverage spec | No untested consumed API path remains. |
| Contract guardrail decision | Choose generated OpenAPI client or drift-check harness | Contract inventory | Decision recorded with migration impact. |
| Safety-copy test anchors | Add expected copy anchors for high-risk language categories | Safety-copy inventory | Anchor coverage exists before feature replacement. |

Phase 1 implementation artifacts:

- `platform/app-web/tests/frontend-phase1-route-parity.test.ts`
- `platform/app-web/tests/frontend-phase1-api-parity.test.ts`
- `platform/app-web/tests/frontend-phase1-download-endpoint-parity.test.ts`
- `platform/app-web/tests/frontend-phase1-backend-route-posture.test.ts`
- `platform/app-web/tests/frontend-phase1-safety-copy-parity.test.ts`
- `platform/app-web/tests/frontend-phase1-test-disposition-parity.test.ts`
- `platform/app-web/tests/frontend-phase1-contract-guardrail.test.ts`

Phase 1 inputs from Phase 0:

| Input | Source appendix | How Phase 1 should use it |
| --- | --- | --- |
| Feature/test ownership | `frontend-phase0-feature-test-inventory.md` | Seed migration test ownership and mark tests as keep/port/replace/retire. |
| API method and endpoint posture | `frontend-phase0-api-contract-inventory.md` | Generate API path coverage and endpoint posture allowlists. |
| Route ids, params, and navigation helpers | `frontend-phase0-route-interaction-copy-inventory.md` | Generate typed route definitions and parse/build tests. |
| Interaction and safety-copy families | `frontend-phase0-route-interaction-copy-inventory.md` | Seed JSX interaction audit and safety-copy anchor tests. |
| Style/accessibility/runtime checklist | `frontend-phase0-design-runtime-checklist.md` | Define design-system and packaged-runtime acceptance gates. |

Out of scope:

- changing app navigation;
- replacing `App.tsx`;
- replacing `ApiClient`;
- visual redesign.

Required decisions:

- Keep query-string URLs only, or introduce path routes with query-string compatibility. **Phase 1 decision:** preserve query-string parity only; path-route design remains a Phase 3+ shell decision.
- Generate contracts immediately, or first add a route/client drift checker. **Phase 1 decision:** use a drift-check harness first; defer generated OpenAPI client work until after route/API parity remains green.
- Make safe-action/rollback reject/cancel controls visible, or classify them as hidden/client-only. **Phase 1 decision:** keep list/detail hidden and reject/cancel backend-only for the rewrite baseline; visible create/approve/execute/timeline flows remain parity-covered.
- Add `aria-live` / alert-region behavior for async errors/status, or document why visible-only status is sufficient. **Phase 2 decision:** apply `aria-live="polite"` for loading/refreshing status and `aria-live="assertive"` with `role="alert"` for error query states via shared design-system query-state primitives.
- Treat `/api/v1/exports/maintenance-window-handoff` as backend-only, add a frontend helper, or document a product decision. **Phase 1 decision:** classify as backend-only until a dedicated handoff product helper is designed.

Exit gate:

- A failed parity test blocks any feature migration.
- No new shell/design work starts until route/API/download/copy parity harnesses exist.
- Phase 1 is considered complete when the focused `frontend-phase1-*.test.ts` suite is green.

## Phase 2: Design-System Foundation

Goal: introduce reusable primitives that preserve current states and safety semantics.

Current status: **complete**. Shared design-system primitives are implemented in `platform/app-web/src/design-system/` with token mappings in `platform/app-web/src/styles/design-system.css`, representative adoption in shared shell/query-state surfaces, and executable coverage in `platform/app-web/tests/frontend-phase2-design-system-foundation.test.tsx`.

Implementation artifacts:

- `platform/app-web/src/styles/design-system.css`
- `platform/app-web/src/design-system/button.tsx`
- `platform/app-web/src/design-system/layout.tsx`
- `platform/app-web/src/design-system/query-states.tsx`
- `platform/app-web/src/design-system/data-display.tsx`
- `platform/app-web/src/design-system/forms.tsx`
- `platform/app-web/src/design-system/copy.tsx`
- `platform/app-web/src/design-system/index.ts`
- Shared-surface adoption in `platform/app-web/src/components/shell.tsx` and `platform/app-web/src/components/query-states.tsx`
- Validation in `platform/app-web/tests/frontend-phase2-design-system-foundation.test.tsx`

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
- Existing token families from `tokens.css` are mapped or intentionally replaced.
- Focus-visible and skip-link behavior from the current shell remain present.
- Large feature-specific classes from `styles.css` are not removed until the owning feature migrates.

Exit gate:

- Phase 2 primitives and representative tests are green.
- Existing Phase 1 parity harness remains green after primitive adoption.

## Phase 3: New Shell Behind Flag

Goal: make the new navigation model available without replacing feature content.

Current status: **complete**. The new shell is available behind the `ui=next` runtime/query flag while legacy shell remains the default. Existing `view=` routes and feature components continue to render unchanged through the old-view outlet.

Implementation artifacts:

- `platform/app-web/src/components/next-shell.tsx`
- `platform/app-web/src/lib/shell-mode.ts`
- `platform/app-web/src/lib/next-shell-navigation.ts`
- `platform/app-web/src/App.tsx` shell-mode gating and fallback behavior
- `platform/app-web/src/styles/shell.css` next-shell styles
- `platform/app-web/tests/frontend-phase3-shell-flag.test.tsx`

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

Exit gate:

- Legacy default shell remains unchanged.
- `ui=next` enables the new shell without changing feature behavior.
- Copy link preserves full query context and reset context preserves shell mode with per-route reset semantics.
- Invalid/unknown `view` values fall back to `overview` with explicit compatibility note in next shell.

## Phase 4: Read-Only Core Domains

Goal: migrate low-write, high-traffic surfaces first.

Current status: **complete**. Read-only core-domain surfaces now resolve through typed canonical route ids in the new shell while preserving old `view=` deep-link aliases and unchanged feature rendering/API behavior.

Implementation artifacts:

- `platform/app-web/src/lib/phase4-core-domain-routing.ts`
- `platform/app-web/src/App.tsx` (canonical route resolution, alias canonicalization, per-domain flags)
- `platform/app-web/tests/frontend-phase4-readonly-core-domains.test.ts`

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

Exit gate:

- Legacy `view=` links for `overview`, `platform-health`, `devices`, `topology`, `capabilities`, `readiness`, `policies`, and `service-explorer` canonicalize to new route ids when corresponding domain flags are enabled.
- New canonical routes still carry `view=` aliases for compatibility.
- Per-domain rollback flags (`next_home`, `next_network`, `next_governance`, `next_policy_service`) disable canonicalization without changing feature behavior.
- Existing API/path parity and query-state behavior remains unchanged because migrated surfaces still render existing view components.

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
| Maintenance handoff | backend export route / maintenance window product decision | Decide whether to add a frontend helper or explicitly classify as backend-only; preserve subject-set semantics if exposed. |
| Evidence replay | replay parser/import/live pivots | Reject unsupported roots and keep frozen/live distinction. |

Acceptance criteria:

- every path variant is tested;
- every supported format is listed;
- filename behavior is known;
- replay support/rejection behavior is explicit;
- UI copy names the envelope/report family.
- backend-only/export-only posture for maintenance handoff is explicitly resolved.

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

1. Run focused frontend tests using the repo-approved Dockerized Vitest path when needed.
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

## Resolved Phase 0/1 Blockers

- Phase 0 inventories are complete and have executable Phase 1 parity gates.
- JSX button/link/control inventory is AST-generated in `frontend-phase0-jsx-interaction-inventory.md`.
- Contract export inventory is exact in `frontend-phase0-contract-export-index.md`.
- Safety-copy anchors have exact source locations in `frontend-phase0-safety-copy-source-anchors.md`.
- Safe-action/rollback hidden-helper posture is resolved for Phase 1.
- OpenAPI generation vs drift-check strategy is resolved for Phase 1: drift-check first, generated clients later.
- Standalone `readiness-snapshot-history`, granular controller lane endpoints, runtime `/health`/`/metrics`, and maintenance handoff export have Phase 1 endpoint posture decisions.

## Next Task After Phase 1

Proceed to Phase 2: design-system foundation. Keep feature migration blocked until the design-system primitives preserve the current query states, action semantics, accessibility baseline, and safety-copy language captured by the Phase 0 inventories and Phase 1 parity harness.
