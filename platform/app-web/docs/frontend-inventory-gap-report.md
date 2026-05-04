# Frontend Inventory Gap Report

This report audits the frontend documentation artifacts created under `platform/app-web/docs/` against the follow-up completeness checklist. It does not modify application source code.

## Summary

The documentation is strong enough for **rewrite planning**: it covers every `view` in `platform/app-web/src/nav-views.ts`, every rendered branch in `platform/app-web/src/App.tsx`, all major backend API families consumed through `platform/app-web/src/api/client.ts`, the major operator workflows, and the highest-risk safety boundaries around preview, validation, safe action, rollback, exports, reports, and replay.

It is **not yet complete enough to start implementation without an additional mechanical parity pass**. Several inventories are intentionally summarized by family rather than enumerated exhaustively. The biggest remaining gaps are exhaustive test-file mapping, exhaustive frontend contract/interface mapping, exact JSX button/link inventories, and route-param inventories across all navigation helpers.

## Gaps

### Gap 1: Feature folder inventory is summarized, not file-complete

Gap:
The docs cover every top-level shell view and major feature family, but they do not enumerate every one of the 107 files under `platform/app-web/src/features/` with purpose, dependencies, UI actions, and rewrite notes.

Why it matters:
Important behavior lives in non-view product panels such as `topology-object-dossier-workspace.tsx`, `policy-dossier-workspace.tsx`, `service-evidence-timeline-panel.tsx`, `noc-cockpit-operator-launch-grid.tsx`, `operator-briefing-product.tsx`, and `evidence-quality-workspace/domain-sections.tsx`. A rewrite could preserve the route but lose nested panels.

Files to inspect:
`platform/app-web/src/features/`

Risk:
High.

Must fix before rewrite: yes.

Recommended correction:
Generate or manually add a feature-file appendix listing every `src/features/**` file with its rendered surface, APIs, buttons, navigation pivots, and tests.

### Gap 2: Test inventory is not exhaustive

Gap:
The docs mention key tests and the test directory, but they do not list every one of the 101 `*.test.*` files under `platform/app-web/tests/` and what behavior each protects.

Why it matters:
Many week-numbered tests are contract guards, not stale historical tests. Dropping or failing to port them could remove verifier bundle marker coverage, route honesty checks, replay/report boundary checks, and navigation parity tests.

Files to inspect:
`platform/app-web/tests/`

Risk:
High.

Must fix before rewrite: yes.

Recommended correction:
Create a test inventory appendix mapping each test file to protected behavior, linked feature/API route, and whether it must be ported unchanged, rewritten, or replaced by a stronger parity test.

### Gap 3: Frontend contracts are not individually inventoried

Gap:
`platform/app-web/src/api/contracts.ts` has 316 exported interfaces/types. The docs map response types by endpoint but do not enumerate every exported contract, nested type, literal union, or its backend schema counterpart.

Why it matters:
The frontend contract file is a manual mirror of backend schemas. Missing nested contracts can break rendering, copy, route pivots, or state interpretation even when top-level endpoints are listed.

Files to inspect:
`platform/app-web/src/api/contracts.ts`; `platform/app-api/src/app_api/schemas/`

Risk:
High.

Must fix before rewrite: yes for implementation; no for high-level planning.

Recommended correction:
Add a generated contract index from `contracts.ts` with top-level export names, endpoint usage if known, backend schema file, and rewrite action. Prefer an automated OpenAPI/client drift check.

### Gap 4: API method map groups several methods instead of listing each one

Gap:
The API dependency map lists most client methods individually, but groups preview, validation, safe-action, rollback, and report method families instead of one row per method.

Why it matters:
The selected prompt asks for every frontend API method. Grouping is useful for planning but not precise enough for parity tests, especially for state-changing methods such as `rejectSafeAction`, `cancelSafeAction`, `rejectRollback`, and `cancelRollback`, which are client methods even if current UI may not expose every one as a visible button.

Files to inspect:
`platform/app-web/src/api/client.ts`; `platform/app-web/src/features/safe-action-workspace/view.tsx`; `platform/app-web/src/features/rollback-workspace/view.tsx`; `platform/app-api/src/app_api/routers/safe_actions.py`; `platform/app-api/src/app_api/routers/rollback_orchestration.py`

Risk:
High.

Must fix before rewrite: yes.

Recommended correction:
Create an exact method inventory from `ApiClient`, including method name, endpoint path, HTTP method, request body, response type, current UI use, unused/client-only status, and required parity test.

### Gap 5: Internal navigation links are summarized by family

Gap:
The navigation map captures major pivot families but does not enumerate every internal navigation call across `src/lib/*.ts`, `src/features/**/*.tsx`, and shared components.

Why it matters:
Current behavior relies on many query params: `policy_workspace`, `policy_dossier_entry`, `policy_explainability_focus`, `topology_workspace`, `dossier_source`, `service_id`, `maintenance_*`, `mww_subject`, `global_search_q`, `inv_from`, `risk_summary_entry`, `failure_impact_entry`, `readiness_*`, and more. Missing one can silently break deep links.

Files to inspect:
`platform/app-web/src/lib/*.ts`; `platform/app-web/src/features/**/*.tsx`; `platform/app-web/src/components/*.tsx`

Risk:
High.

Must fix before rewrite: yes.

Recommended correction:
Generate a route-param inventory from every helper that calls `replaceUrlSearchParams`, `mergeViewIntoSearch`, or `window.location.search`, and add tests for parse/build parity.

### Gap 6: Button/link inventory is not JSX-exhaustive

Gap:
The action/link inventory groups buttons into behavior classes and lists critical state-changing actions, but it does not enumerate every JSX `<button>`, every `onClick`, every link-like button, and every disabled/loading state.

Why it matters:
The rewrite prompt requires every meaningful interaction. Several read-only but important pivots and reload buttons exist deep in panels. Losing them would degrade operator workflows even if no backend state changes.

Files to inspect:
`platform/app-web/src/components/`; `platform/app-web/src/features/`; `platform/app-web/src/lib/`

Risk:
Medium-high.

Must fix before rewrite: yes for implementation; no for planning.

Recommended correction:
Run an AST or structured grep inventory of JSX buttons/anchors and map each to UI type, handler, URL/API effect, disabled/loading behavior, and test coverage.

### Gap 7: Export/report/download inventory needs exact path matrix

Gap:
The docs identify export/report/download route families, but they do not list every request path variant, query param, filename behavior, supported format, and consuming component.

Why it matters:
The project has strict boundaries between `evidence_export_v1`, `briefing_export_bundle_v1`, `impact_report_v1`, `change_safety_case_v1`, `maintenance_window_handoff_v1`, and evidence replay rejection behavior. Path confusion is a high-risk rewrite regression.

Files to inspect:
`platform/app-web/src/lib/evidence-export-download.ts`; `platform/app-web/src/lib/impact-report-download.ts`; `platform/app-web/src/lib/change-safety-case-download.ts`; `platform/app-web/src/components/evidence-export-actions.tsx`; `platform/app-web/src/components/impact-report-actions.tsx`; `platform/app-web/src/components/change-safety-case-actions.tsx`; `platform/app-web/src/lib/evidence-replay/`

Risk:
High.

Must fix before rewrite: yes.

Recommended correction:
Add a download matrix with target kind, endpoint, format values, filename pattern, envelope contract id, replay support/rejection behavior, UI components, and tests.

### Gap 8: Copy risk inventory is thematic, not location-complete

Gap:
The docs identify copy themes that could overclaim safety, validation, root cause, rollback, production readiness, or device actuation, but they do not list every exact source location containing risky terms or bounded non-claim copy.

Why it matters:
The rewrite could accidentally remove precise non-claim language. Risky words appear across safe action, rollback, preview, validation, impact, change safety case, path/topology truth, evidence consistency, evidence quality, stability, maintenance, exports, and replay.

Files to inspect:
`platform/app-web/src/features/`; `platform/app-web/src/components/`; `platform/app-web/src/lib/evidence-replay/`; `platform/app-web/tests/operator-contract-labeling-anchors.test.ts`

Risk:
High.

Must fix before rewrite: yes.

Recommended correction:
Create a safety-copy anchor inventory with exact file/component, phrase, risk category, backend contract basis, and required regression assertion.

### Gap 9: `App.tsx` branch coverage is complete at view level but not metadata-complete

Gap:
The docs cover every rendered `switch` branch and nav item in `App.tsx`, but they do not separately inventory each nav item description string, `VIEW_META` entry, route context count behavior, environment summary behavior, and default branch behavior as testable copy/logic.

Why it matters:
Nav descriptions and topbar context are part of current operator orientation. A rewrite might preserve route ids while losing the framing that keeps workspaces bounded.

Files to inspect:
`platform/app-web/src/App.tsx`; `platform/app-web/src/components/shell.tsx`; `platform/app-web/tests/overview-view.test.tsx`; route/nav tests.

Risk:
Medium.

Must fix before rewrite: no for planning; yes before shell replacement.

Recommended correction:
Add a shell metadata inventory covering nav label, description, group, route title, route description, copy/reset controls, and default fallback.

### Gap 10: View-level loading/error/empty states are not fully enumerated

Gap:
The current docs state that views handle loading/error/empty/partial states, and list major examples, but they do not enumerate every branch in every view component.

Why it matters:
Many product guarantees are expressed in degraded, sparse, empty, or error states. A rewrite could accidentally make partial evidence look like all-clear or hide backend unavailability.

Files to inspect:
`platform/app-web/src/features/**/*.tsx`; `platform/app-web/src/components/query-states.tsx`; `platform/app-web/tests/*view*.test.tsx`

Risk:
Medium-high.

Must fix before rewrite: yes for implementation.

Recommended correction:
Add per-view state branch inventory: loading, refreshing, error, empty, sparse, unsupported, partial, success, and retry behavior.

### Gap 11: Feature-specific local state is summarized, not complete

Gap:
The docs describe URL, local, fetched, derived, form, selection, filter, and refresh state categories but do not list every `useState`, selected id, input field, or local parser state.

Why it matters:
Local state drives state-changing action forms, evidence replay import, maintenance subject editing, workflow lifecycle transitions, and temporary focus/flash behavior. Losing it can break workflows.

Files to inspect:
`platform/app-web/src/features/**/*.tsx`; `platform/app-web/src/api/use-api-query.ts`; `platform/app-web/src/lib/use-url-search-params.ts`

Risk:
Medium.

Must fix before rewrite: yes before feature migration.

Recommended correction:
For each feature migration, include a local-state checklist generated from hooks and route helpers.

### Gap 12: Backend-only and partially consumed API posture needs verification

Gap:
The API map identifies some lane endpoints and partial preview/validation/action/rollback list/detail usage, but it does not fully classify every backend route as consumed, download-only, backend-only, runtime-only, or currently client-method-only.

Why it matters:
Rewrite scope depends on knowing whether an endpoint must appear in the UI. Client methods for reject/cancel/list/detail may exist even if current visible flows do not expose all controls.

Files to inspect:
`platform/app-api/src/app_api/routers/*.py`; `platform/app-web/src/api/client.ts`; `platform/app-web/src/features/`; `platform/app-web/src/lib/*download*.ts`

Risk:
Medium-high.

Must fix before rewrite: yes.

Recommended correction:
Create an endpoint posture table from backend router decorators and frontend usage search, with allowlist reasons for backend-only/runtime-only routes.

### Gap 13: Styling and design-system inventory is shallow

Gap:
The docs identify style files and shared UI patterns but do not map CSS classes, token usage, layout primitives, or component-to-style dependencies.

Why it matters:
A rewrite can intentionally replace styles, but current behavior includes responsive shell, cards, tables, focus flash, warnings, badges, and status visual language. Some classes also carry semantic UI state.

Files to inspect:
`platform/app-web/src/styles.css`; `platform/app-web/src/styles/*.css`; all component class names.

Risk:
Medium.

Must fix before rewrite: no for planning; yes before visual/system implementation.

Recommended correction:
Add a design-system extraction note: current class families, semantic states, reusable primitives, and safe-to-replace areas.

### Gap 14: Accessibility inventory is incomplete

Gap:
The docs mention skip link, `aria-current`, buttons, and responsive behavior, but they do not audit keyboard paths, labels, focus management, file inputs, table semantics, and route focus behavior.

Why it matters:
The rewrite could regress accessibility in a complex operator UI with many tables and controls.

Files to inspect:
`platform/app-web/src/components/shell.tsx`; all feature views with forms/tables/buttons; `platform/app-web/tests/`

Risk:
Medium.

Must fix before rewrite: no for planning; yes before UI cutover.

Recommended correction:
Add accessibility acceptance criteria and a focused keyboard/screen-reader checklist for shell, global search, forms, tables, and downloads.

### Gap 15: Runtime/build/deployment frontend details are only lightly covered

Gap:
The docs mention Vite/nginx and package scripts but do not deeply inventory `Dockerfile`, `nginx.conf`, `scripts/`, built asset verifier expectations, or runtime proxy behavior.

Why it matters:
A rewrite can pass unit tests but fail packaged platform runtime or API proxy behavior.

Files to inspect:
`platform/app-web/Dockerfile`; `platform/app-web/nginx.conf`; `platform/app-web/scripts/`; `platform/scripts/verify-core-runtime.sh`; `platform/INSTALLATION-INSTRUCTIONS.md`

Risk:
Medium.

Must fix before rewrite: yes before cutover.

Recommended correction:
Add runtime frontend serving checklist and validate with the documented platform build/deploy/verify path at cutover.

## Coverage checklist verdict

| Checklist item | Current documentation coverage | Gap status |
| --- | --- | --- |
| Every view in `nav-views.ts` | Covered. | No blocking gap. |
| Every rendered branch in `App.tsx` | Covered at view branch level. | Metadata branch details remain. |
| Every feature folder/file under `src/features` | Covered by major feature family, not file-complete. | Blocking before implementation. |
| Every frontend API method in `client.ts` | Covered by endpoint family; some method families grouped. | Blocking before implementation. |
| Every frontend contract in `contracts.ts` | Not individually covered; 316 exports counted. | Blocking before implementation. |
| Every internal navigation link | Covered by pivot family, not exhaustive. | Blocking before implementation. |
| Every button that calls an API | Critical state-changing buttons covered; all reload/read-only/api buttons not exhaustive. | Blocking before implementation. |
| Every export/report/download action | Covered by family, exact path matrix missing. | Blocking before implementation. |
| Every state-changing action | Major current visible flows covered; client-only reject/cancel methods need posture classification. | Blocking before implementation. |
| Every safe-action and rollback control | Current visible create/approve/execute flows covered; reject/cancel/list/detail posture needs exact method/UI classification. | Blocking before implementation. |
| Every test file | Not individually covered; 101 test files counted. | Blocking before implementation. |
| Risky UI copy areas | Covered thematically; exact phrase/location inventory missing. | Blocking before implementation. |

## Final verdict

`documentation_ready_with_known_limits`

The current artifacts are suitable for rewrite planning, scoping, and risk identification. They should not be treated as sufficient for implementation cutover until the blocking mechanical inventories above are added or converted into parity tests.
