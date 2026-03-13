# Diff Contract

## Purpose

This document defines the future bounded contract shape for a normalized diff artifact.

It is design-only contract groundwork.

It does not introduce:

- configuration diff generation
- command diff generation
- device-native rendering
- execution planning behavior
- rollback planning behavior

## Contract Role

The future diff artifact exists to describe bounded normalized change semantics.

It should answer:

- which normalized platform-facing objects appear affected
- whether the effect is additive, subtractive, modified, unchanged, or unknown
- which parts are supported, partial, unsupported, blocked, or uncertain

It should not answer:

- what exact vendor commands will run
- what exact line-by-line configuration changes will occur
- whether the network will converge successfully

## Diff Artifact Shape

### Conceptual fields

| Field | Type | Purpose |
| --- | --- | --- |
| `diff_artifact_id` | `string` | Stable diff artifact identity. |
| `preview_id` | `string` | Preview artifact this diff belongs to. |
| `diff_status` | `string` | Overall posture such as `generated`, `bounded_partial`, `blocked`, or `unsupported`. |
| `diff_kind` | `string` | Future normalized diff class such as `proposed_vs_current` or `proposed_vs_latest_persisted`. |
| `scope_summary` | `object` | Summary of the workflow scope represented by this diff. |
| `change_counts` | `object` | Aggregate counts by change type and certainty posture. |
| `changes` | `array` | Individual normalized change records. |
| `blockers` | `array` | Artifact-level blockers that constrained the diff. |
| `uncertainty_summary` | `object` | Artifact-level uncertainty posture and reasons. |
| `notes` | `array` | Explanatory notes preserving bounded semantics. |

### Conceptual diff artifact example

```json
{
  "diff_artifact_id": "diff-789",
  "preview_id": "preview-789",
  "diff_status": "bounded_partial",
  "diff_kind": "proposed_vs_current",
  "scope_summary": {
    "policy_ids": ["policy-123"],
    "device_ids": ["pe1", "p1"]
  },
  "change_counts": {
    "add": 0,
    "remove": 0,
    "modify": 2,
    "unchanged": 3,
    "unknown": 1
  },
  "changes": [],
  "blockers": [],
  "uncertainty_summary": {
    "uncertainty_posture": "bounded_partial",
    "reasons": [
      "Policy detail coverage is incomplete for some observed policy types."
    ]
  },
  "notes": [
    "Conceptual contract example only.",
    "This artifact is normalized and vendor-neutral rather than device-native."
  ]
}
```

## Individual Change Record Shape

Each `changes[]` element should remain small, explicit, and normalized.

The identity and citation rules for each `evidence_references` entry should
follow:

- `platform/schemas/workflows/evidence-reference-contract.md`

### Minimum fields

| Field | Type | Purpose |
| --- | --- | --- |
| `change_id` | `string` | Stable identity for the change record inside the artifact. |
| `domain` | `string` | Inventory, topology, policy, capability, workflow, or integration health. |
| `object_type` | `string` | Product-level object type such as `policy_record`, `topology_link`, or `inventory_device`. |
| `object_identity` | `object` | Stable normalized identity of the affected object. |
| `change_type` | `string` | `add`, `remove`, `modify`, `unchanged`, or `unknown`. |
| `change_posture` | `string` | `supported`, `partially_supported`, `unsupported`, or `blocked`. |
| `field_diffs` | `array` | Normalized field-level before/after records when honest to provide. |
| `evidence_references` | `array` | Supporting platform-owned evidence records. |
| `blockers` | `array` | Change-specific blockers. |
| `uncertainty` | `object` | Change-specific uncertainty posture and reasons. |
| `notes` | `array` | Explanatory caveats. |

### Field diff shape

The future `field_diffs[]` entries should stay normalized and avoid device-native config semantics.

Minimum fields:

- `field_path`
- `before_value`
- `after_value`
- `value_posture`
- `notes`

Recommended `value_posture` values:

- `exact_for_current_slice`
- `bounded_projection`
- `unsupported`
- `unknown`

## Diff Status Values

Recommended artifact-level statuses:

- `generated`
- `bounded_partial`
- `blocked`
- `unsupported`

Meaning:

- `generated`: the platform can express the diff artifact honestly for the current supported scope
- `bounded_partial`: the artifact exists but includes material unknown, unsupported, or inferred portions
- `blocked`: the artifact cannot be produced honestly because required foundations are missing
- `unsupported`: the request scope is outside the delivered product capability

## What A Diff Is Allowed To Claim

A future diff artifact may claim only:

- normalized object-level adds, removes, modifies, unchanged areas, and unknown areas
- explicit field-level before and after values only where the platform truth is stable enough
- explicit blockers, unsupported areas, and uncertainty reasons
- evidence-backed bounded projections at the product model layer

## What A Diff Must Not Claim

A future diff artifact must not claim:

- exact line-by-line device-native configuration diff
- exact command sequence or transaction plan
- complete topology or policy truth where the platform itself remains bounded
- execution safety verdicts
- validation verdicts
- rollback plan or rollback guarantee

## Boundary Reminder

The diff artifact is a normalized comparison artifact only.

It is not a rendered configuration plan, not an approval artifact, and not evidence that execution should proceed.