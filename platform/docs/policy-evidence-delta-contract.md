# Policy evidence delta contract (Phase 2, read-only)

## Purpose

This document is the **backend-owned bounded contract** for a future **per-policy evidence delta** product slice: an operator-facing, **side-by-side or diff-style** view of **what appears different** for a selected policy between **current read-side evidence** and a **recent persisted or historical anchor**—so operators can **orient** on change-like signals in the **bounded read models the platform already exposes**—without claiming **drift truth**, **configuration diff authority**, **policy correctness**, or **workflow validation**.

**Policy evidence delta v1** is **evidence-derived** and **policy-scoped**: the subject is a **`policy_id`** on the normalized policy inventory that backs **`GET /api/v1/policies`**. It **compares** fields and postures that are **already** defined on those APIs; it does **not** invent a new controller diff engine, **not** a full YANG or CLI config diff, and **not** a reconciliation verdict.

Stable **`contract_id`:** **`policy_evidence_delta_v1`**

When implemented, semantics must stay aligned with:

- [`policy-evidence-timeline-contract.md`](./policy-evidence-timeline-contract.md) — evidence families and ordering; delta is **orthogonal** (difference across two anchors, not a timeline replacement).
- [`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md) — **`degraded_policy_v1`** posture and reason codes are **classification**, not SLA or dataplane verdicts.
- [`path-analysis-contract.md`](./path-analysis-contract.md) — path-analysis remains **interpretation support**, not dataplane proof.
- [`data-flows.md`](./data-flows.md) — policy **history** and **comparison_to_previous** / **comparison_to_latest_persisted** honesty rules.

---

## Compared sources (v1)

A v1 delta assembly may **only** compare evidence that Phase **2** already exposes read-only:

| Role | Typical source | Meaning |
| --- | --- | --- |
| **Current (“A”)** | The **current** normalized policy row as served by **`GET /api/v1/policies`** for this **`policy_id`** (list or detail semantics), including **`observed_at`**, serving mode, **`degraded_policy_v1`**, candidate-path rows | Live or persisted-fallback **current** slice; **not** guaranteed to be “device truth.” |
| **Previous (“B”) anchor** | A **single** chosen persisted snapshot or history row, **or** a **comparison pair** already defined by policy history (e.g. **latest persisted** vs **previous persisted**, or **current vs latest persisted** per existing API comparison families) | **B** must be **explicitly labeled** in the response (which anchor: `persisted_at`, snapshot id, “previous in history window,” etc.). |

**Disallowed as primary delta inputs:** Grafana panels, Prometheus series as row-level diffs, synthetic “health deltas,” workflow execution payloads as **authoritative** change truth, or **cross-policy** ranking.

---

## Current vs previous anchor behavior

1. **Anchors are explicit** — The response must name **which** “current” snapshot time and **which** “previous” snapshot anchor were used (e.g. **`observed_at`**, **`persisted_at`**, **`snapshot_id`** when present). Operators must not be left guessing whether two rows are **comparable** in the strong sense.
2. **Not every pair is valid** — If only **one** persisted checkpoint exists, **no** “previous snapshot” delta may be claimed; the contract may emit **insufficient-evidence** or **single-anchor-only** mode (see below).
3. **Same comparison posture as policy history** — Where **`GET /api/v1/policies`** already exposes **`comparison_to_latest_persisted`**, **`history`**, or **`comparison_to_previous`**-class semantics, **policy evidence delta v1** should **reuse** those same **bounded** definitions rather than inventing a second reconciliation story.
4. **No merge of unrelated domains** — Inventory or topology freshness may appear as **caveats** only; they do **not** become part of a “policy delta score.”

---

## Delta categories (v1 vocabulary)

Deltas are **categories of observable difference** in normalized fields, not a single severity score.

| Category | Meaning |
| --- | --- |
| **`posture_or_state_field_change`** | Differences in **normalized** inventory fields already exposed (e.g. intent/observed/health/support posture strings) when both anchors carry them. |
| **`degraded_policy_v1_change`** | **`degraded_policy_v1.posture`** or **`reason_codes`** differ between anchors **when both** assemblies ran **`degraded_policy_v1`** — still **not** an SLA or correctness verdict. |
| **`candidate_path_shape_change`** | Bounded differences in **candidate path** rows or counts **when** both anchors expose comparable detail (may be **empty** under counters-only modes). |
| **`path_analysis_availability_change`** | **Support** or **availability** of path-analysis interpretation changed (e.g. `unsupported` vs `partially_supported`) — **not** TE path outcome. |
| **`serving_mode_or_freshness_change`** | Differences in **live vs persisted fallback**, **stale** row posture, or **`observed_at`** gaps — **honesty** about read path, not device fault. |
| **`no_comparable_fields`** | Both anchors exist but **no** overlapping comparable fields for this slice (e.g. detail blocked in one snapshot). |
| **`gap_note`** | Explicit **cannot compare** or **missing anchor** — not a silent empty diff. |

Adding categories that imply **approval**, **validation**, or **automated remediation** requires a **contract revision** and new non-claims.

---

## Unknown / insufficient-evidence behavior

1. **No second anchor** — Emit **`gap_note`**-class semantics: **no delta** object, or a **single-anchor summary** with a clear **“not comparable”** label.
2. **Policy missing from inventory** — Same as other policy APIs: **404** or **not in normalized inventory**; **no** fabricated delta.
3. **History window empty** — Current-only; delta scope may be **“current vs nothing”** only as **unsupported** for delta, not a fake zero diff.
4. **Partial detail** — `detail_mode` / `empty_reason` limits: **no** invented per-policy fields; categories above **downgrade** to **gap** or **partial** with explicit notes.
5. **Path analysis missing on one side** — Mark **unsupported** or **omit** category; do not infer **equality**.

---

## Explicit non-claims

Stable keys (align with schema literals when implemented):

- **`not_drift_truth`** — Differences are **read-side evidence** deltas, not an authoritative drift or configuration-management verdict.
- **`not_config_diff_truth`** — **Not** a full semantic config diff, **not** YANG/CLI equality, **not** replace for device or controller configuration.
- **`not_policy_correctness_verdict`** — **Not** “policy is correct/incorrect” or “intent satisfied.”
- **`not_workflow_validation`** — **Not** tied to workflow execution, approval, or dry-run validation engines.
- **`not_dataplane_or_te_verdict`** — **Not** forwarding, tunnel, or TE outcome proof.
- **`not_replacement_for_timeline`** — Complements [`policy-evidence-timeline-contract.md`](./policy-evidence-timeline-contract.md); does **not** replace chronology or forensic claims.
- **`not_cross_policy_ranking`** — **Not** a comparative score across policies.

---

## Operator-safe copy expectations

- Prefer **“evidence delta”** or **“read-side difference”** over **“drift”**, **“misconfiguration,”** or **“policy change”** unless paired with a **visible** disclaimer that meaning is **evidence-bounded**.
- **Grafana** must **not** own delta semantics; **app-api** and product copy **own** the contract.

---

## Classification vs adjacent contracts

| Contract | Role |
| --- | --- |
| **`policy-evidence-timeline-contract.md`** | Per-policy **time ordering** of anchors; delta is **orthogonal** (difference across two anchors). |
| **`degraded-policy-v1-contract.md`** | Per-row classification; delta may **report** classification **changes** between anchors. |
| **`path-analysis-contract.md`** | Path interpretation; delta may cite **availability** or **shape** changes, not path proof. |
| **Policy inventory / history** (`GET /api/v1/policies`) | **Authoritative** for **which** snapshots and comparisons exist; delta **consumes** them. |

---

## Gap audit: present vs future implementation

### Present

- This document defines **bounded vocabulary** and **non-claims** for **`policy_evidence_delta_v1`**.
- **`GET /api/v1/policies/{policy_id}/evidence-delta`** is implemented in **`app-api`** (see **Future** below for pointers); **WebUI** consumption remains optional follow-on work.

### Future (optional follow-ons)

- **Implemented (read API):** **`GET /api/v1/policies/{policy_id}/evidence-delta`** — **`PolicyEvidenceDeltaResponse`** in **`platform/app-api/src/app_api/schemas/policy_evidence_delta.py`**, assembly in **`platform/app-api/src/app_api/services/policy_evidence_delta.py`**, route on **`platform/app-api/src/app_api/routers/policies.py`**; repository **`pytest`** in **`platform/app-api/tests/test_policy_evidence_delta.py`**. Compares current inventory to the **previous** persisted snapshot row when **`GET /api/v1/policies`** history is **`comparison_ready`**; honest **`comparison_status`** and caveats when anchors are missing or not comparable.
- **Implemented (WebUI):** **`PolicyEvidenceDeltaPanel`** — **`platform/app-web/src/features/policies/policy-evidence-delta-panel.tsx`**, **`usePolicyEvidenceDeltaQuery`**, **`apiClient.getPolicyEvidenceDelta`**, types in **`contracts.ts`**; **`vitest`** in **`policy-evidence-delta-panel.test.tsx`**. Optional **Investigation**-scoped panel remains a follow-on if product wants the same contract there.

---

## Safeguards (non-regression)

- Does **not** weaken week **27–28** contracts: timeline, degraded-policy v1, path-analysis, or policy history honesty.
- Does **not** add write workflows, dry-run execution, or validation engines.
- Does **not** let Grafana own delta semantics.

---

## Related documents

- [`policy-evidence-timeline-contract.md`](./policy-evidence-timeline-contract.md)
- [`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md)
- [`path-analysis-contract.md`](./path-analysis-contract.md)
- [`data-flows.md`](./data-flows.md)
- [`agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md)
