# Service evidence delta contract (Phase 2, read-only)

## Purpose

This document is the **backend-owned bounded contract** for a future **service-centric evidence delta** product slice: an operator-facing **comparison-style** view of **what appears different** for **one `service_id`** between **current** read-side evidence (as **Service Explorer** would surface it) and a **recent persisted or historical anchor**—so operators can **orient** on **grouped** change-like signals (membership, roll-ups, topology linkage, freshness echoes) in the **bounded models the platform already exposes**—**without** claiming **service drift truth**, **SLA or customer impact**, **blast-radius simulation**, **cross-service ranking**, or **substitution** for per-policy deep diff.

**Service evidence delta v1** is **evidence-derived** and **service-scoped**: the subject is a **`service_id`** using the **same identity and membership rules** as [**Service Explorer v1**](./service-explorer-contract.md). It **compares** fields and sets that are **already** defined on **`GET /api/v1/services/{service_id}`**, **`GET /api/v1/policies`**, and related read routes; it does **not** invent a new reconciliation engine, **not** a multi-policy “health score delta,” and **not** workflow or dry-run semantics.

Stable product vocabulary (for implementation and tests when the surface ships): **`contract_id`:** **`service_evidence_delta_v1`**

**HTTP / WebUI posture:** **`GET /api/v1/services/{service_id}/evidence-delta`** is the canonical route; WebUI surfaces include **Service Explorer** detail and **Service Dossier** (**`ServiceEvidenceDeltaPanel`**) — **only** under this contract’s non-claims.

---

## Overlap review: why this is distinct, not a duplicate

| Closed / adjacent slice | Canonical role | **Service evidence delta** is **not** a duplicate because |
| --- | --- | --- |
| [**Policy evidence delta**](./policy-evidence-delta-contract.md) (`week-28-thursday-task-01`) | **One `policy_id`** — **`policy_evidence_delta_v1`** compares **current** policy row vs **previous persisted** anchor per [**policy history**](./data-flows.md) rules | **Policy-primary**. Service delta is **service-primary**: it reasons about **member set**, **`degraded_service`** roll-up, **`topology_links`**, and **optional per-member** policy-delta **projections**—**not** a rename of **`GET /api/v1/policies/{policy_id}/evidence-delta`**. |
| [**Service Explorer v1**](./service-explorer-contract.md) (`week-31-monday-task-01`) | **List + detail** — authoritative **members**, **`degraded_service`**, **`topology_links`** for **current** slice | Explorer is **inventory authority** for **what is true now**. Service delta **compares** current Explorer-shaped evidence to a **labeled previous anchor**—**difference** semantics, **not** a second Explorer **`GET`**. |
| [**Service Dossier v1**](./service-dossier-contract.md) (`week-32-monday-task-01`) | **Composed briefing** — section order, merged caveats, **one-screen** orientation | Dossier is **narrative composition**; delta is **A vs B** comparison with **explicit anchors**—**orthogonal**; **pivot** expected, **not** merged JSON. |
| [**Service evidence timeline**](./service-evidence-timeline-contract.md) | **Chronology** — **`service_evidence_timeline_v1`** orders **time-bearing** anchors | Timeline is **ordering**; delta is **difference across two anchors**—**orthogonal** (same relationship as policy timeline vs policy delta). |

---

## Service identity (`service_id`)

Implementations **MUST** use the **same** **`service_id`** strings, **prefix rules**, **URL/path encoding**, **404 / empty membership** semantics, and **member policy** resolution as [**Service Explorer v1**](./service-explorer-contract.md). **Unsupported** **`service_id`** or **zero members** → **same** honest response as Explorer detail (**404** or documented empty posture)—**no** fabricated delta.

---

## Compared sources (v1)

A v1 delta assembly may **only** compare evidence that Phase **2** already exposes read-only:

| Role | Typical source | Meaning |
| --- | --- | --- |
| **Current (“A”)** | **`GET /api/v1/services/{service_id}`** — **members**, **`degraded_service`**, **`topology_links`**, **`policy_inventory`** echo, **`topology_evidence_status`**, caveats | **Current** grouped service lens; **not** guaranteed “network truth.” |
| **Previous (“B”) anchor** | A **single** explicit anchor: e.g. **previous persisted policy snapshot window** intersected with **member `policy_id` set**, **plus** Explorer-consistent **reconstruction** of grouped fields from **the same** bounded history rules Service Explorer uses—**or** a **labeled** “previous assembly” when product defines a stable snapshot id for **service-shaped** rows | **B** must be **explicitly labeled** (snapshot ids, **`persisted_at`**, “previous list response,” etc.). Operators must see **what** was compared. |

**Disallowed as primary delta inputs:** Grafana panels, Prometheus series as row-level service diffs, synthetic “service health delta scores,” workflow payloads as **authoritative** change truth, or **cross-service** ranking.

---

## Delta categories (v1 vocabulary)

Deltas are **categories of observable difference** in **normalized service-shaped** fields and **derived sets**, not a single severity score.

| Category | Meaning |
| --- | --- |
| **`service_membership_change`** | **`policy_id`** **added** or **removed** from the **member set** for this **`service_id`** between anchors (set diff on **inventory-backed** members). |
| **`degraded_service_roll_up_change`** | **`degraded_service.posture`** or **reason_code** union shape changes **when both** anchors expose **`degraded_service`** — still **aggregation of** **`degraded_policy_v1`**, **not** an independent health sensor. |
| **`member_degraded_policy_change`** | One or more **members** changed **`degraded_policy_v1.posture`** or **`reason_codes`** — may **cite** nested **`policy_evidence_delta_v1`** **categories** per member **without** duplicating full policy delta payloads by default. |
| **`topology_linkage_change`** | Differences in **`topology_links`** rows (count, **`node_id`**, **`matched_on`**, **`matched_from_policy_field`**) **when** both anchors support linkage assembly. |
| **`policy_inventory_echo_change`** | Differences in **echoed** **`policy_inventory`** fields on **`GET /api/v1/services/{service_id}`** (e.g. **`data_status`**, **`serving_mode`**, **`empty_reason`**) — **read-path honesty**, not device fault. |
| **`no_comparable_fields`** | Both anchors exist but **no** overlapping comparable service-shaped fields for this slice. |
| **`gap_note`** | **Cannot compare**, **missing anchor**, or **single-anchor-only** — **not** a silent empty diff. |

Adding categories that imply **approval**, **validation**, **SLA breach**, or **automated remediation** requires a **contract revision** and new non-claims.

---

## Reuse of policy evidence delta semantics

When a **member** **`policy_id`** has a **comparable** [**policy evidence delta**](./policy-evidence-delta-contract.md) between the **same** anchor family as the service delta (e.g. current vs previous persisted snapshot), implementations **may**:

1. **Embed** a **summary** of **`policy_evidence_delta_v1`** **`comparison_status`** and **category** flags **per changed member**, **or**
2. **Point** to **`GET /api/v1/policies/{policy_id}/evidence-delta`** as **authoritative** for **full** per-policy diff.

Implementations **must not** **recompute** a **different** policy delta algorithm than **`policy_evidence_delta_v1`**. **Service** delta is **not** a substitute for opening **per-policy** delta when **deep** policy field diff is needed.

---

## Unknown / insufficient-evidence behavior

1. **No second anchor** — Emit **`gap_note`** / **`comparison_status`**-class semantics consistent with **policy** delta honesty: **no** fake “no changes.”
2. **History not `comparison_ready`** — Service delta may be **unsupported** or **partial** with explicit notes; **no** invented “previous members.”
3. **Partial member detail** — **`detail_mode`** / **`empty_reason`** limits on **policies** **may** block **some** member policy deltas; **downgrade** to **gap** or **partial** with explicit notes.
4. **Topology unavailable on one side** — **topology_linkage_change** **omitted** or **marked** **unsupported**; **no** inferred graph equality.

---

## Explicit non-claims

Stable keys (align with schema literals when implemented):

- **`not_service_drift_truth`** — Differences are **read-side evidence** deltas, not authoritative service or configuration drift.
- **`not_sla_or_customer_impact`** — **Not** SLA, customer, outage, or revenue impact.
- **`not_cross_service_ranking`** — **Not** comparing services by synthetic score or rank.
- **`not_policy_correctness_verdict`** — **Not** “policies are correct/incorrect” in aggregate.
- **`not_workflow_validation`** — **Not** tied to workflow execution, approval, or dry-run validation engines.
- **`not_dataplane_or_te_verdict`** — **Not** forwarding or TE outcome proof.
- **`not_substitute_for_policy_delta`** — **Per-policy** [**policy evidence delta**](./policy-evidence-delta-contract.md) remains **authoritative** for **full** **`policy_id`**-scoped comparison.
- **`not_replacement_for_service_timeline`** — Complements [**service evidence timeline**](./service-evidence-timeline-contract.md); does **not** replace chronology.
- **`not_grafana_delta`** — **Grafana** does **not** own product delta semantics ([`dashboards.md`](./dashboards.md)).

---

## Operator-safe copy expectations

- Prefer **“service evidence delta”** or **“grouped read-side difference”** over **“service drift,”** **“blast radius change,”** or **“customer impact”** unless paired with a **visible** disclaimer that meaning is **evidence-bounded**.
- **Grafana** must **not** own delta semantics; **app-api** and product copy **own** the contract.

---

## Classification vs adjacent contracts

| Contract | Role |
| --- | --- |
| [`policy-evidence-delta-contract.md`](./policy-evidence-delta-contract.md) | **Per-policy** `policy_evidence_delta_v1`; **source** for member-level projections. |
| [`service-evidence-timeline-contract.md`](./service-evidence-timeline-contract.md) | **Chronology** `service_evidence_timeline_v1`; delta is **orthogonal** (difference across anchors). |
| [`service-explorer-contract.md`](./service-explorer-contract.md) | **Current** membership and roll-up **authority** for **A** side. |
| [`data-flows.md`](./data-flows.md) | Policy **history** and snapshot **honesty** for choosing **B**. |

---

## Gap audit (implementation follow-on)

| Area | Status (this task) |
| --- | --- |
| **Contract document** | **Delivered:** this file (`service-evidence-delta-contract.md`). |
| **Schema + route** | **Shipped:** `GET /api/v1/services/{service_id}/evidence-delta` — **`service_evidence_delta_v1`** (`schemas/service_evidence_delta.py`, `services/service_evidence_delta.py`). |
| **WebUI** | **Shipped:** **`ServiceEvidenceDeltaPanel`** on Service Explorer detail and Service Dossier (`service-evidence-delta-panel.tsx`). |
| **Tests / verifier** | **Shipped:** repository **`pytest`** (`tests/test_service_evidence_delta.py`) and **`vitest`** (`service-evidence-delta-panel.test.tsx`); optional structural **`verify-core-runtime.sh`** when justified. |

---

## Related documents

- [`policy-evidence-delta-contract.md`](./policy-evidence-delta-contract.md)
- [`service-evidence-timeline-contract.md`](./service-evidence-timeline-contract.md)
- [`service-explorer-contract.md`](./service-explorer-contract.md)
- [`service-dossier-contract.md`](./service-dossier-contract.md)
- [`data-flows.md`](./data-flows.md)
- [`agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md)
- [`agent/sdn/week-35-schedule-overview.md`](../../agent/sdn/week-35-schedule-overview.md)
