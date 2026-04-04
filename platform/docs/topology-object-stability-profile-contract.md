# Topology object stability profile v1 (Phase 2, read-only)

## Purpose

This document is the **backend-owned bounded contract** for **topology object stability profile v1**: a **topology-object-first** read-side lens that helps operators see—using **only** evidence the platform already exposes for **one** **`node`** or **`link`**—whether that object’s **read-side story** suggests **relative steadiness**, **volatility or churn**, **recurrence**, **degraded recurrence**, or **insufficient evidence** to reason about stability **without** manually correlating dossier, failure-impact, timeline, delta, and maintenance-adjacent surfaces.

The profile answers: *for **this** `object_id`, does bounded evidence suggest a **stable** read-side posture over the anchors we have, **churn** across snapshots, **repeating** stress signals, **reappearing degraded** policy posture in the related set, or **gaps** that block a fair stability read?* It does **not** answer *what is the current composed workspace?* (that is [**Topology object dossier v1**](./topology-object-dossier-contract.md)), *what is the ordered chronology?* ([**Topology object evidence timeline**](./topology-object-evidence-timeline-contract.md)), or *what changed A vs B?* ([**Topology object evidence delta**](./topology-object-evidence-delta-contract.md)).

Stable product vocabulary (for implementation and tests when the surface ships): **`contract_id`:** **`topology_object_stability_profile_v1`**

**Implementation posture (shipped):** **`GET /api/v1/topology/objects/{object_id}/stability-profile`** returns **`TopologyObjectStabilityProfileResponse`** (**`contract_id`:** **`topology_object_stability_profile_v1`**) assembled in **`services/topology_object_stability_profile.py`** from nested evidence-timeline, evidence-delta, failure-impact, and topology risk summary row excerpt—**this file** remains the **semantic bounds**, **section order**, and **non-claims** authority.

---

## Overlap review: why this is distinct, not duplicate work

| Adjacent surface | Canonical role | **Topology object stability profile** is **not** a duplicate because |
| --- | --- | --- |
| [**Topology object dossier v1**](./topology-object-dossier-contract.md) | **Composed workspace** — stable **section order**, merged caveats, **current-state** orientation | Profile is **stability-oriented** (steadiness, churn, recurrence, weakness)—**not** the same section list; **may** **cite** dossier-nested facts but **does not** substitute dossier JSON. |
| [**Topology object evidence timeline**](./topology-object-evidence-timeline-contract.md) | **Chronology-like** ordered entries — **`topology_object_evidence_timeline_v1`** | Timeline is **time ordering**; profile **summarizes stability interpretation** from timeline **and** delta **and** other cues—**orthogonal** product question. |
| [**Topology object evidence delta**](./topology-object-evidence-delta-contract.md) | **A vs B** comparison — **`topology_object_evidence_delta_v1`**, **`comparison_status`**, **`delta_items`** | Delta is **comparison mechanics**; profile **uses** **`comparison_status`** / categories as **inputs** to volatility and weakness—**not** a second delta route. |
| [**Failure impact**](./failure-impact-contract.md) | **`failure_impact_v1`** — relationship + degraded **rollups within related set** | Failure impact is **impact framing**; profile may **echo** rollup **signals** for **degraded recurrence** language—**not** impact simulation or blast radius. |
| [**Topology risk summary**](./topology-risk-summary-contract.md) | **Current-snapshot attention ranking** — **`topology_risk_summary_v1`** | Risk summary ranks **current** object attention; profile adds **time-like** and **comparison** semantics from timeline/delta—**not** the same ranking tuple. |
| [**Maintenance evidence workspace**](./maintenance-evidence-workspace-contract.md) | **Maintenance-primary** composition — **`maintenance_evidence_workspace_v1`** | Maintenance workspace **may nest** topology-object timeline/delta; profile is **topology-object-primary stability**—**not** a maintenance workspace reopen or duplicate assembly order. |
| [**Change safety case**](./change-safety-case-contract.md) | **Pre-change** sufficiency — **`change_safety_case_v1`** | CSC is **subject-centric pre-change**; profile is **stability interpretation** for topology objects—**not** approval, gaps inventory for change control, or safe-to-change. |
| [**Operational stability summary**](./operational-stability-summary-contract.md) | **Cross-surface** window — **`operational_stability_summary_v1`** | Global/windowed summary; profile is **per-object** **topology-object-primary**—**complementary** scope. |

This contract **does not** reopen [**topology truth-depth**](./topology-truth-depth-review.md) implementation lanes, **pairing** semantics, or **coverage-history authority**; it **consumes** existing APIs **as documented**, with **explicit caveats** when partial.

---

## Supported subject types

| Subject | Identity | Notes |
| --- | --- | --- |
| **Topology node** | `object_kind=node`, `object_id` = `node_id` on the current normalized topology snapshot | Same rules as [**Topology object dossier**](./topology-object-dossier-contract.md), [**Evidence timeline**](./topology-object-evidence-timeline-contract.md), [**Evidence delta**](./topology-object-evidence-delta-contract.md) — **404** if unknown. |
| **Topology link** | `object_kind=link`, `object_id` = `link_id` on the current normalized topology snapshot | Endpoint / union rules for related policies unchanged; co-presence on a link does **not** imply dataplane or dependency truth. |

**Out of scope for v1:** device-only subjects without a topology row, regions, SRLGs, multi-object bundles, or service-primary stability (use **service stability profile** when implemented).

---

## Allowed evidence sources (reuse only)

A conforming profile **may** draw **only** from Phase **2** read-side contracts and **`GET`** families already scoped to **`object_id`**. It **must not** require new collector tables, new persistence tables, or graph simulation.

| Source | Contract / API (examples) | Role in stability profile |
| --- | --- | --- |
| **Topology snapshot row** | **`GET /api/v1/topology`** | **Identity** and bounded **partiality** echo for caveats—**not** a second topology API. |
| **Failure impact** | **`GET /api/v1/topology/objects/{object_id}/failure-impact`** | **Degraded rollup** and relationship context **within related set**—inputs to **degraded recurrence** language only. |
| **Topology risk contribution** | **`GET /api/v1/topology/risk-summary`** (row for **`object_id`**) | **Attention / D-U-R-K** excerpt as **current** posture cue—**not** re-ranking the full table in the profile body unless the API returns a single-row excerpt. |
| **Topology object evidence timeline** | **`GET /api/v1/topology/objects/{object_id}/evidence-timeline`** | **Entry density**, **`missing_evidence_notes`**, related-policy projection cues—**volatility** and **recurrence** **without** duplicating full timeline JSON as the profile body. |
| **Topology object evidence delta** | **`GET /api/v1/topology/objects/{object_id}/evidence-delta`** | **`comparison_status`**, **`delta_items`** categories, **`caveats`**—**churn** vs **no anchor** vs **insufficient_evidence**. |
| **Related policies** | **`GET /api/v1/topology/objects/{object_id}/related-policies`** | **Identity** of related **`policy_id`** set for **degraded** interpretation—same string rules as existing contracts. |
| **Maintenance evidence workspace (optional pointer)** | **`GET /api/v1/maintenance-evidence-workspace`** with topology subject selectors | **Optional** nested **pointer or excerpt** when maintenance context exists—**not** maintenance-primary section order; profile remains **topology-object-first**. |

**Disallowed as primary profile evidence:** Grafana as business truth; Prometheus row-level **stability scores**; workflow or audit history as **causality**; new ML or dependency graphs.

---

## Stability profile sections (normative order)

When implemented, profile JSON (or WebUI cards) **SHOULD** follow this order:

1. **Subject identity** — `object_kind`, `object_id`, display labels **as already exposed** on topology / dossier patterns.
2. **Profile scope summary** — One bounded string: what **time anchors** and **comparison anchors** the profile used (e.g. “uses evidence-timeline and evidence-delta responses assembled at `generated_at`”)—**not** a unified clock claim.
3. **Primary stability posture (bounded label)** — One of: **`quiet_or_stable_evidence`**, **`elevated_churn`**, **`recurrence_suspected`**, **`degraded_recurrence`**, **`insufficient_evidence_for_stability_view`** — aligned with vocabulary in [**Operational stability summary**](./operational-stability-summary-contract.md) **posture table**, scoped to **this object**. **Must not** emit **`quiet_or_stable_evidence`** when the only pattern is **silent emptiness** across nested sources.
4. **Volatility and churn cues** — Cited fields only: e.g. **`delta_items`** presence, **`comparison_status`**, timeline **entry counts** thresholds **documented in implementation**—no invented velocity metrics.
5. **Recurrence and degraded recurrence** — Observable repetition: multiple history anchors, repeated **`degraded`** in related policy posture **as cited** from timeline/delta/failure-impact—**not** “flapping” as a network verdict.
6. **Evidence weakness** — **`no_comparable_anchor`**, **`insufficient_evidence`**, **`missing_evidence_notes`**, empty related set—**first-class**; **not** an “all clear.”
7. **Canonical pivots (read-only)** — Stable hints to **`evidence-timeline`**, **`evidence-delta`**, **dossier**, **maintenance-evidence-workspace**, **change-safety-case** drilldowns **as already defined** by product URLs—**not** new routes.
8. **Merged caveats** — Union of **`caveats`** / disclaimers from nested responses; **stricter caveat wins** (same spirit as dossier).

Sections **may** collapse when empty; **order** stays stable when present.

---

## Recurrence, volatility, and evidence-weakness (topology object)

- **Volatility / churn:** Derive **only** from existing **`comparison_status`**, **`delta_items`**, timeline entry presence, and honest **sparse** notes—**no** heat maps or synthetic rates.
- **Recurrence:** **Repeated** comparable anchors or categories **visible** in timeline or delta—**not** forecasting.
- **Degraded recurrence:** **`degraded`** / **`unknown`** posture **reappears** in the **related policy set** or failure-impact rollups **as cited**—**not** root cause or blast radius.
- **Evidence weakness:** **Insufficient** anchors, **truncation**, **`gap_note`**—profile **states** cannot assess stability fairly.

---

## Explicit non-claims

A **topology object stability profile v1** is:

- **Not** **blast-radius**, **traffic**, or **dependency simulation** — see [**Failure impact**](./failure-impact-contract.md) non-claims.
- **Not** **prediction** or **MTBF** — bounded interpretation of **existing** timestamps and statuses only.
- **Not** **safe-to-change**, **approval**, or **validation** — see [**Change safety case**](./change-safety-case-contract.md).
- **Not** a **substitute** for **dossier**, **timeline**, or **delta** contracts — **pointers** and **summaries** only.
- **Not** **topology pairing or coverage truth** — partiality remains explicit ([**topology truth-depth**](./topology-truth-depth-review.md)).
- **Not** **Grafana semantics** — product-owned profile; see [`dashboards.md`](./dashboards.md).

---

## Assembly rules (normative)

1. **Same identity rules** as dossier / timeline / delta — **404** when **`object_id`** is unknown on the current snapshot.
2. **No new diff engine** — reuse **`comparison_status`**, **`delta_items`**, **`missing_evidence_notes`**, failure-impact **`caveats`**.
3. **Propagate nested caveats** without weakening them.
4. **Single coherent `generated_at`** for the profile response; echo nested **`generated_at`** where relevant.
5. **Sparse / partial:** Prefer **`insufficient_evidence_for_stability_view`** and weakness sections over implying quiet.

---

## Related documents

- [`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md)
- [`topology-object-evidence-timeline-contract.md`](./topology-object-evidence-timeline-contract.md)
- [`topology-object-evidence-delta-contract.md`](./topology-object-evidence-delta-contract.md)
- [`failure-impact-contract.md`](./failure-impact-contract.md)
- [`topology-risk-summary-contract.md`](./topology-risk-summary-contract.md)
- [`maintenance-evidence-workspace-contract.md`](./maintenance-evidence-workspace-contract.md)
- [`operational-stability-summary-contract.md`](./operational-stability-summary-contract.md)
- [`data-flows.md`](./data-flows.md)
- [`agent/sdn/03-CURRENT-STATUS.md`](../agent/sdn/03-CURRENT-STATUS.md)
- [`agent/sdn/week-37-schedule-overview.md`](../agent/sdn/week-37-schedule-overview.md)

---

## Contract metadata

| Field | Value |
| --- | --- |
| **`contract_id`** | **`topology_object_stability_profile_v1`** |
| **Surface role** | **Phase 2 read-only product surface within the current repo state** |
| **Authority** | **Interpretation support only** — read-side assembly of existing evidence |
