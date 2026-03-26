# Operational stability summary v1 (Phase 2, read-only)

## Purpose

This document is the **backend-owned bounded contract** for **operational stability summary v1**: a **cross-surface read-side summary** that helps operators see—using only evidence the platform **already** exposes—whether the current picture suggests **quiet posture**, **recent churn**, **recurrence or oscillation**, **degraded recurrence**, or **insufficient stability evidence** (sparse history, non-comparable anchors, or partial domains).

The summary answers a **stability** question: *given what we already show, does this environment or subject family look **steady**, **volatile**, **repeating stress**, or **too thin to reason about**?* It does **not** answer *do independent domains **contradict** each other?* (that is [**evidence consistency**](./evidence-consistency-summary-contract.md)) or *what **changed recently**?* (that is [**change intelligence**](./change-intelligence-contract.md)).

Stable product vocabulary (for implementation and tests when the surface ships): **`operational_stability_summary_v1`**

**Implementation posture (v1):** **`GET /api/v1/stability/summary`** in **`app-api`** (`schemas/operational_stability_summary.py`, `services/operational_stability_summary.py`, `routers/operational_stability_summary.py`) — optional query **`sync_runs_limit`** (aligned with change-intelligence bounds). **This file** remains the **semantic**, **taxonomy**, and **non-claims** authority for **`operational_stability_summary_v1`**. **Grafana** and **Prometheus** remain observability-only; see [`dashboards.md`](./dashboards.md).

---

## Overlap review: why this is not duplicate work

Completed lanes established **recent activity** ([`week-24-monday-task-01-change-intelligence-contract-and-safety-rules.md`](../../agent/sdn-tasks/completed/week-24-monday-task-01-change-intelligence-contract-and-safety-rules.md)), **topology attention ranking** ([`week-28-wednesday-task-01-topology-risk-summary-contract.md`](../../agent/sdn-tasks/completed/week-28-wednesday-task-01-topology-risk-summary-contract.md)), **pre-change sufficiency** ([`week-32-wednesday-task-01-change-safety-case-contract.md`](../../agent/sdn-tasks/completed/week-32-wednesday-task-01-change-safety-case-contract.md)), **cross-domain alignment vs tension** ([`week-35-wednesday-task-01-cross-domain-evidence-consistency-summary-contract.md`](../../agent/sdn-tasks/completed/week-35-wednesday-task-01-cross-domain-evidence-consistency-summary-contract.md)), and **maintenance-composed workspace** ([`week-36-wednesday-task-01-maintenance-evidence-workspace-contract.md`](../../agent/sdn-tasks/completed/week-36-wednesday-task-01-maintenance-evidence-workspace-contract.md)). **Operational stability summary** adds a **different** question.

| Adjacent surface | Canonical role | **Operational stability summary** is **not** a duplicate because |
| --- | --- | --- |
| [**Change intelligence**](./change-intelligence-contract.md) | **Recency** — what appears to have **moved** in a bounded window (`recent-summary`, per-domain slices). | Stability summary may **use** change intelligence as **one input** but **centers churn steadiness, recurrence, and evidence sufficiency**—not “what changed last.” |
| [**Evidence consistency summary**](./evidence-consistency-summary-contract.md) | **Cross-check** — **aligned / weak alignment / tension** between co-present read-side stories. | Stability summary is **not** contradiction-first; it may **cite** tension rows only when they **also** affect interpretation of volatility or weak evidence—**not** a second copy of the consistency taxonomy. |
| [**Change safety case**](./change-safety-case-contract.md) | **Pre-change** sufficiency for **one** subject (`change_safety_case_v1`, gaps, understanding posture). | Stability summary is **global or windowed** and **not** a pre-change report; **does not** substitute for CSC section order or approval-adjacent framing. |
| [**Maintenance evidence workspace**](./maintenance-evidence-workspace-contract.md) | **Maintenance-primary** composition (preview, dossier, timeline/delta pointers, CSC). | Stability summary is **not** a maintenance workspace reopen; it may **reference** maintenance-adjacent signals **without** duplicating **`maintenance_evidence_workspace_v1`** assembly rules. |
| [**Topology risk summary**](./topology-risk-summary-contract.md) | **Per-object attention** ranking from related-policy and **`degraded_policy_v1`** counts on the **current** snapshot. | Risk summary is **ranking** on **current** relationship posture; stability summary adds **time-like and comparison signals** (history gates, **`comparison_status`**, recurrence cues) **across** domains—**not** the same ranking tuple. |

**Distinction in one line:** **Change intelligence** = *activity*; **evidence consistency** = *agreement vs tension*; **operational stability summary** = *steadiness, churn, recurrence, and whether we have enough evidence to say either way*.

---

## Supported evidence inputs (reuse only)

A conforming summary **may** draw **only** from **Phase 2** read-side contracts and responses that already exist. It **must not** require new collector tables, new persistence tables, or new domain math.

| Family | Examples of allowed sources | Role in stability summary |
| --- | --- | --- |
| **Platform / sync** | **`GET /api/v1/platform/status`**, sync-run visibility in **`workflow-history`** / **`audit-history`**, change-intelligence window metadata | **Anchor honesty** — stale vs recent assembly; **not** a single global clock. |
| **Change intelligence** | **`GET /api/v1/change-intelligence/recent-summary`** | **Churn signal** — bounded activity counts and domain presence vs absence; **not** the only input. |
| **Devices (inventory)** | **`GET /api/v1/devices`**, **`history`**, **`comparison_to_latest_persisted`**, **`data_status`**, **`serving_mode`** | **Recurrence / serving** — repeated snapshot movement vs stable comparison; **gap** when history is thin. |
| **Topology** | **`GET /api/v1/topology`**, **`history`**, **`coverage_summary`**, pairing / inference / collection postures | **Volatility vs quiet** in topology snapshot lineage; **partiality** as **evidence weakness**, not a score. |
| **Policies** | **`GET /api/v1/policies`**, **`degraded_policy_v1`**, **`history`**, optional [**policy evidence delta**](./policy-evidence-delta-contract.md) / [**timeline**](./policy-evidence-timeline-contract.md) | **Churn** in policy snapshots; **degraded recurrence** when degraded posture **reappears** across compared anchors (cited from existing fields only). |
| **Evidence consistency** (optional) | **`GET /api/v1/evidence-consistency/summary`** | **Secondary** — only to note when **tension** coexists with **high churn** or **weak anchors**; **does not** re-emit full consistency rows as stability rows. |
| **Service-scoped (optional)** | [**Service evidence timeline**](./service-evidence-timeline-contract.md), [**service evidence delta**](./service-evidence-delta-contract.md) | When **`service_id`** in scope — **membership** and **delta** **`comparison_status`** as churn / no-anchor cues. |
| **Topology object (optional)** | [**Topology object evidence timeline**](./topology-object-evidence-timeline-contract.md), [**topology object evidence delta**](./topology-object-evidence-delta-contract.md) | **Object-scoped** churn and **`comparison_status`** for nodes/links **without** reopening week **36** semantics as a new engine. |
| **Readiness / capabilities (optional)** | **`GET /api/v1/capabilities`**, readiness snapshot inspection | **Planning-support** only — may contribute **evidence weakness** language when snapshots are sparse; **not** scoring. |

**Disallowed as primary inputs:** Grafana as **business truth**; Prometheus row-level **stability scores**; **workflow** execution as proof of steadiness; **new** hashes, ML, or forecast models.

---

## Stability postures (bounded vocabulary)

These labels describe **interpretation support** from **cited** fields—**not** grades of network health or SLAs.

| Posture | Meaning |
| --- | --- |
| **`quiet_or_stable_evidence`** | Bounded windows show **low** cross-domain activity **and** no **required** tension signals that imply ongoing volatility—subject to **honest partiality** (quiet in **visible** evidence is **not** proof of quiet in the network). |
| **`elevated_churn`** | **Change intelligence** and/or **history / delta** surfaces show **material** recent movement, snapshot churn, or **delta_ready**-class churn **as already defined** in source contracts—**not** a new churn metric. |
| **`recurrence_suspected`** | **Same subject family** shows **repeated** comparable events or **repeated** degraded / unknown / stale postures **across** persisted anchors or timeline entries—**cited**, not statistical forecasting. |
| **`degraded_recurrence`** | **Degraded** or **unknown** policy (or inventory) posture **reappears** after intervals that are **visible** in history—**not** root-cause or blast-radius. |
| **`insufficient_evidence_for_stability_view`** | **No comparable anchor**, **insufficient_evidence**, **empty** history, **collector_unavailable**, or **scope mismatch** such that steadiness vs churn **cannot** be fairly summarized—**must** be first-class (same honesty as **`gap_note`** patterns elsewhere). |

Implementations **must not** emit **`quiet_or_stable_evidence`** when the only pattern is **absence** of data in multiple domains (silent emptiness is **not** “quiet”).

---

## Subject families and row types (v1)

The summary **may** organize rows by **subject family** (aligned with week **37** follow-on profiles):

| Subject family | Identity / scope | Allowed row intent |
| --- | --- | --- |
| **`global_window`** | No single **`service_id`** / **`object_id`** — whole-product window | Cross-domain churn, anchor honesty, evidence weakness. |
| **`service`** | **`service_id`** when in scope | Service timeline/delta **`comparison_status`**, membership churn cues. |
| **`topology_object`** | **`node`** / **`link`** **`object_id`** when in scope | Object timeline/delta, dossier-adjacent cues **without** duplicating dossier assembly. |

**Row types** (each **maps** to cited source fields or **explicit caveats**):

| Row type | Use |
| --- | --- |
| **`churn_signal`** | Points to **recent-summary** or **history/delta** movement—**cited**. |
| **`recurrence_signal`** | Points to **repeated** comparable anchors or timeline/delta categories. |
| **`degraded_recurrence_signal`** | Points to **degraded** / **unknown** reappearance. |
| **`evidence_weakness_signal`** | **`no_comparable_anchor`**, **insufficient_evidence**, truncation, **gap_note**, **partial** domain. |
| **`quiet_signal`** | Explicit low-activity interpretation **only** when **not** silent emptiness. |

---

## Recurrence, churn, and evidence-weakness language

- **Churn:** reuse **only** semantics already exposed—e.g. change-intelligence **counts**, **`delta_items`** presence, **`comparison_status`** != **`delta_ready`** with **caveats**, history **change_preview**—**no** invented velocity or heat maps.
- **Recurrence:** means **observable repetition** in **persisted or API-visible** anchors (e.g. multiple history entries, repeated **`degraded`**, repeated activity rows for the **same** domain subject)—**not** prediction of future incidents.
- **Degraded recurrence:** **degraded**/**unknown** posture **shows again** in a **cited** sequence—**not** “flapping” as a network verdict.
- **Evidence weakness:** **insufficient** overlapping snapshots, **empty** lists, **unsupported** identity for comparison, **limit** truncation—honest **cannot assess** stability.

---

## Explicit non-claims

An **operational stability summary v1** is:

- **Not** **prediction** or **forecasting** — no MTBF, no “likely to fail,” no trend extrapolation beyond **cited** timestamps.
- **Not** **validation** or **approval** — does not pass/fail changes or authorize work ([**Change safety case**](./change-safety-case-contract.md) remains authoritative for pre-change framing).
- **Not** **root cause** or **blast radius** — does not identify failure domains or customer impact.
- **Not** a **unified health score** or **stability index** — **forbidden** unless a **source contract** already exposes a comparable scalar (default: **forbidden**).
- **Not** **drift truth** — does not assert configuration drift; same discipline as [**policy evidence delta**](./policy-evidence-delta-contract.md).
- **Not** **substitute** for [**evidence consistency**](./evidence-consistency-summary-contract.md) — does not claim to replace **alignment / tension** analysis.
- **Not** **Grafana semantics** — product-owned summary only.

---

## Assembly rules (normative)

1. **No new math:** Derive stability postures **only** from existing comparison fields, **`comparison_status`**, **`caveats`**, **`missing_evidence_notes`**, activity counts, and **explicit** history gates.
2. **Propagate source caveats:** Merge **`caveats`** and **`explicit_non_claims`** from nested conceptual sources **without** weakening them.
3. **Single coherent `generated_at`:** Expose a clear assembly timestamp; per-domain freshness may differ—**must** remain visible.
4. **Sparse / empty:** Prefer **`insufficient_evidence_for_stability_view`** and **evidence_weakness** rows over implying **quiet**.
5. **No invented recurrence:** If repetition is **not** visible in cited anchors, **do not** fabricate **recurrence_suspected**.

---

## Related documents

- [`change-intelligence-contract.md`](./change-intelligence-contract.md)
- [`evidence-consistency-summary-contract.md`](./evidence-consistency-summary-contract.md)
- [`change-safety-case-contract.md`](./change-safety-case-contract.md)
- [`maintenance-evidence-workspace-contract.md`](./maintenance-evidence-workspace-contract.md)
- [`topology-risk-summary-contract.md`](./topology-risk-summary-contract.md)
- [`topology-object-evidence-timeline-contract.md`](./topology-object-evidence-timeline-contract.md)
- [`topology-object-evidence-delta-contract.md`](./topology-object-evidence-delta-contract.md)
- [`data-flows.md`](./data-flows.md)
- [`agent/sdn/03-CURRENT-STATUS.md`](../agent/sdn/03-CURRENT-STATUS.md)
- [`agent/sdn/week-37-schedule-overview.md`](../agent/sdn/week-37-schedule-overview.md)

---

## Contract metadata

| Field | Value |
| --- | --- |
| **`contract_id`** | **`operational_stability_summary_v1`** |
| **Phase** | **Phase 2 — read-only product foundation** |
| **Authority** | **Interpretation support only** — read-side assembly of existing evidence |
