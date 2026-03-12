# Platform Workflows

## Purpose

This document describes the workflow direction for the platform and the safety rules that govern workflow design.

## Current Status

Workflows are not the primary implementation target in the current Phase 2 read-only foundation.

Current reality:

- the platform is focused on read-only product usefulness, bounded history visibility, and honest evidence rather than change execution
- broad action workflows are intentionally deferred
- no workflow engine has been implemented yet

This document therefore describes the workflow roadmap and boundaries, not completed functionality.

## Workflow Direction

The workflow path must remain staged.

### Phase 1

Focus:

- structure and architecture foundation
- service and topology scaffolding
- normalized model direction

### Phase 2

Focus:

- read-only visibility
- inventory and topology understanding
- policy visibility
- health visibility
- bounded workflow-history and audit-history visibility derived from sync activity

### Phase 3

Focus:

- bounded ODL-backed enrichment where it adds read-only product value
- deeper controller-side visibility through backend-owned boundaries
- no dry-run or action semantics yet

### Phase 4

Focus:

- dry-run support
- validation-only operations
- preview and diff views

### Phase 5

Focus:

- one bounded safe action workflow
- strong post-check validation
- rollback where feasible

## Workflow Safety Rules

Every future action-oriented workflow must be:

- explicit
- reviewable
- auditable
- bounded
- validated
- reversible where feasible

The platform must not start with a broad "change anything" workflow surface.

## Ownership Boundaries

Workflow ownership belongs to the product layers:

- `app-api` owns workflow logic, state, validation, and audit relationships
- `app-web` owns workflow presentation and later operator interaction flows

Workflow ownership does not belong to:

- `grafana`
- `prometheus`
- `odl`
- raw collector logic

## Current Vs Future

### Current

- workflow model direction is documented
- placeholder dashboard family exists for change validation observability
- bounded workflow-history and audit-history product views now exist, but they are derived from persisted sync activity rather than an execution workflow engine
- the project is approaching some prerequisites for later dry-run planning, but only as descriptive readiness support rather than actual workflow functionality
- no actual dry-run or action workflow implementation exists

## Stricter Planning Readiness

The platform is now strong enough to support **stricter future dry-run planning assessment**, but not strong enough to justify any dry-run implementation work yet.

Why planning readiness is now supportable:

- inventory, topology, policy, capability, and sync-derived history now expose clearer bounded evidence and comparison semantics
- capability metadata now makes support status, delivery tier, evidence basis, and vendor posture explicit enough to guide future planning without implying parity
- the WebUI and docs can now present readiness boundaries and blockers honestly rather than only as roadmap prose

Why implementation readiness is still blocked:

- no durable workflow lifecycle records exist yet for requested, planned, dry-run-complete, approved, executing, succeeded, failed, or rollback stages
- no dry-run API, preview, diff, or validation-result contracts exist yet
- topology and policy truth remain intentionally partial and should not yet be used as workflow-grade pre-change intelligence
- workflow-history and audit-history remain sync-derived visibility rather than workflow-grade audit relationships

Current conclusion:

- use the current foundation to plan later workflow contracts more carefully
- do not treat that planning readiness as a phase transition
- keep the platform fully in `Phase 2 — read-only product foundation`

### Future

- workflow model scaffolding
- dry-run APIs
- validation result views
- one bounded safe workflow later

## Boundary Reminder

Observability about workflows may appear in Grafana.

Actual workflow control, validation decisions, and durable workflow state must remain in the backend and product UI.
