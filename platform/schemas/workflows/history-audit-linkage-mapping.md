# Current History Sources To Audit-Linkage Mapping

## Purpose

This document maps currently implemented history and audit-style records to
their future `audit_linkage` potential.

It exists to answer three bounded questions honestly.

- which current history sources could later support workflow-grade audit linkage
- which sources are only partial support because identity, chronology, or retention are too weak
- which current surfaces are useful only for explanation or are not suitable at all for direct workflow-grade reuse

After the narrower chronology clarification in
[platform/schemas/workflows/current-history-chronology-ordering-rules.md](platform/schemas/workflows/current-history-chronology-ordering-rules.md),
this document also makes one more bounded distinction explicit.

- which current reuse notes become narrower because chronology is now understood
	as source chronology, derived chronology, or presentation order only

## Phase Boundary

This is a design-only mapping.

It does not introduce:

- a workflow history engine
- an audit engine
- workflow implementation
- persistence changes
- phase changes

The platform remains in `Phase 2 — read-only product foundation`.

## Relationship To Chronology Clarification

This mapping should now be read together with
[platform/schemas/workflows/current-history-chronology-ordering-rules.md](platform/schemas/workflows/current-history-chronology-ordering-rules.md).

That chronology document narrowed four important interpretation rules that this
mapping now adopts directly.

1. persisted sync runs are reusable later only as bounded post hoc source
	chronology
2. persisted readiness snapshots are reusable later only as bounded
	material-change chronology
3. derived audit envelopes inherit chronology from stronger underlying sources
	and should usually be cited through those underlying anchors instead of
	through the projection envelope alone
4. workflow-history and audit-history response order is presentation order, not
	workflow-grade ordering

## Reuse Labels

Use the following labels strictly.

### `reusable_later_for_workflow_linkage`

The current source is already durable enough, explicit enough, and honest
enough that a future workflow-owned artifact could rely on it as supporting
audit-linkage context without changing its essential meaning.

### `partially_reusable`

The current source contains useful chronology or identity signals, but later
workflow-grade linkage still depends on explicit new workflow-owned identities,
ordering rules, or stronger retention and query semantics.

### `conceptually_helpful_only`

The current source is useful for wording, operator explanation, or response
presentation patterns, but it should not be treated as a durable workflow-grade
history source.

### `not_suitable`

The current source would overstate workflow-grade audit readiness if reused as
though it already represented workflow history, approval history, execution
history, or rollback history.

## History-To-Audit-Linkage Mapping

| Current history source | Current implemented basis | Likely future audit-linkage use | Reuse label | Why this classification is justified | Identity, chronology, and retention limits |
| --- | --- | --- | --- | --- | --- |
| `SyncRunTable` and `PersistedSyncRun` | Durable persisted read-side sync records with `id`, `model_family`, `source_type`, `source_endpoint`, `observed_at`, `started_at`, `finished_at`, and attached persisted artifact context in [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py) and [platform/app-api/src/app_api/persistence/history.py](platform/app-api/src/app_api/persistence/history.py) | Post hoc observation support for future workflow audit linkage, usually through `evidence_reference` and sometimes through future audit events that summarize post-change read-side observation | `reusable_later_for_workflow_linkage` | This is the strongest current history source because it is backend-owned, durable, and has stable identity plus multiple time anchors whose honest meaning is now narrowed: upstream observation time, sync-processing start, and sync-processing finish. | It is still read-side sync history only. The current retrieval order is newest first by `finished_at` within the latest `50` rows, which is bounded post hoc source chronology rather than workflow order. There is no workflow revision identity, no sequence scope, no predecessor chain, and no proof of request, approval, execution, or rollback chronology. |
| Persisted inventory, topology, and policy snapshot summaries attached to sync runs | Snapshot summary objects in [platform/app-api/src/app_api/models/workflow.py](platform/app-api/src/app_api/models/workflow.py) and [platform/app-api/src/app_api/models/audit.py](platform/app-api/src/app_api/models/audit.py) backed by persisted snapshot tables in [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py) | Supporting evidence for future workflow-linked audit events that need to show what was observed after or around a workflow stage | `partially_reusable` | They carry useful persisted timestamps and bounded state summaries, and their chronology can now be described more precisely as inherited from the underlying persisted snapshot and sync-run anchors rather than from response position. | In current history surfaces they appear as embedded summaries, not as standalone workflow-linked audit records. They stay bounded read-side evidence rather than workflow lifecycle records, and later reuse should still prefer the underlying snapshot or sync-run source anchor over the attachment object itself. |
| Persisted inventory, topology, and policy comparison summaries attached to sync runs | Immediate previous-snapshot comparisons derived in [platform/app-api/src/app_api/persistence/history.py](platform/app-api/src/app_api/persistence/history.py) and exposed via [platform/app-api/src/app_api/models/workflow.py](platform/app-api/src/app_api/models/workflow.py) and [platform/app-api/src/app_api/models/audit.py](platform/app-api/src/app_api/models/audit.py) | Explanatory comparison evidence attached to later workflow-linked audit records | `partially_reusable` | The comparison objects contain honest bounded chronology and delta notes that can later explain how persisted read-side state changed over time, and chronology clarification now makes that narrower: they only carry `current_persisted_at` to `previous_persisted_at` style before-and-after anchors. | They are derived aggregates with no standalone durable comparison IDs, and they only compare the current persisted snapshot to the immediately previous one. They are not workflow-grade diff chronology, revision ordering, or long-horizon retention. |
| `ReadinessSnapshotTable` and `PersistedReadinessSnapshotHistoryRecord` | Durable persisted readiness-support snapshots with `id`, `persisted_at`, summary, and blocker rollups in [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py) and [platform/app-api/src/app_api/persistence/history.py](platform/app-api/src/app_api/persistence/history.py) | Constraint or planning-support evidence for future workflow-linked blocker or readiness-related audit context | `partially_reusable` | The snapshots are durable and have stable identities plus one explicit chronology anchor, and chronology clarification now makes that narrower: this is material-change readiness chronology only. | They are recorded only when readiness content changes materially, the history loader exposes only the latest `20` rows, and the records are global planning-support state rather than per-workflow or per-revision chronology. They cannot describe a continuous readiness timeline, approval chronology, or validation chronology. |
| `AuditEventRecord` for `read_side_sync_recorded` events | Derived audit-style event envelope in [platform/app-api/src/app_api/models/audit.py](platform/app-api/src/app_api/models/audit.py) assembled in [platform/app-api/src/app_api/services/audit_history.py](platform/app-api/src/app_api/services/audit_history.py) | Baseline event wording, scope, result, and derived post hoc chronology patterns for future workflow-aware audit events | `partially_reusable` | The envelope already carries `event_id`, `event_type`, `source`, `actor`, `target_scope`, `result`, `correlation_id`, and `occurred_at`, which are useful future audit-event patterns. After chronology clarification, its reuse is narrower and more precise: `occurred_at` is only a projection of the underlying sync-run `finished_at`. | The event identity is projection-based, not a dedicated persisted audit-event family. `event_id` is currently synthesized from `sync_run_id`, `actor` is always `platform_system`, `source` is always `app-api`, and chronology should usually be cited through the underlying sync-run anchor instead of through the projection envelope alone. That remains too weak for workflow-grade lifecycle linkage by itself. |
| `AuditEventRecord` for `readiness_snapshot_recorded` events | Derived audit-style readiness event envelope in [platform/app-api/src/app_api/services/audit_history.py](platform/app-api/src/app_api/services/audit_history.py) backed by readiness snapshot history in [platform/app-api/src/app_api/persistence/history.py](platform/app-api/src/app_api/persistence/history.py) | Supporting audit context for future blocker or readiness-related workflow artifacts | `partially_reusable` | This surface honestly records that the platform observed a readiness-support state change and gives it an event identity and timestamp. After chronology clarification, its reuse is also narrower and more precise: `occurred_at` is only a projection of the underlying readiness `persisted_at`. | The stronger durable source is still the underlying readiness snapshot. The current event is derived at response time, global rather than workflow-scoped, and cannot be reused as approval, execution, or validation chronology. Later design should usually prefer the readiness snapshot anchor rather than the projection envelope by itself. |
| `WorkflowHistoryRecord` and `WorkflowHistoryItem` | Bounded workflow-style sync history response in [platform/app-api/src/app_api/models/workflow.py](platform/app-api/src/app_api/models/workflow.py), [platform/app-api/src/app_api/schemas/workflow_history.py](platform/app-api/src/app_api/schemas/workflow_history.py), and [platform/app-api/src/app_api/services/workflow_history.py](platform/app-api/src/app_api/services/workflow_history.py) | Operator-facing explanation of persisted read-side activity and a vocabulary reminder that chronology exists | `conceptually_helpful_only` | The shape is useful for explaining recent platform-side activity and for showing snapshot context beside it. After chronology clarification, it is clearer that any honest chronology in this surface is inherited from the underlying sync-run source and not from the workflow-shaped envelope. | It overloads `workflow_id` with `sync_run_id`, has no workflow revision semantics, no sequence scope, no predecessor or supersession semantics, and no durable workflow entity behind it. Response item order inherits sync-run load order and is not an independent workflow chronology contract. Reusing it directly would overread sync history as workflow history. |
| `AuditHistoryItem` and `AuditHistoryResponse` combined feed | Reverse-chronological combined response over sync-derived and readiness-derived events in [platform/app-api/src/app_api/schemas/audit_history.py](platform/app-api/src/app_api/schemas/audit_history.py) and [platform/app-api/src/app_api/services/audit_history.py](platform/app-api/src/app_api/services/audit_history.py) | Operator-facing cross-source view of recent platform-recorded events | `conceptually_helpful_only` | The feed is useful for operators because it merges current bounded audit-style sources into one view and keeps the current read-only product honest. After chronology clarification, it is now clearer that this merged order is a feed presentation rule only. | The current sort order is a presentation sort over `occurred_at` only. It has no `sequence_scope`, no workflow or revision ordering, no stable chain semantics for equal timestamps or unrelated sources, no retention contract beyond recent windows, and no explicit linkage chains. |
| `audit-event.schema.json` baseline | Generic audit event schema in [platform/schemas/audit/audit-event.schema.json](platform/schemas/audit/audit-event.schema.json) | Minimal event-envelope vocabulary for later workflow-aware audit events | `conceptually_helpful_only` | The baseline fields remain useful: `event_id`, `event_type`, `source`, `actor`, `target_scope`, `result`, and `occurred_at`. | It has no linkage identity, no ordering semantics, no workflow scope fields, no evidence-reference relation, and no retention expectations. It is too small to represent workflow-grade audit linkage directly. |
| `build_workflow_history_response` and `build_audit_history_response` mapping logic | Response assembly helpers in [platform/app-api/src/app_api/services/workflow_history.py](platform/app-api/src/app_api/services/workflow_history.py) and [platform/app-api/src/app_api/services/audit_history.py](platform/app-api/src/app_api/services/audit_history.py) | Wording, bounded-message, and evidence-attachment patterns only | `conceptually_helpful_only` | The mappers show good honesty patterns about what was recorded versus what is only supporting context. | They are response builders, not durable record families. They should not be mistaken for a workflow audit service, audit engine, or linkage store. |
| Treating current sync-derived history as workflow lifecycle, approval, execution, or rollback history | Current sync and readiness surfaces summarized in [platform/docs/workflows.md](platform/docs/workflows.md), [platform/schemas/workflows/audit-linkage-contract.md](platform/schemas/workflows/audit-linkage-contract.md), and [platform/schemas/workflows/audit-relationships.md](platform/schemas/workflows/audit-relationships.md) | None | `not_suitable` | This would violate the current phase boundary and overstate what the current sources mean. | Current history lacks workflow-owned identities, revision chronology, actor diversity, linkage ordering, approval semantics, execution checkpoints, rollback lineage, and a complete accountability trail. |

## Strict Classification Matrix

| Current source family | Reusable later for workflow linkage | Partially reusable | Conceptually helpful only | Not suitable |
| --- | --- | --- | --- | --- |
| Durable sync-run records | `SyncRunTable`, `PersistedSyncRun` | Snapshot summaries and immediate previous-snapshot comparisons attached to sync runs | None | Treating sync-run chronology as workflow lifecycle chronology |
| Readiness history | None | `ReadinessSnapshotTable`, `PersistedReadinessSnapshotHistoryRecord`, derived `readiness_snapshot_recorded` events | None | Treating readiness snapshot chronology as approval, validation, or execution history |
| Derived workflow-style and audit-style responses | None | `AuditEventRecord` envelopes as partial event-envelope analogues | `WorkflowHistoryRecord`, `WorkflowHistoryItem`, `AuditHistoryResponse`, mapping helpers | Treating response projections as durable workflow-linked audit records |
| Generic audit schema baseline | None | None | `audit-event.schema.json` vocabulary baseline | Treating the minimal schema as complete workflow-grade audit linkage support |

## Reusability Deltas After Chronology Clarification

The narrower chronology clarification did not promote any weak surface into a
workflow-grade history source.

It changed the interpretation in a narrower and more conservative direction.

1. Durable sync-run records are still the strongest current history source, but
	they are now more explicitly limited to bounded post hoc source chronology,
	with current retrieval order understood as newest first by `finished_at`
	inside a recent window rather than as broader workflow order.
2. Readiness snapshots are still partially reusable, but their chronology is
	now more explicitly limited to material-change checkpoints rather than a
	continuous readiness timeline.
3. Derived audit envelopes remain partially reusable only as field-shape and
	derived chronology analogues, but it is now clearer that later citation
	should usually prefer the underlying sync-run or readiness source anchor.
4. Workflow-history and audit-history projections remain conceptually helpful
	only, and it is now clearer that their order is presentation order rather
	than durable workflow or audit-linkage ordering.
5. Embedded snapshot and comparison attachments remain useful supporting
	context, but their chronology is now more explicitly inherited from stronger
	underlying persisted snapshot or sync-run anchors instead of from attachment
	position inside a response.

## Identity Limits

Current history sources have real identity only in some layers.

1. `SyncRunTable.id` and `ReadinessSnapshotTable.id` are stable durable source identities.
2. Current `AuditEventRecord.event_id` values are synthesized response identities such as `sync-run:<id>` and `readiness-snapshot:<id>`, not a dedicated persisted audit-event family.
3. Current `WorkflowHistoryRecord.workflow_id` values are semantically overloaded because they actually identify sync runs, not workflow instances.
4. Embedded snapshot summaries and comparison summaries inside history responses do not currently expose standalone source-record IDs suitable for direct workflow-grade linkage chains.

## Chronology Limits

Current chronology is useful but materially weaker than future workflow-grade
audit chronology.

1. Sync-run history has `observed_at`, `started_at`, and `finished_at`, which is enough for bounded post hoc read-side chronology but not for requested, approved, executing, or rollback stages.
2. The current sync-run retrieval order is newest first by `finished_at` within the latest `50` rows; that is a bounded source-history window, not a workflow sequence.
3. Current audit-style sync events use `finished_at` as projected `occurred_at`, which is honest for recorded sync completion but not a general workflow chronology model.
4. Readiness snapshot history uses `persisted_at` as its effective event time, records only material changes, and exposes only the latest `20` rows, so it cannot describe a continuous readiness timeline.
5. Current readiness audit-style events reuse that same bounded `persisted_at` anchor through a derived projection envelope rather than through a dedicated persisted audit-event family.
6. Current responses have no `sequence_scope`, no `sequence_number`, no predecessor link, and no supersession chain.
7. Current chronology is source chronology plus derived chronology plus cross-source presentation chronology, not workflow-owned lifecycle chronology.

## Retention And Window Limits

Current history exposure is explicitly bounded.

1. `load_sync_runs` returns only the most recent `50` persisted sync runs.
2. `load_readiness_snapshot_history` returns only the most recent `20` readiness snapshots.
3. Current history endpoints expose only recent windows and have no broader durable query model, no pagination contract, and no workflow-linked retrieval semantics.
4. No documented audit-retention policy, archival model, or workflow-grade retention guarantee exists yet.

## Remaining Weak Chronology Areas

Even after chronology narrowing, several chronology weaknesses remain explicit.

1. No workflow-owned chronology root exists for workflow requests, revisions,
	approvals, executions, or rollbacks.
2. No explicit shared batch or chain identity joins related inventory,
	topology, and policy sync events into one durable ordered group.
3. No stable semantic tie-break rule exists when unrelated projected events
	share the same timestamp in the combined audit-history feed.
4. No `event_recorded_at` field or linkage-recorded timestamp exists for the
	current derived audit envelopes.
5. No readiness chronology expresses unchanged intervals between material-change
	snapshots.
6. No embedded summary or comparison attachment currently exposes all of the
	stronger underlying source IDs needed for direct workflow-grade chronology
	chains.
7. No broad historical query or retention model exists beyond the current
	bounded recent windows.

## Limitations And Blockers

The main blockers preventing direct workflow-grade reuse are structural, not just
missing labels.

1. No workflow-owned identities exist for requested workflows, revisions, approvals, executions, or rollbacks.
2. No dedicated persisted audit-event family exists beyond the current response-level projections over sync runs and readiness snapshots.
3. No `audit_linkage` records or retrieval chains exist yet.
4. No explicit source-record IDs exist for many embedded history sub-records such as comparison summaries.
5. Current actors and sources are intentionally narrow: `platform_system` and `app-api` only.
6. Current chronology is event-feed chronology, not workflow-scoped ordering.

## Reuse Notes

1. The safest current reuse path is to treat durable sync-run records and readiness snapshots as later `evidence_reference` sources that help explain future audit linkages.
2. Sync-run chronology should usually be cited through `sync_run_id` plus `observed_at`, `started_at`, and `finished_at`, not through workflow-history projection identity or feed position.
3. Readiness chronology should usually be cited through readiness snapshot identity plus `persisted_at`, with explicit notes that it is material-change readiness-support history only.
4. Derived audit-event envelopes are useful as message, scope, result, and field-shape analogues, but the durable underlying source should usually be preferred when both exist.
5. Workflow-history and audit-history projections may help operators navigate recent activity, but they should not be reused as durable linkage roots or ordering chains.
6. Embedded snapshot and comparison context is useful for future audit-event enrichment, but it should not be promoted into standalone workflow-grade lineage without explicit new source identities.

## Risk Notes

1. Reusing current `WorkflowHistoryRecord` objects as if they were workflow instances would create false lifecycle history immediately.
2. Reusing reverse-chronological audit feed order as if it were workflow ordering would lose revision scope and supersession semantics.
3. Reusing readiness-snapshot history as if it represented validation or approval history would inflate planning-support metadata into workflow-state meaning.
4. Reusing derived audit envelopes instead of underlying durable sources would hide the difference between persisted evidence and response-time projection.
5. Reusing sync-run `finished_at` order across unrelated source families as if it proved one shared workflow chain would invent causal chronology that the current repository does not record.

## Conservative Bottom Line

Current history is useful for future workflow-grade audit linkage only in a
strictly bounded way.

- durable sync-run records remain the strongest current history source for later post hoc workflow-linked observation context
- readiness snapshots remain bounded supporting context, now more explicitly limited to material-change chronology rather than continuous readiness history
- derived audit-style events remain weaker projection envelopes whose chronology should usually be cited through the underlying sync-run or readiness source anchors
- workflow-history and audit-history responses remain mainly projections and operator views, with presentation ordering rather than workflow-grade ordering semantics
- current sync-derived and readiness-derived history is still too weak to serve directly as workflow creation, approval, execution, rollback, or full audit-linkage chronology