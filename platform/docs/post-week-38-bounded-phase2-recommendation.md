# Post–Week 38 bounded Phase 2 recommendation

## Purpose

This note records the **next disciplined scheduling posture** after week **38** so planning does not default to **momentum-driven churn** on the closed **maintenance window workspace** (**`maintenance_window_workspace_v1`**, **`GET /api/v1/maintenance-window-workspace`**, **`view=maintenance-window-workspace`**, **`mww_subject`** URL state), **maintenance window handoff** (**`maintenance_window_handoff_v1`**, **`GET /api/v1/exports/maintenance-window-handoff`**), **cross-surface pivots** (topology, maintenance, stability, change safety, NOC, global search, operator briefing), or **verifier / test** anchors (**`verify-core-runtime.sh`** structural **`GET`**s when topology samples exist; **`mww_subject`** / **`maintenance_window_workspace_v1`** in shipped **`/assets/*.js`**; **`week38-verifier-bundle-markers.test.ts`** and related **`vitest`** files)—each remains **contract-bounded** read-side work with explicit non-claims.

**Phase:** [`Phase 2 — read-only product foundation`](../../agent/sdn/01-CURRENT-PHASE.md) — **unchanged** unless explicit new evidence supports a documented phase-boundary review.

## What week 38 closed

Week **38** is **closed** as a bounded Phase **2** **innovation** lane—documented in [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) **Week 38 closure (Friday rollup)** and aligned with:

- **Contracts:** [`maintenance-window-workspace-contract.md`](./maintenance-window-workspace-contract.md); [`maintenance-window-handoff-contract.md`](./maintenance-window-handoff-contract.md)
- **APIs:** **`GET /api/v1/maintenance-window-workspace`** (repeated **`subject=`** tokens; dedupe; bounded caps); **`GET /api/v1/exports/maintenance-window-handoff`**
- **WebUI:** multi-subject rollup surfaces, read-only pivots, **`mww_subject`**—**not** workflow, approval, or Grafana-owned product semantics
- **Verifier / tests:** **`verify-core-runtime.sh`** structural checks and bundle substrings as recorded in **03-CURRENT-STATUS** (including **`week38-verifier-bundle-markers.test.ts`**)

## What week 38 did **not** imply

- **No** workflow execution, dry-run APIs, validation engines, safe-to-change verdicts, or approval semantics
- **No** blast-radius or impact simulation presented as authority
- **No** substitute for deep reads on **Maintenance Preview**, **Maintenance Evidence Workspace**, **Evidence Consistency**, **Change Safety Case**, **Stability workspace**, or **`evidence_export_v1`** when those contracts matter—composition **over** prior weeks, not redefinition
- **No** merge of handoff export into **`evidence_export_v1`** replay semantics—distinct export families per contracts
- **No** authorization to extend **`maintenance_window_workspace_v1`**, **`maintenance_window_handoff_v1`**, **`mww_subject`**, or week **38** pivot surfaces for polish or feature accretion **without new evidence** of contract drift or a proven gap—**anti-reopen** discipline matches **post-week-32** through **post-week-37** guardrails

## Relationship to post–week 37

[`post-week-37-bounded-phase2-recommendation.md`](./post-week-37-bounded-phase2-recommendation.md) selected **multi-subject maintenance-window planning** as the next bounded slice after week **37**. **Week 38** implemented that lane **without** reopening week **37** **operational stability summary**, **stability profiles**, **`view=stability-workspace`**, or **`navigateToStabilityWorkspace`** semantics as backlog—composition **over** weeks **27–38**, not redefinition.

## Scheduling default (evidence-first, **one** slice)

There is **still no automatic default implementation lane** after week **38**.

Pick **one** narrow theme per cycle—**not** parallel defaults:

1. **Evidence-gated truth-depth or ADR cycle** — per [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md), [`week-33-evidence-backed-reassessment-memo.md`](./week-33-evidence-backed-reassessment-memo.md), and truth-depth reviews—**or**
2. **Documentation-first** alignment (e.g. topology partiality, operator-boundary drift) only when live lab evidence supports that **single** theme—**or**
3. **Narrow copy/docs-only** follow-on when **wording** drift is proven—per [`week-33-bounded-next-slice-recommendation.md`](./week-33-bounded-next-slice-recommendation.md) (do **not** assume another full labeling cycle is the default)

**Do not** reopen **week 38** maintenance-window workspace, handoff export, **`mww_subject`**, or cross-surface pivots for momentum; **do not** treat week **38** closure as a backlog invitation for new assemblies.

**No** product scope is prescribed here for a future week—each candidate slice must be **evidence-justified** and Phase **2** safe.

## Explicit anti-recommendations

- **Reopening week 38 surfaces for UX polish or scope creep** without new evidence
- **Parallel** “default” slices (labeling + new assembly + doc churn in one cycle)
- **Phase transition** language or workflow semantics that exceed Phase **2**
- **Grafana** as the product surface for these workspaces ([`dashboards.md`](./dashboards.md))

## References

| Topic | Document |
| --- | --- |
| Operational truth | [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) |
| Roadmap | [`roadmap.md`](./roadmap.md) |
| Post–week 37 (pre–week 38 posture / chosen slice) | [`post-week-37-bounded-phase2-recommendation.md`](./post-week-37-bounded-phase2-recommendation.md) |
| Week 33 next-slice (labeling) | [`week-33-bounded-next-slice-recommendation.md`](./week-33-bounded-next-slice-recommendation.md) |
| Maintenance window workspace | [`maintenance-window-workspace-contract.md`](./maintenance-window-workspace-contract.md) |
| Maintenance window handoff | [`maintenance-window-handoff-contract.md`](./maintenance-window-handoff-contract.md) |
