# Exact Blockers Revealed By The Workflow-Planning Slice

## Purpose

This document identifies the exact blockers revealed by the current
documentation-first and schema-first workflow-planning slice.

It exists to answer four bounded questions.

- which blockers must be resolved before workflow implementation planning can
  become more concrete
- which blockers are important but do not stop the current planning slice from
  continuing
- which blockers are real but belong to later workflow phases rather than the
  current planning checkpoint
- why each blocker matters, what it depends on, and what repository evidence
  justifies it

It is a blocker-analysis document only.

It does not introduce:

- blocker remediation
- workflow implementation
- new APIs
- persistence changes
- phase changes
- speculative roadmap claims

## Phase Boundary

The platform remains in `Phase 2 — read-only product foundation`.

So this document must be read as a strict planning output only.

It must not be read as permission to start workflow implementation or to treat
the listed blockers as already resolved.

## Classification Rules

Use the following severity classes strictly.

### `must_fix_before_planning_can_continue`

The blocker prevents the current workflow-planning slice from moving from
high-level contract design into more concrete workflow storage, retrieval, or
relationship planning.

### `important_but_not_blocking`

The blocker materially weakens future workflow design quality, but the current
planning slice can still continue if it is explicitly preserved as an open gap.

### `later_phase_concern`

The blocker is real and important, but it belongs to later workflow
implementation readiness or later workflow-scope strength rather than the
current concrete planning checkpoint.

## What Changed Since The Earlier Blocker Analysis

The blocker set is now narrower because several planning questions that were
previously open have been answered by the recent clarification work.

1. Source-record identity is no longer a vague general gap. The repository now
   has explicit identity classes plus a needs map that isolate the remaining
   weak surfaces to current comparison contracts, readiness items, capability
   items, and embedded history-support attachments that still hide stronger
   underlying anchors.
2. Current-history chronology is no longer an open interpretation problem. The
   repository now states explicitly that current history is only bounded post
   hoc source chronology, derived chronology through stronger anchors, or feed
   presentation order.
3. Comparison ownership and citation posture are no longer open blocker
   questions. The repository now explicitly classifies which comparison
   surfaces are direct source anchors, assembled summaries, supporting context,
   or unsafe workflow-owned citation targets.
4. The current status and follow-up guidance now point to bounded `Phase 2`
   doc reconciliation and conditional design recording before any deeper
   workflow-owned-anchor or workflow-grade audit-linkage planning resumes.

## Updated Active Blocker List

| Blocker code | Class | Primary category | Exact blocker | Evidence basis | Why this blocker matters now | Dependency notes |
| --- | --- | --- | --- | --- | --- | --- |
| `standalone_item_identity_still_absent_for_non_persisted_readiness_and_capability_items` | `important_but_not_blocking` | `evidence_identity` | Residual standalone item identity is still absent for non-persisted readiness child items and capability items, but current backend contracts now expose the response-level and persisted anchors needed for bounded `Phase 2` use. | [platform/schemas/workflows/source-record-identity-rules.md](platform/schemas/workflows/source-record-identity-rules.md) and [platform/schemas/workflows/source-record-identity-needs-mapping.md](platform/schemas/workflows/source-record-identity-needs-mapping.md) now narrow the remaining identity-weak area to readiness child items and capability items; [platform/docs/production-readiness-assessment.md](platform/docs/production-readiness-assessment.md) records that comparison, readiness-response, and embedded history-support anchors are already exposed strongly enough for bounded operations; current schemas in [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py) still leave those child items without explicit item IDs. | This still matters if a later consumer needs standalone blocker, prerequisite, assessment-area, or capability-item citation. It does not block the current planning checkpoint because the current product can already operate honestly through the exposed response-level or snapshot-level anchors. | Revisit this only if a concrete bounded consumer can no longer operate honestly with the current response-level and persisted anchors. |
| `workflow_owned_anchor_records_absent` | `important_but_not_blocking` | `persistence` | Workflow-owned anchors such as `workflow_id`, `workflow_revision_id`, and `workflow_state_transition_id` are still absent, but after the recent clarification work they no longer belong in the immediate must-fix set for the current planning checkpoint. | [platform/schemas/workflows/read-only-retrieval-sequencing.md](platform/schemas/workflows/read-only-retrieval-sequencing.md) still makes anchor resolution the first retrieval layer and marks current `Phase 2` support as `no`; [platform/schemas/workflows/workflow-owned-state-prerequisites.md](platform/schemas/workflows/workflow-owned-state-prerequisites.md) still lists workflow root storage as a prerequisite; [platform/schemas/workflows/bounded-next-step-plan.md](platform/schemas/workflows/bounded-next-step-plan.md) and [agent/sdn/03-CURRENT-STATUS.md](agent/sdn/03-CURRENT-STATUS.md) now defer deeper workflow-owned-anchor planning until after bounded doc reconciliation and later reassessment. | The absence of workflow-owned anchors remains a real future dependency, but it no longer blocks the next honest move because the repository has explicitly chosen not to deepen workflow-owned storage or retrieval planning yet. | This should remain visible for later reassessment. It becomes blocking again only if the repository explicitly reopens concrete workflow-owned retrieval or lifecycle storage planning. |
| `workflow_grade_audit_linkage_chain_absent` | `important_but_not_blocking` | `audit_linkage` | The repo still has no persisted workflow-grade `audit_linkage` chain, no dedicated workflow-aware audit-event family, and no workflow-scoped retrieval path for those relationships, but that absence is now deferred behind doc reconciliation and later reassessment rather than treated as the next must-fix gap. | [platform/schemas/workflows/audit-linkage-contract.md](platform/schemas/workflows/audit-linkage-contract.md) remains design-only; [platform/schemas/workflows/history-audit-linkage-mapping.md](platform/schemas/workflows/history-audit-linkage-mapping.md) still lists no implemented `audit_linkage` records or workflow-scoped retrieval chains; [agent/sdn/03-CURRENT-STATUS.md](agent/sdn/03-CURRENT-STATUS.md) now treats deeper workflow-grade audit planning as a later reassessment topic rather than the next default step. | This still matters before any workflow-grade audit retrieval or accountability model can become concrete, but it is not the immediate blocker while the project is still reconciling current identity guidance inside `Phase 2`. | This depends on both stronger current source identity and any future decision to resume deeper workflow-owned anchor planning. |
| `current_history_surfaces_remain_non_workflow_grade_even_after_clarification` | `important_but_not_blocking` | `history` | The chronology ambiguity has now been narrowed honestly, but current history surfaces still remain bounded post hoc source chronology, derived chronology through stronger anchors, or presentation order only rather than workflow-grade chronology. | [platform/schemas/workflows/current-history-chronology-ordering-rules.md](platform/schemas/workflows/current-history-chronology-ordering-rules.md) explicitly classifies sync runs, readiness snapshots, derived audit envelopes, workflow-history projections, and audit-history feed order; [platform/schemas/workflows/history-audit-linkage-mapping.md](platform/schemas/workflows/history-audit-linkage-mapping.md) now says the same surfaces remain useful only in that bounded way. | This remains an important guardrail because later planning must continue to avoid reusing sync history or audit feed order as workflow chronology. But the repo now knows the honest interpretation already, so this is no longer a must-fix classification problem by itself. | This becomes blocking only if later work tries to promote current history into workflow lifecycle, revision, approval, execution, or rollback ordering without new workflow-owned records. |
| `history_query_and_retention_model_remains_bounded` | `important_but_not_blocking` | `history` | Current history access is still explicitly bounded to small recent windows and still lacks a broader query, pagination, archival, or retention model. | [platform/schemas/workflows/history-audit-linkage-mapping.md](platform/schemas/workflows/history-audit-linkage-mapping.md) states that `load_sync_runs` returns only the latest `50` rows and `load_readiness_snapshot_history` only the latest `20`, with no broader durable query model; current persistence helpers in [platform/app-api/src/app_api/persistence/history.py](platform/app-api/src/app_api/persistence/history.py) implement those bounded reads. | This still constrains later workflow-linked audit reasoning, but it does not block the next bounded reconciliation cycle. | This becomes more severe only when later workflow-owned audit linkage or broader history retrieval actually resumes. |
| `topology_truth_is_still_too_bounded_for_workflow_grade_pre_change_reasoning` | `later_phase_concern` | `truth` | The topology slice remains partial and inference-heavy, which is still not strong enough for workflow-grade pre-change intelligence. | [platform/docs/workflow-planning-gate.md](platform/docs/workflow-planning-gate.md) classifies read-only truth maturity as mixed; [platform/schemas/workflows/phase2-evidence-surface-mapping.md](platform/schemas/workflows/phase2-evidence-surface-mapping.md) warns that inferred topology must not be overread as validation-grade truth; current topology schemas in [platform/app-api/src/app_api/schemas/topology.py](platform/app-api/src/app_api/schemas/topology.py) explicitly preserve `partial` and `unknown` semantics. | This matters for later validation or safe action planning, not for the current blocker reassessment. | This remains later-phase because build-order rules place workflow implementation after the read-only foundation and because the current checkpoint is still truth-hardening, not validation design. |
| `policy_truth_is_still_too_partial_for_workflow_grade_pre_change_reasoning` | `later_phase_concern` | `truth` | The policy slice remains bounded, sometimes aggregate-only, and live-empty in the current lab, so it is still too weak for workflow-grade change intelligence. | [platform/docs/workflow-planning-gate.md](platform/docs/workflow-planning-gate.md) marks policy maturity as mixed; [platform/schemas/workflows/phase2-evidence-surface-mapping.md](platform/schemas/workflows/phase2-evidence-surface-mapping.md) states that aggregate footprints and live-empty posture must not be treated as full per-policy truth; current policy schemas in [platform/app-api/src/app_api/schemas/policies.py](platform/app-api/src/app_api/schemas/policies.py) show bounded `detail_mode`, `empty_reason`, `target_footprints`, and derived `change_preview` support. | This matters for later validation, preview, and safe-action phases, not for the current blocker reassessment. | This remains later-phase for the same reason as topology truth: it becomes blocking only when the project approaches later workflow implementation scope. |
| `approval_execution_and_rollback_accountability_is_absent_by_design` | `later_phase_concern` | `audit_linkage` | Current history and audit surfaces intentionally do not contain approval, execution, rollback, or broad operator-accountability semantics. | [platform/schemas/workflows/audit-linkage-contract.md](platform/schemas/workflows/audit-linkage-contract.md) explicitly says current history cannot support approval, execution, or rollback chronology; [platform/schemas/workflows/history-audit-linkage-mapping.md](platform/schemas/workflows/history-audit-linkage-mapping.md) says current sync-derived history is not suitable for lifecycle, approval, execution, or rollback history. | This remains real but belongs to later dry-run, approval, execution, and safe-action phases rather than the current truth-and-history checkpoint. | This becomes active only when the project deliberately moves into later workflow phases defined in [agent/sdn/16-implementation-order.md](agent/sdn/16-implementation-order.md) and [agent/sdn/35-build-order-enforcement-rules.md](agent/sdn/35-build-order-enforcement-rules.md). |

## Questions Recently Closed By Clarification Work

The following earlier blocker questions are no longer active blockers in their
own right because the recent planning work answered them directly.

| Earlier blocker or ambiguity | What changed | Current result |
| --- | --- | --- |
| `source_record_identity_missing_for_current_read_models_and_comparisons` | The repository now has explicit source-record identity classes plus a needs map that isolate the exact still-weak surfaces, and the repo already exposes the persisted anchors several earlier planning docs described as missing. | Reduced to the narrower residual concern `standalone_item_identity_still_absent_for_non_persisted_readiness_and_capability_items`, which is now important but not blocking. |
| `current_history_identity_and_ordering_too_weak_for_workflow_chronology` | The repository now explicitly defines which chronology is reusable as post hoc source chronology, which is derived chronology through stronger anchors, and which is presentation order only. | Downgraded to the narrower guardrail blocker `current_history_surfaces_remain_non_workflow_grade_even_after_clarification`. |
| `ownership_boundaries_are_clear_in_docs_but_not_yet_grounded_in_concrete_record_rules` | [platform/schemas/workflows/comparison-citation-posture-rules.md](platform/schemas/workflows/comparison-citation-posture-rules.md) now makes comparison ownership and citation posture explicit enough for the current planning checkpoint. | No longer an active blocker for the current reassessment. |
| `comparison_records_are_explanatory_but_not_durable_entities` | The repository now explicitly says which comparison surfaces are assembled summaries only, bounded supporting context only, or unsafe for direct workflow-owned citation. | No longer an active blocker for the current reassessment. |

## Why The `Must Fix` Set Is Now Minimal

No blocker remains in the `must_fix_before_planning_can_continue` class.

That is intentional.

The recent planning slices already answered the design questions that were
previously inflating the must-fix set.

1. Ownership posture is now explicit enough to keep current evidence separate
   from future workflow-owned state.
2. Comparison citation posture is now explicit enough to keep comparison
   surfaces explanatory unless stronger identity exists later.
3. Current-history chronology is now explicit enough to keep sync runs,
   readiness snapshots, derived audit envelopes, workflow-history projections,
   and audit-feed ordering in their honest bounded roles.
4. The repository has also explicitly deferred deeper workflow-owned-anchor and
   workflow-grade audit-linkage planning until after bounded `Phase 2`
   doc reconciliation, later reassessment, and only then any narrower consumer-
   driven identity follow-on.

So the only residual identity issue is now conditional.

The repository should reopen it only if later work truly needs standalone
readiness-child or capability-item citation beyond the anchors already exposed.

## New Dependency Order

The updated blocker dependency order is now narrower and more phase-aligned.

1. `standalone_item_identity_still_absent_for_non_persisted_readiness_and_capability_items`
   This is the only residual identity dependency, but it is now conditional
   rather than must-fix because current bounded use can rely on the anchors the
   product already exposes.
2. `current_history_surfaces_remain_non_workflow_grade_even_after_clarification`
   This remains the next guardrail dependency because any future planning must
   keep using current history only through the narrowed post hoc and
   presentation-only rules already documented.
3. `workflow_owned_anchor_records_absent`
   This remains a deeper future dependency, but only after the repository
   chooses to reopen concrete workflow-owned retrieval or lifecycle storage
   planning.
4. `workflow_grade_audit_linkage_chain_absent`
   This remains downstream of both stronger current source identity and any
   future workflow-owned-anchor decision.
5. `history_query_and_retention_model_remains_bounded`
   This stays behind the earlier items because broader retention only matters
   once future workflow-linked retrieval scope expands.
6. The later-phase truth and accountability concerns remain behind all of the
   above because they belong to later validation, execution, and safe-action
   phases rather than the current checkpoint.

## Explicit Non-Goals

This document does not define:

- blocker remediation steps
- implementation sequencing beyond blocker dependencies
- new readiness metadata
- workflow endpoints
- phase transitions

## Conservative Bottom Line

The current planning slice still produced real blockers, but the active blocker
set is now smaller and stricter than before.

There is no remaining must-fix blocker at this checkpoint.

The residual identity concern is:

- standalone item identity remains absent for non-persisted readiness child
   items and capability items if a later consumer needs to cite them directly

The remaining open items still matter, but they now fall into two narrower
groups.

- important but not blocking for the current checkpoint: workflow-owned anchors,
   workflow-grade audit linkage, non-workflow-grade current history, and bounded
   history retention
- later-phase only: topology truth depth, policy truth depth, and broad
   approval, execution, and rollback accountability

That is the stricter blocker posture after the recent clarification work.

The next honest move is bounded `Phase 2` doc reconciliation and conditional
design recording, not a return to broad workflow-owned storage or audit-linkage
planning.