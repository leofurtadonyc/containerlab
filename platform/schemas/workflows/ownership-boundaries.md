# Ownership Boundaries Between Current Evidence And Future Workflow-Owned State

## Purpose

This document defines the ownership boundaries between current `Phase 2`
evidence surfaces and later workflow-owned state.

It exists to answer four bounded questions.

- what belongs to current read-side evidence versus future workflow-owned state
- what belongs to persisted evidence storage versus future workflow lifecycle or
  artifact storage
- what belongs to planning-support readiness and blocker metadata versus future
  workflow-scoped blockers and prerequisites
- what belongs to future workflow audit records versus workflow-owned entities

It is a design-only boundary document.

It does not introduce:

- workflow behavior
- new APIs
- persistence changes
- audit-engine implementation
- phase changes
- a broad architecture rewrite

## Phase Boundary

The platform remains in `Phase 2 — read-only product foundation`.

So this document must be read only as transition-safety groundwork.

It must not be read as proof that workflow-owned entities, workflow-scoped
blockers, workflow audit records, or workflow retrieval APIs already exist.

## Core Rule

Current evidence and future workflow state may later relate to each other, but
they must not silently collapse into the same thing.

Later workflow support must preserve separate ownership for:

- current read-side evidence
- persisted evidence snapshots
- readiness and blocker metadata
- future workflow-owned state
- future workflow audit records

Any later relationship between those domains must happen through explicit
workflow-owned references, audit linkages, and citation rules.

It must not happen by relabeling a current `Phase 2` surface as if it had
already become a workflow object.

## Ownership Domains

| Domain | Current or future owner | What belongs here | What it may support later | What it must not silently become |
| --- | --- | --- | --- | --- |
| Read-side evidence | Current backend-owned read layer in `app-api` | Current devices, topology, policies, capabilities, readiness summaries, current comparison summaries, and bounded history views | Evidence inputs for later workflow artifacts through explicit citation | Workflow roots, workflow revisions, validation results, approvals, executions, or rollback records |
| Persisted evidence snapshots | Current backend-owned persistence layer in `app-api` | Inventory, topology, policy, sync-run, and readiness-support persisted records | Stable cited source records for later workflow artifacts and audit explanations | Workflow lifecycle tables, workflow artifact tables, or workflow revisions |
| Readiness and blocker metadata | Current backend-owned capability and readiness layer in `app-api` | Global readiness summaries, prerequisites, blockers, assessment areas, support posture, and evidence coverage metadata | Planning-support context and later vocabulary for workflow-scoped blockers and prerequisites | Per-workflow blocker state, preview output, approval readiness, or workflow lifecycle state |
| Future workflow-owned state | Future backend-owned workflow domain in `app-api` | `workflow`, `workflow_revision`, `workflow_state_transition`, `preview_artifact`, `diff_artifact`, `validation_result`, `workflow_blocker`, `approval_record`, `execution_record`, and `rollback_record` | The only valid home for workflow lifecycle and action-oriented state | A repackaging of current read-side responses, persisted snapshots, readiness metadata, or dashboards |
| Future workflow audit records | Future backend-owned audit relationship and event layer | Workflow-grade `audit_event` records plus `audit_linkage` relationships scoped to workflow-owned entities | Ordered accountability for workflow-owned state and explicit post hoc observation linkage | Workflow state by itself, copied evidence payloads, or current sync-derived history relabeled as workflow audit truth |

## Boundary Rules

The following ownership rules must remain explicit.

1. Read-side evidence stays evidence even when later cited by workflow-owned
   records.
2. Persisted snapshots stay evidence storage even when later cited by workflow
   artifacts.
3. Global readiness and blocker metadata stay planning-support posture until a
   workflow-owned blocker or prerequisite record exists.
4. Future workflow-owned state must be stored as its own entity family rather
   than inferred from current read models, sync runs, readiness timestamps, or
   comparison summaries.
5. Future workflow audit records must remain separate from both workflow-owned
   entities and evidence records.
6. `audit_linkage` must remain a relationship object, not a workflow record,
   not an audit-event payload container, and not an evidence-reference
   substitute.
7. `evidence_reference` must remain a citation object, not a copied evidence
   blob and not a workflow-state container.
8. `app-web` may present workflow-owned state later, but it must not own or
   infer workflow truth.
9. Grafana, Prometheus, ODL, raw collector logic, and vendor-native payloads
   must remain outside workflow-owned state.

## What Must Stay Outside Workflow-Owned State

The following current and future surfaces may be related to workflow-owned state
later, but they should remain outside workflow-owned state itself.

- current `/api/v1/devices`, `/api/v1/topology`, `/api/v1/policies`, and
  `/api/v1/capabilities` response contracts
- current persisted inventory, topology, policy, sync-run, and readiness
  snapshot tables
- current read-side comparison summaries and `change_preview` projections
- current global readiness summaries, blockers, prerequisites, and assessment
  areas
- current sync-derived workflow-history and audit-history feeds
- future audit-event payloads and `audit_linkage` relationship records
- Prometheus time-series, Grafana dashboards, and dashboard provisioning
- raw vendor-native payloads, device CLI output, and unnormalized ODL payloads

Workflow-owned state may cite or relate to these surfaces later.

It must not absorb them as if they were workflow-owned records already.

## Current `Phase 2` Objects That Must Never Silently Become Workflow Objects Later

| Current `Phase 2` object | What it is now | What it may support later | What it must never silently become |
| --- | --- | --- | --- |
| Current devices, topology, and policies read models | Backend-owned current product truth with explicit partial, inferred, live, stale, and fallback posture | Cited current evidence for later workflow artifacts | `workflow`, `workflow_revision`, `validation_result`, or execution outcome records |
| Persisted inventory, topology, and policy snapshots | Durable evidence records for historical product truth | Historical evidence cited by future workflow artifacts | Workflow revisions, preview artifacts, or diff artifacts |
| `SyncRunTable` and persisted sync runs | Durable post hoc read-side history | Observation context and bounded audit explanation | Workflow creation history, execution records, or rollback lineage |
| Current comparison summaries and embedded `change_preview` objects | Derived bounded explanatory context over persisted records | Later cited comparison evidence once source identity is explicit | Validation verdicts, workflow diffs, or drift-engine truth |
| Current readiness summaries, blockers, and prerequisites | Global planning-support metadata | Vocabulary and cited context for later workflow-scoped blockers or prerequisites | Workflow blocker records, approval readiness, or preview completeness |
| `WorkflowHistoryRecord` and workflow-history feed | Sync-derived operator view over persisted read-side activity | Response wording and post hoc chronology patterns | Durable workflow instance history or workflow state transitions |
| `AuditEventRecord` projections and audit-history feed | Bounded audit-style read-only event view | Generic audit vocabulary and post hoc evidence context | Workflow audit-event family, approval history, or execution audit history |
| Capability matrix items and rollups | Support-posture and evidence-basis explanation surfaces | Unsupported-condition and blocker explanation context | Workflow authorization engine or per-instance workflow eligibility record |
| Grafana dashboards and observability metrics | Observability-only views over backend and collector signals | Supporting operator visibility | Workflow product truth, workflow logic, or audit evidence records |

## Boundary Examples

### Example 1: Validation cites topology evidence

Correct later pattern:

- a future `validation_result` remains a workflow-owned record
- it cites a persisted topology snapshot through `evidence_reference`
- it may also cite one current topology read-model record if the chronology is
  explicitly current

Incorrect pattern:

- the current topology response is stored as the validation result itself

### Example 2: Workflow blocker uses readiness context

Correct later pattern:

- a future `workflow_blocker` is its own workflow-owned record
- it cites one or more current readiness blockers or persisted readiness
  snapshots through `evidence_reference`
- the current readiness record remains global planning-support context

Incorrect pattern:

- a current readiness blocker is silently promoted into a per-workflow blocker
  just because a workflow later references the same limitation

### Example 3: Post hoc observation after future execution

Correct later pattern:

- a future `execution_record` remains a workflow-owned record
- a future workflow audit event documents execution completion or observation
- a persisted sync run is cited as later post hoc observation evidence

Incorrect pattern:

- the sync run itself is treated as the execution record or as proof that the
  workflow execution lifecycle already existed

### Example 4: Audit linkage around validation

Correct later pattern:

- a future `audit_linkage` ties one `validation_result` to one workflow-grade
  audit event
- `audit_linkage` may cite evidence references that explain chronology,
  staleness, or bounded truth

Incorrect pattern:

- `audit_linkage` stores the full audit event payload or replaces the
  validation result itself

## Anti-Patterns

The following patterns should be treated as design mistakes.

1. Reusing current sync-derived workflow-history as durable workflow lifecycle
   state.
2. Reusing current audit-history projections as workflow audit truth.
3. Treating persisted snapshots as workflow revisions or preview artifacts.
4. Treating readiness summaries or blockers as if they were workflow-scoped
   state by default.
5. Embedding full evidence payloads inside workflow-owned records instead of
   citing them.
6. Embedding full audit-event payloads inside workflow rows or artifact rows.
7. Letting dashboards, metrics, or vendor-native payloads become workflow
   evidence records directly.
8. Inferring workflow chronology from reverse-chronological presentation order
   rather than from workflow-owned transitions and audit linkage.

## Non-Goals

This document does not define:

- workflow APIs
- storage schemas or migrations
- approval semantics
- execution orchestration
- event emission code
- workflow retrieval payload shapes
- any permission to skip the documented phase order

## Transition-Safety Notes

The ownership boundary is only useful if later design and implementation keep
transition safety explicit.

1. Introduce workflow-owned records as new backend-owned entities rather than as
   renamed current `Phase 2` responses.
2. Preserve current `Phase 2` truth posture on evidence that later workflows
   cite; a future citation does not upgrade bounded evidence into stronger truth.
3. Prefer explicit citation and relationship objects over payload duplication.
4. Keep workflow auditability explicit: workflow entities, audit events,
   `audit_linkage`, and `evidence_reference` each keep their own role.
5. Preserve global planning-support readiness records as separate from
   workflow-scoped progression state.
6. Respect the existing implementation order: workflow-owned state and audit
   surfaces come after the read-only foundation, not by relabeling the current
   foundation into something it is not.

## Conservative Bottom Line

Current `Phase 2` evidence is a future input, not a hidden workflow system.

- read-side responses remain evidence
- persisted snapshots remain evidence storage
- readiness and blocker metadata remain planning-support context
- workflow-owned entities remain the only valid home for future lifecycle and
  artifact state
- workflow audit records remain separate from both workflow-owned entities and
  cited evidence

If a later design step cannot say which one of those domains owns a field or a
record, the ownership boundary is still too weak and workflow work should stay
in planning only.