# Workflow Planning Gate

## Purpose

This document gives a strict go or no-go recommendation on whether the project is ready to begin planning a bounded future workflow-oriented phase.

It is a planning gate only.

It does not authorize:

- a phase jump
- dry-run implementation
- action workflow implementation
- roadmap inflation
- workflow code

## Recommendation

Recommendation: `conditional_go_for_planning_only`

That means:

- the project is ready to continue bounded workflow-phase planning work in docs, schemas, and design models
- the project is not ready for workflow-phase implementation
- the project must remain fully in `Phase 2 — read-only product foundation`

## Why This Is Not A No-Go

The recommendation is not `no_go` because the repository now has enough evidence and design clarity to support disciplined planning work without guessing.

Specifically, the current foundation already provides:

- meaningful read-only evidence inputs through persisted normalized snapshots and evidence-confidence semantics
- explicit capability and readiness vocabulary for support posture, blockers, and evidence basis
- explicit workflow lifecycle, preview, diff, validation, blocker, entity-model, audit-relationship, and reuse-mapping design docs
- a strict documented phase boundary that keeps planning separate from implementation

## Why This Is Still Not Implementation-Ready

The recommendation is only conditional because the project still lacks workflow-grade runtime and storage foundations.

Specifically, the repository still does not have:

- durable workflow lifecycle records
- workflow-owned preview, diff, validation, approval, or execution APIs
- workflow-grade audit linkage implementation
- workflow-grade history beyond sync-derived read-side activity
- strong enough topology and policy truth for pre-change intelligence

## Evidence Matrix

| Area | Recommendation posture | Evidence-based reasoning |
| --- | --- | --- |
| Read-only truth maturity | `mixed` | Inventory is strong enough to inform planning, but topology and policy remain intentionally partial and bounded. This is already stated in [platform/docs/roadmap.md](platform/docs/roadmap.md) and [platform/docs/workflows.md](platform/docs/workflows.md). |
| History maturity | `blocked` | Workflow-history and audit-history remain sync-derived and snapshot-bounded rather than durable workflow lifecycle or operator-action history. This is stated in [platform/docs/roadmap.md](platform/docs/roadmap.md), [platform/docs/workflows.md](platform/docs/workflows.md), and [platform/schemas/workflows/audit-relationships.md](platform/schemas/workflows/audit-relationships.md). |
| Comparison maturity | `mixed` | Current-versus-latest-persisted and persisted-versus-previous comparison support is useful and reusable as explanatory evidence, but it is not validation-grade or diff-grade truth. This is documented in [platform/docs/phase2-workflow-foundations.md](platform/docs/phase2-workflow-foundations.md). |
| Capability maturity | `strong_for_planning` | The capability matrix already expresses support status, delivery tier, evidence basis, vendor posture, and workflow-readiness interpretation explicitly enough to guide planning safely. This is documented in [platform/docs/roadmap.md](platform/docs/roadmap.md) and modeled in [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py#L1). |
| Readiness and blocker maturity | `blocked_for_implementation_but_useful_for_planning` | Readiness metadata and blocker records are explicit enough to support planning discussion, but blocker maturity remains too severe for any implementation move because contract, truth, and history gaps still overlap with phase-transition scope. This is documented in [platform/docs/roadmap.md](platform/docs/roadmap.md), [platform/docs/workflows.md](platform/docs/workflows.md), and [platform/schemas/workflows/validation-blocker-semantics.md](platform/schemas/workflows/validation-blocker-semantics.md). |
| Workflow domain clarity | `strong_for_planning` | Lifecycle vocabulary, preview/diff contracts, validation/blocker contracts, and the workflow entity model now provide a coherent planning baseline without implying implementation. See [platform/docs/workflows.md](platform/docs/workflows.md), [platform/docs/workflow-lifecycle-vocabulary.md](platform/docs/workflow-lifecycle-vocabulary.md), and [platform/schemas/workflows/workflow-entity-model.md](platform/schemas/workflows/workflow-entity-model.md). |
| Audit relationship clarity | `strong_for_planning` | Audit linkage expectations are now explicit and keep sync-derived history separate from future workflow audit history. See [platform/schemas/workflows/audit-relationships.md](platform/schemas/workflows/audit-relationships.md). |

## Supporting Reasoning

The recommendation is strict because it separates planning readiness from implementation readiness.

Current evidence supports planning because:

- the read-only platform now exposes reusable evidence inputs rather than only placeholders
- the workflow domain has explicit design vocabulary instead of implicit guesses
- blockers, unsupported areas, insufficient-evidence semantics, and audit relationships are now documented clearly enough to constrain future work
- the reuse map distinguishes directly reusable artifacts from partial analogues and non-reusable surfaces

Current evidence blocks implementation because:

- the active phase is still `Phase 2 — read-only product foundation` as stated in [agent/sdn/01-CURRENT-PHASE.md](agent/sdn/01-CURRENT-PHASE.md)
- the current status file still says to remain in Phase 2 and explicitly says no workflow engine, dry-run APIs, preview or diff outputs, validation-result implementation, or workflow-grade audit relationships exist yet in [agent/sdn/03-CURRENT-STATUS.md](agent/sdn/03-CURRENT-STATUS.md)
- the build-order rules place dry-run and workflow scaffolding after the read-only foundation in [agent/sdn/16-implementation-order.md](agent/sdn/16-implementation-order.md) and [agent/sdn/35-build-order-enforcement-rules.md](agent/sdn/35-build-order-enforcement-rules.md)

## Strict Prerequisites For Conditional Planning Go

The conditional go is valid only if all of the following remain true.

1. Planning stays documentation-first and schema-first only.
2. Planning does not introduce backend implementation, workflow storage, workflow endpoints, rule engines, or action UX.
3. Planning treats sync-derived workflow-history and audit-history as evidence context only, not as workflow lifecycle or workflow audit truth.
4. Planning preserves the current interpretation of topology and policy truth as bounded and not validation-grade.
5. Planning uses the existing workflow design docs as the baseline rather than reopening basic vocabulary from scratch.
6. Planning stays bounded to a future safe workflow surface rather than broad "change anything" automation.
7. Planning keeps the project explicitly in `Phase 2 — read-only product foundation`.

## Strict Boundaries

During this planning-only window, do not:

- relabel the project as being in a workflow phase
- imply that readiness metadata equals workflow readiness for implementation
- imply that preview, diff, validation, approval, or audit linkage already exist as implemented backend surfaces
- treat Grafana or the current readiness page as workflow control surfaces
- treat the existence of design docs as proof that Phase 4 can start immediately

## Required Prerequisites Before Any Future Workflow-Phase Implementation

Even with a planning-only go, the following remain hard prerequisites before implementation should begin later.

- durable workflow lifecycle records must exist
- workflow-owned request, preview, diff, validation-result, and audit-linkage contracts must become implemented backend surfaces rather than design docs only
- topology and policy truth must become strong enough for bounded pre-change reasoning in the targeted workflow slice
- workflow-grade audit events and workflow-linked history must exist beyond sync-derived read-side activity
- implementation must still respect the staged order that follows the read-only foundation rather than skipping it

## Final Gate Statement

Strict gate outcome:

- `conditional_go_for_planning_only`

Interpret it narrowly:

- continue bounded workflow-phase planning work
- do not start workflow-phase implementation work
- do not change the current phase label
- preserve the current build-order discipline