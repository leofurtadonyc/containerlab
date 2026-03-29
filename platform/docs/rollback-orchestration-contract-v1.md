# Rollback orchestration contract v1

## Purpose

Provide a **real, backend-owned, bounded rollback orchestration** path so operators can recover from a supported safe action by **compensating the platform operator intent overlay** in Postgres—not by reverting network devices.

## Supported rollback family (v1)

- **Type:** `policy_operator_intent_rollback_v1`
- **Compensation:** Insert a new `policy_operator_intent_records` row that restores `intent_state` to the **prior overlay value** when the chain allows it; otherwise apply **`unknown`** with explicit semantics.
- **Non-claim:** This is **not** byte-for-byte device or controller configuration undo.

## Eligibility (enforced)

- Parent **safe action** exists, `action_type` is `policy_static_local_operator_intent_record_v1`, and **execution** is `succeeded`.
- Parent is **not** already compensated (`compensated_by_rollback_id` is null).
- **No** other rollback for the same parent is in `awaiting_approval`, `ready_to_execute`, `executing`, or `succeeded`.
- **Pre-rollback validation** (`pre_rollback_validation_id`) is required: durable row must be `policy_read_model_observability_v1`, context **`post_change`**, completed with **pass**, capability **allowed**, same **policy** target, **current** stale posture, and not expired (live check at create and execute).
- **Capability** and **static_local** policy rules align with safe action v1.

## Execution model

1. Create a **dedicated rollback workflow** (`rollback_operator_intent_v1`) when the rollback request is **allowed**.
2. **Approve** then **execute** transitions the rollback workflow like other lifecycle records.
3. **Execute** inserts a new intent record, sets `rollback_request_id` on that row, sets `compensated_by_rollback_id` on the parent safe action, and records metrics.

## API

- `POST /api/v1/rollbacks`, `GET /api/v1/rollbacks`, `GET /api/v1/rollbacks/{id}`, `GET /api/v1/rollbacks/{id}/timeline`
- `POST …/approve`, `…/reject`, `…/execute`, `…/cancel`

## Post-check

- Field `post_rollback_validation_id` is reserved for linking a future post-rollback validation artifact; v1 does not automate it.

## Explicit non-claims

- Not universal undo, not multi-vendor rollback, not evidence replay or export semantics.
