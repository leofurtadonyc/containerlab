# Workflow-Owned State Implementation Prerequisites

## Purpose

This document defines the concrete implementation prerequisites that must exist
before future workflow-owned entities can be introduced safely.

It is a design and sequencing artifact only.

It does not introduce:

- workflow behavior
- dry-run APIs
- approval behavior
- rollback behavior
- execution behavior
- a phase change

## Phase Boundary

The platform remains in `Phase 2 — read-only product foundation`.

So this document must be interpreted as implementation-prerequisite planning for
later workflow-owned state, not as permission to start building workflow
surfaces now.

## Core Rule

Future workflow-owned state must be added only after ownership boundaries are
explicit across four distinct domains:

- read-side evidence
- persisted evidence snapshots
- readiness and blocker metadata
- workflow-owned state

Those domains may reference each other later, but they must not be collapsed
into one overloaded model or table family.

## Ownership Boundary Matrix

| Domain | Current owner | What it represents | What it may support later | What it must not be overread as |
| --- | --- | --- | --- | --- |
| Read-side evidence | `app-api` backend-owned normalized read models fed by collector and bounded integrations | Current observed, inferred, partial, empty, stale, and fallback product truth for inventory, topology, policy, capabilities, and history views | Evidence inputs for later preview, validation, blocker explanation, and audit context | Workflow state, approval state, execution state, or validation verdicts |
| Persisted evidence snapshots | `app-api` persistence for normalized snapshots and bounded history context | Durable copies of read-side evidence and comparison-ready context such as inventory, topology, policy, sync-run, and readiness-support snapshots | Stable evidence references for future workflow artifacts and audit linkages | Workflow lifecycle records, workflow revisions, or preview or diff artifacts |
| Readiness and blocker metadata | `app-api` capability and readiness contracts | Planning-support metadata about prerequisites, blockers, support posture, evidence basis, and readiness scope | Future prerequisite vocabulary and blocker taxonomy for workflow planning and validation | Per-workflow-instance blocker state, workflow eligibility, preview output, or approval readiness by itself |
| Workflow-owned state | Future backend-owned workflow domain in `app-api` | Durable workflow identity, revisions, lifecycle transitions, workflow-scoped blockers, preview and validation artifacts, approvals, executions, and audit relationships | The only valid home for future workflow lifecycle and action-oriented state | A relabeling of sync history, snapshots, readiness metadata, or dashboard signals |

## Boundary Rules

The following ownership rules must remain explicit.

1. Read-side evidence stays evidence even when it becomes an input to later workflow reasoning.
2. Persisted snapshots stay evidence storage and must not be repurposed into workflow-instance tables.
3. Readiness and blocker metadata stay planning-support posture until workflow-owned records exist.
4. Future workflow state must be persisted as its own backend-owned entity family rather than inferred from sync history, readiness timestamps, or comparison summaries.
5. `app-web` may present workflow-owned state later, but it must not own workflow truth.
6. Grafana, Prometheus, ODL, and raw collector logic must not become workflow-state owners.

## Prerequisite Layers

The next implementation prerequisites for future workflow-owned state should be
sequenced in the following order.

### Layer 1: Evidence Reference Boundary

Before workflow-owned entities exist, the repository needs a stricter design for
how workflow artifacts will cite current read-side evidence honestly.

Minimum prerequisite outcomes:

- define one normalized `evidence_reference` identity strategy for persisted snapshots, bounded comparisons, readiness snapshots, and later audit-linked observations
- keep `reference_kind`, `source_domain`, `observed_at`, `persisted_at`, `freshness_posture`, and `confidence_posture` explicit rather than implied
- preserve the current distinction between live evidence, persisted fallback, inferred evidence, aggregate-only evidence, and detail-unavailable evidence

Why this layer comes first:

- workflow-owned records must point to evidence explicitly instead of copying read-side payloads into workflow tables
- later preview, diff, validation, and audit linkage will otherwise drift into duplicated or contradictory truth

The design source of truth for this prerequisite layer should be:

- `platform/schemas/workflows/evidence-reference-contract.md`

### Layer 2: Workflow Root Storage Foundation

Before preview, validation, or approval artifacts are even considered, the
backend needs a durable root record family for workflow-owned state.

Minimum prerequisite outcomes:

- a future `workflow` record as the durable top-level identity
- a future `workflow_revision` record so intent changes are revision-scoped rather than field-overwritten
- a future `workflow_state_transition` record so lifecycle chronology is explicit instead of inferred from the latest state only
- clear separation between workflow-owned tables and existing read-side snapshot tables

Storage rules:

- do not reuse `sync_runs` as workflow lifecycle storage
- do not store workflow revisions inside readiness or capability tables
- do not overload inventory, topology, policy, or readiness snapshot rows with workflow state fields

### Layer 3: Workflow Artifact Persistence Boundary

After root workflow storage is designed, later workflow artifacts need their own
durable persistence boundary.

Minimum prerequisite outcomes:

- separate future storage families for `preview_artifact`, `diff_artifact`, and `validation_result`
- explicit future storage for workflow-scoped `workflow_blocker` records
- explicit future storage for `approval_record`, `execution_record`, and `rollback_record` only when those later phases are actually in scope

Storage rules:

- preview, diff, and validation must not be collapsed into one generic payload blob
- workflow-scoped blockers must remain distinct from current planning-readiness blockers
- approval and execution records must not appear until the project reaches their later phase boundaries

### Layer 4: Audit Linkage Foundation

Workflow-owned state must not rely on the current sync-derived audit-history
surface as if it were already workflow audit truth.

Minimum prerequisite outcomes:

- define a durable `audit_linkage` relationship record between workflow-owned entities and audit events
- keep `audit_event` content separate from `audit_linkage` relationship data
- preserve explicit `relationship_kind`, `chronology_role`, and cited `evidence_reference` fields
- treat current sync-derived and readiness-snapshot-derived audit-history events as evidence context only until workflow-owned audit linkage exists

Audit rules:

- do not relabel current `workflow-history` records into workflow lifecycle transitions
- do not relabel current `audit-history` events into approval, execution, or rollback audit history
- do not embed full audit payloads inline in workflow rows or artifact rows

### Layer 5: API Sequencing Boundary

Workflow APIs should be introduced only after ownership and storage layers are
stable enough that each endpoint can expose backend-owned workflow truth rather
than inferred read-side analogues.

Required sequencing:

1. stabilize workflow-owned entity and relationship vocabulary in docs and schemas
2. define migrations and storage boundaries for workflow root records and linkage records
3. implement backend-owned repositories and internal service boundaries for workflow persistence
4. expose read-only retrieval APIs for workflow-owned records only after the stored entities are real
5. only later consider preview-generation, validation, approval, or execution-triggering APIs in the phases that allow them

API rules:

- do not expose public workflow endpoints backed only by sync-run history or readiness metadata
- do not make preview or validation endpoints before workflow and revision persistence exist
- do not make approval or execution endpoints before audit linkage and lifecycle persistence exist

### Layer 6: Workflow-State Persistence Readiness Check

Before any future implementation starts, the repository should be able to answer
the following questions with concrete design artifacts rather than assumptions.

1. What is the durable workflow root record?
2. What is the durable workflow revision record?
3. How is lifecycle chronology persisted explicitly?
4. How are workflow-scoped blockers separated from current readiness blockers?
5. How are preview, diff, and validation artifacts stored separately?
6. How do workflow-owned records cite read-side evidence without duplicating truth?
7. How do workflow-owned records link to audit events without treating audit events as workflow state?
8. Which future endpoint family is read-only retrieval first, and which endpoint families remain out of scope until later phases?

If those questions are not answered clearly, workflow-owned state is still not
ready to be introduced.

## Recommended Future Storage Families

This is a design-only storage breakdown, not a migration plan.

| Storage family | Purpose | Must stay separate from |
| --- | --- | --- |
| `workflow` and `workflow_revision` | Durable workflow identity and revision lineage | Sync history, snapshot tables, readiness tables |
| `workflow_state_transition` | Explicit lifecycle chronology | Latest-state-only workflow fields, audit-event payloads |
| `preview_artifact`, `diff_artifact`, `validation_result` | Workflow-owned analysis artifacts | Read-side comparisons, readiness summaries, generic blobs |
| `workflow_blocker` and later `workflow_prerequisite` mappings | Workflow-scoped progression constraints | Global readiness and blocker metadata |
| `audit_linkage` | Workflow-to-audit relationship layer | Audit-event tables, workflow root tables |
| `evidence_reference` | Reusable references to persisted evidence | Workflow payload duplication, implicit provenance |

## Concrete Non-Goals

This prerequisite plan does not authorize:

- workflow endpoints
- preview generation
- validation execution
- approval handling
- rollback handling
- workflow UI implementation
- status-file phase inflation

## Final Constraint

The correct next use of this document is to guide later design-first and
schema-first work so that future workflow-owned state has a safe ownership,
storage, API, and audit baseline.

It must not be used to claim that workflow behavior already exists.