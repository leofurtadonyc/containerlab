# Post–Week 25 bounded Phase 2 recommendation

## Purpose

This note records the **next disciplined scheduling posture** after week **25** so planning does not default to reopening the closed **investigation workspace** slice—**`investigation_workspace_phase2_v1`** contract, **`GET /api/v1/investigation-workspace/context`** nested assembly, **`next_inspection_framing`** / **`next_inspection_suggestions`**, Overview entry and **`view=investigation`** **`InvestigationWorkspaceProduct`** (recency anchors, cross-domain context panels, next-inspection UI), repository **`pytest`** / **`vitest`** / structural **`verify-core-runtime`** investigation JSON checks, or cross-doc alignment—by momentum.

It is a **recommendation and anti-drift guardrail** only.

It does **not** authorize:

- phase transition
- workflow implementation, dry-run APIs, or validation engines
- broader topology truth, policy truth, or multi-vendor parity than current reviews prove
- treating investigation assemblies as validation verdicts, drift results, safe-to-change recommendations, workflow progress, or operator execution steps
- expanding investigation workspace into new persistence domains, collectors, cross-domain scoring engines, or Grafana-owned investigation semantics
- forensic or workflow-chronology claims beyond what nested API fields already expose

## Relationship to prior guidance

Week **21** posture remains in [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md). Week **22** posture remains in [`post-week-22-bounded-phase2-recommendation.md`](./post-week-22-bounded-phase2-recommendation.md). Week **23** posture remains in [`post-week-23-bounded-phase2-recommendation.md`](./post-week-23-bounded-phase2-recommendation.md). Week **24** bounded **change-intelligence** closure remains in [`post-week-24-bounded-phase2-recommendation.md`](./post-week-24-bounded-phase2-recommendation.md). Week **25** **adds** explicit closure of the bounded **investigation workspace** workstream (read-only assembly and interpretation support only); it does **not** replace ADR-0001 or the topology/policy reviews, and it does **not** subsume week **24** change-intelligence or week **23** readiness decision-support semantics. Week **26** bounded **operator evidence pack / situation room** closure is documented in [`post-week-26-bounded-phase2-recommendation.md`](./post-week-26-bounded-phase2-recommendation.md).

## What week 25 actually closed

Week **25** delivered **bounded Phase 2 investigation workspace** (see [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) **Week 25** closure and completed tasks under `agent/sdn-tasks/completed/week-25-*.md`):

- **Contract:** [`investigation-workspace-contract.md`](./investigation-workspace-contract.md) plus [`schemas/investigation_workspace.py`](../app-api/src/app_api/schemas/investigation_workspace.py) — **`investigation_workspace_phase2_v1`**, **`InvestigationContextAssemblyResponse`**, **`InvestigationNextInspectionSuggestion`**, explicit non-claims
- **API:** **`GET /api/v1/investigation-workspace/context`** with optional **`sync_runs_limit`** (forwarded to nested change intelligence only) — composes **existing** **`recent-summary`**, **`/api/v1/platform/status`**, **`/api/v1/capabilities`**; **no** new collection or scoring
- **WebUI:** Overview **Investigation workspace (bounded)** entry; **`view=investigation`** **`InvestigationWorkspaceProduct`** — safety framing, recent-change rows, recency timeline, context panels, next-inspection section, platform/capabilities excerpts, hub navigation — **read-only** **`view=`** navigation only
- **Regression:** repository **`pytest`** / **`vitest`** and structural **`verify-core-runtime.sh`** substring checks on live investigation JSON (including **`next_inspection`** shape and bounded **`sync_runs_limit`** echo)
- **Documentation:** **`data-flows.md`**, **`roadmap.md`**, **`deployment-runbook.md`** aligned with the same Phase 2 non-claims

Week **25** did **not**:

- add validation engines, drift detection, safe-to-change scoring, or workflow authorization semantics
- add new collector truth domains or new persistence models for investigation assembly
- move Grafana to product ownership of investigation semantics (**app-api** remains the brain)
- duplicate change-intelligence aggregation math (week **24**) or readiness decision-support graphs (week **23**)
- imply approvals, execution, rollback, or unified forensic timelines across domains

## Scheduling default (evidence-first)

There is **still no automatic default implementation lane** after week **25**.

The **primary gate** remains an **evidence-gated reassessment** using:

- [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md)
- [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) (Post–Week **19** scheduling note)
- [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) (Post–Week **20** scheduling note)
- [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md)
- [`post-week-22-bounded-phase2-recommendation.md`](./post-week-22-bounded-phase2-recommendation.md)
- [`post-week-23-bounded-phase2-recommendation.md`](./post-week-23-bounded-phase2-recommendation.md)
- [`post-week-24-bounded-phase2-recommendation.md`](./post-week-24-bounded-phase2-recommendation.md)
- [`post-week-26-bounded-phase2-recommendation.md`](./post-week-26-bounded-phase2-recommendation.md)

**Meaning:** choose **at most one** narrow read-only slice only after **live lab or repository evidence** identifies a concrete, bounded gap. Prefer **small blast radius** and **clear operator value** inside Phase **2**. Investigation workspace is **not** the default next churn lane; evidence pack / situation room is **not** the default next churn lane.

## Narrow follow-ons that remain *plausible* when evidence appears

When a gap is proven—not assumed—these categories stay **architecture-aligned**:

1. **Documentation-only alignment** when drift appears between code, verifier, and operator docs.
2. **Further investigation-workspace UX or copy** only when a **specific** operator gap remains after week **25** (for example a documented confusion that does **not** require reopening the whole assembly contract). The **core** week **25** slice is **closed**; avoid cosmetic churn.
3. **Verifier or pytest tightening** for **existing** contracts (structural checks, honest skip/notice behavior)—not duplication of application logic in bash.
4. **Collector-first policy work** only inside the **proven** Nokia **`static_local`** envelope, and only when **new live evidence** in-repo justifies it—see policy review.

## Explicit anti-recommendations (do not default here)

- **Reopening week 25 themes by momentum:** investigation contract prose, **`GET /api/v1/investigation-workspace/context`** assembly fields, **`next_inspection_*`** behavior, Overview/Investigation entry and product layout, recency/context/next-inspection UI, **`pytest`** / **`vitest`** / **`verify-core-runtime`** investigation checks, or cross-doc investigation wording—**closed** unless **new evidence** shows a concrete bug or contract drift.
- **Reopening week 24 themes by momentum** (unchanged from [`post-week-24-bounded-phase2-recommendation.md`](./post-week-24-bounded-phase2-recommendation.md)): change-intelligence contract, **`recent-summary`**, Overview/Platform Health panels, product/history drilldowns, Workflow/Audit Overview links, change-intelligence tests/verifier, cross-doc change-intelligence wording.
- **Reopening week 23 themes by momentum** (unchanged from [`post-week-23-bounded-phase2-recommendation.md`](./post-week-23-bounded-phase2-recommendation.md)): decision-support contract, **`readiness-snapshot-history`**, Readiness URL parameters, Capabilities cross-links, capabilities verifier checks, cross-doc decision-support wording.
- **Reopening week 22 themes by momentum** (unchanged from [`post-week-22-bounded-phase2-recommendation.md`](./post-week-22-bounded-phase2-recommendation.md)): optional query parameters, **`read_side_query`** echo UX, workflow/audit query panels, history evidence drilldown, verifier echo checks.
- **Topology implementation** by momentum: pairing, partiality, coverage history, and doc/product alignment are **closed** as default lanes unless **new live evidence** shows a narrow gain beyond shipped cues ([`topology-truth-depth-review.md`](./topology-truth-depth-review.md)).
- **Policy family expansion** without **independent collector proof** ([`policy-truth-depth-review.md`](./policy-truth-depth-review.md)).
- **Workflow, dry-run, validation**, or treating Grafana as the product surface for readiness, history, change intelligence, investigation workspace, or validation.
- **Multi-vendor or Juniper parity** in product or observability claims.
- **Phase transition** or “production program” language that exceeds `conditionally_ready_with_explicit_limits` ([`production-readiness-assessment.md`](./production-readiness-assessment.md)).

## References

| Topic | Document |
| --- | --- |
| Current operational truth | [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) |
| Bounded slice scheduling | [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md) |
| Post–week 21 posture | [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md) |
| Post–week 22 posture | [`post-week-22-bounded-phase2-recommendation.md`](./post-week-22-bounded-phase2-recommendation.md) |
| Post–week 23 posture | [`post-week-23-bounded-phase2-recommendation.md`](./post-week-23-bounded-phase2-recommendation.md) |
| Post–week 24 posture (change intelligence closure) | [`post-week-24-bounded-phase2-recommendation.md`](./post-week-24-bounded-phase2-recommendation.md) |
| Post–week 25 posture (investigation workspace closure) | [`post-week-25-bounded-phase2-recommendation.md`](./post-week-25-bounded-phase2-recommendation.md) |
| Post–week 26 posture (evidence pack / situation room closure) | [`post-week-26-bounded-phase2-recommendation.md`](./post-week-26-bounded-phase2-recommendation.md) |
| Investigation workspace contract (shipped) | [`investigation-workspace-contract.md`](./investigation-workspace-contract.md) |
| Topology: what is closed vs deferred | [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) |
| Policy: proven vs deferred | [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) |
| Roadmap checkpoint narrative | [`roadmap.md`](./roadmap.md) |
