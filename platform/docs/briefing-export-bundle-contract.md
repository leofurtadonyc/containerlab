# Briefing export bundle v1 contract (Phase 2, read-only)

## Purpose

This document is the **product-owned bounded contract** for a **briefing export bundle v1**: a **single, coherent downloadable artifact** that groups **multiple** Phase **2** read-only snapshots that already conform to [`evidence_export_v1`](./evidence-export-contract.md)—so operators can **attach**, **archive**, or **share** a **briefing-aligned** set of exports **without** stitching separate downloads manually and **without** treating the bundle as a new truth domain, compliance pack, or operational authorization.

**Briefing export bundle v1** is a **container and ordering contract** over **existing** export envelopes—**not** a replacement for [`operator_briefing_workspace_v1`](./operator-briefing-workspace-contract.md) live composition, **not** a second indexer, and **not** a substitute for **Grafana**, **Postgres**, or **authoritative** per-route `GET` responses.

Stable product vocabulary (for implementation and tests when the bundle ships): **`briefing_export_bundle_v1`**

**Shipped read API (Phase 2):** **`GET /api/v1/exports/operator-briefing`** — JSON (default) or Markdown (`format=markdown`); query parameters align with **`GET /api/v1/operator-briefing`** (`sync_runs_limit`, optional `policy_id`, optional `topology_object` + `topology_object_kind`, optional `inv_from`, `global_search_q`). Members are assembled with the same builders as standalone **`GET /api/v1/exports/...`** routes; optional dossier slots may be **`null`** with **`omission_reason`** when the subject is absent.

**Relationship to adjacent contracts:**

| Contract | Role |
| --- | --- |
| [`evidence-export-contract.md`](./evidence-export-contract.md) (`evidence_export_v1`) | Each **member** snapshot inside a bundle **must** remain a conforming **`evidence_export_v1`** JSON body (or a **documented omission** with honest partiality). The bundle **does not** relax export non-claims. |
| [`operator-briefing-workspace-contract.md`](./operator-briefing-workspace-contract.md) (`operator_briefing_workspace_v1`) | **Input alignment**: bundle generation **binds** to the **same** bounded context dimensions the briefing uses (`sync_runs_limit`, optional `policy_id`, optional topology object, optional client echoes). **Implementation** may be **`GET /api/v1/operator-briefing`-guided** or **product-defined** assembly from the same parameters. |
| [`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md) (`evidence_replay_viewer_v1`) | **Replay** of frozen exports: operators **replay individual** **`evidence_export_v1`** members with the current replay viewer. **Whole-bundle replay** as one interactive surface is **out of scope** for **`evidence_replay_viewer_v1`** unless a **future** replay contract explicitly adds bundle parsing—see [Live vs replay](#live-vs-replay). |

---

## Supported bundle inputs (v1)

A conforming bundle exporter **derives** its **membership** from **zero or more** of the following **already-supported** inputs—**aligned** with the operator briefing workspace context table ([`operator-briefing-workspace-contract.md`](./operator-briefing-workspace-contract.md) §Subject and context sources):

| Input dimension | Required | Role |
| --- | --- | --- |
| **`sync_runs_limit`** | **Yes** (1–100) | **Single** window for **`situation_room`** and **`investigation_workspace`** exports included in the bundle, and for consistency with briefing/delta digest discipline. |
| **`policy_id`** | No | When set, a **`policy_dossier`** **`evidence_export_v1`** member **may** be included (same **`GET /api/v1/exports/policies/{policy_id}/dossier`** semantics as standalone export). |
| **`topology_object`** + **`topology_object_kind`** | No | When both set, a **`topology_object_dossier`** member **may** be included (same **`GET /api/v1/exports/topology-objects/{object_id}/dossier`** semantics). |
| **`inv_from`**, **`global_search_q`** | No | **Echo only** on the bundle envelope for handoff context—**not** authority for app-api; same honesty rules as briefing. |

**Out of scope for v1 bundle:** new export subjects not in [`evidence-export-contract.md`](./evidence-export-contract.md), multi-tenant bundles, encrypted or signed bundles that imply **non-repudiation**, workflow/dry-run bodies, raw Prometheus/Grafana corpora, credentials, or ad-hoc file types without **`evidence_export_v1`** members.

---

## Included sections (normative bundle layout)

The bundle **must** be **structured** so an operator can see **what** was captured **in order**. v1 defines a **logical** layout; serialization details belong to the implementation.

1. **Bundle envelope** — See [Bundle envelope (required fields)](#bundle-envelope-required-fields).
2. **Briefing context echo** — Short restatement of **`sync_runs_limit`**, optional **`policy_id`**, optional topology object, optional **`inv_from`** / search echo—**same intent** as briefing header context (not a management approval line).
3. **Ordered members** — **One entry per** included **`export_kind`** allowed by [`evidence-export-contract.md`](./evidence-export-contract.md). **Order** is implementation-defined but **must** be **documented** (recommended: dossier members first when present, then situation room, then investigation workspace—aligned with common briefing sequencing). **Note:** **`cross_domain_delta_digest_v1`** is **not** a standalone **`evidence_export_v1`** **`export_kind`**; cross-domain digest context in a briefing appears **inside** composed assemblies (e.g. situation/investigation excerpts), **not** as a separate bundle member **unless** a future export kind is added under a new contract version.
4. **Per-member payloads** — Each member is either:
   - **Full** nested **`evidence_export_v1`** object (including its **`contract_id`**, **`export_kind`**, **`subject_ref`**, **`generated_at`**, **`source_contract_ids`**, **`explicit_non_claims`**, **`export_framing`**, **`nested`**), or
   - **Honest omission** — see [Partial, empty, and omitted members](#partial-empty-and-omitted-members).
5. **Merged caveat / provenance strip** — Union of **non-claims** and **freshness** cues **without** dilution; bundle-level **`explicit_non_claims`** **must** include bundle-specific lines (see [Explicit non-claims](#explicit-non-claims)).

---

## Bundle envelope (required fields)

| Field | Type | Description |
| --- | --- | --- |
| **`contract_id`** | string | **`briefing_export_bundle_v1`** |
| **`generated_at`** | string (UTC) | **Bundle assembly** time—distinct from each member’s **`generated_at`**. |
| **`briefing_subject`** | object | Echo of **`sync_runs_limit`**, optional **`policy_id`**, optional **`topology_object`** / **`topology_object_kind`**, optional client echoes. |
| **`bundle_members`** | array | Ordered list of **member descriptors** (see below). |
| **`source_contract_ids`** | string[] | **Union** of all nested **`contract_id`** values present **plus** **`briefing_export_bundle_v1`** and any **`operator_briefing_workspace_v1`** references when a briefing response was used as the assembly source. |
| **`explicit_non_claims`** | string[] | **Must** include bundle-level non-claims and **should** propagate or summarize member non-claims **without** dropping honesty. |
| **`export_framing`** | string | Short operator-facing framing for the **whole** file (Phase 2 read-only, not authorization). |

Each **element** of **`bundle_members`** **should** include:

| Field | Description |
| --- | --- |
| **`export_kind`** | One of **`policy_dossier`** \| **`topology_object_dossier`** \| **`situation_room`** \| **`investigation_workspace`**. |
| **`subject_ref`** | Echo consistent with that **`export_kind`** (same semantics as [`evidence-export-contract.md`](./evidence-export-contract.md)). |
| **`member_generated_at`** | The **`generated_at`** of the **`evidence_export_v1`** member **or** `null` if omitted honestly. |
| **`payload`** | **Embedded** full **`evidence_export_v1`** JSON object **or** **`null`** with **`omission_reason`**. |

Implementations **may** add **`member_index`**, **`export_route_echo`**, or **`assembly_notes`** for supportability—**must not** use extra fields to imply authority.

---

## Export formats (v1)

| Format | Status | Requirements |
| --- | --- | --- |
| **JSON** | **Required** for canonical interchange | **UTF-8** bundle document as above. Members **must** remain parseable **`evidence_export_v1`** when **`payload`** is non-null. |
| **Markdown** | **Optional** companion | Human-readable **table of contents**, per-member headings, and **verbatim** caveat lines **where** present; **must** state that **JSON** is the **lossless** interchange for members. **Must not** imply scoring or severity beyond source copy. |

**Disallowed as v1 authoritative bundle sources:** PDF-only bundles without JSON, opaque binaries without a JSON sidecar listing **`evidence_export_v1`** members.

---

## Relationship to evidence export v1

1. **No relaxation** — A bundle **does not** change **`evidence_export_v1`** semantics. Each non-null **`payload`** **must** validate as **`evidence_export_v1`** (same envelope fields as [`evidence-export-contract.md`](./evidence-export-contract.md)).
2. **Same routes** — Producers **should** obtain member payloads from the **same** **`GET /api/v1/exports/...`** families used for standalone downloads, **unless** the implementation assembles from cached briefing composition—then **nested JSON** **must** still match **`evidence_export_v1`** shape.
3. **Provenance** — **`source_contract_ids`** at bundle level **aggregates** nested ids; **do not** invent contract ids not present in members.
4. **Distinction from standalone export** — Standalone download is **one** `evidence_export_v1` file. Bundle is **one** file with **`contract_id`:** **`briefing_export_bundle_v1`** wrapping **multiple** exports—operators **must** be able to tell which case they hold (envelope root **`contract_id`**).

---

## Provenance and non-claim propagation

| Requirement | Description |
| --- | --- |
| **Dual timestamps** | Distinguish **`generated_at`** (bundle) from each member’s **`generated_at`** and from nested **`dossier_assembled_at`** / **`metadata.generated_at`** when present—**do not** collapse into one “last updated” without labeling. |
| **Member fidelity** | **Do not** rewrite numeric fields or invent timestamps inside **`evidence_export_v1`** payloads. |
| **Merged caveats** | Bundle-level **`explicit_non_claims`** **must** include lines that state: (a) bundle is **not** tamper-proof / compliance / legal hold; (b) members are **point-in-time**; (c) **live** product may differ. **Should** surface **stale** / **persisted_fallback** posture if **any** member carried it. |
| **Truncation** | If a member was capped or partial upstream, that honesty **must** appear in the member payload **or** in **`omission_reason`**. |

---

## Partial, empty, and omitted members

| Situation | Required behavior |
| --- | --- |
| **Upstream 404 / absent subject** | **Omit** member **or** include **`payload`:** **`null`** with **`omission_reason`** (e.g. `policy_dossier_unavailable`). **Must not** fabricate nested bodies. |
| **Partial assembly** | **Honest** partial: include available **`evidence_export_v1`** with **`partial`** semantics per member contract; bundle **`export_framing`** **should** mention **partial bundle**. |
| **Empty context** | If **no** **`policy_id`** was selected, **do not** emit a **`policy_dossier`** member **unless** the product explicitly documents a **contradiction** (default: **omit**). Same for topology. |
| **Digest / briefing composition gaps** | If briefing assembly failed for a section, the bundle **must not** pretend full membership—**omit** or **partial** with explicit notes. |

---

## Live vs replay

| Mode | Meaning | Operator obligation |
| --- | --- | --- |
| **Live briefing / live exports** | **`GET`** responses at **current** time | Subject to staleness and read-path semantics of each **source** route. |
| **Bundled file** | **Assembly** at **`generated_at`** with **embedded** or **omitted** members | **Point-in-time**; **not** a live feed. |
| **Replay** | **`evidence_replay_viewer_v1`** replays **individual** **`evidence_export_v1`** artifacts | Extract member **`payload`** files or open each standalone export; **whole-bundle** interactive replay is **not** required of **`evidence_replay_viewer_v1`** (see [`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md) §Out of scope). |

Implementations **must not** label the bundle as **“Live”** or **“Current”** without a **separate** control that navigates to **live** routes.

---

## Explicit non-claims

Briefing export bundle v1:

- is **not** **live** platform truth as a single merged feed
- is **not** **tamper detection**, **integrity verification**, or **signature validation** of the bundle or its members
- is **not** **compliance**, **legal hold**, or **audit signing**
- is **not** a **backup** of databases, metrics stores, or collectors
- is **not** **validation**, **drift verdict**, **safe-to-change**, or **incident command**
- is **not** **complete** if any member was omitted, capped, or **bounded_partial** upstream
- is **not** a **substitute** for opening **live** **Policies**, **Topology**, **Situation room**, **Investigation**, or **Delta digest** when current read-side truth is required

---

## Relationship to other documents

| Topic | Document |
| --- | --- |
| Per-subject exports | [`evidence-export-contract.md`](./evidence-export-contract.md) |
| Briefing workspace composition | [`operator-briefing-workspace-contract.md`](./operator-briefing-workspace-contract.md) |
| Replay of exported evidence | [`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md) |
| Cross-domain delta digest | [`cross-domain-delta-digest-contract.md`](./cross-domain-delta-digest-contract.md) |

---

## Revision policy

Adding **new** member kinds, **trusted/signed** bundles, or **server-stored** bundle sessions requires **`briefing_export_bundle_v2`** (or explicit minor version) and updated non-claims.
