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

- runtime maturity: strong for the current Phase 2 scope, because repo-built Postgres, Prometheus, and Grafana images now have bounded startup-contract validation and the live deployment passes both `verify-core-runtime` and `verify-odl-auth`, even though broader production-grade hardening still remains out of scope
- truth maturity: mixed, because inventory is strong enough to inform future planning but topology remains intentionally inference-bounded and policy remains intentionally partial rather than workflow-grade pre-change truth
- history maturity: mixed for read-side evidence but blocked for workflow implementation, because workflow-history and audit-history now include persisted snapshot context across inventory, topology, policy, and one bounded readiness-support snapshot event source, but still do not provide durable workflow lifecycle or operator-action history
- policy maturity: mixed, because the platform now has aggregate counter evidence, bounded static-policy observations, per-target policy footprints, persisted comparison windows, and bounded `change_preview` support, but the live lab still presents a live-empty policy result and the policy slice is still not strong enough for validation-grade reasoning
- capability maturity: strong for planning, because support state, implementation status, delivery tier, evidence basis, vendor posture, workflow-readiness interpretation, and blocker posture are now explicit enough to guide future planning safely
- workflow-prerequisite clarity: strong for planning, because the repository now has an explicit ownership and sequencing plan for workflow-owned state across evidence boundaries, storage layers, API order, audit linkage, and persistence prerequisites
- blocker maturity: blocked for implementation, because critical truth, history, and workflow-storage blockers still overlap with the `phase_transition` scope and remain too severe for any dry-run-phase move beyond tightly bounded planning discussion

Strongest blockers before any future dry-run phase:

- no durable workflow lifecycle model yet for requested, planned, dry-run, validation, approval, execution, success, failure, or rollback stages
- no implemented workflow-owned storage, retrieval APIs, or audit-linkage records yet, even though design-only prerequisites are now clearer
- topology and policy truth remain too partial for workflow-grade pre-change intelligence
- history remains platform-read-side-derived rather than workflow-grade and operator-action-aware
- blocker posture still shows contract, truth, and history gaps that remain too immature for any dry-run-phase entry

Bounded next steps for readiness only:

- use the new workflow-owned-state prerequisite plan to define one tiny documentation-first and schema-first planning slice around `evidence_reference`, `audit_linkage`, and read-only workflow retrieval sequencing
- continue truth and history hardening only where those planning artifacts expose a concrete evidence gap that would otherwise force guesswork
- deepen policy and topology truth only where live evidence and stable normalized models already justify it
- preserve `Phase 2 — read-only product foundation` until workflow records, workflow-owned APIs, and validation outputs are all real

## Recommendation For The Next Planning Cycle

Recommendation: `begin_tightly_bounded_workflow_planning_only`

Interpret that recommendation narrowly:

- keep the project fully in `Phase 2 — read-only product foundation`
- use the next cycle for one documentation-first and schema-first workflow-planning slice only
- do not start workflow implementation, dry-run implementation, or any phase transition work

Why this is the right next-cycle focus:

- runtime hardening is now strong enough for the current bounded scope and is no longer the primary bottleneck for planning clarity
- capability maturity and workflow-prerequisite clarity are now strong enough to support one disciplined planning slice without guessing
- truth, policy, and history maturity are still too uneven for workflow implementation, so any broader move would overread the current evidence

The recommended next-cycle planning slice should stay limited to:

- explicit `evidence_reference` identity and citation rules for persisted snapshots, bounded comparisons, and readiness snapshots
- explicit `audit_linkage` identity and chronology rules for future workflow-owned records
- read-only workflow retrieval sequencing only after future storage boundaries are clear on paper

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

1. begin one tightly bounded workflow-planning slice only, focused on workflow-owned evidence-reference, audit-linkage, and retrieval-sequencing prerequisites in docs and schemas
2. continue Phase 2 truth and history hardening only where that planning slice reveals a concrete evidence gap that cannot be resolved honestly on paper alone
3. deepen the policy slice further only where stable Nokia evidence supports richer bounded read-only truth without crossing into write behavior

## Boundary Reminder

Phase transitions should not happen just because files exist.

They should happen only when the foundational architecture is both present and honest enough to support the next class of work without drift.

The project now supports stricter future dry-run planning assessment, but it should still remain fully in `Phase 2 — read-only product foundation` until actual workflow-model, dry-run API, preview or diff, validation-result, and workflow-audit relationship contracts become real.
