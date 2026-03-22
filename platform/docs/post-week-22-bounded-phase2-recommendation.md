# Post–Week 22 bounded Phase 2 recommendation

## Purpose

This note records the **next disciplined scheduling posture** after week **22** so planning does not default to reopening the closed read-side query-ergonomics slice, history drilldown navigation, or verifier contract tests by momentum—or slide back into topology churn, policy-family expansion, or workflow language without evidence.

It is a **recommendation and anti-drift guardrail** only.

It does **not** authorize:

- phase transition
- workflow implementation, dry-run APIs, or validation engines
- broader topology truth, policy truth, or multi-vendor parity than current reviews prove
- treating optional URL query parameters or history drilldown as workflow progress

## Relationship to prior guidance

Week **21** posture remains in [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md). Week **22** **adds** explicit closure of the bounded **query ergonomics** and **read-only history navigation** workstreams; it does **not** replace ADR-0001 or the topology/policy reviews.

## What week 22 actually closed

Week **22** delivered **bounded Phase 2 read-side usability** (see [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) and completed tasks under `agent/sdn-tasks/completed/week-22-*.md`):

- **API contract:** optional **`limit`**, **`history_recent_limit`**, **`sync_runs_limit`**, **`readiness_snapshot_history_limit`** (audit) on the documented read routes, with honest **`read_side_query`** echo and **`422`** validation for out-of-range values
- **WebUI:** **`view`** plus the same bounded query names in the URL; read-side query panels; **`read_side_query`** echo copy on devices and policies; **read-only** drilldown from workflow-history and audit-history detail to related product surfaces via **`view=`**—not workflow execution
- **Regression:** repository **`pytest`** / **`vitest`** and structural **`verify-core-runtime.sh`** checks for optional bounded query strings on history endpoints
- **Documentation:** **`data-flows.md`**, **`roadmap.md`**, **`deployment-runbook.md`** aligned with the same boundaries

Week **22** did **not**:

- add search semantics, arbitrary filters, or new persistence domains
- deepen live collector proof beyond existing **`static_local`** policy posture
- change topology inference, pairing, or coverage algorithms
- add workflow-owned storage or new controller integration surfaces

## Scheduling default (evidence-first)

There is **still no automatic default implementation lane** after week **22**.

The **primary gate** remains an **evidence-gated reassessment** using:

- [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md)
- [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) (Post–Week **19** scheduling note)
- [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) (Post–Week **20** scheduling note)
- [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md) (week **21** anti-drift posture)

**Meaning:** choose **at most one** narrow read-only slice only after **live lab or repository evidence** identifies a concrete, bounded gap. Prefer **small blast radius** and **clear operator value** inside Phase **2**.

## Narrow follow-ons that remain *plausible* when evidence appears

When a gap is proven—not assumed—these categories stay **architecture-aligned**:

1. **Documentation-only alignment** when drift appears between code, verifier, and operator docs.
2. **Further read-side ergonomics** only when a **specific** operator gap remains after week **22** (for example copy clarity or a **documented** follow-on that does **not** reopen the whole query-parameter contract). The **core** bounded query and URL-sync slice is **closed**; avoid cosmetic churn.
3. **Verifier or pytest tightening** for **existing** contracts (structural checks, honest skip/notice behavior)—not duplication of application logic in bash.
4. **Collector-first policy work** only inside the **proven** Nokia **`static_local`** envelope, and only when **new live evidence** in-repo justifies it—see policy review.

## Explicit anti-recommendations (do not default here)

- **Reopening week 22 themes by momentum:** optional query parameters, **`read_side_query`** echo UX, workflow/audit URL query panels, history evidence drilldown, or verifier echo checks—**closed** unless **new evidence** shows a concrete bug or contract drift.
- **Topology implementation** by momentum (same as week **21**): pairing, partiality, coverage history, and doc/product alignment are **closed** as default lanes unless **new live evidence** shows a narrow gain beyond shipped cues ([`topology-truth-depth-review.md`](./topology-truth-depth-review.md)).
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
| Topology: what is closed vs deferred | [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) |
| Policy: proven vs deferred | [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) |
| Roadmap checkpoint narrative | [`roadmap.md`](./roadmap.md) |
