# Maintenance Preview v1 contract (Phase 2, read-only)

## Purpose

This document is the **product-owned bounded contract** for **Maintenance Preview v1**: a **read-only interpretation and assembly** that helps operators answer, using **existing** Phase **2** evidence only:

- **What normalized inventory and relationships** would a maintenance action on this **subject** likely **touch** or **align with** in the current slice?
- **Which services (policy groupings)** and **which policies** are **string-related** or **grouped** with that subject?
- **Where are degraded posture signals** and **failure-impact–style** relationship visibility already present—without claiming blast radius, simulation, or approval?

Phase **2** cannot claim **simulation**, **safe-to-change authority**, or **maintenance approval**. Maintenance Preview v1 **indexes, groups, and narrates** the same underlying contracts as [**Service Explorer**](./service-explorer-contract.md), [**Failure impact**](./failure-impact-contract.md), [**Topology object dossier**](./topology-object-dossier-contract.md), [**Policy explainability**](./policy-explainability-workspace-contract.md), and related read surfaces—**not** a new truth domain and **not** a dependency engine.

Stable product vocabulary (for implementation and tests when the surface ships): **`maintenance_preview_v1`**

**Relationship to adjacent surfaces:**

| Surface | Role | Distinction |
| --- | --- | --- |
| [**Failure impact**](./failure-impact-contract.md) (`failure_impact_v1`) | Relationship + posture visibility for one topology object | **Not** maintenance-scoped narrative; **not** “what would change” |
| [**Topology object dossier**](./topology-object-dossier-contract.md) | Composed object briefing | **Breadth**; not maintenance-prioritized section order |
| [**Service Explorer**](./service-explorer-contract.md) (`service_explorer_v1`) | Policy grouping / **`service_id`** lens | **Not** anchored to a maintenance event or window |
| [**Policy explainability**](./policy-explainability-workspace-contract.md) | Single-policy path story | **Depth** on one **`policy_id`**; not multi-policy maintenance scope |
| [**Change intelligence**](./change-intelligence-contract.md) | Recent cross-domain summary | **Temporal** aggregation; **not** maintenance subject scoping |
| **Maintenance Preview v1** | **Maintenance-oriented** preview over the same inputs | **Planning support** only; **no** new collector fields |

**Implementation posture (v1):** May ship as a **WebUI workspace** (e.g. `maintenance_preview=1` or dedicated route), **client-side composition** of existing APIs, and/or a **future** dedicated read assembly under **`GET /api/v1/...`**—this file defines **semantics and honesty**, not a mandatory ship shape before implementation exists.

---

## Supported maintenance subjects (v1)

| Subject | Identity | Notes |
| --- | --- | --- |
| **Topology node** | `node_id` on the current normalized topology snapshot | Same identity and **404** rules as [**failure impact**](./failure-impact-contract.md) / [**related policies**](./topology-related-policies-contract.md). |
| **Topology link** | `link_id` on the current normalized topology snapshot | Related policies are the **union** of endpoint matches; co-presence **does not** imply dataplane use of the link (see topology-related-policies contract). |

**v1 scope:** **Node and link first.** Other subjects (device-only without topology mapping, abstract “maintenance ticket,” region, or service-only without topology anchor) are **out of scope** until a follow-on contract revision explicitly extends this document.

---

## Supported preview contexts

Preview contexts are **operator framing cues** (labels for UX and navigation), **not** API authorization or scheduling:

| Context | Meaning |
| --- | --- |
| **`planning_window`** | Operator is **reasoning** about a future or in-progress maintenance window—preview is **interpretation** of current read-side evidence. |
| **`topology_drilldown`** | Subject was selected from **Topology** or topology-impact / related-policies pivots. |
| **`change_adjacent`** | Opened adjacent to **change intelligence** or **delta digest** mental model—**not** causal “this change caused maintenance.” |
| **`explicit_subject`** | Explicit **`object_id`** + **`object_kind`** (node \| link) are the only authoritative anchors.

Contexts **do not** change assembly math; they may **only** affect **caveats**, **section ordering**, or **shell navigation hints**.

---

## Bounded assembly rules

The **MUST** rules are:

1. **Reuse only:** Assemble **only** from contracts already defined in Phase **2** (see [Evidence sources](#evidence-sources-composed-reuse-only)).
2. **No new scoring:** Do **not** invent **impact scores**, **severity**, **blast-radius** distance, **traffic** estimates, or **risk** beyond vocabulary already on **`degraded_policy_v1`**, **failure-impact** rollups, and **topology** partiality axes.
3. **Same identity rules:** Policy–topology relationships **must** follow [**topology-related-policies**](./topology-related-policies-contract.md) string-equality rules; service groupings **must** follow [**Service Explorer**](./service-explorer-contract.md) **`service_id`** semantics.
4. **Honest caps:** List caps, **“top N”** sections, and **empty** sections **must** be visible when data is sparse—not hidden to imply completeness.
5. **No write path:** No **dry-run**, **workflow**, **approval**, or **simulation** of configuration or traffic.

---

## Evidence sources composed (reuse only)

| Source | Contract / API | Role in maintenance preview |
| --- | --- | --- |
| **Topology snapshot** | `GET /api/v1/topology` — [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) | Resolve subject identity; cite **partiality** axes. |
| **Related policies** | `GET /api/v1/topology/objects/{object_id}/related-policies` — [`topology-related-policies-contract.md`](./topology-related-policies-contract.md) | **Primary** policy set “touched” by naming alignment—**not** validated underlay adjacency. |
| **Failure impact** | `GET /api/v1/topology/objects/{object_id}/failure-impact` — [`failure-impact-contract.md`](./failure-impact-contract.md) | **Reuse** relationship + posture rollups as **summary**; same **non-claims** as failure impact. |
| **Service Explorer** | `GET /api/v1/services`, `GET /api/v1/services/{service_id}` — [`service-explorer-contract.md`](./service-explorer-contract.md) | **Group** policies into **service** views; **pointers** only. |
| **Policies inventory** | `GET /api/v1/policies` — [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) | Row truth for **degraded** and **candidate** hints; **stale** row semantics preserved. |
| **Policy explainability** (optional pointer) | `GET /api/v1/policies/{policy_id}/explainability` — [`policy-explainability-workspace-contract.md`](./policy-explainability-workspace-contract.md) | **Per-policy** deep link for “why path / candidate” — **not** a substitute for full panels. |
| **Topology object dossier** (optional pointer) | `GET /api/v1/topology/objects/{object_id}/dossier` — [`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md) | **Object** briefing complement — **not** merged into a single maintenance verdict. |

**Disallowed as primary evidence for v1:** Grafana/Prometheus as **business truth**, **synthetic** maintenance graphs, **workflow** run predictions, **OpenDaylight** as omniscient path authority, or **write-side** simulation.

---

## Impact section types (normative)

Sections **may** be titled for product UX; semantics **must** align with these **types**:

| Section type | Meaning |
| --- | --- |
| **Maintenance subject summary** | Canonical **`object_kind`**, **`object_id`**, display names from topology; **freshness** / **partiality** echo. |
| **Related services** | **Service Explorer**-style groupings (`color:`, `headend:`, `endpoint:`, `policy:`) that intersect the **related policy set**—**derived**, not a new catalog. |
| **Related policies** | Enumeration or capped list from **related-policies** / inventory—**same** relationship rules as failure impact. |
| **Degraded related policies** | Rollup of **`degraded_policy_v1`** **within** the related set only (see failure-impact and degraded-policy contracts). |
| **Failure-impact reuse summary** | Short echo or embed of **failure impact v1** buckets **for this subject**—**interpretation support**, not duplicated scoring. |
| **Explainability pointers** | Optional **per-`policy_id`** links to **policy explainability** or **path analysis**—**hints**, not proof. |
| **Service Explorer pointers** | Deep links with documented **`service_id`** forms—**navigation** only. |
| **Caveats / unsupported areas** | **Merged** or **per-source** caveat lines; **topology** partiality, **inventory** stale rows, **empty** related sets. |

Adding sections that imply **simulation**, **SLA**, **approval**, or **global** blast radius requires a **new contract revision** and explicit non-claims.

---

## Suggested narrative order (when present)

1. **Maintenance subject summary** — what object is in scope; **not** “what will break.”
2. **Related services and policies** — grouped and flat views; **honest** caps.
3. **Degraded related policies** — posture within the related set only.
4. **Failure-impact reuse summary** — pointer to **failure_impact_v1** semantics.
5. **Explainability pointers** — per-policy **depth** links.
6. **Service Explorer pointers** — **`service_id`** navigation.
7. **Caveats / unsupported areas** — **sparse** and **empty** behavior explicit.

---

## Empty / sparse behavior

| Condition | Required behavior |
| --- | --- |
| **Unknown topology object** | **404** or **empty** subject—same as related-policies / failure-impact when **`object_id`** is not on the snapshot. |
| **No related policies** | **Explicit** “no related policies in this slice”—**not** “no impact.” |
| **No service groupings** | Show **empty** Explorer grouping sections; **not** fabricated placeholders. |
| **Collector / persisted partiality** | Surface **topology** and **policy** partiality axes in **caveats**—aligned with existing contracts. |
| **Stale inventory rows** | **Echo** stale posture where applicable—**not** silent refresh. |

---

## Export / report relationship

- **Evidence export v1** ([`evidence-export-contract.md`](./evidence-export-contract.md)) defines **deterministic** exports of **existing** assemblies (e.g. topology object dossier, policy dossier).
- **Maintenance Preview v1** is **not** a mandatory **`export_kind`** in Phase **2** until explicitly added to **`evidence-export-contract.md`** and implemented under **`GET /api/v1/exports/...`**.
- **Until then:** operators may **compose** the same APIs in the WebUI and optionally **attach** a **manual** archive of JSON/Markdown from **nested** exports (e.g. dossier per object/policy)—**not** a maintenance **approval** pack.
- A **future** **`maintenance_preview`** export would **serialize** only **documented** preview sections and **must** include **`source_contract_ids`** and **non-claims** consistent with this file.

---

## Explicit non-claims

**Maintenance Preview v1** is:

- **not** a **simulation** engine or **what-if** traffic engine
- **not** blast-radius truth or dependency completeness beyond string-equality and inventory bounds
- **not** **safe-to-change** guidance, **risk scoring**, or **approval** to execute work
- **not** a **maintenance approval** tool, **change control** system, or **workflow** authority
- **not** a **protection** guarantee for traffic or services
- **not** **SLA** assurance, **availability** guarantee, or **customer** entitlement truth
- **not** **dataplane** forwarding proof or **TE** / **BGP-LS** path authority
- **not** a substitute for **full** failure-impact, **Service Explorer**, or **explainability** panels when deep inspection is required

Additionally:

- **not** **Grafana** / **Prometheus** as primary evidence for maintenance scope
- **not** implied **operator** sign-off or **audit** of maintenance readiness

---

## Contract id

- **`contract_id`:** **`maintenance_preview_v1`** on any **dedicated** assembly response when implemented (parallel naming to other `*_v1` product assemblies).

---

## References

| Topic | Document |
| --- | --- |
| Failure impact | [`failure-impact-contract.md`](./failure-impact-contract.md) |
| Topology ↔ policy | [`topology-related-policies-contract.md`](./topology-related-policies-contract.md) |
| Degraded policy (v1) | [`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md) |
| Service Explorer | [`service-explorer-contract.md`](./service-explorer-contract.md) |
| Topology object dossier | [`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md) |
| Policy explainability | [`policy-explainability-workspace-contract.md`](./policy-explainability-workspace-contract.md) |
| Change intelligence | [`change-intelligence-contract.md`](./change-intelligence-contract.md) |
| Evidence export | [`evidence-export-contract.md`](./evidence-export-contract.md) |
| Topology truth | [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) |
| Policy truth | [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) |
| Current phase | [`../../agent/sdn/01-CURRENT-PHASE.md`](../../agent/sdn/01-CURRENT-PHASE.md) |

---

## Revision policy

Adding **simulation**, **approval workflows**, **global** blast-radius models, **write** paths, or **new** collector-only domains requires **`maintenance_preview_v2`** (or an explicit minor version) and updated non-claims.
