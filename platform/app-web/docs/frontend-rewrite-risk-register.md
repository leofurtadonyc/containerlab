# Frontend Rewrite Risk Register

| Risk | Category | Description | Why it matters | Current evidence | Impact | Likelihood | Mitigation | Detection method | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Hidden functionality lost | Losing hidden functionality | Many capabilities live in feature panels, not top-level routes. | A rewrite could recreate only obvious pages and lose panels/pivots. | `platform/app-web/src/features/`, `src/lib/` | High | High | Build feature-by-feature parity checklist. | Route/API/action inventory tests. | Frontend lead |
| Deep links broken | Breaking deep links | Current UX depends on query params beyond `view`. | Operators and tests rely on shareable context. | `src/lib/*navigation*.ts`, `src/App.tsx` | High | High | Route migration map and redirects. | Deep-link parity tests. | Frontend lead |
| Safe-action gates weakened | Breaking safe-action flows | Safe action chains workflow, preview, validation, action, safety case, approve, execute. | Could imply unsafe actuation or skip backend gates. | `safe-action-workspace/view.tsx`, `routers/safe_actions.py` | Critical | Medium | Keep backend-owned gate flow and split steps visibly. | Action flow tests, manual review. | Product + backend |
| Rollback semantics overclaimed | Breaking rollback flows | Rollback is platform compensation only. | Rewrite copy could imply device restore. | `rollback-workspace/view.tsx`, rollback docs/routes | Critical | Medium | Preserve copy and prerequisites. | Copy review and tests. | Product + frontend |
| Exports/report routes confused | Breaking exports | `/exports` and `/reports` are distinct route families. | Evidence replay and downloads depend on this boundary. | `evidence-export-download.ts`, `impact-report-download.ts`, `change-safety-case-download.ts` | High | Medium | Separate modules and tests. | Download path tests. | Frontend lead |
| Evidence replay accepts wrong root | Breaking evidence replay | Replay must reject reports/bundles/workspaces that are not single evidence export roots. | Otherwise frozen review semantics break. | `lib/evidence-replay/`, replay tests | High | Medium | Preserve parser rejection cases. | Replay parse tests. | Frontend lead |
| Evidence pivots lost | Breaking evidence pivots | History, quality, consistency, dossiers, search all pivot to detail views. | UI becomes read-only tables without workflow value. | `history-evidence-drilldown.ts`, `evidence-quality-workspace/view.tsx` | High | High | Object-centered route map. | Pivot parity tests. | Frontend lead |
| API contract drift | API contract drift | `contracts.ts` is hand-written. | Backend/frontend mismatch can silently break views. | `src/api/contracts.ts`, backend schemas | High | High | OpenAPI generation or drift check. | Contract test/script. | Frontend + backend |
| Product copy overclaims | Copy overclaim | Names like Safety Case, Validation, Impact, Safe Action can imply authority. | Violates platform honesty and safety. | Current source copy has explicit non-claims. | Critical | Medium | Copy checklist against backend docs. | Copy regression tests/PR review. | Product |
| Frontend owns business logic | Frontend taking backend business logic | Rewrite might duplicate scoring, ranking, or evidence interpretation client-side. | Backend must remain brain. | Project rules; current API contracts own assemblies. | High | Medium | Keep UI rendering/route logic only. | Code review. | Architecture owner |
| Tests lost or weakened | Losing tests | 100+ Vitest files protect navigation, API paths, markers, views. | Rewrite regressions become likely. | `platform/app-web/tests/` | High | High | Port tests before deleting old UI. | Test coverage checklist. | Frontend lead |
| Navigation regression | Navigation regressions | Sidebar is broad but complete; rewrite may hide views. | Operators cannot discover features. | `App.tsx` nav groups | High | Medium | IA migration with route inventory. | Navigation snapshot tests. | UX/frontend |
| Accessibility regression | Accessibility regressions | Current shell has skip link, buttons, aria-current. | Rewrite could degrade keyboard/screen-reader use. | `components/shell.tsx` | Medium | Medium | Accessibility acceptance checklist. | axe/manual keyboard pass. | Frontend lead |
| Performance regression | Performance regressions | Overview intentionally parallelizes core queries and gates heavy cockpit previews. | Serial loading could make UI appear broken. | `README.md`, `features/overview/view.tsx` | Medium | Medium | Keep independent queries parallel. | View loading tests/perf smoke. | Frontend lead |
| Runtime/deployment regression | Runtime/deployment regressions | app-web is Vite/nginx in platform topology. | Broken image/runtime invalidates platform. | `Dockerfile`, `nginx.conf`, `vite.config.ts` | High | Medium | Validate via documented image flow. | build/deploy/verify. | Platform owner |
| Read-only vs state-changing confusion | Confusing read-only versus actions | Most views are read-only; a few create/execute records. | Operators may misunderstand authority. | Action view source and copy | Critical | Medium | Label actions, gates, outcomes. | Copy/action tests. | Product |
| Platform-only vs device action confusion | Platform-only vs device action confusion | Safe action/rollback do not push device config. | Serious safety overclaim. | `safe-action-workspace`, `rollback-workspace` | Critical | Medium | Preserve platform-only language. | PR review + tests. | Product/backend |
| Service route shadowing | API route risk | `/services/{service_id:path}` can swallow subroutes if router order changes. | New client paths can fail unexpectedly. | `api/v1/router.py` comment | Medium | Medium | Route tests and router-order comments. | Backend route tests. | Backend |
| Query param drift | State inventory | Many params are defined across helpers. | Rewritten links may silently drop context. | `src/lib/*.ts` | High | High | Central typed route registry. | Param inventory tests. | Frontend |
| Old drift docs misread | Documentation drift | Older drift report said evidence weakness was unwired; current code consumes it. | Rewrite could omit a now-real panel. | `evidence-quality-workspace/api.ts`, `view.tsx` | Medium | Medium | Treat source as current truth. | API/client usage search. | Docs/frontend |

## Top risk themes

The highest rewrite risks are not CSS or component shape. They are losing route context, weakening safety boundaries, confusing export/report/replay semantics, and recreating backend logic in the browser.

## Validation performed

Files inspected: current source inventories, backend route map, platform status/handoff/drift docs.

Searches performed: route ids, API methods, navigation helpers, action labels, export/report helpers.

Known blind spots: Runtime performance and accessibility were source-reviewed only, not measured.

Confidence level: High.

Recommended follow-up inspection: convert this register into a PR checklist before rewrite implementation starts.
