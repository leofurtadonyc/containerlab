# ADR-0005 — Safe action workflows v1 (bounded platform execution)

## Status

Accepted.

## Context

The platform had durable **workflow lifecycle**, **preview / diff**, and **validation** foundations, all explicitly non-actuating. Operator narrative required an honest first **execution** capability without turning preview or validation into execution proxies, without Grafana or client-only authority, and without implying multi-vendor control breadth.

## Decision

1. Implement **backend-owned** safe actions with **real Postgres persistence** of a single v1 slice: `policy_static_local_operator_intent_record_v1` writing `policy_operator_intent_records` (platform intent overlay; **not** device push).
2. **Mandatory** capability gating (`static_policy_detail`), **preview** prerequisite (`generated`, not stale), and **validation** prerequisite (`pre_change`, `pass`, not stale, not expired).
3. **Mandatory** bounded approval (`approve` before `execute`) and workflow `approved` before execute.
4. **Separate** artifacts and language from preview diffs, validation verdicts, evidence deltas, replay/export, and workflow-history sync semantics (see `SafeActionSafetyFraming`).
5. **Decision model** `allowed` / `blocked` / `unsupported` / `unknown` surfaced consistently in APIs and UI.
6. **Rollback** fields exist as placeholders only; **no** rollback execution in v1.
7. **Observability**: `platform_app_api_safe_actions_total` family for request lifecycle visibility.
8. **Phase**: Introduces **Phase 5 — bounded safe action** slice while preserving Phase 2 read-only domains and honest limits; does **not** claim generalized orchestration.

## Consequences

- New routes under `/api/v1/actions` and migrations for `safe_actions`, `safe_action_events`, `policy_operator_intent_records`.
- WebUI **Safe action** workspace for bounded demos; operators must read explicit non-claims.
- Workflow lifecycle may transition to `executing` / `succeeded` / `failed` when bound to an executed action.
- Future post-check validation may attach via `post_check_validation_id` without redesign.

## References

- `platform/docs/safe-action-workflow-contract-v1.md`
- `agent/sdn/safe-action-workflows-task-prompt-v1.md`
