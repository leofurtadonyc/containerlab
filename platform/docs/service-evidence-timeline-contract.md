# Service evidence timeline contract (Phase 2, read-only)

## Purpose

This document is the **backend-owned bounded contract** for a future **service-centric evidence timeline** product slice: an operator-facing, **chronology-like** ordering of **existing** time-bearing evidence **scoped to one `service_id`**—so operators can see **how this service’s visible evidence evolved** in the bounded read models the platform already exposes—**without** claiming a unified incident log, workflow execution order, validation truth, SLA or customer-impact authority, or a new service catalog beyond [**Service Explorer v1**](./service-explorer-contract.md).

The timeline is **evidence-derived** and **service-scoped**: the primary subject is a **`service_id`** using the **same identity, parsing, and membership rules** as Service Explorer (`policy:`, `color:`, `headend:`, `endpoint:` — see **Service identity** below). It **assembles**, **labels**, and **orders** timestamps and pointers already present in API-visible or persisted evidence for **member policies** and **service-level rollups**; it does **not** invent collection streams, controller event buses, or dataplane samplers.

**Why this slice matters (Phase 2–safe):** the product already has strong **policy-centric** timelines ([**Policy evidence timeline**](./policy-evidence-timeline-contract.md)), **service** grouping and dossier surfaces ([**Service Explorer**](./service-explorer-contract.md), [**Service Dossier**](./service-dossier-contract.md)), and **impact-oriented** workspaces ([**Service Impact Workspace**](./service-impact-workspace-contract.md)). Operators still **bounce** between those views to infer a **service-level time story**. This contract defines a **single vocabulary** for a **service-primary chronology lens** that **reuses** those domains—**composition and ordering**, not a new truth engine.

Stable product vocabulary (for implementation and tests when the surface ships): **`contract_id`:** **`service_evidence_timeline_v1`**

**HTTP / WebUI:** **`GET /api/v1/services/{service_id}/evidence-timeline`** returns **`service_evidence_timeline_v1`** (**`schemas/service_evidence_timeline.py`**, **`services/service_evidence_timeline.py`**). **WebUI:** **Service Explorer** detail and **Service dossier** include **`ServiceEvidenceTimelinePanel`** — same non-claims as the API.

---

## Overlap review: why this is distinct, not a reopen

| Closed slice | Canonical role | **Service evidence timeline** is **not** a duplicate because |
| --- | --- | --- |
| [**Service Explorer v1**](./service-explorer-contract.md) (`week-31-monday-task-01`) | **List + detail** — **which policies** belong to **`service_id`**, degraded roll-up, topology linkage **columns** | Explorer is **inventory and membership authority**; the **timeline** is a **time-ordered** presentation of **evidence about** that membership—**not** a second Explorer **`GET`** and **not** replacing member counts or grouping rules. |
| [**Service Dossier v1**](./service-dossier-contract.md) (`week-32-monday-task-01`) | **One composed workspace** — section order, merged caveats, **briefing**-style orientation | Dossier is **static composed sections** for **one screen**; the **timeline** is **chronology-first** (ordered events/anchors)—**orthogonal** product shape. **Pivot** from dossier to timeline is expected; **not** the same JSON. |
| [**Policy evidence timeline**](./policy-evidence-timeline-contract.md) (`week-28-tuesday-task-01`) | **One `policy_id`** — policy-scoped **policy_evidence_timeline_v1** | Policy timeline is **policy-primary**. Service timeline is **service-primary**: it **aggregates** and **interleaves** evidence **across member policies** (and **service-level** signals) with **per-entry `policy_id`** provenance where applicable—**not** a rename of the policy route. |
| [**Service evidence delta**](./service-evidence-delta-contract.md) (planned **`service_evidence_delta_v1`**) | **A vs B** comparison for one **`service_id`** | **Difference** across anchors; **orthogonal** to chronology—complements timeline, **not** a replacement. |
| [**Operator briefing**](./operator-briefing-workspace-contract.md) | Cross-domain **digest** assembly (`operator_briefing_workspace_v1`) | Briefing is **breadth-first** and **sync-window**-aligned; service timeline is **scope=one service** and **time-ordered evidence**—**not** the same contract or replay/export envelope. |
| [**Service Impact Workspace**](./service-impact-workspace-contract.md) (`week-34+`) | **Impact-oriented** framing (`service_impact_workspace_v1`) — failure/topology relationship **summary** | Impact workspace emphasizes **impact interpretation** and **related** signals; timeline emphasizes **temporal ordering** of **evidence touches**—**complementary**; **not** interchangeable bodies. |
| [**Week 34** rollup / posture](../../agent/sdn-tasks/completed/week-34-friday-task-02-week34-docs-roadmap-rollup-and-posture.md) | Closed **Path Explorer** + **Service Impact** innovation lane | **Service evidence timeline** is **new** documentation for **week 35**; it **does not** reopen **`path_explorer_v1`** or **`service_impact_workspace_v1`** semantics—it **extends** the **service** story along the **time** axis. |

---

## Service identity (`service_id`)

Implementations **MUST** use the **same** **`service_id`** strings, **prefix rules**, **URL/path encoding**, **404 / empty membership** semantics, and **member policy** resolution as [**Service Explorer v1**](./service-explorer-contract.md):

- **Atomic and grouped forms** (`policy:`, `color:`, `headend:`, `endpoint:`) — **unchanged**.
- **Membership** for timeline scope = **same** member **`policy_id`** list as **`GET /api/v1/services/{service_id}`** for the current inventory slice (subject to list **`limit`/truncation** honesty).
- **Unsupported** **`service_id`** or **zero members** → **same** honest response as Explorer detail (**404** or documented empty posture)— **no** fabricated timeline rows.

---

## Supported evidence sources (bounded reuse only)

A v1 assembly may **only** draw on domains that already exist in Phase **2** and that expose **honest** timestamps or ordering anchors **relatable to** the **`service_id`** or its **member policies**. Typical sources (illustrative; exact field names follow existing schemas):

| Source | What it contributes | Honest limit |
| --- | --- | --- |
| **Service Explorer detail** (`GET /api/v1/services/{service_id}`) | **Assembly time** / response metadata, **`degraded_service`** roll-up context, **member list** anchors | **Not** a timeline by itself—**feeds** service-scoped **posture** and **membership** for interpreting entries. |
| **Per-member policy evidence timeline** (conceptual) | **Policy-scoped** entries **already defined** under **`policy_evidence_timeline_v1`** for each **`policy_id`** in the service | **Project** or **cite** into the service timeline **with** **`policy_id`** provenance—**not** recomputing a **different** policy timeline algorithm; **policy** route remains authoritative for **full** policy-only ordering. |
| **Policy inventory / history** (`GET /api/v1/policies`) | **`observed_at`**, snapshot **`persisted_at`**, comparison-to-previous for **member** policies | Bounded windows; **not** infinite history. |
| **Path analysis** (`GET /api/v1/policies/{policy_id}/path-analysis`) | **`path_analysis_assembly_anchor`**-class times for **members** | Interpretation-only per [**path-analysis-contract.md**](./path-analysis-contract.md). |
| **Topology / inventory** (when cited as **caveats** or **linkage** only) | Optional anchors when **topology_links** or **failure-impact** pivots exist for members | **Cites** topology/inventory contracts—**does not** merge graphs. |
| **Change intelligence** (`GET /api/v1/change-intelligence/recent-summary`) | **Optional** cross-domain context for **recency** of change signals affecting **members** | **Echo** bounded window semantics—**not** expanding into a new scoring engine. |
| **Workflow-history / audit-history** | Rows **only when** the existing envelope already embeds **policy** or **snapshot** metadata citeable for a **member** **`policy_id`** | Sync-derived, bounded—**not** full workflow lifecycle semantics. |
| **Readiness snapshots** (when already linked in product surfaces) | **Optional** anchors when a **readiness** artifact or summary is **already** associated with a **member** policy in an **honest** way in **existing** APIs | **No** new readiness workflow semantics. |

**Disallowed as primary timeline evidence:** Grafana panels, raw Prometheus series as “events,” synthetic **service health scores**, cross-service ranking, or **customer** SLA clocks.

---

## Timeline entry types (v1 vocabulary)

Entries are **typed** so operators do not confuse **inventory observation time** with **workflow causality**, **blast radius**, or **validation**.

| Type | Meaning |
| --- | --- |
| **`service_membership_snapshot_anchor`** | **Point-in-time** context tied to **Service Explorer** membership / inventory **slice** (e.g. response **`observed_at`** or equivalent **list** metadata). |
| **`member_policy_timeline_entry`** | A **normalized projection** of a **policy_evidence_timeline_v1** entry for a **member** **`policy_id`**, with **`source`** = **`policy_evidence_timeline_v1`** and **policy route** cited as **authoritative** for that row’s **full** policy-only context. |
| **`member_policy_history_checkpoint`** | **Persisted** checkpoint from **policy** **history** for a **member** **`policy_id`**. |
| **`member_path_analysis_assembly_anchor`** | Path-analysis **assembly** time for a **member** policy. |
| **`degraded_posture_shift_for_member`** | **Only** when **existing** **`degraded_policy_v1`** fields **change** between **honest** snapshots—**not** a new “health event stream.” |
| **`service_degraded_roll_up_context`** | **Optional** point when Service Explorer **`degraded_service`** posture is **recomputed** from members—**derived**, **not** an independent sensor. |
| **`sync_activity_touch`** | Workflow/audit row **only** when the row **explicitly** carries citeable **policy** or **snapshot** metadata for a **member**—**not** generic workflow steps. |
| **`gap_note`** | **Missing evidence**, **unsupported** chronology, or **partial** window—**first-class** (see **Gap notes**). |

Adding types that imply **execution**, **approval**, **incident** ownership, or **validation verdicts** requires a **new contract revision** and explicit non-claims.

---

## Ordering semantics

1. **Primary sort key** — Each entry carries **machine-comparable** timestamps taken **verbatim** from source payloads (`observed_at`, `persisted_at`, `assembly_generated_at`, etc.). Default ordering is **newest-first** for the **service** scope unless a follow-on explicitly defines **oldest-first** for a sub-view.
2. **Same instant** — When two entries share the same resolved instant, **tie-break** deterministically: type order (stable table in schema), then **`policy_id`** (lexicographic), then **`snapshot_id`** / source id if present.
3. **No causal inference** — Earlier/later in the list does **not** imply **cause**, **fault**, **incident** timeline, or **blast radius**. Ordering is **evidence ordering** over **bounded** product data.
4. **Cross-policy mixing** — Entries from **different member policies** **may** interleave by time; **every** entry **must** carry **visible provenance** (`policy_id` when applicable, **source domain**, **API pointer** string).
5. **No duplicate policy timeline** — The **service** timeline **does not** replace **`GET /api/v1/policies/{policy_id}/evidence-timeline`**; it **may** surface **subset** or **projection** rows **with** pointers to open the **full** policy timeline for **deep** inspection.

---

## Recency and assembly time

- **Recency** for the **service** scope means **“last time this evidence family was observed or persisted in the bounded product slice for any member or for the service roll-up,”** consistent with investigation and policy-timeline language: **embedded timestamps only**.
- The **composed** response **must** expose an explicit **`generated_at`** (or **`metadata.generated_at`**) for the **rollup** so operators **distinguish** **assembly time** from **underlying** observation times.

---

## Gap notes

The response (or UI) **must** surface **honest gaps**:

- **No policy history** for some members — **only** current inventory anchors; **say so**.
- **Partial member set** — **Truncation** or **`limit`** from Explorer or policies list **must** be **visible** in timeline framing.
- **No sync-derived** workflow/audit rows for **any** member — **do not** fabricate events.
- **Policy timeline unsupported** for a member — **omit** or **`gap_note`** with **open policy timeline** pivot.
- **Collector unavailable / persisted fallback** — Stale posture per **policy** row semantics.

**Gap notes** are **first-class** (`gap_note` entries or a dedicated list), not footnote-only.

---

## Explicit non-claims

Stable keys (align with schema literals when implemented):

- **`not_unified_incident_chronology`** — Not an incident timeline or on-call **SOC** log.
- **`not_workflow_execution_order`** — Not full workflow lifecycle history beyond **bounded** sync-derived evidence already exposed.
- **`not_validation_truth`** — Not conformance, drift verdict, or safe-to-change authority.
- **`not_sla_or_customer_impact`** — Not **SLA**, **customer**, or **billing** impact claims.
- **`not_packet_path_proof`** — Not dataplane or per-hop proof.
- **`not_service_catalog_authority`** — Not a CMDB or entitlement system beyond **`service_id`** grouping already defined in Service Explorer.
- **`not_cross_service_ranking`** — Not comparing **services** by synthetic “risk” or “health score.”
- **`not_grafana_timeline`** — Grafana remains observability-only; **no** Grafana-owned **product** timeline semantics ([`dashboards.md`](./dashboards.md)).
- **`not_substitute_for_policy_timeline`** — **Policy** evidence timeline remains **authoritative** for **pure policy** scope; **service** timeline is **service-scoped** **aggregation/projection**.

---

## Fallback behavior when only partial evidence exists

1. **Return what exists** — Emit only entry types with **non-empty** backing fields; **never** synthesize placeholder events.
2. **Downgrade scope** — Title and summary **must** say **“partial evidence window”** or **“current snapshot only”** when history is empty or detail is blocked.
3. **Preserve non-claims** — The default explicit non-claims list remains **fully** visible; partial evidence does **not** relax honesty.
4. **Sparse membership** — **Large** groups **may** cap entries per member with **`policy_id`** + **“+N more in policy timeline”** honesty—**not** silent truncation.

---

## Classification vs adjacent contracts

| Contract | Role |
| --- | --- |
| [**Policy evidence timeline**](./policy-evidence-timeline-contract.md) | **Policy-primary** **`policy_evidence_timeline_v1`**; **source** for **member_policy_timeline_entry** projections. |
| [**Service Explorer**](./service-explorer-contract.md) | **Membership and identity** authority; **not** timeline ordering. |
| [**Service Dossier**](./service-dossier-contract.md) | **Composed briefing**; **pivot** to timeline, **not** merge. |
| [**Investigation workspace**](./investigation-workspace-contract.md) | Cross-domain **workspace**; **InvestigationEvidenceTimeline** is **not** duplicated—**service** timeline is **narrower** and **service-primary**. |
| [**Operator briefing**](./operator-briefing-workspace-contract.md) | **Cross-domain digest**; **not** single-service chronology. |

---

## Gap audit (implementation follow-on)

| Area | Status (this task) |
| --- | --- |
| **Contract document** | **Delivered:** this file (`service-evidence-timeline-contract.md`). |
| **Schema + route** | **Shipped:** **`GET /api/v1/services/{service_id}/evidence-timeline`** — **`ServiceEvidenceTimelineResponse`** (**`service_evidence_timeline_v1`**) in **`schemas/service_evidence_timeline.py`**, **`routers/services.py`**. |
| **Assembly service** | **Shipped:** **`services/service_evidence_timeline.py`** — membership anchors + per-member **`policy_evidence_timeline_v1`** projections; no new collectors. |
| **WebUI** | **Shipped:** **Service Explorer** detail + **Service dossier** — **`service-evidence-timeline-panel.tsx`**. |
| **Tests / verifier** | **`pytest`** **`test_service_evidence_timeline.py`**; **`verify-core-runtime.sh`** structural check when **`first_service_id`** exists. |

---

## Related documents

- [`service-explorer-contract.md`](./service-explorer-contract.md)
- [`service-dossier-contract.md`](./service-dossier-contract.md)
- [`policy-evidence-timeline-contract.md`](./policy-evidence-timeline-contract.md)
- [`operator-briefing-workspace-contract.md`](./operator-briefing-workspace-contract.md)
- [`service-impact-workspace-contract.md`](./service-impact-workspace-contract.md)
- [`path-analysis-contract.md`](./path-analysis-contract.md)
- [`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md)
- [`data-flows.md`](./data-flows.md)
- [`agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md)
- [`agent/sdn/week-35-schedule-overview.md`](../../agent/sdn/week-35-schedule-overview.md)
