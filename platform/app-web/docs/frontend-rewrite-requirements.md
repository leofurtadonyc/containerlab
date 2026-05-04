# Frontend Rewrite Requirements

This is the requirement baseline for a rewrite of `platform/app-web`. It is not a visual design.

## A. Non-negotiable preservation requirements

The rewrite must not lose:

1. All 31 current valid `view` routes from `platform/app-web/src/nav-views.ts`, or an explicit redirect/migration plan.
2. The current navigation groups and every current workspace capability documented in `frontend-current-state-inventory.md`.
3. Deep links for policy, topology object, service, device, workflow lifecycle, maintenance subject, search echo, dossier source, and focus parameters.
4. The global operator search workflow and object pivots.
5. The Overview standard/NOC cockpit split or an intentional replacement with parity.
6. All frontend-consumed backend APIs in `platform/app-web/src/api/client.ts`.
7. Evidence export, report download, briefing bundle, maintenance handoff, and evidence replay distinctions.
8. Loading, error, empty, retry, refresh, partial, unsupported, sparse, and degraded states.
9. Read-side query params and backend echo display for devices, policies, workflow history, and audit history.
10. Object pivots among devices, topology objects, policies, services, readiness, investigation, situation room, briefing, reports, and maintenance workspaces.
11. State-changing workflows: workflow lifecycle, preview, validation, safe action, and rollback.
12. Safe-action boundaries: one bounded platform-only action slice, prerequisite gates, safety case, and no device/controller push claim.
13. Rollback boundaries: compensation-only platform intent overlay, post-change validation prerequisite, and no universal undo/device restore claim.
14. Bounded product copy that avoids unsupported production, safe-to-change, root-cause, validation, topology truth, path truth, or multi-vendor claims.
15. Existing Vitest coverage intent, including week-numbered contract-marker tests.

## B. Architecture requirements

- Frontend must remain API-driven and must not own backend business logic.
- Backend Pydantic schemas and `/api/v1` contracts remain product truth.
- Public models in the UI must remain vendor-neutral and must not become Nokia-locked.
- Route/view definitions should become explicit, typed, and centralized beyond the current `Set<string>`.
- API client should be generated from backend OpenAPI or contract-checked against backend routes.
- Feature code should be organized around product domains and object workflows, not just historical week slices.
- Object-centered navigation should be a primary route model: policy, service, topology object, device, maintenance subject, workflow/action.
- State-changing actions must be visibly gated and test-covered.
- Download/report/export/replay route families must stay separate in code and copy.
- No direct calls to Prometheus, Grafana, Postgres, ODL, or gNMI from the frontend.

## C. UX requirements

- Navigation must reduce cognitive load without hiding capability.
- Every current view must have a discoverable entry point or migrated equivalent.
- Object pages should support object summary, evidence, related objects, pivots, exports/reports where applicable, and caveats.
- Breadcrumbs/context banners should replace or supplement the current route context count for complex deep links.
- Global search should remain always available and navigation-first.
- Filtering should be URL-backed where it affects shareable context.
- Evidence displays must distinguish missing evidence, weak evidence, stale evidence, inferred evidence, controller evidence, persisted fallback, and observed state.
- Timelines/deltas must avoid forensic/root-cause/drift claims unless backend says so.
- Action flows must show prerequisites, current ids, backend responses, errors, disabled states, and clear next steps.
- Forms must have explicit labels and preserve current field semantics.
- Empty/error/degraded states must tell operators what is absent and where to go next.
- Accessibility must preserve the skip link, button semantics, `aria-current`, responsive sidebar behavior, and keyboard-reachable controls.
- Responsive behavior must keep navigation and global search usable on narrow screens.

## D. Product copy requirements

Use bounded language:

- Avoid “root cause” unless backend explicitly proves root-cause authority.
- Avoid “safe to execute” unless backend contract guarantees that exact claim.
- Avoid “production ready”.
- Distinguish missing evidence from negative evidence.
- Distinguish controller evidence from device evidence.
- Distinguish observed state from intended state.
- Distinguish sync-derived workflow history from durable workflow lifecycle records.
- Distinguish preview, validation, action, rollback, evidence export, evidence replay, impact report, and change safety case.
- Distinguish platform-only action/rollback from device/controller action.
- Preserve current explicit non-claims on safe action, rollback, maintenance, impact, path, topology truth, evidence quality, evidence consistency, and stability.

## E. Technical requirements

- Maintain TypeScript strictness.
- Replace or harden the hand-written `contracts.ts` flow.
- Preserve same-origin `/api` production proxy and `VITE_APP_API_BASE_URL` dev override.
- Preserve Vite + React build unless there is a documented migration plan.
- Keep tests in Vitest/jsdom or provide equivalent frontend test coverage.
- Add route-param parity tests for every migrated route.
- Add API client path coverage tests for every consumed route and download helper.
- Add action-flow tests for preview, validation, lifecycle, safe action, and rollback.
- Introduce an error boundary for catastrophic render failures if the rewrite changes component architecture.
- Keep runtime stateless; do not introduce local/session storage for product truth without a requirement.
- Keep CSS/design system consistent; replace ad hoc class sprawl with tokens/components only if it preserves behavior.
- Build/deploy must still work through the documented platform image path in `platform/INSTALLATION-INSTRUCTIONS.md`.

## F. Rewrite acceptance criteria

The rewritten frontend can replace the current one only when:

- every current `view` deep link is supported or redirected;
- every current backend API capability exposed by the UI is still exposed;
- all state-changing workflows behave with equal or stronger gates;
- all exports, reports, bundles, handoffs, and replay pivots still work;
- all major object pivots are parity-tested;
- all safety/non-claim copy is reviewed against current backend contracts;
- Vitest or equivalent tests cover route parsing, API paths, view smoke states, action flows, export/report boundaries, replay boundaries, and global search;
- packaged build succeeds in the documented platform validation path;
- docs include the final route migration map and API dependency map;
- the old UI is not removed until parity checks pass.

## Validation performed

Files inspected: `platform/app-web/src/App.tsx`, `src/nav-views.ts`, `src/api/client.ts`, `src/api/contracts.ts`, feature files, tests, platform rules/status/handoff docs.

Searches performed: API methods, route ids, action labels, download/report/export helpers, backend routes.

Known blind spots: This requirements doc does not choose final design patterns or component library.

Confidence level: High.

Recommended follow-up inspection: convert these requirements into executable parity tests before coding the rewrite.
