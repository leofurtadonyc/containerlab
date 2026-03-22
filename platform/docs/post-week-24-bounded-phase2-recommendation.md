# Post–Week 24 bounded Phase 2 recommendation

## Purpose

This note records the **next disciplined scheduling posture** after week **24** so planning does not default to reopening the closed **change-intelligence** slice—contract vocabulary, **`GET /api/v1/change-intelligence/recent-summary`** aggregation, Overview **`RecentChangeIntelligencePanel`** and Platform Health cues, **read-only** **`view=`** drilldowns between the aggregate summary and product/history surfaces, Workflow/Audit → Overview context links, repository **`pytest`** / **`vitest`** / structural **`verify-core-runtime`** **`recent-summary`** checks, or cross-doc alignment—by momentum.

It is a **recommendation and anti-drift guardrail** only.

It does **not** authorize:

- phase transition
- workflow implementation, dry-run APIs, or validation engines
- broader topology truth, policy truth, or multi-vendor parity than current reviews prove
- treating change-intelligence summaries as validation verdicts, drift results, safe-to-change recommendations, or workflow progress
- expanding change intelligence into new persistence domains, collectors, or scoring engines

## Relationship to prior guidance

Week **21** posture remains in [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md). Week **22** posture remains in [`post-week-22-bounded-phase2-recommendation.md`](./post-week-22-bounded-phase2-recommendation.md). Week **23** posture remains in [`post-week-23-bounded-phase2-recommendation.md`](./post-week-23-bounded-phase2-recommendation.md). Week **24** **adds** explicit closure of the bounded **change-intelligence** workstream (aggregation-and-interpretation over **existing** read-side evidence only); it does **not** replace ADR-0001 or the topology/policy reviews. Week **25** bounded **investigation workspace** closure is documented in [`post-week-25-bounded-phase2-recommendation.md`](./post-week-25-bounded-phase2-recommendation.md).

## What week 24 actually closed

Week **24** delivered **bounded Phase 2 cross-domain recent change intelligence** (see [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) **Week 24** closure and completed tasks under `agent/sdn-tasks/completed/week-24-*.md`):

- **Contract:** [`change-intelligence-contract.md`](./change-intelligence-contract.md) plus [`schemas/change_intelligence.py`](../app-api/src/app_api/schemas/change_intelligence.py) — stable vocabulary, safety framing, **`change_intelligence_phase2_v1`**
- **API:** **`GET /api/v1/change-intelligence/recent-summary`** with bounded **`sync_runs_limit`** (default **20**, max **100**) — aggregates existing snapshot table metrics, **`load_sync_runs`**, readiness snapshot recency context; **not** `read_side_query` on this route
- **WebUI:** Overview **`RecentChangeIntelligencePanel`**; Platform Health supporting card + trust cue; **read-only** navigation to Devices, Topology, Policies, Workflow history, Audit history; Workflow/Audit **`ChangeIntelligenceOverviewLink`** to Overview — lists **not** filtered by the summary window
- **Regression:** repository **`pytest`** / **`vitest`** (including panel isolation and domain-order / explicit-non-claims pins) and structural **`verify-core-runtime.sh`** substring checks on live **`recent-summary`** JSON
- **Documentation:** **`data-flows.md`**, **`roadmap.md`**, **`deployment-runbook.md`** aligned with the same Phase 2 non-claims

Week **24** did **not**:

- add validation engines, drift detection, safe-to-change scoring, or workflow authorization semantics
- add new collector truth domains or new persistence models for change intelligence
- move Grafana to product ownership of change-intelligence semantics (**app-api** remains the brain)
- change per-domain snapshot comparison math (weeks **19–20**) or readiness decision-support contract semantics (week **23**)
- imply approvals, execution, rollback, or SOC-grade audit completeness

## Scheduling default (evidence-first)

There is **still no automatic default implementation lane** after week **24**.

The **primary gate** remains an **evidence-gated reassessment** using:

- [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md)
- [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) (Post–Week **19** scheduling note)
- [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) (Post–Week **20** scheduling note)
- [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md) (week **21** anti-drift posture)
- [`post-week-22-bounded-phase2-recommendation.md`](./post-week-22-bounded-phase2-recommendation.md) (week **22** query ergonomics and history drilldown closure)
- [`post-week-23-bounded-phase2-recommendation.md`](./post-week-23-bounded-phase2-recommendation.md) (week **23** readiness/capability decision-support closure)

**Meaning:** choose **at most one** narrow read-only slice only after **live lab or repository evidence** identifies a concrete, bounded gap. Prefer **small blast radius** and **clear operator value** inside Phase **2**. Change intelligence is **not** the default next churn lane.

## Narrow follow-ons that remain *plausible* when evidence appears

When a gap is proven—not assumed—these categories stay **architecture-aligned**:

1. **Documentation-only alignment** when drift appears between code, verifier, and operator docs.
2. **Further change-intelligence UX or copy** only when a **specific** operator gap remains after week **24** (for example a documented confusion that does **not** require reopening the whole contract or aggregation story). The **core** week **24** slice is **closed**; avoid cosmetic churn.
3. **Verifier or pytest tightening** for **existing** contracts (structural checks, honest skip/notice behavior)—not duplication of application logic in bash.
4. **Collector-first policy work** only inside the **proven** Nokia **`static_local`** envelope, and only when **new live evidence** in-repo justifies it—see policy review.

## Explicit anti-recommendations (do not default here)

- **Reopening week 24 themes by momentum:** change-intelligence contract prose, **`recent-summary`** aggregation fields, Overview/Platform Health panels, product/history drilldown buttons, Workflow/Audit Overview links, **`pytest`** / **`vitest`** / **`verify-core-runtime`** change-intelligence checks, or cross-doc change-intelligence wording—**closed** unless **new evidence** shows a concrete bug or contract drift.
- **Reopening week 23 themes by momentum** (unchanged from [`post-week-23-bounded-phase2-recommendation.md`](./post-week-23-bounded-phase2-recommendation.md)): decision-support contract, **`readiness-snapshot-history`**, Readiness URL parameters, Capabilities cross-links, capabilities verifier checks, or cross-doc decision-support wording.
- **Reopening week 22 themes by momentum** (unchanged from [`post-week-22-bounded-phase2-recommendation.md`](./post-week-22-bounded-phase2-recommendation.md)): optional query parameters, **`read_side_query`** echo UX, workflow/audit query panels, history evidence drilldown, verifier echo checks.
- **Topology implementation** by momentum: pairing, partiality, coverage history, and doc/product alignment are **closed** as default lanes unless **new live evidence** shows a narrow gain beyond shipped cues ([`topology-truth-depth-review.md`](./topology-truth-depth-review.md)).
- **Policy family expansion** without **independent collector proof** ([`policy-truth-depth-review.md`](./policy-truth-depth-review.md)).
- **Workflow, dry-run, validation**, or treating Grafana as the product surface for readiness, history, change intelligence, or validation.
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
| Post–week 25 posture (investigation workspace closure) | [`post-week-25-bounded-phase2-recommendation.md`](./post-week-25-bounded-phase2-recommendation.md) |
| Change-intelligence contract (shipped) | [`change-intelligence-contract.md`](./change-intelligence-contract.md) |
| Topology: what is closed vs deferred | [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) |
| Policy: proven vs deferred | [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) |
| Roadmap checkpoint narrative | [`roadmap.md`](./roadmap.md) |
