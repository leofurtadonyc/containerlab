# Evidence export v1 contract (Phase 2, read-only)

## Purpose

This document is the **product-owned bounded contract** for **evidence export v1**: a **deterministic, operator-useful snapshot** of **existing** Phase **2** read-only assemblies—so operators can **attach**, **archive**, or **share** bounded context **without** claiming tamper evidence, compliance packs, full backups, or operational authorization.

**Evidence export v1** is **serialization of already-exposed contracts**—not a new indexer, not a new truth domain, and **not** a substitute for Grafana, Postgres, or collector stores.

Stable **`contract_id`:** **`evidence_export_v1`**

**Implementation posture (v1):** Shipped as **read-only** backend exports under **`GET /api/v1/exports/...`** (see below). **JSON** is canonical (`format=json`, default); **Markdown** is a human-readable companion (`format=markdown`). Client-side download from responses already held in the WebUI (JSON stringify / Markdown render) remains optional. This file defines **what may be exported**, **how it must be framed**, and **honesty limits**.

| Route | `export_kind` | Notes |
| --- | --- | --- |
| **`GET /api/v1/exports/policies/{policy_id}/dossier`** | `policy_dossier` | **404** when the underlying policy dossier would be absent (same as `GET /api/v1/policies/{policy_id}/dossier`). |
| **`GET /api/v1/exports/topology-objects/{object_id}/dossier`** | `topology_object_dossier` | **404** when the underlying topology object dossier would be absent (same as `GET /api/v1/topology/objects/{object_id}/dossier`). |
| **`GET /api/v1/exports/situation-room/summary`** | `situation_room` | Same bounded assembly as **`GET /api/v1/evidence-pack/situation`**; optional **`sync_runs_limit`** (same bounds as that route). |
| **`GET /api/v1/exports/investigation-workspace/summary`** | `investigation_workspace` | Same bounded assembly as **`GET /api/v1/investigation-workspace/context`**; optional **`sync_runs_limit`**. |

**Multi-member briefing archive (different envelope):** **`GET /api/v1/exports/operator-briefing`** returns **`briefing_export_bundle_v1`** — **not** **`evidence_export_v1`** at the root. It wraps **zero or more** embedded **`evidence_export_v1`** members plus bundle metadata; query alignment matches **`GET /api/v1/operator-briefing`**. See [`briefing-export-bundle-contract.md`](./briefing-export-bundle-contract.md).

**Related reporting (not `evidence_export_v1`):** **`GET /api/v1/reports/...`** serves **[`impact_report_v1`](./impact-report-contract.md)**—a distinct envelope and route from **`GET /api/v1/exports/...`**; **`impact_report_v1`** is **not** an **`export_kind`** here.

Shared query parameter: **`format`** — `json` (default) or `markdown` (applies to **`evidence_export_v1`** routes and the briefing bundle route).

---

## Supported export subjects (Phase 2)

Only subjects that already have **stable composed read APIs** and **explicit non-claims** are in scope for v1.

| Subject | Identity | Typical export payload | Honest limit |
| --- | --- | --- | --- |
| **Topology object dossier** | `object_id` (node or link) + `topology_object_kind` | Bounded sections from **`topology_object_dossier_v1`** (identity, posture summary, failure-impact excerpt, risk attention, related policies preview, degraded-policy preview, navigation hints, merged caveats/freshness) | Reuse-only; not blast-radius or dependency truth ([`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md)). |
| **Policy dossier** | `policy_id` | Bounded sections from **`policy_dossier_v1`** (inventory/degraded summary, path-analysis, topology-impact, evidence timeline, evidence delta, navigation hints, merged caveats/freshness) | Not dataplane proof or validation ([`policy-dossier-contract.md`](./policy-dossier-contract.md)). |
| **Situation room summary** | Evidence-pack **situation** assembly (`sync_runs_limit` window) | High-level **situation pack** framing: nested device/topology/policy/capability **summaries**, **`situation_review_guidance`**, **`investigation_context`** pointers—**not** re-scraping Grafana or raw logs ([`evidence-pack-contract.md`](./evidence-pack-contract.md)). |
| **Investigation workspace summary** | Investigation assembly (`sync_runs_limit` window) | **`InvestigationContextAssemblyResponse`**-shaped summary: recent change, platform status, capabilities matrix excerpt, **next-inspection** hints—interpretation only ([`investigation-workspace-contract.md`](./investigation-workspace-contract.md)). |

**Out of scope for v1:** ad-hoc “export everything,” workflow execution payloads, dry-run outputs, ODL config dumps, Prometheus/Grafana artifact bundles, credentials, secrets, or cross-tenant bundles.

---

## Export formats (v1)

| Format | Role | Requirements |
| --- | --- | --- |
| **JSON** | **Canonical** interchange; lossless for allowed fields | Must include **`contract_id`**, **`evidence_export_v1`**, **`export_subject`**, **`subject_ref`**, **`generated_at`**, **`source_contract_ids`**, and the **nested payload** as returned by the read API (or a **documented subset** if the exporter trims redundant blobs). UTF-8, stable key ordering **not** required. |
| **Markdown** | **Human-readable** companion for the same bounded content | Must preserve **section headings** aligned with dossier/pack contracts, **verbatim** caveat lines where present, and a **header block** with export metadata (subject, ids, generation time). **No** implied scoring or severity styling beyond what source copy already uses. |

**Disallowed as v1 primary formats:** PDF as authoritative truth, binary-only exports without JSON source of record, encrypted exports that imply **non-repudiation**.

---

## Included sections (minimum expectations)

Every conforming export **SHOULD** include:

1. **Export envelope** — `contract_id` **`evidence_export_v1`**, **`export_kind`** (`topology_object_dossier` \| `policy_dossier` \| `situation_room` \| `investigation_workspace`), **`subject_ref`** (ids + query window params as applicable), **`generated_at`** (export generation time, UTC).
2. **Source contract echo** — `source_contract_ids` listing nested **`contract_id`** values present in the payload (e.g. `policy_dossier_v1`, `topology_object_dossier_v1`, `investigation_workspace_phase2_v1`, evidence-pack ids).
3. **Bounded body** — the **same** semantic sections the operator sees in-product for that subject (summaries, nested objects allowed by the subject contract).
4. **Freshness / caveat block** — merged or per-nested **caveats**, **serving_mode** / **evidence_confidence** echoes **when** already on the source responses.

---

## Omitted sections (must not appear as “hidden truth”)

Exports **MUST NOT** embed or imply:

- raw vendor CLI / gNMI payloads not already in API-visible fields
- authentication tokens, cookies, or connection strings
- full Prometheus series, Grafana dashboard JSON, or alert rule bodies as “evidence”
- workflow **execution** or **dry-run** outputs not already in a Phase **2** read contract
- synthetic cross-domain **scores**, **SLA** verdicts, or **approval** language not present in source APIs

---

## Explicit non-claims

Evidence export v1:

- is **not** a **compliance** or **legal hold** artifact
- is **not** **tamper-evident**, **signed**, or **immutable** by default
- is **not** a **backup** of Postgres, Prometheus, or collector state
- is **not** a **substitute** for opening live product surfaces or reading authoritative per-domain APIs
- is **not** **complete** across all time ranges, tables, or targets unless each nested contract already states completeness
- is **not** **safe-to-change**, **validation**, or **incident command** authority

The word **“export”** means **bounded snapshot for operator communication and record-keeping** in the current Phase **2** read-only posture.

---

## Provenance and freshness requirements

| Requirement | Description |
| --- | --- |
| **Source fidelity** | Exported JSON **SHOULD** copy nested API objects **without** rewriting numeric fields or inventing timestamps. |
| **Dual timestamps** | Distinguish **`generated_at`** (export time) from **`source_observed_at`** / nested **`generated_at`** / **`dossier_assembled_at`** fields when present—do not collapse into one “last updated” without labeling. |
| **Stale honesty** | If any nested block is **stale** or **persisted_fallback**, that posture **MUST** appear in the export body or caveat block, not only in the live UI. |
| **Truncation** | If list responses were **capped** (`read_side_query`, per-family caps), the export **SHOULD** echo **items_total** vs **items_returned** or an explicit **truncation note**. |

---

## Safe export framing (operator copy)

Conforming exporters **SHOULD** prepend or append a short **framing** paragraph in Markdown (and a **`export_framing`** string or **`explicit_non_claims`** list in JSON), including:

- Phase **2** read-only, interpretation-support posture
- pointer to nested **`contract_id`** values for authoritative semantics
- statement that the file is **not** operational authorization

**Non-substitution:** Export **does not** replace **Policies**, **Topology**, **Situation room**, or **Investigation** live views; it **documents** what the platform already exposed at export time.

---

## Relationship to other documents

| Topic | Document |
| --- | --- |
| Briefing export bundle (multi-member archive) | [`briefing-export-bundle-contract.md`](./briefing-export-bundle-contract.md) |
| Policy dossier | [`policy-dossier-contract.md`](./policy-dossier-contract.md) |
| Topology object dossier | [`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md) |
| Situation / evidence pack | [`evidence-pack-contract.md`](./evidence-pack-contract.md) |
| Investigation workspace | [`investigation-workspace-contract.md`](./investigation-workspace-contract.md) |
| Operator search (navigation context) | [`operator-search-contract.md`](./operator-search-contract.md) |

---

## Revision policy

Adding **new** export subjects (logs, metrics corpora, workflow internals) or **signed** exports requires **`evidence_export_v2`** (or explicit minor version) and updated non-claims.
