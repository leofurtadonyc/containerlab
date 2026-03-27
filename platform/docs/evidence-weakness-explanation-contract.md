# Evidence weakness explanation and next-best pivot v1 (Phase 2, read-only)

## Purpose

This document is the **bounded product contract** for **evidence weakness explanation and next-best pivot v1** — operator-language framing for **what kind of weakness** affects read-side confidence and **which read-only product surface** is the **next best** place to continue review **without** implying workflow execution, remediation authority, approval, or a hidden scoring engine.

It composes with [**Evidence quality workspace v1**](./evidence-quality-workspace-contract.md) (`evidence_quality_workspace_v1`): that workspace summarizes **collection assurance** and **read-path dimensions** from existing **`GET`** responses. **This contract** adds normative vocabulary for **plain-language explanation categories** and **next-best-pivot** semantics when a future API or UI wants to attach **structured** explanation + pivot hints to rows or sections—**navigation and interpretation only**.

Stable product vocabulary: **`contract_id`:** **`evidence_weakness_explanation_v1`**

**HTTP (implemented in app-api):** **`GET /api/v1/evidence-weakness-explanation`**

- **Query parameters:** **`sync_runs_limit`** (bounded, default **20**, max **100**) — aligned with **`GET /api/v1/evidence-quality-workspace`**.
- **Response:** **`evidence_weakness_explanation_v1`** — **`blocks[]`** with **`explanation_category`**, echoed **`evidence_quality_dimension`** / **`evidence_subject_domain`**, **`row_summary`**, **`primary_next_best_pivot`** (`pivot_id`, **`label`**, **`route_family`**, **`rationale`**, optional **`cited_evidence_fields`**), and optional **`alternate_next_best_pivot`** only for deterministic **`comparison_limits`** tie-breaks; **`safety_framing.explicit_non_claims`** are normative; **`assembly_notes`** propagate partial source failures from the evidence-quality workspace assembly.
- **Schema:** [`platform/app-api/src/app_api/schemas/evidence_weakness_explanation.py`](../../platform/app-api/src/app_api/schemas/evidence_weakness_explanation.py) — **`NextBestPivot`**, **`EvidenceWeaknessExplanationBlock`**, **`EvidenceWeaknessExplanationResponse`**.

**Composition:** The handler **reuses** **`GET /api/v1/evidence-quality-workspace`** assembly (same bounded inputs); it **does not** add investigation next-inspection, evidence-consistency tension resolution, or operational-stability churn analysis. **Optional future embedding** of explanation blocks on **`GET /api/v1/evidence-quality-workspace`** remains compatible; WebUI may also compose from this **`GET`** or from category tables.

**Phase:** [`Phase 2 — read-only product foundation`](../../agent/sdn/01-CURRENT-PHASE.md).

---

## Overlap review: not duplicate work

| Completed artifact | Canonical role | **Evidence weakness explanation v1** is **not** a duplicate because |
| --- | --- | --- |
| [`week-25-wednesday-task-02-next-inspection-suggestions-with-bounded-safety.md`](../../agent/sdn-tasks/completed/week-25-wednesday-task-02-next-inspection-suggestions-with-bounded-safety.md) → investigation workspace | **`next_inspection_framing`** / **`next_inspection_suggestions`** on **`GET /api/v1/investigation-workspace/context`** — deterministic prompts from **nested investigation assembly** fields (`context_domain`, `framing_rule`, `suggestion_id`) | **Investigation** next-inspection is **investigation-context** navigation (recency, capabilities, cross-domain prompts **inside** the investigation assembly). **Evidence weakness explanation** addresses **read-path / collection / anchor quality** and **where to deepen inventory/topology/policy/service/maintenance evidence**—**orthogonal** assembly family; **does not** reuse **`InvestigationNextInspectionSuggestion`** semantics or reopen **`investigation_workspace_phase2_v1`**. |
| [`week-35-thursday-task-01-evidence-consistency-workspace-and-cross-surface-pivots.md`](../../agent/sdn-tasks/completed/week-35-thursday-task-01-evidence-consistency-workspace-and-cross-surface-pivots.md) → [`evidence-consistency-summary-contract.md`](./evidence-consistency-summary-contract.md) | **`EvidenceConsistencyPivotHint`** — **alignment / tension** story; pivots to list/dossier surfaces for **contradiction** follow-up | Consistency pivots answer **“resolve tension / compare domains.”** **Next-best pivot** here answers **“evidence is too thin—go to the deepest honest surface for *this* weakness kind”**—may **coincide** with route families (e.g. **Devices**) but **must not** copy consistency **signal** taxonomy (`appears_in_tension`, etc.). |
| [`week-38-thursday-task-01-cross-surface-pivots-into-maintenance-window-workspace.md`](../../agent/sdn-tasks/completed/week-38-thursday-task-01-cross-surface-pivots-into-maintenance-window-workspace.md) | **`navigateToMaintenanceWindowWorkspace*`** and related **maintenance-window** URL state | Maintenance-window pivots are **planning-window subject selection** (`mww_subject`, multi-subject rollups). **Next-best pivot** may **include** maintenance workspaces when weakness is **maintenance-adjacent**, but **does not** redefine **`maintenance_window_workspace_v1`** subject rules or reopen **week 38** navigation contracts. |

**One-line distinction:** **Investigation next-inspection** = *what to inspect next inside the investigation assembly*; **evidence weakness explanation + next-best pivot** = *why confidence is limited on read paths and which **read-only product destination** best deepens evidence for that weakness class*.

---

## Evidence weakness explanation categories (v1 taxonomy)

These categories describe **operator-visible weakness** in **plain language**. They **map to** (and must remain consistent with) [**Evidence quality dimensions**](./evidence-quality-workspace-contract.md) where applicable—they **do not** replace **`evidence_quality_dimension`** strings on the API.

| Explanation category | Operator meaning (bounded) | Typical alignment to `evidence_quality_dimension` |
| --- | --- | --- |
| **`collection_assurance_weak`** | Live collector-to-backend path is degraded, partial, or unavailable for a domain family—read-side may be **persisted** or **empty** without implying lab health. | `collection_assurance` |
| **`fallback_or_stale_serving`** | Response is honestly **`persisted_fallback`** or **stale** versus live observation—over-trust risk is **epistemic**, not “network is down.” | `fallback_conditions`, `read_path_fragility` |
| **`sparse_history_or_anchors`** | History window is **`unavailable`** / **`current_only`** / **`no_comparable_anchor`**—comparison or delta depth is blocked. | `sparse_history_anchors` |
| **`comparison_or_scope_limited`** | **`read_side_query`** limits, **`detail_mode`**, **`history_gate`**, or truncation means the effective universe is smaller than the operator question. | `comparison_limits`, `cross_domain_scope_note` |
| **`partial_or_unsupported_detail`** | Capabilities matrix **placeholder**, policy **no_policies_observed** class, or **unsupported** capability rows—bounded honesty, not a verdict on the vendor. | `unsupported_partial_detail` |
| **`cross_surface_scope_note`** | Weakness is **only** explainable by referencing **multiple** domains’ limits together—use **sparingly**; prefer a single category when a **single** domain citation exists. | `cross_domain_scope_note` |

Implementations **must not** invent new category strings without a **contract revision**. **No** numeric **severity** or **priority score**—ordering rules below apply instead.

---

## Next-best pivot semantics (v1)

A **next-best pivot** is a **read-only navigation recommendation** to a **declared product surface** ( **`view=`** family and/or documented **`GET /api/v1/...`** route family). It is **not** a workflow step, **not** remediation, **not** “fix the collector,” **not** approval to change the network.

### Pivot target (normative fields)

When structured (future schema), each pivot **should** carry:

| Field | Meaning |
| --- | --- |
| **`pivot_id`** | Stable string (`snake_case`) — e.g. `open_devices_list`, `open_topology_dossier`, `open_maintenance_evidence_workspace`. |
| **`label`** | Short operator-facing label (may match WebUI button copy). |
| **`route_family`** | Stable reference: **`view=...`** id and/or **`GET`** path prefix already used in product contracts (same spirit as [`EvidenceConsistencyPivotHint`](./evidence-consistency-summary-contract.md) **`route_family`**). |
| **`rationale`** | **One sentence** tying pivot to **this** weakness category—**must cite** which explanation category applies; **must not** assert network outcome. |
| **`cited_evidence_fields`** (optional) | Echo of **existing** response field paths or contract names that motivated the pivot—**not** new telemetry. |

### Ordering rules (no scoring engine)

1. **At most one primary next-best pivot** per explanation block unless the contract explicitly allows a **secondary** “alternate” (e.g. **Devices** vs **Topology** when both are equally valid for a **comparison_limit**—still **no** numeric rank).
2. **Deterministic tie-break:** prefer the **deepest domain-specific list or dossier** that matches the **weakness category** (e.g. **sparse policy history** → **Policies** before **Overview**).
3. **No ML / urgency score** — ordering is **rule-based** from category + cited fields only.

### Forbidden pivot postures

- **Not** “execute change,” “open ticket,” “remediate collector,” “approve maintenance.”
- **Not** Grafana or Prometheus as **primary** pivot targets for **business truth** (observability remains [`dashboards.md`](./dashboards.md)).
- **Not** substituting **evidence consistency** or **stability** workspaces as **automatic** pivots unless the **rationale** explicitly ties weakness to **tension** or **churn** (those remain **different** product questions).

---

## Explicit non-claims

**Evidence weakness explanation v1** and any **next-best pivot** list:

- **Are not** validation, safe-to-change, or go/no-go verdicts.
- **Are not** root-cause assignment beyond **cited** `data_status` / `serving_mode` / `caveats` / contract postures.
- **Are not** a substitute for [**Change safety case**](./change-safety-case-contract.md), [**Investigation workspace**](./investigation-workspace-contract.md) next-inspection, or [**Evidence consistency summary**](./evidence-consistency-summary-contract.md)—each remains **contract-bounded**.
- **Are not** remediation playbooks or runbook automation.
- **Do not** add **hidden ranking** across operators or sites—**read-only navigation guidance only**.

---

## Relationship to `evidence_quality_workspace_v1`

- **`GET /api/v1/evidence-weakness-explanation`** derives **only** from the same bounded assembly as **`GET /api/v1/evidence-quality-workspace`** (one explanation block per workspace row; dimension → explanation category mapping is deterministic).
- **`rows[]`** on **`GET /api/v1/evidence-quality-workspace`** may **later** embed **`evidence_weakness_explanation_v1`** blocks (category + optional pivots) **without** changing the **core** dimension strings—implementations **must** keep backward-compatible **summary/detail** text when embedding is partial.
- WebUI may **compose** explanation copy from **`GET /api/v1/evidence-weakness-explanation`**, documented category tables, and **existing** pivot navigators—**no** invented semantics beyond these contracts.

---

## Related documents

- [`evidence-quality-workspace-contract.md`](./evidence-quality-workspace-contract.md)
- [`investigation-workspace-contract.md`](./investigation-workspace-contract.md)
- [`evidence-consistency-summary-contract.md`](./evidence-consistency-summary-contract.md)
- [`maintenance-window-workspace-contract.md`](./maintenance-window-workspace-contract.md)
- [`agent/sdn/03-CURRENT-STATUS.md`](../agent/sdn/03-CURRENT-STATUS.md)
