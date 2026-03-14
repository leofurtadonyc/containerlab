# Current-History Chronology And Ordering Rules For Honest Reuse

## Purpose

This document narrows the chronology and ordering rules for current history only
where those rules remain honestly reusable later.

It exists to answer four bounded questions.

- which current history surfaces have real chronology anchors today
- which ordering rules are durable enough to reuse later as supporting context
- which current chronology signals are only projection or presentation rules
- which chronology gaps must remain explicitly unresolved until later
  workflow-owned design exists

It is a design-only clarification artifact.

It does not introduce:

- workflow chronology implementation
- workflow-owned linkage records
- workflow-owned persistence
- phase changes
- fake chronology closure
- persistence redesign

## Phase Boundary

The platform remains in `Phase 2 — read-only product foundation`.

So this document must narrow only the chronology that current persisted read-side
evidence already supports.

It must not be read as proof that the repository already has:

- workflow instance chronology
- workflow revision chronology
- approval chronology
- execution chronology
- rollback chronology
- workflow-grade ordering chains

## Relationship To Existing Planning Docs

This document narrows the current blocker described in:

- [platform/schemas/workflows/bounded-next-step-plan.md](platform/schemas/workflows/bounded-next-step-plan.md)
- [platform/schemas/workflows/source-record-identity-rules.md](platform/schemas/workflows/source-record-identity-rules.md)
- [platform/schemas/workflows/source-record-identity-needs-mapping.md](platform/schemas/workflows/source-record-identity-needs-mapping.md)
- [platform/schemas/workflows/history-audit-linkage-mapping.md](platform/schemas/workflows/history-audit-linkage-mapping.md)
- [platform/schemas/workflows/audit-linkage-contract.md](platform/schemas/workflows/audit-linkage-contract.md)
- [platform/schemas/workflows/read-only-retrieval-sequencing.md](platform/schemas/workflows/read-only-retrieval-sequencing.md)

It applies those earlier identity and ownership rules specifically to current
history chronology and ordering.

## Core Rule

Current history may be reused later only as bounded post hoc chronology for
platform-recorded read-side evidence.

Current history must not be reused later as if it already represented:

- workflow request order
- workflow revision order
- approval order
- validation order
- execution order
- rollback order
- workflow-owned predecessor or supersession chains

## Chronology Reuse Labels

Use the following labels strictly.

### `reusable_as_post_hoc_source_chronology`

The current surface has a real persisted or directly derived time anchor that a
later workflow-owned artifact may cite as supporting evidence of when the
platform observed or recorded read-side state.

### `reusable_only_via_underlying_source_anchor`

The current surface carries chronology, but later reuse should cite the
underlying persisted source record rather than the projection envelope.

### `presentation_order_only`

The current surface has a useful display order for operators, but that order is
not strong enough to reuse later as a durable chronology contract.

### `not_reusable_as_workflow_chronology`

The current surface or field would overstate current truth if later design
treated it as workflow-owned chronology or lifecycle ordering.

## Current Source Families And Their Honest Chronology

### Sync runs

Current persisted sync-run history is the strongest current chronology source.

It is grounded in:

- `SyncRunTable.id`
- `observed_at`
- `started_at`
- `finished_at`

from [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py)
and [platform/app-api/src/app_api/persistence/history.py](platform/app-api/src/app_api/persistence/history.py).

#### Honest meaning of each time anchor

| Field | Current honest meaning | What it must not be read as |
| --- | --- | --- |
| `observed_at` | When the upstream read-side source was observed, when that value is available | workflow request time, approval time, or execution time |
| `started_at` | When platform-side sync processing started for this read-side collection cycle | workflow planning start or workflow execution start |
| `finished_at` | When platform-side sync processing finished and the bounded sync result became recordable | workflow completion, workflow success, or workflow state transition time |

#### Current ordering rule for sync runs

`load_sync_runs` orders rows by `SyncRunTable.finished_at.desc()` and limits the
window to the latest `50` rows.

That means the current durable ordering rule is narrow.

- primary current ordering anchor: `finished_at`
- current surface meaning: most recent recorded sync completion first
- current retention posture: recent bounded window only

This ordering is honestly reusable later only as post hoc read-side completion
chronology.

It is not proof of:

- cross-family causal order
- one shared sync batch identity
- workflow-stage order
- revision lineage

### Readiness snapshots

Current readiness chronology is grounded only in persisted readiness-support
snapshots.

It is grounded in:

- `ReadinessSnapshotTable.id`
- `persisted_at`

from [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py)
and [platform/app-api/src/app_api/persistence/history.py](platform/app-api/src/app_api/persistence/history.py).

#### Current readiness chronology rule

`load_readiness_snapshot_history` orders readiness snapshots by
`ReadinessSnapshotTable.persisted_at.desc()` and limits the window to the latest
`20` rows.

That means the current readiness history has one honest chronology anchor only:

- primary chronology anchor: `persisted_at`
- current surface meaning: when the platform persisted a materially changed
  readiness-support snapshot

This does not describe a continuous readiness timeline.

It must not be read as:

- validation chronology
- approval chronology
- execution chronology
- proof that readiness was unchanged between recorded snapshots

The current implementation itself says that a readiness history record exists
only when the persisted readiness content changed materially.

### Derived audit envelopes

Current audit-style events are response-time projections over stronger sync-run
or readiness sources.

They are assembled in
[platform/app-api/src/app_api/services/audit_history.py](platform/app-api/src/app_api/services/audit_history.py)
using the following rules.

| Derived event family | Underlying source | Current `occurred_at` rule | Honest reuse label |
| --- | --- | --- | --- |
| `read_side_sync_recorded` | persisted sync run | `occurred_at = sync_run.finished_at` | `reusable_only_via_underlying_source_anchor` |
| `readiness_snapshot_recorded` | persisted readiness snapshot | `occurred_at = snapshot.persisted_at` | `reusable_only_via_underlying_source_anchor` |

The audit envelope chronology is reusable later only as a derived reflection of
the stronger underlying source chronology.

So later design should prefer citing:

- `sync_run_id` plus sync-run timestamps
- `snapshot_id` plus readiness `persisted_at`

rather than treating current `event_id` values as a durable audit-event family.

### Workflow-history projections

Current workflow-history responses are operator-facing projections over persisted
sync runs.

They are assembled in
[platform/app-api/src/app_api/services/workflow_history.py](platform/app-api/src/app_api/services/workflow_history.py)
by mapping:

- `workflow_id = sync_run.sync_run_id`
- `started_at = sync_run.started_at`
- `finished_at = sync_run.finished_at`
- `observed_at = sync_run.observed_at`

This means the chronology inside the current workflow-history projection is not
independent workflow chronology.

It is only sync-run chronology presented through a workflow-shaped response.

The reusable chronology therefore remains the underlying sync-run chronology,
not the projection identity or the workflow-shaped envelope.

### Audit-history feed projections

Current audit-history responses combine sync-derived and readiness-derived event
projections into one reverse-chronological feed.

The feed ordering rule is implemented as:

- merge sync-derived projected records and readiness-derived projected records
- sort by `record.occurred_at`
- reverse order for newest-first display

That is an honest operator feed rule, but it is still only feed presentation
chronology.

It is not a workflow-owned ordered chain.

The feed order is therefore reusable later only as a display pattern for recent
cross-source activity, not as workflow sequence meaning.

## Reusable Versus Non-Reusable Chronology Rules

### Reusable chronology rules

The following chronology rules are honest to reuse later as supporting context.

1. A persisted sync run may later support post hoc evidence about when a
   read-side collection cycle was observed, started, and finished.
2. A persisted readiness snapshot may later support post hoc evidence about
   when the platform recorded a materially changed readiness-support state.
3. An embedded persisted snapshot summary may later inherit chronology only from
   the underlying snapshot `persisted_at` and related sync-run times, not from
   its response position.
4. An embedded comparison attachment may later reuse only the explicit
   `current_persisted_at` and `previous_persisted_at` anchors that its stronger
   underlying persisted snapshots already provide.
5. A current audit-style event may later restate chronology only as a derived
   projection of the stronger underlying sync-run or readiness source.

### Non-reusable chronology rules

The following current chronology or ordering behaviors must not be reused later
as workflow-grade meaning.

1. `WorkflowHistoryRecord.workflow_id` must not be reused as workflow-instance
   chronology or workflow lineage.
2. Current `AuditEventRecord.event_id` values must not be reused as if they were
   a durable workflow-aware audit-event family.
3. Reverse-chronological audit feed order must not be reused as a workflow
   sequence, approval chain, execution chain, or rollback chain.
4. Gaps between readiness snapshots must not be reused as proof of continuous
   readiness stability.
5. Immediate previous-snapshot comparisons must not be reused as long-horizon or
   revision-aware chronology.
6. Cross-family proximity in timestamp must not be reused as proof that
   inventory, topology, policy, and readiness events belonged to one shared
   workflow or one atomic transition.

## Surface-By-Surface Chronology Posture

| Current surface | Current chronology anchors | Current ordering rule | Honest reuse posture | What remains too weak |
| --- | --- | --- | --- | --- |
| Persisted sync runs | `observed_at`, `started_at`, `finished_at` | newest first by `finished_at` within latest `50` rows | `reusable_as_post_hoc_source_chronology` | no workflow scope, no sequence scope, no predecessor chain |
| Persisted readiness snapshots | `persisted_at` | newest first by `persisted_at` within latest `20` rows | `reusable_as_post_hoc_source_chronology` | only material-change checkpoints, no continuous timeline |
| Derived sync audit envelopes | inherited from `finished_at` | participate in feed sort by projected `occurred_at` | `reusable_only_via_underlying_source_anchor` | projected `event_id`, no durable audit-event lineage |
| Derived readiness audit envelopes | inherited from `persisted_at` | participate in feed sort by projected `occurred_at` | `reusable_only_via_underlying_source_anchor` | projected `event_id`, no workflow-scoped chronology |
| Workflow-history response items | inherited sync-run `observed_at`, `started_at`, `finished_at` | inherited from sync-run load order | `presentation_order_only` for envelope order; underlying source chronology remains reusable | overloaded `workflow_id`, no workflow lifecycle meaning |
| Audit-history combined feed | projected `occurred_at` only | reverse chronological presentation across merged sources | `presentation_order_only` | no `sequence_scope`, no stable chain semantics across equal timestamps or unrelated sources |

## Ordering Rules That Remain Honest Today

Only the following ordering claims are currently honest.

1. Within the current sync-run history window, later `finished_at` sorts ahead of
   earlier `finished_at`.
2. Within the current readiness history window, later `persisted_at` sorts ahead
   of earlier `persisted_at`.
3. Within the current audit-history feed, later projected `occurred_at` sorts
   ahead of earlier projected `occurred_at` across the merged recent window.
4. Within persisted comparison attachments, `current_persisted_at` is later than
   `previous_persisted_at` by construction.

Everything beyond those bounded claims remains unresolved.

In particular, the repository does not yet define:

- a `sequence_scope`
- a `sequence_number`
- a predecessor relation
- a supersession relation
- a workflow revision chronology
- an approval, validation, execution, or rollback chain

## Explicit Current-Versus-Future Boundary Rules

The current boundary between reusable chronology and future workflow chronology
must stay explicit.

1. Sync-derived history is current read-side evidence, not workflow history.
2. Readiness snapshot chronology is planning-support chronology, not workflow
   blocker chronology.
3. Audit-history projections are bounded audit-style views, not workflow-grade
   audit linkage.
4. Workflow-history projections are bounded sync-history views, not workflow
   lifecycle records.
5. Future workflow-owned chronology, when it exists later, must anchor on
   workflow-owned identities first and may only cite current history as
   supporting evidence.

## Still-Unresolved Chronology Weaknesses

The following chronology areas remain intentionally unresolved after this
clarification.

1. There is no workflow-owned chronology root for requested workflows,
   revisions, approvals, executions, or rollbacks.
2. There is no explicit shared batch or chain identity connecting related
   inventory, topology, and policy sync runs into one durable ordered group.
3. There is no stable tie-break rule with semantic meaning when unrelated
   history records share the same timestamp.
4. There is no separate `event_recorded_at` or linkage-recorded timestamp for
   current projected audit envelopes.
5. There is no historical query model beyond recent windows, so chronology is
   bounded by current retention and retrieval limits.
6. Embedded history-support summaries and comparisons still hide some of the
   stronger underlying source IDs in current response contracts.
7. Current chronology still cannot express workflow-stage transitions or
   operator accountability.

## Explicit Non-Goals

This clarification does not define:

- workflow state machines
- audit-linkage implementation
- workflow-owned record schemas
- persistence migrations
- retention redesign
- pagination redesign
- approval or rollback semantics

## Conservative Bottom Line

Current history has enough chronology to support later post hoc citation of
read-side evidence.

It does not have enough chronology to support workflow-owned lifecycle meaning.

So the honest reuse rule is narrow.

- reuse persisted sync-run and readiness timestamps as supporting evidence only
- prefer underlying persisted source anchors over projection envelopes
- treat workflow-history and audit-history ordering as operator-facing
  presentation unless a stronger underlying source anchor is cited
- leave workflow-grade chronology explicitly unresolved until workflow-owned
  identities and ordering semantics exist