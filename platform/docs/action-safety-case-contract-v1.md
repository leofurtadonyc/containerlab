# Action safety case v1

## Purpose

`action_safety_case_v1` is the first backend-owned assembly that brings the bounded workflow pieces together for one action:

- workflow lifecycle
- preview
- preview diff
- validation
- safe action
- rollback readiness
- evidence quality
- controller evidence
- blocking gates, warning gates, missing evidence, and operator next steps

It is an operator review surface. It is not device actuation, safe-to-execute authority, production approval, ODL authority, or Grafana-derived product truth.

## HTTP contract

```text
GET /api/v1/actions/{action_id}/safety-case
```

Response contract id:

```text
action_safety_case_v1
```

Missing action behavior:

```text
404 action_not_found
```

The route is colocated under `/actions` because the assembly is action-primary. It does not create a new workspace, workflow engine, action state transition, or rollback state transition.

## Final bounded posture

The response emits one `final_bounded_posture`:

| Posture | Meaning |
| --- | --- |
| `ready_for_review` | Existing artifacts are present and no blocking gate was found. This is still review language only. |
| `blocked` | A backend-owned gate blocks review, such as validation not passing or action status being blocked/failed/invalid. |
| `degraded_evidence` | Required workflow artifacts may be present, but evidence quality is weak enough that the operator should treat the case as evidence-limited. |
| `rollback_not_ready` | The action has completed but no associated rollback request is present. This does not prove the network is unsafe; it marks rollback-preparedness as absent. |
| `awaiting_validation` | Validation evidence is missing. |
| `not_executable` | The action is unsupported or otherwise outside the executable v1 slice. |
| `unknown` | The action or supporting persisted state is too incomplete to classify confidently. |

## Assembly sources

The service assembles existing bounded data only:

- `safe_actions` row for action identity, decision, approval, execution, and prerequisite notes
- `workflow_lifecycles` row for workflow state
- `preview_requests` plus `GET /api/v1/previews/{preview_id}` for preview and stale posture
- `GET /api/v1/previews/{preview_id}/diff` for diff summary
- `validation_requests` plus `GET /api/v1/validations/{validation_id}` for validation verdict and stale posture
- `GET /api/v1/evidence-quality-workspace` for read-side evidence quality
- `GET /api/v1/controller/evidence` for controller evidence posture
- `rollback_requests` rows linked by `parent_action_id` for rollback readiness

The service must not infer hidden network truth, fabricate missing rollback evidence, or treat ODL/controller evidence as authoritative device state.

## Gate semantics

`blocking_gates[]` are gates that prevent the action from being presented as review-ready. Examples:

- action decision is not `allowed`
- action execution status is blocked, failed, partially failed, cancelled, or invalid
- validation verdict is not `pass`

`warning_gates[]` are operator review cautions. Examples:

- evidence quality is `mixed_degraded` or `heavily_limited`
- a completed action has no associated rollback request

`missing_evidence[]` records absent supporting artifacts. Missing evidence is explicit; it is not silently treated as success.

## Explicit limitations

The safety case always carries limitations equivalent to:

- It does not execute device changes.
- It does not claim safe-to-execute authority.
- Safe action v1 remains platform-only operator intent overlay, not device or controller configuration push.
- Rollback readiness is platform rollback orchestration readiness, not proof of device restore.
- Controller evidence is supporting read-side posture only; ODL is not the source of truth.
- Evidence quality summarizes bounded read-side weakness; weak evidence is not a network-safety verdict.

## WebUI posture

The existing Safe Action Workspace renders the safety case after action creation/execution. It does not create a new workspace and does not change action transitions.

## Production spine relationship

This contract is a Phase 5 bounded product-depth slice. It helps operators understand the state of current bounded artifacts, but it does not satisfy the production-entry or real-device-actuation gates in [`production-prerequisite-spine.md`](./production-prerequisite-spine.md).
