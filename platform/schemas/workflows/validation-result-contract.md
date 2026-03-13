# Validation Result Contract

## Purpose

This document defines the future bounded contract shape for validation results that may later support preview-adjacent or preflight reasoning.

It is a design artifact only.

It does not introduce:

- a validation engine
- executable validation rules
- device interaction
- execution planning
- approval behavior
- rollback behavior

## Phase Boundary

The platform remains in `Phase 2 — read-only product foundation`.

So this contract is future-oriented design groundwork only.

It must not be treated as an implemented API or a live validation surface.

## Contract Role

The future validation-result contract exists to answer one bounded question:

Given the current platform-owned evidence, support posture, blockers, and uncertainty, what validation conclusion can the platform state honestly for this workflow revision or preview slice?

The contract does not exist to answer:

- whether execution will succeed
- whether the network will converge
- what commands would run
- whether approval should be granted automatically
- whether rollback will be feasible

## Validation Result Shape

The future `validation_result` contract should remain normalized, vendor-neutral, and explicit about evidence strength.

### Conceptual fields

| Field | Type | Purpose |
| --- | --- | --- |
| `api_version` | `string` | Version marker for the future validation-result API family. |
| `validation_result_id` | `string` | Durable validation artifact identity. |
| `workflow_id` | `string or null` | Future workflow identity when the result belongs to a durable workflow record. |
| `workflow_revision_id` | `string or null` | Specific revision this validation applies to. |
| `preview_id` | `string or null` | Associated preview artifact when validation depends on preview output. |
| `lifecycle_state` | `string` | Canonical workflow lifecycle posture after validation. |
| `validation_scope` | `object` | Structured description of what slice was actually evaluated. |
| `validation_status` | `string` | Overall bounded status such as `passed`, `failed`, `blocked`, `unknown`, or `insufficient_evidence`. |
| `summary` | `string` | Short explanation of what the result does and does not establish. |
| `validation_checks` | `array` | Individual normalized checks that contributed to the overall result. |
| `validation_evidence` | `array` | Explicit evidence records used by the validation surface. |
| `blockers` | `array` | Explicit blockers that constrained the result. |
| `unsupported_conditions` | `array` | Explicit unsupported areas that limit or prevent stronger conclusions. |
| `insufficient_evidence_conditions` | `array` | Explicit evidence shortfalls that limit or prevent stronger conclusions. |
| `support_posture_summary` | `object` | Aggregated support posture across the evaluated scope. |
| `evidence_confidence_summary` | `object` | Aggregated evidence posture, freshness, and confidence. |
| `notes` | `array` | Additional honesty-preserving context. |

### Conceptual validation result example

```json
{
  "api_version": "v1alpha-validation",
  "validation_result_id": "validation-321",
  "workflow_id": null,
  "workflow_revision_id": null,
  "preview_id": "preview-789",
  "lifecycle_state": "validation_failed",
  "validation_scope": {
    "workflow_kind": "bounded_policy_change",
    "policy_ids": ["policy-123"],
    "device_ids": ["pe1", "p1"]
  },
  "validation_status": "failed",
  "summary": "A bounded normalized validation slice failed because the requested preference change conflicts with current policy constraints that are supported strongly enough for this slice.",
  "validation_checks": [
    {
      "check_id": "check-1",
      "check_name": "policy_constraint_compatibility",
      "check_kind": "constraint_validation",
      "check_status": "failed",
      "support_status": "supported",
      "evidence_basis": "persisted_validated",
      "evidence_coverage": "strong",
      "summary": "The requested preference would violate a normalized bounded constraint.",
      "notes": [
        "Conceptual contract example only."
      ]
    }
  ],
  "validation_evidence": [
    {
      "reference_kind": "policy_snapshot",
      "reference_id": "policy-snapshot-123",
      "source_domain": "policy",
      "evidence_basis": "persisted_validated",
      "evidence_coverage": "strong",
      "freshness_posture": "current",
      "confidence_posture": "strong",
      "support_status": "supported"
    }
  ],
  "blockers": [],
  "unsupported_conditions": [],
  "insufficient_evidence_conditions": [],
  "support_posture_summary": {
    "supported": 1,
    "partially_supported": 0,
    "unsupported": 0,
    "unknown": 0,
    "not_implemented_in_platform": 0
  },
  "evidence_confidence_summary": {
    "strong": 1,
    "bounded": 0,
    "degraded": 0,
    "blocked": 0,
    "unknown": 0
  },
  "notes": [
    "This result is a bounded validation conclusion, not an execution verdict."
  ]
}
```

## Validation Check Shape

Each `validation_checks[]` element should stay normalized and explicit.

### Minimum fields

| Field | Type | Purpose |
| --- | --- | --- |
| `check_id` | `string` | Stable identity for the check result inside the validation artifact. |
| `check_name` | `string` | Stable normalized name of the check. |
| `check_kind` | `string` | Normalized class such as `constraint_validation`, `scope_validation`, or `evidence_consistency`. |
| `check_scope` | `object` | Scope actually evaluated by this check. |
| `check_status` | `string` | `passed`, `failed`, `blocked`, `unknown`, or `insufficient_evidence`. |
| `support_status` | `string` | Capability-aligned support posture such as `supported`, `partially_supported`, `unsupported`, `unknown`, or `not_implemented_in_platform`. |
| `evidence_basis` | `string` | Capability-aligned basis such as `live_validated`, `persisted_validated`, `platform_probe`, `design_review`, or `roadmap_only`. |
| `evidence_coverage` | `string` | `strong`, `bounded`, `partial`, or `blocked`. |
| `summary` | `string` | Short explanation of the check outcome. |
| `evidence_references` | `array` | Platform-owned evidence used by the check. |
| `blockers` | `array` | Check-level blockers. |
| `unsupported_conditions` | `array` | Check-level unsupported areas. |
| `insufficient_evidence_conditions` | `array` | Check-level evidence shortfalls. |
| `notes` | `array` | Additional honesty-preserving caveats. |

## Validation Evidence Shape

The future `validation_evidence[]` array should align with current capability and preview evidence semantics.

The identity and citation rules for each validation evidence reference should follow:

- `platform/schemas/workflows/evidence-reference-contract.md`

### Minimum fields

| Field | Type | Purpose |
| --- | --- | --- |
| `evidence_reference_id` | `string` | Stable opaque citation identity. |
| `evidence_kind` | `string` | High-level evidence family such as `persisted_snapshot`, `comparison_record`, or `capability_record`. |
| `reference_kind` | `string` | Specific platform-owned record kind being cited. |
| `source_domain` | `string` | Inventory, topology, policy, capability, readiness, workflow_history, audit, or integration health. |
| `source_record_id` | `string` | Stable cited record identity. |
| `citation_role` | `string` | Why this evidence is cited for the validation result. |
| `chronology` | `object` | Time anchors that apply to the cited evidence. |
| `posture_summary` | `object` | Bounded truth posture carried by the citation. |
| `relevance_summary` | `string` | Why this evidence matters to the validation result. |
| `notes` | `array` | Additional context about evidence limits. |

## Unsupported Condition Shape

Unsupported conditions must be explicit instead of hidden in free text.

### Minimum fields

| Field | Type | Purpose |
| --- | --- | --- |
| `condition_code` | `string` | Stable normalized unsupported-condition name. |
| `condition_kind` | `string` | Capability, scope, feature, topology slice, policy slice, or validation claim. |
| `support_status` | `string` | Normally `unsupported` or `not_implemented_in_platform`, but may be `unknown` when support truth is itself not established. |
| `summary` | `string` | Human-readable statement of what is unsupported. |
| `affected_scope` | `array` | Which part of the validation scope is affected. |
| `related_capabilities` | `array` | Capability features or records that explain the unsupported condition. |
| `notes` | `array` | Additional honesty-preserving explanation. |

Unsupported conditions are conditions, not verdicts.

They commonly contribute to `blocked` or `unknown`, but they do not by themselves mean `failed`.

## Insufficient Evidence Condition Shape

Insufficient evidence conditions must be explicit whenever a stronger validation claim would overstate current platform truth.

### Minimum fields

| Field | Type | Purpose |
| --- | --- | --- |
| `condition_code` | `string` | Stable normalized insufficient-evidence name. |
| `reason_kind` | `string` | Missing, stale, partial, inconsistent, inferred_only, or unavailable. |
| `source_domain` | `string` | Inventory, topology, policy, capability, workflow, audit, or integration health. |
| `evidence_basis` | `string` | Capability-aligned evidence basis when known. |
| `evidence_coverage` | `string` | `strong`, `bounded`, `partial`, or `blocked`. |
| `summary` | `string` | Human-readable explanation of the shortfall. |
| `affected_scope` | `array` | Which part of the validation scope is affected. |
| `related_evidence_references` | `array` | Evidence references that show the shortfall or gap. |
| `notes` | `array` | Additional context that preserves honesty. |

## What A Validation Result Is Allowed To Claim

A future validation result may claim only:

- bounded pass or fail conclusions for checks supported strongly enough by current platform evidence
- explicit blocked, unknown, unsupported, and insufficient-evidence areas
- explicit evidence basis, evidence coverage, freshness, and confidence posture
- explicit capability-aligned support posture for the evaluated scope
- explicit blocker and condition records that explain weaker conclusions

## What A Validation Result Must Not Claim

A future validation result must not claim:

- guaranteed execution success or failure
- guaranteed network convergence
- approval authorization
- complete topology or policy truth when those domains remain bounded
- exact device-native configuration or command behavior
- remediation completeness or rollback feasibility

## Boundary Reminder

The validation-result contract is a bounded reasoning artifact only.

It is not a validator implementation, not an approval decision, and not an execution plan.