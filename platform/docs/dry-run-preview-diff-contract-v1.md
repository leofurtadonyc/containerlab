# Dry-run / preview / diff contract v1

## Purpose

Define the **first backend-owned** dry-run / preview / diff surface for Phase 2: **bounded pre-change reasoning** over normalized product models, without network execution, validation verdicts, or rollback actuation.

This contract is authoritative for:

- `POST /api/v1/previews` (create + evaluate)
- `GET /api/v1/previews` (list)
- `GET /api/v1/previews/{preview_id}` (detail + staleness posture)
- `GET /api/v1/previews/{preview_id}/diff` (diff + truth fingerprints)
- `GET /api/v1/previews/{preview_id}/timeline` (preview lifecycle events)

## Non-goals (explicit)

- Network configuration changes or controller writes
- Post-change validation engines or safe-to-change verdicts
- Raw vendor config text diff (unless separately and honestly supported)
- Evidence export, replay, sync-history deltas, or workflow-history semantics (see separation below)

## Supported workflow family (v1)

**`policy_static_local_intent_preview_v1`**

- **Target kind:** `policy`
- **Action:** `intent_state_change` (label only; not executed)
- **Payload:** `requested_payload.proposed_intent_state` ∈ `declared` | `unknown`
- **Truth:** Uses current normalized **Policies** inventory (`build_policies_list_response`) and capability row **`static_policy_detail`**.

## Preview decision semantics

| Decision    | Meaning |
|------------|---------|
| `allowed`  | Preview generated within v1 scope and current capability/truth bounds. |
| `blocked`  | Conceptually in family but disallowed (e.g. policy evidence blocked, no change, capability unsupported). |
| `unsupported` | Outside v1 scope (e.g. non-`static_local` policy). |
| `unknown`   | Insufficient inventory match (e.g. policy id not in current list). |

## Preview status

Stored `preview_status` aligns with decision: `generated` (allowed), `blocked`, `unsupported`, `unknown`, plus `invalid` / `expired` reserved for future use.

## Diff model

Normalized **product-term** diff only for v1:

- `diff_type`: `policy_intent_state_v1`
- Single primary field: `intent_state` with `change_kind` `modify` or `no_change`

Raw SR OS policy configuration is **out of scope**.

## Capability gating

Evaluation checks:

- Capability matrix row **`static_policy_detail`** — `unsupported` blocks preview.
- Policies **`evidence_confidence.confidence_posture == blocked`** blocks preview.

## Truth scope and staleness

- Each preview stores a **`truth_fingerprint`** derived from policies `data_status`, `serving_mode`, and sorted policy ids.
- Detail and diff endpoints recompute a **current** fingerprint; if it differs, `stale_posture` is `truth_changed` (preview may be stale relative to live inventory).

## Separation from other surfaces

| Surface | What it is |
|---------|------------|
| **Preview engine** | Prospective change in normalized terms; durable `preview_requests` / `preview_events`. |
| Evidence delta / timeline | Observed history and comparisons; not prospective execution. |
| Evidence replay | Imported frozen exports; not live preview. |
| Maintenance preview | Maintenance-oriented assembly; not the same contract as `preview_engine_policy_static_local_intent_v1`. |

## Workflow linkage

Optional `workflow_id` FK to `workflow_lifecycles`. Missing workflow returns **404**. Previews do not mutate workflow state.

## Idempotency

Optional `idempotency_key`: second identical create returns **200** with the same `preview_id` (replay semantics).

## Extension placeholders

Response `linkage_hints` and persistence `extension_hints` reserve fields for future validation and execution references without implying they are implemented.

## Contract id

`preview_engine_policy_static_local_intent_v1`
