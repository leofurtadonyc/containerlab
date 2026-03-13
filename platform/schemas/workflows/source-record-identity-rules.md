# Source-Record Identity Rules For Current Evidence Surfaces

## Purpose

This document defines explicit source-record identity rules for the current
`Phase 2` evidence surfaces that future workflow-owned artifacts may later cite.

It exists to answer four bounded questions.

- what counts as a direct source record versus an assembled or derived surface
- which current surface types already have strong enough identity for later
  citation and which still do not
- what minimum identity and chronology anchors each surface category requires
- which current surfaces are citation-safe, citation-safe only with stricter
  scoping, explanatory only, or citation-unsafe until stronger identity exists

It is a design and schema-oriented artifact only.

It does not introduce:

- workflow behavior
- dry-run behavior
- workflow-owned persistence
- API behavior changes
- database migrations
- a phase change

## Phase Boundary

The platform remains in `Phase 2 - read-only product foundation`.

So this document must be read only as identity-clarification groundwork for
future `evidence_reference` use.

It must not be read as proof that current APIs already expose these identities
explicitly or that workflow-owned artifacts already exist.

## Core Rule

Future workflow-owned artifacts must cite platform-owned source records, not
response envelopes, not UI projections, and not raw vendor-native payloads.

That means every future citation must answer three identity questions
explicitly.

1. Which exact platform-owned record is being cited?
2. Which time anchor makes that record current or historical?
3. Is the cited thing a direct record, a derived comparison, an overlay, or an
   embedded explanatory attachment?

If one of those three answers is missing, the surface is not citation-safe as a
primary evidence anchor.

## Identity Terms

Use the following terms strictly.

### Direct source record

A platform-owned record whose primary meaning is the record itself rather than a
response envelope or derived explanation.

Examples in the current repository:

- persisted snapshots in
  [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py)
- persisted per-record rows such as inventory, topology, and policy records in
  [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py)
- durable sync-run records in
  [platform/app-api/src/app_api/persistence/history.py](platform/app-api/src/app_api/persistence/history.py)
- durable readiness snapshots in
  [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py)

### Persisted source record

A direct source record with durable storage, durable identity, and explicit
historical chronology.

### Assembled read model

A current backend-owned response or sub-record assembled at serve time from one
or more platform-owned sources.

Examples in the current repository:

- `DevicesListResponse.items` in
  [platform/app-api/src/app_api/schemas/devices.py](platform/app-api/src/app_api/schemas/devices.py)
- `TopologyResponse.topology.nodes` and `.links` in
  [platform/app-api/src/app_api/schemas/topology.py](platform/app-api/src/app_api/schemas/topology.py)
- `PoliciesListResponse.items` and `target_footprints` in
  [platform/app-api/src/app_api/schemas/policies.py](platform/app-api/src/app_api/schemas/policies.py)
- `CapabilitiesListResponse.items` in
  [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py)

### Derived comparison surface

A bounded comparison object derived from two or more source records.

Examples in the current repository:

- `comparison_to_latest_persisted` in
  [platform/app-api/src/app_api/schemas/devices.py](platform/app-api/src/app_api/schemas/devices.py),
  [platform/app-api/src/app_api/schemas/topology.py](platform/app-api/src/app_api/schemas/topology.py),
  and [platform/app-api/src/app_api/schemas/policies.py](platform/app-api/src/app_api/schemas/policies.py)
- `comparison_to_previous` and `change_preview` shapes in
  [platform/app-api/src/app_api/schemas/policies.py](platform/app-api/src/app_api/schemas/policies.py)
- persisted comparison helpers in
  [platform/app-api/src/app_api/persistence/history.py](platform/app-api/src/app_api/persistence/history.py)

### Readiness or capability overlay

A current planning-support or support-posture record that explains limits,
blocked areas, support semantics, or evidence coverage but is not itself a
workflow-owned artifact.

Examples in the current repository:

- `CapabilityRecord`, `DryRunReadinessBlocker`, `DryRunReadinessPrerequisite`,
  and `DryRunReadinessAssessmentArea` in
  [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py)
- shared posture summaries such as `evidence_confidence` in
  [platform/app-api/src/app_api/schemas/common.py](platform/app-api/src/app_api/schemas/common.py)

### Embedded history-support citation surface

An explanatory record embedded inside a workflow-history or audit-history item
that points back to stronger underlying persisted sources.

Examples in the current repository:

- `inventory_snapshot_summary`, `topology_snapshot_summary`,
  `policy_snapshot_summary`, and comparison attachments in
  [platform/app-api/src/app_api/models/workflow.py](platform/app-api/src/app_api/models/workflow.py)
  and [platform/app-api/src/app_api/models/audit.py](platform/app-api/src/app_api/models/audit.py)
- response builders in
  [platform/app-api/src/app_api/services/workflow_history.py](platform/app-api/src/app_api/services/workflow_history.py)
  and [platform/app-api/src/app_api/services/audit_history.py](platform/app-api/src/app_api/services/audit_history.py)

## Identity Strength Classes

Use the following source-identity strength labels strictly.

### `citation_safe_direct`

The surface already has strong enough platform ownership, scope identity, and
chronology to serve as a direct later citation target.

### `citation_safe_with_explicit_scope_and_time`

The surface can support later citation only if the citation carries an explicit
object scope plus a current-time or historical-time anchor.

### `supporting_only_cite_underlying_source`

The surface is useful explanatory context, but future citation should prefer the
underlying persisted or current direct source record instead of this embedded or
aggregate projection.

### `citation_unsafe_until_explicit_identity_exists`

The surface should not be used as a primary later evidence anchor until the
repository defines an explicit source-record identity for it.

## Identity Invariants

The following rules apply across all current evidence domains.

1. `source_record_id` must always identify one platform-owned record, not a raw
   vendor-native payload and not an entire API response envelope.
2. Record identity and chronology must be paired. A current record without a
   serve-time anchor is ambiguous; a historical record without a persisted or
   observed time anchor is ambiguous.
3. Child object identity must not be replaced by parent response identity.
   Example: a device record must not be cited only as the enclosing devices
   response.
4. Derived comparison identity must include explicit comparison anchors rather
   than hiding them inside notes only.
5. Overlay or summary records must not be cited as stronger truth than the
   underlying records they summarize.
6. Embedded history-support records must not be cited as if they were durable
   workflow or audit lineage by themselves.
7. Synthesized projection IDs may identify projection envelopes, but they must
   not be mistaken for workflow-owned IDs, workflow chronology, or child source
   record IDs.

## Required Identity Parts By Category

| Surface category | Minimum identity parts | Minimum chronology parts | Required scope rule |
| --- | --- | --- | --- |
| Direct source record | `reference_kind` plus one stable record key | `observed_at`, `persisted_at`, or other direct record time when available | Scope may be the whole record if the record is already singular |
| Persisted source record | `reference_kind` plus durable stored record key | `persisted_at` and `observed_at` when known | Scope may be narrowed to child objects or fields through `scope_locator` |
| Assembled read model | `reference_kind` plus object key plus current serve anchor | `generated_at`, `served_at`, or current `observed_at` when exposed | Object-level scope is mandatory; response-level citation is not enough |
| Derived comparison surface | `reference_kind` plus explicit comparison identity plus anchor record IDs | current and previous anchor times or equivalent comparison posture | Comparison section and compared object scope must be explicit |
| Readiness or capability overlay | `reference_kind` plus per-item key, not only a response-level aggregate | `generated_at` or `readiness_persisted_at` | Blocker, prerequisite, capability item, or assessment-area scope must be explicit |
| Embedded history-support surface | Parent history-event or sync context plus underlying source record identity | parent event time plus underlying source record time | The embedded attachment must not replace the underlying source record identity |

## Current Surface Classification

### Strong direct source records already present

The following current surfaces are already strong enough to classify as
`citation_safe_direct`.

| Current surface | Why it is strong now | Identity strength |
| --- | --- | --- |
| `SyncRunTable.id` and `PersistedSyncRun.sync_run_id` in [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py) and [platform/app-api/src/app_api/persistence/history.py](platform/app-api/src/app_api/persistence/history.py) | Durable backend-owned record, explicit timestamps, bounded but real historical meaning | `citation_safe_direct` |
| `InventorySnapshotTable.id`, `TopologySnapshotTable.id`, `PolicySnapshotTable.id`, and `ReadinessSnapshotTable.id` in [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py) | Durable platform-owned snapshots with explicit persisted chronology | `citation_safe_direct` |
| Persisted per-record objects keyed within snapshots, such as `device_id`, `node_id`, `link_id`, and `policy_id` in [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py) | Child objects already sit inside durable snapshot scope and can be cited by snapshot-plus-object identity | `citation_safe_direct` |

### Current assembled records that are usable only with explicit scope and time

The following surfaces are current platform-owned evidence, but they still need
explicit object scope plus a current-time anchor before later citation remains
honest.

| Current surface | Required identity rule | Identity strength |
| --- | --- | --- |
| `DeviceRecord.device_id` items in [platform/app-api/src/app_api/schemas/devices.py](platform/app-api/src/app_api/schemas/devices.py) | Later citation must pair `device_id` with a current-response time anchor such as `generated_at`; `device_id` alone is not enough for current-state citation | `citation_safe_with_explicit_scope_and_time` |
| `TopologyNodeRecord.node_id` and `TopologyLinkRecord.link_id` in [platform/app-api/src/app_api/schemas/topology.py](platform/app-api/src/app_api/schemas/topology.py) | Later citation must pair topology object identity with a current topology serve or observe anchor and preserve partial or inferred posture | `citation_safe_with_explicit_scope_and_time` |
| `PolicyRecord.policy_id` and `PolicyTargetFootprintRecord.target_name` in [platform/app-api/src/app_api/schemas/policies.py](platform/app-api/src/app_api/schemas/policies.py) | Later citation must pair policy or target identity with the current policy response time or observed anchor and preserve aggregate-only versus detail-present posture | `citation_safe_with_explicit_scope_and_time` |

### Overlay records that need explicit item identity before they are safe

The following surfaces are useful later, but today they are still too implicit
to serve as clean primary citations unless the repository defines per-item
source-record identity explicitly.

| Current surface | Identity gap | Identity strength |
| --- | --- | --- |
| `CapabilityRecord` items in [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py) | No explicit `source_record_id`; future citation needs a per-item identity anchored by vendor, platform, domain, feature, version scope, and current readiness time | `citation_unsafe_until_explicit_identity_exists` |
| `DryRunReadinessBlocker`, `DryRunReadinessPrerequisite`, and `DryRunReadinessAssessmentArea` in [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py) | No explicit blocker, prerequisite, or assessment-area record IDs in current API surfaces | `citation_unsafe_until_explicit_identity_exists` |
| Shared `EvidenceConfidenceSummary` and response-level `serving_mode` in [platform/app-api/src/app_api/schemas/common.py](platform/app-api/src/app_api/schemas/common.py) | These are posture summaries, not standalone business records; they should travel with a cited domain record instead of being cited in isolation | `supporting_only_cite_underlying_source` |

### Derived comparison surfaces that remain unsafe until identity is made explicit

The current comparison surfaces are useful, but they still need standalone
comparison identity rules.

| Current surface | Why it is not yet safe as a primary citation | Identity strength |
| --- | --- | --- |
| `InventoryComparisonSummary`, `TopologyComparisonSummary`, and `PolicyCurrentComparisonResponse` in [platform/app-api/src/app_api/schemas/devices.py](platform/app-api/src/app_api/schemas/devices.py), [platform/app-api/src/app_api/schemas/topology.py](platform/app-api/src/app_api/schemas/topology.py), and [platform/app-api/src/app_api/schemas/policies.py](platform/app-api/src/app_api/schemas/policies.py) | They expose useful deltas and timestamps but no standalone comparison record ID or explicit anchor ID set | `citation_unsafe_until_explicit_identity_exists` |
| `PolicyHistoryComparisonResponse` and `PolicyComparisonChangePreviewResponse` in [platform/app-api/src/app_api/schemas/policies.py](platform/app-api/src/app_api/schemas/policies.py) | `change_preview` items are attached derived records, not durable diff artifacts; they must inherit a parent comparison identity and anchor IDs before later citation | `citation_unsafe_until_explicit_identity_exists` |
| Embedded persisted-to-previous comparisons in [platform/app-api/src/app_api/models/workflow.py](platform/app-api/src/app_api/models/workflow.py) and [platform/app-api/src/app_api/models/audit.py](platform/app-api/src/app_api/models/audit.py) | They are explanatory attachments over stronger underlying snapshots and sync context, not standalone comparison entities | `supporting_only_cite_underlying_source` |

### Embedded history-support surfaces that must cite underlying records

The current history surfaces are especially easy to overread, so the identity
rules must stay strict.

| Current surface | Required citation rule | Identity strength |
| --- | --- | --- |
| `WorkflowHistoryRecord.workflow_id` in [platform/app-api/src/app_api/models/workflow.py](platform/app-api/src/app_api/models/workflow.py) and [platform/app-api/src/app_api/services/workflow_history.py](platform/app-api/src/app_api/services/workflow_history.py) | Do not treat this as a workflow-owned identity; it is an overloaded sync-run projection and must not anchor workflow-owned chronology | `citation_unsafe_until_explicit_identity_exists` |
| `AuditEventRecord.event_id` values synthesized in [platform/app-api/src/app_api/services/audit_history.py](platform/app-api/src/app_api/services/audit_history.py) | These may identify current audit-style projection envelopes, but they must not replace the underlying `sync_run_id` or `readiness_snapshot` source when citing evidence | `supporting_only_cite_underlying_source` |
| Embedded snapshot summaries inside workflow-history and audit-history items in [platform/app-api/src/app_api/models/workflow.py](platform/app-api/src/app_api/models/workflow.py) and [platform/app-api/src/app_api/models/audit.py](platform/app-api/src/app_api/models/audit.py) | Future citation should prefer the underlying snapshot or sync-run identity rather than the attachment object itself | `supporting_only_cite_underlying_source` |

## Category-Specific Identity Rules

### 1. Direct and persisted source records

The following rules apply to persisted snapshots, persisted per-record rows,
sync runs, and readiness snapshots.

1. The record must be citeable by one stable platform-owned identity.
2. Child records inside a persisted snapshot must inherit snapshot scope
   explicitly.
3. Later citation should prefer snapshot-plus-object identity over anonymous row
   position or display ordering.
4. Persisted records are historical evidence, not workflow-owned state.

Recommended later citation posture:

- cite inventory, topology, policy, and readiness evidence through persisted
  snapshot identities first when historical truth is acceptable
- cite sync runs as post hoc observation evidence, not as requested or executed
  workflow stages

### 2. Assembled current read models

The following rules apply to current device, topology, and policy response
objects.

1. Current record identity must include both an object key and a current-time
   anchor.
2. Response envelope identity is not a substitute for child object identity.
3. Current citation must preserve serving posture such as live, persisted
   fallback, partial, inferred, aggregate-only, or empty.
4. Current citation must not silently become durable history.

Required later identity shape for current record citation:

- current record family
- object key such as `device_id`, `node_id`, `link_id`, `policy_id`, or
  `target_name`
- current serve or observe anchor such as `generated_at`, `observed_at`, or
  `served_persisted_at`
- posture context when the object is known to be inferred, partial, aggregate,
  or fallback-backed

### 3. Derived comparison surfaces

The following rules apply to current-versus-latest-persisted and
persisted-versus-previous comparison objects.

1. A comparison surface needs its own explicit comparison identity before it is
   safe as a primary citation.
2. Comparison identity must name both or all anchor records explicitly.
3. `change_preview` items must not be cited without their parent comparison
   identity and anchor set.
4. Comparison evidence remains explanatory unless and until the repository gives
   it a direct source-record identity contract.

Minimum future identity requirements for comparison citation:

- comparison family
- comparison anchor IDs
- comparison anchor times
- compared object scope or comparison section
- explicit statement that the comparison is bounded explanatory evidence, not a
  validation diff

### 4. Readiness and capability overlays

The following rules apply to capability items, readiness blockers,
prerequisites, assessment areas, and related planning-support overlays.

1. Current response-level rollups are never enough as primary evidence.
2. Each blocker, prerequisite, assessment area, or capability item needs its
   own item-level identity before later citation is clean.
3. Overlay records explain support, blocked, or roadmap posture. They do not
   establish workflow readiness, approval, or execution eligibility by
   themselves.
4. When a persisted readiness snapshot exists, later citation should prefer the
   persisted snapshot as the stronger direct source and treat current overlays
   as current explanatory context.

Minimum future identity requirements for overlay citation:

- item family such as capability item, readiness blocker, readiness
  prerequisite, or assessment area
- item key such as feature name, blocker name, prerequisite name, or area name
- current serve anchor or readiness persisted anchor
- explicit linkage to the supported or blocked scope

### 5. Embedded history-support surfaces

The following rules apply to snapshot summaries and comparison attachments that
appear inside workflow-history or audit-history responses.

1. Embedded summary objects are attachment context, not standalone evidence
   roots.
2. Future citation should prefer the underlying snapshot, sync run, or
   readiness snapshot identity whenever it exists.
3. Projection-level IDs such as `sync-run:<id>` or `readiness-snapshot:<id>` may
   identify the projection envelope only; they must not replace child snapshot
   identity or become workflow-owned lineage.
4. Reverse-chronological feed order is presentation order only, not source
   identity or workflow chronology.

## Citation-Safe Versus Citation-Unsafe Rules

### Citation-safe now

The following current surfaces are safe primary evidence anchors now.

- persisted inventory, topology, policy, and readiness snapshots
- persisted inventory, topology, and policy child records when cited with their
  enclosing snapshot scope
- durable sync-run records when cited as post hoc read-side observation context

### Citation-safe only with explicit scope and time

The following surfaces are usable only if the later citation attaches the
required scope and time anchor explicitly.

- current device records
- current topology nodes and links
- current policy records
- current policy target footprints

### Supporting only

The following surfaces may contextualize later evidence but should not be the
primary anchor when a stronger source exists.

- `evidence_confidence` summaries
- `serving_mode` posture
- workflow-history and audit-history embedded snapshot summaries
- workflow-history and audit-history embedded comparison attachments
- synthesized audit projection envelope IDs when the underlying durable source
  is available

### Citation-unsafe until stronger identity exists

The following surfaces should not be used as primary later evidence anchors
until explicit source-record identity is added.

- current response envelopes such as `DevicesListResponse`, `TopologyResponse`,
  `PoliciesListResponse`, and `CapabilitiesListResponse`
- current comparison summaries without standalone comparison IDs
- `change_preview` items without parent comparison identity
- current capability items without item-level identity
- current readiness blockers, prerequisites, and assessment areas without
  item-level identity
- overloaded `WorkflowHistoryRecord.workflow_id` when interpreted as anything
  stronger than sync-run projection identity

## What This Slice Closes

This document closes the identity ambiguity at the rule level for the following
questions.

1. It distinguishes direct source records from assembled responses,
   comparisons, overlays, and embedded history-support attachments.
2. It identifies which current surfaces are already strong direct citation
   candidates and which are not.
3. It defines the minimum identity and chronology parts that future citations
   must carry for each category.
4. It makes explicit that current workflow-history and audit-history projections
   are not workflow-owned source identities.

## What Still Remains Blocked After This Slice

This document does not eliminate the remaining strict blockers already recorded
in
[platform/schemas/workflows/planning-slice-blockers.md](platform/schemas/workflows/planning-slice-blockers.md).

The following remain open.

1. The repository still does not expose explicit source-record IDs for many
   current comparison, readiness, and capability surfaces.
2. Workflow-owned anchors still do not exist.
3. Workflow-grade audit-linkage chains still do not exist.
4. Current history ordering is still projection-based and only narrowable inside
   `Phase 2`, not fully closable.

That means this slice clarifies the rules for source identity, but it does not
claim that the implementation side of those identities already exists.

## Conservative Bottom Line

The current repository already has strong source identity in persisted evidence
and sync-run history.

The weaker areas are current assembled responses, comparison summaries,
capability and readiness overlays, and embedded history-support attachments.

Future workflow-owned artifacts must therefore cite:

- persisted source records directly when possible
- current assembled records only with explicit object scope and current-time
  anchors
- overlays only after item-level identity is made explicit
- embedded history-support records through their underlying persisted or current
  source records rather than through the projection layer alone

If a later citation cannot say whether it points to a direct record, an
assembled record, a comparison surface, an overlay, or an embedded attachment,
then the source-record identity is still too weak and planning should not move
past documentation-first clarification yet.