# Service Explorer v1 contract (Phase 2, read-only)

## Purpose

This document is the **product-owned bounded contract** for **Service Explorer v1**: a **service-centric read lens** that helps operators answer, within **existing** Phase **2** evidence only:

- **Which normalized policies** (and thus which SR-style “service” intents) are in scope for a selected grouping?
- **Which policy** carries a given **color / headend / endpoint** combination in the current inventory slice?
- **Which degraded policies** matter when viewing that grouping (**[`degraded_policy_v1`](./degraded-policy-v1-contract.md)** roll-up)?

**Service Explorer** **indexes, groups, and summarizes** policy and topology identities already exposed by **`GET /api/v1/policies`**, **`GET /api/v1/topology`**, and related read routes. It **does not** introduce a separate CMDB “service catalog,” traffic-matrix proof, or entitlement system.

Stable product vocabulary (for implementation and tests when the surface ships): **`service_explorer_v1`**

**Relationship to adjacent surfaces:**

| Surface | Role | Distinction |
| --- | --- | --- |
| [**Policies**](./policy-truth-depth-review.md) inventory | **Authoritative** per-row policy truth (bounded) | Flat table; **not** grouped “service” narrative |
| [**Topology object dossier**](./topology-object-dossier-contract.md) | Object-centric composed workspace | **Not** policy-color–first |
| [**Policy dossier**](./policy-dossier-contract.md) | Single **`policy_id`** deep view | **Not** multi-policy grouping |
| [**Service Dossier v1**](./service-dossier-contract.md) | **One** **`service_id`** composed briefing | **Not** Explorer list/detail—**assembled** section order + merged caveats |
| [**Service evidence timeline**](./service-evidence-timeline-contract.md) (planned **`service_evidence_timeline_v1`**) | **Chronology** over **existing** evidence for one **`service_id`** | **Not** list/detail—**time-ordered**; **same** **`service_id`** rules; **not** implemented until API ships |
| [**Investigation**](./investigation-workspace-contract.md) | Cross-domain **workspace** assembly | **Not** a dedicated “service grouping” index |
| **Service Explorer** | **Grouping & pivot** lens over the same inventory | **Read-only**; **derived** views only |

**Implementation posture (v1):** **`GET /api/v1/services`** and **`GET /api/v1/services/{service_id}`** are implemented in **app-api** (week **31** Monday task **02**); clients may also compose the same inputs locally. This file defines **what a service is**, **`service_id`** semantics, **honesty limits**, and **navigation**—not a mandatory UI shape.

---

## What “service” means in the current bounded Phase 2 slice

In **v1**, a **service** is a **product-defined view** over **policy inventory** (and **optional** topology linkage) — **not** an independent network layer that replaces **`policy_id`**.

1. **Finest grain (atomic unit):** A single **`PolicyRecord`** identified by **`policy_id`** is always a valid **service instance** for Explorer purposes when the row is present in **`GET /api/v1/policies`** items. This answers “**which policy** carries this intent?” without inventing a second identifier.
2. **Coarse grain (grouped lens):** **Aggregates** of policies that share a **stable, documented** grouping key drawn **only** from normalized policy fields already on each row (e.g. **`color`**, **`headend`**, **`endpoint`**, **`policy_type`**) — **not** arbitrary tags or external IDs.
3. **Vendor / lab posture:** The current Nokia-first slice emphasizes **`static_local`** (and related) **`policy_type`** values where present; **empty** or **unsupported** families remain **honest** per [`policy-truth-depth-review.md`](./policy-truth-depth-review.md).

**Out of scope for v1:** L3VPN/VPN service models, customer billing IDs, cloud “microservices,” or any **new** collector field introduced solely for Explorer.

---

## Service identity and scope

### `service_id` (normative string form)

Implementations **MUST** expose a **`service_id`** string that operators can **copy**, **deep-link**, and **round-trip** through list and detail routes. **v1** **RECOMMENDED** encodings (choose one documented scheme per product; do not mix opaque hashes without a spec):

| Prefix | Meaning | Typical use |
| --- | --- | --- |
| `policy:` | Single policy **`policy_id`** | Atomic detail; one row |
| `color:` | Integer **SR color** (from **`PolicyRecord.color`**) | Aggregate all policies with that color |
| `headend:` | **`headend`** string (PE / device id as stored) | Aggregate by headend |
| `endpoint:` | **`endpoint`** string (destination / prefix as stored) | Aggregate by endpoint |

**Examples (illustrative):** `policy:PE1:static_local:192.0.2.11:100`, `color:100`, `headend:PE1`, `endpoint:192.0.2.11`

**Rules:**

1. **Characters** — Use **URL-safe** encodings when **`service_id`** appears in path segments; **percent-encode** or restrict to unreserved characters per product choice; **document** the chosen encoding in the API.
2. **Uniqueness** — **`policy:`** is **1:1** with a policy row when that row exists. **`color:` / `headend:` / `endpoint:`** are **1:N** with policy rows; **may be empty** if no inventory rows match.
3. **Ambiguity** — If two grouping keys collide after normalization (e.g. string normalization), **document** deterministic tie-break (e.g. lexicographic **`policy_id`** on nested lists).

### Scope

- **In scope:** Policies **returned** in the current **`GET /api/v1/policies`** list (subject to API **`limit`**, truncation, and **`data_status`**).
- **Out of scope:** Policies **not** in the current inventory response **cannot** appear as “live” members; **persisted_fallback** or **empty** postures follow the **same** honesty as the policies API.

---

## Supported service identities and groupings

**v1** **SHOULD** support at least:

1. **List** — Discoverable **grouped** entries (by color, headend, endpoint, or single-policy rows) with **counts** and **worst degraded** hint.
2. **Detail** — For a **`service_id`**, **members** = **`policy_id`** list (or single member) with **summary** fields from **`PolicyRecord`**.
3. **Optional filters** — Only when they map **directly** to existing `PolicyRecord` / list query params (e.g. **`degraded_policy_v1.posture`**, **`policy_type`**) — **not** ad-hoc search over opaque blobs.

**Groupings** **MUST NOT** imply new **cross-domain scores**; they are **group-by** keys on **existing** columns.

---

## Linked policies

1. **Membership** — A **service** **contains** **zero or more** **`policy_id`** values from the current policies inventory.
2. **Ordering** — **Stable** ordering (e.g. **`policy_id`** lexicographic) **unless** the contract documents another deterministic order.
3. **Truncation** — If a group is **large**, **show** **`items_returned`** / **`items_total`** (or equivalent) when the API provides them; otherwise a **one-line truncation note** is **required**.
4. **Degraded column** — Each member **SHOULD** surface **`degraded_policy_v1`** ([`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md)) **posture** or a **link** to policy row semantics.

---

## Linked topology objects

Topology linkage is **derived** and **best-effort**:

1. **From policy fields** — **`headend`**, **`source_target`**, **`endpoint`** (and any **documented** device-facing strings on **`PolicyRecord`**) **MAY** be matched to **`GET /api/v1/topology`** **`nodes[].node_id`**, **`display_name`**, or **device** anchors **only** when the product documents the matching rule (exact string match, case rule, or “no match”).
2. **From related-policies APIs** — When a **topology object** is already in scope, **`GET /api/v1/topology/objects/{object_id}/related-policies`** ([`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md) family) **MAY** be used to **reverse** link policies → topology — **same** bounded semantics as that route.
3. **Honesty** — **Partial** or **empty** topology linkage **MUST** be visible (no silent “no topology” when the API failed).

**Non-claim:** **Not** full **dependency graph** or **path proof** — see **Explicit non-claims** below.

---

## Degraded service posture semantics

**Derived posture** for a **grouped** service **MUST** be **computed only** from **`degraded_policy_v1`** on **member** policies:

| Roll-up (v1) | Rule (recommended) |
| --- | --- |
| **`worst`** | If **any** member has **`posture=degraded`**, the group **worst** is **degraded**; else if **any** **`unknown`**, **unknown**; else **ok** |
| **Reasons** | Union or **top-N** **`reason_codes`** with **explicit** cap and **“+N more”** if truncated |

**Do not** invent **`service_health_score`** or a **new** posture enum beyond **aggregating** **`degraded_policy_v1`**.

---

## Recent evidence / delta / digest cues

**Optional** **v1** pointers (not required for minimal API):

- **Recent change** — Echo or link to **`GET /api/v1/change-intelligence/recent-summary`** ([`change-intelligence-contract.md`](./change-intelligence-contract.md)) with **same** **`sync_runs_limit`** discipline as other surfaces.
- **Delta digest** — Pointer to **`cross_domain_delta_digest_v1`** ([`cross-domain-delta-digest-contract.md`](./cross-domain-delta-digest-contract.md)) for **cross-domain** “what moved” — **not** a second digest engine.

These are **interpretation support** only.

---

## Dossier / investigation / situation room pivots

**Navigation** **MUST** use **existing** shell helpers and query names:

| Destination | Inputs |
| --- | --- |
| **Policy dossier** | **`policy_id`**, **`policy_workspace=dossier`**, **`policy_dossier_entry`** / source per [`policy-dossier-contract.md`](./policy-dossier-contract.md) |
| **Topology dossier** | **`topology_object`**, **`topology_object_kind`**, **`topology_workspace=dossier`** per [`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md) |
| **Investigation** | **`view=investigation`**, **`sync_runs_limit`**, optional **`policy_id`** / topology object, **`inv_from`** per [`investigation-workspace-contract.md`](./investigation-workspace-contract.md) |
| **Situation room** | **`view=situation-room`**, **`sync_runs_limit`** per [`evidence-pack-contract.md`](./evidence-pack-contract.md) |
| **Operator briefing** | **`view=operator-briefing`** with optional **`policy_id`** / topology pins per [`operator-briefing-workspace-contract.md`](./operator-briefing-workspace-contract.md) |

**Non-substitution:** Explorer **orients**; **Policies**, **Topology**, **Investigation**, **Situation room**, and **Briefing** remain **authoritative** for their contracts.

---

## Caveats / missing evidence

1. **Empty policy inventory** — **Empty** service list with **explicit** reason echo (`empty_reason`, `data_status`, or API-level note).
2. **Partial topology** — **Partial** graph or **inferred** links **MUST** carry **caveats** consistent with [`topology-truth-depth-review.md`](./topology-truth-depth-review.md).
3. **Persisted fallback** — If policies are **serving_mode** persisted fallback, **surface** the same posture as **`GET /api/v1/policies`** — **not** “live service” claims.
4. **Failed nested fetch** — If an optional **related-policies** or **topology** fetch fails, **isolate** failure per section (same pattern as [`operator-briefing-workspace-contract.md`](./operator-briefing-workspace-contract.md) **failure isolation**).

---

## Empty and sparse behavior

| Condition | Required behavior |
| --- | --- |
| **No policies** | Empty list or **empty** detail with **guidance** and **non-claim** about inventory bounds |
| **Group has zero members** | **404** or **empty** with **explicit** “no policies match this grouping key” — **not** fabricated rows |
| **Some members lack topology** | **Per-row** “unknown” or **omit** topology column with **legend** |
| **Truncated API list** | **Honest** truncation; **do not** imply **completeness** beyond **`items_total`** when present |

---

## Navigation expectations

1. **Deep links** — **`service_id`** in **`GET /api/v1/services/{service_id}`** (or equivalent) **must** match list entries **without** client-side guesswork.
2. **Return context** — **Optional** **`inv_from=service_explorer`** (or equivalent) on **Investigation** / **Briefing** for breadcrumb **only** — **not** authority sent to **app-api** beyond documented hints.
3. **Global search** — Operator search **may** pivot to **policy** or **topology** hits; **Service Explorer** **does not** replace [`operator-search-contract.md`](./operator-search-contract.md).

---

## Explicit non-claims

**Service Explorer v1** is:

- **not** end-to-end **SLA** truth
- **not** customer **billing** or **entitlement** truth
- **not** **traffic-flow** or dataplane **proof**
- **not** complete **service dependency** mapping
- **not** a **workflow** surface
- **not** a **maintenance approval** surface

Additionally:

- **not** a substitute for **full** **Policies** or **Topology** tables when deep inspection is required
- **not** a **new** validation or **safe-to-change** authority
- **not** **Grafana** or **Prometheus** semantics (see [`dashboards.md`](./dashboards.md))

---

## Contract id

- **`contract_id`:** **`service_explorer_v1`** on any **dedicated** assembly response (e.g. `ServicesListResponse` / `ServiceDetailResponse`) when implemented.

---

## Backend API (app-api, shipped)

**Routes:** **`GET /api/v1/services`** (grouped index) and **`GET /api/v1/services/{service_id}`** (detail).

**Path encoding:** `{service_id}` uses a **catch-all path segment** so **`policy:`** rows whose **`policy_id`** contains colons round-trip without ambiguity. Clients should still **percent-encode** reserved characters when forming URLs; the server decodes the path parameter before parsing.

**List rows:** One row per **`policy:{policy_id}`** for each inventory policy, plus one row per distinct **`color:`**, **`headend:`**, and **`endpoint:`** value observed in the current **`GET /api/v1/policies`** slice. Rows are sorted lexicographically by **`service_id`**. Optional **`limit`** (same bounded **`read_side_query`** pattern as policies/devices) truncates the **flat list of service rows** without shrinking policy inventory truth.

**Detail:** Members are **`PolicyRecord`** rows matching the **`service_id`** grouping; stable order is lexicographic **`policy_id`**. **Zero members** yields **HTTP 404** (unknown **`service_id`** form, or grouping key not present in the current inventory). **`degraded_service`** applies the **worst** roll-up from **`degraded_policy_v1`** on members.

**Topology:** Best-effort links match **`headend`**, **`source_target`**, and **`endpoint`** strings to **`GET /api/v1/topology`** nodes using **exact** equality on **`node_id`**, **`display_name`**, or **`device_id`** (when present). **`topology_evidence_status`** is **`unavailable`** if topology assembly failed, **`partial`** when the graph is empty or no node matched, otherwise **`present`** when at least one match exists (coverage-axis caveats may still apply).

---

## References

| Topic | Document |
| --- | --- |
| Policy inventory | [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) |
| Degraded policy classification | [`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md) |
| Topology object dossier | [`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md) |
| Policy dossier | [`policy-dossier-contract.md`](./policy-dossier-contract.md) |
| Service dossier | [`service-dossier-contract.md`](./service-dossier-contract.md) |
| Investigation workspace | [`investigation-workspace-contract.md`](./investigation-workspace-contract.md) |
| Evidence pack / situation room | [`evidence-pack-contract.md`](./evidence-pack-contract.md) |
| Operator briefing | [`operator-briefing-workspace-contract.md`](./operator-briefing-workspace-contract.md) |
| Change intelligence | [`change-intelligence-contract.md`](./change-intelligence-contract.md) |
| Cross-domain delta digest | [`cross-domain-delta-digest-contract.md`](./cross-domain-delta-digest-contract.md) |
| Operator search | [`operator-search-contract.md`](./operator-search-contract.md) |
| Current phase | [`../../agent/sdn/01-CURRENT-PHASE.md`](../../agent/sdn/01-CURRENT-PHASE.md) |

---

## Revision policy

Adding **new** truth domains, **unified** cross-domain **health scores**, or **write** paths requires **`service_explorer_v2`** (or an explicit minor version) and updated non-claims.
