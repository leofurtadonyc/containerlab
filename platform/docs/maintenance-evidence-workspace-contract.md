# Maintenance evidence workspace v1 contract (Phase 2, read-only)

## Purpose

This document is the **backend-owned bounded contract** for a future **maintenance evidence workspace** product slice: a **single composed operator-facing workspace** that helps answer—using **only** existing Phase **2** read assemblies—

- **“For this maintenance-oriented topology subject, what does the platform already expose in one place—preview touch-set, object dossier context, chronology and comparison-style hints where available, and honest gaps—without claiming approval, simulation, outage truth, or safe-to-change authority?”**

**Maintenance evidence workspace v1** is **evidence-derived** and **composition-only**: it **aggregates pointers, nested bodies, and merged caveats** from contracts already shipped. It **does not** introduce new collector semantics, new ranking engines, or maintenance-ticket systems.

Stable product vocabulary (for implementation and tests when the surface ships): **`contract_id`:** **`maintenance_evidence_workspace_v1`**

**HTTP / WebUI (illustrative until routed):** a read assembly such as **`GET /api/v1/maintenance-evidence-workspace`** with query anchors aligned to [**Maintenance Preview**](./maintenance-preview-contract.md) (**`object_kind`**, **`object_id`**, **`preview_context`**) and/or a dedicated shell such as **`view=maintenance-evidence-workspace`**. Until implemented, this file is the **authoritative vocabulary** for workspace layout, pivot discipline, and non-claims.

---

## Overlap review: why this is distinct, not duplicate work

| Closed / adjacent slice | Canonical role | **Maintenance evidence workspace** is **not** a duplicate because |
| --- | --- | --- |
| [**Maintenance Preview**](./maintenance-preview-contract.md) (`maintenance_preview_v1`) | **What** inventory and relationships **co-occur** with this topology maintenance subject (“likely touch” framing) | Workspace is a **larger composed destination**: preview is **one** primary input (or embedded summary), **plus** dossier context, **topology object** timeline/delta **when implemented**, pivots to change-safety and service-impact storylines—**not** a rename of **`maintenance_preview_v1`**. |
| [**Change Safety Case**](./change-safety-case-contract.md) (`change_safety_case_v1`) | **Pre-change sufficiency / evidence gaps** for policy, service, or topology anchors (**separate** report `GET`s) | Safety case leads with **gap and “understanding posture”** narrative for **change** reasoning; maintenance workspace is **maintenance-primary** orientation—timeline/delta/dossier/preview **composition**—**orthogonal** lead story (same anchors may **link**, not merge JSON). |
| [**Topology object dossier**](./topology-object-dossier-contract.md) (`topology_object_dossier_v1`) | **Static composed briefing** for one node/link (**section order** for object identity, failure-impact, risk row, related policies) | Dossier is **object briefing**; workspace **wraps** dossier-level evidence **with** maintenance preview, **explicit** maintenance framing, and **chronology/delta** slots—**not** replacing dossier **`GET`**. |
| [**Service Impact Workspace**](./service-impact-workspace-contract.md) (`service_impact_workspace_v1`) | **Service_id–anchored** impact-oriented composition (Explorer + optional failure-impact) | **Different primary anchor** (**service_id** vs **maintenance topology subject**); workspace may **pointer** to service groupings that intersect related policies—**not** the same workspace JSON. |
| [**Impact Report**](./impact-report-contract.md) (`impact_report_v1`) | **Downloadable report** package for communication/handoff | Reports are **outward narrative** artifacts; workspace is **live read-side** composition—**not** substituting report bodies. |
| [**Operator Briefing**](./operator-briefing-workspace-contract.md) / [**Evidence export**](./evidence-export-contract.md) | Briefing composition and **`evidence_export_v1`** envelopes | Workspace is **not** an export root; see [Export, report, and replay boundaries](#export-report-and-replay-boundaries). |

---

## Primary question (normative)

The workspace **must** frame operator copy around **maintenance-centered evidence review**: orienting on **touch-set** (preview), **object context** (dossier), **time and comparison hints** (topology object evidence timeline / delta when present), and **honest absence**—**not** “will this maintenance succeed,” “is this safe to execute,” or “what is the blast radius.”

---

## Supported subjects and anchors (v1)

Subjects **must** map to Phase **2** identities already used by [**Maintenance Preview**](./maintenance-preview-contract.md):

| Subject | Anchor | Notes |
| --- | --- | --- |
| **Topology node** | `node_id` on the current normalized topology snapshot | Same **404** / identity rules as related-policies / failure-impact / dossier. |
| **Topology link** | `link_id` on the current normalized topology snapshot | Union-of-endpoint related-policy rules unchanged. |

**Preview context** (`preview_context`) is a **framing label** only—same vocabulary as maintenance preview (`planning_window`, `topology_drilldown`, `change_adjacent`, `explicit_subject`). It **does not** change underlying assembly math.

**Out of scope for v1:** abstract tickets, regions, or service-only anchors **without** a topology **node** or **link** row—unless a future revision extends this document.

---

## Composed sources (reuse only)

Implementations **may** assemble **only** from read contracts already defined in Phase **2**. Typical mapping:

| Role | Contract / API | Role in maintenance evidence workspace |
| --- | --- | --- |
| **Maintenance preview** | `GET /api/v1/maintenance-preview` — [`maintenance-preview-contract.md`](./maintenance-preview-contract.md) | **Authoritative** touch-set / related services / degraded related summary for the subject—**embed** or **pointer**; same non-claims as preview. |
| **Topology object dossier** | `GET /api/v1/topology/objects/{object_id}/dossier` — [`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md) | **Object** briefing complement—nested or summarized; **not** duplicated as ad-hoc JSON outside dossier semantics. |
| **Topology object evidence timeline** | `GET /api/v1/topology/objects/{object_id}/evidence-timeline` — [`topology-object-evidence-timeline-contract.md`](./topology-object-evidence-timeline-contract.md) | **Chronology** slot—**not** forensic log or pairing proof. |
| **Topology object evidence delta** | `GET /api/v1/topology/objects/{object_id}/evidence-delta` — [`topology-object-evidence-delta-contract.md`](./topology-object-evidence-delta-contract.md) | **Comparison-style** hints across anchors—**not** topology drift truth. |
| **Failure impact** | `GET /api/v1/topology/objects/{object_id}/failure-impact` — [`failure-impact-contract.md`](./failure-impact-contract.md) | **Already** embedded in dossier/preview families; may appear as **merged** or **pointer**—subset-scoped non-claims preserved. |
| **Change Safety Case (maintenance topology subject)** | `GET /api/v1/reports/change-safety-case/maintenance?...` — [`change-safety-case-contract.md`](./change-safety-case-contract.md) | **Optional** pivot or short excerpt—**not** merged as the workspace body. |
| **Service Explorer / Service Impact** | `GET /api/v1/services/...`, `GET /api/v1/service-impact-workspace?...` — [`service-explorer-contract.md`](./service-explorer-contract.md), [`service-impact-workspace-contract.md`](./service-impact-workspace-contract.md) | **Pointers** when **`service_id`** intersects preview-derived sets—**not** service-first re-derivation. |
| **Investigation / Operator briefing** | [`investigation-workspace-contract.md`](./investigation-workspace-contract.md), [`operator-briefing-workspace-contract.md`](./operator-briefing-workspace-contract.md) | **Shell pivots** with `sync_runs_limit` and bounded hints—**not** workflow scope. |

**Disallowed as primary workspace evidence:** Grafana/Prometheus as **business truth**, synthetic **maintenance risk** scores, workflow **approval** state, or **write-side** simulation.

---

## Normative section order (v1)

Sections **may** use product titles; semantics **must** align with these **types** in **this order** when applicable (omit with **explicit** “not available” / gap honesty—**not** silent skip):

1. **Workspace identity** — `contract_id` **`maintenance_evidence_workspace_v1`**, **`object_kind`**, **`object_id`**, `preview_context`, **`assembled_at`** (or equivalent), manifest of **which** nested **`contract_id`** values are included.
2. **Maintenance framing** — Short read-only copy: **maintenance-centered** purpose, **Phase 2** boundaries, **not** approval or simulation.
3. **Maintenance preview summary** — Nested **`maintenance_preview_v1`** body (preferred) or honest summary + pointer to **`GET /api/v1/maintenance-preview`**—**authoritative** for touch-set semantics.
4. **Topology object dossier context** — Nested **`topology_object_dossier_v1`** excerpt or pointer—**same** section honesty as dossier contract.
5. **Topology object evidence timeline (when available)** — Nested **`topology_object_evidence_timeline_v1`** or pointer—chronology **not** substitution for policy/service timelines.
6. **Topology object evidence delta (when available)** — Nested **`topology_object_evidence_delta_v1`** or pointer—comparison hints **not** drift truth.
7. **Cross-signal pivots** — Read-only links to **Change Safety Case** (maintenance route family), **Service Impact** / **Service Explorer** (when `service_id` known), **Impact Report** hub, **Policies**—**contract ids** echoed, **not** merged verdicts.
8. **Merged caveats and freshness** — Deduped **`caveats`** / **`missing_evidence_notes`** from nested sources; **stricter** caveat wins when conflicts arise.
9. **Evidence gaps** — **Required** when any nested assembly is partial, unavailable, or **404**-family for optional bodies.
10. **Explicit non-claims** — Visible block; see [Explicit non-claims](#explicit-non-claims).

---

## Merged caveat and freshness rules

1. **No silent upgrade:** If **any** nested source reports stale inventory, **persisted_fallback**, or **insufficient_evidence**, the workspace **must** surface that in the merged block.
2. **Stricter caveat wins:** When two nested payloads conflict on freshness posture for the same snapshot, prefer the **more conservative** operator wording.
3. **No unified freshness score** unless computed only from **existing** nested fields.

---

## Export, report, and replay boundaries

- **Live workspace `GET`:** Returns **`maintenance_evidence_workspace_v1`** — a **read-only composed** response, **not** an export envelope by default.
- **Not `evidence_export_v1`:** Frozen handoff uses **`GET /api/v1/exports/...`** per [`evidence-export-contract.md`](./evidence-export-contract.md) (dossier, briefing bundle, situation pack, investigation summary—**as defined there**). This workspace **does not** claim to be a root **`evidence_export_v1`** file.
- **Evidence replay:** The WebUI **rejects** root JSON with **`contract_id":"maintenance_evidence_workspace_v1`** as **Evidence replay** input (same **honesty class** as **`service_impact_workspace_v1`**, **`impact_report_v1`**, **`change_safety_case_v1`** per [`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md)) unless a future revision explicitly changes replay policy.
- **Impact Report / Change Safety Case:** Remain **separate** **`GET /api/v1/reports/...`** families; workspace **pivots** to them—**does not** embed report bodies as “impact proof.”

---

## Navigation expectations

- **Read-only:** Shell pivots use existing **`view=`** and bounded query parameters (**`policy_id`**, **`service_id`**, **`topology_object`**, **`topology_object_kind`**, **`sync_runs_limit`**, maintenance preview **`preview_context`**).
- **No new workflow verbs:** No approve, schedule, validate, or dry-run actions.
- **Honest labels:** Buttons match destination contracts (e.g. “Open maintenance preview” vs “Open change safety case”).

---

## Empty / sparse / partial behavior

| Condition | Required behavior |
| --- | --- |
| **Unknown `object_id`** | **404** (same as maintenance preview / dossier) or explicit empty workspace—**no** fabricated assembly. |
| **Maintenance preview unavailable** | **Gap** section; dossier/timeline/delta may still load if independent—**with caveat** that preview is missing. |
| **Timeline or delta not implemented in deployment** | **Omit** sections 5–6 or mark **unsupported**—**not** silent skip. |
| **Nested `insufficient_evidence`** on timeline/delta | Propagate **honest** comparison status from nested contracts—**no** fake “no changes.” |

---

## Explicit non-claims

Maintenance evidence workspace v1 **is**:

- **not** maintenance **approval**, **scheduling authority**, or **change validation**
- **not** **dry-run**, **simulation**, or **safe-to-change** verdict
- **not** **outage**, **SLA**, **traffic**, or **blast-radius** truth
- **not** **dataplane** or **pairing completeness** proof
- **not** a **substitute** for **Maintenance Preview**, **Topology object dossier**, **Change Safety Case**, **Impact Report**, or **per-policy** deep panels
- **not** **Grafana-owned** semantics ([`dashboards.md`](./dashboards.md))

---

## Gap audit (implementation follow-on)

| Area | Status (week 36 Wednesday tasks 01–02) |
| --- | --- |
| **Contract document** | **Delivered:** this file (`maintenance-evidence-workspace-contract.md`). |
| **Schema + route** | **Delivered:** **`GET /api/v1/maintenance-evidence-workspace`** — **`schemas/maintenance_evidence_workspace.py`**, **`services/maintenance_evidence_workspace.py`**, **`routers/maintenance_evidence_workspace.py`**. |
| **WebUI** | **Future** — week **36** Thursday task **01** per schedule. |
| **Tests / verifier** | **Delivered:** repository **`pytest`** **`test_maintenance_evidence_workspace.py`**; **`verify-core-runtime.sh`** optional follow-on when aligned with sampling. |

---

## Related documents

- [`maintenance-preview-contract.md`](./maintenance-preview-contract.md)
- [`change-safety-case-contract.md`](./change-safety-case-contract.md)
- [`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md)
- [`service-impact-workspace-contract.md`](./service-impact-workspace-contract.md)
- [`topology-object-evidence-timeline-contract.md`](./topology-object-evidence-timeline-contract.md)
- [`topology-object-evidence-delta-contract.md`](./topology-object-evidence-delta-contract.md)
- [`impact-report-contract.md`](./impact-report-contract.md)
- [`evidence-export-contract.md`](./evidence-export-contract.md)
- [`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md)
- [`data-flows.md`](./data-flows.md)
- [`agent/sdn/week-36-schedule-overview.md`](../../agent/sdn/week-36-schedule-overview.md)
