# Post–Week 21 bounded Phase 2 recommendation

## Purpose

This note records the **next disciplined scheduling posture** after week **21** so planning does not default to topology churn, policy-family expansion, workflow language, or vendor breadth without evidence.

It is a **recommendation and anti-drift guardrail** only.

It does **not** authorize:

- phase transition
- workflow implementation, dry-run APIs, or validation engines
- broader topology truth, policy truth, or multi-vendor parity than current reviews prove

## What week 21 actually closed

Week **21** delivered **bounded Phase 2 hygiene**: clearer topology partiality language and product trust cues, read-side cross-slice contract alignment (including `comparison_to_latest_persisted.status`), structural `verify-core-runtime` checks, vendor and collector-boundary observability honesty, ODL bounded-role operator copy, and cross-file documentation alignment.

Week **21** did **not**:

- deepen live collector policy proof beyond the existing **`static_local`** checkpoint
- add topology inference, pairing, or coverage algorithms
- add workflow-owned storage or new controller integration surfaces

Canonical detail: [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) (Week **21** closure) and completed tasks under `agent/sdn-tasks/completed/week-21-*.md`.

## Scheduling default (evidence-first)

There is **still no automatic default implementation lane** after week **21**.

The **primary gate** remains an **evidence-gated reassessment** using:

- [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md)
- [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) (Post–Week **19** scheduling note)
- [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) (Post–Week **20** scheduling note)

**Meaning:** choose **at most one** narrow read-only slice only after **live lab or repo evidence** identifies a concrete, bounded gap. Prefer slices with **small blast radius** and **clear operator value** inside Phase **2**.

## Narrow follow-ons that remain *plausible* when evidence appears

When a gap is proven—not assumed—these categories stay **architecture-aligned**:

1. **Documentation-only alignment** when drift appears between code, verifier, and operator docs.
2. **Small read-side ergonomics** (copy, layout, bounded query parameters) where existing APIs and Postgres rows already support the behavior—no new truth claims.
3. **Verifier or pytest tightening** for **existing** contracts (structural checks, honest skip/notice behavior)—not duplication of business logic in bash.
4. **Collector-first policy work** only inside the **proven** Nokia **`static_local`** envelope, and only when **new live evidence** in-repo justifies it—see policy review.

## Explicit anti-recommendations (do not default here)

- **Topology implementation** by momentum: pairing, partiality, coverage history, and week **21** doc/product alignment are **closed** as default lanes unless **new live evidence** shows a narrow gain beyond shipped cues ([`topology-truth-depth-review.md`](./topology-truth-depth-review.md)).
- **Policy family expansion** (`static_non_local`, BGP-signaled, broader per-target parity) without **independent collector proof** ([`policy-truth-depth-review.md`](./policy-truth-depth-review.md)).
- **Workflow, dry-run, validation**, or treating Grafana as the product surface for readiness/history/validation.
- **Multi-vendor or Juniper parity** in product or observability claims.
- **Phase transition** or “production program” language that exceeds `conditionally_ready_with_explicit_limits` ([`production-readiness-assessment.md`](./production-readiness-assessment.md)).

## References

| Topic | Document |
| --- | --- |
| Current operational truth | [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) |
| Bounded slice scheduling | [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md) |
| Topology: what is closed vs deferred | [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) |
| Policy: proven vs deferred | [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) |
| Roadmap checkpoint narrative | [`roadmap.md`](./roadmap.md) |
