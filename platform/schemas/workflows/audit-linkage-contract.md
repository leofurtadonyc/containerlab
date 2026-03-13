# Audit Linkage Contract

## Purpose

This document defines the future platform-owned identity, chronology, and
ordering semantics for `audit_linkage` records.

It is a design artifact only.

It does not introduce:

- workflow behavior
- audit-engine implementation
- approval or rollback implementation
- persistence changes
- workflow APIs
- phase changes

## Phase Boundary

The platform remains in `Phase 2 — read-only product foundation`.

So this document must be treated as design-only groundwork for later
workflow-owned auditability.

It must not be read as proof that workflow-linked audit records, workflow-owned
retrieval APIs, approval systems, or execution systems already exist.

## Core Rule

An `audit_linkage` is a platform-owned relationship object.

It binds one future workflow-owned entity or artifact to one audit event and
states how that event belongs in workflow chronology.

It does not replace:

- the workflow-owned entity
- the audit event
- the workflow lifecycle transition record
- the evidence reference

## Contract Role

The future `audit_linkage` contract exists to answer five bounded questions.

1. Which workflow-owned record is related to the audit event?
2. Which audit event is being linked?
3. Why does this relationship exist?
4. Where does this relationship belong in workflow chronology?
5. What supporting evidence, if any, explains the linkage or its bounded truth posture?

It does not answer:

- whether a workflow is approved
- whether execution should proceed
- whether validation passed
- what the full audit-event payload is
- whether the linked record should be treated as current truth by itself

## Identity Shape

The future `audit_linkage` object should remain explicit, vendor-neutral, and
stable.

### Minimum fields

| Field | Type | Purpose |
| --- | --- | --- |
| `audit_linkage_id` | `string` | Stable opaque platform-owned identity for the relationship record. Clients must not parse it. |
| `workflow_id` | `string` | Top-level workflow identity that owns the linked entity. |
| `workflow_revision_id` | `string or null` | Specific workflow revision when the linkage is revision-scoped. |
| `linked_entity_kind` | `string` | `workflow`, `workflow_revision`, `workflow_state_transition`, `preview_artifact`, `diff_artifact`, `validation_result`, `workflow_blocker`, `approval_record`, `execution_record`, or `rollback_record`. |
| `linked_entity_id` | `string` | Stable identity of the linked workflow-owned record. |
| `audit_event_id` | `string` | Stable identity of the linked audit event. |
| `relationship_kind` | `string` | Why the audit event is related, such as `documents`, `records_transition`, `constrains`, `approves`, `rejects`, `observes`, `supersedes`, or `summarizes`. |
| `chronology_role` | `string` | Where the event belongs in workflow chronology, such as `request_time`, `revision_time`, `state_transition_time`, `preview_time`, `validation_time`, `approval_time`, `execution_time`, `rollback_time`, `observation_time`, or `archival_time`. |
| `chronology` | `object` | Explicit timing anchors for the linkage. |
| `ordering` | `object` | Explicit ordering semantics within the relevant workflow scope. |
| `link_status` | `string` | `active`, `superseded`, `retracted`, or `unknown`. |
| `link_reason` | `string` | Short normalized explanation of why this relationship exists. |
| `evidence_references` | `array` | Optional platform-owned evidence references that explain the linkage or its bounded posture. |
| `notes` | `array` | Additional honesty-preserving context. |

### Identity example

```json
{
  "audit_linkage_id": "audit-link-001",
  "workflow_id": "wf-001",
  "workflow_revision_id": "wf-rev-002",
  "linked_entity_kind": "validation_result",
  "linked_entity_id": "validation-002",
  "audit_event_id": "audit-event-114",
  "relationship_kind": "documents",
  "chronology_role": "validation_time",
  "chronology": {
    "event_occurred_at": "2026-03-13T12:00:11Z",
    "event_recorded_at": "2026-03-13T12:00:12Z",
    "linkage_recorded_at": "2026-03-13T12:00:12Z",
    "workflow_stage_recorded_at": "2026-03-13T12:00:11Z",
    "time_source_posture": "audit_event_time",
    "derived_from_linked_record": false
  },
  "ordering": {
    "sequence_scope": "workflow_revision",
    "sequence_number": 5,
    "previous_audit_linkage_id": "audit-link-000",
    "supersedes_audit_linkage_id": null
  },
  "link_status": "active",
  "link_reason": "Documents that the platform recorded a validation result for this workflow revision.",
  "evidence_references": [
    {
      "evidence_reference_id": "evidence-ref-014"
    }
  ],
  "notes": [
    "Conceptual contract example only."
  ]
}
```

## Identity Invariants

The future identity model should preserve the following rules.

1. `audit_linkage_id` is platform-owned and opaque.
2. One `audit_linkage` binds exactly one linked workflow-owned record to exactly one audit event.
3. `audit_linkage` must never be used as a container for the full audit-event payload.
4. `workflow_revision_id` should be present whenever the linked entity is revision-scoped or when chronology would otherwise be ambiguous.
5. `relationship_kind` explains the relationship; it is not a workflow state.
6. `chronology_role` places the link in workflow chronology; it is not by itself proof that the linked record is approved, executable, or final.
7. `evidence_references` are optional explanatory citations and must follow [platform/schemas/workflows/evidence-reference-contract.md](platform/schemas/workflows/evidence-reference-contract.md). They must not replace `audit_event_id`.

## Chronology Shape

Chronology must be explicit whenever the linkage has time meaning.

### Minimum chronology fields

| Field | Type | Purpose |
| --- | --- | --- |
| `event_occurred_at` | `string or null` | When the linked audit event actually occurred, if known. This is the primary chronology anchor. |
| `event_recorded_at` | `string or null` | When the audit event was durably recorded, if different from occurrence time. |
| `linkage_recorded_at` | `string` | When the linkage record itself was created. |
| `workflow_stage_recorded_at` | `string or null` | Optional timestamp for the linked workflow stage or transition when it differs from the audit event time. |
| `time_source_posture` | `string` | `audit_event_time`, `linked_record_time`, `mixed`, or `unknown`. |
| `derived_from_linked_record` | `boolean` | Whether chronology was inferred from the linked workflow-owned record rather than carried directly by the audit event. |

### Chronology rules

1. `event_occurred_at` is the primary chronology anchor for ordering whenever it is known.
2. `linkage_recorded_at` must not be used as a substitute for `event_occurred_at` unless the event occurrence time is genuinely unavailable.
3. If the linked relationship documents a workflow stage transition, `workflow_stage_recorded_at` may repeat or refine the same bounded moment, but it must not silently contradict `event_occurred_at`.
4. If chronology is inferred or mixed, `time_source_posture` and `notes` must say so explicitly.
5. Current sync-derived history can support only post hoc observation chronology today. It cannot support requested, approved, executing, or rollback chronology semantics as if those stages already existed.

## Ordering Shape

Ordering must be explicit so that later workflow-owned retrieval APIs do not
infer chronology from unstable presentation order.

### Minimum ordering fields

| Field | Type | Purpose |
| --- | --- | --- |
| `sequence_scope` | `string` | Scope within which the link participates in ordered chronology, such as `workflow`, `workflow_revision`, `linked_entity`, `approval_chain`, or `execution_attempt`. |
| `sequence_number` | `integer` | Monotonic order within the chosen `sequence_scope`. |
| `previous_audit_linkage_id` | `string or null` | Optional explicit predecessor within the same scope when later retrieval should navigate the chain directly. |
| `supersedes_audit_linkage_id` | `string or null` | Optional explicit prior linkage displaced by this linkage. |

### Ordering rules

1. Ordering is defined only within `sequence_scope`. There is no requirement for one global total order across unrelated workflows.
2. Within the same `sequence_scope`, the preferred order is:
   - `event_occurred_at`
   - `sequence_number`
   - `audit_linkage_id` as a deterministic tiebreaker only
3. `sequence_number` must be monotonic within the same `sequence_scope`, even when two events share the same timestamp.
4. `previous_audit_linkage_id` is optional navigation help, not the source of truth for order. If present, it must agree with `sequence_number`.
5. `supersedes_audit_linkage_id` is for lineage and replacement semantics, not simple chronological adjacency.
6. Supersession must not silently rewrite prior linkage meaning. Later records should add new linkage records rather than mutate old ones into different chronology roles.

## Relationship Rules Between Linked Records

The future linkage model should follow these rules.

1. One workflow-owned record may have many audit linkages over time.
2. One audit event may be linked to multiple workflow-owned records when it honestly documents a shared transition or shared observation.
3. `workflow` and `workflow_revision` may each have their own linkage chains; child artifacts must not inherit chronology implicitly without an explicit link.
4. `workflow_state_transition` should be the preferred linked entity when the audit event documents a lifecycle transition specifically.
5. `preview_artifact`, `validation_result`, `workflow_blocker`, `approval_record`, `execution_record`, and `rollback_record` should each link only to the audit events that actually document or observe them.
6. A linkage may summarize or constrain a linked record, but it must not be used to infer stronger state than the linked record and audit event actually support.

## Current Versus Future Audit Distinction

The current platform already exposes bounded history, but it does not yet expose
future workflow-grade audit linkage.

For a strict mapping of which current history sources are reusable later versus
only partial or unsuitable, see
[platform/schemas/workflows/history-audit-linkage-mapping.md](platform/schemas/workflows/history-audit-linkage-mapping.md).

### What current history can support now

Current sync-derived and readiness-snapshot-derived history can support:

- generic audit-event field patterns such as `event_id`, `event_type`, `source`, `actor`, `target_scope`, `result`, and `occurred_at`
- post hoc chronology examples for persisted read-side activity
- evidence-reference inputs that later contextualize workflow-owned artifacts
- bounded wording discipline for what was recorded versus what is merely inferred

### What current history cannot support now

Current history cannot honestly support:

- workflow-created `audit_linkage_id` families
- workflow revision chronology
- approval or rejection chronology
- execution or rollback chronology
- workflow-owned linkage ordering across preview, validation, approval, and execution artifacts
- a complete operator accountability trail

## Relationship To Evidence References

`audit_linkage` and `evidence_reference` must remain complementary but distinct.

- `audit_linkage` answers which workflow-owned record is linked to which audit event and where that relationship belongs in chronology.
- `evidence_reference` answers which platform-owned evidence records explain or constrain the linkage.

### Interaction rules

1. `audit_event_id` is mandatory for `audit_linkage`; `evidence_references` are optional.
2. `evidence_references` should point to platform-owned records that explain the linkage, such as persisted snapshots, comparison records, readiness records, sync-derived history records, or integration-health records.
3. If current sync-derived history is used to support a future workflow-owned artifact, it should normally appear as an `evidence_reference`, not as proof that workflow-grade audit linkage already existed at the time.
4. `evidence_references` may contextualize staleness, unsupported conditions, partial truth, or post hoc observation posture on an audit linkage, but they must not redefine the relationship itself.

## Explicit Non-Goals

This contract does not define:

- an audit event schema redesign
- event-emission behavior
- persistence tables or migrations
- approval-state implementation
- rollback-state implementation
- retrieval API behavior beyond ordering expectations
- background processing semantics

## Final Constraint

Future workflow auditability must remain explicit, backend-owned, and ordered.

But the current platform still has only sync-derived and readiness-derived
history surfaces.

That distinction must remain visible in every later workflow contract and every
later implementation step.