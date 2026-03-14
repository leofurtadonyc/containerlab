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

At this point, no immediate implementation candidate remains justified.

The current repository already exposes the persisted anchors that earlier
planning text had treated as missing on the comparison, readiness-response,
and embedded history-support surfaces needed for bounded `Phase 2` use.

What remains is one conditional future candidate.

## Conditional Candidate

### `add_snapshot_scoped_or_deterministic_item_ids_for_readiness_and_capability_records`

This is the only remaining small candidate, but it is not the next step by
default.

### Why it is only conditional now

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

The residual gap is now narrower than the earlier planning slice assumed.

The current code and docs already expose:

- comparison snapshot anchors on current inventory, topology, and policy
  comparison surfaces
- readiness response-level anchor exposure through `readiness_snapshot_id`
- embedded history-support comparison or correlation anchors where the current
  models already carry them

So the remaining gap is no longer broad anchor exposure.

It is limited to non-persisted readiness child items and capability items that
still do not have standalone item IDs.

### Why docs are enough for now

The current product slice uses those items as bounded planning-support context,
not as standalone workflow-grade citation targets.

Current response-level and snapshot-level anchors are already strong enough to
support routine `Phase 2` read-only use without inventing new item contracts.

So the honest next step is to reconcile the planning docs and stop unless a
concrete future consumer requires standalone item citation.

### Smallest safe future design if a consumer appears

If later work genuinely needs standalone item-level citation, keep the design
bounded.

- readiness blocker, prerequisite, and assessment-area IDs should be
  snapshot-scoped keys derived from `readiness_snapshot_id` plus the bounded
  natural key already exposed by each item
- capability item IDs should be deterministic keys derived from the stable
  vendor, platform, domain, feature, and version scope already used by the
  current record shape
- these IDs should remain descriptive read-side identity only; they must not be
  reinterpreted as workflow-owned anchors, chronology roots, or new persistence
  families

### Blast radius

This remains bounded.

Expected touched areas:

- capabilities schemas and service builders
- readiness persistence helpers if snapshot-scoped item identity must be emitted
- frontend capability and readiness contracts and views

Expected untouched areas:

- comparison responses that already expose anchor IDs
- collector logic
- workflow-owned storage
- workflow-owned retrieval
- workflow-grade history design

### Sequencing note

Do not implement this next by default.

Only reopen it if a later bounded consumer cannot operate honestly with the
already exposed response-level or snapshot-level anchors.

## Explicit Non-Candidates For The Immediate Next Step

The following areas are real, but they are not the smallest justified
implementation candidate now.

### Broader durable history query and retention work

Not the smallest candidate because the refined blocker set already classifies it
as important but not blocking, and the current residual identity question is
limited to later consumer-driven readiness or capability item citation.

### Broad non-sync history hardening

Not the smallest candidate because the current readiness-history and derived
audit-envelope semantics are already clarified enough to act as guardrails.

Only a later concrete consumer would justify reopening the conditional
item-identity candidate above.

### Richer policy truth where stable Nokia evidence exists

Not the smallest candidate because current policy depth remains a later-phase
truth concern and the current lab still exposes an honest live-empty posture.

The immediate question inside `Phase 2` is no longer anchor exposure.

It is whether any later consumer truly needs standalone readiness or capability
item identity beyond the anchors the product already exposes.

## Conservative Bottom Line

If the repository ever needs one smallest remaining identity candidate later,
it is:

- `add_snapshot_scoped_or_deterministic_item_ids_for_readiness_and_capability_records`

That candidate is conditional, not immediate.

No new implementation slice is justified until a concrete bounded consumer
shows that the already exposed response-level and persisted anchors are
insufficient.