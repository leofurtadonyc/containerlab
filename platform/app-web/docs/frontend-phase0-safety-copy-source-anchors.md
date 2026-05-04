# Frontend Phase 0 Safety-Copy Source Anchors

This appendix records exact source locations for high-risk non-claim copy. It is paired with `platform/app-web/tests/frontend-phase1-safety-copy-parity.test.ts`.

| Category | Exact phrase / token | Source | Phase 1 assertion |
| --- | --- | --- | --- |
| Safe Action | `not</strong> device or controller configuration push` | `app-web/src/features/safe-action-workspace/view.tsx:166` | `frontend-phase1-safety-copy-parity.test.ts` |
| Safe Action | `not safe-to-execute` | `app-web/src/features/safe-action-workspace/view.tsx:308` | `frontend-phase1-safety-copy-parity.test.ts` |
| Safe Action | `bounded preview, validation, evidence, and rollback readiness` | `app-web/src/features/safe-action-workspace/view.tsx:258` | `frontend-phase1-safety-copy-parity.test.ts` |
| Rollback | `compensate the platform` | `app-web/src/features/rollback-workspace/view.tsx:108` | `frontend-phase1-safety-copy-parity.test.ts` |
| Rollback | `not SR OS / device restore` | `app-web/src/features/rollback-workspace/view.tsx:109` | `frontend-phase1-safety-copy-parity.test.ts` |
| Rollback | `not</strong> universal undo` | `app-web/src/features/rollback-workspace/view.tsx:110` | `frontend-phase1-safety-copy-parity.test.ts` |
| Preview | `Dry-run / preview engine v1 — not execution` | `app-web/src/api/contracts.ts:2084` | `frontend-phase1-safety-copy-parity.test.ts` |
| Validation | `Validation engine v1 — not preview, not evidence delta, not execution` | `app-web/src/api/contracts.ts:2209` | `frontend-phase1-safety-copy-parity.test.ts` |
| Evidence Replay | `Does **not** call app-api` | `app-web/src/lib/evidence-replay/parse-evidence-export.ts:3` | `frontend-phase1-safety-copy-parity.test.ts` |
| Evidence Replay | `does **not** upgrade replay bytes into live truth` | `app-web/src/lib/evidence-replay/parse-evidence-export.ts:3` | `frontend-phase1-safety-copy-parity.test.ts` |
| Evidence Replay | `never** live platform truth` | `app-web/src/lib/evidence-replay/types.ts:3` | `frontend-phase1-safety-copy-parity.test.ts` |
| Exports/Reports | `impact_report_v1 — communication packaging; not evidence export or briefing bundle` | `app-web/src/features/service-explorer/service-explorer-product.tsx:361` | `frontend-phase1-safety-copy-parity.test.ts` |
| Exports/Reports | `change_safety_case_v1` | `app-web/src/api/contracts.ts:3076` | `frontend-phase1-safety-copy-parity.test.ts` |
| Exports/Reports | `evidence_export_v1` | `app-web/src/api/contracts.ts:1011` | `frontend-phase1-safety-copy-parity.test.ts` |
| Topology/Path | `not dataplane path` | `app-web/src/features/topology/view.tsx:831` | `frontend-phase1-safety-copy-parity.test.ts` |
| Topology/Path | `not sole ODL authority` | `app-web/src/features/topology/view.tsx:832` | `frontend-phase1-safety-copy-parity.test.ts` |
| Topology/Path | `should not be read as path-validation` | `app-web/src/features/topology/view.tsx:1646` | `frontend-phase1-safety-copy-parity.test.ts` |
| Topology/Path | `do not assert controller truth, adjacency validation, or workflow eligibility` | `app-web/src/features/policies/view.tsx:1584` | `frontend-phase1-safety-copy-parity.test.ts` |
| Evidence Quality/Consistency/Stability | `they do not assign root cause` | `app-web/src/features/evidence-quality-workspace/view.tsx:191` | `frontend-phase1-safety-copy-parity.test.ts` |
| Evidence Quality/Consistency/Stability | `not_controller_event_bus` | `app-web/src/api/contracts.ts:1411` | `frontend-phase1-safety-copy-parity.test.ts` |
| Evidence Quality/Consistency/Stability | `not_rollback_or_execution_planning` | `app-web/src/api/contracts.ts:3061` | `frontend-phase1-safety-copy-parity.test.ts` |
| Controller/ODL | `bounded controller-helper probe` | `app-web/src/features/platform-health/view.tsx:313` | `frontend-phase1-safety-copy-parity.test.ts` |
| Controller/ODL | `not a controller control plane` | `app-web/src/features/platform-health/view.tsx:330` | `frontend-phase1-safety-copy-parity.test.ts` |
| Controller/ODL | `Controller southbound session truth and deeper topology truth are separate evidence families` | `app-web/src/features/topology/view.tsx:800` | `frontend-phase1-safety-copy-parity.test.ts` |

## Rewrite Requirement

- Moving copy is allowed only if the category remains covered by an equivalent test assertion.
- Removing a phrase requires updating this appendix and the safety-copy parity test in the same change.
- State-changing workflow copy must remain render-level covered before migration.
