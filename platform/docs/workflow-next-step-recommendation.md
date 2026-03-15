# Strict Recommendation For The Following Workflow Cycle

## Purpose

This document gives a strict recommendation for what the following cycle should
be after the accepted week 13 checkpoint, including the identity no-change
decision, the read-path hardening slices, and the stronger verification pass.

It exists to answer one narrow question.

Should the project now:

- reopen identity or workflow planning by default, or
- return to one bounded read-only truth-depth slice

This is a recommendation document only.

It does not authorize:

- workflow implementation
- dry-run implementation
- a phase jump
- roadmap expansion
- broad redesign

## Recommendation

Recommendation: `begin_one_bounded_topology_truth_depth_cycle`

The current repository review in `platform/docs/topology-truth-depth-review.md`
confirms that this recommendation is still correct.

That review found that the strongest remaining live weakness is not missing
topology structure in general. It is the narrower endpoint-pairing and
single-sided-link coverage gap inside the already-real inferred topology slice.

So the next cycle should remain tightly focused on explicit endpoint-pairing
posture, single-sided-link coverage semantics, and sharper bounded trust cues,
not on broad topology redesign.

Interpret it narrowly.

- stay fully in `Phase 2 — read-only product foundation`
- treat the accepted week 13 identity no-change outcome as closed for now
- use the next cycle to tighten topology endpoint-coverage and single-sided-link
  truth cues where the current live stack already has real evidence
- keep the backend as the brain, the WebUI as the product, Grafana as the
  observability layer, and ODL bounded
- stop well short of workflow implementation, dry-run behavior, or a phase jump

## Why This Recommendation Is Strict

The current decision is no longer between stale planning docs and an obvious
anchor-exposure implementation gap.

That gap has already been narrowed by accepted week 13 work:

- persisted and response-level anchors are already exposed where real records
  exist
- the capability review ended in a documented no-change outcome for current
  `Phase 2` use
- `read_paths` now carry bounded coverage, freshness, and degraded-scope
  posture across backend, product, and observability views
- tests and `verify-core-runtime` now prove those signals directly on the live
  stack

So the strict problem now is not missing identity work by default.

The stronger remaining gap is truth depth on the weakest live slice that still
has concrete, measurable evidence behind it.

## Evidence-Based Evaluation

### Identity maturity

Posture: `strong_enough_to_defer_additional_identity_work`

Reasoning:

- the current backend and product already expose response-level and persisted
  anchors where real records exist
- the accepted capability review found no current consumer-backed need for a
  separate capability item-ID contract
- the remaining weak area is still limited to non-persisted readiness child
  items and capability items, and that gap remains conditional rather than an
  automatic next implementation lane

Conclusion:

- identity is no longer the strongest remaining evidence gap for the current
  bounded product slice
- the accepted no-change outcome should hold unless a later concrete consumer
  proves otherwise

### Verification maturity

Posture: `strong_enough_to_shift_focus_back_to_truth_depth`

Reasoning:

- targeted backend and collector pytest now pin the accepted week 13 read-path
  and roadmap-posture semantics directly
- `verify-core-runtime` now checks live `read_paths`, capability roadmap/vendor
  posture rollups, and the collector freshness and detail-gap signals used by
  the current product and dashboard surfaces
- the live deployment passes those checks while still surfacing bounded notices
  for the real degraded states that remain

Conclusion:

- verification is no longer the default next bottleneck
- it now gives the repo a stronger base to target the next real truth gap

### Topology truth maturity

Posture: `weakest_current_live_slice_with_actionable_evidence`

Reasoning:

- the live stack still reports `completeness=partial`
- the strengthened verifier now emits a bounded notice when topology evidence is
  single-sided
- the current collector and backend already carry enough topology evidence to
  tighten endpoint-pairing and coverage semantics without pretending full
  topology truth

Conclusion:

- topology is the clearest remaining truth-depth target that can be improved
  honestly from current evidence
- it is a better next cycle than reopening identity work or broad workflow
  planning

### Policy truth maturity

Posture: `important_but_not_the_best_immediate_next_cycle`

Reasoning:

- the live stack still reports `no_policies_observed`
- the verifier now also reports zero policy detail-ready targets on the current
  deployment
- that makes policy detail an important weak area, but it also means a
  policy-first cycle would mostly run into absent live source detail rather than
  a cleaner already-evidenced truth gap

Conclusion:

- policy should remain behind topology in the immediate next-cycle order
- deeper policy truth should wait until live evidence supports more than the
  current aggregate-only and live-empty posture

### Workflow-planning maturity

Posture: `still_design_only_and_not_the_next_lane`

Reasoning:

- future workflow ownership, storage, audit linkage, and retrieval sequencing
  are already documented as design-only guardrails
- nothing in accepted week 13 work changes the Phase 2 boundary or justifies a
  new workflow-planning-first cycle
- the stronger remaining repo problem is still read-side truth depth, not a new
  workflow design ambiguity

Conclusion:

- workflow planning should stay deferred
- the next cycle should stay on a bounded read-only truth task

## Supporting Reasoning

The accepted week 13 checkpoint already did the work that would normally justify
another identity-focused or verification-focused cycle.

- the repo now exposes explicit anchors where real records exist
- the capability identity review ended in a no-change decision for current
  bounded use
- the product and observability layers now surface bounded read-path posture
- the live verifier and targeted tests now pin those signals directly

Because of that, the honest next step is to move back to the strongest remaining
truth gap that the current live evidence can support.

Topology meets that standard.

It already has stable live evidence, but the current slice still advertises
partial completeness and single-sided-link gaps. That is a concrete weakness the
repo can narrow without pretending full topology truth.

Policy does not meet that standard as cleanly yet, because the current live lab
still exposes `no_policies_observed` and zero detail-ready targets. A
policy-first cycle would therefore risk inventing a code-heavy story around
source detail that the current lab does not provide.

## Next-Cycle Boundaries

The next cycle should be limited to one bounded truth-depth target.

### Primary target

Tighten the current topology truth gap around endpoint-pairing and single-sided
coverage semantics without leaving `Phase 2`.

### In-scope work

- tighten collector-to-backend topology coverage semantics where the collector
  already has live endpoint evidence
- make backend-owned topology trust cues more explicit about fully paired versus
  single-sided coverage without turning them into validation verdicts
- adjust product and observability surfaces only where needed to preserve the
  backend-as-brain and Grafana-as-observability split
- extend tests and `verify-core-runtime` only for the real topology coverage
  signals added by that bounded slice

### In-scope posture

- read-only `Phase 2` only
- no workflow semantics
- no phase transition
- no claim of complete topology truth

### Explicitly deferred even inside this cycle

- deterministic or snapshot-scoped readiness/capability item IDs
- broader policy truth deepening that depends on absent live policy detail
- broader history retention or query expansion
- workflow-owned anchors
- workflow-grade audit linkage
- any workflow, preview, validation, approval, execution, or rollback behavior

## Explicit Anti-Recommendations

The following should not happen next.

- do not run one more general planning slice on source identity, chronology, or
  comparison posture as if the current repo still lacked the implemented anchors
- do not widen this cycle into workflow-owned storage, workflow retrieval, or
  workflow-grade audit-linkage design
- do not start a policy-first cycle that overreads the current
  `no_policies_observed` and zero detail-ready-target posture
- do not treat capability-item identity or readiness child-item identity as an
  immediate implementation requirement unless a concrete bounded consumer proves
  the current anchors insufficient
- do not reinterpret workflow-history or audit-history projection IDs as
  workflow-owned identities
- do not relabel the project as beyond `Phase 2`
- do not treat this bounded topology slice as permission to start dry-run or
  action workflows

## Conservative Bottom Line

The strict recommendation for the following cycle is:

- begin one bounded topology truth-depth cycle

That recommendation is narrow.

It does not mean the project should reopen identity implementation, workflow
planning, or policy redesign by default.

It means the accepted week 13 checkpoint has now closed the default identity and
verification lanes strongly enough that the honest next step is to tighten the
weakest remaining live truth slice that already has concrete evidence behind it:
topology coverage depth.