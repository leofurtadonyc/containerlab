# Source-Record Identity Needs Mapping For Comparison, Readiness, Capability, And Embedded History-Support Surfaces

## Purpose

This document maps the current comparison, readiness, capability, and embedded
history-support surfaces to their current source-record identity posture.

It exists to answer three bounded questions.

- which of these current surfaces are already backed by strong source records
- which surfaces still depend on partial, overloaded, or response-level
  identity
- where future evidence citation would still need stronger source-record
  identity before it can remain honest

It is a design-only mapping artifact.

It does not introduce:

- implementation changes
- workflow behavior
- persistence redesign
- phase changes

## Phase Boundary

The platform remains in `Phase 2 - read-only product foundation`.

So this document must be read only as identity-mapping support for the current
workflow-planning sequence.

It must not be read as proof that these identities already exist explicitly in
the backend API contracts.

## Relationship To Existing Identity Rules

This document applies the identity categories from
[platform/schemas/workflows/source-record-identity-rules.md](platform/schemas/workflows/source-record-identity-rules.md)
to the narrower surface families called out by the current status.

It focuses specifically on:

- comparison surfaces
- readiness surfaces
- capability surfaces
- embedded history-support surfaces

## Classification Labels

Use the following labels strictly.

### `already_backed_by_strong_source_records`

The surface already rests on durable or explicit platform-owned record identity
with clear chronology, even if the surface itself is not a workflow artifact.

### `partially_backed_by_strong_source_records`

The surface is assembled or derived, but it points back to stronger underlying
persisted records whose identity and chronology are already solid.

### `still_identity_weak`

The surface has some useful natural keys, timestamps, or bounded semantics, but
it still lacks explicit citation-grade source-record identity in the current
contract.

### `not_suitable_for_future_citation_without_redesign`

The surface would overstate current truth or overload current identity if a
future workflow-owned artifact cited it directly without first redesigning the
identity boundary.

## Strongest Current Anchors In Scope

Within the surface families covered here, the strongest current source-record
anchors are:

- `SyncRunTable.id` and `PersistedSyncRun.sync_run_id` in
  [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py)
  and [platform/app-api/src/app_api/persistence/history.py](platform/app-api/src/app_api/persistence/history.py)
- `ReadinessSnapshotTable.id` and `PersistedReadinessSnapshotHistoryRecord.snapshot_id`
  in [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py)
  and [platform/app-api/src/app_api/persistence/history.py](platform/app-api/src/app_api/persistence/history.py)
- persisted snapshot IDs and child record keys that comparison and history
  attachments already depend on in
  [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py)

Those are stronger than response-level rollups, synthesized audit envelope IDs,
or overloaded workflow-history projection IDs.

## Comparison Surface Mapping

| Current surface | Current implemented basis | Classification | Why this classification is justified | Identity ambiguity that still exists |
| --- | --- | --- | --- | --- |
| `PersistedInventorySnapshotComparison`, `PersistedTopologySnapshotComparison`, and `PersistedPolicySnapshotComparison` in [platform/app-api/src/app_api/persistence/history.py](platform/app-api/src/app_api/persistence/history.py) | Derived from explicit current and previous persisted snapshots with explicit timestamps and counts | `partially_backed_by_strong_source_records` | These comparison objects already depend on strong persisted snapshot anchors and explicit chronology. | They still have no standalone comparison record ID; they are rebuilt helper objects rather than durable entities. |
| `InventoryComparisonSummary` in [platform/app-api/src/app_api/schemas/devices.py](platform/app-api/src/app_api/schemas/devices.py) | Current-versus-latest-persisted inventory summary with explicit `comparison_snapshot_id` and persisted chronology hints | `partially_backed_by_strong_source_records` | The current API now exposes the persisted comparison anchor needed for bounded citation posture. | The response is still an assembled comparison summary rather than a durable comparison record with its own standalone identity. |
| `TopologyComparisonSummary` in [platform/app-api/src/app_api/schemas/topology.py](platform/app-api/src/app_api/schemas/topology.py) | Current-versus-latest-persisted topology summary with explicit `comparison_snapshot_id`, counts, and persisted chronology hints | `partially_backed_by_strong_source_records` | The summary now exposes the stronger persisted anchor needed for bounded read-only use. | It still has no standalone comparison record ID; later citation should prefer the exposed anchor rather than treat the summary itself as durable. |
| `PolicyCurrentComparisonResponse` in [platform/app-api/src/app_api/schemas/policies.py](platform/app-api/src/app_api/schemas/policies.py) | Current-versus-latest-persisted policy summary with explicit `comparison_snapshot_id`, observed and persisted timestamps, and derived `change_preview` | `partially_backed_by_strong_source_records` | The response now exposes the persisted comparison anchor that earlier planning text treated as missing. | The response-level object is still assembled rather than a directly persisted comparison record. |
| `PolicyHistoryComparisonResponse` in [platform/app-api/src/app_api/schemas/policies.py](platform/app-api/src/app_api/schemas/policies.py) | Comparison between the latest two persisted policy snapshots with explicit current and previous persisted anchor IDs, timestamps, and derived `change_preview` | `partially_backed_by_strong_source_records` | The surface is historically grounded in stronger persisted snapshot records and now exposes the compared anchors directly. | It still has no standalone comparison record ID, and `change_preview` rows remain explanatory rather than durable diff records. |
| `PolicyComparisonChangePreviewResponse` in [platform/app-api/src/app_api/schemas/policies.py](platform/app-api/src/app_api/schemas/policies.py) | Small derived change rows attached to a parent policy comparison | `not_suitable_for_future_citation_without_redesign` | These rows are explanatory only and are not durable diff artifacts. | They have no own record ID, no parent comparison ID field, and no direct anchor set. |

## Readiness Surface Mapping

| Current surface | Current implemented basis | Classification | Why this classification is justified | Identity ambiguity that still exists |
| --- | --- | --- | --- | --- |
| `ReadinessSnapshotTable.id` in [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py) | Durable persisted readiness-support snapshot with `persisted_at`, summary, blockers, prerequisites, and assessment data stored in one record | `already_backed_by_strong_source_records` | This is a durable platform-owned readiness record with explicit identity and chronology. | The child blocker, prerequisite, and assessment entries inside the snapshot are stored as embedded JSON rather than separate item records. |
| `PersistedReadinessSnapshotHistoryRecord.snapshot_id` in [platform/app-api/src/app_api/persistence/history.py](platform/app-api/src/app_api/persistence/history.py) | Read-side recovery model over persisted readiness snapshots | `already_backed_by_strong_source_records` | The history recovery model preserves the underlying durable readiness snapshot identity. | It is still a history helper view, not a separate persisted readiness-event entity. |
| `CapabilitiesListResponse.readiness_snapshot_id` and `readiness_persisted_at` in [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py) | Response-level pointer to the latest persisted readiness-support snapshot through explicit anchor ID and chronology | `partially_backed_by_strong_source_records` | The response now exposes the durable readiness anchor directly for bounded read-only use. | This still does not give child readiness items their own standalone item IDs. |
| `DryRunReadinessSummary` in [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py) | Current assembled readiness envelope with blocker lists, prerequisite lists, counts, and notes | `still_identity_weak` | The summary has coherent structure and bounded planning semantics. | It remains a response-level assembled record with no explicit `source_record_id` or summary identity beyond response context. |
| `DryRunReadinessBlocker` in [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py) | Structured blocker item with enum-like `blocker` name, category, severity, and related scopes | `still_identity_weak` | The blocker name is a useful natural key and the item shape is stable enough for later identity design. | The current API does not define an explicit blocker record ID or a blocker key scoped to one readiness snapshot or current response version. |
| `DryRunReadinessPrerequisite` in [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py) | Structured prerequisite item with enum-like `prerequisite` name and support/evidence posture | `still_identity_weak` | The prerequisite name is also a useful natural key. | The current API does not define an explicit prerequisite record ID or a snapshot-scoped identity. |
| `DryRunReadinessAssessmentArea` in [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py) | Structured assessment-area item with bounded status and strongest gaps | `still_identity_weak` | The area name gives a stable conceptual key. | The current API still treats it as a child item inside an assembled response, not as an explicitly identified source record. |
| Readiness rollup counts such as `evidence_coverage_counts`, `support_posture_counts`, and `blocked_scope_counts` in [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py) | Aggregated counts attached to the current readiness summary | `not_suitable_for_future_citation_without_redesign` | They are useful operator summaries. | They are aggregate-only rollups with no item-level identity and no direct citation posture by themselves. |

## Capability Surface Mapping

| Current surface | Current implemented basis | Classification | Why this classification is justified | Identity ambiguity that still exists |
| --- | --- | --- | --- | --- |
| `CapabilityRecord` in [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py) | Structured capability item with vendor, platform, domain, feature, support status, evidence basis, workflow-readiness posture, and caveats | `still_identity_weak` | The record shape is detailed and stable enough that a future source identity can be defined cleanly. | The current contract exposes no explicit capability item ID; identity would have to be inferred from a tuple such as vendor plus platform plus domain plus feature plus version scope. |
| `CapabilityRecord.related_readiness_blockers` in [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py) | Cross-reference from capability items to blocker names | `still_identity_weak` | The field helps explain support posture and planning gaps. | It references blocker names, not blocker record IDs or snapshot-scoped readiness records. |
| `CapabilitiesListResponse.items` in [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py) | Current assembled list of capability items | `still_identity_weak` | The list is backend-owned and useful. | Response-level list position is not a valid source-record identity, and the contained items still lack explicit IDs. |
| Capability rollups such as `domain_counts`, `support_counts`, `delivery_tier_counts`, and `workflow_readiness_counts` in [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py) | Aggregate counts over capability items | `not_suitable_for_future_citation_without_redesign` | These rollups are useful summaries for operators and planning. | They are aggregate-only and cannot anchor future citation without collapsing item-level evidence into response-level counts. |

## Embedded History-Support Surface Mapping

| Current surface | Current implemented basis | Classification | Why this classification is justified | Identity ambiguity that still exists |
| --- | --- | --- | --- | --- |
| `PersistedSyncRun.sync_run_id` in [platform/app-api/src/app_api/persistence/history.py](platform/app-api/src/app_api/persistence/history.py) | Durable recovered sync-run record with `observed_at`, `started_at`, `finished_at`, and attached persisted artifact context | `already_backed_by_strong_source_records` | This is the strongest current history anchor inside the covered surface families. | It is strong only for read-side sync history, not for workflow-owned lifecycle meaning. |
| `WorkflowInventorySnapshotSummary`, `WorkflowTopologySnapshotSummary`, and `WorkflowPolicySnapshotSummary` in [platform/app-api/src/app_api/models/workflow.py](platform/app-api/src/app_api/models/workflow.py) | Embedded snapshot summaries attached to a workflow-history item and populated from `PersistedSyncRun` | `partially_backed_by_strong_source_records` | Each summary is backed by a stronger underlying persisted snapshot and sync-run context. | The embedded summary itself does not carry the underlying snapshot ID in the current model. |
| `AuditInventorySnapshotSummary`, `AuditTopologySnapshotSummary`, `AuditPolicySnapshotSummary`, and `AuditReadinessSnapshotSummary` in [platform/app-api/src/app_api/models/audit.py](platform/app-api/src/app_api/models/audit.py) | Embedded summary attachments inside audit-style event projections | `partially_backed_by_strong_source_records` | Each audit attachment is derived from stronger persisted snapshot or readiness sources. | The audit attachment objects do not carry explicit snapshot IDs; they remain projection-level context. |
| `WorkflowInventorySnapshotComparison`, `WorkflowTopologySnapshotComparison`, and `WorkflowPolicySnapshotComparison` in [platform/app-api/src/app_api/models/workflow.py](platform/app-api/src/app_api/models/workflow.py) | Embedded comparison attachments inside workflow-history items | `partially_backed_by_strong_source_records` | They already depend on stronger persisted comparison helpers from history recovery and now expose those anchors where the read model carries them. | They still have no own comparison ID; later citation should prefer the exposed persisted anchors rather than the projection attachment itself. |
| `AuditInventorySnapshotComparison`, `AuditTopologySnapshotComparison`, and `AuditPolicySnapshotComparison` in [platform/app-api/src/app_api/models/audit.py](platform/app-api/src/app_api/models/audit.py) | Embedded comparison attachments inside audit-style event projections | `partially_backed_by_strong_source_records` | They are similarly backed by stronger persisted comparison helpers and now surface those stronger anchors where present. | They remain explanatory projections rather than directly identified comparison records. |
| `AuditEventRecord.event_id` values synthesized as `sync-run:<id>` or `readiness-snapshot:<id>` in [platform/app-api/src/app_api/services/audit_history.py](platform/app-api/src/app_api/services/audit_history.py) | Projection-envelope IDs built at response time over stronger sync-run or readiness sources | `partially_backed_by_strong_source_records` | The prefix plus underlying ID makes the envelope provenance visible. | The event ID is still synthesized projection identity, not a durable audit-event family and not a child-source-record identity for embedded attachments. |
| `WorkflowHistoryRecord.workflow_id=sync_run.sync_run_id` in [platform/app-api/src/app_api/services/workflow_history.py](platform/app-api/src/app_api/services/workflow_history.py) | Overloaded projection identity that reuses `sync_run_id` under a workflow-shaped field name | `not_suitable_for_future_citation_without_redesign` | This field is useful for current read-only history display only. | Citing it directly would overread sync-run identity as workflow-owned identity immediately. |
| `AuditEventRecord.correlation_id` in [platform/app-api/src/app_api/models/audit.py](platform/app-api/src/app_api/models/audit.py) and [platform/app-api/src/app_api/services/audit_history.py](platform/app-api/src/app_api/services/audit_history.py) | Correlates the projection back to `sync_run_id` or readiness snapshot ID | `partially_backed_by_strong_source_records` | The field already carries the stronger underlying source key. | It is correlation context only, not a substitute for an explicit source-record field on the embedded summary or comparison object itself. |

## Identity Ambiguity Notes

### Where the source-record foundation is already strong

The strongest foundations are still the persisted sources beneath these surface
families, not the response-level or projection-level wrappers.

- persisted readiness snapshots
- persisted sync runs
- persisted inventory, topology, and policy snapshots that comparison and
  history-support surfaces already depend on

### Where the identity is only partial

The partial category appears where a surface is backed by strong underlying
records but does not expose that backing identity directly in the current
contract.

This is the main condition for:

- persisted comparison helpers
- embedded workflow-history snapshot and comparison attachments
- embedded audit-history snapshot and comparison attachments
- response-level readiness anchors that do not, by themselves, create separate child-item IDs
- synthesized audit-event envelopes that still correlate to stronger underlying
  records

### Where the identity is still weak

The identity-weak category now appears mainly where a current schema has useful
structure and natural keys but still depends on response-level assembly rather
than explicit standalone child-item identity.

This is the main condition for:

- capability items
- readiness blockers, prerequisites, and assessment areas
- current readiness summary envelopes

### Where redesign would be required before safe future citation

The redesign-needed category appears where the current surface would mislead a
future citation consumer about what the record actually is.

This is the main condition for:

- `change_preview` rows treated as if they were durable diff records
- aggregate rollup counts treated as if they were source records
- overloaded `WorkflowHistoryRecord.workflow_id` treated as if it were a
  workflow-owned identity

## Conservative Bottom Line

The current comparison, readiness, capability, and embedded history-support
surfaces are not equally mature from a source-record-identity perspective.

The strongest current anchors in scope are persisted readiness snapshots,
persisted sync runs, and the persisted snapshot families that comparison and
history-support attachments already depend on.

The weaker residual layer is now concentrated in capability items and
non-persisted readiness child items without explicit item IDs.

Current comparison summaries and embedded history-support projections now expose
strong enough persisted or correlation anchors for bounded `Phase 2` use, even
though they remain assembled or projection-level surfaces rather than durable
workflow-owned records.

So the current source-record identity need is no longer a vague general gap.
It is concentrated in one bounded area:

- readiness blockers, prerequisites, assessment areas, and capability items
  still need explicit item-level identity only if later work requires
  standalone child-item citation beyond the current response-level or
  snapshot-level anchors

That remaining need does not justify an immediate code change for the current
bounded product slice.

It matters only if a later consumer can no longer operate honestly with the
already exposed response-level and persisted anchors.