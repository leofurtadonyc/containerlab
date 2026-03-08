# Platform Workflows

## Purpose

This document describes the workflow direction for the platform and the safety rules that govern workflow design.

## Current Status

Workflows are not the primary implementation target in Phase 1.

Current reality:

- the platform is focused on structure, documentation, read-oriented scaffolding, and normalized model direction
- broad action workflows are intentionally deferred
- no workflow engine has been implemented yet

This document therefore describes the workflow roadmap and boundaries, not completed functionality.

## Workflow Direction

The workflow path must remain staged.

### Phase 1

Focus:

- read-only visibility
- inventory and topology understanding
- policy visibility
- health visibility

### Phase 2

Focus:

- dry-run support
- validation-only operations
- preview and diff views

### Phase 3

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
- no actual dry-run or action workflow implementation exists

### Future

- workflow model scaffolding
- dry-run APIs
- validation result views
- one bounded safe workflow later

## Boundary Reminder

Observability about workflows may appear in Grafana.

Actual workflow control, validation decisions, and durable workflow state must remain in the backend and product UI.
