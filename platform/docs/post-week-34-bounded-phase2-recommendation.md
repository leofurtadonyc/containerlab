# Post–Week 34 bounded Phase 2 recommendation

## Purpose

This note records the **next disciplined scheduling posture** after week **34** so planning does not default to **momentum-driven churn** on the closed **Path Explorer v1** (**`path_explorer_v1`**) and **Service Impact Workspace v1** (**`service_impact_workspace_v1`**) surfaces—composition-only read-side workspaces with explicit non-claims—nor does it treat week **33**’s **labeling-only** default (see [`week-33-bounded-next-slice-recommendation.md`](./week-33-bounded-next-slice-recommendation.md)) as superseded: week **34** shipped **different** work (composed **`GET`** assemblies + WebUI + cockpit/search/overview pivots).

**Phase:** [`Phase 2 — read-only product foundation`](../../agent/sdn/01-CURRENT-PHASE.md) — **unchanged** unless explicit new evidence supports a documented phase-boundary review.

## What week 34 closed

Week **34** is **closed** as a bounded Phase **2** **innovation** lane—Path Explorer and Service Impact Workspace—documented in [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) **Week 34 closure (Friday rollup)** and aligned with:

- **Contracts:** [`path-explorer-contract.md`](./path-explorer-contract.md); [`service-impact-workspace-contract.md`](./service-impact-workspace-contract.md); replay/export boundaries per [`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md), [`evidence-export-contract.md`](./evidence-export-contract.md)
- **APIs / assemblies:** **`GET /api/v1/path-explorer`**, **`path_explorer_v1`** (nested reuse from existing policy/path assemblies); **`GET /api/v1/service-impact-workspace`**, **`service_impact_workspace_v1`** (nested **`service_explorer_v1`**, optional **`failure_impact_v1`** when topology resolves)
- **WebUI:** **`view=path-explorer`**, **`view=service-impact-workspace`**; NOC cockpit, global operator search, and Overview operator-workspace pivots as shipped—**not** new workflow or Grafana product semantics
- **Verifier / tests:** **`verify-core-runtime.sh`** **`/assets/*.js`** markers; repository **`pytest`** / **`vitest`** as recorded in **03-CURRENT-STATUS**

## What week 34 did **not** imply

- **No** workflow, dry-run, validation-engine, or safe-to-change authority
- **No** substitute for live **`GET`** or frozen **`evidence_export_v1`** when those contracts matter
- **No** merge of Path Explorer or Service Impact into a single “operator brain”—each remains **contract-bounded**
- **No** change to the default verdict [`conditionally_ready_with_explicit_limits`](./production-readiness-assessment.md) by default
- **No** authorization to extend **`path_explorer_v1`** or **`service_impact_workspace_v1`** semantics for polish or feature accretion **without new evidence** of contract drift or a proven gap—**anti-reopen** for these surfaces matches **post-week-32** discipline for week **30–32** assemblies

## Relationship to week 33 next-slice note

[`week-33-bounded-next-slice-recommendation.md`](./week-33-bounded-next-slice-recommendation.md) recommended **operator contract labeling** (no new assemblies) as the **default** narrow slice after week **33** integrity work. **Week 34** instead delivered **composed** Path Explorer + Service Impact Workspace. The **labeling** slice remains a **valid next** bounded choice when evidence shows **wording** drift; it is **not** invalidated—it was simply **not** what week **34** implemented.

## Scheduling default (evidence-first, **one** slice)

There is **still no automatic default implementation lane** after week **34**.

Pick **one** narrow theme per cycle—**not** parallel defaults:

1. **Operator contract labeling** — per [`week-33-bounded-next-slice-recommendation.md`](./week-33-bounded-next-slice-recommendation.md) (copy/docs alignment, no new **`GET`** assemblies), **or**
2. **Evidence-gated truth-depth or ADR cycle** — per [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md), [`week-33-evidence-backed-reassessment-memo.md`](./week-33-evidence-backed-reassessment-memo.md), and truth-depth reviews—**or**
3. **Documentation-first** alignment (e.g. topology partiality) only when live lab evidence supports that **single** theme—see conditional alternative in **week-33-bounded-next-slice**

**Do not** reopen **Path Explorer** or **Service Impact Workspace** for momentum; **do not** treat week **34** closure as a backlog invitation.

## Planned week 35 bounded lane

If the team proceeds immediately into a new bounded implementation week, the preferred **single coherent lane** is:

1. **service-centric evidence chronology and delta**, plus
2. **cross-domain evidence consistency as an embedded safety layer**, with
3. **operator contract labeling hardening** as the supporting safety pass

That means:

- extend the product at the **service** level rather than reopening week **34** path/service-impact semantics directly
- add a bounded safety surface that highlights contradiction or weak alignment across existing evidence rather than pretending we have validation truth
- keep all work fully read-only and Phase **2** safe

This planned lane should still obey the same anti-reopen discipline: it must **compose over** weeks **30–34** rather than redefining them.

## Explicit anti-recommendations

- **Reopening week 34 surfaces for UX polish or scope creep** without new evidence
- **Parallel** “default” slices (labeling + new assembly + doc churn in one cycle)
- **Phase transition** language or workflow semantics that exceed Phase **2**
- **Grafana** as the product surface for these workspaces ([`dashboards.md`](./dashboards.md))

## References

| Topic | Document |
| --- | --- |
| Operational truth | [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) |
| Roadmap | [`roadmap.md`](./roadmap.md) |
| Post–week 32 (week 30–32 anti-reopen) | [`post-week-32-bounded-phase2-recommendation.md`](./post-week-32-bounded-phase2-recommendation.md) |
| Week 33 next-slice (labeling default) | [`week-33-bounded-next-slice-recommendation.md`](./week-33-bounded-next-slice-recommendation.md) |
| Path Explorer | [`path-explorer-contract.md`](./path-explorer-contract.md) |
| Service Impact Workspace | [`service-impact-workspace-contract.md`](./service-impact-workspace-contract.md) |
| NOC cockpit | [`noc-cockpit-contract.md`](./noc-cockpit-contract.md) |
| Operator search | [`operator-search-contract.md`](./operator-search-contract.md) |
