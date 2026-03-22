# Post–Week 23 bounded Phase 2 recommendation

## Purpose

This note records the **next disciplined scheduling posture** after week **23** so planning does not default to reopening the closed **readiness/capability decision-support** slice—contract linking, **`readiness-snapshot-history`** inspection, shareable Readiness URL parameters, Capabilities and entry-surface cues, workflow/audit drilldown to Readiness, **`pytest`** / **`vitest`** / structural **`verify-core-runtime`** capabilities checks, or cross-doc alignment—by momentum.

It is a **recommendation and anti-drift guardrail** only.

It does **not** authorize:

- phase transition
- workflow implementation, dry-run APIs, or validation engines
- broader topology truth, policy truth, or multi-vendor parity than current reviews prove
- treating readiness navigation, blocker/prerequisite drilldowns, or capabilities cross-link JSON as workflow progress or dry-run readiness

## Relationship to prior guidance

Week **21** posture remains in [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md). Week **22** posture remains in [`post-week-22-bounded-phase2-recommendation.md`](./post-week-22-bounded-phase2-recommendation.md). Week **23** **adds** explicit closure of the bounded **readiness/capability decision-support** workstream (interpretation and navigation only); it does **not** replace ADR-0001 or the topology/policy reviews.

## What week 23 actually closed

Week **23** delivered **bounded Phase 2 planning-support usability** (see [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) **Week 23** closure and completed tasks under `agent/sdn-tasks/completed/week-23-*.md`):

- **Contract:** [`readiness-capability-decision-support-contract.md`](./readiness-capability-decision-support-contract.md) plus backend-owned linking (`PrerequisiteName`, blocker **`related_prerequisites`**, capability **`related_readiness_blockers`**)—interpretation-only
- **API:** **`GET /api/v1/readiness-snapshot-history`** with bounded **`limit`**, optional **`blocker`**, **`include_blockers_detail`**, honest **`read_side_query`** echo—inspection of persisted snapshots, not workflow execution
- **WebUI:** **`readiness_blocker`**, **`readiness_prerequisite`**, **`readiness_capability_feature`** on **`view=`**; Capabilities ↔ Readiness; Readiness drilldowns; Overview / Platform Health summary lines; **`HistoryEvidenceDrilldown`** to Readiness when artifacts exist—read-only navigation
- **Regression:** repository **`pytest`** / **`vitest`** and structural **`verify-core-runtime.sh`** substring checks for capabilities decision-support JSON fields
- **Documentation:** **`data-flows.md`**, **`roadmap.md`**, **`deployment-runbook.md`** aligned with the same Phase 2 non-claims

Week **23** did **not**:

- add workflow-owned storage, dry-run APIs, or validation-result models
- change readiness semantics from planning-support to execution or authorization
- deepen live collector proof beyond existing Nokia **`static_local`** policy posture
- change topology inference, pairing, or coverage algorithms
- add arbitrary new query domains beyond the bounded parameters already documented

## Scheduling default (evidence-first)

There is **still no automatic default implementation lane** after week **23**.

The **primary gate** remains an **evidence-gated reassessment** using:

- [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md)
- [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) (Post–Week **19** scheduling note)
- [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) (Post–Week **20** scheduling note)
- [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md) (week **21** anti-drift posture)
- [`post-week-22-bounded-phase2-recommendation.md`](./post-week-22-bounded-phase2-recommendation.md) (week **22** query ergonomics and history drilldown closure)

**Meaning:** choose **at most one** narrow read-only slice only after **live lab or repository evidence** identifies a concrete, bounded gap. Prefer **small blast radius** and **clear operator value** inside Phase **2**.

## Narrow follow-ons that remain *plausible* when evidence appears

When a gap is proven—not assumed—these categories stay **architecture-aligned**:

1. **Documentation-only alignment** when drift appears between code, verifier, and operator docs.
2. **Further readiness/capability UX or copy** only when a **specific** operator gap remains after week **23** (for example a documented confusion that does **not** require reopening the whole decision-support contract). The **core** week **23** slice is **closed**; avoid cosmetic churn.
3. **Verifier or pytest tightening** for **existing** contracts (structural checks, honest skip/notice behavior)—not duplication of application logic in bash.
4. **Collector-first policy work** only inside the **proven** Nokia **`static_local`** envelope, and only when **new live evidence** in-repo justifies it—see policy review.

## Explicit anti-recommendations (do not default here)

- **Reopening week 23 themes by momentum:** decision-support contract prose, capability↔blocker↔prerequisite linking fields, **`readiness-snapshot-history`** optional filters, Readiness URL parameters, Capabilities/Readiness/Overview/Platform Health/history drilldown navigation, capabilities **`related_*`** verifier checks, or cross-doc decision-support wording—**closed** unless **new evidence** shows a concrete bug or contract drift.
- **Reopening week 22 themes by momentum** (unchanged from [`post-week-22-bounded-phase2-recommendation.md`](./post-week-22-bounded-phase2-recommendation.md)): optional query parameters, **`read_side_query`** echo UX, workflow/audit query panels, history evidence drilldown, verifier echo checks.
- **Topology implementation** by momentum: pairing, partiality, coverage history, and doc/product alignment are **closed** as default lanes unless **new live evidence** shows a narrow gain beyond shipped cues ([`topology-truth-depth-review.md`](./topology-truth-depth-review.md)).
- **Policy family expansion** without **independent collector proof** ([`policy-truth-depth-review.md`](./policy-truth-depth-review.md)).
- **Workflow, dry-run, validation**, or treating Grafana as the product surface for readiness/history/validation.
- **Multi-vendor or Juniper parity** in product or observability claims.
- **Phase transition** or “production program” language that exceeds `conditionally_ready_with_explicit_limits` ([`production-readiness-assessment.md`](./production-readiness-assessment.md)).

## References

| Topic | Document |
| --- | --- |
| Current operational truth | [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) |
| Bounded slice scheduling | [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md) |
| Post–week 21 posture | [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md) |
| Post–week 22 posture | [`post-week-22-bounded-phase2-recommendation.md`](./post-week-22-bounded-phase2-recommendation.md) |
| Decision-support contract (shipped) | [`readiness-capability-decision-support-contract.md`](./readiness-capability-decision-support-contract.md) |
| Topology: what is closed vs deferred | [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) |
| Policy: proven vs deferred | [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) |
| Roadmap checkpoint narrative | [`roadmap.md`](./roadmap.md) |
