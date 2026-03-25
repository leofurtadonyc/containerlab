# Service dossier v1 contract (Phase 2, read-only)

## Purpose

This document is the **product-owned bounded contract** for the **read-only service dossier** product slice: a **single composed operator-facing workspace** for **one** **`service_id`** (same identity and grouping rules as [**Service Explorer v1**](./service-explorer-contract.md)) that surfaces **summaries and navigation pointers** across **member policies**, **topology linkage**, and **related** bounded assemblies—so operators can orient on a **service-centric** slice **without** treating the dossier as a new catalog, SLA proof, or dependency graph.

**Service dossier v1** is **evidence-derived** and **assembly-only**: it **composes** and **echoes** responses already defined on **`GET /api/v1/services/{service_id}`**, **`GET /api/v1/policies`**, **`GET /api/v1/topology`**, and the same nested read contracts as [**Policy dossier v1**](./policy-dossier-contract.md), [**Topology object dossier v1**](./topology-object-dossier-contract.md), [**Policy explainability workspace v1**](./policy-explainability-workspace-contract.md), [**Maintenance Preview**](./maintenance-preview-contract.md), and [**Impact Report v1**](./impact-report-contract.md)—**reordered for one screen**, not new collector semantics or scoring engines.

Stable **`contract_id`:** **`service_dossier_v1`**

**HTTP surface (app-api):** **`GET /api/v1/services/{service_id}/dossier`** returns **`ServiceDossierResponse`** with nested **`service_explorer_detail`** (same contract as **`GET /api/v1/services/{service_id}`** — **`service_explorer_v1`**), optional **`policy_explainability`** for the **default member** (worst **`degraded_policy_v1`** posture, then lexicographic **`policy_id`**), and optional **`maintenance_preview`** when **Explorer** **`topology_links`** provide a **first** **`node_id`** that resolves for **`related-policies`**. **`merged_caveats`**, **`missing_evidence_notes`**, **`source_contract_ids`**, **`sparse_dossier`**, and **`recommended_api_pivots`** (including **`GET /api/v1/reports/service-impact?service_id=`** — **not** interchangeable with **`impact_report_v1`** JSON) carry the same honesty rules as this document. **`404`** when **`service_id`** is unsupported or has **zero** members (same as Service Explorer detail). The route uses the same **catch-all path** segment as **`GET /api/v1/services/{service_id}`** so **`policy:`** identifiers round-trip. A **WebUI-only** composition remains valid **only** if it mirrors the same fields and does not invent evidence.

---

## Overlap review: why this is an extension, not duplicate work

The following slices are **closed**; **Service Dossier v1** **extends** them with a **composed workspace** subject (`**service_id**`) that none of the below define alone:

| Closed slice | Role | Why service dossier is **not** a duplicate |
| --- | --- | --- |
| [**Service Explorer v1**](./service-explorer-contract.md) (`week-31-monday-task-01`) | **List + detail** API (**`service_explorer_v1`**) — index rows, member table, degraded roll-up, topology linkage **columns** | Explorer is the **inventory lens** and **authoritative** `GET` for **which policies** belong to a **`service_id`**. The **dossier** is a **second presentation**: **stable section order**, **merged caveats**, and **workspace** framing for **one** service—like **Policy dossier** vs raw **Policies** detail. |
| [**Topology object dossier v1**](./topology-object-dossier-contract.md) (`week-29-monday-task-01`) | **One node or link** as primary subject | **Object-centric**; **not** `color:` / `headend:` / **multi-policy** grouping. Service dossier **may link** to topology dossiers for linked objects but **does not** replace object identity rules. |
| [**Policy dossier v1**](./policy-dossier-contract.md) (`week-29-tuesday-task-01`) | **One `policy_id`** deep composed workspace | **Policy-primary**. Service dossier is **service-primary**: **many** members summarized; per-policy **path/timeline/delta** are **pointers or short rollups**, not full nested **`policy_dossier_v1`** bodies unless product explicitly embeds excerpts. |
| [**Policy explainability workspace v1**](./policy-explainability-workspace-contract.md) (`week-31-tuesday-task-01`) | **One policy** path-story / candidates / caveats | **Explainability-primary**. Service dossier **surfaces pointers** (“open explainability for worst degraded member”) or **one-line** rollups—**not** a second explainability engine across members. |
| [**Maintenance Preview**](./maintenance-preview-contract.md) (`week-31-wednesday-task-01`) | **One topology subject** (`node` / `link` / object) co-occurrence | **Maintenance-subject-primary**. Service dossier **may** include **optional** maintenance preview **links** when a **concrete** topology object is in scope from Explorer linkage—**not** a merged maintenance brain. |
| [**Impact Report v1**](./impact-report-contract.md) (`week-31-thursday-task-01`) | **Communication package** (`impact_report_v1`) with service / policy / maintenance contexts | Impact report **narrates** for handoff; service dossier is a **live workspace** composition. Relationship: **pivot** to **`service_impact`** impact report **or** honest “same anchors, different framing” copy—**not** interchangeable JSON (**`impact_report_v1`** ≠ **`evidence_export_v1`**; see impact and evidence contracts). |

---

## Supported subject types

| Subject | Identity | Notes |
| --- | --- | --- |
| **Service grouping or atomic policy** | **`service_id`** per [**Service Explorer**](./service-explorer-contract.md) (`policy:`, `color:`, `headend:`, `endpoint:`) | Same parsing, **404** / empty honesty as **`GET /api/v1/services/{service_id}`**. **Out of scope:** `service_id` forms not defined in Service Explorer v1. |

**Out of scope for v1:** multi-`service_id` bundles, abstract tickets without **`service_id`**, or dossiers whose primary subject is **only** a topology object without a service anchor (use [**topology object dossier**](./topology-object-dossier-contract.md)).

---

## Dossier purpose

The service dossier answers: **“What does the platform already expose about this service grouping in one composed view?”**—not **“What is the end-to-end SLA?”**, **“Who should approve change?”**, or **“What is the full dependency graph?”**

It reduces **navigation churn** between **Service Explorer**, **Policies** (per-member dossiers / explainability), **Topology**, **Investigation**, **Situation room**, **Operator briefing**, **Maintenance Preview**, and **Impact Report** by **echoing** bounded summaries and **linking** to the same read-only drill-downs—**not** merging them into a single new truth domain.

---

## Summary vs deep link (non-substitution)

| Layer | Role |
| --- | --- |
| **Service Explorer detail** (`GET /api/v1/services/{service_id}`) | **Authoritative** for **member list**, **degraded_service** roll-up, **topology_linkage** table shape—**same** inventory bounds. |
| **Policy dossier / explainability / path-analysis / timeline / delta** | **Authoritative** per **`policy_id`** for full payloads and **404** semantics. |
| **Topology object dossier / failure-impact / related-policies** | **Authoritative** per **object** for those contracts. |
| **Service dossier v1** | **Composed briefing**: **service identity**, **inventory posture summary**, **member and degraded summaries**, **topology linkage summary**, **pointers** to explainability / maintenance / impact / investigation / briefing / export—**merged** caveat block. It **does not** replace opening full Explorer, full policy dossier, or full topology dossier panels. |

If nested payloads disagree on freshness, **propagate the stricter caveat** in the merged block.

---

## Composed sources (reuse only)

The dossier may **only** assemble evidence from Phase **2** contracts already shipped. Conceptual mapping:

| Source | Contract / API | Role in service dossier |
| --- | --- | --- |
| **Service detail assembly** | **`GET /api/v1/services/{service_id}`** — [**Service Explorer**](./service-explorer-contract.md) | **Service identity**, **member `PolicyRecord` list**, **`degraded_service`**, **`policy_inventory`**, **`topology_linkage`**—**not** a second services API. |
| **Per-member degraded policy** | **`degraded_policy_v1`** on each member — [**degraded-policy-v1-contract.md**](./degraded-policy-v1-contract.md) | **Member policy summary** and **worst-degraded** highlights—**not** reclassification. |
| **Topology linkage** | Same as Explorer detail + optional [**related-policies**](./topology-related-policies-contract.md) / [**failure-impact**](./failure-impact-contract.md) **pointers** for **linked** objects | **Topology linkage summary**—**best-effort**, same honesty as Explorer. |
| **Policy dossier excerpts (optional)** | [**Policy dossier**](./policy-dossier-contract.md) **or** underlying **`path_analysis`**, **`topology-impact`**, **timeline**, **delta** routes | **Short rollups** or **“open policy dossier”** buttons—**not** mandatory full embed of **`policy_dossier_v1`**. |
| **Explainability pointer** | [**Policy explainability**](./policy-explainability-workspace-contract.md) | **Per selected / worst member**: “Open explainability”—**not** merging path-story bodies for all members by default. |
| **Maintenance Preview pointer** | [**Maintenance Preview**](./maintenance-preview-contract.md) | When **one** topology subject is clearly in scope from linkage: **single** preview navigation—**not** one preview per member simultaneously. |
| **Impact Report relationship** | [**Impact Report**](./impact-report-contract.md) **`service_impact`** context | **Pivot** to composed **`impact_report_v1`** for **communication**—honest label: **not** the same as live dossier freshness. |
| **Investigation / situation / briefing / digest** | [**Investigation**](./investigation-workspace-contract.md), [**Evidence pack**](./evidence-pack-contract.md), [**Operator briefing**](./operator-briefing-workspace-contract.md), [**Delta digest**](./cross-domain-delta-digest-contract.md) | **Same** shell params and **`sync_runs_limit`** discipline as Service Explorer **Dossier / investigation** pivots table—**optional** **`inv_from=service_dossier`** (or equivalent) for breadcrumbs **only**. |

**Disallowed as primary dossier evidence:** Grafana/Prometheus as dossier scores, workflow causality, ML ranking, write-side simulation.

**Optional export (future):** **`service_dossier_v1`** is **not** an **`export_kind`** in [**evidence export v1**](./evidence-export-contract.md) until that document and **`GET /api/v1/exports/...`** are explicitly extended—same posture as Impact Report vs **`evidence_export_v1`**.

---

## Required section layout (order is normative)

When implemented, presentation **SHOULD** follow this **top-to-bottom** order:

1. **Service identity and scope** — Echo **`service_id`**, grouping key explanation (`policy:` \| `color:` \| …), **member count**, **`items_returned` / `items_total`** when applicable.
2. **Service inventory posture summary** — **`degraded_service`** roll-up from Explorer semantics; **serving_mode** / **data_status** echoes from underlying policies API when surfaced—**not** a new health score.
3. **Member policy summary** — Bounded table or list: **`policy_id`**, **`policy_name`**, **`degraded_policy_v1.posture`**, optional **one-line** intent/observed hints—**stable sort** (e.g. lexicographic **`policy_id`**).
4. **Degraded-related policy summary** — Worst members or **count by posture**—aligned with **`degraded_policy_v1`**; **cap** + **“+N more”** if truncated.
5. **Topology linkage summary** — Condensed from Explorer **`topology_linkage`** (and honest **partial** / **unavailable** posture)—**not** full topology graph.
6. **Explainability and maintenance pointers** — Buttons or links: **policy explainability** for a **documented** default member (e.g. worst degraded); **Maintenance Preview** when a **single** **`node_id`/`link_id`** is selected per product rules—**read-only** navigation labels.
7. **Impact report relationship** — Link or short copy to **`view=impact-report`** with **`service_impact`** + **`service_id`**—**not** claiming the dossier body equals the downloaded **`impact_report_v1`** file.
8. **Investigation, situation room, briefing, delta digest pivots** — Same pattern as [**Service Explorer**](./service-explorer-contract.md) **Dossier / investigation / situation room pivots**; optional **`policy_id`** / topology pins for briefing—**not** duplicating assemblies in the dossier body.
9. **Export relationship (optional, future)** — If **`evidence_export_v1`** gains a **`service_dossier`** kind in a **future** revision, document **framing** here; until then, **no** implied export parity.
10. **Caveats, freshness, and missing-evidence notes** — Merged **`generated_at`**, nested timestamps, **`merged_caveats`**, **`missing_evidence_notes`**, topology partiality, persisted-fallback lines—**stricter caveat wins**.

Sections **may** collapse when empty; **order** stays stable when present.

---

## Freshness and caveat propagation rules

1. **Service scope:** Freshness is **as of dossier assembly time** plus **nested** source timestamps.
2. **No silent upgrade:** **Any** member or nested source **stale**, **partial**, or **blocked** → **visible** in the merged block.
3. **Stricter caveat wins** across members when summarizing.
4. **No new freshness vocabulary** beyond **`evidence_confidence`**, **`comparison_to_latest_persisted`**, and existing platform read-path patterns.

---

## Navigation expectations

- **Read-only** pivots only—existing **`view=`**, **`policy_id`**, **`service_id`**, **`policy_workspace`**, **`topology_object`**, **`sync_runs_limit`**, **`inv_from`**, maintenance subject params, impact report params per linked contracts.
- **No** approve / apply / schedule / validate actions.
- **Honest labels** on buttons (“Open policy dossier”, “Open explainability”, “Open maintenance preview”, “Service impact report”) matching destination contracts.

---

## Empty / sparse / partial evidence

| Condition | Required behavior |
| --- | --- |
| **Unknown or empty `service_id`** | **404** or honest empty per **`GET /api/v1/services/{service_id}`**—same as Explorer. |
| **Zero members** | Explicit empty copy—**not** fabricated policies. |
| **Partial topology linkage** | **Legend** and caveats per [**topology truth**](./topology-truth-depth-review.md). |
| **Some members missing path-analysis / timeline** | **Per-member** unavailable honesty or **omit** rollup with **note**—not invented evidence. |
| **No single topology subject for maintenance** | **Omit** maintenance pointer or show **disabled** with **reason**—not a fake subject. |

---

## Explicit non-claims

**Service dossier v1** is:

- **not** SLA proof, availability guarantee, or customer-impact scoring
- **not** billing or entitlement truth
- **not** end-to-end traffic-flow or dataplane proof
- **not** full service dependency or blast-radius truth
- **not** workflow, approval, change window, or maintenance authority
- **not** multi-vendor parity or feature-completeness proof
- **not** a substitute for **full** Service Explorer tables, **full** policy dossiers, or **full** topology inspection when depth is required
- **not** Grafana or Prometheus semantics (see [`dashboards.md`](./dashboards.md))

The phrase **“service dossier”** means **composed read-side briefing for one `service_id`**—not a CMDB service record of record.

---

## Relationship to other documents

| Topic | Document |
| --- | --- |
| Service Explorer (list/detail, `service_id`) | [`service-explorer-contract.md`](./service-explorer-contract.md) |
| Policy dossier | [`policy-dossier-contract.md`](./policy-dossier-contract.md) |
| Topology object dossier | [`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md) |
| Policy explainability | [`policy-explainability-workspace-contract.md`](./policy-explainability-workspace-contract.md) |
| Maintenance Preview | [`maintenance-preview-contract.md`](./maintenance-preview-contract.md) |
| Impact Report | [`impact-report-contract.md`](./impact-report-contract.md) |
| Evidence export / replay | [`evidence-export-contract.md`](./evidence-export-contract.md), [`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md) |
| Degraded policy | [`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md) |
| Policy truth | [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) |
| Topology truth | [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) |
| Current phase | [`../../agent/sdn/01-CURRENT-PHASE.md`](../../agent/sdn/01-CURRENT-PHASE.md) |

---

## Revision policy

Adding **new** truth domains, **unified** cross-service **health scores**, **write** paths, or **mandatory** full embeds of every member **`policy_dossier_v1`** requires **`service_dossier_v2`** (or explicit minor version) and updated non-claims.
