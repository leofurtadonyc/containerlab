# Impact Report v1 contract (Phase 2, read-only)

## Purpose

This document is the **product-owned bounded contract** for **Impact Report v1**: a **read-only, operator-communication-oriented assembly** that **packages** the most useful **existing** Phase **2** evidence—so teams can **review**, **align**, and **hand off context** without treating the report as authority over inventory, validation, or maintenance approval.

An impact report is **not** a new truth domain. It **indexes and narrates** the same underlying contracts as [**Service Explorer**](./service-explorer-contract.md), [**Policy explainability**](./policy-explainability-workspace-contract.md), [**Maintenance Preview**](./maintenance-preview-contract.md), dossiers, failure-impact, and related read surfaces—**reordered and summarized** for **human communication**, not for scoring or proof.

Stable product vocabulary (for implementation and tests when the surface ships): **`impact_report_v1`**

**Implementation posture (v1):** May ship as a **WebUI “report” view**, **client-side composition** of existing APIs, **Markdown/HTML render**, and/or a **future** dedicated read assembly under **`GET /api/v1/...`**—this file defines **semantics, section honesty, and non-claims**, not a mandatory ship shape before implementation exists.

---

## Supported report contexts (v1)

Report contexts are **operator framing cues** for **which anchor** drives section order and default pivots. They **do not** change underlying API math, authorization, or scheduling.

| Context | Anchor | Primary mental model |
| --- | --- | --- |
| **Service-centric impact report** | **`service_id`** (see [**Service Explorer**](./service-explorer-contract.md) forms: `color:`, `headend:`, `endpoint:`, `policy:`, …) | “What policies and topology touchpoints are **grouped** under this service lens?” |
| **Policy-centric impact report** | **`policy_id`** | “What path story, topology naming alignment, and related objects does this **one policy** intersect in the current slice?” |
| **Maintenance-preview impact report** | Same subjects as [**Maintenance Preview**](./maintenance-preview-contract.md) (`node` \| `link` via stable ids) | “What bounded read-side relationships and degraded signals **co-occur** with this maintenance subject?” |

Contexts **may** affect **default section order**, **caveat prominence**, and **deep-link labels** only.

**Out of scope for v1:** reports anchored only on abstract tickets, regions, or vendor accounts **without** a stable Phase **2** **`service_id`**, **`policy_id`**, or maintenance subject already defined in the contracts above.

---

## Included sections (normative expectations)

Sections **may** use product titles; semantics **must** align with these **types**. Not every section appears in every context; **empty** behavior is defined in [Partial / empty behavior](#partial--empty-behavior).

| Section type | Meaning |
| --- | --- |
| **Report identity** | **`contract_id`** echo **`impact_report_v1`**, **context** (service \| policy \| maintenance-preview), **anchor ids**, **generated_at** / **assembled_at** (UTC), link to **source contracts** used. |
| **Freshness and evidence posture** | Echo **serving mode**, **stale** / **persisted_fallback**, **topology partiality**, and **merged caveats** from nested assemblies—**same honesty** as source contracts. |
| **Scope summary (bounded)** | Short narrative: what is **in scope** for this report; **explicit** list of **excluded** concerns (no blast radius, no SLA, no approval). |
| **Service grouping (when applicable)** | **Service Explorer**-aligned **`service_id`** and member policy rows—**derived** groupings, not a new catalog. |
| **Policy inventory / path story (when applicable)** | Pointers or excerpts from **policy dossier** / **explainability** / **path analysis**—**interpretation support**, not dataplane proof. |
| **Topology and failure relationship (when applicable)** | **Related policies**, **failure impact**, **topology impact** rows—**reuse** [**topology-related-policies**](./topology-related-policies-contract.md) and [**failure impact**](./failure-impact-contract.md) non-claims. |
| **Maintenance-oriented assembly (maintenance-preview context)** | Reuse [**Maintenance Preview**](./maintenance-preview-contract.md) section types where applicable—**not** duplicated as a second maintenance brain. |
| **Recommended pivots** | **Navigation hints** only (WebUI routes, documented query params)—**not** workflow execution. |
| **Explicit non-claims block** | Repeat or reference the [Explicit non-claims](#explicit-non-claims) list—must remain **visible** in exportable forms. |

Adding sections that imply **compliance sign-off**, **validation verdict**, **incident command**, or **guaranteed dependency completeness** requires a **new contract revision**.

---

## Relationship to evidence export and evidence replay

| Mechanism | Role relative to Impact Report v1 |
| --- | --- |
| [**Evidence export v1**](./evidence-export-contract.md) | **Deterministic snapshot** of **already-defined** export kinds (`policy_dossier`, `topology_object_dossier`, `situation_room`, `investigation_workspace`, briefing bundle members). **Serialization** with envelope **`evidence_export_v1`**. |
| **Impact Report v1** | **Composed narrative package** for communication; **may embed or reference** the **same nested contract bodies** as exports, but is **not** required to be **bit-for-bit** identical to a single **`export_kind`**—it **aggregates across** service/policy/maintenance lenses when the product chooses. |
| [**Evidence replay**](./evidence-replay-viewer-contract.md) | **Client-side** interpretation of **imported** **`evidence_export_v1`** JSON—**frozen** file vs **live** APIs. |

**Rules:**

1. **Impact Report v1** is **not** a substitute for opening **live** product views or calling **authoritative** read APIs when freshness matters.
2. If implementation offers **download**, **JSON** SHOULD remain **inspectable** and **nested-contract-faithful** where it embeds dossiers or maintenance preview payloads; **Markdown** MAY be a **companion** for email/wiki—same pattern as evidence export.
3. **`impact_report_v1`** is **not** an **`export_kind`** in [**evidence-export-contract.md**](./evidence-export-contract.md) until that document and **`GET /api/v1/exports/...`** are explicitly extended—future work.

---

## Output format expectations (v1)

| Format | Role | Requirements |
| --- | --- | --- |
| **In-product view** | Primary operator experience | Sections follow this contract; **caveats** and **empty** states **visible**; no **severity styling** beyond source contracts. |
| **JSON (if shipped)** | Canonical interchange | Include **`contract_id`** **`impact_report_v1`**, **`report_context`**, **`anchor`**, **`generated_at`**, **`source_contract_ids`**, nested payloads **or** stable pointers to API routes; UTF-8. |
| **Markdown (optional)** | Email/wiki companion | **Headings** align with section types; **verbatim** caveat lines; **header block** with ids and time—**no** implied scoring. |

**Disallowed as v1 authoritative formats:** PDF-only truth without JSON source, **signed** or **immutable** claims not covered by Phase **2** storage.

---

## Partial / empty behavior

| Condition | Required behavior |
| --- | --- |
| **Unknown anchor** | **404** or **empty report shell** with explicit “cannot assemble”—same identity rules as underlying APIs (**policy**, **topology object**, **`service_id`**). |
| **Sparse related policies / services** | **Explicit** empty tables or callouts—**not** “no impact.” |
| **Stale or partial topology** | **Prominent** partiality / stale cues—**not** footnote-only. |
| **Maintenance subject missing from snapshot** | Align with [**Maintenance Preview**](./maintenance-preview-contract.md) and failure-impact **404** / empty semantics. |
| **Truncation** | If lists are **capped**, show **items_returned** vs **total** or a **truncation note**—same honesty as [**evidence export**](./evidence-export-contract.md) provenance rules. |

---

## Explicit non-claims

Impact Report v1:

- is **not** a **compliance** or **legal** artifact
- is **not** a **validation record** or **test sign-off**
- is **not** **incident command** authority or **operational authorization**
- is **not** **safe-to-change** approval or **maintenance approval**
- is **not** **guaranteed complete** dependency or underlay proof—relationships are **string- and inventory-aligned** per existing contracts, not exhaustive graph discovery
- is **not** **tamper-evident**, **immutable**, or **non-repudiation** evidence unless a **future** phase explicitly adds such storage (out of scope for Phase **2**)

The word **“impact”** here means **bounded, read-side co-visibility of normalized relationships and posture signals** for **operator communication**—not blast-radius truth, traffic simulation, or SLA guarantees.

---

## Adjacent contracts

| Contract | Relationship |
| --- | --- |
| [**Maintenance Preview**](./maintenance-preview-contract.md) | Maintenance-preview **context** aligns with maintenance subject assembly; impact report **packages** for communication. |
| [**Service Explorer**](./service-explorer-contract.md) | Service-centric **context** uses **`service_id`** semantics. |
| [**Policy dossier**](./policy-dossier-contract.md) / [**Policy explainability**](./policy-explainability-workspace-contract.md) | Policy-centric **context** uses policy narrative and pointers. |
| [**Evidence export**](./evidence-export-contract.md) / [**Evidence replay**](./evidence-replay-viewer-contract.md) | Export/replay **relationship**—see [Relationship to evidence export and evidence replay](#relationship-to-evidence-export-and-evidence-replay). |
| [**Failure impact**](./failure-impact-contract.md) | Relationship rollups **reuse** failure-impact non-claims. |

---

## Shipped API (Phase 2)

Bounded read-only **`GET`** endpoints assemble **existing** contracts only; optional **`format=json`** (default) or **`format=markdown`** (human-readable companion with embedded JSON body).

| Route | Anchor | Nested body |
| --- | --- | --- |
| **`GET /api/v1/reports/service-impact?service_id=…`** | Service Explorer **`service_id`** | **`service_explorer_v1`** detail |
| **`GET /api/v1/reports/policy-impact?policy_id=…`** | Inventory **`policy_id`** | **`policy_dossier_v1`** |
| **`GET /api/v1/reports/maintenance-impact`** | Same query params as **`GET /api/v1/maintenance-preview`** | **`maintenance_preview_v1`** |

**404** / **422** follow the same identity rules as the underlying Service Explorer, policy dossier, and maintenance-preview routes.

### WebUI (Phase 2)

- Shell view **`view=impact-report`** with **`impact_report_context`** = **`service_impact`** \| **`policy_impact`** \| **`maintenance_impact`**, plus anchors **`impact_service_id`**, **`impact_policy_id`**, or the same **`maintenance_*`** query parameters as Maintenance Preview for **`maintenance_impact`**.
- **`ImpactReportActions`** on the report page: browser download of JSON/Markdown from the routes above—**not** **`evidence_export_v1`**, **not** briefing bundle, **not** Evidence replay.
- Pivots: **Service Explorer** (detail), **Policy explainability** (header), **Maintenance Preview** (hero)—each opens the Impact Report workspace with a matching anchor.

---

## Document history

- **v1:** Defines **Impact Report v1** semantics; **API** and **WebUI** ship as above (**`impact_report_v1`** envelope + nested contract bodies; dedicated view + download actions).
