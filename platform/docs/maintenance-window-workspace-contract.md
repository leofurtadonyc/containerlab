# Maintenance Window Workspace v1 contract (Phase 2, read-only)

## Purpose

This document is the **backend-owned bounded contract** for **maintenance window workspace v1** (`maintenance_window_workspace_v1`): a **multi-subject maintenance-window planning workspace** that helps operators review—using **only** existing Phase **2** read assemblies—a **selected, bounded set** of topology **nodes and/or links** together, with **deduplicated rollups** across those subjects for affected services, related policies, evidence gaps, stability-oriented cues, and cross-domain tension cues.

It answers:

- **“For this planned maintenance window, what do we already know across these topology subjects in one place—without claiming approval, simulation, safe-to-change authority, or blast-radius truth?”**

Stable product vocabulary: **`contract_id`:** **`maintenance_window_workspace_v1`**

**HTTP (implemented in app-api):** **`GET /api/v1/maintenance-window-workspace`**

- **Subject selection:** repeated query parameter **`subject`**, each value **`node:{node_id}`** or **`link:{link_id}`** (lowercase kind prefix). Identical **`(object_kind, object_id)`** pairs are **deduped** before resolution. **Maximum distinct subjects** after dedupe: **`MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS` = 16** (schema constant in **`platform/app-api/src/app_api/schemas/maintenance_window_workspace.py`** — do not raise without an explicit contract revision).
- **Other query parameters:** **`preview_context`** (same vocabulary as [**Maintenance Preview**](./maintenance-preview-contract.md) — default **`planning_window`** on the route), **`sync_runs_limit`** (bounded; shared with embedded operational stability and evidence-consistency assemblies).
- **Responses:** **`422`** when no **`subject`** parameters are provided, when a token is malformed, when distinct subjects exceed the cap, or when **no** subject resolves to the current topology snapshot (partial failures are allowed: **200** with **`subject_resolution_failures`** when at least one subject resolves).
- **WebUI (Phase 2 shell):** **`view=maintenance-window-workspace`** with repeated **`mww_subject`** query tokens (same **`node:`** / **`link:`** encoding as the API **`subject`** parameter). The typed client maps **`mww_subject`** → API **`subject`** on **`GET /api/v1/maintenance-window-workspace`**. **`maintenance_preview_context`** and **`sync_runs_limit`** align with other maintenance-oriented views.

This file remains the **authoritative vocabulary** for rollup semantics, pivot discipline, and non-claims.

**Phase:** [`Phase 2 — read-only product foundation`](../../agent/sdn/01-CURRENT-PHASE.md).

---

## Task classification and overlap review (not duplicate work)

**Classification:** **new** bounded product surface. Completed artifacts that define **adjacent** lanes—cited here so reviewers see this is **extension**, not **reopen**:

| Completed artifact | Canonical role | **Maintenance window workspace v1** is **not** a duplicate because |
| --- | --- | --- |
| [`week-31-wednesday-task-01-maintenance-preview-contract.md`](../../agent/sdn-tasks/completed/week-31-wednesday-task-01-maintenance-preview-contract.md) → [`maintenance-preview-contract.md`](./maintenance-preview-contract.md) (`maintenance_preview_v1`) | **Single** topology subject: what likely **co-occurs** / touch-set for **one** node or link | Preview remains **authoritative** for per-subject **`GET`** semantics. This workspace **aggregates across many subjects** with **deduped rollups**—**not** a rename or replacement of **`maintenance_preview_v1`**. |
| [`week-32-wednesday-task-01-change-safety-case-contract.md`](../../agent/sdn-tasks/completed/week-32-wednesday-task-01-change-safety-case-contract.md) → [`change-safety-case-contract.md`](./change-safety-case-contract.md) (`change_safety_case_v1`) | **Pre-change sufficiency** and evidence-gap narrative for **one** anchored subject (policy / service / topology routes) | Safety case is **change-reasoning** report **`GET`**s; maintenance window workspace is **multi-subject window planning** composition—**orthogonal** lead story. Same anchors may **link** as pivots—**not** merged JSON. |
| [`week-34-wednesday-task-01-service-impact-workspace-v1-contract.md`](../../agent/sdn-tasks/completed/week-34-wednesday-task-01-service-impact-workspace-v1-contract.md) → [`service-impact-workspace-contract.md`](./service-impact-workspace-contract.md) (`service_impact_workspace_v1`) | **Service_id–anchored** impact-oriented composition | **Different primary anchor**: **multi topology subjects** vs **one service**. Window workspace may **list** services that appear in per-subject previews—**not** service-first re-derivation. |
| [`week-35-wednesday-task-01-cross-domain-evidence-consistency-summary-contract.md`](../../agent/sdn-tasks/completed/week-35-wednesday-task-01-cross-domain-evidence-consistency-summary-contract.md) → [`evidence-consistency-summary-contract.md`](./evidence-consistency-summary-contract.md) | **Cross-domain aligned / weak / tension** summary for a **scoped** read context | Consistency summary answers **agreement vs tension**; window workspace may **surface deduped tension hotspots** across **selected subjects** as **planning hints**—**not** a second copy of the full consistency taxonomy or **`GET`** substitution. |
| [`week-36-wednesday-task-01-maintenance-evidence-workspace-contract.md`](../../agent/sdn-tasks/completed/week-36-wednesday-task-01-maintenance-evidence-workspace-contract.md) → [`maintenance-evidence-workspace-contract.md`](./maintenance-evidence-workspace-contract.md) (`maintenance_evidence_workspace_v1`) | **Single** maintenance topology subject: composed preview + dossier + timeline/delta + pivots | **Single-subject** deep workspace. Maintenance window workspace is **multi-subject** with **union/dedup rollups**—operators still use **`maintenance_evidence_workspace_v1`** for **one** object drill-down; this slice does **not** redefine that contract. |
| [`week-37-monday-task-01-operational-stability-summary-contract.md`](../../agent/sdn-tasks/completed/week-37-monday-task-01-operational-stability-summary-contract.md) → [`operational-stability-summary-contract.md`](./operational-stability-summary-contract.md) (`operational_stability_summary_v1`) | **Steadiness / churn / recurrence / insufficient evidence** in bounded windows | Stability summary is **global or windowed posture**, not **multi-topology-subject selection**. Window workspace may **reference** stability surfaces as **cues**—**not** a new stability engine or duplicate **`operational_stability_summary_v1`**. |

**One-line distinction:** **Maintenance preview** = one subject’s touch picture; **maintenance evidence workspace** = one subject’s composed maintenance story; **maintenance window workspace** = **many** subjects’ **deduped planning rollups** in one bounded workspace.

---

## Primary question (normative)

The workspace **must** frame copy around **multi-subject maintenance-window planning**: **which topology subjects** are in scope, **what overlaps** (services, policies, gaps, stability hints, tension hints) when those subjects are considered **together**, and **honest limits**—**not** “approve this window,” “simulate impact,” or “this is the blast radius.”

---

## Supported subject selectors (v1)

Subjects **must** map to Phase **2** topology identities already used by [**Maintenance Preview**](./maintenance-preview-contract.md) and [**Maintenance Evidence Workspace**](./maintenance-evidence-workspace-contract.md):

| Subject type | Identity | Notes |
| --- | --- | --- |
| **Topology node** | `node_id` on the current normalized topology snapshot | Same **404** / identity rules as preview / dossier / related-policies families. |
| **Topology link** | `link_id` on the current normalized topology snapshot | Union-of-endpoint rules unchanged when deriving related policy rollups per subject. |

**Selection input (normative intent):** a **bounded list** of **`{ object_kind: "node" \| "link", object_id: string }`** entries:

1. **Dedup:** identical **`(object_kind, object_id)`** appears **at most once** after normalization.
2. **Bounds:** implementations **must** enforce a **documented maximum** list size (exact number is an implementation detail; the contract requires **bounded** selection, not unbounded fleet queries).
3. **Order:** display order **may** be stable-sorted (e.g. by `object_kind` then `object_id`) unless the client supplies an explicit order that the API documents as supported.
4. **Empty / invalid:** zero valid subjects → **422** or **empty workspace** with explicit gap honesty—**no** fabricated union.

**Out of scope for v1:** abstract tickets, regions, or **service-only** anchors **without** resolving to at least one **node** or **link** row—unless a future revision extends this document.

---

## Evidence sources and reuse (composition-only)

Implementations **may** assemble **only** from read contracts already defined in Phase **2**. Typical per-subject inputs (each subject **independently** resolved, then rollups merged):

| Role | Existing contract / route | Role in maintenance window workspace |
| --- | --- | --- |
| **Touch / related summary** | **`GET /api/v1/maintenance-preview`** — [`maintenance-preview-contract.md`](./maintenance-preview-contract.md) | **Per-subject** authoritative touch-set and related summaries; rollup **unions** service/policy identifiers with **deduplication**. |
| **Maintenance-framed deep context** | **`GET /api/v1/maintenance-evidence-workspace`** — [`maintenance-evidence-workspace-contract.md`](./maintenance-evidence-workspace-contract.md) | **Optional** nested or pointer per subject—**not** required for every subject if preview alone suffices for rollup; **not** merging full nested bodies as a single mega-JSON without honest sectioning. |
| **Topology dossier / timeline / delta** | Dossier, evidence timeline, evidence delta contracts | **Optional** per-subject pointers or short excerpts for planning; **reuse-only** semantics preserved. |
| **Service / impact story** | [**Service Impact Workspace**](./service-impact-workspace-contract.md), [**Service Explorer**](./service-explorer-contract.md) | **Pointers** when a **`service_id`** appears in union rollups—**not** re-deriving service catalog. |
| **Change safety** | [**Change Safety Case**](./change-safety-case-contract.md) | **Pivots** only—**not** merging case bodies into “window approval.” |
| **Cross-domain tension** | [**Evidence consistency summary**](./evidence-consistency-summary-contract.md) | **Optional** input to **deduped tension cues** across subjects—**not** replaying the full consistency row set as the workspace body. |
| **Stability** | [**Operational stability summary**](./operational-stability-summary-contract.md), topology/service stability profiles where present | **Cues** only (e.g. churn / insufficient-evidence flags that intersect the window)—**not** new stability scores. |

**Disallowed as primary evidence:** Grafana/Prometheus as **business truth**, synthetic **window risk** scores, workflow **approval** state, or **write-side** simulation.

---

## Deduped rollup semantics (v1)

Rollups are **set unions with deduplication** and **conservative caveat merging**—**not** a new truth engine.

1. **Affected services**  
   Union of service identifiers implied by per-subject **maintenance preview** (and optionally explorer-aligned pointers). **Dedupe** by canonical **`service_id`**. Preserve **per-subject provenance** when useful (e.g. “touched by subjects: …”) without double-counting.

2. **Affected / related policies**  
   Union of policy identifiers from per-subject preview (and related-policies semantics where applicable). **Dedupe** by canonical policy identity. **Stricter degraded / caveat posture wins** when the same policy appears with conflicting nested caveats.

3. **Evidence gaps**  
   Merge **gap notes** and **`missing_evidence_notes`** from nested assemblies; **dedupe** lines by normalized text where possible; **stricter** gap wins on conflict.

4. **Stability cues**  
   Aggregated **hints** only (e.g. subjects or services that also appear weak in stability-oriented **`GET`s**)—**labels** and **pointers**, not recomputed stability math.

5. **Contradiction / tension cues**  
   From [**evidence consistency**](./evidence-consistency-summary-contract.md) or equivalent **when available**: **deduped** list of **hotspots** (which subject pairs or domains show tension) suitable for **planning awareness**—**not** a verdict that the window is unsafe and **not** full duplication of the consistency summary response.

6. **No rollup authority**  
   Deduped sets are **read-side planning aids**. They **do not** prove completeness, **do not** prove disjointness of impact, and **do not** substitute for per-subject **`GET`** contracts when an operator needs authoritative detail.

---

## Normative section order (contract-level v1)

When a **`maintenance_window_workspace_v1`** payload is implemented, sections **should** follow this **type** order (titles may vary):

1. **Workspace identity** — `contract_id`, **`assembled_at`**, manifest of **which** nested `contract_id` values or route families contributed.
2. **Window framing** — short read-only copy: **multi-subject maintenance planning**, Phase **2** boundaries, **not** approval or simulation.
3. **Selected subjects** — normalized list **`(object_kind, object_id)`**, count, bound honesty.
4. **Per-subject summary strip** — optional compact row per subject (e.g. pointer to preview / maintenance evidence workspace)—**not** full nested duplication unless explicitly nested.
5. **Deduped affected services rollup** — union semantics as above.
6. **Deduped related / affected policies rollup** — union semantics as above.
7. **Merged evidence gaps** — required when any subject or nested assembly is partial.
8. **Stability cues** — optional aggregated hints + pivots.
9. **Tension / contradiction cues** — optional deduped hotspot list + pivots to evidence consistency when applicable.
10. **Cross-surface pivots** — read-only links to **Change Safety Case**, **Service Impact**, **Maintenance Evidence Workspace**, **Stability** surfaces, **Impact Report** hub—**contract ids** echoed, **not** merged verdicts.
11. **Explicit non-claims** — visible block; see below.

---

## Export, report, replay, and handoff

- **Live workspace `GET`:** returns **`maintenance_window_workspace_v1`** — read-only composition, **not** an export envelope by default.
- **Not `evidence_export_v1`:** frozen handoff uses **`GET /api/v1/exports/...`** per [`evidence-export-contract.md`](./evidence-export-contract.md). Week **38** may add a dedicated **maintenance-window handoff** envelope in a **separate** contract—this workspace **does not** claim that envelope until documented there.
- **Evidence replay:** WebUI should **reject** root JSON with **`contract_id":"maintenance_window_workspace_v1`** as **Evidence replay** input unless a future revision explicitly changes [`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md) policy (same honesty class as other composed workspaces).

---

## Navigation expectations

- **Read-only:** Shell pivots use existing **`view=`**, **`service_id`**, **`topology_object`**, **`sync_runs_limit`**, maintenance **`preview_context`**—**no** new workflow verbs.
- **Honest labels:** Buttons match destination contracts (e.g. “Open maintenance evidence workspace” for one subject vs “Open maintenance preview”).

---

## Empty / sparse / partial behavior

| Condition | Required behavior |
| --- | --- |
| **Unknown subject id** | Exclude with **gap** row or fail subject resolution per API rules—**no** silent drop without honesty. |
| **Some subjects 404** | Partial workspace **or** bounded error policy as documented in the route—**must** surface which subjects failed. |
| **Nested assemblies partial** | Propagate **merged gaps**; **stricter** caveat wins. |
| **Consistency or stability unavailable** | Omit tension/stability sections with **unsupported** honesty—**not** fabricated cues. |

---

## Explicit non-claims

Maintenance window workspace v1 **is**:

- **not** maintenance **approval**, **scheduling authority**, or **change validation**
- **not** **dry-run**, **simulation**, **blast-radius** truth, or **safe-to-change** verdict
- **not** **outage**, **SLA**, or **traffic** proof
- **not** **dataplane** or **pairing completeness** proof
- **not** a **substitute** for **Maintenance Preview**, **Maintenance Evidence Workspace**, **Change Safety Case**, **Service Impact Workspace**, **Evidence Consistency Summary**, **Operational Stability Summary**, or **Impact Report** **`GET`** families when authoritative per-subject detail is required
- **not** **Grafana-owned** semantics ([`dashboards.md`](./dashboards.md))
- **not** presenting **deduped rollups** as **workflow completion**, **risk acceptance**, or **operational sign-off**

---

## Gap audit (implementation follow-on)

| Area | Status |
| --- | --- |
| **Contract document** | **Delivered:** this file (`maintenance-window-workspace-contract.md`). |
| **Schema + route + assembly** | **Delivered:** **`GET /api/v1/maintenance-window-workspace`** — **`schemas/maintenance_window_workspace.py`**, **`services/maintenance_window_workspace.py`**, **`routers/maintenance_window_workspace.py`**; **`pytest`** **`test_maintenance_window_workspace.py`**. |
| **WebUI** | **Shell + rollup sections** — **`view=maintenance-window-workspace`**, **`mww_subject`** URL state, deduped service/policy tables, gaps, stability/tension cues, pivots; handoff/export in later week **38** tasks. |
| **Handoff / export** | **Future** — Week **38** Wednesday contract + API per schedule. |

---

## Related documents

- [`maintenance-preview-contract.md`](./maintenance-preview-contract.md)
- [`maintenance-evidence-workspace-contract.md`](./maintenance-evidence-workspace-contract.md)
- [`service-impact-workspace-contract.md`](./service-impact-workspace-contract.md)
- [`change-safety-case-contract.md`](./change-safety-case-contract.md)
- [`evidence-consistency-summary-contract.md`](./evidence-consistency-summary-contract.md)
- [`operational-stability-summary-contract.md`](./operational-stability-summary-contract.md)
- [`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md)
- [`evidence-export-contract.md`](./evidence-export-contract.md)
- [`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md)
- [`data-flows.md`](./data-flows.md)
- [`agent/sdn/week-38-schedule-overview.md`](../../agent/sdn/week-38-schedule-overview.md)

---

## Phase alignment note

**`01-CURRENT-PHASE.md`:** should **remain unchanged** — Phase **2** read-only foundation.

**`03-CURRENT-STATUS.md`:** update only when **`maintenance_window_workspace_v1`** is **implemented** and operational truth changes—not for contract-doc-only delivery.
