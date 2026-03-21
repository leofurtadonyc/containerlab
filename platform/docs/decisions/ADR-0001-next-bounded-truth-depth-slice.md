# ADR-0001: Next bounded truth-depth slice (week 19 default)

| Field | Value |
| --- | --- |
| **Status** | Accepted (scheduling) |
| **Date** | 2026-03-19 |
| **Phase** | `Phase 2 — read-only product foundation` |
| **Supersedes** | Informal draft [`DRAFT-next-truth-depth-week18.md`](./DRAFT-next-truth-depth-week18.md) (now redirect-only) |

## Context

Week 16–18 closed history honesty, verifier alignment, readiness language, and observability scaffolding without changing the production-readiness verdict (`conditionally_ready_with_explicit_limits`; see [`production-readiness-assessment.md`](../production-readiness-assessment.md)). The project needs **one** evidence-based default for the **next** narrow Phase 2 slice so week 19 planning does not thrash in parallel across policy, topology, and persistence themes.

Identity and capability **item-ID** follow-ons remain **conditional** — only if a concrete citation-grade consumer appears. This ADR does **not** reopen that lane.

## Decision drivers

| Driver | Meaning |
| --- | --- |
| Production value (bounded read-only) | Improves routine operator usefulness without implying workflow, dry-run, or full-truth claims |
| Live Nokia-first evidence | Work must cite honest lab proof or honest absence; no speculative multi-vendor or unproven policy shapes |
| Blast radius | Prefer slices that do not force large cross-cutting contract churn without proportional gain |
| Contract / product impact | Favors areas where Postgres and APIs already hold honest rows and tests can tighten incrementally |
| Overclaim risk | Reject paths that generalize policy or topology semantics ahead of collector proof |
| Dependency ordering | Does not reopen completed week 16–18 pairing, history gates, readiness language, or Grafana scaffolds without new evidence |

## Options considered

### Option A — Topology truth-depth (further implementation)

**Idea:** Sharpen how partial topology is explained (e.g. decomposing coarse `completeness=partial` / `degraded_scope_summary` into clearer cause families).

**Assessment:** Pairing, partiality decomposition, node participation, and coverage **history** are already implemented end to end. The topology review’s honest “next step” for the remaining gap is **documentation-first**: a contract separating inference limits from collection degradation — **not** another default pairing implementation slice.

**Outcome:** **Rejected** as the **primary** week 19 implementation slice. Optional **small** doc-only partiality contract note may precede any *future* topology code slice; topology code that re-implements pairing or broad partiality taxonomy stays **deferred** until that contract exists.

### Option B — Policy truth-depth (new detail families)

**Idea:** Extend normalized policy toward `static_non_local`, BGP-signaled SR policy, or broader per-target coverage beyond the current lab.

**Assessment:** [`policy-truth-depth-review.md`](../policy-truth-depth-review.md) documents proof only for Nokia **`static_local`** on the current path. **`static_non_local`** and **BGP-signaled** normalized detail are **not proven** at the checkpoint. Work must stay collector-first.

**Outcome:** **Deferred** as default until the collector path **independently proves** additional detail-ready shapes with repeatable snapshot/metrics evidence in-repo. A bounded **`static_local`**-only deepening remains *secondary* if tied to additional proven source detail — **not** the scheduling default ahead of Option C.

### Option C — Persistence-backed history deepening (inventory / devices)

**Idea:** Improve read-side **ergonomics and honesty** where Postgres already stores inventory snapshots and the API already exposes history: clearer list/drill patterns, bounded query parameters where justified, product copy and contracts aligned with `verify-core-runtime` — without inventing new policy types or topology inference.

**Assessment:** Devices/inventory history is already aligned with topology and policy history gates in the verifier and runbook; further work **consumes existing persisted rows** rather than requiring new collector policy proofs or adjacency proofs. Blast radius stays comparatively contained to inventory history surfaces, tests, and docs.

**Outcome:** **Accepted** as the **primary** recommended default for week 19.

## Decision

The **default next bounded truth-depth slice** is **Option C — persistence-backed inventory/devices history deepening** (API + product + tests + docs; verifier updates **only** as contracts change), strictly read-only, **no** new workflow-owned anchors.

**Optional parallel (non-replacement):** a short **topology partiality contract** note (documentation-only) per [`topology-truth-depth-review.md`](../topology-truth-depth-review.md) — does **not** replace Option C unless the team explicitly prioritizes docs.

## Consequences

### Positive

- Week 19 scheduling has a **single** primary theme aligned with “reassessment after history work” without reopening pairing semantics or unproven policy families.
- Operators gain clearer read-side behavior where data **already exists** in Postgres.

### Negative / bounded

- Option C does **not** by itself deepen policy or topology truth; those remain gated by their respective reviews and live evidence.
- Any API shape change implies coordinated runbook and verifier wording — scope must stay narrow.

## Non-goals

- Workflow implementation, dry-run APIs, validation outputs, phase transition
- Reopening completed week 16–18 verifier/history/readiness/Grafana work without new evidence
- Broad backlog or multi-quarter roadmap inside this ADR
- Capability item-ID or workflow-owned anchor design

## Week 19 scheduling implications

1. **Primary:** Execute Option C under evidence gates below.
2. **Optional doc:** Topology partiality contract note if needed to unblock *future* topology code (does not replace primary slice).
3. **Defer:** Option B expansion until live collector evidence proves new shapes.
4. **Defer:** Option A topology **code** until doc-first partiality contract exists where applicable.

## Evidence gates (before merging implementation)

- [ ] No new policy truth claims beyond what [`policy-truth-depth-review.md`](../policy-truth-depth-review.md) proves; if touching policy history, stay inside **`static_local`** unless new live evidence is documented in-repo.
- [ ] No reopening of completed topology pairing / week-14 semantics without a new review; topology changes remain inference-bounded and non-validation.
- [ ] `verify-core-runtime` and runbook stay consistent with any new inventory/devices history branches.
- [ ] `conditionally_ready_with_explicit_limits` and explicit non-claims preserved in [`production-readiness-assessment.md`](../production-readiness-assessment.md) unless a deliberate doc refresh is part of the slice.

## References

| Topic | Document |
| --- | --- |
| Policy: proven vs not proven | [`policy-truth-depth-review.md`](../policy-truth-depth-review.md) |
| Topology: pairing; what remains | [`topology-truth-depth-review.md`](../topology-truth-depth-review.md) |
| Operating boundary | [`production-readiness-assessment.md`](../production-readiness-assessment.md) |
| Roadmap / checkpoint | [`roadmap.md`](../roadmap.md) |
