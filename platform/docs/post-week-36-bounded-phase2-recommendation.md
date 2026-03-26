# Post–Week 36 bounded Phase 2 recommendation

## Purpose

This note records the **next disciplined scheduling posture** after week **36** so planning does not default to **momentum-driven churn** on the closed **topology object evidence timeline** (**`topology_object_evidence_timeline_v1`**), **topology object evidence delta** (**`topology_object_evidence_delta_v1`**), **maintenance evidence workspace** (**`maintenance_evidence_workspace_v1`**, **`GET /api/v1/maintenance-evidence-workspace`**, **`view=maintenance-evidence-workspace`**), or the **NOC** / **global operator search** / **operator briefing** maintenance pivots—each remains **contract-bounded** read-side work with explicit non-claims.

**Phase:** [`Phase 2 — read-only product foundation`](../../agent/sdn/01-CURRENT-PHASE.md) — **unchanged** unless explicit new evidence supports a documented phase-boundary review.

## What week 36 closed

Week **36** is **closed** as a bounded Phase **2** **innovation** lane—documented in [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) **Week 36 closure (Friday rollup)** and aligned with:

- **Contracts:** [`topology-object-evidence-timeline-contract.md`](./topology-object-evidence-timeline-contract.md); [`topology-object-evidence-delta-contract.md`](./topology-object-evidence-delta-contract.md); [`maintenance-evidence-workspace-contract.md`](./maintenance-evidence-workspace-contract.md); operator surfaces per [`operator-search-contract.md`](./operator-search-contract.md), [`noc-cockpit-contract.md`](./noc-cockpit-contract.md), [`operator-briefing-workspace-contract.md`](./operator-briefing-workspace-contract.md)
- **APIs:** **`GET /api/v1/topology/objects/{object_id}/evidence-timeline`**, **`GET /api/v1/topology/objects/{object_id}/evidence-delta`**, **`GET /api/v1/maintenance-evidence-workspace`**
- **WebUI:** **`TopologyObjectEvidenceTimelinePanel`**, **`TopologyObjectEvidenceDeltaPanel`** on **Topology** and dossier; **`MaintenanceEvidenceWorkspaceView`**; **NOC** / **global search** / **briefing** maintenance-evidence pivots—**not** workflow, approval, or Grafana product semantics
- **Verifier / tests:** **`verify-core-runtime.sh`** structural **`GET`**s when gates pass (including **`maintenance-evidence-workspace`** compact **`GET`**), **`maintenance_evidence_workspace_v1`** in **`/assets/*.js`**; repository **`pytest`** / **`vitest`** as recorded in **03-CURRENT-STATUS** (including **`week36-verifier-bundle-markers.test.ts`**)

## What week 36 did **not** imply

- **No** workflow, dry-run, validation-engine, or safe-to-change authority
- **No** substitute for per-contract deep reads when **`policy_evidence_timeline_v1`**, **`service_evidence_timeline_v1`**, **`evidence_export_v1`**, or frozen report contracts matter
- **No** merge of topology-object timeline, delta, and maintenance workspace into a single “truth engine”—each remains **contract-bounded**
- **No** change to the default verdict [`conditionally_ready_with_explicit_limits`](./production-readiness-assessment.md) by default
- **No** authorization to extend **`topology_object_evidence_timeline_v1`**, **`topology_object_evidence_delta_v1`**, **`maintenance_evidence_workspace_v1`**, or week **36** operator pivots for polish or feature accretion **without new evidence** of contract drift or a proven gap—**anti-reopen** discipline matches **post-week-32** / **post-week-34** / **post-week-35** guardrails

## Relationship to post–week 35

[`post-week-35-bounded-phase2-recommendation.md`](./post-week-35-bounded-phase2-recommendation.md) **Forward note for week 36 planning** described the preferred single lane (topology-object timeline, delta, maintenance evidence workspace). **Week 36** implemented that lane **without** reopening **week 35** service timeline, delta, or evidence-consistency semantics as backlog—composition **over** weeks **27–35**, not redefinition.

## Scheduling default (evidence-first, **one** slice)

There is **still no automatic default implementation lane** after week **36**.

Pick **one** narrow theme per cycle—**not** parallel defaults:

1. **Evidence-gated truth-depth or ADR cycle** — per [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md), [`week-33-evidence-backed-reassessment-memo.md`](./week-33-evidence-backed-reassessment-memo.md), and truth-depth reviews—**or**
2. **Documentation-first** alignment (e.g. topology partiality, operator-boundary drift) only when live lab evidence supports that **single** theme—**or**
3. **Narrow copy/docs-only** follow-on when **wording** drift is proven—per [`week-33-bounded-next-slice-recommendation.md`](./week-33-bounded-next-slice-recommendation.md) (do **not** assume another full labeling cycle is the default)

**Do not** reopen **week 36** topology-object timeline, delta, maintenance evidence workspace, or maintenance-intelligence pivots for momentum; **do not** treat week **36** closure as a backlog invitation for new assemblies.

A **future** bounded week may still choose **operator contract labeling** depth, **ADR-0001** truth-depth, or another single slice—each must be **evidence-justified** and Phase **2** safe. Nothing here prescribes week **37** product scope.

## Explicit anti-recommendations

- **Reopening week 36 surfaces for UX polish or scope creep** without new evidence
- **Parallel** “default” slices (labeling + new assembly + doc churn in one cycle)
- **Phase transition** language or workflow semantics that exceed Phase **2**
- **Grafana** as the product surface for these workspaces ([`dashboards.md`](./dashboards.md))

## References

| Topic | Document |
| --- | --- |
| Operational truth | [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) |
| Roadmap | [`roadmap.md`](./roadmap.md) |
| Post–week 35 (planned week 36 lane) | [`post-week-35-bounded-phase2-recommendation.md`](./post-week-35-bounded-phase2-recommendation.md) |
| Week 33 next-slice (labeling) | [`week-33-bounded-next-slice-recommendation.md`](./week-33-bounded-next-slice-recommendation.md) |
| Topology object evidence timeline | [`topology-object-evidence-timeline-contract.md`](./topology-object-evidence-timeline-contract.md) |
| Topology object evidence delta | [`topology-object-evidence-delta-contract.md`](./topology-object-evidence-delta-contract.md) |
| Maintenance evidence workspace | [`maintenance-evidence-workspace-contract.md`](./maintenance-evidence-workspace-contract.md) |
