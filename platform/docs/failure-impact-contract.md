# Failure impact v1 contract (Phase 2, read-only)

## Purpose

This document is the **backend-owned bounded contract** for a future **read-only “failure impact” interpretation surface** scoped to **topology nodes and links**. It helps operators **see what policy and posture evidence already relates** to a chosen object through **the same string-equality and inventory rules** shipped in week **27**—without simulating failures, blast radius, dependencies, dataplane behavior, or change authority.

**Failure impact v1** is **evidence-derived** and **relationship-based**: it **assembles and classifies** pointers to **existing** normalized policy rows and their **`degraded_policy_v1`** slices (and optionally **navigation** to path-analysis or other read-only surfaces). It is **not** a new truth domain and **not** a graph walk or TE computation.

Implementation references (when a route exists):

- Planned stable **`contract_id`:** **`failure_impact_v1`**
- Bounded inputs: **`GET /api/v1/topology`**, **`GET /api/v1/policies`**, **`GET /api/v1/topology/objects/{object_id}/related-policies`**, **`GET /api/v1/policies/{policy_id}/topology-impact`**, **`GET /api/v1/policies/{policy_id}/path-analysis`** — each keeps **its own** contract and non-claims; failure impact v1 **does not replace** them.

---

## Supported subject types

| Subject | Identity | Notes |
| --- | --- | --- |
| **Topology node** | `node_id` on the current normalized topology snapshot | Same object identity rules as **`topology-related-policies-contract.md`** (**404** if unknown). |
| **Topology link** | `link_id` on the current normalized topology snapshot | Related policies are the **union** of matches against **both** endpoint nodes; co-presence on a link does **not** imply the policy uses that link in a dataplane sense (see topology-related-policies contract). |

Other subject kinds (device-only, policy-first “impact,” region, etc.) are **out of scope for v1** unless a follow-on explicitly extends this document.

---

## Bounded evidence sources (reuse only)

Failure impact v1 may **only** draw on evidence the platform already exposes read-only:

| Source | Role in failure impact v1 | Honest limit |
| --- | --- | --- |
| **Topology snapshot** | Resolve `object_id` → node or link; cite partiality axes from `GET /api/v1/topology` | Inference-bounded; not full underlay or IGP truth ([`topology-truth-depth-review.md`](./topology-truth-depth-review.md)). |
| **Policy inventory** | Rows reachable via **string equality** pivots ([`topology-related-policies-contract.md`](./topology-related-policies-contract.md)) | Same match fields (`headend`, `endpoint`, `source_target` vs `node_id`, `display_name`, `device_id`); **not** completeness outside the inventory slice. |
| **`degraded_policy_v1` on each policy** | Roll up posture **within the related-policy set only** ([`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md)) | Classification from normalized fields + stale signal; **not** SLA, availability guarantee, or validation verdict. |
| **Path analysis (optional pointer)** | Per related **`policy_id`**, link to or embed **`path_analysis_phase2_v1`** summary as **optional** context ([`path-analysis-contract.md`](./path-analysis-contract.md)) | **Not** dataplane/TE/controller path authority. |
| **Platform status / freshness** | Echo collector vs persisted serving mode when relevant to **caveats** | Not a substitute for full live read paths ([`path-analysis-contract.md`](./path-analysis-contract.md) freshness patterns). |

**Disallowed as primary evidence for v1:** Grafana dashboards, Prometheus scrape math, synthetic “impact scores,” workflow history as causality, or any write-side or simulated execution.

---

## Response shape (conceptual)

When implemented, responses should expose a small, stable envelope (names illustrative until schemas exist):

- **`metadata`**: standard `ApiResponseMetadata` (Phase 2).
- **`contract_id`**: **`failure_impact_v1`**.
- **`safety_framing`**: authority posture, phase, **summary disclaimer**, and **explicit non-claims** list (see below).
- **`subject`**: `{ kind: topology_node \| topology_link, object_id }` plus optional display hints from topology.
- **`relationship_evidence`**: the **related policies** set (policy ids and minimal row anchors) with **relationship_kind** consistent with **`topology-related-policies-contract.md`** (`policy_field_matches_node_identifier` / `policy_field_matches_link_endpoint_identifier` / matched field metadata as already defined there).
- **`impact_buckets`** (interpretation only — see next section): structured **rolls-ups** derived from the related set, not a global health score.
- **`degraded_policy_rollup`**: counts and optional breakdown **restricted to policies in `relationship_evidence`** (see semantics below).
- **`optional_pointers`**: optional **read-only** navigation targets (e.g. path-analysis URL template per policy, investigation `inv_from` patterns) — **suggestions**, not execution.
- **`freshness`**: assembly time and optional snapshot timestamps consistent with nested contracts.
- **`caveats`**: topology partiality, policy stale rows, empty/partial policy inventory, path-analysis unsupported — aligned with existing caveat vocabulary where possible.

---

## Impact buckets (v1 semantics)

The word **“impact”** in the product name is **short-hand for relationship and posture visibility**. v1 **buckets** are **not** severity, blast radius, or user traffic impact.

| Bucket | Meaning |
| --- | --- |
| **`related_policies`** | Policies that **string-match** the subject per **`topology-related-policies-contract.md`**. |
| **`degraded_policy_signals`** | Summary of **`degraded_policy_v1`** **within** that related set only (`policy_field_matches_*` universe). |
| **`interpretation_support`** | Optional pointers to **path-analysis**, **topology-impact inverse**, **investigation** — **navigation**, not scoring. |

Adding new buckets that imply simulation, dependency graphs, or TE resolution requires a **new contract revision** and explicit non-claims.

---

## Degraded policy count semantics

Rollups **must** follow these rules so week **27** semantics stay intact:

1. **Scope:** Counts include **only** policies present in **`relationship_evidence`** for this subject (the same set as related-policies for that `object_id`).
2. **Postures:** Use **`degraded_policy_v1.posture`** values **`ok`**, **`degraded`**, **`unknown`** as defined in [`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md) — no new posture names in v1 without a contract bump.
3. **Not global:** These counts **differ** from **Overview / Platform Health** “all policies” degraded summaries, which aggregate the **full** policy list. UI copy must **not** imply the node-level rollup equals global inventory health.
4. **Not a verdict:** A **zero** degraded count in the related set does **not** mean the node is “safe” or failure-free; it only means **no degraded v1 reasons** on **matching** policy rows.
5. **Stale rows:** If a policy row is served from persisted fallback (`stale` / `persisted_row_stale` path), degraded semantics **remain** per `degraded_policy_v1`; caveats must surface **inventory freshness** honestly.

---

## Freshness and caveat semantics

- **Topology:** Reuse the same **partiality** and **inference** honesty as topology APIs; failure impact v1 does **not** improve topology completeness.
- **Policy inventory:** Same **empty / partial / unsupported** caveats as related-policies and policies list contracts.
- **Path analysis:** If embedded or linked, **inherit** `PathAnalysisViewResponse` caveats and **non-claims**; do not collapse them into a single “impact” score.
- **Assembly time:** Operators should see **when** the rollup was built and **which** snapshots served inputs.

---

## Explicit non-claims

Stable keys (illustrative; align with schema literals when added):

- **`not_blast_radius_or_dependency_truth`** — Relationship matches are **string equality**, not graph dependency or failure propagation.
- **`not_dataplane_or_te_impact_truth`** — No claim about forwarding, tunnels, or traffic engineering outcome.
- **`not_graph_simulation`** — No shortest-path, walk, or reachability simulation beyond documented pivots.
- **`not_validation_or_safe_change_authority`** — No approval, drift verdict, or safe-to-change recommendation.
- **`not_sla_or_availability_guarantee`** — Degraded rollups are **not** SLAs (consistent with `degraded_policy_v1`).
- **`not_replace_controller_computed_truth`** — Does not supersede controller or device truth.
- **`not_global_policy_health_proxy`** — Subject-level degraded counts are **subset-scoped**; not equivalent to global policy posture.

---

## Operator-safe copy expectations

- Prefer **“related policy evidence”** and **“degraded signals on matching policies”** over **“impact analysis”** or **“failure impact”** unless paired with a **visible** disclaimer that meaning is **relationship-based**, not predictive.
- **Never** imply that a link or node “failure” **propagates** along matched policies.
- **Grafana** must **not** own failure-impact semantics; **app-api** and product copy **own** the contract.
- Do **not** relabel **`topology-related-policies`** pivots as **blast-radius** or **dependency** in UI strings.

---

## Classification vs adjacent contracts

| Contract | Role |
| --- | --- |
| **`topology-related-policies-contract.md`** | Defines **how** policies relate to a node/link via string equality; failure impact v1 **consumes** that relationship set. |
| **`degraded-policy-v1-contract.md`** | Defines **per-policy** classification; failure impact v1 **aggregates** it **within** the related set. |
| **`path-analysis-contract.md`** | Policy-anchored path interpretation; failure impact may **point** to it, not duplicate path math. |
| **`investigation-workspace-contract.md`** | Broader assembly; failure impact is **narrower** (topology object subject, policy relationship + degraded rollup). |

---

## Gap audit: what exists vs what is missing

### Already present (evidence for a bounded v1)

| Area | What exists | Relevance to failure impact v1 |
| --- | --- | --- |
| **Topology ↔ policy pivots** | `GET /api/v1/topology/objects/{object_id}/related-policies`, `GET /api/v1/policies/{policy_id}/topology-impact` | Core **relationship_evidence** for nodes and links. |
| **Degraded classification** | `degraded_policy_v1` on each `PolicyRecord` | **degraded_policy_rollup** over the related subset. |
| **Path interpretation** | `GET /api/v1/policies/{policy_id}/path-analysis` | Optional **interpretation_support** pointer. |
| **Topology / policy honesty** | Partiality axes, stale/persisted fallbacks | **caveats** and **freshness** fields. |

### Missing for a dedicated failure-impact **implementation** (follow-on work)

| Gap | Notes |
| --- | --- |
| **Unified API route** | No single **`GET .../failure-impact`** yet; v1 can be implemented as a **composed** service or thin wrapper over existing endpoints—**read-only**, same non-claims. |
| **Schema literals** | `failure_impact_v1` response schema and **`pytest`** locks when implemented. |
| **WebUI** | Optional surface (e.g. Topology/Devices detail) must reuse **explicit** copy patterns above. |
| **Verifier** | Structural checks when a route ships—**not** shell duplication of assembly rules. |

---

## Safeguards (non-regression)

- **Does not** weaken week **27** contracts: related-policies, topology-impact, degraded-policy v1, path-analysis, or investigation rules remain authoritative.
- **Does not** add write workflows, dry-run execution, or validation engines.
- **Does not** let Grafana own this feature’s semantics.
- **Does not** introduce graph simulation, blast-radius truth, dependency truth, TE/dataplane impact truth, or safe-change authority.

---

## Related documents

- [`topology-related-policies-contract.md`](./topology-related-policies-contract.md)
- [`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md)
- [`path-analysis-contract.md`](./path-analysis-contract.md)
- [`investigation-workspace-contract.md`](./investigation-workspace-contract.md)
- [`post-week-27-bounded-phase2-recommendation.md`](./post-week-27-bounded-phase2-recommendation.md)
- [`agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md)
