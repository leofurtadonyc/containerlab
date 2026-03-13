# Evidence Reference Contract

## Purpose

This document defines the future platform-owned identity and citation semantics
for `evidence_reference` records used by workflow-owned artifacts.

It is a design artifact only.

It does not introduce:

- workflow behavior
- dry-run APIs
- preview generation
- validation execution
- persistence changes
- raw vendor-native contract shapes

## Phase Boundary

The platform remains in `Phase 2 — read-only product foundation`.

So this document must be treated as design-only groundwork for future
workflow-owned state.

It must not be read as proof that workflow-owned entities, workflow storage, or
workflow APIs already exist.

## Core Rule

An `evidence_reference` is a platform-owned citation object.

It does not duplicate the cited evidence payload.

It points explicitly to one platform-owned evidence source and states why that
source is relevant, what chronology applies, and what bounded truth posture the
reference carries.

## Contract Role

The future `evidence_reference` contract exists to answer four bounded
questions.

1. What platform-owned evidence is being cited?
2. Why is it being cited?
3. What time and freshness posture applies to that evidence?
4. What bounded truth posture should later workflow-owned artifacts preserve
   when they rely on it?

It does not exist to answer:

- whether execution should proceed
- whether validation passed
- whether a preview is complete
- what vendor-native payload produced the evidence

## Identity Shape

The future `evidence_reference` object should remain explicit, vendor-neutral,
and stable.

### Minimum fields

| Field | Type | Purpose |
| --- | --- | --- |
| `evidence_reference_id` | `string` | Stable opaque platform-owned identity for the citation record. Clients must not parse it. |
| `evidence_kind` | `string` | High-level evidence family such as `current_read_model`, `persisted_snapshot`, `comparison_record`, `capability_record`, `readiness_record`, `history_event`, `audit_event`, or `integration_health_record`. |
| `reference_kind` | `string` | Specific platform-owned record kind such as `inventory_snapshot`, `topology_snapshot`, `policy_snapshot`, `readiness_snapshot`, `capability_record`, `policy_comparison_summary`, `sync_run_record`, or `audit_event_record`. |
| `source_domain` | `string` | Inventory, topology, policy, capability, readiness, workflow_history, audit, or integration_health. |
| `source_record_id` | `string` | Stable identity of the cited platform-owned record. |
| `scope_locator` | `object or null` | Optional structured locator for the cited sub-scope such as object identities, field paths, comparison section, or affected claim surface. |
| `citation_role` | `string` | Why the evidence is being cited, such as `supports`, `contextualizes`, `constrains`, `explains_inference`, `explains_unavailable`, `explains_unsupported`, or `explains_staleness`. |
| `chronology` | `object` | Explicit time anchors for the cited evidence. |
| `posture_summary` | `object` | Explicit bounded truth posture carried by the citation. |
| `relevance_summary` | `string` | Short normalized explanation of why this reference matters. |
| `notes` | `array` | Additional honesty-preserving context. |

### Identity example

```json
{
  "evidence_reference_id": "evidence-ref-001",
  "evidence_kind": "persisted_snapshot",
  "reference_kind": "policy_snapshot",
  "source_domain": "policy",
  "source_record_id": "policy-snapshot-20260313-120000z",
  "scope_locator": {
    "object_type": "policy_summary",
    "object_ids": ["pe1"],
    "field_paths": ["target_footprints"]
  },
  "citation_role": "supports",
  "chronology": {
    "time_posture": "historical",
    "observed_at": "2026-03-13T12:00:00Z",
    "persisted_at": "2026-03-13T12:00:05Z",
    "served_at": null,
    "comparison_anchor_ids": [],
    "history_window_summary": null
  },
  "posture_summary": {
    "derivation_posture": "aggregate_only",
    "freshness_posture": "stale",
    "availability_posture": "available",
    "confidence_posture": "bounded",
    "support_posture": "partially_supported"
  },
  "relevance_summary": "Supports a bounded claim about current policy-footprint posture when live policy detail is empty.",
  "notes": [
    "Conceptual contract example only."
  ]
}
```

## Identity Invariants

The future identity model should preserve the following rules.

1. `evidence_reference_id` is platform-owned and opaque.
2. `source_record_id` must always identify a platform-owned record rather than a raw vendor payload.
3. `reference_kind` must stay more specific than `evidence_kind`.
4. `scope_locator` narrows the cited sub-scope, but it does not replace `source_record_id`.
5. `citation_role` expresses why the evidence is cited, not whether the parent artifact is approved, valid, or executable.

## Lifecycle Notes

The future `evidence_reference` lifecycle should remain intentionally narrow.

- an evidence reference is created when a future workflow-owned artifact cites a platform-owned evidence source explicitly
- an evidence reference is immutable in meaning once cited by a durable artifact; later evidence should create a new reference rather than silently rewrite posture or chronology
- the same source record may be cited by multiple workflow-owned artifacts through distinct evidence references if the citation role or scope differs
- supersession belongs to the parent workflow artifact lifecycle, not to the evidence source itself

## Evidence Kinds And Allowed Sources

Allowed evidence must remain platform-owned.

### Allowed evidence kinds

| `evidence_kind` | Allowed platform-owned sources | Must not be overread as |
| --- | --- | --- |
| `current_read_model` | Current backend-owned read models such as devices, topology, policies, capabilities, or readiness summaries | Durable workflow state or validation verdicts |
| `persisted_snapshot` | Persisted normalized inventory, topology, policy, or readiness-support snapshots | Workflow lifecycle records or workflow revisions |
| `comparison_record` | Current-versus-latest-persisted or persisted-versus-previous bounded comparison summaries and attached comparison-ready records | Validation-grade diff truth |
| `capability_record` | Capability matrix records, support-status records, and related capability summaries | A workflow authorization engine |
| `readiness_record` | Readiness summaries, prerequisites, blockers, and assessment records | Preview output, approval readiness, or workflow state |
| `history_event` | Sync-derived workflow-history records or bounded audit-history records used as post hoc read-side evidence | Workflow lifecycle history, approval history, or execution history |
| `audit_event` | Generic audit-event records when they later become explicitly workflow-linked or when current audit views are cited as read-side context only | A complete workflow audit relationship by themselves |
| `integration_health_record` | Platform-owned integration health or controller-health records | Business truth for topology, policy, or workflow state |

### Explicitly disallowed evidence sources

Do not allow `evidence_reference` to point directly to:

- raw vendor-native payloads
- device-native command output as the product contract
- Grafana panels or dashboard definitions
- Prometheus time-series as the primary product evidence record
- ODL payloads that have not been normalized into backend-owned records
- hidden heuristics with no surfaced platform-owned record identity

## Citation Roles

Citation meaning must stay explicit.

### Recommended `citation_role` values

| Value | Meaning |
| --- | --- |
| `supports` | The cited evidence positively supports a bounded claim. |
| `contextualizes` | The cited evidence adds scope, timing, or provenance context without supporting the main claim by itself. |
| `constrains` | The cited evidence helps explain why the parent artifact must stay partial, blocked, or bounded. |
| `explains_inference` | The cited evidence shows that a claim depends on inferred rather than directly observed truth. |
| `explains_unavailable` | The cited evidence shows why a stronger claim is unavailable. |
| `explains_unsupported` | The cited evidence shows why a stronger claim is unsupported in the platform or vendor slice. |
| `explains_staleness` | The cited evidence shows that freshness limits the strength of the parent claim. |

Citation roles are explanatory only.

They are not workflow states, approval decisions, or execution intents.

## Chronology Shape

Chronology must be explicit whenever the cited evidence has time meaning.

### Minimum chronology fields

| Field | Type | Purpose |
| --- | --- | --- |
| `time_posture` | `string` | `current`, `historical`, `mixed`, or `unknown`. |
| `observed_at` | `string or null` | When the underlying state was observed, if the platform knows it. |
| `persisted_at` | `string or null` | When the cited record was persisted, if applicable. |
| `served_at` | `string or null` | When the cited current read model was served or assembled, if applicable. |
| `comparison_anchor_ids` | `array` | Related snapshot or record identities when the citation depends on comparison anchors. |
| `history_window_summary` | `string or null` | Short summary when the citation refers to a bounded time window rather than one point in time. |

### Chronology rules

1. Current read-model references should include `served_at` when they do not point to a persisted snapshot.
2. Persisted snapshot references should include `persisted_at` and `observed_at` when both are known.
3. Comparison-based references should cite comparison anchors explicitly instead of hiding them inside notes only.
4. If chronology is unknown, the contract should say so explicitly rather than implying currency.

## Posture Summary Shape

The future `posture_summary` object should make bounded truth semantics explicit.

### Minimum posture fields

| Field | Type | Purpose |
| --- | --- | --- |
| `derivation_posture` | `string` | `observed`, `inferred`, `aggregate_only`, `comparison_derived`, `post_hoc_observation`, `readiness_only`, or `unknown`. |
| `freshness_posture` | `string` | `current`, `stale`, `mixed`, or `unknown`. |
| `availability_posture` | `string` | `available`, `partial`, `unavailable`, or `unknown`. |
| `confidence_posture` | `string` | `strong`, `bounded`, `degraded`, `blocked`, or `unknown`. |
| `support_posture` | `string` | `supported`, `partially_supported`, `unsupported`, `unknown`, or `not_implemented_in_platform` when relevant. |

### Distinction rules

Use these fields to preserve the following distinctions where they matter.

- `current`: the citation refers to a current or just-served platform-owned read model
- `historical`: the citation refers to a persisted or otherwise explicitly historical record
- `inferred`: the claim depends on backend-owned inference rather than direct observation
- `partial`: the evidence exists but only covers part of the relevant scope
- `unsupported`: the cited capability or platform slice does not support the stronger claim
- `unavailable`: the relevant evidence record is missing or could not be produced honestly
- `stale`: the evidence exists but is too old to overread as current truth

These are descriptive posture cues only.

They are not validation outcomes, risk scores, or execution recommendations.

## Citation Rules

The future citation model should follow these rules.

1. Cite platform-owned records, not raw external payloads.
2. Prefer direct evidence records over notes about evidence.
3. Use separate references for live/current and persisted/historical evidence rather than collapsing them into one ambiguous citation.
4. If a citation depends on a bounded comparison record, cite the comparison record and, when honest and available, its anchor records explicitly.
5. If a claim depends on inferred truth, the citation must say so through `derivation_posture` or `citation_role`.
6. If a claim depends on stale evidence, the citation must say so through `freshness_posture` or `citation_role`.
7. Unsupported or unavailable conditions should be cited through capability, readiness, blocker, or history records that explain the absence honestly rather than through fabricated placeholder evidence.
8. A citation may explain a gap, but it must not pretend that a gap is positive evidence for a stronger claim.

## Scope Locator Rules

`scope_locator` should keep the cited scope narrow without turning the reference
into a domain-specific payload blob.

Recommended fields:

- `object_type`
- `object_ids`
- `field_paths`
- `comparison_section`
- `claim_surface`

Do not place full object payloads inside `scope_locator`.

## What Evidence References Are Allowed To Claim

An `evidence_reference` may claim only:

- what platform-owned record is being cited
- what bounded posture applies to that cited record
- why the cited record matters to the parent artifact
- what chronology anchors apply to the citation

## What Evidence References Must Not Claim

An `evidence_reference` must not claim:

- that the parent workflow should execute
- that validation has passed or failed
- that approval exists
- that raw vendor-native payloads are now product truth
- that stale, unavailable, or inferred evidence is equivalent to current directly observed truth

## Relationship To Other Workflow Contracts

The following documents should treat this file as the identity and citation
source of truth for `evidence_reference`:

- `platform/schemas/workflows/preview-contract.md`
- `platform/schemas/workflows/diff-contract.md`
- `platform/schemas/workflows/validation-result-contract.md`
- `platform/schemas/workflows/blocker-contract.md`
- `platform/schemas/workflows/audit-relationships.md`
- `platform/schemas/workflows/workflow-entity-model.md`

## Explicit Non-Goals

This contract does not define:

- persistence schema or migrations
- workflow entity storage
- preview-generation logic
- validation engine behavior
- approval semantics
- execution semantics
- vendor-specific rendering contracts

## Uncertainty Boundary

If the platform cannot point to a stable platform-owned record with explicit
chronology and bounded posture, then the stronger claim should remain unknown,
partial, unsupported, or unavailable.

The contract should never hide that uncertainty behind generic references.