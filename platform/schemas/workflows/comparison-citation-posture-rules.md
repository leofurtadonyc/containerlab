# Comparison Citation Posture And Ownership Rules

## Purpose

This document makes comparison-citation posture and ownership rules more
explicit for current comparison-oriented surfaces.

It exists to answer four bounded questions.

- which comparison-oriented surfaces are direct citations of source records
- which surfaces are assembled comparison summaries only
- which surfaces are bounded supporting context only
- which surfaces are not suitable for future workflow-owned citation without
  redesign

It is a documentation-first and schema-first artifact only.

It does not introduce:

- implementation changes
- workflow behavior
- persistence changes
- phase changes

## Phase Boundary

The platform remains in `Phase 2 — read-only product foundation`.

So this document must preserve the current read-side and evidence boundaries.

It must not be read as proof that:

- current comparison outputs already have durable comparison-record identities
- current comparison outputs already belong to workflow-owned state
- current comparison outputs already serve as validation diffs, preview
  artifacts, or workflow-owned audit evidence by themselves

## Relationship To Existing Planning Docs

This document tightens the next bounded planning area identified by:

- [platform/schemas/workflows/ownership-boundaries.md](platform/schemas/workflows/ownership-boundaries.md)
- [platform/schemas/workflows/source-record-identity-rules.md](platform/schemas/workflows/source-record-identity-rules.md)
- [platform/schemas/workflows/source-record-identity-needs-mapping.md](platform/schemas/workflows/source-record-identity-needs-mapping.md)
- [platform/schemas/workflows/current-history-chronology-ordering-rules.md](platform/schemas/workflows/current-history-chronology-ordering-rules.md)
- [platform/schemas/workflows/evidence-reference-contract.md](platform/schemas/workflows/evidence-reference-contract.md)
- [platform/schemas/workflows/history-audit-linkage-mapping.md](platform/schemas/workflows/history-audit-linkage-mapping.md)

It narrows only comparison ownership and citation posture.

It does not reopen chronology, workflow-owned anchor design, or workflow-grade
audit linkage design.

## Core Rule

Comparison outputs may later explain workflow-owned artifacts, but they must
not silently become workflow-owned source anchors.

When later workflow-owned artifacts cite comparison-oriented evidence, the
citation posture must state which one of the following is actually being cited.

1. a direct platform-owned source record
2. an assembled comparison summary over stronger source records
3. bounded supporting comparison context that inherits stronger underlying
   anchors
4. a surface that is not suitable for workflow-owned citation without redesign

If that ownership posture is not explicit, the comparison surface is too easy
to overread.

## Citation Posture Labels

Use the following labels strictly.

### `direct_citation_of_source_records`

The cited thing is a direct platform-owned source record with stable identity.

For comparison-oriented reasoning, this usually means citing the underlying
persisted snapshot or per-record source anchors rather than citing the assembled
comparison output as if the comparison itself were the source record.

### `assembled_summary_only`

The surface is a backend-owned assembled comparison summary.

It may be cited later only if the citation explicitly preserves that the object
is a bounded assembled summary rather than a durable comparison record.

### `bounded_supporting_context_only`

The surface is explanatory comparison context that inherits chronology and
meaning from stronger underlying records.

It may help explain a workflow-owned artifact later, but it should not be used
as the primary source anchor.

### `not_suitable_for_future_workflow_owned_citation`

The surface would mislead later design if cited directly as though it were a
durable comparison record, source anchor, or workflow-grade diff artifact.

## Ownership Domains For Comparison-Oriented Surfaces

| Ownership domain | What belongs here now | What it may support later | What it must not silently become |
| --- | --- | --- | --- |
| Source records | Persisted snapshots, persisted per-record rows, persisted sync runs, persisted readiness snapshots | Stable later evidence anchors and explicit comparison anchors | Comparison summaries, validation verdicts, preview artifacts, or workflow-owned diff objects |
| Assembled comparison summaries | Current API comparison summaries such as `InventoryComparisonSummary`, `TopologyComparisonSummary`, `PolicyCurrentComparisonResponse`, and `PolicyHistoryComparisonResponse` | Bounded cited explanation when their assembled nature is explicit | Direct source records, workflow revisions, or validation-grade diff truth |
| Supporting comparison attachments | Embedded comparison objects in workflow-history and audit-history models, plus bounded notes on persisted comparison helpers | Later explanatory context attached to evidence references or audit linkages | Primary audit-linkage roots, workflow chronology roots, or direct source anchors |
| Readiness and capability overlays | Readiness summaries, blockers, prerequisites, assessment areas, capability items, evidence-confidence posture, and rollups | Constraint, support-posture, or unsupported-condition context around comparison claims | Comparison records, direct evidence anchors, or workflow-owned blockers by default |
| Future citation layer | Future `evidence_reference` records that cite source records or assembled/supporting comparison surfaces with explicit posture | Explicit workflow-owned citation semantics only | A payload-duplication layer or a relabeling of current response objects into workflow-owned records |

## Comparison Surface Classification

### Direct source anchors behind comparison surfaces

These are not comparison summaries themselves.

They are the source anchors that comparison-oriented citation should usually
prefer.

| Current source anchor | Current implemented basis | Citation posture | Ownership rule |
| --- | --- | --- | --- |
| `InventorySnapshotTable.id` plus persisted inventory record keys | Durable inventory snapshots and child records in [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py) | `direct_citation_of_source_records` | Owns historical inventory truth; comparison summaries only explain deltas over these records |
| `TopologySnapshotTable.id` plus persisted node and link keys | Durable topology snapshots and child records in [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py) | `direct_citation_of_source_records` | Owns historical topology truth; comparison summaries only explain deltas over these records |
| `PolicySnapshotTable.id` plus persisted policy and candidate-path keys | Durable policy snapshots and child records in [platform/app-api/src/app_api/persistence/tables.py](platform/app-api/src/app_api/persistence/tables.py) | `direct_citation_of_source_records` | Owns historical policy truth; comparison summaries and `change_preview` rows do not replace these anchors |
| Current read-model object keys plus explicit current-time anchors | Current `device_id`, `node_id`, `link_id`, `policy_id`, or `target_name` with explicit current serve or observe posture in [platform/app-api/src/app_api/schemas/devices.py](platform/app-api/src/app_api/schemas/devices.py), [platform/app-api/src/app_api/schemas/topology.py](platform/app-api/src/app_api/schemas/topology.py), and [platform/app-api/src/app_api/schemas/policies.py](platform/app-api/src/app_api/schemas/policies.py) | `direct_citation_of_source_records` only when cited as the underlying current objects rather than as the assembled comparison wrapper | Owns current bounded read-side truth; comparison summaries over these records remain assembled outputs rather than direct source anchors |

### Assembled comparison summaries only

These surfaces are backend-owned and useful, but they remain assembled
comparison summaries.

| Current surface | Current implemented basis | Citation posture | Why it stays here |
| --- | --- | --- | --- |
| `InventoryComparisonSummary` in [platform/app-api/src/app_api/schemas/devices.py](platform/app-api/src/app_api/schemas/devices.py) | Current-versus-latest-persisted inventory comparison with counts, one persisted timestamp, and notes | `assembled_summary_only` | It is useful bounded explanation, but it is assembled at response time and still lacks explicit comparison anchor IDs in the contract |
| `TopologyComparisonSummary` in [platform/app-api/src/app_api/schemas/topology.py](platform/app-api/src/app_api/schemas/topology.py) | Current-versus-latest-persisted topology comparison with counts, one persisted timestamp, one current observed timestamp, and notes | `assembled_summary_only` | It explains bounded current-versus-persisted topology posture but remains a response-level summary rather than a direct source record |
| `PolicyCurrentComparisonResponse` in [platform/app-api/src/app_api/schemas/policies.py](platform/app-api/src/app_api/schemas/policies.py) | Current-versus-latest-persisted policy comparison with counts, one persisted timestamp, one current observed timestamp, derived `change_preview`, and notes | `assembled_summary_only` | It is the clearest current comparison wrapper, but it is still a response-level assembled summary without explicit anchor IDs and must not be treated as a durable comparison entity |
| `PolicyHistoryComparisonResponse` in [platform/app-api/src/app_api/schemas/policies.py](platform/app-api/src/app_api/schemas/policies.py) | Latest-versus-previous persisted policy comparison with timestamps, deltas, `change_preview`, and notes | `assembled_summary_only` | It is historically grounded in stronger persisted sources, but the response contract still exposes a bounded assembled summary rather than a durable comparison record |

### Bounded supporting comparison context only

These surfaces are useful for explanation, but they inherit meaning from
stronger underlying anchors and should not become the main citation root.

| Current surface | Current implemented basis | Citation posture | Why it stays here |
| --- | --- | --- | --- |
| `PersistedInventorySnapshotComparison`, `PersistedTopologySnapshotComparison`, and `PersistedPolicySnapshotComparison` in [platform/app-api/src/app_api/persistence/history.py](platform/app-api/src/app_api/persistence/history.py) | Helper comparison objects rebuilt from explicit current and previous persisted snapshots | `bounded_supporting_context_only` | They are stronger than API-only rollups because they rest on persisted anchors, but they are still helper objects with no standalone durable comparison ID |
| Embedded workflow-history comparison attachments in [platform/app-api/src/app_api/models/workflow.py](platform/app-api/src/app_api/models/workflow.py) | Comparison context attached to workflow-history projections | `bounded_supporting_context_only` | They are explanatory attachments over stronger persisted comparison helpers and sync-run anchors, not primary citation roots |
| Embedded audit-history comparison attachments in [platform/app-api/src/app_api/models/audit.py](platform/app-api/src/app_api/models/audit.py) | Comparison context attached to audit-history projections | `bounded_supporting_context_only` | They are similarly explanatory projection attachments and should defer to the underlying persisted snapshot or sync-run anchors |
| `EvidenceConfidenceSummary` and `serving_mode` in [platform/app-api/src/app_api/schemas/common.py](platform/app-api/src/app_api/schemas/common.py), [platform/app-api/src/app_api/schemas/devices.py](platform/app-api/src/app_api/schemas/devices.py), [platform/app-api/src/app_api/schemas/topology.py](platform/app-api/src/app_api/schemas/topology.py), and [platform/app-api/src/app_api/schemas/policies.py](platform/app-api/src/app_api/schemas/policies.py) | Shared posture summaries around current responses and comparisons | `bounded_supporting_context_only` | They explain freshness, confidence, and delivery posture around a comparison claim but are not comparison records or source anchors |
| Readiness and capability items that constrain comparison claims in [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py) | Global readiness blockers, prerequisites, assessment areas, and capability items | `bounded_supporting_context_only` | They may explain why a stronger comparison claim is blocked or unsupported, but they do not own comparison truth |

### Not suitable for future workflow-owned citation without redesign

These surfaces would overstate ownership or durability if cited directly as
workflow-owned comparison evidence.

| Current surface | Current implemented basis | Citation posture | Why direct citation is unsafe |
| --- | --- | --- | --- |
| `PolicyComparisonChangePreviewResponse` in [platform/app-api/src/app_api/schemas/policies.py](platform/app-api/src/app_api/schemas/policies.py) | Small derived change rows attached to policy comparison responses | `not_suitable_for_future_workflow_owned_citation` | They are attached explanatory rows with no own record ID, no parent comparison ID field, and no complete anchor set |
| Response-level rollup counts inside comparison summaries | Aggregate delta and count fields inside current comparison response objects | `not_suitable_for_future_workflow_owned_citation` | Aggregate counts can explain a bounded claim but cannot serve as source-record identity or a durable comparison entity by themselves |
| Workflow-history projection IDs used to carry comparison context | Overloaded workflow-history projection identifiers in [platform/app-api/src/app_api/models/workflow.py](platform/app-api/src/app_api/models/workflow.py) and [platform/app-api/src/app_api/services/workflow_history.py](platform/app-api/src/app_api/services/workflow_history.py) | `not_suitable_for_future_workflow_owned_citation` | They would collapse sync-derived projections into workflow-owned comparison or lifecycle anchors |
| Audit-history projection envelope IDs used to carry comparison context | Synthesized audit envelope identifiers in [platform/app-api/src/app_api/models/audit.py](platform/app-api/src/app_api/models/audit.py) and [platform/app-api/src/app_api/services/audit_history.py](platform/app-api/src/app_api/services/audit_history.py) | `not_suitable_for_future_workflow_owned_citation` | They are projection identities, not durable comparison-record identities or workflow-grade audit anchors |

## Ownership Clarifications For Comparison Surfaces

### Source records versus comparison summaries

1. Source records own the underlying evidence.
2. Comparison summaries own only the bounded explanatory result of comparing one
   or more source records.
3. A comparison summary must not silently inherit source-record ownership just
   because it exposes counts, notes, or timestamps.
4. If later citation needs stable truth, it should usually cite the underlying
   source anchors first and then cite the comparison summary only as bounded
   explanation when needed.

### Comparison summaries versus evidence references

1. A comparison summary is an evidence surface.
2. A future `evidence_reference` is a workflow-owned citation object that may
   point to that comparison surface with explicit posture.
3. The comparison summary itself must not be treated as the citation object.
4. If the comparison surface lacks explicit comparison identity, a later
   `evidence_reference` should prefer the underlying source anchors or state
   explicitly that the cited thing is an assembled summary only.

### Comparison summaries versus readiness and capability overlays

1. Comparison summaries explain deltas between source records.
2. Readiness and capability overlays explain support posture, blockers,
   unsupported areas, or evidence limits around those deltas.
3. Overlays may constrain a comparison claim, but they do not become comparison
   records.
4. Comparison summaries must not be used to smuggle readiness or capability
   overlays into source-record ownership.

### Comparison summaries versus workflow-owned artifacts

1. Current comparison summaries are not preview artifacts.
2. Current comparison summaries are not validation results.
3. Current comparison summaries are not workflow diffs.
4. Current comparison summaries are not workflow-owned audit records.
5. If later workflow-owned artifacts cite them, the workflow-owned artifact
   still remains the owner of the workflow claim surface.

## Safe Versus Unsafe Citation Examples

### Safe example 1: cite underlying policy snapshots first

Safe later posture:

- a future workflow-owned artifact cites the current and previous persisted
  policy snapshot identities as source anchors
- it may additionally cite `PolicyHistoryComparisonResponse` as an assembled
  comparison summary that explains the bounded delta between those snapshots
- the citation notes that `change_preview` is attached supporting context only

Unsafe posture:

- cite `PolicyHistoryComparisonResponse` as if it were itself the durable
  comparison record or workflow-owned diff artifact

### Safe example 2: cite current topology records with explicit current posture

Safe later posture:

- a future workflow-owned artifact cites specific current topology node or link
  records with explicit current-time posture
- it may additionally cite `TopologyComparisonSummary` as an assembled summary
  that explains the current-versus-latest-persisted bounded difference

Unsafe posture:

- cite `TopologyComparisonSummary` alone as if it were the primary topology
  source anchor for the claim

### Safe example 3: use readiness blockers as constraints, not comparison truth

Safe later posture:

- a future workflow-owned artifact cites a readiness snapshot or readiness
  blocker only to explain why a stronger comparison claim must remain bounded
- the comparison claim still cites the underlying source records or the
  assembled comparison summary explicitly

Unsafe posture:

- treat a readiness blocker or capability item as though it were the comparison
  record itself

### Safe example 4: use history attachments as explanation only

Safe later posture:

- a future audit linkage cites a persisted sync run or persisted snapshot as the
  stronger source anchor
- it may additionally cite an embedded workflow-history or audit-history
  comparison attachment as bounded supporting explanation

Unsafe posture:

- treat the embedded history attachment or the surrounding history projection as
  the durable comparison anchor

## Practical Citation Rules

Use the following rules strictly when later comparison-oriented citation is
planned.

1. Prefer underlying persisted or current source records over assembled
   comparison wrappers.
2. If a comparison wrapper is cited, say that it is an assembled summary and not
   a durable source record.
3. Do not cite `change_preview` rows by themselves.
4. Do not cite comparison rollup counts by themselves.
5. Use readiness and capability overlays only to constrain, explain
   unsupportedness, or explain bounded posture around comparison claims.
6. Do not let workflow-history or audit-history projection identity become the
   comparison anchor.
7. Preserve explicit ownership: source records own evidence, comparison
   summaries own bounded explanation, `evidence_reference` owns later workflow
   citation semantics, and overlays own support posture only.

## Explicit Non-Goals

This document does not define:

- comparison persistence redesign
- comparison-record implementation
- workflow diff implementation
- validation-result implementation
- workflow-owned citation implementation
- API contract changes

## Conservative Bottom Line

Current comparison-oriented surfaces are useful, but they do not all own the
same kind of truth.

- source records remain the primary anchors
- current comparison responses remain assembled summaries unless stronger
  comparison identity is defined later
- embedded comparison attachments and overlays remain bounded supporting context
- attached `change_preview` rows and projection identities remain unsafe as
  workflow-owned citation anchors without redesign

If a later design step cannot say whether a comparison-oriented citation points
to a source record, an assembled summary, supporting context, or an unsafe
surface, then the ownership boundary is still too weak.