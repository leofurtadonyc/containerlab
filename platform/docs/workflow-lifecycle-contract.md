# Workflow lifecycle foundation contract

## Purpose

This document defines the **durable workflow lifecycle** domain: backend-owned **workflow records** and **transition events** stored in PostgreSQL. It is **not**:

- **`GET /api/v1/workflow-history`** — that endpoint remains **sync-derived persisted activity** (`read_side_sync`), documented as workflow-*style* history, not this lifecycle model.
- **Dry-run, validation, approval policy, or network execution** — those are **out of scope** until dedicated engines exist.

The lifecycle APIs manage **records and state transitions only**. They do **not** act on devices, controllers, or the network.

## Entity model

### Workflow record (`workflow_lifecycles`)

| Field | Meaning |
| --- | --- |
| `id` | UUID string — durable workflow identifier (`workflow_id` in APIs). |
| `workflow_type` | Boring string label (e.g. `platform_change`) — not vendor workflow engine semantics. |
| `workflow_status` | One of: `requested`, `planned`, `approved`, `rejected`, `dry_run_ready`, `executing`, `succeeded`, `failed`, `cancelled`. |
| `title` / `description` | Human context — not execution proof. |
| `target_scope` | JSON object — scope metadata (devices, policies, topology object ids, etc.) — **bounded**, not blast-radius truth. |
| `capability_decision` | JSON placeholder for future capability attachment (`posture`, notes). |
| `actor_created` / `actor_updated` | Placeholder identity strings — **not** full RBAC. |
| `audit_attachment_hint` | Optional JSON hook for future workflow-grade audit linkage. |
| `created_at` / `updated_at` | Timestamps (UTC). |

### Transition event (`workflow_lifecycle_events`)

| Field | Meaning |
| --- | --- |
| `id` | UUID event id. |
| `workflow_id` | FK to workflow. |
| `prior_status` / `next_status` | Lifecycle states (`prior` null on create). |
| `event_type` | e.g. `created`, `transition`. |
| `occurred_at` | Timestamp. |
| `actor` | Placeholder identity. |
| `reason` | Optional operator message. |
| `metadata` | Bounded JSON (column name `metadata` in DB). |
| `provenance` | `system` \| `operator` \| `api` — coarse provenance marker. |

## API surface (`/api/v1/workflow-lifecycle`)

| Method | Path | Behavior |
| --- | --- | --- |
| `GET` | `/workflow-lifecycle` | List lifecycle records (newest first), `limit` 1–100. |
| `POST` | `/workflow-lifecycle` | Create a workflow record + initial `created` event. |
| `GET` | `/workflow-lifecycle/{id}` | Workflow detail. |
| `GET` | `/workflow-lifecycle/{id}/timeline` | Ordered transition history. |
| `POST` | `/workflow-lifecycle/{id}/transitions` | Record a bounded transition; **409** if workflow is **terminal** (`succeeded`, `failed`, `cancelled`, `rejected`). |

Response `contract_id` values: `workflow_lifecycle_list_v1`, `workflow_lifecycle_record_v1`, `workflow_lifecycle_timeline_v1`.

## Non-claims

- **Not network actuation** — state changes are **database records**, not configuration pushes.
- **Not dry-run or validation** — status names are **forward-compatible placeholders** only.
- **Not sync-run history** — do not merge with `workflow-history` items.
- **Actor identity is placeholder** — until real auth integration is scoped.

## Future extension

- Attach dry-run runs, validation results, and execution correlation **by reference** to workflow id — without collapsing sync history into lifecycle rows.
- Workflow-grade audit events may reference `audit_attachment_hint` and event ids.

## References

- Sync-style history (unchanged): `platform/docs/data-flows.md`, `GET /api/v1/workflow-history`
- Operational status: `agent/sdn/03-CURRENT-STATUS.md`
