# Decision (draft): Next bounded truth-depth slice after week 18

**Status:** draft — scheduling input for week 19  
**Phase:** `Phase 2 — read-only product foundation`  
**Scope:** Phase 2 only; no workflow, dry-run, or phase-transition claims.

## Context

Week 16–18 closed history honesty, verifier alignment, readiness language, and observability scaffolding without changing the production-readiness verdict (`conditionally_ready_with_explicit_limits`; see [`production-readiness-assessment.md`](../production-readiness-assessment.md)). Identity and capability item-ID follow-ons remain **conditional** — only if a concrete citation-grade consumer appears; this decision does not reopen that lane.

This note compares three **in-scope** candidates and picks **one** recommended default for the next bounded cycle (or states explicit deferral).

## Evidence anchors (read first)

| Topic | Document |
| --- | --- |
| Policy: proven vs not proven shapes, prerequisites | [`policy-truth-depth-review.md`](../policy-truth-depth-review.md) |
| Topology: pairing complete; what remains | [`topology-truth-depth-review.md`](../topology-truth-depth-review.md) |
| Operating boundary | [`production-readiness-assessment.md`](../production-readiness-assessment.md) |

## Option A — Topology truth-depth (implementation)

**Idea:** Further code changes to sharpen how partial topology is explained (e.g. decomposing coarse `completeness=partial` / `degraded_scope_summary` into clearer cause families).

**Live-evidence fit:** Pairing, partiality decomposition, node participation, and coverage **history** are already implemented end to end. The topology review’s explicit “next honest step” for the remaining gap is **documentation-first**: a contract that states how a *later* bounded code follow-on would separate inference limits from collection degradation — **not** another pairing implementation slice.

**Verdict:** **Not** the default week-19 **implementation** slice. Schedule a **small doc-first** partiality note only if the team wants to unblock a *future* topology code slice; do not treat topology as the default churn vector while that contract is missing.

## Option B — Policy truth-depth (new detail families)

**Idea:** Extend normalized policy truth toward `static_non_local`, BGP-signaled SR policy, or broader per-target coverage beyond the current lab.

**Live-evidence fit:** The policy review is explicit: live proof exists only for Nokia **`static_local`** on the current path (four detail-ready PE targets, four normalized live records). **`static_non_local`** and **BGP-signaled** normalized detail are **not proven** by the current checkpoint. Work must stay collector-first and must not generalize ahead of source evidence.

**Verdict:** **Defer as default** until the collector path **independently proves** additional detail-ready source shapes on the live lab (repeatable snapshot/metrics evidence). A bounded **`static_local`**-only deepening remains valid *if* tied to **additional proven source detail** from the existing path — but that is secondary to Option C for scheduling clarity unless new lab evidence appears first.

## Option C — Persistence-backed history deepening (inventory / devices)

**Idea:** Improve read-side **ergonomics and honesty** where Postgres already stores inventory snapshots and the API already exposes history: clearer list/drill patterns, pagination or bounded query parameters, product copy and contracts that stay aligned with `verify-core-runtime` — without inventing new policy types or topology inference.

**Live-evidence fit:** Devices/inventory history is already aligned with topology and policy history gates in the verifier and runbook; further work **consumes existing persisted rows** rather than requiring new collector policy or adjacency proofs.

**Verdict:** **Recommended default for week 19** — lowest thrash between themes, aligns with “reassessment after history work” without reopening completed pairing semantics or unproven policy families.

## Recommendation

1. **Default (week 19):** **Option C** — bounded **persistence-backed inventory/devices history deepening** (API + product + tests + docs + verifier only as contracts change), strictly read-only, no new workflow anchors.
2. **Parallel (optional, small):** A **short topology partiality contract** note (per topology review) as documentation-only — **does not** replace the default implementation slice above unless the team explicitly prioritizes docs.
3. **Explicit deferral:** **Option B** expansion into `static_non_local` or BGP-signaled normalized records — **until** live collector/backend evidence proves those shapes under the same rigor as `static_local`.
4. **Explicit deferral:** **Option A** topology **code** that re-implements pairing or broad partiality taxonomy — **until** the doc-first partiality contract exists; pairing consumption work stays closed.

## Week 19 evidence gates (checklist)

Use before merging implementation:

- [ ] No new policy truth claims beyond what [`policy-truth-depth-review.md`](../policy-truth-depth-review.md) already proves; if touching policy history, stay inside **`static_local`** unless new live evidence is documented in-repo.
- [ ] No reopening of completed topology pairing / week-14 semantics without a new review; topology changes remain inference-bounded and non-validation.
- [ ] `verify-core-runtime` and runbook stay consistent with any new inventory/devices history branches.
- [ ] `conditionally_ready_with_explicit_limits` and explicit non-claims preserved in [`production-readiness-assessment.md`](../production-readiness-assessment.md) unless a deliberate doc refresh is part of the slice.

## Identity and capability

No change to the “conditional identity follow-on only if a consumer appears” posture; this decision does not justify capability item-ID or workflow-owned anchor work.
