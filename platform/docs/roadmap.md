# Platform Roadmap

## Purpose

This document summarizes the platform's phased implementation roadmap.

## Current Status

The project is currently in `Phase 2 — read-only product foundation`.

Most of the week's work has established:

- repository structure
- service boundaries
- topology skeleton
- observability scaffolding
- backend, collector, frontend, and database-direction scaffolding
- normalized model and schema scaffolding
- core architecture documents
- a useful read-only API, WebUI, and observability slice
- bounded persistence for inventory, topology, and policy snapshots plus sync-run history
- bounded workflow-history and audit-history visibility derived from persisted sync activity
- sharper capability semantics plus a stricter descriptive dry-run-planning-readiness assessment
- stronger platform, topology, and SR policy dashboards with bounded freshness, agreement, and evidence-gap cues where real metrics exist
- a first bounded runtime-hardening slice with repo-built local images, startup-contract validation for the most important stateful services, and small post-deploy verification scripts for the core runtime and ODL auth path

## Stricter Phase 2 Readiness Assessment

The current evidence now supports **a stricter evidence-based assessment of eventual dry-run-phase planning only**, not dry-run implementation and not a phase transition.

Current maturity by area:

- model maturity: mixed, because inventory is strong enough to inform future planning but topology and policy still remain intentionally partial read-side truths
- history maturity: blocked, because workflow-history and audit-history remain sync-derived and snapshot-bounded rather than durable workflow lifecycle records
- comparison maturity: mixed, because bounded current-versus-persisted and persisted-versus-previous comparison support now exists for inventory, topology, policy, and sync history, but those comparisons are still explanatory rather than validation-grade
- capability maturity: strong for planning, because support state, implementation status, delivery tier, evidence basis, vendor posture, and bounded workflow-readiness interpretation are now explicit enough to guide future planning safely
- blocker maturity: blocked, because critical contract blockers plus truth and history blockers still overlap with the `phase_transition` scope and remain too severe for any dry-run-phase move beyond planning discussion

Strongest blockers before any future dry-run phase:

- no durable workflow lifecycle model yet for requested, planned, dry-run, validation, approval, execution, success, failure, or rollback stages
- no dry-run API contract, preview payload, diff schema, or validation-result model yet
- topology and policy truth remain too partial for workflow-grade pre-change intelligence
- history remains platform-sync-derived rather than workflow-grade and operator-action-aware
- blocker posture still shows contract, truth, and history gaps that remain too immature for any dry-run-phase entry

Bounded next steps for readiness only:

- define the future workflow lifecycle and stage vocabulary in docs and schemas before any API implementation
- specify dry-run-oriented preview, diff, and validation-result contracts only after read-side evidence boundaries are documented more strictly
- deepen policy and topology truth only where live evidence and stable normalized models already justify it
- preserve `Phase 2 — read-only product foundation` until workflow records, dry-run contracts, and validation outputs are all real

## Phased Roadmap

### Phase 1 — platform skeleton and architecture-first foundation

Focus:

- platform structure
- service READMEs
- topology skeleton
- provisioning skeletons
- backend, collector, frontend, and Postgres scaffolding
- normalized model and schema direction
- architecture docs

Current state:

- foundation complete and preserved as the base for the current phase
- still intentionally bounded on broader lifecycle hardening, live ingestion depth, and workflows, even though the initial runtime packaging and verification slice is now real

### Phase 2 — read-only product foundation

Expected focus:

- collector-to-backend delivery
- read-only inventory and topology APIs
- read-only product pages
- early normalized policy visibility
- more meaningful observability panels

### Phase 3 — bounded ODL-backed enrichment

Expected focus:

- explicit ODL-backed enrichment where useful
- deeper controller-side visibility
- ODL inputs translated through backend-owned boundaries

### Phase 4 — dry-run and validation workflows

Expected focus:

- workflow model
- dry-run APIs
- diff and validation views
- audit relationships

### Phase 5 — first safe bounded action workflow

Expected focus:

- one narrow safe workflow
- strong post-check validation
- rollback where feasible

### Phase 6 — vendor expansion groundwork

Expected focus:

- Juniper adapter structure
- richer capability matrix behavior
- explicit vendor caveats and support handling

## Immediate Next Steps

Based on the current repo state, the next likely work should be:

1. deepen workflow-history and audit-history beyond sync-derived platform activity only when additional honest backend history sources exist
2. deepen the policy slice further only where stable Nokia evidence supports richer bounded read-only truth without crossing into write behavior
3. broaden durable read-side, dashboard, and capability evidence carefully only where normalized models and operator questions are already stable, especially around richer comparison and readiness signals without implying dry-run implementation

## Boundary Reminder

Phase transitions should not happen just because files exist.

They should happen only when the foundational architecture is both present and honest enough to support the next class of work without drift.

The project now supports stricter future dry-run planning assessment, but it should still remain fully in `Phase 2 — read-only product foundation` until actual workflow-model, dry-run API, preview or diff, validation-result, and workflow-audit relationship contracts become real.
