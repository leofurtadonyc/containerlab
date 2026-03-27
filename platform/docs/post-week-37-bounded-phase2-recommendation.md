# Post–Week 37 bounded Phase 2 recommendation

## Purpose

This note records the **next disciplined scheduling posture** after week **37** so planning does not default to **momentum-driven churn** on the closed **operational stability summary** (**`operational_stability_summary_v1`**, **`GET /api/v1/stability/summary`**), **topology object stability profile** (**`topology_object_stability_profile_v1`**), **service stability profile** (**`service_stability_profile_v1`**), **stability workspace** (**`view=stability-workspace`**, **`StabilityWorkspaceView`**), or **cross-surface pivots** (**`navigateToStabilityWorkspace`**, **`StabilityOverviewEntry`**)—each remains **contract-bounded** read-side work with explicit non-claims.

**Phase:** [`Phase 2 — read-only product foundation`](../../agent/sdn/01-CURRENT-PHASE.md) — **unchanged** unless explicit new evidence supports a documented phase-boundary review.

## What week 37 closed

Week **37** is **closed** as a bounded Phase **2** **innovation** lane—documented in [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) **Week 37 closure (Friday rollup)** and aligned with:

- **Contracts:** [`operational-stability-summary-contract.md`](./operational-stability-summary-contract.md); [`topology-object-stability-profile-contract.md`](./topology-object-stability-profile-contract.md); [`service-stability-profile-contract.md`](./service-stability-profile-contract.md)
- **APIs:** **`GET /api/v1/stability/summary`**, **`GET /api/v1/topology/objects/{object_id}/stability-profile`**, **`GET /api/v1/services/{service_id}/stability-profile`**
- **WebUI:** **`view=stability-workspace`**, **`StabilityOverviewEntry`** on **Overview** / **NOC**, cross-surface **`navigateToStabilityWorkspace`** pivots—**not** workflow, approval, or Grafana-owned product semantics
- **Verifier / tests:** **`verify-core-runtime.sh`** structural **`GET`**s and **`operational_stability_summary_v1`** in **`/assets/*.js`**; repository **`pytest`** / **`vitest`** as recorded in **03-CURRENT-STATUS** (including **`week37-verifier-bundle-markers.test.ts`**)

## What week 37 did **not** imply

- **No** workflow, dry-run, validation-engine, or safe-to-change authority
- **No** substitute for **`evidence_consistency_summary_v1`**, **`maintenance_evidence_workspace_v1`**, dossier, timeline, delta, or **`change_safety_case_v1`** deep reads when those contracts matter
- **No** merge of stability summary and profiles into a single “truth engine”—each remains **contract-bounded**
- **No** change to the default verdict [`conditionally_ready_with_explicit_limits`](./production-readiness-assessment.md) by default
- **No** authorization to extend **`operational_stability_summary_v1`**, **`topology_object_stability_profile_v1`**, **`service_stability_profile_v1`**, or week **37** workspace/pivot surfaces for polish or feature accretion **without new evidence** of contract drift or a proven gap—**anti-reopen** discipline matches **post-week-32** / **post-week-34** / **post-week-35** / **post-week-36** guardrails

## Relationship to post–week 36

[`post-week-36-bounded-phase2-recommendation.md`](./post-week-36-bounded-phase2-recommendation.md) described the evidence-first default after week **36**. **Week 37** implemented the **operational stability** lane **without** reopening week **36** topology-object timeline/delta or maintenance-evidence workspace semantics as backlog—composition **over** weeks **27–36**, not redefinition.

## Scheduling default (evidence-first, **one** slice)

There is **still no automatic default implementation lane** after week **37**.

Pick **one** narrow theme per cycle—**not** parallel defaults:

1. **Evidence-gated truth-depth or ADR cycle** — per [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md), [`week-33-evidence-backed-reassessment-memo.md`](./week-33-evidence-backed-reassessment-memo.md), and truth-depth reviews—**or**
2. **Documentation-first** alignment (e.g. topology partiality, operator-boundary drift) only when live lab evidence supports that **single** theme—**or**
3. **Narrow copy/docs-only** follow-on when **wording** drift is proven—per [`week-33-bounded-next-slice-recommendation.md`](./week-33-bounded-next-slice-recommendation.md) (do **not** assume another full labeling cycle is the default)

**Do not** reopen **week 37** stability summary, profiles, workspace, or pivots for momentum; **do not** treat week **37** closure as a backlog invitation for new assemblies.

## Chosen next bounded slice

The selected next planning lane is a **multi-subject maintenance-window planning** slice.

Why this lane fits the current posture:

- it is **not** another generic trust-language or evidence-honesty pass, which would overlap too much with closed work from weeks **14**, **18**, **21**, **23**, **35**, and **37**
- it builds on already shipped single-subject maintenance and topology evidence surfaces from weeks **31**, **32**, **34**, **35**, **36**, and **37**
- it creates a larger operator-visible jump by moving from **single-subject reasoning** to **bounded multi-subject maintenance-window review**
- it remains fully **Phase 2** because it is still read-only composition, handoff, and navigation—not workflow, approval, dry-run, simulation, or actuation

Planned direction:

1. **Maintenance Window Workspace v1**
2. **Deduped affected services / policies / evidence-gap / stability rollups** across selected topology subjects
3. **Maintenance-window handoff/export framing** distinct from existing export/report families
4. **Cross-surface pivots** from topology, maintenance, NOC, search, briefing, and stability into the new workspace

Anti-reopen rule:

- this chosen slice must be implemented as a **new multi-subject planning surface**
- it must **not** silently reopen or rename closed work such as **Maintenance Preview**, **Maintenance Evidence Workspace**, **Evidence Consistency**, **Change Safety Case**, or **Stability Workspace**

**Update (week 38 shipped):** the slice above was delivered as the **Week 38 innovation lane**—see [`post-week-38-bounded-phase2-recommendation.md`](./post-week-38-bounded-phase2-recommendation.md) for closure, forward scheduling posture, and **anti-reopen** guardrails for **`maintenance_window_workspace_v1`**, handoff export, and **`mww_subject`**. **Do not** treat week **37** closure as a backlog invitation for new stability assemblies; **do not** reopen **week 38** maintenance-window surfaces for momentum.

A **future** bounded week may still choose **operator contract labeling** depth, **ADR-0001** truth-depth, or another single slice—each must be **evidence-justified** and Phase **2** safe. Forward default: **post-week-38** (no automatic product lane).

## Explicit anti-recommendations

- **Reopening week 37 surfaces for UX polish or scope creep** without new evidence
- **Parallel** “default” slices (labeling + new assembly + doc churn in one cycle)
- **Phase transition** language or workflow semantics that exceed Phase **2**
- **Grafana** as the product surface for these workspaces ([`dashboards.md`](./dashboards.md))

## References

| Topic | Document |
| --- | --- |
| Operational truth | [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) |
| Roadmap | [`roadmap.md`](./roadmap.md) |
| Post–week 36 (pre–week 37 posture) | [`post-week-36-bounded-phase2-recommendation.md`](./post-week-36-bounded-phase2-recommendation.md) |
| Week 33 next-slice (labeling) | [`week-33-bounded-next-slice-recommendation.md`](./week-33-bounded-next-slice-recommendation.md) |
| Post–week 38 (maintenance-window lane closure) | [`post-week-38-bounded-phase2-recommendation.md`](./post-week-38-bounded-phase2-recommendation.md) |
| Operational stability summary | [`operational-stability-summary-contract.md`](./operational-stability-summary-contract.md) |
| Topology object stability profile | [`topology-object-stability-profile-contract.md`](./topology-object-stability-profile-contract.md) |
| Service stability profile | [`service-stability-profile-contract.md`](./service-stability-profile-contract.md) |
