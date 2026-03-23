# Global operator search and pivot v1 contract (Phase 2, read-only)

## Purpose

This document is the **product-owned bounded contract** for a future **global operator search and pivot** slice: a **single entry point** to find **known inventory and product identities** already exposed by Phase **2** read APIs and shell navigation—so operators can jump to **Devices**, **Topology**, **Policies**, **Capabilities / Readiness**, **Investigation**, or **Situation room** without implying a search engine over logs, metrics, controllers, or unstructured text.

**Operator search pivot v1** is **navigation-first** and **modest**: it ranks and groups **string matches** (and **exact id** matches where applicable) over **bounded** object sets the product already holds in memory or can fetch from existing list/detail endpoints. It **does not** invent new indexer backends, cross-domain scoring graphs, or “best answer” semantics.

Stable **`contract_id`:** **`operator_search_pivot_v1`**

**Implementation posture (v1):** **`GET /api/v1/operator-search?q=...`** (**`OperatorSearchResponse`**, **`schemas/operator_search.py`**, **`services/operator_search.py`**, route on **`routers/operator_search.py`**) aggregates the same normalized list fields as **`GET /api/v1/devices`**, **`GET /api/v1/policies`**, **`GET /api/v1/topology`**, and **`GET /api/v1/capabilities`**—grouped, capped per family, with **`ranking_basis`**, **`match_reason`**, and recommended **`pivot`** targets. A **WebUI-side** client may still layer additional UX; this file remains the honesty contract for both paths.

---

## Searchable object families (Phase 2)

Only families that already have **stable identities** and **read-only** product surfaces are in scope for v1.

| Family | Identity / keys | Typical match fields | Honest limit |
| --- | --- | --- | --- |
| **Devices** | `device_id` (and inventory anchors used on Devices rows) | `device_id`, display names, management hints present on **`GET /api/v1/devices`** items | Inventory read-side bounds; list may be truncated by **`limit`**; not CMDB completeness ([`devices` domain in investigation](./investigation-workspace-contract.md)). |
| **Topology objects** | `node_id`, `link_id` with `topology_object_kind` | `node_id`, `display_name`, `device_id`, link endpoint ids on **`GET /api/v1/topology`** | Partial graphs; inference/pairing posture from topology contracts—not full graph truth. |
| **Policies** | `policy_id` | `policy_id`, `policy_name`, `headend`, `endpoint`, `source_target` on **`GET /api/v1/policies`** | Broader policy families off-lab may be unproven; empty/list truncation honesty preserved ([`policy-truth-depth-review.md`](./policy-truth-depth-review.md)). |
| **Readiness / capability features (optional)** | Capability **`feature`** keys / labels already exposed on **`GET /api/v1/capabilities`** | Stable **`CapabilityRecord.feature`** strings and human labels **only if** the product already materializes them for list/filter UX—**not** a new ontology | Interpretation-only; not workflow execution ([`readiness-capability-decision-support-contract.md`](./readiness-capability-decision-support-contract.md)). |
| **Investigation / situation-room launch targets** | Shell routes | **Not** full-text search over investigation content: v1 may surface **fixed** shortcuts (“Open investigation”, “Open situation room”) when query is empty or matches reserved **tokens**, or **suggested pivots** that map to existing URL builders—see **Pivot targets** | Client-only URL assembly; not operational routing authority ([`investigation-workspace-contract.md`](./investigation-workspace-contract.md), [`evidence-pack-contract.md`](./evidence-pack-contract.md)). |

**Out of scope for v1:** Grafana dashboards, Prometheus series, collector raw payloads, ODL config stores, workflow internals as searchable text, cross-tenant or cross-lab search, semantic/embedding search, regex over arbitrary history blobs.

---

## Supported query types (v1)

Queries are **operator-entered strings** (trimmed). Supported interpretations:

| Type | Description | Example |
| --- | --- | --- |
| **Free text token match** | Case-insensitive substring (or token-prefix) match across allowed string fields per family | `PE1`, `static`, `192.0.2` |
| **Exact id match (preferred rank)** | When the whole trimmed query equals a known `device_id`, `policy_id`, `node_id`, or `link_id`, rank that row **first** in its family section | `PE1:static_local:192.0.2.11:100` |
| **Multi-token modest AND** | Split on whitespace; all tokens must match somewhere in the same row’s searchable text (field boundaries per implementation)—**not** boolean query language | `PE1 static` |

**Disallowed as v1 primary semantics:** fuzzy phonetic matching, ML ranking, global PageRank-style importance, searching JSON blobs not already rendered as product fields.

---

## Ranking principles (modest and transparent)

1. **Exact id match** (when applicable) **outranks** partial substring matches within the same family.
2. **Family ordering** is **stable** and **documented** in the product (recommended default: **Policies → Topology → Devices → Capabilities**, or alphabetical by family name—pick one and keep it stable across releases until v2).
3. Within a family, tie-break in order: **shorter matched field**, then **lexicographic** `policy_id` / `node_id` / `device_id` for determinism.
4. **No synthetic “relevance score”** is required in v1; if a numeric score is shown, it must be labeled as **heuristic** or omitted.
5. **Recency** may **not** reorder inventory objects unless the field is already an honest timestamp on the row **and** the contract documents that exception (default: **do not** use recency for ranking in v1).

---

## Result sections (presentation contract)

A conforming UI **SHOULD** present results in **distinct sections** (or grouped headings), one per **family**, each with:

- **Section title** matching the family (e.g. **Policies**, **Topology nodes**, **Topology links**, **Devices**).
- **Cap per section** (configurable; default suggestion: **10–25** rows per family per query) with **“show more”** only if it triggers another **bounded** fetch or client-side expansion—honest about truncation.
- **Row content**: minimal **identity**, **one-line context** (already on list rows), and a **single primary pivot** action.
- **Cross-links**: optional secondary pivots (e.g. policy → topology impact) **only** via existing navigation helpers—not new parameters that imply new truth.

---

## Pivot targets (read-only)

Pivots **must** use **existing** shell patterns already defined for Phase **2**:

| Target | Mechanism (illustrative) |
| --- | --- |
| **Devices** | `view=devices` + optional `device_id` selection semantics already used by the Devices page |
| **Topology** | `view=topology`, `topology_object`, `topology_object_kind` |
| **Policies** | `view=policies`, `policy_id`; optional `policy_workspace`, `policy_evidence_timeline_focus`, `policy_evidence_delta_focus` per existing week **27–29** helpers |
| **Capabilities / Readiness** | `view=capabilities` / `view=readiness` with existing bounded query params ([decision-support contract](./readiness-capability-decision-support-contract.md)) |
| **Investigation** | `view=investigation`, `sync_runs_limit`, optional `inv_from`, `policy_id`, `topology_object` / `topology_object_kind` per [`investigation-workspace-contract.md`](./investigation-workspace-contract.md) |
| **Situation room** | `view=situation-room` (and existing bounded params for evidence pack assembly) |

**Non-substitution:** Search **suggests** pivots; each destination page remains **authoritative** for its contract.

---

## Explicit non-claims

Operator search pivot v1 is:

- **not** log search, trace search, or metrics search
- **not** Grafana or Prometheus as searchable corpora
- **not** ODL / controller full configuration search
- **not** validation, risk scoring, or “root cause” authority
- **not** guaranteed completeness when lists are truncated, filtered, or collector-degraded
- **not** a replacement for per-page tables, filters, or dossier workspaces

The word **“global”** means **cross-surface navigation convenience** in the **current product shell**, not “every byte in the platform.”

---

## Empty, sparse, and ambiguous results

| Condition | Required behavior |
| --- | --- |
| **No matches** | Clear **empty state** copy: “No matches in bounded Phase 2 inventory fields for this query.” Offer **honest** guidance (widen query, open a specific view)—not fabricated suggestions. |
| **Query too short / ambiguous** | If minimum length is enforced (e.g. fewer than **2** characters), show **validation** message—do not return unbounded matches. |
| **Truncated inventory** | If the app knows the list response was **capped** (`items_returned` vs `items_total`), show a **truncation caveat** when search runs client-side only on the visible page. |
| **Stale / persisted fallback** | Do **not** claim freshness; optional one-line echo of **serving mode** or **evidence_confidence** if already on the underlying list response. |
| **Reserved tokens** | If implementing shortcuts (e.g. `inv:` / `situation:`), document them as **explicit**—otherwise treat as normal text. |

---

## Relationship to other documents

| Topic | Document |
| --- | --- |
| Investigation assembly | [`investigation-workspace-contract.md`](./investigation-workspace-contract.md) |
| Evidence / situation room | [`evidence-pack-contract.md`](./evidence-pack-contract.md) |
| Policy truth | [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) |
| Topology↔policy pivots | [`topology-related-policies-contract.md`](./topology-related-policies-contract.md) |
| Readiness / capabilities navigation | [`readiness-capability-decision-support-contract.md`](./readiness-capability-decision-support-contract.md) |
| Dossier briefings | [`policy-dossier-contract.md`](./policy-dossier-contract.md), [`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md) |

---

## Revision policy

Introducing **new** searchable corpora (logs, metrics text, workflow bodies) or **authoritative** relevance scoring requires a **new** contract revision (`operator_search_pivot_v2` or explicit minor version) and updated non-claims.
