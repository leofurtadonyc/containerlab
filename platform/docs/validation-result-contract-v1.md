# Validation-result contract v1 (policy read-model observability)

## Purpose

Define the **first backend-owned validation-result model** for the platform: explicit requests, explicit capability decisions, explicit check-level verdicts, explicit evidence attachments, and explicit overall aggregation — **without** implying execution, approval, or safe-change authority.

This contract is authoritative for **`/api/v1/validations`** behavior in v1.

## Non-claims (read first)

- Validation is **not** network execution or configuration push.
- Validation is **not** operator approval or change authorization.
- Validation is **not** a preview diff (`/api/v1/previews`), evidence delta, evidence replay export, or sync-history artifact.
- A **pass** verdict means only: *within the bounded check definitions, the read-model evidence satisfied the check* — not “the network is correct” or “the change is safe.”
- **unknown** and **not_applicable** are first-class outcomes and must never be silently mapped to pass or fail.

## Supported validation types (v1)

| `validation_type` | Meaning |
| --- | --- |
| `policy_read_model_observability_v1` | Evaluate whether a **single** normalized `policy_id` can be observed through the current **policy read model** with bounded truth-depth semantics. |

## Supported contexts

- `pre_change` — recorded for workflow/preview linkage; evaluation uses current read model (no implied future state).
- `post_change` — same engine path in v1; semantics are **descriptive** (context is recorded for future expansion), not dataplane proof.

## Supported target kinds (v1)

- `policy` — exactly **one** `policy_id` in `target_ids`.

## Validation status model

`validation_status` on the stored request:

- `completed` — evaluation finished (including blocked/unsupported outcomes that still produce a durable result envelope).
- Future versions may add `received`, `running`, `expired`, etc.; clients should tolerate unknown values defensively.

## Capability decision model (`capability_decision_state`)

- **allowed** — matrix allows the validation type; engine may run checks.
- **blocked** — conceptually supported but refused by safety/read-path rules (e.g. policy collector unavailable, terminal workflow when `workflow_id` is set).
- **unsupported** — type/target outside supported v1 scope or capability matrix reports unsupported static-policy detail.
- **unknown** — reserved for future use when truth cannot be classified confidently before checks.

## Verdict model (`overall_verdict` and check `verdict`)

- `pass` — all mandatory checks for the request evaluated to pass.
- `fail` — at least one check evaluated to fail.
- `unknown` — at least one mandatory check is unknown and none failed.
- `not_applicable` — no applicable checks ran (e.g. capability blocked before checks).

### Aggregation rules (v1)

1. If any check is `fail` → overall `fail`.
2. Else if any check is `unknown` → overall `unknown`.
3. Else if all checks are `not_applicable` → overall `not_applicable`.
4. Else if all checks are `pass` → overall `pass`.

## Check model (v1 stable ids)

| `check_id` | Role |
| --- | --- |
| `capability_gate_v1` | Capability matrix allows `static_policy_detail` for Nokia-first scope. |
| `policy_inventory_non_empty_v1` | Policy inventory read path exposes bounded metadata (may be unknown if empty/degraded). |
| `policy_record_present_v1` | Requested `policy_id` exists in normalized inventory items. |
| `policy_observation_truth_depth_v1` | Truth depth (detail mode / support posture) sufficient for bounded observation vs unknown. |

## Evidence model

Each run returns `evidence[]` with stable `evidence_id` references from checks (`evidence_refs`). Evidence is **backend-owned summaries** of read APIs — not raw vendor payloads.

## Workflow and preview linkage

- Optional `workflow_id` and `preview_id` foreign keys on `validation_requests`.
- If `workflow_id` points at a **terminal** workflow (`succeeded`, `failed`, `cancelled`, `rejected`), validation is **blocked** with `overall_verdict=not_applicable`.
- Preview records may list `validation_result_ids` in `PreviewLinkageHints` for forward navigation (population of those hints from validation creation is optional in v1).

## Staleness

`GET /api/v1/validations/{id}` may set `stale_posture` to `truth_changed` when the live policy read-model fingerprint differs from the fingerprint captured at creation time.

## APIs

- `POST /api/v1/validations` — create + evaluate (synchronous).
- `GET /api/v1/validations` — list (newest first).
- `GET /api/v1/validations/{id}` — detail.
- `GET /api/v1/validations/{id}/timeline` — ordered events.

## Idempotency

Optional `idempotency_key`: duplicate posts with the same key return **200** with the existing validation.

## Future extension placeholders

`extension_hints` / linkage DTOs reserve fields for: `approval_record_ids`, `execution_reference`, `rollback_parent_workflow_id`, `post_check_validation_parent_id`, `validation_supersedes_validation_id`, `capability_decision_id` (nullable in v1).

## Observability

Prometheus counters (in-process) include `platform_app_api_validation_requests_total` and validation generation seconds histograms — see `app-api` `/metrics`.
