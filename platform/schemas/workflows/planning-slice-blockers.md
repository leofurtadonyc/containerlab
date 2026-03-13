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

## Exact Blocker List

| Blocker code | Class | Primary category | Exact blocker | Evidence basis | Why this blocker matters | Dependency notes |
| --- | --- | --- | --- | --- | --- | --- |
| `source_record_identity_missing_for_current_read_models_and_comparisons` | `must_fix_before_planning_can_continue` | `evidence_identity` | Many current read-model, comparison, readiness, and capability surfaces still do not expose explicit standalone source-record identities that a future `evidence_reference` can cite cleanly. | [platform/schemas/workflows/phase2-evidence-surface-mapping.md](platform/schemas/workflows/phase2-evidence-surface-mapping.md) states that most current read-model and comparison surfaces still lack explicit standalone `source_record_id` values; current API schemas such as [platform/app-api/src/app_api/schemas/devices.py](platform/app-api/src/app_api/schemas/devices.py), [platform/app-api/src/app_api/schemas/topology.py](platform/app-api/src/app_api/schemas/topology.py), [platform/app-api/src/app_api/schemas/policies.py](platform/app-api/src/app_api/schemas/policies.py), and [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py) expose object IDs for some domain records but no explicit citation-grade IDs for comparison summaries, readiness blockers, readiness prerequisites, or capability items. | The evidence-reference contract and retrieval-sequencing design both depend on a stable `source_record_id`. Without it, later workflow artifacts would have to cite response envelopes or aggregate projections ambiguously, which would weaken chronology, scope, and provenance semantics immediately. | This blocker sits upstream of concrete evidence-reference attachment rules, citation precedence, and any later workflow retrieval payload that wants to expose direct cited evidence rather than copied summaries. |
| `workflow_owned_anchor_records_absent` | `must_fix_before_planning_can_continue` | `persistence` | The retrieval design now assumes workflow-owned anchors such as `workflow_id`, `workflow_revision_id`, and `workflow_state_transition_id`, but no workflow-owned anchor records exist in current backend persistence. | [platform/schemas/workflows/read-only-retrieval-sequencing.md](platform/schemas/workflows/read-only-retrieval-sequencing.md) makes anchor resolution the first retrieval layer and marks current `Phase 2` support as `no`; [platform/schemas/workflows/workflow-owned-state-prerequisites.md](platform/schemas/workflows/workflow-owned-state-prerequisites.md) says workflow root storage is a prerequisite layer; [platform/docs/workflow-planning-gate.md](platform/docs/workflow-planning-gate.md) explicitly lists durable workflow lifecycle records as still missing; current persistence code under [platform/app-api/src/app_api/persistence/history.py](platform/app-api/src/app_api/persistence/history.py) and the persistence directory do not define workflow root tables or workflow revision records. | Until workflow-owned anchors are real and explicit on paper, retrieval sequencing cannot be converted into concrete storage or endpoint planning. Any attempt to continue without them would drift back into using sync runs or read-side responses as fake workflow roots. | This blocker must be resolved before concrete planning can specify workflow retrieval inputs, workflow lifecycle storage shape, or revision-scoped ownership rules. |
| `workflow_grade_audit_linkage_chain_absent` | `must_fix_before_planning_can_continue` | `audit_linkage` | The repo now has audit-linkage semantics, but no concrete workflow-grade audit-event family, no persisted `audit_linkage` chain, and no workflow-scoped retrieval path for those relationships. | [platform/schemas/workflows/audit-linkage-contract.md](platform/schemas/workflows/audit-linkage-contract.md) is design-only and states that current history cannot support workflow-created `audit_linkage_id` families or workflow revision chronology; [platform/schemas/workflows/history-audit-linkage-mapping.md](platform/schemas/workflows/history-audit-linkage-mapping.md) lists no implemented `audit_linkage` records or retrieval chains; current audit models in [platform/app-api/src/app_api/models/audit.py](platform/app-api/src/app_api/models/audit.py) define only bounded read-only `AuditEventRecord` projections. | Future workflow planning cannot become concrete if auditability remains only conceptual. Without a workflow-grade audit-linkage chain, later workflow retrieval cannot specify how workflow entities, audit events, and cited evidence join together durably. | This blocker depends on workflow-owned anchors, but it must also be resolved before any concrete planning for workflow history retrieval, validation accountability, or execution observation linkage can stabilize. |
| `current_history_identity_and_ordering_too_weak_for_workflow_chronology` | `must_fix_before_planning_can_continue` | `history` | Current history surfaces still use overloaded or synthesized identities and presentation ordering that are too weak for concrete workflow chronology planning. | [platform/schemas/workflows/history-audit-linkage-mapping.md](platform/schemas/workflows/history-audit-linkage-mapping.md) states that `WorkflowHistoryRecord.workflow_id` overloads `sync_run_id`, current `AuditEventRecord.event_id` values are synthesized, and current responses have no `sequence_scope`, `sequence_number`, predecessor link, or supersession chain; code confirms `workflow_id=sync_run.sync_run_id` in [platform/app-api/src/app_api/services/workflow_history.py](platform/app-api/src/app_api/services/workflow_history.py) and synthesized event IDs in [platform/app-api/src/app_api/services/audit_history.py](platform/app-api/src/app_api/services/audit_history.py). | If chronology remains projection-based, later workflow planning cannot define concrete state-transition history, revision history, or audit ordering without risking silent reuse of sync history as workflow history. | This blocker is tightly coupled to workflow-owned anchors and audit-linkage persistence. It must be fixed before concrete workflow history or audit retrieval planning can become credible. |
| `history_query_and_retention_model_remains_bounded` | `important_but_not_blocking` | `history` | Current history access is explicitly bounded to small recent windows and lacks a broader query, pagination, archival, or retention model. | [platform/schemas/workflows/history-audit-linkage-mapping.md](platform/schemas/workflows/history-audit-linkage-mapping.md) states that `load_sync_runs` returns only the latest `50` rows and `load_readiness_snapshot_history` only the latest `20`, with no broader durable query model; current persistence helpers in [platform/app-api/src/app_api/persistence/history.py](platform/app-api/src/app_api/persistence/history.py) implement those bounded history reads. | This does not stop the current planning slice from continuing, but it limits how far a future workflow retrieval design can depend on historical evidence and how far workflow-linked audit reasoning can extend beyond recent windows. | This blocker becomes more severe once workflow-owned audit linkage and post hoc observation rules move closer to implementation. It is not the next planning slice by itself because source identity and workflow anchors are more immediate blockers. |
| `comparison_records_are_explanatory_but_not_durable_entities` | `important_but_not_blocking` | `retrieval` | Current comparison summaries and `change_preview` structures are useful, but they remain derived, embedded, and non-durable rather than standalone comparison records. | [platform/schemas/workflows/phase2-evidence-surface-mapping.md](platform/schemas/workflows/phase2-evidence-surface-mapping.md) and [platform/schemas/workflows/history-audit-linkage-mapping.md](platform/schemas/workflows/history-audit-linkage-mapping.md) both say comparison surfaces lack dedicated durable comparison IDs; current schemas in [platform/app-api/src/app_api/schemas/devices.py](platform/app-api/src/app_api/schemas/devices.py), [platform/app-api/src/app_api/schemas/topology.py](platform/app-api/src/app_api/schemas/topology.py), and [platform/app-api/src/app_api/schemas/policies.py](platform/app-api/src/app_api/schemas/policies.py) expose comparison summaries without any comparison-record identifier. | This matters because retrieval sequencing gives comparison evidence a lower precedence than direct records, but later workflow planning still needs to know whether those comparison surfaces can ever be cited directly or only as attached explanatory context. | This blocker is downstream of source-record identity rules. It does not stop planning from continuing now, but it constrains how precise later comparison citation rules can become. |
| `ownership_boundaries_are_clear_in_docs_but_not_yet_grounded_in_concrete_record_rules` | `important_but_not_blocking` | `ownership_boundary` | The ownership split is now explicit at the design level, but there are still no concrete field-by-field or table-by-table record rules that would prevent an implementation from collapsing evidence, readiness, workflow state, and workflow audit into the same storage or retrieval surfaces. | [platform/schemas/workflows/ownership-boundaries.md](platform/schemas/workflows/ownership-boundaries.md) explicitly separates five domains and lists current Phase 2 surfaces that must never silently become workflow objects later; [platform/schemas/workflows/workflow-owned-state-prerequisites.md](platform/schemas/workflows/workflow-owned-state-prerequisites.md) says workflow-owned state must remain separate from evidence, snapshots, and readiness metadata. | The blocker matters because once concrete storage and retrieval planning starts, this boundary must be translated into exact record ownership rules. If it is not, later implementation may reuse sync history, readiness blockers, or snapshot tables as workflow-state substitutes. | This blocker should stay open until workflow root storage, workflow blockers, and workflow audit records each have explicit concrete record boundaries. It does not stop the next source-identity planning slice from continuing. |
| `topology_truth_is_still_too_bounded_for_workflow_grade_pre_change_reasoning` | `later_phase_concern` | `truth` | The topology slice remains partial and inference-heavy, which is not strong enough for workflow-grade pre-change intelligence. | [platform/docs/workflow-planning-gate.md](platform/docs/workflow-planning-gate.md) classifies read-only truth maturity as mixed; [platform/schemas/workflows/phase2-evidence-surface-mapping.md](platform/schemas/workflows/phase2-evidence-surface-mapping.md) warns that inferred topology must not be overread as validation-grade truth; current topology schemas in [platform/app-api/src/app_api/schemas/topology.py](platform/app-api/src/app_api/schemas/topology.py) explicitly preserve `partial` and `unknown` semantics. | This matters for later validation or safe action planning, but it does not block the current source-identity or ownership planning slice directly. | This is a later-phase concern because build-order rules place workflow implementation after the read-only foundation and because the current planning cycle is still contract-first, not validation-engine planning. |
| `policy_truth_is_still_too_partial_for_workflow_grade_pre_change_reasoning` | `later_phase_concern` | `truth` | The policy slice remains bounded, sometimes aggregate-only, and live-empty in the current lab, so it is still too weak for workflow-grade change intelligence. | [platform/docs/workflow-planning-gate.md](platform/docs/workflow-planning-gate.md) marks policy maturity as mixed; [platform/schemas/workflows/phase2-evidence-surface-mapping.md](platform/schemas/workflows/phase2-evidence-surface-mapping.md) states that aggregate footprints and live-empty posture must not be treated as full per-policy truth; current policy schemas in [platform/app-api/src/app_api/schemas/policies.py](platform/app-api/src/app_api/schemas/policies.py) show bounded `detail_mode`, `empty_reason`, `target_footprints`, and derived `change_preview` support. | This matters for later validation, preview, and safe-action phases, but it does not prevent the current planning slice from finishing the remaining identity and ownership work. | This concern will become a blocking issue for later workflow implementation phases, especially validation and safe action, rather than for the current planning checkpoint. |
| `approval_execution_and_rollback_accountability_is_absent_by_design` | `later_phase_concern` | `audit_linkage` | Current history and audit surfaces intentionally do not contain approval, execution, rollback, or broad operator-accountability semantics. | [platform/schemas/workflows/audit-linkage-contract.md](platform/schemas/workflows/audit-linkage-contract.md) explicitly says current history cannot support approval, execution, or rollback chronology; [platform/schemas/workflows/history-audit-linkage-mapping.md](platform/schemas/workflows/history-audit-linkage-mapping.md) says current sync-derived history is not suitable for lifecycle, approval, execution, or rollback history. | This is a real later workflow concern, but it should not be mistaken for the immediate blocker to the current design slice. The current slice is still about evidence identity, workflow anchors, and workflow-grade relationship scaffolding. | This concern becomes active when the project reaches the later dry-run, approval, execution, or safe-action phases defined in [agent/sdn/16-implementation-order.md](agent/sdn/16-implementation-order.md) and [agent/sdn/35-build-order-enforcement-rules.md](agent/sdn/35-build-order-enforcement-rules.md). |

## Why The `Must Fix` Blockers Are Strictly Blocking

The `must_fix_before_planning_can_continue` blockers all sit on the critical
path exposed by the current planning slice.

1. The evidence-reference contract requires stable cited source identities.
2. The retrieval-sequencing design requires workflow-owned anchors first.
3. The audit-linkage contract requires workflow-scoped relationships and
   workflow-grade chronology.
4. The current history mapping proves that current identities and ordering are
   too weak to stand in for those missing workflow-owned structures.

If any one of those four stays unresolved, later planning either stalls or
starts cheating by reusing current `Phase 2` surfaces as fake workflow roots,
fake workflow chronology, or fake workflow audit chains.

## Dependency Notes

The blocker dependencies should be read in this order.

1. `workflow_owned_anchor_records_absent`
   This is the root dependency for concrete retrieval planning.
2. `source_record_identity_missing_for_current_read_models_and_comparisons`
   This is the root dependency for concrete evidence-reference planning.
3. `current_history_identity_and_ordering_too_weak_for_workflow_chronology`
   This is the root dependency for concrete workflow history and chronology planning.
4. `workflow_grade_audit_linkage_chain_absent`
   This depends on workflow-owned anchors and chronology, but it is still a
   separate blocker because audit relationships cannot be inferred away.
5. The remaining blockers depend on how narrowly or broadly later workflow
   phases choose to operate.

## Explicit Non-Goals

This document does not define:

- blocker remediation steps
- implementation sequencing beyond blocker dependencies
- new readiness metadata
- workflow endpoints
- phase transitions

## Conservative Bottom Line

The current planning slice produced real blockers, not just elegant contracts.

The exact strict blockers are:

- missing citation-grade source-record identity for many current evidence surfaces
- missing workflow-owned anchor records
- missing workflow-grade audit-linkage chains
- current history identities and ordering that are too weak for workflow chronology

Everything else in this document matters, but those are the blockers that now
most directly prevent workflow implementation planning from becoming concrete
without cheating the current `Phase 2` boundaries.