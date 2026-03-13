# Blocker Contract

## Purpose

This document defines the future bounded contract shape for blockers used by preview, diff, validation, approval, or later workflow artifacts.

It is design-only contract groundwork.

It does not introduce:

- a rule engine
- automatic blocker generation
- execution control behavior
- approval control behavior

## Contract Role

The future blocker contract exists to explain why the platform cannot honestly make a stronger claim for a given workflow surface.

A blocker is not just a warning.

It is an explicit statement that some contract, truth, capability, scope, freshness, dependency, or history limitation materially constrains what the platform can say.

## Blocker Shape

### Conceptual fields

| Field | Type | Purpose |
| --- | --- | --- |
| `blocker_id` | `string` | Stable blocker record identity. |
| `blocker_code` | `string` | Stable normalized blocker name. |
| `category` | `string` | Contract, truth, capability, scope, freshness, dependency, or history. |
| `severity` | `string` | `critical` or `major`. |
| `summary` | `string` | Human-readable explanation of what the blocker prevents. |
| `blocker_scope` | `object` | Structured description of where the blocker applies. |
| `support_status` | `string` | Capability-aligned support posture relevant to the blocker. |
| `evidence_basis` | `string` | Capability-aligned evidence basis explaining how the blocker was determined. |
| `evidence_coverage` | `string` | `strong`, `bounded`, `partial`, or `blocked`. |
| `related_capabilities` | `array` | Capability records or features tied to the blocker. |
| `related_evidence_references` | `array` | Platform-owned evidence that supports the blocker. |
| `affected_claims` | `array` | Which claims the blocker prevents, such as `validation_pass`, `preview_completeness`, or `diff_precision`. |
| `notes` | `array` | Additional honesty-preserving explanation. |

### Conceptual blocker example

```json
{
  "blocker_id": "blocker-44",
  "blocker_code": "topology_truth_still_bounded",
  "category": "truth",
  "severity": "major",
  "summary": "The current topology model is still too bounded to support a complete path-impact validation claim for this scope.",
  "blocker_scope": {
    "scope_kind": "validation_check",
    "workflow_kind": "bounded_policy_change",
    "claim_surface": "validation_result",
    "domain": "topology",
    "object_type": "path_segment",
    "object_ids": ["segment-a"]
  },
  "support_status": "partially_supported",
  "evidence_basis": "persisted_validated",
  "evidence_coverage": "bounded",
  "related_capabilities": [
    "topology_path_inference"
  ],
  "related_evidence_references": [
    {
      "reference_kind": "topology_snapshot",
      "reference_id": "topology-snapshot-456"
    }
  ],
  "affected_claims": [
    "validation_pass",
    "validation_fail"
  ],
  "notes": [
    "Conceptual contract example only."
  ]
}
```

## Blocker Scope Shape

The future `blocker_scope` object should make the blocked surface explicit.

### Minimum fields

| Field | Type | Purpose |
| --- | --- | --- |
| `scope_kind` | `string` | Workflow, workflow_revision, preview_artifact, diff_artifact, validation_result, validation_check, approval_record, execution_record, or evidence_reference. |
| `workflow_kind` | `string or null` | Future workflow class when relevant. |
| `claim_surface` | `string` | Which contract surface is blocked, such as `preview_response`, `diff_artifact`, or `validation_result`. |
| `domain` | `string` | Inventory, topology, policy, capability, workflow, audit, or integration health. |
| `object_type` | `string or null` | Product-level object type impacted by the blocker. |
| `object_ids` | `array` | Stable normalized object identities affected by the blocker. |
| `field_paths` | `array` | Optional field-level paths blocked from stronger claims. |
| `scope_summary` | `string` | Human-readable summary of where the blocker applies. |

## Severity Definitions

Blocker severities should remain intentionally narrow.

### `critical`

Use `critical` when the blocker prevents any honest positive or negative verdict for the blocked claim surface.

Examples:

- the required contract surface does not exist yet
- the relevant capability is not implemented in the platform
- the evidence basis is blocked or unavailable for the entire requested slice

### `major`

Use `major` when the blocker prevents a complete or stronger claim for a material portion of the scope, but a bounded partial result may still exist.

Examples:

- topology truth is bounded for a path-impact sub-scope
- policy detail coverage is partial for a subset of objects
- freshness gaps limit the reliability of a stronger claim

### Severity boundary

Do not add `minor` or informational blocker severities.

If a condition does not materially constrain what the platform can claim, it should be modeled as:

- a note
- a caveat
- an unsupported condition
- an insufficient-evidence condition

not as a blocker.

## Recommended Categories

Recommended blocker categories:

- `contract`
- `truth`
- `capability`
- `scope`
- `freshness`
- `dependency`
- `history`

These categories intentionally align both with current readiness blockers and with the broader preview and diff semantics already documented.

## What A Blocker Is Allowed To Claim

A blocker may claim only:

- what claim surface is constrained
- why a stronger claim would be dishonest
- what evidence, support posture, or dependency caused the limitation
- whether the limitation is total for the blocked surface or material for a bounded sub-scope

## What A Blocker Must Not Claim

A blocker must not claim:

- that execution will fail in runtime terms
- a remediation guarantee
- approval outcome
- hidden vendor-native reasoning that is not exposed in the normalized contract

## Relationship To Unsupported And Insufficient Evidence Conditions

Unsupported and insufficient-evidence conditions are not always blockers.

They become blockers when they materially prevent the platform from producing an honest verdict or artifact for the affected claim surface.

## Boundary Reminder

The blocker contract is an explanation surface only.

It does not itself implement validation, approval, or execution behavior.