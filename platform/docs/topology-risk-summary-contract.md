# Topology risk summary v1 contract (Phase 2, read-only)

## Purpose

This document is the **backend-owned bounded contract** for a future **read-only topology risk summary** product slice: a **fast, ordered view** of **which topology objects (nodes and links) currently merit operator attention**, using **only** evidence the platform already exposes for **topology↔policy relationships** and **`degraded_policy_v1`** on policy rows.

**Topology risk summary v1** is **evidence-derived** and **inventory-current**: it **ranks** objects using **deterministic, inspectable inputs** assembled from the **same** normalized topology snapshot and policy inventory that back existing read APIs. It does **not** simulate failures, estimate traffic, compute blast radius, or optimize the network.

Stable **`contract_id`:** **`topology_risk_summary_v1`**

Implementation references:

- **`GET /api/v1/topology/risk-summary`** — **`TopologyRiskSummaryResponse`** (`schemas/topology_risk_summary.py`, **`services/topology_risk_summary.py`**, route on **`routers/topology.py`**); repository **`pytest`** in **`test_topology_risk_summary.py`** (Docker **`platform-app-api`** image per **`INSTALLATION-INSTRUCTIONS.md`**).

When implemented, semantics must stay aligned with:

- [`topology-related-policies-contract.md`](./topology-related-policies-contract.md) — how policies **relate** to a node or link
- [`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md) — per-policy **`degraded_policy_v1.posture`** (`ok`, `degraded`, `unknown`)
- [`failure-impact-contract.md`](./failure-impact-contract.md) — per-object relationship + degraded rollup **within the related set** (summary v1 **reuses the same conceptual evidence** for **ranking across objects**, not new truth)

---

## Naming honesty

The word **“risk”** in the product name is **short-hand for attention prioritization** from **relationship and degraded-policy signals** only. Prefer operator copy such as **“attention summary”**, **“objects to review”**, or **“relationship-weighted attention”** when a single label is needed without implying dataplane or service risk.

---

## Supported subjects

| Subject | Identity | Notes |
| --- | --- | --- |
| **Topology node** | `node_id` on the current normalized topology snapshot | Same identity rules as related-policies and failure-impact (**exclude** unknown ids). |
| **Topology link** | `link_id` on the current normalized topology snapshot | Related policies are the **union** of matches per **`topology-related-policies-contract.md`** (endpoint rules). |

The summary considers **both** nodes and links in **one** combined ranking unless a follow-on explicitly splits views. **Out of scope for v1:** regions, SRLGs, services, device-only subjects without a topology row, or policy-first rankings.

---

## Bounded evidence sources (reuse only)

Summary v1 may **only** draw on read-side evidence already defined for Phase **2**:

| Source | Role in summary v1 | Honest limit |
| --- | --- | --- |
| **Topology snapshot** | Enumerate candidate **`node_id`** / **`link_id`** values; echo partiality for **caveats** | Inference-bounded; not full underlay truth ([`topology-truth-depth-review.md`](./topology-truth-depth-review.md)). |
| **Per-object related-policy set** | For each object, the **same** policy id set as **`GET /api/v1/topology/objects/{object_id}/related-policies`** (or **logically equivalent** assembly) | String-equality pivots only; **not** completeness outside inventory. |
| **`degraded_policy_v1` on each related policy** | Count postures **`degraded`**, **`unknown`**, and **`ok`** **within that object’s related set only** | Same classification as policy list; **not** a new posture engine. |
| **Assembly / snapshot timestamps** | **`generated_at`**, optional freshness echoes | Distinguish rollup time from device/controller truth. |

**Disallowed as primary evidence for v1:** Grafana, Prometheus scrape math as ranking inputs, workflow or audit history as causality, path-analysis path math, synthetic ML scores, or any write-side or simulated execution.

Optional **path-analysis** or **failure-impact** pointers may appear as **navigation hints** in a follow-on but **must not** feed the v1 **ranking tuple** unless this contract is revised.

---

## Ranking inputs (transparent, modest)

For **each** topology object `o`, derive **integer counts** from **current** policy inventory rows **restricted** to policies in **`related_policies(o)`**:

| Input | Symbol | Definition |
| --- | --- | --- |
| **Degraded count** | `D(o)` | Count of related policies where **`degraded_policy_v1.posture == "degraded"`** |
| **Unknown count** | `U(o)` | Count of related policies where **`degraded_policy_v1.posture == "unknown"`** |
| **Related breadth** | `R(o)` | **`|related_policies(o)|`** — total related policies (including `ok`) |
| **OK count** (derived) | `K(o)` | `R(o) - D(o) - U(o)` when postures partition the related set; if a row is indeterminate, follow **`degraded_policy_v1`** rules for classification |

These four quantities are **bounded** by inventory size and **interpretable**: they are **counts**, not calibrated probabilities.

### Default ordering (v1 lexicographic rank)

Unless a future revision defines a different **documented** rule, **sort keys** for **descending attention** are applied **in order**:

1. **`D(o)`** — higher first (more degraded postures in the related set).
2. **`U(o)`** — higher first (more unknown postures).
3. **`R(o)`** — higher first (more related policies when degraded/unknown ties).
4. **Stable tie-break** — e.g. **`object_kind`** (`node` before `link`, or as specified in schema), then lexical **`object_id`**.

Objects with **`R(o) == 0`** (no related policies) sort **after** any object with **`R(o) > 0`**, and tie-break among zeros by **`object_kind`**, **`object_id`**.

This ordering is **not** a scalar “risk score”; it is a **total order** from **published tuple keys**. Clients may display the tuple or a **rank index** (1…N); they **must not** relabel the tuple as SLA, traffic risk, or failure likelihood.

### Degraded-policy weighting

v1 **does not** use hidden weights. **Priority** is expressed by the **lexicographic order** above: **degraded** counts dominate **unknown**, which dominate **breadth** (`R`). If a product iteration introduces an explicit **linear score** (e.g. for a single sort column), it **must** be documented here with **integer coefficients**, **caps**, and **overflow behavior**, and it **must remain** derivable from **`D`, `U`, `R`** only—still **no** traffic, SLA, or simulation terms.

---

## Confidence and caveats

Responses (when implemented) should expose **honest limits** alongside ranked rows:

| Field / theme | Meaning |
| --- | --- |
| **`ranking_basis`** | Literal reference to **`topology_risk_summary_v1`** and this document version. |
| **`inputs_echo`** | Optional echo of **`D`, `U`, `R`** per row so ranking is **auditable** without reverse-engineering. |
| **`caveats`** | Topology partiality, empty/partial policy inventory, persisted **stale** rows, **counters-only** policy list modes—reuse vocabulary from [`failure-impact-contract.md`](./failure-impact-contract.md) and topology contracts. |
| **`confidence` (optional)** | **`low`** or **`medium`** for the **rollup assembly** (inventory + topology coherence), **not** confidence in network safety or forwarding. |
| **Subset scope** | Rows **must not** imply that **`D`/`U` on an object** equal **global** policy health (same rule as failure-impact **degraded_policy_rollup**). |

---

## Explicit non-claims

Stable keys (align with schema literals when implemented):

- **`not_sla_or_service_risk_truth`** — Ordering reflects **inventory posture counts** on **related** policies, not contractual SLA or service availability.
- **`not_traffic_or_dataplane_risk_truth`** — **No** claim about load, congestion, drops, or TE outcome.
- **`not_failure_probability`** — Counts are **not** probabilities or MTBF-style estimates.
- **`not_validated_blast_radius`** — Relationship pivots are **not** dependency or propagation graphs ([`topology-related-policies-contract.md`](./topology-related-policies-contract.md)).
- **`not_optimization_engine`** — **No** recommendation engine, reroute solver, or “best next action.”
- **`not_global_policy_health_ranking`** — Object ordering uses **per-object related sets**; it is **not** “worst policies in the entire inventory” unless a different contract says so.
- **`not_validation_or_safe_change_authority`** — **No** approval, drift verdict, or safe-to-change recommendation.
- **`not_replace_per_object_failure_impact`** — Per-object detail and caveats remain on **`failure_impact_v1`** / related APIs; the summary is a **roll-up index**, not a substitute for drilling into one object.

---

## Classification vs adjacent contracts

| Contract | Role |
| --- | --- |
| **`topology-related-policies-contract.md`** | Defines **membership** in **`related_policies(o)`**; summary **consumes** those sets. |
| **`degraded-policy-v1-contract.md`** | Defines **per-policy** postures; summary **counts** them **within** each related set. |
| **`failure-impact-contract.md`** | Per-object **FailureImpactViewResponse**; same evidence plane—summary **ranks** many objects, failure-impact **explains** one. |
| **`policy-evidence-timeline-contract.md`** | Per-policy chronology; orthogonal to cross-object ranking. |

---

## Gap audit: present vs future implementation

### Already present (evidence for a bounded v1)

| Area | What exists | Relevance |
| --- | --- | --- |
| Topology + related policies | `GET /api/v1/topology`, related-policies family | Enumerate objects and **related sets**. |
| Policy inventory | `GET /api/v1/policies` with **`degraded_policy_v1`** | Count **`D`, `U`, `K`** per related id. |
| Failure impact | `GET /api/v1/topology/objects/{object_id}/failure-impact` | Conceptual parity for **per-object** rollups; summary may **batch** the same logic server-side later. |

### Follow-on (optional)

- **WebUI** — optional attention-summary panel; **not** required for contract satisfaction.
- **Verifier** — optional **`verify-core-runtime.sh`** structural checks — **not** shell duplication of ranking rules.

---

## Safeguards (non-regression)

- Does **not** weaken week **27–28** contracts: related-policies, degraded-policy v1, failure-impact, or path-analysis remain authoritative for their domains.
- Does **not** add write workflows, dry-run execution, or validation engines.
- Does **not** let Grafana own ranking semantics; **app-api** and product copy **own** this contract.

---

## Related documents

- [`topology-related-policies-contract.md`](./topology-related-policies-contract.md)
- [`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md)
- [`failure-impact-contract.md`](./failure-impact-contract.md)
- [`topology-truth-depth-review.md`](./topology-truth-depth-review.md)
- [`agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md)
