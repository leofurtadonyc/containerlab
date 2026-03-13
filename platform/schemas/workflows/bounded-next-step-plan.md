# Bounded Next-Step Plan For Revealed Workflow Blockers

## Purpose

This document converts the revealed workflow-planning blockers into a bounded
next-step plan.

It exists to answer four narrow questions.

- which blocker should be addressed first
- which blockers can be closed while the project remains in `Phase 2`
- which blockers should stay open until a later reassessment or later phase
- what follow-up order is necessary rather than merely interesting

It is a sequencing document only.

It does not introduce:

- implementation changes
- workflow behavior
- persistence changes
- a phase transition
- a broad remediation program

## Phase Boundary

The platform remains in `Phase 2 — read-only product foundation`.

So the next-step plan must prefer documentation-first and schema-first closure
where that is still honest, and it must defer blockers that would require
workflow-owned storage, workflow-owned retrieval, or workflow-grade audit
surfaces.

## Planning Rule

Use necessity, not curiosity, to choose the next slice.

That means:

- address only blockers that directly constrain the next truthful planning step
- prefer blockers that can be closed without violating the active phase
- do not pull later workflow-owned implementation prerequisites into `Phase 2`
  just because they are conceptually central
- keep later-phase truth and accountability gaps visible, but do not let them
  distort the current bounded planning order

## Inputs Used For This Plan

This plan is derived from the current blocker and workflow-planning baseline in:

- [platform/schemas/workflows/planning-slice-blockers.md](platform/schemas/workflows/planning-slice-blockers.md)
- [platform/schemas/workflows/evidence-reference-contract.md](platform/schemas/workflows/evidence-reference-contract.md)
- [platform/schemas/workflows/history-audit-linkage-mapping.md](platform/schemas/workflows/history-audit-linkage-mapping.md)
- [platform/schemas/workflows/read-only-retrieval-sequencing.md](platform/schemas/workflows/read-only-retrieval-sequencing.md)
- [platform/schemas/workflows/ownership-boundaries.md](platform/schemas/workflows/ownership-boundaries.md)
- [platform/docs/workflow-planning-gate.md](platform/docs/workflow-planning-gate.md)
- [agent/sdn/16-implementation-order.md](agent/sdn/16-implementation-order.md)
- [agent/sdn/35-build-order-enforcement-rules.md](agent/sdn/35-build-order-enforcement-rules.md)

## Sequencing Principles

Apply the following ordering rules strictly.

1. Close Phase-2-safe identity ambiguity before planning workflow-owned records.
2. Close ambiguity on current evidence reuse before planning future workflow
   retrieval rooted in new storage.
3. Defer blockers that inherently require workflow-owned persistence or
   workflow-grade audit chains until the repository explicitly reassesses that
   move.
4. Keep important but non-blocking gaps documented, but do not let them outrank
   the remaining strict blocker that can still be closed honestly inside
   `Phase 2`.
5. Treat topology truth, policy truth, and approval or execution accountability
   as later-phase concerns unless a narrower future task explicitly reclassifies
   them.

## Ranked Blocker Handling Order

The table below ranks blockers by next-step handling order, not only by abstract
future severity.

| Rank | Blocker code | Current class | Why it belongs here | Phase 2 closure posture |
| --- | --- | --- | --- | --- |
| 1 | `source_record_identity_missing_for_current_read_models_and_comparisons` | `must_fix_before_planning_can_continue` | This is the only strict blocker that can be closed directly through documentation-first and schema-first work on current read-model, comparison, readiness, capability, and embedded history-support evidence. It is also the cleanest dependency for any later `evidence_reference` attachment rules. | `close_now_inside_phase2` |
| 2 | `current_history_identity_and_ordering_too_weak_for_workflow_chronology` | `must_fix_before_planning_can_continue` | This remains a strict blocker, but it should be handled only after source-record identity rules make the reusable current-history surfaces explicit. The next safe step is to narrow chronology rules for current history-derived evidence, not to invent workflow history. | `narrow_only_inside_phase2_then_reassess` |
| 3 | `ownership_boundaries_are_clear_in_docs_but_not_yet_grounded_in_concrete_record_rules` | `important_but_not_blocking` | Once source identity and current-history citation scope are clearer, the remaining ownership split can be tightened into more concrete record-level rules without introducing workflow behavior. | `close_now_inside_phase2` |
| 4 | `comparison_records_are_explanatory_but_not_durable_entities` | `important_but_not_blocking` | This should be addressed after the source-identity slice decides what comparison evidence can be cited directly versus only attached as explanation. The needed closure is a contract decision, not a persistence implementation. | `close_now_inside_phase2` |
| 5 | `workflow_owned_anchor_records_absent` | `must_fix_before_planning_can_continue` | This is a root future dependency for concrete retrieval and storage planning, but addressing it directly would pull the project into workflow-owned persistence design rather than finishing the remaining Phase-2-safe clarification work first. | `do_not_close_in_phase2` |
| 6 | `workflow_grade_audit_linkage_chain_absent` | `must_fix_before_planning_can_continue` | This depends on workflow-owned anchors and stronger chronology. It must remain visible, but it should not be treated as the next bounded slice because Phase 2 still lacks the identity and ownership precision needed before workflow-grade audit retrieval can be planned credibly. | `do_not_close_in_phase2` |
| 7 | `history_query_and_retention_model_remains_bounded` | `important_but_not_blocking` | The bounded window is real, but it does not outrank source identity, chronology scope, or ownership decisions for the current planning checkpoint. | `leave_open_until_later_reassessment` |
| 8 | `topology_truth_is_still_too_bounded_for_workflow_grade_pre_change_reasoning` | `later_phase_concern` | This is a later validation and safe-action concern, not the next blocker to sequence in the current documentation-first cycle. | `later_phase_only` |
| 9 | `policy_truth_is_still_too_partial_for_workflow_grade_pre_change_reasoning` | `later_phase_concern` | This remains real, especially for preview and validation phases, but it should not pull the project away from the current bounded planning lane. | `later_phase_only` |
| 10 | `approval_execution_and_rollback_accountability_is_absent_by_design` | `later_phase_concern` | This matters only once dry-run, approval, execution, or rollback surfaces become real future work. | `later_phase_only` |

## Which Blockers Can Be Closed Inside Phase 2

The following blockers can be closed honestly while the repository remains in
`Phase 2`, because their closure is still documentation-first and schema-first.

- `source_record_identity_missing_for_current_read_models_and_comparisons`
- `ownership_boundaries_are_clear_in_docs_but_not_yet_grounded_in_concrete_record_rules`
- `comparison_records_are_explanatory_but_not_durable_entities`

These are Phase-2-safe because closure means defining exact identity,
ownership, and citation posture rules for existing read-side evidence.

They do not require:

- workflow-owned storage
- workflow endpoints
- dry-run behavior
- workflow-grade audit events

## Which Blockers Can Only Be Narrowed Inside Phase 2

The following blocker should be narrowed, but not claimed as fully closed, while
the repository remains in `Phase 2`.

- `current_history_identity_and_ordering_too_weak_for_workflow_chronology`

Why only narrowed:

- current sync-derived and readiness-derived history can be bounded more
  explicitly on paper
- current overloaded and synthesized identities can be documented more strictly
- full closure would still require workflow-owned chronology rather than only
  stricter interpretation of read-side history

## Which Blockers Should Not Be Closed In Phase 2

The following blockers should remain open until a later reassessment explicitly
decides to plan workflow-owned persistence and workflow-grade audit retrieval
more concretely.

- `workflow_owned_anchor_records_absent`
- `workflow_grade_audit_linkage_chain_absent`
- `history_query_and_retention_model_remains_bounded`

These are not the right next slice because they would either:

- force workflow-owned storage design too early
- force workflow-grade retrieval design too early
- broaden the planning surface before identity and ownership rules are precise

## Later-Phase Concerns Only

The following blockers should remain explicitly out of the next-step plan and be
treated as later-phase concerns only.

- `topology_truth_is_still_too_bounded_for_workflow_grade_pre_change_reasoning`
- `policy_truth_is_still_too_partial_for_workflow_grade_pre_change_reasoning`
- `approval_execution_and_rollback_accountability_is_absent_by_design`

They matter for later dry-run, validation, approval, execution, rollback, and
safe-action work, but they do not determine the next bounded planning slice.

## Phase-Safe Follow-Up Order

Follow this order unless a later review documents a narrower reason not to.

1. Complete explicit source-record identity rules for current read-model,
   comparison, readiness, capability, and embedded history-support evidence.
2. Use that result to tighten current-history chronology and ordering rules only
   where current evidence is still reusable later, while preserving the rule
   that sync-derived history is not workflow history.
3. Convert the ownership-boundary split into more concrete record-level rules so
   later workflow-owned state cannot silently reuse current evidence or
   readiness records as substitutes.
4. Decide explicitly which current comparison surfaces remain explanatory only
   and which, if any, can be cited directly once source identity is known.
5. Stop and reassess whether the remaining open blockers now truly require a new
   later planning slice for workflow-owned anchors and workflow-grade audit
   linkage, or whether Phase 2 documentation can still sharpen them further
   without crossing the phase boundary.

## What Must Wait For Later Reassessment

Do not treat the following as the immediate next tasks.

- designing concrete workflow root tables or persistence schemas
- designing workflow-owned retrieval endpoints
- designing workflow-grade audit-event families
- expanding truth work into validation-grade topology or policy reasoning
- designing approval, execution, rollback, or operator-accountability surfaces

Those moves should wait until the repository has finished the remaining Phase 2
identity and ownership clarification work and then explicitly reassesses whether
planning should deepen further.

## Explicit Non-Goals

This plan does not define:

- remediation implementation tasks
- backend storage changes
- API additions
- phase relabeling
- workflow runtime behavior

## Conservative Bottom Line

The next bounded step is not to chase every revealed blocker at once.

The correct next-step order is:

1. close source-record identity rules
2. narrow current-history chronology reuse rules
3. tighten concrete ownership and comparison-posture rules
4. only then reassess whether workflow-owned anchors and workflow-grade audit
   linkage should become a later planning slice

Everything else should remain visible but deferred, so the project stays inside
`Phase 2` and avoids turning blocker awareness into workflow momentum.