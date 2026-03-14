# Bounded Next-Step Plan From The Refined Blocker Set

## Purpose

This document converts the refined blocker set into the next bounded,
`Phase 2`-safe plan.

It exists to answer five narrow questions.

- which remaining blocker should drive the next concrete cycle
- which remaining blockers can still be closed honestly inside `Phase 2`
- which remaining blockers should wait for later reassessment
- whether policy deepening or non-sync history hardening should move earlier
- what follow-up order is necessary rather than merely interesting

It is a sequencing document only.

It does not introduce:

- implementation changes
- workflow behavior
- persistence changes
- a phase transition
- broad redesign

## Phase Boundary

The platform remains in `Phase 2 — read-only product foundation`.

So the next-step plan must stay documentation-first and schema-first unless the
repository already has enough live evidence or persisted truth to justify one
small truth-and-history hardening slice without crossing into workflow-owned
storage, workflow retrieval, or workflow-grade audit design.

## Planning Rule

Use necessity, not curiosity, to choose the next cycle.

That means:

- address only the blocker that still directly forces cheating if left open
- keep already-clarified guardrails visible without reopening them as if they
  were still unresolved design questions
- allow truth-and-history hardening only when it directly serves the remaining
  identity gap
- defer workflow-owned storage, workflow-owned retrieval, and workflow-grade
  audit design until a later reassessment explicitly reopens them
- do not let broader product deepening outrank the immediate blocker unless the
  evidence now shows it is a prerequisite

## Inputs Used For This Plan

This plan is derived from the current blocker and workflow-planning baseline in:

- [platform/schemas/workflows/planning-slice-blockers.md](platform/schemas/workflows/planning-slice-blockers.md)
- [platform/schemas/workflows/source-record-identity-needs-mapping.md](platform/schemas/workflows/source-record-identity-needs-mapping.md)
- [platform/schemas/workflows/history-audit-linkage-mapping.md](platform/schemas/workflows/history-audit-linkage-mapping.md)
- [platform/schemas/workflows/current-history-chronology-ordering-rules.md](platform/schemas/workflows/current-history-chronology-ordering-rules.md)
- [platform/schemas/workflows/comparison-citation-posture-rules.md](platform/schemas/workflows/comparison-citation-posture-rules.md)
- [platform/docs/workflow-next-step-recommendation.md](platform/docs/workflow-next-step-recommendation.md)
- [agent/sdn/03-CURRENT-STATUS.md](agent/sdn/03-CURRENT-STATUS.md)
- [agent/sdn/16-implementation-order.md](agent/sdn/16-implementation-order.md)
- [agent/sdn/35-build-order-enforcement-rules.md](agent/sdn/35-build-order-enforcement-rules.md)

## What Changed Since The Earlier Next-Step Plan

The earlier next-step plan ranked several planning slices that are no longer the
active next closure targets.

That older order is now too broad for the refined blocker set because:

1. source-record identity, chronology interpretation, ownership posture, and
   comparison-citation posture have already been clarified on paper
2. the blocker analysis now leaves only one active must-fix blocker
3. workflow-owned anchors and workflow-grade audit linkage are now explicitly
   deferred until later reassessment rather than treated as the next closure
   targets
4. the immediate next move is now bounded truth-and-history hardening only where
   it directly closes the remaining identity gap

## Sequencing Principles

Apply the following ordering rules strictly.

1. Close the one remaining citation-grade identity gap before reopening deeper
   workflow-owned planning.
2. Treat current-history limitations as active guardrails, not as a new broad
   planning lane to reopen immediately.
3. Permit truth-and-history hardening only where it directly exposes or closes
   source identity and anchor gaps in already-implemented read-side surfaces.
4. Keep policy deepening behind the blocker-driven bridge unless policy evidence
   itself becomes the only honest way to close the current identity gap.
5. Keep non-sync history hardening behind the blocker-driven bridge unless a
   narrow readiness-history or derived-audit anchor gap is proven to block the
   current identity closure.
6. Defer anything that would require workflow-owned entities, retrieval roots,
   audit-linkage chains, or workflow chronology roots.

## Ranked Next-Step Order

The table below ranks the remaining items by immediate necessity, not by abstract
future importance.

| Rank | Item | Current posture | Why it belongs here | Phase-2-safe handling posture |
| --- | --- | --- | --- | --- |
| 1 | `citation_grade_source_record_identity_still_missing_for_identity_weak_current_surfaces` | `must_fix_before_planning_can_continue` | This is the only remaining blocker that still directly forces ambiguous citation or anchor cheating if left unresolved. The affected surfaces are already known and bounded: current comparison contracts, readiness items, capability items, and embedded history-support attachments. | `close_now_inside_phase2` |
| 2 | `bounded_truth_and_history_hardening_only_where_identity_gap_demands_it` | `derived_follow_up_step` | The refined blocker set now points to a bridge step rather than a second broad planning cycle: close only the concrete read-side truth or anchor gaps that the remaining identity blocker proves cannot be resolved honestly on paper alone. | `allow_only_if_directly_identity_serving` |
| 3 | `current_history_surfaces_remain_non_workflow_grade_even_after_clarification` | `important_but_not_blocking` | This is now a guardrail, not the next primary closure target. It must constrain the next cycle so sync history, readiness history, workflow-history projections, and audit-feed order are not overread while identity hardening proceeds. | `preserve_as_guardrail_do_not_reopen_broadly` |
| 4 | `history_query_and_retention_model_remains_bounded` | `important_but_not_blocking` | This still matters, but the current evidence does not show that retention breadth is the next prerequisite for honest identity closure. | `leave_open_until_later_reassessment` |
| 5 | `workflow_owned_anchor_records_absent` | `important_but_not_blocking` | Still a real future dependency, but current status and blocker analysis now explicitly defer it behind the identity-focused bridge. | `wait_for_later_reassessment` |
| 6 | `workflow_grade_audit_linkage_chain_absent` | `important_but_not_blocking` | Still real, but downstream of both stronger current source identity and any later decision to resume deeper workflow-owned planning. | `wait_for_later_reassessment` |
| 7 | `policy_truth_is_still_too_partial_for_workflow_grade_pre_change_reasoning` | `later_phase_concern` | Policy truth depth remains important for later preview and validation strength, but it is not the next blocker in the refined set. | `do_not_move_earlier` |
| 8 | `topology_truth_is_still_too_bounded_for_workflow_grade_pre_change_reasoning` | `later_phase_concern` | Topology truth depth remains later-phase as well. | `later_phase_only` |
| 9 | `approval_execution_and_rollback_accountability_is_absent_by_design` | `later_phase_concern` | This belongs to later dry-run and safe-action phases only. | `later_phase_only` |

## Which Items Can Still Be Closed Inside Phase 2

The following item can still be closed honestly inside `Phase 2` and should
drive the next bounded cycle.

- `citation_grade_source_record_identity_still_missing_for_identity_weak_current_surfaces`

Closure remains `Phase 2`-safe because it can stay bounded to already
implemented read-side evidence.

That closure should focus on the already identified weak families.

- current comparison summaries that still lack explicit compared anchor IDs or
  explicit explanatory-only posture
- readiness summary, blocker, prerequisite, and assessment-area items that
  still lack snapshot-scoped citation-grade identity
- capability items that still rely on inferred tuples rather than explicit item
  identity
- embedded history-support summaries and comparison attachments that still hide
  their stronger underlying snapshot or sync-run anchors

## Which Items May Be Narrowly Hardened Inside Phase 2 Only If Evidence Demands It

The following follow-up is allowed only as a narrow consequence of the remaining
identity blocker.

- bounded truth-and-history hardening tied directly to identity closure

That means only small hardening steps such as:

- exposing or documenting stronger underlying persisted snapshot or sync-run
  anchors where current attachments still hide them
- clarifying or tightening readiness-snapshot anchor exposure where current
  readiness items cannot otherwise be cited honestly
- tightening derived audit-envelope anchor preference where current projection
  identity would otherwise be overread

That does not authorize:

- a general non-sync history redesign
- broad retention-model hardening
- broader audit-history expansion
- workflow-grade chronology work

## Which Items Should Wait For Later Reassessment

The following items should remain open until the repository explicitly decides
to reopen deeper workflow-owned planning after the bounded identity-focused
bridge is complete.

- `workflow_owned_anchor_records_absent`
- `workflow_grade_audit_linkage_chain_absent`
- `history_query_and_retention_model_remains_bounded`

These should wait because addressing them next would either:

- pull the repository into workflow-owned storage design too early
- pull the repository into workflow-grade retrieval or audit design too early
- broaden the current cycle beyond the one remaining blocker that still matters
  immediately

## Later-Phase Concerns Only

The following items remain explicitly outside the next bounded plan.

- `policy_truth_is_still_too_partial_for_workflow_grade_pre_change_reasoning`
- `topology_truth_is_still_too_bounded_for_workflow_grade_pre_change_reasoning`
- `approval_execution_and_rollback_accountability_is_absent_by_design`

They matter for later preview, validation, approval, execution, rollback, and
safe-action work, but they do not determine the next blocker-driven `Phase 2`
cycle.

## Policy Deepening Versus Non-Sync History Hardening

This plan makes those two adjacent choices explicit.

### Policy deepening

Recommendation: `do_not_move_earlier`

Why:

1. the refined blocker set does not identify richer policy truth as the next
   prerequisite for honest workflow-planning progress
2. current policy truth remains a later-phase concern for preview and validation
   quality rather than the current identity-focused bridge
3. the current policy-related blocker inside `Phase 2` is still mostly about
   comparison identity and anchor exposure, not deeper policy domain breadth

Practical consequence:

- keep policy deepening behind the identity-focused bridge
- only return to it afterward as bounded read-only product work where live Nokia
  evidence supports richer truth

### Non-sync history hardening

Recommendation: `do_not_move_earlier_as_a_standalone_cycle`

Why:

1. the chronology and reuse meaning of current readiness history and derived
   audit envelopes is already clarified enough to act as a guardrail
2. the refined blocker set does not show a general non-sync history weakness as
   the next primary blocker
3. the only honest reason to touch non-sync history next would be a narrow
   identity-serving need, such as explicit readiness snapshot anchor exposure
   for current readiness items or derived readiness events

Practical consequence:

- do not start a general non-sync history hardening slice next
- allow only narrow readiness-history or derived-audit anchor tightening if the
  identity-focused bridge proves it is required

## Phase-2-Safe Follow-Up Order

Follow this order unless a later review documents a narrower, evidence-based
reason not to.

1. close the remaining citation-grade source-identity and explicit-anchor gaps
   in the already-known weak surface families
2. if that work exposes a concrete truth or anchor gap that cannot be resolved
   on paper alone, perform one narrow truth-and-history hardening step tied only
   to that gap
3. stop and reassess whether the remaining deferred workflow-owned-anchor,
   workflow-grade audit-linkage, or bounded-retention gaps still need a deeper
   planning slice next
4. only after that return to broader bounded product deepening such as policy
   truth improvements where live evidence genuinely supports it

## What Must Still Wait

Do not treat the following as the immediate next tasks.

- designing workflow root tables or workflow-owned persistence schemas
- designing workflow-owned retrieval endpoints
- designing workflow-grade audit-event families or linkage chains
- broad non-sync history redesign or retention expansion
- validation-grade policy or topology reasoning
- approval, execution, rollback, or operator-accountability surfaces

Those moves must wait until the repository has either closed the remaining
identity gap or shown, through the bounded bridge step, that a later planning
reassessment is truly necessary.

## Explicit Non-Goals

This plan does not define:

- remediation implementation tasks
- backend storage changes
- API additions
- phase relabeling
- workflow runtime behavior

## Conservative Bottom Line

The refined blocker set changes the next-step order materially.

The next bounded cycle should be:

1. close the remaining citation-grade source-identity gap in the still-weak
   current surfaces
2. allow only the smallest truth-and-history hardening step that this identity
   work proves is necessary
3. keep current-history guardrails in force without reopening broad non-sync
   history work
4. keep policy deepening behind this bridge step
5. only then reassess whether workflow-owned anchors, workflow-grade audit
   linkage, or broader retention planning should become a deeper later slice

That is the narrowest plan that preserves `Phase 2`, respects the refined
blocker set, and avoids turning blocker awareness into premature workflow
momentum.