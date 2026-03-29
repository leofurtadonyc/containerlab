# ADR-0006: Rollback orchestration v1 (bounded operator intent compensation)

## Status

Accepted.

## Context

Safe action v1 durably applies operator `intent_state` to `policy_operator_intent_records`. Operators need a **credible recovery path** when that change must be undone in a **bounded, auditable** way without pretending to revert devices.

## Decision

Introduce **rollback orchestration v1**:

- Durable `rollback_requests` / `rollback_events` with linkage to parent safe action, optional workflow, and pre-rollback validation.
- One supported rollback type: **`policy_operator_intent_rollback_v1`**, implementing **compensation** via a new intent row (prior state from the chain when known; otherwise `unknown`).
- **Pre-rollback** validation must be a passing **`post_change`** validation for the same policy, with stale/expiry checks at create and execute.
- **Metrics:** `platform_app_api_rollbacks_total` and execute duration counters, parallel to safe actions.

## Consequences

- Recovery is **honest** about platform scope and does not imply device rollback.
- Future rollback families can add new `rollback_type` values without reusing safe action semantics.
