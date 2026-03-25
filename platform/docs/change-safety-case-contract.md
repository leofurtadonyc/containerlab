# Change Safety Case v1 contract (Phase 2, read-only)

## Purpose

This document is the **product-owned bounded contract** for **Change Safety Case v1**: a **read-only composed interpretation** that helps operators answer—**before** planning or executing a change—using **only** Phase **2** evidence already defined elsewhere:

- **How well is this subject currently represented** in normalized inventory, topology, policy posture, and related read assemblies?
- **Where is evidence strong, weak, missing, stale, or partial**—so the operator does **not** overread sparse or degraded signals as completeness?
- **What should be reviewed next** (re-fetch, deeper panel, different lens)—**without** claiming scheduling authority or validation outcomes?

Phase **2** cannot claim **dry-run**, **approval**, **simulation**, **safe-to-change** authority, or **rollback** planning. Change Safety Case v1 **indexes, merges caveats, and narrates posture** from existing contracts—**not** a new scoring engine, dependency prover, or change-management system.

Stable product vocabulary (for implementation and tests when the surface ships): **`change_safety_case_v1`**

**Implementation posture (v1):** May ship as a **WebUI workspace**, **client-side composition** of existing APIs, and/or a **future** dedicated read assembly under **`GET /api/v1/...`**—this file defines **semantics, honesty boundaries, and section order**, not a mandatory ship shape before implementation exists.

---

## Overlap review: why this is a new composed workspace

Change Safety Case v1 is **subject-centric pre-change reasoning support** (“how honest is our **read-side** picture **right now**?”). Closed surfaces answer **different primary questions**:

| Closed slice | Primary question | Why Change Safety Case is **not** a duplicate |
| --- | --- | --- |
| [**Maintenance Preview**](./maintenance-preview-contract.md) (`maintenance_preview_v1`) | What inventory and relationships **co-occur** with this **maintenance topology subject**? | **Maintenance-subject** scope and related-policy grouping; **not** a cross-lens “understanding posture” brief for arbitrary **`service_id`** / **`policy_id`**. |
| [**Impact Report**](./impact-report-contract.md) (`impact_report_v1`) | What evidence **package** supports **communication and handoff** (service / policy / maintenance context)? | **Outward narrative** for alignment; **not** framed as **pre-change evidence sufficiency** or **gap analysis** as the lead story. |
| [**Policy explainability**](./policy-explainability-workspace-contract.md) | What is the **path story**, candidates, and caveats for **one** **`policy_id`**? | **Policy-deep**; Change Safety Case **may pointer** to explainability but **composes** posture across **multiple** evidence families and **gaps**—not a second explainability engine. |
| [**Service Explorer**](./service-explorer-contract.md) (`service_explorer_v1`) | What **members** and inventory rows belong to **`service_id`**? | **Authoritative list/detail** for service grouping; Safety Case **interprets** sufficiency and **merged caveats** for **change-adjacent** reasoning—**not** replacing Explorer tables. |
| [**Investigation workspace**](./investigation-workspace-contract.md) | **Timeline- and sync-bounded** investigation assembly | **Temporal** drill-down and evidence replay context; Safety Case is **not** a duplicate timeline—**may** link with **`sync_runs_limit`** discipline **only** as a pivot. |
| **Situation room** ([**Evidence pack**](./evidence-pack-contract.md)) | **Broad bounded pack** across domains for **situation review** | **Pack-wide** assembly; Safety Case is **narrower**: **change-decision support** framing and **evidence-gap** prominence—not replacing **`situation_review_guidance`**. |
| [**Operator briefing**](./operator-briefing-workspace-contract.md) | **Briefing** composition and export bundle members | **Handoff narrative**; Safety Case focuses on **readiness of evidence** before change—not briefing slide structure. |
| [**Cross-domain delta digest**](./cross-domain-delta-digest-contract.md) | **What changed recently** across domains? | **Delta** and **recency**; Safety Case addresses **static sufficiency and honesty** of the **current** slice for a subject—**not** substituting digest math. |

---

## Supported change-safety subjects (Phase 2 v1)

Subjects **must** map to **stable Phase 2** identities already defined in existing contracts. The safety case **does not** invent new identifier forms.

| Subject | Anchor | Notes |
| --- | --- | --- |
| **Policy-centric** | **`policy_id`** | Same **404** / inventory semantics as [**Policies**](./policy-truth-depth-review.md) and [**policy dossier**](./policy-dossier-contract.md). |
| **Service-centric** | **`service_id`** | Same forms as [**Service Explorer**](./service-explorer-contract.md) (`policy:`, `color:`, `headend:`, `endpoint:`, …). |
| **Topology-centric (maintenance-adjacent)** | **`object_kind`** (`node` \| `link`) + **`object_id`** | Same identity and snapshot rules as [**Maintenance Preview**](./maintenance-preview-contract.md) / [**failure impact**](./failure-impact-contract.md). |

**Out of scope for v1:** abstract tickets, regions, or accounts **without** a stable Phase **2** anchor above; **multi-subject** bundles unless a future revision explicitly defines them.

---

## Bounded evidence sources and reuse rules

The safety case **MUST**:

1. **Assemble only** from Phase **2** contracts and routes already shipped (see table below).
2. **Not** invent **risk scores**, **blast radius**, **severity beyond source contracts**, or **safe-to-change** labels.
3. **Propagate** **`degraded_policy_v1`**, **topology partiality**, **stale row**, **persisted_fallback**, and **serving mode** cues from sources—**merged** when they conflict, preferring the **stricter** caveat.
4. **Label** truncation, caps, and empty sections **visibly**—never imply “no risk” from emptiness.
5. **Remain read-only**—no **dry-run**, **workflow**, **validation verdict**, or **write** simulation.

| Source family | Typical contract / API | Role in Change Safety Case |
| --- | --- | --- |
| **Policy inventory & posture** | `GET /api/v1/policies`, **`degraded_policy_v1`** | Member **honesty** for policy subject; **stale** / **candidate** hints. |
| **Policy deep panels** | Policy dossier, path analysis, explainability, timeline, delta (as defined in respective contracts) | **Pointers or short excerpts**—authoritative depth remains on those routes. |
| **Service grouping** | `GET /api/v1/services/{service_id}` — [**Service Explorer**](./service-explorer-contract.md) | **Member list**, **`degraded_service`**, **topology linkage**—same non-claims as Explorer. |
| **Service dossier** (if present) | `GET /api/v1/services/{service_id}/dossier` — [**Service dossier**](./service-dossier-contract.md) | **Optional** composed roll-up; **not** mandatory if not implemented in deployment. |
| **Topology & failure relationships** | Topology snapshot, [**related policies**](./topology-related-policies-contract.md), [**failure impact**](./failure-impact-contract.md) | **Partiality** and **relationship** honesty for topology subject. |
| **Maintenance Preview** | [**Maintenance Preview**](./maintenance-preview-contract.md) | For **topology subject**—co-occurrence framing; **not** duplicated as sole content for service/policy subjects. |
| **Change intelligence / delta digest** | [**Change intelligence**](./change-intelligence-contract.md), [**delta digest**](./cross-domain-delta-digest-contract.md) | **Optional** “recent churn” context—**not** a substitute for static sufficiency analysis. |
| **Investigation / situation room** | [**Investigation**](./investigation-workspace-contract.md), [**Evidence pack**](./evidence-pack-contract.md) | **Optional pivots** only—same **`sync_runs_limit`** and non-authority rules. |
| **Impact Report** | [**Impact Report**](./impact-report-contract.md) | **Optional pointer** to a **communication package**—**not** interchangeable JSON; Safety Case leads with **gap and caveat** narrative. |

**Disallowed as primary safety-case evidence:** Prometheus/Grafana as **business truth**, synthetic **risk** heatmaps, OpenDaylight as **path omniscience**, or **workflow** history as **approval** of change safety.

---

## Normative section order (v1)

Sections **may** use product titles; semantics **must** align with these **types** in **this order** unless a subject type makes a section inapplicable (then **omit** with explicit “not applicable” or **empty** honesty—not silent skip).

| Order | Section type | Meaning |
| --- | --- | --- |
| 1 | **Safety case identity** | **`contract_id`** **`change_safety_case_v1`**, **subject** (policy \| service \| topology object), **anchor ids**, **`assembled_at`** (UTC), **`source_contract_ids`** or equivalent manifest of **which** APIs/assemblies contributed. |
| 2 | **Freshness and serving posture** | Echo **stale**, **persisted_fallback**, **collection_posture**, **topology partiality** axes—**same honesty** as nested sources. |
| 3 | **Understanding posture summary (bounded language)** | Narrative synthesis using **only** allowed vocabulary: e.g. evidence **strong** / **weak** / **degraded** / **sparse** / **partial** / **unknown**—mapped to **cited** fields, **not** invented scores. **Forbidden:** “approved,” “safe,” “validated,” “clear to change.” |
| 4 | **Evidence inventory (what was considered)** | Explicit list of **source families** consulted (even if empty)—**transparency** for operators. |
| 5 | **Signals and caveats (merged)** | **Degraded** roll-ups, **topology** gaps, **inventory** staleness, **missing** nested bodies—**merged caveat block** with **no** hidden contradictions. |
| 6 | **Evidence gaps and unknowns** | **Required** section: what **cannot** be concluded from read-side data; **unknown** is a **first-class** outcome. |
| 7 | **Next-review guidance** | **Interpretation-only** suggestions: e.g. “re-fetch when topology snapshot ages,” “open explainability if path story missing,” “narrow **`sync_runs_limit`** for investigation”—see [Next-review guidance semantics](#next-review-guidance-semantics). |
| 8 | **Recommended pivots** | **Navigation hints** to [**Maintenance Preview**](./maintenance-preview-contract.md), [**Impact Report**](./impact-report-contract.md), [**Service Explorer**](./service-explorer-contract.md), [**Policy explainability**](./policy-explainability-workspace-contract.md), investigation, situation room—**not** workflow execution. |
| 9 | **Explicit non-claims** | Visible block repeating or linking to [Explicit non-claims](#explicit-non-claims). |

Adding sections that imply **sign-off**, **validation pass**, or **guaranteed completeness** requires a **new contract revision** and a later phase.

---

## Evidence-gap and caveat handling

| Rule | Requirement |
| --- | --- |
| **Gaps first-class** | Empty related sets, **404** on optional nested fetches, or **sparse_dossier**-style flags **must** appear in **Evidence gaps**—not only in footnotes. |
| **No gap silence** | If a **critical** source family is **not** implemented or **not** fetched, state **missing assembly** explicitly. |
| **Contradiction** | If two sources disagree on freshness, **surface both** or **merge** to the stricter caveat—**not** pick the optimistic one. |
| **Truncation** | Capped lists **must** show **truncation** or **top-N** honesty—aligned with [**evidence export**](./evidence-export-contract.md) provenance spirit. |

---

## Next-review guidance semantics

**Next-review guidance** is **operator interpretation support** only:

- **May** suggest **re-checking** live APIs, **widening** investigation window (**`sync_runs_limit`**), or **opening** a deeper panel when **gaps** or **stale** cues appear.
- **Must not** imply **mandatory** operational schedule, **SLA**, **approval cadence**, or **compliance** timing.
- **Must not** be stored as **authorization** or **workflow** state in Phase **2**.

If implementation uses structured fields (e.g. **`suggested_followups`**), each item **must** cite **why** from **observed** evidence posture—not generic boilerplate.

---

## Export and report relationship

| Mechanism | Role relative to Change Safety Case v1 |
| --- | --- |
| [**Evidence export v1**](./evidence-export-contract.md) | **Deterministic** **`export_kind`** snapshots (dossiers, situation room, investigation, …). **`change_safety_case_v1`** is **not** an **`export_kind`** until **evidence-export-contract.md** and **`GET /api/v1/exports/...`** explicitly extend—same posture as Impact Report until then. |
| [**Impact Report v1**](./impact-report-contract.md) | **Communication** package; may **share** nested payloads. Safety Case **leads** with **understanding sufficiency and gaps**; Impact Report **leads** with **handoff narrative**—operators may use **both**, **neither** replaces the other. |
| **JSON (if shipped)** | SHOULD include **`contract_id`** **`change_safety_case_v1`**, **`subject`**, **`assembled_at`**, **`source_contract_ids`**, **`merged_caveats`**, **`evidence_gaps`**, **`next_review_guidance`**, and nested **pointers** or **embedded** faithful copies per product choice. |
| **Markdown / PDF (optional)** | **Companion** formats only—**verbatim** non-claims; **no** implied scoring. |

**Evidence replay** (**`evidence_export_v1`**) **must** reject root **`change_safety_case_v1`** JSON unless/until replay contract explicitly supports it—parallel rule to Impact Report in [**evidence-replay-viewer-contract.md**](./evidence-replay-viewer-contract.md). **app-web** implements this rejection in **`parseEvidenceExportJson`** with error code **`change_safety_case_not_evidence_export`**.

**WebUI download:** Operators may download the same JSON/Markdown as **`GET /api/v1/reports/change-safety-case/...`** from the **Change safety case** view—this is **report-route** retrieval (like Impact Report), **not** **`GET /api/v1/exports/...`** and **not** **`evidence_export_v1`**.

**Repository regression:** **`app-web`** **`vitest`** — **`evidence-replay-parse.test.ts`** (reject root **`change_safety_case_v1`** for policy/service/topology contexts; parallel checks for **`impact_report_v1`**), **`replay-report-export-route-honesty.test.ts`** ( **`buildChangeSafetyCaseRequestPath`** / **`buildImpactReportRequestPath`** never use **`/api/v1/exports/`**; **`buildEvidenceExportRequestPath`** never uses **`/api/v1/reports/`**).

---

## Partial / empty behavior

| Condition | Required behavior |
| --- | --- |
| **Unknown or unsupported anchor** | **404** or **empty shell** with explicit inability to assemble—**same identity rules** as underlying APIs. |
| **Zero optional nested bodies** | **Evidence gaps** section **must** state what was **not** available—not “clean bill of health.” |
| **Sparse topology** | **Prominent** partiality—**not** “isolated” or “simple” without evidence. |

---

## Explicit non-claims

Change Safety Case v1 is:

- **not** **dry-run** output or **simulation** of changes
- **not** **validation** authority or **test** sign-off
- **not** **approval** or **authorization** for change
- **not** **safe-to-change** truth or **go/no-go**
- **not** **rollback** planning or **execution** planning
- **not** **guaranteed complete** inventory of dependencies or underlay—relationships remain per [**topology-related-policies**](./topology-related-policies-contract.md) and related contracts
- **not** **tamper-evident** or **immutable** legal evidence unless a **future** phase adds such storage

The phrase **“safety case”** here means **bounded read-side evidence sufficiency and honesty** for **operator judgment**—not workplace safety law, regulatory case files, or certified risk analysis unless explicitly re-scoped in a later phase.

---

## Adjacent contracts

| Contract | Relationship |
| --- | --- |
| [**Service dossier**](./service-dossier-contract.md) | Optional **nested** composed view for **`service_id`**; Safety Case may **reference** or **embed** excerpts under reuse rules. |
| [**Policy dossier**](./policy-dossier-contract.md) | Policy subject **depth**; Safety Case **summarizes** posture and **gaps**, not full **`policy_dossier_v1`** by default. |
| [**NOC cockpit**](./noc-cockpit-contract.md) | **Optional** entry pivot—**not** cockpit layout duplication. |
| [**Operator search**](./operator-search-contract.md) | **Optional** deeplink subject—**not** new ranking. |

---

## Shipped API (Phase 2)

**app-api** exposes **`change_safety_case_v1`** as JSON (canonical) or optional Markdown companion (`format=markdown`), composed **only** from existing read assemblies—**no** new scoring or validation.

| Route | Anchor | Nested composition (reuse) |
| --- | --- | --- |
| **`GET /api/v1/reports/change-safety-case/policy?policy_id=`** | **`policy_id`** | **`policy_dossier_v1`** + optional **`policy_explainability_workspace_v1`** |
| **`GET /api/v1/reports/change-safety-case/service?service_id=`** | **`service_id`** | **`service_dossier_v1`** (Service Explorer + optional explainability + optional maintenance preview) |
| **`GET /api/v1/reports/change-safety-case/maintenance?…`** | Topology **`node`** \| **`link`** (same selectors as maintenance-preview / impact-report maintenance) | **`maintenance_preview_v1`** |

**404** follows the same identity rules as the underlying dossiers (unknown **`policy_id`**, unsupported **`service_id`**, unknown topology **`object_id`**). **`422`** when maintenance selectors are missing or **`object_kind`** does not match snapshot identity.

**Relationship to Impact Report:** parallel **`GET /api/v1/reports/*-impact`** routes package **communication**; these routes package **pre-change evidence posture and gaps**—nested bodies may overlap but **primary narrative** differs.

**WebUI (app-web):** Shell **`view=change-safety-case`** with **`change_safety_context`** (**`policy_change_safety`** \| **`service_change_safety`** \| **`topology_change_safety`**) and anchors **`csc_policy_id`**, **`csc_service_id`**, or the same **maintenance** query parameters as Maintenance Preview—consumes the JSON routes above via **`ChangeSafetyCaseView`** / **`ChangeSafetyCaseProduct`**; navigation pivots from Service Explorer, Policy explainability, and Maintenance Preview.

---

## Document history

- **Week 32 Wednesday task 01:** Product contract authored—**documentation only**; no API/WebUI implementation required by that task.
- **Week 32 Wednesday task 02:** **`GET /api/v1/reports/change-safety-case/{policy,service,maintenance}`** implemented in **app-api** with **`ChangeSafetyCaseResponse`** schema and **`pytest`** **`tests/test_change_safety_case.py`**.
