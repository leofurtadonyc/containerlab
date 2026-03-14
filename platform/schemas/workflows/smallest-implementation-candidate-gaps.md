# Smallest Real Implementation Candidates After The Refined Planning Slice

## Purpose

This document identifies the smallest truth or history gaps that may now need
real implementation work after the current planning slice completes.

It exists to answer three narrow questions.

- which concrete gap is the smallest real implementation candidate now
- why that gap can no longer be resolved only through docs or schemas
- what blast radius and sequencing would keep the work bounded inside `Phase 2`

It is an implementation-candidate analysis only.

It does not introduce:

- implementation changes
- workflow behavior
- phase changes
- broad backlog generation

## Phase Boundary

The platform remains in `Phase 2 — read-only product foundation`.

So any candidate named here must be:

- small enough to preserve read-only boundaries
- justified by already implemented read-side evidence or persisted truth
- narrower than workflow-owned storage, workflow-owned retrieval, or
  workflow-grade audit design

## Decision Rule

A gap qualifies here only if both of the following are true.

1. the current planning docs already explain the semantics honestly
2. the current backend contracts still lack the concrete fields or anchor
   exposure needed to make those semantics usable in practice

If the gap can still be settled honestly on paper alone, it does not belong in
this candidate list.

## Candidate List

At this point, only one primary candidate and one smaller follow-on candidate
remain justified.

## Candidate 1

### `expose_explicit_persisted_anchor_ids_for_identity_weak_comparison_readiness_and_history_support_surfaces`

This is the smallest real implementation candidate.

### Why this is the smallest candidate

The refined blocker set already narrowed the remaining must-fix gap to missing
citation-grade source identity and explicit anchor exposure for still-weak
current surfaces.

The code now shows that several of the required anchors already exist in backend
persistence or response-builder inputs, but the current API contracts do not
surface them.

Examples:

- comparison responses in
  [platform/app-api/src/app_api/schemas/devices.py](platform/app-api/src/app_api/schemas/devices.py),
  [platform/app-api/src/app_api/schemas/topology.py](platform/app-api/src/app_api/schemas/topology.py),
  and [platform/app-api/src/app_api/schemas/policies.py](platform/app-api/src/app_api/schemas/policies.py)
  expose timestamps such as `comparison_persisted_at`, `current_persisted_at`,
  and `previous_persisted_at`, but not the persisted snapshot IDs that those
  comparisons actually rest on
- readiness support in
  [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py)
  exposes only `readiness_persisted_at`, while
  [platform/app-api/src/app_api/persistence/readiness.py](platform/app-api/src/app_api/persistence/readiness.py)
  and [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py)
  show that a durable readiness snapshot ID already exists underneath
- embedded history-support summaries and comparisons in
  [platform/app-api/src/app_api/models/workflow.py](platform/app-api/src/app_api/models/workflow.py)
  and [platform/app-api/src/app_api/models/audit.py](platform/app-api/src/app_api/models/audit.py)
  carry timestamps but still hide the stronger persisted snapshot or sync-run
  anchors that [platform/app-api/src/app_api/persistence/history.py](platform/app-api/src/app_api/persistence/history.py)
  already loads

### Why docs and schemas are no longer enough

The docs already say which current surfaces are explanatory only, which inherit
meaning from stronger anchors, and which remain identity-weak.

That clarification is already complete.

What is still missing is not meaning.

What is still missing is field-level anchor exposure in the implemented backend
contracts.

Without implementation help, later citation still has to rely on:

- timestamps instead of explicit persisted snapshot IDs
- projection envelopes instead of underlying sync-run or snapshot anchors
- readiness timestamp pointers instead of the actual readiness snapshot record

That remaining gap cannot be closed further through wording alone because the
API contracts simply do not carry the needed anchor fields today.

### Smallest concrete implementation shape

If this candidate is chosen later, the smallest honest implementation would be
to expose already-existing anchor IDs, not to redesign persistence.

Likely examples:

- add persisted snapshot ID fields to current-versus-latest-persisted
  comparison responses for inventory, topology, and policy
- add compared snapshot ID fields to persisted-versus-previous policy history
  comparison responses
- add readiness snapshot ID exposure beside `readiness_persisted_at`
- add underlying sync-run or snapshot anchor IDs to embedded history-support
  summaries and comparison attachments where those anchors already exist in the
  loaded backend models

### Blast radius

This is bounded.

Expected touched areas:

- backend response schemas in
  [platform/app-api/src/app_api/schemas/devices.py](platform/app-api/src/app_api/schemas/devices.py),
  [platform/app-api/src/app_api/schemas/topology.py](platform/app-api/src/app_api/schemas/topology.py),
  [platform/app-api/src/app_api/schemas/policies.py](platform/app-api/src/app_api/schemas/policies.py),
  and [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py)
- backend service builders in
  [platform/app-api/src/app_api/services/devices.py](platform/app-api/src/app_api/services/devices.py),
  [platform/app-api/src/app_api/services/topology.py](platform/app-api/src/app_api/services/topology.py),
  [platform/app-api/src/app_api/services/policies.py](platform/app-api/src/app_api/services/policies.py),
  [platform/app-api/src/app_api/services/capabilities.py](platform/app-api/src/app_api/services/capabilities.py),
  [platform/app-api/src/app_api/services/workflow_history.py](platform/app-api/src/app_api/services/workflow_history.py),
  and [platform/app-api/src/app_api/services/audit_history.py](platform/app-api/src/app_api/services/audit_history.py)
- frontend contract types in
  [platform/app-web/src/api/contracts.ts](platform/app-web/src/api/contracts.ts)
  plus only the read-only views that display the affected evidence context

Expected untouched areas:

- collector logic
- workflow-owned storage
- workflow behavior
- audit-linkage persistence
- phase labeling

### Sequencing note

If any implementation happens next, this should be first.

It is the smallest change that directly serves the one remaining active
must-fix blocker without broadening the scope into new history models or deeper
policy truth work.

## Candidate 2

### `add_snapshot_scoped_or_deterministic_item_ids_for_readiness_and_capability_records`

This is a smaller secondary candidate, not the first choice.

### Why it remains a candidate

The current readiness and capability items still lack explicit item identity.

Examples:

- `DryRunReadinessBlocker`, `DryRunReadinessPrerequisite`, and
  `DryRunReadinessAssessmentArea` in
  [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py)
  expose stable names and bounded structure but no explicit item IDs
- `CapabilityRecord` in the same file exposes no explicit item ID either, even
  though the record shape is already stable enough to support a deterministic
  identity
- readiness persistence in
  [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py)
  stores readiness items as embedded JSON inside a snapshot, which preserves the
  snapshot but not an explicit per-item citation key

### Why docs and schemas are no longer enough

The docs already say these items are identity-weak.

But a later citation consumer still cannot reference an exact blocker,
prerequisite, assessment area, or capability item through a concrete field in
the implemented API.

Natural names alone are not enough because they do not express one explicit
record key bound to one snapshot or one stable capability identity contract.

So this gap also requires implementation if the repository decides those items
must become citeable in the current product slice.

### Why this is not the first implementation choice

This candidate is slightly larger and more design-sensitive than Candidate 1.

It requires choosing one of the following explicitly.

- deterministic capability keys
- snapshot-scoped readiness item keys
- both

That is still bounded, but it is a stronger contract choice than simply exposing
already-existing anchor IDs.

### Blast radius

This is still bounded, but larger than Candidate 1.

Expected touched areas:

- capabilities schemas and service builders
- readiness persistence helpers if snapshot-scoped item identity must be emitted
- frontend capability and readiness contracts and views

Expected untouched areas:

- collector logic
- workflow-owned storage
- policy ingestion depth
- workflow-grade history design

### Sequencing note

Treat this as second only if Candidate 1 proves insufficient.

If exposing the existing persisted anchors solves the practical citation problem
for the next bounded cycle, this candidate can stay deferred.

## Explicit Non-Candidates For The Immediate Next Step

The following areas are real, but they are not the smallest justified
implementation candidate now.

### Broader durable history query and retention work

Not the smallest candidate because the refined blocker set already classifies it
as important but not blocking, and the current identity gap can be attacked more
directly through anchor exposure first.

### Broad non-sync history hardening

Not the smallest candidate because the current readiness-history and derived
audit-envelope semantics are already clarified enough to act as guardrails.

Only the narrow anchor-exposure subset belongs in Candidate 1.

### Richer policy truth where stable Nokia evidence exists

Not the smallest candidate because current policy depth remains a later-phase
truth concern and the current lab still exposes an honest live-empty posture.

The immediate blocker inside `Phase 2` is still comparison and anchor identity,
not broader policy-domain truth.

## Conservative Bottom Line

If the repository needs one smallest real implementation candidate next, it is:

- `expose_explicit_persisted_anchor_ids_for_identity_weak_comparison_readiness_and_history_support_surfaces`

That candidate is the smallest because the anchors already exist in backend
persistence or service inputs, the docs already clarified their meaning, and the
remaining problem is simply that the implemented contracts still do not expose
them.

If a second candidate is needed later, it is:

- `add_snapshot_scoped_or_deterministic_item_ids_for_readiness_and_capability_records`

Everything broader than that should remain deferred until this smaller anchor
and item-identity question is either closed or proven insufficient.