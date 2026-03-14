# Strict Recommendation For The Following Workflow Cycle

## Purpose

This document gives a strict recommendation for what the following cycle should
be after the completed source-record identity slice and the later
chronology, comparison-citation, blocker, and implementation-candidate
refinements.

It exists to answer one narrow question.

Should the project now:

- continue one more bounded planning slice, or
- move to one small blocker-driven `Phase 2` implementation cycle

This is a recommendation document only.

It does not authorize:

- workflow implementation
- dry-run implementation
- a phase jump
- roadmap expansion
- broad redesign

## Recommendation

Recommendation: `move_to_one_small_blocker_driven_phase2_implementation_cycle`

Interpret it narrowly.

- stay fully in `Phase 2 — read-only product foundation`
- implement only the smallest read-side contract change that directly reduces
  the one remaining active must-fix blocker
- make the cycle about exposing already existing persisted anchors, not about
  inventing workflow-owned entities or redesigning persistence
- stop after that bounded implementation slice and reassess before opening any
  deeper workflow-planning lane again

## Why This Recommendation Is Strict

The current decision is no longer between an unfinished planning baseline and
an early implementation jump.

The planning baseline is now mature enough to isolate one concrete remaining
gap.

That gap is also now concrete enough to show that wording alone will not close
it.

So the strict answer is to move into one small blocker-driven `Phase 2`
implementation cycle, not another bounded planning slice.

Another planning cycle would mostly restate facts the repository already knows.
It would not change the current backend contracts that still hide the explicit
anchors the planning docs now require.

## Evidence-Based Evaluation

### Source-record identity maturity

Posture: `mature_enough_for_one_bounded_implementation_step`

Reasoning:

- [platform/schemas/workflows/source-record-identity-rules.md](platform/schemas/workflows/source-record-identity-rules.md)
  already distinguishes direct source records, assembled read models, derived
  comparison surfaces, readiness and capability overlays, and embedded
  history-support attachments
- [platform/schemas/workflows/source-record-identity-needs-mapping.md](platform/schemas/workflows/source-record-identity-needs-mapping.md)
  already narrows the remaining weak areas to current comparison contracts,
  readiness items and summaries, capability items, and embedded
  history-support attachments
- [platform/schemas/workflows/smallest-implementation-candidate-gaps.md](platform/schemas/workflows/smallest-implementation-candidate-gaps.md)
  shows that several of the necessary underlying anchors already exist in the
  implemented persistence and service layers, but are still not exposed through
  the read-only contracts

Conclusion:

- source-record identity is no longer blocked by missing planning vocabulary
- it is now blocked by missing field-level anchor exposure in implemented
  contracts
- that is the threshold for one bounded implementation cycle

### Chronology narrowing maturity

Posture: `clear_enough_to_act_as_a_guardrail_without_more_planning_first`

Reasoning:

- [platform/schemas/workflows/current-history-chronology-ordering-rules.md](platform/schemas/workflows/current-history-chronology-ordering-rules.md)
  already makes explicit which current chronology is reusable only as bounded
  post hoc source chronology and which ordering remains presentation-only
- [platform/schemas/workflows/history-audit-linkage-mapping.md](platform/schemas/workflows/history-audit-linkage-mapping.md)
  already says derived audit envelopes and workflow-history projections must
  defer to stronger underlying anchors rather than become workflow chronology

Conclusion:

- chronology meaning is no longer the reason to keep planning
- it is now the guardrail that tells the implementation slice what not to fake

### Comparison-citation posture clarity

Posture: `clear_enough_to_constrain_the_implementation_shape`

Reasoning:

- [platform/schemas/workflows/comparison-citation-posture-rules.md](platform/schemas/workflows/comparison-citation-posture-rules.md)
  already classifies current comparison surfaces as direct source anchors,
  assembled summaries only, bounded supporting context only, or not suitable
  for future workflow-owned citation without redesign
- that same posture now makes the missing contract detail explicit: current
  comparison summaries still lack the compared anchor IDs that would let later
  citation preserve the right ownership posture honestly

Conclusion:

- comparison-citation posture does not need another design-first cycle
- it now directly points to a small read-side implementation target

### Remaining blocker severity

Posture: `single_concrete_must_fix_blocker_left`

Reasoning:

- [platform/schemas/workflows/planning-slice-blockers.md](platform/schemas/workflows/planning-slice-blockers.md)
  now leaves only one active `must_fix_before_planning_can_continue` blocker:
  missing citation-grade source identity and explicit anchor exposure for the
  still-weak current surfaces
- [platform/schemas/workflows/bounded-next-step-plan.md](platform/schemas/workflows/bounded-next-step-plan.md)
  already ranks that gap first and explicitly allows only identity-serving
  truth-and-history hardening ahead of any deeper workflow-owned planning

Conclusion:

- blocker severity is now narrow enough to drive one bounded cycle
- it is too concrete to justify another broad planning pass

### Does any blocker now clearly require implementation?

Posture: `yes`

Reasoning:

- [platform/schemas/workflows/smallest-implementation-candidate-gaps.md](platform/schemas/workflows/smallest-implementation-candidate-gaps.md)
  already shows why docs and schemas are no longer enough: the repository knows
  which anchors should be cited, but the implemented API contracts still expose
  timestamps and projection envelopes instead of those explicit anchors
- the strongest example is persisted snapshot and sync-run identity that
  already exists underneath comparison, readiness, and embedded history-support
  surfaces but is still not surfaced to clients

Conclusion:

- at least one blocker has crossed from design ambiguity into implementation
  necessity
- that implementation necessity is still small enough to stay inside `Phase 2`

## Supporting Reasoning

The completed planning slices have already done the hard design work.

They now answer the questions that another planning cycle would normally be used
to answer.

- source identity classes are defined
- chronology reuse is narrowed honestly
- comparison ownership posture is explicit
- the blocker set is reduced to one active must-fix gap
- the smallest real implementation candidate is already isolated

Because of that, another bounded planning slice would mostly duplicate the
current truth.

The repository would still end that cycle with the same practical problem:
current clients could still see timestamps, summaries, and projections without
the explicit persisted anchors that the planning docs now say matter.

So the honest next move is to change the read-only contracts in the smallest
possible way that makes the documented identity rules usable in practice.

## Next-Cycle Boundaries

The next cycle should be limited to one bounded implementation target.

### Primary implementation target

Implement
`expose_explicit_persisted_anchor_ids_for_identity_weak_comparison_readiness_and_history_support_surfaces`
as defined in
[platform/schemas/workflows/smallest-implementation-candidate-gaps.md](platform/schemas/workflows/smallest-implementation-candidate-gaps.md).

### In-scope surfaces

- current-versus-latest-persisted comparison responses for inventory, topology,
  and policy
- latest-versus-previous persisted policy comparison responses where explicit
  compared snapshot IDs already exist underneath
- readiness support surfaces that currently expose `readiness_persisted_at`
  without the readiness snapshot ID
- embedded workflow-history and audit-history snapshot or comparison attachments
  that already rest on persisted snapshot IDs or `sync_run_id` but still hide
  those anchors

### In-scope implementation posture

- expose already existing persisted anchor IDs
- update only the read-only backend schemas, response builders, and typed
  frontend contracts needed to carry those fields
- keep any UI change minimal and limited to current evidence-context displays if
  the added fields must be surfaced for operator usefulness or mixed-version
  safety

### Explicitly deferred even inside this cycle

- deterministic or snapshot-scoped item IDs for capability items
- deterministic or snapshot-scoped item IDs for readiness blocker,
  prerequisite, or assessment-area items
- broader history retention or query expansion
- policy truth deepening
- topology truth deepening
- workflow-owned anchors
- workflow-grade audit linkage
- any workflow, preview, validation, approval, execution, or rollback behavior

## Explicit Anti-Recommendations

The following should not happen next.

- do not run one more general planning slice on source identity, chronology, or
  comparison posture as the primary cycle
- do not widen this cycle into workflow-owned storage, workflow retrieval, or
  workflow-grade audit-linkage design
- do not treat capability-item identity as part of the first code slice unless
  exposing existing persisted anchors proves insufficient after implementation
- do not broaden into retention-model hardening, broad non-sync history
  redesign, or richer policy truth work
- do not reinterpret workflow-history or audit-history projection IDs as
  workflow-owned identities
- do not relabel the project as beyond `Phase 2`
- do not treat this bounded implementation slice as permission to start dry-run
  or action workflows

## Conservative Bottom Line

The strict recommendation for the following cycle is:

- move to one small blocker-driven `Phase 2` implementation cycle

That recommendation is narrow.

It does not mean the project should reopen workflow implementation.

It means the planning baseline is now mature enough that the one remaining
active blocker has become a contract-exposure problem, and the smallest honest
next step is to expose the already existing persisted anchors that current
comparison, readiness, and embedded history-support surfaces still hide.
# Post-Planning Recommendation For The Next Workflow Step

## Purpose

This document gives a strict recommendation for what should happen next after
the current workflow-planning slice.

It exists to answer one narrow question.

Should the project now:

- continue blocker-driven `Phase 2` hardening as the primary next move, or
- proceed to the next tightly bounded planning slice

This is a recommendation document only.

It does not authorize:

- workflow implementation
- dry-run implementation
- a phase jump
- broad redesign
- roadmap expansion

## Recommendation

Recommendation: `proceed_to_the_next_bounded_planning_slice`

Interpret it narrowly.

- stay fully in `Phase 2 — read-only product foundation`
- keep the next step documentation-first and schema-first only
- make the next slice explicit source-record identity rules for current
  read-model, comparison, readiness, capability, and embedded history-support
  citations
- do not treat this recommendation as permission to start workflow-owned
  storage, workflow retrieval implementation, or workflow audit implementation

## Why This Recommendation Is Strict

The choice is not between planning and implementation.

The choice is between:

- spending the next cycle on broad blocker-driven hardening, or
- using the newly completed planning baseline to remove the remaining narrow
  ambiguity that still sits directly in front of honest future workflow design

The strict answer is the second one.

Broad blocker-driven hardening is not the right immediate move because the most
important remaining near-term ambiguity is still contractual, not operational.

## Evidence-Based Evaluation

### Evidence-reference maturity

Posture: `mature_enough_to_support_the_next_planning_slice`

Reasoning:

- [platform/schemas/workflows/evidence-reference-contract.md](platform/schemas/workflows/evidence-reference-contract.md)
  already defines evidence kinds, source classes, chronology anchors, posture
  semantics, and citation roles
- [platform/schemas/workflows/phase2-evidence-surface-mapping.md](platform/schemas/workflows/phase2-evidence-surface-mapping.md)
  already distinguishes stronger direct citation candidates from weaker
  assembled or aggregate surfaces
- the remaining ambiguity is no longer the contract vocabulary itself; it is the
  missing explicit `source_record_id` posture for many current surfaces

Conclusion:

- this area is ready for the next bounded planning slice
- it does not justify switching the primary next move to broad hardening first

### Audit-linkage maturity

Posture: `mature_for_planning_but_not_for_implementation`

Reasoning:

- [platform/schemas/workflows/audit-linkage-contract.md](platform/schemas/workflows/audit-linkage-contract.md)
  already defines identity, chronology, ordering, and evidence-reference
  interaction rules
- [platform/schemas/workflows/history-audit-linkage-mapping.md](platform/schemas/workflows/history-audit-linkage-mapping.md)
  already makes the current limits explicit
- the remaining blockers here depend on workflow-owned anchors and workflow-grade
  chronology, both of which remain outside the next honest `Phase 2` move

Conclusion:

- this area is clear enough that the project does not need to pause for broad
  hardening before continuing planning
- it is not clear enough to justify implementation or deeper workflow-owned
  retrieval planning yet

### Retrieval-sequencing maturity

Posture: `mature_for_dependency_order_but_blocked_for_concrete_workflow_roots`

Reasoning:

- [platform/schemas/workflows/read-only-retrieval-sequencing.md](platform/schemas/workflows/read-only-retrieval-sequencing.md)
  already defines anchor-first dependency order and current-versus-future layer
  boundaries
- the remaining blocker is not retrieval-order ambiguity itself
- the remaining blocker is that many current evidence surfaces still lack the
  explicit source identity needed for clean citation and later retrieval joins

Conclusion:

- retrieval sequencing is mature enough to support the next identity-focused
  planning slice
- it does not support jumping straight into workflow-owned anchor design or
  workflow retrieval implementation

### Ownership-boundary clarity

Posture: `clear_enough_for_next_planning_but_not_yet_concrete_record_level`

Reasoning:

- [platform/schemas/workflows/ownership-boundaries.md](platform/schemas/workflows/ownership-boundaries.md)
  already separates read-side evidence, persisted snapshots, readiness metadata,
  workflow-owned state, and workflow audit records
- [platform/schemas/workflows/bounded-next-step-plan.md](platform/schemas/workflows/bounded-next-step-plan.md)
  already ranks ownership-rule tightening after source identity and narrower
  chronology clarification
- the remaining issue is concrete record-level grounding, not conceptual
  direction

Conclusion:

- ownership clarity is sufficient to continue one more bounded planning slice
- it does not justify broad hardening as the primary next action

### Blocker severity

Posture: `severe_for_implementation_but_not_for_the_next_planning_slice`

Reasoning:

- [platform/schemas/workflows/planning-slice-blockers.md](platform/schemas/workflows/planning-slice-blockers.md)
  identifies four strict blockers for concrete workflow planning
- [platform/schemas/workflows/bounded-next-step-plan.md](platform/schemas/workflows/bounded-next-step-plan.md)
  already narrows the immediate `Phase 2` order and says only one of those
  blockers, source-record identity, should be the next closure target
- the remaining strict blockers either can only be narrowed inside `Phase 2` or
  should wait for later reassessment

Conclusion:

- blocker severity does not argue for broad hardening first
- blocker severity argues for a narrower planning move that removes the only
  immediate Phase-2-safe strict blocker

## Supporting Reasoning

The recommendation favors the next bounded planning slice because all four of
the relevant planning areas are now mature enough in structure and vocabulary to
support one more narrow clarification pass.

Specifically:

- evidence-reference maturity is blocked by source identity precision rather
  than missing contract vocabulary
- audit-linkage maturity is blocked by later workflow-owned prerequisites rather
  than missing planning semantics
- retrieval-sequencing maturity is blocked by missing anchors and source-record
  identities rather than missing order rules
- ownership-boundary clarity is blocked by missing record-level grounding rather
  than missing conceptual separation

That means the most honest next move is not broad hardening.

The most honest next move is to finish the remaining narrow clarification that
the completed planning slice itself exposed.

## Why Blocker-Driven Phase 2 Hardening Is Not The Primary Next Step

Do not choose blocker-driven `Phase 2` hardening as the primary next move.

Why not:

- the build-order rules still keep workflow scaffolding after the read-only
  foundation, so hardening cannot be allowed to masquerade as early workflow
  implementation
- the strongest current blocker that can be addressed honestly now is still
  source-record identity, which is a planning and contract problem first
- the remaining severe blockers point toward workflow-owned anchors,
  workflow-grade audit linkage, and workflow chronology, which are not the next
  safe `Phase 2` hardening targets
- broad hardening now would risk solving around the real ambiguity rather than
  resolving it directly

Hardening may still happen later, but only where the next bounded planning slice
reveals a concrete evidence gap that cannot be settled honestly on paper alone.

## Next-Step Boundaries

The next step must be bounded by all of the following.

1. Stay fully in `Phase 2 — read-only product foundation`.
2. Keep the next move documentation-first and schema-first only.
3. Focus only on explicit source-record identity rules for current read-model,
   comparison, readiness, capability, and embedded history-support citations.
4. Treat current-history chronology as a follow-on narrowing step, not as the
   immediate primary task.
5. Leave workflow-owned anchors and workflow-grade audit linkage for later
   reassessment after the source-identity slice is complete.
6. Preserve the rule that sync-derived history is evidence context only, not
   workflow lifecycle or workflow audit truth.
7. Preserve the current interpretation of topology and policy truth as bounded
   and not validation-grade.

## Explicit Anti-Recommendations

The following must not happen next.

- do not start workflow implementation
- do not start dry-run, preview, diff, approval, execution, or rollback work
- do not relabel the project as being beyond `Phase 2`
- do not treat the blocker list as permission to begin workflow-owned storage
  design or workflow retrieval endpoints immediately
- do not switch the primary next cycle to broad truth hardening, retention-model
  hardening, or runtime hardening unless the next bounded planning slice exposes
  a concrete evidence gap that cannot be resolved in docs and schemas
- do not overread the existence of planning artifacts as proof that workflow
  implementation readiness exists

## Conservative Bottom Line

The strict next recommendation is:

- proceed to the next bounded planning slice

That recommendation is narrow, not optimistic.

It means the planning baseline is now good enough to support one more precise
identity-focused design step, but it is still not good enough to justify broad
blocker-driven hardening as the primary next cycle, and it is nowhere close to
justifying workflow implementation.