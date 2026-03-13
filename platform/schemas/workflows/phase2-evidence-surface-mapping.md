# Phase 2 Evidence Surface To Evidence-Reference Mapping

## Purpose

This document maps currently implemented `Phase 2 — read-only product foundation`
evidence surfaces to the future `evidence_reference` categories defined in
[platform/schemas/workflows/evidence-reference-contract.md](platform/schemas/workflows/evidence-reference-contract.md).

It exists to answer three bounded questions honestly.

- which current evidence surfaces can later be cited directly by future workflow-owned artifacts
- which surfaces are only partially suitable because identity, chronology, or truth posture are still too weak
- which surfaces are only explanatory context or are not suitable yet as primary cited evidence

## Phase Boundary

This is a design-only mapping.

It does not introduce:

- workflow behavior
- workflow-owned persistence
- workflow APIs
- dry-run implementation
- validation execution
- persistence redesign
- any phase change

The platform remains in `Phase 2 — read-only product foundation`.

## Suitability Labels

Use the following labels strictly.

### `directly_referenceable_later`

The current surface is already a platform-owned record with durable enough
identity and chronology that a future workflow-owned artifact could cite it
without changing its essential meaning.

### `partially_referenceable_later`

The current surface contains useful platform-owned evidence, but later citation
still depends on one or more of the following.

- narrower scope locators
- more explicit source-record identity
- stronger chronology anchors
- stronger truth-boundary wording
- clearer separation between aggregate context and record-level evidence

### `conceptually_helpful_only`

The current surface is useful for operator explanation, planning vocabulary, or
future UX direction, but it should not be treated as a primary cited evidence
record.

### `not_suitable_yet`

The current surface would overstate Phase 2 truth if a future workflow-owned
artifact cited it as primary evidence.

## Evidence-Surface Mapping

| Domain | Current evidence surface | Current implemented basis | Likely future evidence-reference category | Suitability | Why this classification is justified | Main caveats and dependencies |
| --- | --- | --- | --- | --- | --- | --- |
| inventory | Current devices read model: `DevicesListResponse.items` plus `serving_mode` and `evidence_confidence` | Backend-owned normalized device records with stable `device_id`, current read-path provenance, and shared evidence posture in [platform/app-api/src/app_api/schemas/devices.py](platform/app-api/src/app_api/schemas/devices.py) and [platform/app-api/src/app_api/schemas/common.py](platform/app-api/src/app_api/schemas/common.py) | `current_read_model` / `device_inventory_record` | `partially_referenceable_later` | The surface is platform-owned, vendor-neutral, and already exposes object identity plus freshness and source posture. Future workflow-owned artifacts could cite current device-state evidence if they also preserve current-time semantics honestly. | The current response is assembled at serve time rather than stored as a durable workflow-owned record. Later citation needs an explicit current-read-model source identity and served-at anchor for the cited object scope. |
| inventory | Persisted normalized inventory snapshots and inventory records | Durable Postgres tables with snapshot IDs, per-record device IDs, and sync-run linkage in [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py) and history recovery in [platform/app-api/src/app_api/persistence/history.py](platform/app-api/src/app_api/persistence/history.py) | `persisted_snapshot` / `inventory_snapshot` | `directly_referenceable_later` | These are already platform-owned persisted records with stable identity, explicit chronology, and normalized content. They are the strongest inventory evidence surface currently implemented. | They remain normalized platform truth, not raw vendor-native truth, intent truth, or validation verdicts. Future citations must keep that boundary explicit. |
| inventory | Current-versus-latest-persisted inventory comparison summary | Aggregate comparison object in [platform/app-api/src/app_api/schemas/devices.py](platform/app-api/src/app_api/schemas/devices.py) backed by persisted snapshot comparison logic in [platform/app-api/src/app_api/persistence/history.py](platform/app-api/src/app_api/persistence/history.py) | `comparison_record` / `inventory_comparison_summary` | `partially_referenceable_later` | The comparison is honest, bounded, and useful for later explanation of freshness and change posture. | It is still an embedded aggregate summary without a dedicated comparison record ID. It is not a validation diff, and it cannot stand in for per-device proof by itself. |
| topology | Current topology read model: nodes, links, completeness, and evidence posture | Backend-owned normalized topology contract in [platform/app-api/src/app_api/schemas/topology.py](platform/app-api/src/app_api/schemas/topology.py) with explicit partial and unknown semantics recorded in [agent/sdn/03-CURRENT-STATUS.md](agent/sdn/03-CURRENT-STATUS.md) | `current_read_model` / `topology_record` | `partially_referenceable_later` | The surface is platform-owned and has object identities such as `node_id` and `link_id`, plus explicit completeness and evidence posture. It is useful future evidence for bounded current topology context. | The current topology slice still includes inferred links and partial truth. Future citations must preserve `inferred`, `partial`, and freshness posture instead of implying protocol-derived or controller-derived topology truth. |
| topology | Persisted normalized topology snapshots, nodes, and links | Durable snapshot, node, and link tables with explicit persisted and observed timestamps in [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py) | `persisted_snapshot` / `topology_snapshot` | `directly_referenceable_later` | This is durable, platform-owned topology evidence with explicit record structure and chronology. It is directly citeable later as bounded historical topology evidence. | Direct referenceability does not make the topology strong enough for workflow-grade validation. Link inference and partial completeness still limit claim strength. |
| topology | Current-versus-latest-persisted topology comparison summary | Aggregate comparison object in [platform/app-api/src/app_api/schemas/topology.py](platform/app-api/src/app_api/schemas/topology.py) backed by persisted comparison logic in [platform/app-api/src/app_api/persistence/history.py](platform/app-api/src/app_api/persistence/history.py) | `comparison_record` / `topology_comparison_summary` | `partially_referenceable_later` | The comparison gives useful chronology and delta context for future explanatory citations. | The current comparison remains count-oriented and bounded. It is not adjacency-proof, path truth, or a workflow-grade validation artifact. |
| policy | Current policy read model: `items`, `target_footprints`, empty/detail posture, and evidence confidence | Backend-owned normalized policy contract in [platform/app-api/src/app_api/schemas/policies.py](platform/app-api/src/app_api/schemas/policies.py) with target-footprint and empty-state semantics documented in [agent/sdn/03-CURRENT-STATUS.md](agent/sdn/03-CURRENT-STATUS.md) | `current_read_model` / `policy_record` and `current_read_model` / `policy_target_footprint` | `partially_referenceable_later` | The current surface contains real platform-owned evidence across per-policy detail when present and aggregate per-target footprint when policy detail is absent. It is useful for bounded support, availability, and live-empty claims. | This slice is still intentionally partial. Aggregate footprints are not substitutes for per-policy truth, and current live-empty posture must not be overread as proof about absent intent or safe change impact. |
| policy | Persisted normalized policy snapshots, policy records, and candidate paths | Durable snapshot and per-policy persistence in [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py) | `persisted_snapshot` / `policy_snapshot` | `directly_referenceable_later` | These are stable platform-owned historical records with explicit chronology and normalized per-policy structure when that detail exists. They are the strongest current policy evidence surface even though policy truth is still bounded. | The direct referenceability is limited to bounded policy claims. Deeper BGP-signaled policy truth and broader per-policy completeness still do not exist. |
| policy | Policy comparison summaries and `change_preview` | Current-versus-latest-persisted and persisted-versus-previous comparison objects in [platform/app-api/src/app_api/schemas/policies.py](platform/app-api/src/app_api/schemas/policies.py) | `comparison_record` / `policy_comparison_summary` | `partially_referenceable_later` | These summaries are useful future citation material for bounded change context where persisted policy detail genuinely exists. | `change_preview` is intentionally small, derived, and detail-dependent. It is not a durable diff artifact, not a drift engine, and not broad policy-history truth. |
| history | Persisted sync-run records surfaced through workflow-history | Stable sync-run records with `sync_run_id`, chronology, persisted-artifact linkage, and snapshot summaries in [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py), [platform/app-api/src/app_api/models/workflow.py](platform/app-api/src/app_api/models/workflow.py), and [platform/app-api/src/app_api/services/workflow_history.py](platform/app-api/src/app_api/services/workflow_history.py) | `history_event` / `sync_run_record` | `directly_referenceable_later` | These are durable platform-owned historical records and the strongest current history evidence surface. Future workflow-owned artifacts can cite them for post hoc chronology and supporting snapshot context. | They are read-side sync history only. They must not be relabeled as requested, approved, executing, or rolled-back workflow lifecycle evidence. |
| history | Audit-history sync-event envelopes assembled from sync runs | Derived audit-style records in [platform/app-api/src/app_api/models/audit.py](platform/app-api/src/app_api/models/audit.py) and [platform/app-api/src/app_api/services/audit_history.py](platform/app-api/src/app_api/services/audit_history.py) | `audit_event` / `audit_event_record` | `partially_referenceable_later` | The envelopes provide useful current audit wording, scope, and chronology patterns that future workflow-linked audit records can reuse. | The current audit event identity is still a projection over sync-run or readiness records rather than a standalone durable audit store. This is useful context, not complete workflow audit linkage. |
| history | Audit-history `readiness_snapshot_recorded` events | Audit-style events derived from persisted readiness snapshots in [platform/app-api/src/app_api/services/audit_history.py](platform/app-api/src/app_api/services/audit_history.py) and persisted readiness history recovery in [platform/app-api/src/app_api/persistence/history.py](platform/app-api/src/app_api/persistence/history.py) | `audit_event` / `readiness_snapshot_audit_event` | `partially_referenceable_later` | These events are honest current evidence that the platform recorded a readiness-support state change. | The underlying readiness snapshot is the stronger primary evidence source. The audit envelope itself is still derived read-side context rather than workflow-grade audit identity. |
| readiness | Current readiness summary, blockers, prerequisites, and assessment areas from `/api/v1/capabilities` | Backend-owned readiness structures in [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py) built in [platform/app-api/src/app_api/services/capabilities.py](platform/app-api/src/app_api/services/capabilities.py) | `readiness_record` / `readiness_summary`, `readiness_blocker`, and `readiness_prerequisite` | `partially_referenceable_later` | The surface already has explicit planning-readiness semantics, blocker categories, evidence basis, and bounded next-step language. It is useful later for explaining why stronger workflow claims remain blocked. | The current response does not expose stable per-blocker or per-prerequisite IDs. Later citation needs explicit source-record identity for sub-record scope rather than only response-level aggregation. |
| readiness | Persisted readiness snapshots | Durable readiness-support snapshots with `id`, `persisted_at`, blocker lists, assessment areas, and support/evidence counts in [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py) and [platform/app-api/src/app_api/persistence/readiness.py](platform/app-api/src/app_api/persistence/readiness.py) | `persisted_snapshot` / `readiness_snapshot` and `readiness_record` / `readiness_snapshot_record` | `directly_referenceable_later` | These are durable platform-owned planning-support records with stable identity and explicit chronology. They are the strongest readiness evidence surface currently implemented. | They only support readiness, blockers, and planning posture. They must not be treated as preview output, validation results, approval state, or workflow lifecycle state. |
| capability | Capability matrix item records | Backend-owned capability records with explicit `feature`, `support_status`, `evidence_basis`, `vendor_posture`, and readiness linkage in [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py) and [platform/app-api/src/app_api/services/capabilities.py](platform/app-api/src/app_api/services/capabilities.py) | `capability_record` / `capability_record` | `partially_referenceable_later` | The vocabulary is already strong and normalized enough to explain supported, unsupported, partial, unknown, and roadmap-only conditions later. | The current response does not expose a stable record ID per capability item, and most capability records are not persisted independently. Later citation needs stable source-record identity beyond the current feature tuple. |
| capability | Capability summary counts and workflow-readiness rollups | Aggregated counts in `CapabilitiesListResponse` in [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py) | `capability_record` / `capability_summary_rollup` | `conceptually_helpful_only` | These rollups are useful operator context and planning summaries. | They are too aggregate to serve as primary evidence for a future workflow-owned artifact. Future citations should prefer individual capability or readiness records instead. |
| cross-domain | Shared `evidence_confidence` and `serving_mode` posture cues across devices, topology, and policies | Shared posture metadata in [platform/app-api/src/app_api/schemas/common.py](platform/app-api/src/app_api/schemas/common.py) and per-domain schemas | `current_read_model` / `evidence_posture_summary` | `partially_referenceable_later` | These cues map cleanly into future `posture_summary` and chronology semantics and are useful supporting metadata. | They are supporting metadata, not standalone business records. Future citations should attach them to a cited domain record rather than cite them in isolation. |

## Suitability Classification Matrix

| Domain | Directly referenceable later | Partially referenceable later | Conceptually helpful only | Not suitable yet as primary evidence |
| --- | --- | --- | --- | --- |
| inventory | Persisted inventory snapshots and records | Current devices read model; inventory comparison summary; shared evidence posture cues | None significant beyond UI presentation | Treating current device views as durable workflow state |
| topology | Persisted topology snapshots, nodes, and links | Current topology read model; topology comparison summary; shared evidence posture cues | None significant beyond UI presentation | Treating inferred-link topology as validation-grade path truth |
| policy | Persisted policy snapshots, records, and candidate paths | Current policy read model; target footprints; policy comparison summaries and `change_preview`; shared evidence posture cues | None significant beyond UI presentation | Treating aggregate-only or live-empty policy posture as full per-policy truth |
| history | Persisted sync-run records | Current audit-history envelopes and derived readiness audit events | UI sorting and recency patterns on history pages | Treating sync-derived history as workflow lifecycle, approval, or rollback evidence |
| readiness | Persisted readiness snapshots | Current readiness summary, blockers, prerequisites, and assessment areas | UI readiness summaries and dashboard explanations | Treating readiness-support metadata as preview, diff, or validation output |
| capability | None currently strong enough to call direct | Capability matrix item records | Capability counts and rollups | Treating capability summaries as workflow authorization or execution eligibility by themselves |

## Strongest Current Evidence Surfaces

The strongest currently implemented surfaces are the ones that already satisfy
most future `evidence_reference` expectations: platform ownership, stable
identity, explicit chronology, and conservative truth posture.

1. Persisted normalized inventory snapshots and inventory records.
   They are durable, directly observed within the current slice, and have the least inference burden among the current major domains.
2. Persisted sync-run records.
   They provide stable chronology and explicit linkage to persisted read-side artifacts without pretending workflow lifecycle semantics.
3. Persisted readiness snapshots.
   They are durable, explicit about blockers and planning posture, and already fit the future `readiness_record` explanation role well.
4. Persisted normalized topology and policy snapshots.
   They are directly citeable as historical evidence, but they carry stronger partiality caveats than inventory because topology still uses bounded inference and policy truth remains intentionally narrow.

## Weakest Current Evidence Surfaces

The weakest surfaces are not useless, but they are easiest to overread.

1. Aggregate-only live policy posture when per-policy detail is absent.
   Target footprints and live-empty semantics are useful context, but they are not substitutes for specific policy-record truth.
2. Current topology link claims when they depend on bounded inference.
   These can support bounded explanation later, but they are not strong enough for validation-grade or path-grade claims.
3. Derived audit-history envelopes.
   The wording and chronology are useful, but the underlying sync-run or readiness snapshot is usually the stronger source record to cite.
4. Capability and readiness rollup counts.
   These are summary signals for people, not strong primary evidence records for future workflow-owned artifacts.

## Gaps, Caveats, And Dependency Notes

### Cross-domain gaps

1. Most current read-model and comparison surfaces still lack explicit, standalone
   `source_record_id` values designed for later citation.
   Persisted snapshots already have that property. Current assembled responses and
   embedded comparison objects usually do not.
2. The current posture metadata is strong enough to seed future
   `posture_summary` values, but those cues usually live inside response metadata
   rather than as independently addressable records.
3. Current audit-history records are projections over persisted records rather
   than a dedicated workflow-aware audit store. Later workflow-owned
   `audit_linkage` design should prefer underlying source identities where
   possible.

### Domain-specific caveats

1. Inventory evidence is strong for bounded current and historical device-state
   claims, but it still represents normalized platform truth rather than intent,
   validation, or raw vendor payload truth.
2. Topology evidence is reusable later, but any citation that touches links or
   completeness must preserve `partial` and `inferred` posture explicitly.
3. Policy evidence is reusable later only when the cited claim matches the
   actual detail depth.
   Aggregate counters and per-target footprints can support bounded policy
   posture claims, but not workflow-grade policy validation claims.
4. History evidence is strongest when cited as post hoc chronology and persisted
   record context.
   It is weakest when overread as operator intent, approvals, execution stages,
   or rollback semantics.
5. Readiness evidence is strong for explaining blockers and planning posture,
   but it must remain separate from preview, diff, validation-result, and
   workflow-lifecycle evidence.
6. Capability evidence is useful for unsupported, unknown, and roadmap-only
   explanation, but it still needs explicit stable record identity before it can
   become a stronger direct citation surface.

### Dependency notes for later workflow-owned citation

The next design work should not change current Phase 2 meaning. It should only
close the citation gaps that this mapping exposes.

1. Define explicit source identity rules for current read-model and comparison
   records that are not already persisted snapshots.
2. Keep `evidence_reference` citations pointed at platform-owned records rather
   than dashboards, Prometheus series, or raw vendor payloads.
3. Prefer underlying persisted snapshot or sync-run identities over derived UI
   or audit-envelope summaries whenever both exist.
4. Use future `audit_linkage` and retrieval-sequencing design to decide when a
   future workflow-owned artifact should cite a current read model, a persisted
   snapshot, a comparison record, or a history record first.

## Conservative Bottom Line

Current `Phase 2` evidence is already good enough to support a useful future
`evidence_reference` design baseline, but not evenly.

- persisted inventory, topology, policy, readiness, and sync-run records are the clearest direct citation candidates
- current read models and comparison objects are useful but still need stronger identity and narrower citation discipline
- aggregate rollups and derived audit envelopes are mostly explanatory context rather than the best primary evidence anchors
- none of this changes the current phase or implies workflow implementation readiness