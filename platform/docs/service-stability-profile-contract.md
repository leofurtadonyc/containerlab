# Service stability profile v1 (Phase 2, read-only)

## Purpose

This document is the **backend-owned bounded contract** for **service stability profile v1**: a **service-first** read-side lens that helps operators see—using **only** evidence the platform already exposes for **one** **`service_id`** (same identity rules as [**Service Explorer v1**](./service-explorer-contract.md))—whether that service’s **read-side story** suggests **relative steadiness**, **volatility or churn** across membership and inventory echoes, **recurrence**, **degraded recurrence** among member policies, or **insufficient evidence** to reason about stability **without** manually correlating Explorer detail, dossier, service evidence timeline, service evidence delta, and impact- or change-adjacent surfaces.

The profile answers: *for **this** `service_id`, does bounded evidence suggest a **stable** read-side posture over the anchors we have, **churn** in membership or echoed inventory fields, **repeating** stress signals, **reappearing degraded** posture in the member set, or **gaps** that block a fair stability read?* It does **not** answer *what is the current composed workspace?* (that is [**Service dossier v1**](./service-dossier-contract.md)), *what is the ordered chronology?* ([**Service evidence timeline**](./service-evidence-timeline-contract.md)), or *what changed A vs B?* ([**Service evidence delta**](./service-evidence-delta-contract.md)).

Stable product vocabulary (for implementation and tests when the surface ships): **`contract_id`:** **`service_stability_profile_v1`**

**Implementation posture (shipped):** **`GET /api/v1/services/{service_id}/stability-profile`** returns **`ServiceStabilityProfileResponse`** (**`contract_id`:** **`service_stability_profile_v1`**) assembled in **`services/service_stability_profile.py`** from nested service evidence-timeline, service evidence-delta, Service Explorer **`degraded_service`** roll-up, and optional service dossier caveats—**this file** remains the **semantic bounds**, **section order**, and **non-claims** authority.

---

## Overlap review: why this is distinct, not duplicate work

| Adjacent surface | Canonical role | **Service stability profile** is **not** a duplicate because |
| --- | --- | --- |
| [**Service Explorer v1**](./service-explorer-contract.md) | **List + detail** — **`service_explorer_v1`**, member table, **`degraded_service`**, topology linkage | Explorer is **inventory and membership authority**; the profile is **stability interpretation** from timeline, delta, and roll-ups—**not** a second **`GET /api/v1/services/{service_id}`** and **not** new grouping rules. |
| [**Service dossier v1**](./service-dossier-contract.md) | **Composed workspace** — stable **section order**, merged caveats, **`service_dossier_v1`** | Dossier is **current-state workspace**; profile is **stability-oriented** (steadiness, churn, recurrence, weakness)—**not** the same section list; **may** **cite** dossier-nested facts but **does not** substitute dossier JSON. |
| [**Service evidence timeline**](./service-evidence-timeline-contract.md) | **Chronology-like** ordered entries — **`service_evidence_timeline_v1`** | Timeline is **time ordering**; profile **summarizes stability interpretation** from timeline **and** delta **and** Explorer roll-ups—**orthogonal** product question. |
| [**Service evidence delta**](./service-evidence-delta-contract.md) | **A vs B** comparison — **`service_evidence_delta_v1`**, **`comparison_status`**, **`delta_items`** | Delta is **comparison mechanics**; profile **uses** **`comparison_status`** / categories as **inputs** to volatility and weakness—**not** a second delta route. |
| [**Service Impact Workspace**](./service-impact-workspace-contract.md) | **Service-centric** impact framing — **`service_impact_workspace_v1`** | Impact workspace addresses **impact-oriented** operator questions; profile addresses **stability posture** from existing read-side cues—**not** impact simulation, blast radius, or SLA. |
| [**Change safety case**](./change-safety-case-contract.md) (service-shaped reports) | **Pre-change** sufficiency — **`change_safety_case_v1`** | CSC is **subject-centric pre-change**; profile is **stability interpretation** for services—**not** approval, gaps inventory for change control, or safe-to-change. |
| [**Operational stability summary**](./operational-stability-summary-contract.md) | **Cross-surface** window — **`operational_stability_summary_v1`** | Global/windowed summary; profile is **per-service** **service-primary**—**complementary** scope. |
| [**Topology object stability profile**](./topology-object-stability-profile-contract.md) | **Per-node / per-link** stability — **`topology_object_stability_profile_v1`** | Same **posture vocabulary** family; **different subject** (`service_id` vs topology **`object_id`**) — **not** a duplicate assembly. |

This contract **does not** reopen [**Service Explorer**](./service-explorer-contract.md) **prefix** semantics, **member resolution**, or **week 35** service timeline/delta **field** definitions; it **consumes** those contracts **as documented**, with **explicit caveats** when partial.

---

## Supported subject types

| Subject | Identity | Notes |
| --- | --- | --- |
| **Service** | `service_id` per Service Explorer (`policy:`, `color:`, `headend:`, `endpoint:` — see Explorer contract) | Same **URL encoding**, **404**, and **empty / zero-member** honesty as **`GET /api/v1/services/{service_id}`** and [**Service dossier**](./service-dossier-contract.md). |

**Out of scope for v1:** multi-`service_id` bundles, abstract tickets without **`service_id`**, or stability whose **primary** subject is **only** a topology object without a service anchor (use [**topology object stability profile**](./topology-object-stability-profile-contract.md)).

---

## Allowed evidence sources (reuse only)

A conforming profile **may** draw **only** from Phase **2** read-side contracts and **`GET`** families already scoped to **`service_id`** or honestly relatable to **member policies** of that service. It **must not** require new collector tables, new persistence tables, new service-ownership models, or graph simulation.

| Source | Contract / API (examples) | Role in stability profile |
| --- | --- | --- |
| **Service Explorer detail** | **`GET /api/v1/services/{service_id}`** | **Identity**, **`degraded_service`**, **member list** bounds, **`policy_inventory`** / **`topology_evidence_status`** echoes—**not** a second services API. |
| **Service dossier** | **`GET /api/v1/services/{service_id}/dossier`** | **Composed** excerpts and **`merged_caveats`** **pointers**—profile **summarizes**; **does not** embed full dossier as body. |
| **Service evidence timeline** | **`GET /api/v1/services/{service_id}/evidence-timeline`** | **Entry density**, **`missing_evidence_notes`**, membership- and policy-projection cues—**volatility** and **recurrence** without duplicating full timeline JSON as the profile body. |
| **Service evidence delta** | **`GET /api/v1/services/{service_id}/evidence-delta`** | **`comparison_status`**, **`delta_items`** categories, **`caveats`**—**churn** vs **no anchor** vs **insufficient_evidence**. |
| **Impact report (relationship)** | **`GET /api/v1/reports/service-impact?...`** (per [**Impact report**](./impact-report-contract.md)) | **Optional pointer** or **one-line relationship** to service-shaped impact framing—**not** substituting **`impact_report_v1`** JSON for the profile body. |
| **Change safety case (service)** | **`GET /api/v1/reports/change-safety-case/service?...`** when applicable | **Optional** **pointer** for pre-change context—**not** CSC section order or approval semantics. |
| **Maintenance / NOC pivots (optional)** | Subject selectors that resolve to **`service_id`** on existing routes | **Optional** **pointer**—profile remains **service-primary**, not maintenance-workspace-primary. |

**Disallowed as primary profile evidence:** Grafana as business truth; Prometheus row-level **stability scores**; workflow or audit history as **causality**; new ML, ranking engines, or **SLA** formulas.

---

## Stability profile sections (normative order)

When implemented, profile JSON (or WebUI cards) **SHOULD** follow this order:

1. **Subject identity** — `service_id`, grouping key explanation, display labels **as already exposed** on Service Explorer / dossier patterns.
2. **Profile scope summary** — One bounded string: what **time anchors** and **comparison anchors** the profile used (e.g. “uses service evidence-timeline and service evidence-delta responses assembled at `generated_at`”)—**not** a unified clock claim.
3. **Primary stability posture (bounded label)** — One of: **`quiet_or_stable_evidence`**, **`elevated_churn`**, **`recurrence_suspected`**, **`degraded_recurrence`**, **`insufficient_evidence_for_stability_view`** — aligned with vocabulary in [**Operational stability summary**](./operational-stability-summary-contract.md) **posture table**, scoped to **this service**. **Must not** emit **`quiet_or_stable_evidence`** when the only pattern is **silent emptiness** across nested sources.
4. **Volatility and churn cues** — Cited fields only: e.g. **`delta_items`** presence, **`comparison_status`**, timeline **entry counts** (thresholds **documented in implementation**), membership or inventory-echo changes—**no** invented velocity metrics or cross-service ranks.
5. **Recurrence and degraded recurrence** — Observable repetition: multiple history anchors, repeated **`degraded`** among **member** policies **as cited** from timeline/delta/Explorer—**not** “flapping” as a customer-impact verdict.
6. **Evidence weakness** — **`no_comparable_anchor`**, **`insufficient_evidence`**, **`missing_evidence_notes`**, empty or truncated member sets—**first-class**; **not** an “all clear.”
7. **Canonical pivots (read-only)** — Stable hints to **service evidence-timeline**, **service evidence-delta**, **service dossier**, **Service Impact workspace**, **change-safety-case** (service), **maintenance** drilldowns **as already defined** by product URLs—**not** new routes.
8. **Merged caveats** — Union of **`caveats`** / disclaimers from nested responses; **stricter caveat wins** (same spirit as dossier).

Sections **may** collapse when empty; **order** stays stable when present.

---

## Recurrence, volatility, and evidence-weakness (service)

- **Volatility / churn:** Derive **only** from existing **`comparison_status`**, **`delta_items`**, service timeline entry presence, **membership** or **echoed inventory** diffs already defined in [**service evidence delta**](./service-evidence-delta-contract.md), and honest **sparse** notes—**no** heat maps or synthetic rates.
- **Recurrence:** **Repeated** comparable anchors or categories **visible** in service timeline or delta—**not** forecasting or traffic prediction.
- **Degraded recurrence:** **`degraded`** / **`unknown`** posture **reappears** in the **member policy set** or **`degraded_service`** roll-up **as cited**—**not** root cause, blast radius, or **SLA** breach.
- **Evidence weakness:** **Insufficient** anchors, **truncation**, **`gap_note`**—profile **states** that stability cannot be assessed fairly.

---

## Explicit non-claims

A **service stability profile v1** is:

- **Not** **SLA**, **customer-impact**, **traffic**, or **dependency simulation** — see [**Service Impact Workspace**](./service-impact-workspace-contract.md) and [**Impact report**](./impact-report-contract.md) non-claims.
- **Not** **prediction**, **MTBF**, or **availability guarantee** — bounded interpretation of **existing** timestamps and statuses only.
- **Not** **safe-to-change**, **approval**, or **validation** — see [**Change safety case**](./change-safety-case-contract.md).
- **Not** a **substitute** for **Service Explorer**, **dossier**, **service timeline**, or **service delta** contracts — **pointers** and **summaries** only.
- **Not** a **new service catalog**, **entitlement**, or **ownership** model — **`service_id`** grouping remains as in [**Service Explorer**](./service-explorer-contract.md).
- **Not** **Grafana semantics** — product-owned profile; see [`dashboards.md`](./dashboards.md).

---

## Assembly rules (normative)

1. **Same identity rules** as Service Explorer / dossier / service timeline / service delta — **404** or documented empty posture when **`service_id`** is unsupported or **zero members**, per existing contracts.
2. **No new diff engine** — reuse **`comparison_status`**, **`delta_items`**, **`missing_evidence_notes`**, Explorer **`degraded_service`**, dossier **`merged_caveats`** when nested.
3. **Propagate nested caveats** without weakening them.
4. **Single coherent `generated_at`** for the profile response; echo nested **`generated_at`** where relevant.
5. **Sparse / partial:** Prefer **`insufficient_evidence_for_stability_view`** and weakness sections over implying quiet.

---

## Related documents

- [`service-explorer-contract.md`](./service-explorer-contract.md)
- [`service-dossier-contract.md`](./service-dossier-contract.md)
- [`service-evidence-timeline-contract.md`](./service-evidence-timeline-contract.md)
- [`service-evidence-delta-contract.md`](./service-evidence-delta-contract.md)
- [`service-impact-workspace-contract.md`](./service-impact-workspace-contract.md)
- [`operational-stability-summary-contract.md`](./operational-stability-summary-contract.md)
- [`topology-object-stability-profile-contract.md`](./topology-object-stability-profile-contract.md)
- [`data-flows.md`](./data-flows.md)
- [`agent/sdn/03-CURRENT-STATUS.md`](../agent/sdn/03-CURRENT-STATUS.md)
- [`agent/sdn/week-37-schedule-overview.md`](../agent/sdn/week-37-schedule-overview.md)

---

## Contract metadata

| Field | Value |
| --- | --- |
| **`contract_id`** | **`service_stability_profile_v1`** |
| **Phase** | **Phase 2 — read-only product foundation** |
| **Authority** | **Interpretation support only** — read-side assembly of existing evidence |
