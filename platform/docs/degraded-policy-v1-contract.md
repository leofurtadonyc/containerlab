# Degraded policy v1 contract

## Purpose

`degraded_policy_v1` is a **bounded, read-only** classification slice attached to each `PolicyRecord` on `GET /api/v1/policies`. It helps operators spot policies that look **operationally limited** given the **normalized policy inventory fields already exposed** by the API.

It is **not** a synthetic health engine, **not** an SLA or availability guarantee, and **not** a dataplane or traffic-engineering resolution verdict.

## Contract id

- **`contract_id`:** `degraded_policy_v1` (stable string on `DegradedPolicyV1Classification`).

## Fields

| Field | Meaning |
| --- | --- |
| `posture` | `ok` — no v1 reason codes fired. `degraded` — at least one reason code. `unknown` — bounded ambiguity (e.g. support unknown) without claiming “healthy operationally”. |
| `reason_codes` | Ordered list of stable machine keys (see below). Empty when `posture` is `ok` or `unknown` per v1 rules. |
| `confidence` | `low` or `medium` — confidence in **this assembly**, not in forwarding. |
| `summary` | One-line operator readout; repeats posture semantics, not a verdict. |
| `explicit_non_claims` | Always populated with the default non-claim keys unless overridden later; see below. |

## Reason codes (v1)

Emitted when inventory signals match; derived **only** from existing `PolicyInventoryRecord` fields and the row `current_posture` / `stale` signal shared with candidate-path rows.

| Code | When |
| --- | --- |
| `intent_declared_observed_not_active` | `intent_state == "declared"` and `observed_state` in `inactive`, `degraded`. |
| `persisted_row_stale` | Row posture for the policy is `stale` (live collector unavailable with persisted fallback). |
| `partial_or_unsupported_support_posture` | `support_state` in `partially_supported`, `unsupported`, `not_implemented_in_platform`. |
| `health_not_healthy` | `health_state` in `degraded`, `down`. |
| `no_active_candidate_path_when_paths_present` | At least one candidate path exists and **none** has `path_state == "active"`. |

## Explicit non-claims (default)

Every response includes:

- `not_sla_or_availability_guarantee`
- `not_dataplane_or_te_resolution_verdict`
- `not_validation_or_safe_to_change_authority`
- `not_replacement_for_controller_computed_policy_truth`

## WebUI (policies page)

On **Policies**, the primary inventory table includes a **Degraded (v1)** column (posture pill plus a short reason hint). The toolbar adds a **Degraded policy (v1)** filter (all / degraded / unknown / ok), optional sort **Degraded v1 posture then name**, and **State distribution** summarizes counts for each v1 posture. These controls reuse the same contract as the API—interpretation support, not a global health score.

## Implementation

- Schema: `platform/app-api/src/app_api/schemas/degraded_policy_v1.py`
- Assembly: `platform/app-api/src/app_api/services/degraded_policy_v1.py`
- Response wiring: `platform/app-api/src/app_api/services/policies.py` (`build_policies_list_response`)
- List hints / filter helpers: `platform/app-web/src/lib/presentation.ts` (`buildDegradedPolicyV1ListRowHint`, `matchesDegradedPolicyV1PostureFilter`)

## Out of scope (v1)

- Write paths, automation, or change authority
- Cross-domain scoring or ranking
- Inferring dataplane behavior beyond stated inventory fields
