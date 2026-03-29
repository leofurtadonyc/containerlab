# Safe action workflow contract v1

## Purpose

Define the first **backend-owned, capability-gated, prerequisite-enforced safe action** domain for the platform. This contract is authoritative for:

- `POST /api/v1/actions` (create)
- `GET /api/v1/actions` / `GET /api/v1/actions/{action_id}` / `GET /api/v1/actions/{action_id}/timeline`
- `POST /api/v1/actions/{action_id}/approve` / `reject` / `execute` / `cancel`

## Non-goals (explicit)

- Arbitrary multi-vendor configuration push or “execute anything” orchestration
- ODL- or controller-owned execution authority
- Collapsing action artifacts into preview diffs, validation verdicts, evidence deltas, sync-history, exports, or replay
- Enterprise approval policy engines
- Roll back execution (linkage fields only)
- Claiming device or network state changed because the platform stored operator metadata

## Supported v1 action family

| Dimension | Value |
| --- | --- |
| `action_type` | `policy_static_local_operator_intent_record_v1` |
| Target kind | `policy` (exactly one `target_ids` entry) |
| Truth slice | `static_local` policies in normalized inventory only |
| Execution effect | **Postgres insert** into `platform_app.policy_operator_intent_records` (operator intent overlay), optionally chained via `previous_record_id` |

## Request model (create)

Required linkage:

- `workflow_id` — durable `workflow_lifecycles` row, non-terminal at create
- `preview_id` — `preview_requests` row (`policy_static_local_intent_preview_v1`, `intent_state_change`, generated preview)
- `validation_id` — `validation_requests` row (`policy_read_model_observability_v1`, `pre_change`, completed, pass, capability allowed)

Body must match preview targets and `requested_payload.proposed_intent_state` (`declared` \| `unknown`).

## Formal decision model

| Decision | Meaning |
| --- | --- |
| `allowed` | Within v1 scope; prerequisites satisfied at evaluation time |
| `blocked` | In-family but disallowed (stale preview/validation, linkage mismatch, terminal workflow, etc.) |
| `unsupported` | Outside slice (e.g. wrong `action_type`, non-`static_local` policy) |
| `unknown` | Missing workflow/preview/validation rows or insufficient linkage |

## Execution status model

Includes: `received`, `blocked`, `unsupported`, `unknown`, `awaiting_approval`, `ready_to_execute`, `executing`, `succeeded`, `failed`, `partially_failed`, `cancelled`, `invalid` (reserved for malformed create semantics where `action_decision` is persisted as `blocked`).

## Approval model (bounded)

- `approval_required` — `true` for v1
- `approval_state` — `pending` \| `approved` \| `rejected` \| `not_applicable`
- Approver actor fields + `approved_at` / `rejection_reason`
- Approve and execute are **separate** API steps

## Prerequisite enforcement

Enforced on **create** and again on **execute**:

- Workflow exists and is not terminal
- Preview exists, `preview_status=generated`, capability allowed, **not** `stale_posture=truth_changed`
- Validation exists, `validation_status=completed`, `overall_verdict=pass`, capability allowed, **not** stale vs live fingerprint, **not** past `expires_at`
- Capability matrix: Nokia `static_policy_detail` not unsupported
- Payload and IDs align across workflow, preview, validation, and action

## Execution model

1. `POST .../execute` requires `execution_status=ready_to_execute`, `approval_state=approved`, workflow `workflow_status=approved`.
2. Backend transitions workflow toward `executing` / `succeeded` or `failed` around the platform persistence step.
3. Success writes `policy_operator_intent_records` and sets `execution.outcome=succeeded` with `operator_intent_record_id`.

## Post-check linkage

- `post_check_validation_id` is optional and may be set by future programs; v1 does not auto-create post-change validation.

## Rollback placeholders

Persisted columns: `rollback_parent_action_id`, `rollback_workflow_id`, `rollback_ready_state`, `rollback_validation_id`, `compensation_reference` — forward compatible; **no rollback execution** in v1.

## Failure semantics

- **Blocked before execution** — prerequisites or approval gates; `execution_status` `blocked` \| `cancelled` \| `unsupported` \| `unknown` \| `invalid`
- **Execution failure** — persistence or unexpected errors after `executing`; workflow driven to `failed` when transitions succeed
- **Unknown** — never unknown for `execution_status` when outcome is reported; `partially_failed` reserved for future multi-target work

## Concurrency and idempotency

- Optional `idempotency_key` (unique when present); duplicates return the existing row (`200`).
- `execute` is idempotent for `execution_status=succeeded` (returns current detail).

## Observability

Prometheus counters: `platform_app_api_safe_actions_total`, `platform_app_api_safe_action_event_seconds_*`.

## Phase alignment

Implemented under **bounded Phase 5** semantics: one narrow slice with honest non-claims; read-only, preview, and validation domains remain unchanged in meaning.

## References

- `platform/docs/dry-run-preview-diff-contract-v1.md`
- `platform/docs/validation-result-contract-v1.md`
- `platform/docs/workflow-lifecycle-contract.md`
- ADR: `platform/docs/decisions/ADR-0005-safe-action-workflows-v1.md`
