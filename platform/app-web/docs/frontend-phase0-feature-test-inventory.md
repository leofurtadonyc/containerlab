# Frontend Phase 0 Feature and Test Inventory

This Phase 0 appendix supports `frontend-new-architecture-implementation-plan.md`. It inventories the current feature and test files that must be preserved, ported, or replaced by stronger parity tests during the frontend rewrite.

Status: **complete for Phase 0**. The feature/test inventory is source-backed and Phase 1 adds executable migration disposition coverage in `platform/app-web/tests/frontend-phase1-test-disposition-parity.test.ts`.

## Summary

| Area | Count | Source |
| --- | ---: | --- |
| Feature files | 107 | `platform/app-web/src/features/` |
| Shared component files | 16 | `platform/app-web/src/components/` |
| Library files | 50 | `platform/app-web/src/lib/` |
| Test files | 101 | `platform/app-web/tests/` |

## Feature File Inventory

### Top-Level Route Views

| File | Current view / surface | Phase 0 migration note |
| --- | --- | --- |
| `platform/app-web/src/features/overview/view.tsx` | `overview` | Preserve standard/NOC cockpit modes and launch pivots. |
| `platform/app-web/src/features/platform-health/view.tsx` | `platform-health` | Preserve platform read-path/controller-helper posture. |
| `platform/app-web/src/features/investigation/view.tsx` | `investigation` | Preserve sync limit, context pivots, and investigation URL context. |
| `platform/app-web/src/features/situation-room/view.tsx` | `situation-room` | Preserve evidence-pack summary and bounded evidence copy. |
| `platform/app-web/src/features/operator-briefing/view.tsx` | `operator-briefing` | Preserve briefing context params and export bundle. |
| `platform/app-web/src/features/delta-digest/view.tsx` | `delta-digest` | Preserve sync limit, pivots, and non-causal digest copy. |
| `platform/app-web/src/features/evidence-consistency/view.tsx` | `evidence-consistency` | Preserve pivot hints and not-validation copy. |
| `platform/app-web/src/features/evidence-quality-workspace/view.tsx` | `evidence-quality-workspace` | Preserve weakness explanation, next-best pivots, and reload states. |
| `platform/app-web/src/features/stability-workspace/view.tsx` | `stability-workspace` | Preserve optional topology/service anchors. |
| `platform/app-web/src/features/evidence-replay/view.tsx` | `evidence-replay` | Preserve frozen/offline replay boundary. |
| `platform/app-web/src/features/devices/view.tsx` | `devices` | Preserve device selection, history/read-side echo, and topology/policy pivots. |
| `platform/app-web/src/features/topology/view.tsx` | `topology` | Preserve topology object selection, truth cues, dossiers, and object workspace modes. |
| `platform/app-web/src/features/policies/view.tsx` | `policies` | Preserve policy selection, workspace modes, filters, and embedded panels. |
| `platform/app-web/src/features/path-explorer/view.tsx` | `path-explorer` | Preserve policy id param and load form. |
| `platform/app-web/src/features/service-explorer/view.tsx` | `service-explorer` | Preserve service list/detail split and service id route. |
| `platform/app-web/src/features/service-dossier/view.tsx` | `service-dossier` | Preserve direct service dossier route alias. |
| `platform/app-web/src/features/service-impact-workspace/view.tsx` | `service-impact-workspace` | Preserve service impact workspace load and direct alias. |
| `platform/app-web/src/features/maintenance-preview/view.tsx` | `maintenance-preview` | Preserve subject selector and bounded preview copy. |
| `platform/app-web/src/features/maintenance-evidence-workspace/view.tsx` | `maintenance-evidence-workspace` | Preserve maintenance evidence subject selectors. |
| `platform/app-web/src/features/maintenance-window-workspace/view.tsx` | `maintenance-window-workspace` | Preserve repeated `mww_subject` semantics. |
| `platform/app-web/src/features/impact-report/view.tsx` | `impact-report` | Preserve `/reports` boundary and report download paths. |
| `platform/app-web/src/features/change-safety-case/view.tsx` | `change-safety-case` | Preserve pre-change reasoning and no-safe-to-change copy. |
| `platform/app-web/src/features/workflows/view.tsx` | `workflows` | Preserve sync-derived workflow history distinction. |
| `platform/app-web/src/features/workflow-lifecycle/view.tsx` | `workflow-lifecycle` | Preserve durable lifecycle create/transition/detail/timeline. |
| `platform/app-web/src/features/preview-workspace/view.tsx` | `preview-workspace` | Preserve preview list/detail/create boundary. |
| `platform/app-web/src/features/validation-workspace/view.tsx` | `validation-workspace` | Preserve validation list/detail/create boundary. |
| `platform/app-web/src/features/safe-action-workspace/view.tsx` | `safe-action-workspace` | Preserve platform-only gates, safety case, create/approve/execute. |
| `platform/app-web/src/features/rollback-workspace/view.tsx` | `rollback-workspace` | Preserve compensation-only gates, create/approve/execute. |
| `platform/app-web/src/features/audit/view.tsx` | `audit` | Preserve bounded audit history and drilldowns. |
| `platform/app-web/src/features/capabilities/view.tsx` | `capabilities` | Preserve capability/readiness pivots. |
| `platform/app-web/src/features/readiness/view.tsx` | `readiness` | Preserve blocker/prerequisite/capability URL anchors. |

### Feature Support Files

| Feature area | Files | Phase 0 migration note |
| --- | --- | --- |
| Overview / NOC cockpit | `overview/api.ts`, `overview/model.ts`, `overview/noc-cockpit-section.tsx`, `overview/noc-cockpit-operator-launch-grid.tsx`, `overview/noc-cockpit-strategic-pivots.tsx`, `overview/evidence-quality-overview-entry.tsx`, `overview/operator-workspace-entry.tsx`, `overview/stability-overview-entry.tsx`, `overview/evidence-consistency-overview-entry.tsx`, `overview/degraded-policies-attention.tsx`, `overview/evidence-replay-overview-entry.tsx`, `overview/operator-briefing-entry.tsx`, `overview/delta-digest-overview-entry.tsx`, `overview/investigation-entry.tsx`, `overview/situation-room-entry.tsx`, `overview/recent-change.tsx` | High-risk launch grid/pivot behavior. Must port or replace with object-centered Home tests. |
| Topology object workspaces | `topology/api.ts`, `topology/topology-object-dossier-workspace.tsx`, `topology/topology-failure-impact-panel.tsx`, `topology/topology-object-evidence-timeline-panel.tsx`, `topology/topology-object-evidence-delta-panel.tsx`, `topology/topology-related-policies-panel.tsx`, `topology/topology-risk-attention-panel.tsx` | Must become Topology Object tabs with route alias tests. |
| Policy workspaces | `policies/api.ts`, `policies/policy-explainability-workspace.tsx`, `policies/policy-path-analysis-panel.tsx`, `policies/policy-dossier-workspace.tsx`, `policies/policy-topology-impact-panel.tsx`, `policies/policy-evidence-timeline-panel.tsx`, `policies/policy-evidence-delta-panel.tsx` | Must become Policy tabs; preserve focus params and bounded copy. |
| Service workspaces | `service-explorer/api.ts`, `service-explorer/service-explorer-product.tsx`, `service-explorer/service-evidence-timeline-panel.tsx`, `service-explorer/service-evidence-delta-panel.tsx`, `service-dossier/api.ts`, `service-dossier/service-dossier-product.tsx`, `service-impact-workspace/api.ts`, `service-impact-workspace/service-impact-workspace-product.tsx` | Must become Service page tabs; encoded `service_id` is high-risk. |
| Maintenance workspaces | `maintenance-preview/api.ts`, `maintenance-preview/maintenance-preview-product.tsx`, `maintenance-evidence-workspace/api.ts`, `maintenance-evidence-workspace/maintenance-evidence-workspace-product.tsx`, `maintenance-window-workspace/api.ts`, `maintenance-window-workspace/maintenance-window-workspace-product.tsx` | Preserve subject resolution, setup forms, repeated subjects, and handoff export. |
| Evidence workspaces | `investigation/api.ts`, `investigation/investigation-workspace-product.tsx`, `investigation/investigation-nav-context-banner.tsx`, `investigation/investigation-surface-entry.tsx`, `investigation/investigation-evidence-timeline.tsx`, `investigation/investigation-context-panels.tsx`, `investigation/investigation-next-inspection.tsx`, `situation-room/api.ts`, `situation-room/situation-room-product.tsx`, `operator-briefing/api.ts`, `operator-briefing/operator-briefing-product.tsx`, `delta-digest/api.ts`, `delta-digest/delta-digest-product.tsx` | Preserve separate backend contract boundaries. |
| Evidence quality | `evidence-quality-workspace/api.ts`, `evidence-quality-workspace/domain-sections.tsx`, `evidence-quality-workspace/labels.ts`, `evidence-quality-workspace/surface-entry.tsx` | Preserve weakness explanation and next-best pivots. |
| Reports and replay | `impact-report/api.ts`, `impact-report/impact-report-product.tsx`, `change-safety-case/api.ts`, `change-safety-case/change-safety-case-product.tsx`, `evidence-replay/evidence-replay-product.tsx` | Preserve `/reports`, `/exports`, and frozen replay boundaries. |
| Global search | `global-search/global-operator-search.tsx` | Preserve always-available navigation-first search and `global_search_q`. |
| Governance API files | `workflows/api.ts`, `devices/api.ts`, `audit/api.ts`, `platform-health/api.ts`, `capabilities/api.ts`, `readiness/view.tsx` | Preserve read-side query echo and drilldowns. |
| Path/stability products | `path-explorer/api.ts`, `path-explorer/path-explorer-product.tsx`, `stability-workspace/api.ts` | Preserve path non-proof and stability non-prediction copy. |

## Shared Component Inventory

| File | Current role | Phase 0 migration note |
| --- | --- | --- |
| `platform/app-web/src/components/shell.tsx` | Shell layout, nav, route context, copy/reset controls | Must be parity-inventoried before shell replacement. |
| `platform/app-web/src/components/workspace-header.tsx` | Workspace headings | Candidate design-system primitive. |
| `platform/app-web/src/components/query-states.tsx` | Loading/error/empty states | Must preserve degraded/sparse/error semantics. |
| `platform/app-web/src/components/status-pill.tsx` | Status visual language | Candidate tokenized primitive. |
| `platform/app-web/src/components/trust-cue-card.tsx` | Trust/caveat display | Preserve evidence caveat semantics. |
| `platform/app-web/src/components/identifier-chip.tsx` | Identifier display | Candidate object identity primitive. |
| `platform/app-web/src/components/evidence-export-actions.tsx` | Evidence export UI | Preserve `/exports` boundary. |
| `platform/app-web/src/components/impact-report-actions.tsx` | Impact report UI | Preserve `/reports/*-impact` boundary. |
| `platform/app-web/src/components/change-safety-case-actions.tsx` | Change safety case UI | Preserve CSC non-claim copy. |
| `platform/app-web/src/components/read-side-query-panel.tsx` | Read-side query controls | Preserve backend echo/query semantics. |
| `platform/app-web/src/components/read-side-query-echo.tsx` | Read-side query echo | Preserve operator visibility. |
| `platform/app-web/src/components/history-evidence-drilldown.tsx` | History pivots | Preserve sync/audit drilldowns. |
| `platform/app-web/src/components/history-policy-evidence-timeline-drilldown.tsx` | Policy timeline drilldown | Preserve focus params. |
| `platform/app-web/src/components/policy-impact-summary.tsx` | Policy impact summary | Preserve non-blast-radius copy. |
| `platform/app-web/src/components/change-intelligence-product-surface-links.tsx` | Product surface links | Preserve recent-change pivots. |
| `platform/app-web/src/components/change-intelligence-overview-link.tsx` | Overview link | Preserve change-intelligence navigation. |

## Test Inventory

### High-Risk Contract and Boundary Tests

These tests should be ported unchanged or replaced by stronger parity tests before cutover.

| Test file | Protected behavior |
| --- | --- |
| `platform/app-web/tests/operator-contract-labeling-anchors.test.ts` | Safety/non-claim copy anchors. |
| `platform/app-web/tests/replay-report-export-route-honesty.test.ts` | Replay/report/export boundary honesty. |
| `platform/app-web/tests/evidence-export-download.test.ts` | Evidence export request paths and filenames. |
| `platform/app-web/tests/evidence-export-actions.test.tsx` | Evidence export UI actions. |
| `platform/app-web/tests/impact-report-download.test.ts` | Impact report request paths. |
| `platform/app-web/tests/change-safety-case-download.test.ts` | Change safety case request paths. |
| `platform/app-web/tests/evidence-replay-parse.test.ts` | Replay parser envelope behavior. |
| `platform/app-web/tests/evidence-replay-pivots.test.ts` | Replay-to-live pivots. |
| `platform/app-web/tests/evidence-replay-replay-to-live.test.tsx` | Replay UI pivots to live app. |
| `platform/app-web/tests/api-client-week28-paths.test.ts` | API client path coverage. |
| `platform/app-web/tests/week35-verifier-bundle-markers.test.ts` | Verifier bundle marker coverage. |
| `platform/app-web/tests/week36-verifier-bundle-markers.test.ts` | Verifier bundle marker coverage. |
| `platform/app-web/tests/week37-verifier-bundle-markers.test.ts` | Verifier bundle marker coverage. |
| `platform/app-web/tests/week38-verifier-bundle-markers.test.ts` | Verifier bundle marker coverage. |
| `platform/app-web/tests/week38-maintenance-window-workspace-bundle-markers.test.ts` | Maintenance window bundle markers. |
| `platform/app-web/tests/safe-action-workspace-view.test.tsx` | Safe-action state-changing gates. |
| `platform/app-web/tests/rollback-workspace-view.test.tsx` | Rollback state-changing gates. |
| `platform/app-web/tests/workflow-lifecycle-view.test.tsx` | Workflow lifecycle create/transition/detail. |

### Full Test File List

| Test file | Initial migration disposition |
| --- | --- |
| `platform/app-web/tests/safe-action-workspace-view.test.tsx` | Port or replace with stronger gated action workflow tests. |
| `platform/app-web/tests/evidence-quality-workspace-view.test.tsx` | Port. |
| `platform/app-web/tests/overview-model.test.ts` | Port if overview model remains; replace if Home model changes. |
| `platform/app-web/tests/week37-verifier-bundle-markers.test.ts` | Keep/port marker assertions. |
| `platform/app-web/tests/topology-view.test.tsx` | Port. |
| `platform/app-web/tests/topology-trust-cues.test.ts` | Port. |
| `platform/app-web/tests/overview-view.test.tsx` | Port. |
| `platform/app-web/tests/api-client-week28-paths.test.ts` | Replace with full API parity harness. |
| `platform/app-web/tests/rollback-workspace-view.test.tsx` | Port or replace with stronger rollback workflow tests. |
| `platform/app-web/tests/workflow-lifecycle-view.test.tsx` | Port. |
| `platform/app-web/tests/evidence-quality-surface-entry.test.tsx` | Port or replace by Home/Evidence entry test. |
| `platform/app-web/tests/week38-verifier-bundle-markers.test.ts` | Keep/port marker assertions. |
| `platform/app-web/tests/maintenance-window-workspace-product.test.tsx` | Port. |
| `platform/app-web/tests/operator-briefing-view.test.tsx` | Port. |
| `platform/app-web/tests/week38-maintenance-window-workspace-bundle-markers.test.ts` | Keep/port marker assertions. |
| `platform/app-web/tests/evidence-quality-workspace-navigation.test.ts` | Port to route parity harness. |
| `platform/app-web/tests/noc-cockpit-maintenance-evidence-week36.test.ts` | Port. |
| `platform/app-web/tests/maintenance-window-workspace-navigation.test.ts` | Port to route parity harness. |
| `platform/app-web/tests/week38-maintenance-window-workspace-cross-surface-pivots.test.ts` | Port. |
| `platform/app-web/tests/global-operator-search-week31.test.ts` | Port. |
| `platform/app-web/tests/maintenance-window-workspace-view.test.tsx` | Port. |
| `platform/app-web/tests/evidence-quality-domain-sections.test.tsx` | Port. |
| `platform/app-web/tests/evidence-replay-view.test.tsx` | Port. |
| `platform/app-web/tests/path-explorer-navigation.test.ts` | Port to route parity harness. |
| `platform/app-web/tests/maintenance-evidence-workspace-navigation.test.ts` | Port to route parity harness. |
| `platform/app-web/tests/maintenance-evidence-workspace-product.test.tsx` | Port. |
| `platform/app-web/tests/stability-workspace-navigation.test.ts` | Port to route parity harness. |
| `platform/app-web/tests/service-impact-workspace-navigation.test.ts` | Port to route parity harness. |
| `platform/app-web/tests/evidence-replay-parse.test.ts` | Keep/port. |
| `platform/app-web/tests/operator-contract-labeling-anchors.test.ts` | Keep/expand. |
| `platform/app-web/tests/service-evidence-delta-panel.test.tsx` | Port. |
| `platform/app-web/tests/policy-dossier-workspace.test.tsx` | Port to Policy tabs. |
| `platform/app-web/tests/topology-dossier-navigation.test.ts` | Port to route parity harness. |
| `platform/app-web/tests/topology-object-dossier-workspace.test.tsx` | Port to Topology Object tabs. |
| `platform/app-web/tests/week35-verifier-bundle-markers.test.ts` | Keep/port marker assertions. |
| `platform/app-web/tests/service-impact-workspace-product.test.tsx` | Port. |
| `platform/app-web/tests/path-explorer-product.test.tsx` | Port. |
| `platform/app-web/tests/service-evidence-timeline-panel.test.tsx` | Port. |
| `platform/app-web/tests/stability-workspace-view.test.tsx` | Port. |
| `platform/app-web/tests/policy-explainability-workspace.test.tsx` | Port to Policy tabs. |
| `platform/app-web/tests/replay-report-export-route-honesty.test.ts` | Keep/expand. |
| `platform/app-web/tests/week36-verifier-bundle-markers.test.ts` | Keep/port marker assertions. |
| `platform/app-web/tests/evidence-export-actions.test.tsx` | Keep/port. |
| `platform/app-web/tests/evidence-consistency-navigation.test.ts` | Port to route parity harness. |
| `platform/app-web/tests/evidence-consistency-view.test.tsx` | Port. |
| `platform/app-web/tests/service-dossier-product.test.tsx` | Port to Service tabs. |
| `platform/app-web/tests/service-dossier-navigation.test.ts` | Port to route parity harness. |
| `platform/app-web/tests/service-dossier-view.test.tsx` | Port. |
| `platform/app-web/tests/change-safety-case-navigation.test.ts` | Port to route parity harness. |
| `platform/app-web/tests/investigation-url-context.test.ts` | Keep/port. |
| `platform/app-web/tests/change-safety-case-download.test.ts` | Keep/port. |
| `platform/app-web/tests/change-safety-case-view.test.tsx` | Port. |
| `platform/app-web/tests/maintenance-preview-navigation.test.ts` | Port to route parity harness. |
| `platform/app-web/tests/impact-report-navigation.test.ts` | Port to route parity harness. |
| `platform/app-web/tests/impact-report-download.test.ts` | Keep/port. |
| `platform/app-web/tests/policy-dossier-navigation.test.ts` | Port to route parity harness. |
| `platform/app-web/tests/policy-path-analysis-panel.test.tsx` | Port to Policy tabs. |
| `platform/app-web/tests/service-explorer-navigation.test.ts` | Port to route parity harness. |
| `platform/app-web/tests/noc-cockpit-priority.test.ts` | Port to Home/NOC cockpit tests. |
| `platform/app-web/tests/operator-search-navigation.test.ts` | Port to route parity harness. |
| `platform/app-web/tests/delta-digest-navigation.test.ts` | Port to route parity harness. |
| `platform/app-web/tests/evidence-replay-pivots.test.ts` | Keep/port. |
| `platform/app-web/tests/operator-briefing-navigation.test.ts` | Port to route parity harness. |
| `platform/app-web/tests/evidence-export-download.test.ts` | Keep/port. |
| `platform/app-web/tests/evidence-replay-replay-to-live.test.tsx` | Keep/port. |
| `platform/app-web/tests/delta-digest-view.test.tsx` | Port. |
| `platform/app-web/tests/delta-digest-pivots.test.ts` | Port. |
| `platform/app-web/tests/topology-risk-attention-panel.test.tsx` | Port. |
| `platform/app-web/tests/topology-failure-impact-panel.test.tsx` | Port. |
| `platform/app-web/tests/situation-room-navigation.test.ts` | Port to route parity harness. |
| `platform/app-web/tests/overview-mode.test.ts` | Port. |
| `platform/app-web/tests/global-search-deeplink.test.ts` | Port to search/route harness. |
| `platform/app-web/tests/workflows-view.test.tsx` | Port. |
| `platform/app-web/tests/policy-evidence-timeline-panel.test.tsx` | Port. |
| `platform/app-web/tests/policy-evidence-delta-panel.test.tsx` | Port. |
| `platform/app-web/tests/policies-view.test.tsx` | Port. |
| `platform/app-web/tests/investigation-view.test.tsx` | Port. |
| `platform/app-web/tests/history-evidence-drilldown.test.ts` | Port. |
| `platform/app-web/tests/platform-health-view.test.tsx` | Port. |
| `platform/app-web/tests/topology-related-policies-panel.test.tsx` | Port. |
| `platform/app-web/tests/devices-view.test.tsx` | Port. |
| `platform/app-web/tests/degraded-policy-v1-hint.test.ts` | Port. |
| `platform/app-web/tests/url-app-state.test.ts` | Replace/expand with typed route registry tests. |
| `platform/app-web/tests/policy-topology-impact-panel.test.tsx` | Port. |
| `platform/app-web/tests/situation-room-view.test.tsx` | Port. |
| `platform/app-web/tests/investigation-timeline.test.ts` | Port. |
| `platform/app-web/tests/investigation-context-domain-nav.test.ts` | Port. |
| `platform/app-web/tests/recent-change-intelligence-panel.test.tsx` | Port. |
| `platform/app-web/tests/change-intelligence-navigation.test.ts` | Port. |
| `platform/app-web/tests/change-intelligence-cues.test.ts` | Port. |
| `platform/app-web/tests/audit-view.test.tsx` | Port. |
| `platform/app-web/tests/readiness-view.test.tsx` | Port. |
| `platform/app-web/tests/readiness-navigation.test.ts` | Port to route parity harness. |
| `platform/app-web/tests/readiness-decision-support-contract.test.ts` | Port. |
| `platform/app-web/tests/entry-surface-readiness-trust.test.ts` | Port. |
| `platform/app-web/tests/capabilities-view.test.tsx` | Port. |
| `platform/app-web/tests/read-side-query-product-copy.test.ts` | Port. |
| `platform/app-web/tests/read-side-query-params.test.ts` | Port. |
| `platform/app-web/tests/policy-history-trust.test.ts` | Port. |
| `platform/app-web/tests/inventory-history-trust.test.ts` | Port. |
| `platform/app-web/tests/fallback-status-display.test.ts` | Port. |

## Phase 0 Closure

- Owner/domain/migration disposition coverage is protected by `platform/app-web/tests/frontend-phase1-test-disposition-parity.test.ts`.
- Route/navigation tests have Phase 1 route parity coverage in `platform/app-web/tests/frontend-phase1-route-parity.test.ts`.
- Safety-copy anchors have an exact source appendix in `platform/app-web/docs/frontend-phase0-safety-copy-source-anchors.md`.
- API/download path coverage is replaced by stronger Phase 1 parity tests in `platform/app-web/tests/frontend-phase1-api-parity.test.ts` and `platform/app-web/tests/frontend-phase1-download-endpoint-parity.test.ts`.
