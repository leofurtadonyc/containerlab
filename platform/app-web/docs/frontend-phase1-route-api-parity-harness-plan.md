# Frontend Phase 1 Route and API Parity Harness Plan

This document turns the Phase 0 inventories into a first coding PR plan. It is not the rewrite implementation. It defines the parity harness that must exist before shell, design-system, or feature migration work begins.

## Goal

Create executable coverage for the current WebUI contract:

- every current `view=` id;
- every shareable route/query param family;
- copy-link and reset-context behavior;
- every `ApiClient` method path;
- every download/report/export path family;
- endpoint posture allowlists;
- safety-copy anchor categories;
- high-risk existing tests that must remain green or be replaced by stronger equivalents.

The harness should fail loudly if a future rewrite removes or changes current behavior without an explicit migration decision.

## Inputs

| Input | Source |
| --- | --- |
| Phase 1 control plan | `platform/app-web/docs/frontend-new-architecture-implementation-plan.md` |
| Feature and test inventory | `platform/app-web/docs/frontend-phase0-feature-test-inventory.md` |
| API, contract, endpoint inventory | `platform/app-web/docs/frontend-phase0-api-contract-inventory.md` |
| Route, interaction, safety-copy inventory | `platform/app-web/docs/frontend-phase0-route-interaction-copy-inventory.md` |
| Design, accessibility, runtime checklist | `platform/app-web/docs/frontend-phase0-design-runtime-checklist.md` |

## Non-Goals

- Do not replace `App.tsx`.
- Do not introduce the new shell.
- Do not migrate features.
- Do not change backend routes.
- Do not change product copy except to add or stabilize test anchors.
- Do not remove old tests.

## Work Package 1: Route Registry Parity Spec

Deliverable: a testable inventory of current route ids and query params.

### Route Id Coverage

Create parity data for all current route ids:

```text
overview
platform-health
investigation
situation-room
operator-briefing
delta-digest
evidence-consistency
evidence-quality-workspace
stability-workspace
devices
topology
path-explorer
policies
service-explorer
service-dossier
service-impact-workspace
maintenance-preview
maintenance-evidence-workspace
maintenance-window-workspace
impact-report
change-safety-case
workflow-lifecycle
preview-workspace
validation-workspace
safe-action-workspace
rollback-workspace
workflows
audit
capabilities
readiness
evidence-replay
```

Acceptance checks:

- every id in `PLATFORM_NAV_VIEW_IDS` exists in parity data;
- every id in parity data exists in `PLATFORM_NAV_VIEW_IDS`;
- `readViewIdFromSearch` accepts every valid id;
- invalid or absent `view` falls back through the current `overview` behavior;
- every id has a planned new IA destination.

### Query Param Coverage

Add a route-param parity table/test data for:

| Param family | Required coverage |
| --- | --- |
| Shell | `view` |
| Overview | `overview_mode` |
| Read-side | `limit`, `history_recent_limit` |
| Policy | `policy_id`, `policy_workspace`, `policy_dossier_entry`, `policy_explainability_focus`, `policy_evidence_timeline_focus`, `policy_evidence_delta_focus`, `degraded_policy_v1_posture` |
| Topology | `topology_object`, `topology_object_kind`, `topology_workspace`, `dossier_source` |
| Path Explorer | `path_explorer_policy_id` |
| Service | `service_id`, `service_impact_workspace_service_id` |
| Maintenance | `maintenance_node_id`, `maintenance_link_id`, `maintenance_object_id`, `maintenance_object_kind`, `maintenance_preview_context`, repeated `mww_subject` |
| Reports | `impact_report_context`, `impact_service_id`, `impact_policy_id` |
| Change Safety Case | `change_safety_context`, `csc_policy_id`, `csc_service_id` |
| Investigation/Evidence | `sync_runs_limit`, `inv_from`, `failure_impact_entry`, `risk_summary_entry`, `global_search_q` |
| Readiness | `readiness_blocker`, `readiness_prerequisite`, `readiness_capability_feature` |
| Workflow | `workflow_lifecycle_id` |

Acceptance checks:

- every param has an owning route family;
- parse/build helpers preserve expected values;
- repeated `mww_subject` round-trips;
- context reset keeps only `view`;
- copy-link behavior preserves full query context.

## Work Package 2: API Path Parity Spec

Deliverable: executable tests for every current `ApiClient` path and method family.

### Coverage Requirements

The test data should include one case for every method in `frontend-phase0-api-contract-inventory.md`.

Minimum fields per case:

| Field | Purpose |
| --- | --- |
| method name | `ApiClient` method under test |
| HTTP method | GET/POST |
| expected path | full `/api/v1/...` path without host |
| input fixture | method args/body |
| response contract | TypeScript response type name |
| posture | consumed, state-changing consumed, client-method undecided |
| risk | normal, high, critical |

### High-Risk API Families

These must have explicit fixtures, not only broad snapshots:

- `getServices`, `getService`, `getServiceDossier`, `getServiceEvidenceTimeline`, `getServiceEvidenceDelta`, `getServiceStabilityProfile`, because service route ordering and encoded ids are high-risk.
- `getMaintenancePreview`, `getMaintenanceEvidenceWorkspace`, `getMaintenanceWindowWorkspace`, `getMaintenanceImpactReport`, `getTopologyChangeSafetyCase`, because subject selector behavior is high-risk.
- `createWorkflowLifecycle`, `transitionWorkflowLifecycle`, `createPreview`, `createValidation`, `createSafeAction`, `approveSafeAction`, `executeSafeAction`, `createRollback`, `approveRollback`, `executeRollback`, because they are state-changing.
- `rejectSafeAction`, `cancelSafeAction`, `rejectRollback`, `cancelRollback`, because visible UI posture is undecided.
- `getEvidenceWeaknessExplanation`, because older drift docs were stale and current frontend consumes it.

Acceptance checks:

- every `ApiClient` async method has a test fixture;
- every state-changing method fixture asserts HTTP method and body shape;
- every encoded id fixture asserts encoded path behavior;
- client-method-only or undecided methods are not silently dropped;
- future path changes fail until the parity inventory is updated.

## Work Package 3: Download, Report, Export, and Replay Parity

Deliverable: executable path tests for download helpers and replay parser boundaries.

### Path Families

| Family | Required cases |
| --- | --- |
| Evidence export | policy dossier, topology object dossier, situation room summary, investigation summary, operator briefing bundle |
| Impact report | service, policy, maintenance |
| Change safety case | policy, service, maintenance |
| Maintenance handoff | decide backend-only vs frontend helper before cutover |
| Evidence replay | supported envelope roots, rejected roots, live pivot derivation |

Acceptance checks:

- every helper path includes correct `/exports` or `/reports` prefix;
- `json` and `markdown` formats are covered where supported;
- filename pattern is asserted where helper creates downloads;
- replay parser does not convert frozen files into live truth;
- unsupported replay roots are rejected;
- maintenance handoff posture is explicit.

## Work Package 4: Endpoint Posture Allowlist

Deliverable: a checked allowlist classifying backend routes.

Implementation: `platform/app-web/tests/frontend-phase1-backend-route-posture.test.ts` parses current FastAPI router source files and fails if any discovered route lacks a Phase 1 posture decision.

Categories:

| Category | Meaning |
| --- | --- |
| consumed | reachable through `ApiClient` |
| download-only | reachable through download helper/browser fetch |
| runtime-only | operational route not used by SPA |
| backend-only | product/backend route intentionally not exposed |
| client-only | frontend parser/helper without backend request |
| undecided | must be resolved before feature migration |

Resolved special cases:

- standalone `readiness-snapshot-history`: backend-only for Phase 1;
- granular controller evidence lanes: `bgpls`, `pcep`, `netconf`: backend-only behind aggregate controller evidence UI;
- runtime `/health` and `/metrics`: runtime-only;
- `exports/maintenance-window-handoff`: backend-only until a product handoff helper is designed;
- safe-action/rollback list/detail: backend-only for Phase 1;
- safe-action/rollback reject/cancel: backend-only for Phase 1;
- safe-action/rollback timeline: consumed after visible create/execute flows.

Acceptance checks:

- no backend route exists without posture;
- no frontend `ApiClient` method lacks backend route or explicit exception;
- runtime-only routes cannot be accidentally surfaced as product workspaces;
- undecided posture blocks cutover.

## Work Package 5: Safety-Copy Anchor Harness

Deliverable: source-line or render-level assertions for high-risk non-claim copy.

### Anchor Categories

| Category | Required assertion |
| --- | --- |
| Safe Action | platform-only, no device/controller push, not safe-to-execute proof |
| Rollback | compensation-only, no universal undo/device restore |
| Preview | not network execution, not execution authority |
| Validation | not approval/proof/execution |
| Evidence Replay | frozen/offline, not live truth |
| Exports/Reports | evidence export vs impact report vs CSC vs briefing bundle boundaries |
| Topology/Path | not universal topology/dataplane/TE proof |
| Evidence Quality/Consistency/Stability | no root-cause, validation, prediction, or drift-truth claim |
| Controller/ODL | bounded helper evidence, not source of truth |

Acceptance checks:

- each category has at least one current-source anchor;
- each state-changing workflow has render-level copy coverage;
- copy changes require intentional test updates;
- anchors can move files, but the category must remain covered.

## Work Package 6: Existing Test Migration Labels

Deliverable: a migration-disposition list for the 101 current tests.

Allowed dispositions:

- `keep-verbatim`
- `port-to-new-route-harness`
- `replace-with-stronger-parity-test`
- `retire-with-reason`

High-risk tests should default to `keep-verbatim` or `replace-with-stronger-parity-test`:

- verifier bundle marker tests;
- API path tests;
- URL app state tests;
- read-side query tests;
- operator contract labeling anchors;
- replay/report/export honesty tests;
- safe-action and rollback view tests;
- workflow lifecycle tests;
- download helper tests.

Acceptance checks:

- every current test file has a disposition;
- no high-risk test is retired without a written reason;
- new harness tests cite which old tests they replace;
- old tests remain until replacement is proven.

## Work Package 7: Contract Guardrail Decision

Deliverable: documented decision plus first guardrail implementation plan.

Options:

| Option | Use when | Risk |
| --- | --- | --- |
| OpenAPI-generated TypeScript client/types | Backend OpenAPI is stable enough and generated churn is acceptable. | Initial churn; may require adapting current handwritten client. |
| Drift-check harness | Need a lower-churn first step while preserving handwritten `ApiClient`. | Does not remove manual contract duplication. |

Recommendation for first PR:

Start with a drift-check harness and per-export contract index unless OpenAPI generation can be introduced without changing feature code. Generated clients can follow once route/API parity tests are green.

Implementation: `platform/app-web/tests/frontend-phase1-contract-guardrail.test.ts` records the Phase 1 decision as drift-check first, indexes current `contracts.ts` exports at test time, and verifies every `ApiClient` response type is backed by a frontend contract export.

Acceptance checks:

- 316 `contracts.ts` exports are indexed or generation replaces the manual export list;
- every response type used by `ApiClient` has a backend schema counterpart or documented exception;
- schema drift can fail CI before feature migration begins.

## Suggested First Coding PR Shape

Files likely affected:

| Area | Expected files |
| --- | --- |
| Route parity tests | `platform/app-web/tests/*route*parity*.test.ts`, or equivalent |
| API parity tests | `platform/app-web/tests/*api*parity*.test.ts` |
| Download parity tests | extend existing download/helper tests |
| Safety-copy anchors | extend `platform/app-web/tests/operator-contract-labeling-anchors.test.ts` or add a focused parity file |
| Test disposition doc | update Phase 0 feature/test appendix or add a generated migration disposition appendix |
| Contract guardrail | docs first; script/test only if chosen in PR scope |

Must not include:

- new shell;
- new design-system components;
- feature rewrites;
- route behavior changes;
- old UI removal.

## Validation Plan

For focused frontend parity tests, use the Dockerized Vitest flow from `platform/` when host Node tooling is not the known-good path:

```bash
docker run --rm -v "$(pwd)/app-web:/app" -w /app node:22-alpine sh -c "npm ci --no-fund --no-audit && npm test"
```

For cutover-level validation later, use the platform image/deploy/verify path from `platform/INSTALLATION-INSTRUCTIONS.md`; Phase 1 should not require full deployment unless a runtime-specific parity test is added.

## Exit Criteria

Phase 1 is complete when:

- every current `view` id has route parity coverage;
- every listed route param family has parse/build or preservation coverage;
- every `ApiClient` method has path/body coverage;
- every download/report/export helper has path and format coverage;
- endpoint posture allowlist exists and has no unclassified backend routes;
- safety-copy anchors exist for every high-risk category;
- all 101 current tests have migration disposition labels;
- feature migration remains blocked until the harness is green.

## Open Decisions

- Query-string-only route registry vs path-based routes with query compatibility: preserve query-string parity in Phase 1; defer path routing to shell work.
- OpenAPI generation vs drift-check harness for the first coding PR: drift-check harness first.
- Visible vs hidden/client-only posture for safe-action and rollback reject/cancel/list/detail/timeline: list/detail/reject/cancel stay backend-only for Phase 1; timeline is consumed after visible flows.
- Maintenance handoff export frontend posture: backend-only for Phase 1.
- `aria-live` / async status announcement policy: remains a Phase 2 design-system accessibility decision because Phase 1 does not alter runtime UI behavior.
