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

## Lifecycle Vocabulary

The platform now has a dedicated workflow lifecycle vocabulary document in
`platform/docs/workflow-lifecycle-vocabulary.md`.

That document defines canonical state names, state meanings, non-definitions,
and conceptual transitions only.

It does not introduce workflow behavior, dry-run APIs, approval semantics, or
execution logic in the current phase.

## Preview And Diff Contract Design

The platform now also has design-only preview and diff contract documents under:

- `platform/schemas/workflows/preview-contract.md`
- `platform/schemas/workflows/diff-contract.md`
- `platform/schemas/workflows/preview-diff-semantics.md`

These files define future contract vocabulary, bounded claim rules, uncertainty posture,
and blocker semantics only.

They do not introduce preview generation, validation behavior, approval behavior,
execution behavior, or rollback behavior in the current phase.

## Workflow Entity Model

The platform now also has a design-only workflow entity model document in:

- `platform/schemas/workflows/workflow-entity-model.md`

That document defines future workflow entities, their relationships, and how current
Phase 2 history and readiness structures map only partially onto those future concepts.

It does not introduce storage design, workflow APIs, or implementation behavior.

## Validation And Blocker Contract Design

The platform now also has design-only validation and blocker contract documents under:

- `platform/schemas/workflows/validation-result-contract.md`
- `platform/schemas/workflows/blocker-contract.md`
- `platform/schemas/workflows/validation-blocker-semantics.md`

These files define future validation-result, blocker, unsupported-condition,
and insufficient-evidence semantics without introducing validation behavior,
rule execution, approval behavior, or dry-run implementation.

## Current Vs Future

### Current

- workflow model direction is documented
- placeholder dashboard family exists for change validation observability
- bounded workflow-history and audit-history product views now exist, but they are derived from persisted sync activity rather than an execution workflow engine
- the project now supports stricter future dry-run planning assessment, but only as descriptive readiness support rather than actual workflow functionality
- no actual dry-run or action workflow implementation exists

## Stricter Planning Readiness

The platform is now strong enough to support **a stricter evidence-based assessment of eventual dry-run-phase planning**, but not strong enough to justify any dry-run implementation work or any dry-run-phase move yet.

Why planning readiness is now supportable:

- inventory, topology, policy, capability, and sync-derived history now expose clearer bounded evidence and comparison semantics
- capability metadata now makes support status, delivery tier, evidence basis, vendor posture, and bounded workflow-readiness interpretation explicit enough to guide future planning without implying parity
- the WebUI and docs can now present readiness boundaries and blockers honestly rather than only as roadmap prose
- blocker records and blocked-scope overlap are now explicit enough to assess where planning support exists and where hard-stop maturity gaps still remain

Why implementation readiness is still blocked:

- no durable workflow lifecycle records exist yet for requested, planned, dry-run-complete, approved, executing, succeeded, failed, or rollback stages
- no dry-run API, preview, diff, or validation-result implementation exists yet
- topology and policy truth remain intentionally partial and should not yet be used as workflow-grade pre-change intelligence
- workflow-history and audit-history remain sync-derived visibility rather than workflow-grade audit relationships
- blocker maturity itself remains explicitly blocked, because contract, truth, and history blockers still overlap with the `phase_transition` scope

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
