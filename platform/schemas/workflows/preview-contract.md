# Preview Contract

## Purpose

This document defines the future bounded contract shape for workflow preview requests and preview responses.

It is a design artifact only.

It does not introduce:

- a preview engine
- dry-run execution
- config rendering
- command generation
- device interaction
- validation behavior

## Phase Boundary

The platform remains in `Phase 2 — read-only product foundation`.

So this contract is a future-oriented design shape only.

It must not be treated as an implemented API.

## Contract Role

The future preview contract exists to answer one bounded question:

What normalized platform-facing changes are likely to be relevant for this requested action, given the current evidence, support posture, blockers, and uncertainty?

The preview contract does not exist to answer:

- what exact device commands would run
- what exact configuration text would be pushed
- whether execution will succeed
- whether validation will pass
- whether rollback will be possible

## Preview Request Shape

The future `preview_request` contract should remain vendor-neutral and normalized.

### Conceptual fields

| Field | Type | Purpose |
| --- | --- | --- |
| `api_version` | `string` | Version marker for the future preview API family. |
| `workflow_kind` | `string` | The bounded workflow class being previewed. |
| `requested_action` | `string` | The normalized action intent. |
| `scope` | `object` | Structured scope of devices, policies, topology domains, or services affected. |
| `requested_by` | `object` | Future actor or source context, such as user, system, or integration source. |
| `intent_input` | `object` | The normalized desired intent input, not raw vendor-native payload. |
| `input_references` | `array` | References to existing platform-owned records the preview depends on. |
| `preview_options` | `object` | Bounded options such as whether to include an inline diff artifact or evidence references. |
| `client_context` | `object` | Optional non-authoritative caller context for traceability only. |
| `notes` | `array` | Caller-supplied explanatory notes that do not change backend meaning. |

### Conceptual request example

```json
{
  "api_version": "v1alpha-preview",
  "workflow_kind": "bounded_policy_change",
  "requested_action": "adjust_policy_preference",
  "scope": {
    "device_ids": ["pe1", "p1"],
    "policy_ids": ["policy-123"],
    "topology_scope": "affected_path_segment"
  },
  "requested_by": {
    "actor_type": "user",
    "actor_id": "operator-a"
  },
  "intent_input": {
    "target_outcome": "prefer_path_b",
    "bounded_constraints": ["no_new_headends"]
  },
  "input_references": [
    {
      "reference_kind": "policy_record",
      "reference_id": "policy-123"
    },
    {
      "reference_kind": "topology_snapshot",
      "reference_id": "topology-snapshot-456"
    }
  ],
  "preview_options": {
    "include_diff_artifact": true,
    "include_evidence_references": true,
    "strict_unsupported_detection": true
  },
  "notes": [
    "Future-oriented conceptual example only."
  ]
}
```

## Preview Response Shape

The future `preview_response` contract should return a bounded normalized interpretation of the request.

### Conceptual fields

| Field | Type | Purpose |
| --- | --- | --- |
| `api_version` | `string` | Version marker for the future preview response. |
| `preview_id` | `string` | Durable preview artifact identity. |
| `workflow_id` | `string or null` | Future workflow identity when the preview belongs to a durable workflow record. |
| `lifecycle_state` | `string` | Future workflow lifecycle posture after preview generation, using the canonical vocabulary. |
| `preview_status` | `string` | Bounded preview posture such as `generated`, `partial`, `blocked`, or `unsupported`. |
| `summary` | `string` | Short normalized explanation of what the preview can and cannot say. |
| `preview_metadata` | `object` | Metadata about the request basis, model posture, scope coverage, and freshness. |
| `diff_artifact` | `object or null` | Future normalized diff artifact when available. |
| `evidence_references` | `array` | References to current platform evidence used to support the preview. |
| `uncertainty_summary` | `object` | Explicit uncertainty posture and reasons. |
| `blockers` | `array` | Explicit blocker records showing what prevented a fuller preview. |
| `unsupported_elements` | `array` | Explicit unsupported workflow, policy, topology, or capability areas. |
| `assumptions` | `array` | Assumptions the preview had to rely on. |
| `notes` | `array` | Explanatory notes that preserve honesty around bounded truth. |

### Conceptual response example

```json
{
  "api_version": "v1alpha-preview",
  "preview_id": "preview-789",
  "workflow_id": null,
  "lifecycle_state": "preview_generated",
  "preview_status": "partial",
  "summary": "The platform can describe bounded policy and topology impact at the normalized model level, but policy truth and topology truth remain partial.",
  "preview_metadata": {
    "scope_coverage_posture": "bounded_partial",
    "model_posture": {
      "inventory": "strong_for_current_slice",
      "topology": "bounded_partial",
      "policy": "bounded_partial"
    },
    "freshness_posture": "mixed",
    "generated_from_request_revision": 1
  },
  "diff_artifact": {
    "diff_artifact_id": "diff-789",
    "diff_status": "bounded_partial"
  },
  "evidence_references": [
    {
      "reference_kind": "policy_snapshot",
      "reference_id": "policy-snapshot-123"
    },
    {
      "reference_kind": "topology_snapshot",
      "reference_id": "topology-snapshot-456"
    }
  ],
  "uncertainty_summary": {
    "uncertainty_posture": "bounded_partial",
    "reasons": [
      "Topology remains inference-heavy.",
      "Per-policy detail coverage is incomplete."
    ]
  },
  "blockers": [
    {
      "blocker_code": "policy_truth_still_bounded",
      "severity": "major"
    }
  ],
  "unsupported_elements": [
    {
      "element_kind": "preview_claim",
      "element_id": "exact_device_commands",
      "summary": "The preview cannot claim exact command generation."
    }
  ],
  "assumptions": [
    "The latest persisted normalized policy snapshot is representative enough for bounded comparison.",
    "No hidden controller-side topology enrichment changes the current read-side truth posture."
  ],
  "notes": [
    "Conceptual contract example only.",
    "This response is not an execution guarantee."
  ]
}
```

## Preview Metadata Shape

The future `preview_metadata` object should make the contract honest about the basis of its output.

### Minimum metadata fields

- `scope_coverage_posture`
- `model_posture`
- `freshness_posture`
- `generated_from_request_revision`
- `served_evidence_timestamp_summary`
- `support_posture_summary`
- `contract_posture`

### Recommended posture values

- `strong_for_current_slice`
- `bounded_partial`
- `partial`
- `blocked`
- `unsupported`

These values should remain descriptive, not probabilistic.

## Preview Evidence References

The future `evidence_references` array should make clear what platform-owned evidence supports the preview.

### Minimum evidence reference fields

| Field | Type | Purpose |
| --- | --- | --- |
| `reference_kind` | `string` | Such as `inventory_snapshot`, `topology_snapshot`, `policy_snapshot`, `capability_record`, or `audit_event`. |
| `reference_id` | `string` | Stable record identity. |
| `source_domain` | `string` | Inventory, topology, policy, capability, workflow, audit, or integration health. |
| `observed_at` | `string or null` | Observed timestamp when relevant. |
| `persisted_at` | `string or null` | Persisted timestamp when relevant. |
| `freshness_posture` | `string` | Current, stale, mixed, or unknown. |
| `confidence_posture` | `string` | Strong, bounded, degraded, blocked, or unknown. |
| `notes` | `array` | Why this reference matters to the preview. |

## Preview Status Values

The future preview contract should separate preview posture from workflow lifecycle posture.

Recommended preview statuses:

- `generated`
- `partial`
- `blocked`
- `unsupported`

Meaning:

- `generated`: a bounded preview exists and no current blocker prevents generation for the current scope
- `partial`: a bounded preview exists, but material uncertainty or unsupported coverage remains
- `blocked`: a preview cannot be generated honestly for the current request state
- `unsupported`: the request asks for a workflow class or scope the platform does not support

## What A Preview Is Allowed To Claim

A future preview may claim only:

- normalized platform-facing objects likely to be affected
- explicit support posture and unsupported scope
- explicit assumptions used by the preview
- explicit blocker and uncertainty posture
- evidence references and freshness posture
- bounded change summaries at the normalized model layer

## What A Preview Must Not Claim

A future preview must not claim:

- exact CLI commands
- exact device-native configuration snippets
- guaranteed runtime success
- guaranteed validation success
- guaranteed rollback feasibility
- complete topology truth when topology remains inferred or partial
- complete policy truth when policy coverage remains bounded
- approval outcome or execution authorization

## Boundary Reminder

The preview contract must remain a bounded explanation surface.

It is not itself a validation verdict, an approval artifact, or an execution plan.