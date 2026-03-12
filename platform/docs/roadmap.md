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
- sharper capability semantics plus one descriptive dry-run-readiness prerequisite summary
- stronger platform, topology, and SR policy dashboards with bounded freshness, agreement, and evidence-gap cues where real metrics exist

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
- still intentionally bounded on deep runtime behavior, live ingestion, and workflows

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

The project is getting closer to the prerequisites for later dry-run planning, but it should still remain fully in `Phase 2 — read-only product foundation` until actual workflow-model, dry-run API, preview or diff, and validation-result contracts become real.
