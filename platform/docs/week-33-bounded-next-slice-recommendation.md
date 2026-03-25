# Week 33 bounded next-slice recommendation

## Purpose

This note gives **one** explicit, phase-safe recommendation for the **next** narrow bounded slice after **Week 33** integrity work (verifier parity, archive, reassessment memo). It **does not** replace [`week-33-evidence-backed-reassessment-memo.md`](./week-33-evidence-backed-reassessment-memo.md) (categories and evidence gates) or [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md) (historical decision pattern).

**Phase:** [`Phase 2 — read-only product foundation`](../../agent/sdn/01-CURRENT-PHASE.md) — unchanged.

## Recommended next slice (single choice)

**Operator contract labeling and bounded copy alignment** — **no new product semantics**, **no new `GET` assemblies**.

Tighten **operator-visible** and **runbook-facing** language so the five closed surfaces below are **harder to confuse**, without reopening week **30–32** implementation themes:

| Confusion to reduce | Contracts to honor (read-only, explicit non-claims) |
| --- | --- |
| **Service Dossier** vs **Service Explorer** | [`service-dossier-contract.md`](./service-dossier-contract.md), [`service-explorer-contract.md`](./service-explorer-contract.md) |
| **Change Safety Case** vs **Impact Report** vs **Evidence export** | [`change-safety-case-contract.md`](./change-safety-case-contract.md), [`impact-report-contract.md`](./impact-report-contract.md), [`evidence-export-contract.md`](./evidence-export-contract.md), [`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md) |

**Typical touchpoints (examples, not an exhaustive backlog):** app-web labels, tooltips, section intros, shell nav affordances where wording implies authority; [`deployment-runbook.md`](./deployment-runbook.md) and [`data-flows.md`](./data-flows.md) “what this is / is not” callouts; short cross-links from [`production-readiness-assessment.md`](./production-readiness-assessment.md) only if the same bounded story needs alignment.

## Why this slice (and not reopening week 30–32 product semantics)

- **Week 30–32** already delivered **large composed workspaces** (delta digest, briefing, evidence replay, Service Explorer, Impact Report, Maintenance Preview, Service Dossier, Change Safety Case, cockpit/search integration). Those are **closed** under [`post-week-30-bounded-phase2-recommendation.md`](./post-week-30-bounded-phase2-recommendation.md) through [`post-week-32-bounded-phase2-recommendation.md`](./post-week-32-bounded-phase2-recommendation.md). “Polishing” or extending those **assemblies** without **new evidence** of contract drift or a **proven** bug is **momentum**, not evidence-first scheduling.
- **Labeling** improves **honest use** of what already shipped: it **reinforces** non-claims and boundaries instead of adding new read-side truth domains or collector work.
- **Blast radius** stays small: copy and docs, optional stable **`vitest`** string checks—**not** Postgres schema, collector mappings, or topology inference.

## Required safeguards

1. **No** new API routes, **no** response-shape changes, **no** workflow/dry-run/validation semantics.
2. Every substantive copy change **traces** to a clause in the relevant contract; **no** wording that implies safe-to-change, approval, simulation, or substitute for live **`GET`** / frozen **`evidence_export_v1`** when those contracts matter.
3. **Grafana** remains observability-only; **no** Grafana-owned product semantics for these surfaces ([`dashboards.md`](./dashboards.md)).
4. **Verifier** (`verify-core-runtime.sh`) changes only when **necessary** for copy-driven test anchors—**not** new business logic in shell ([`week-32-verifier-parity-contract.md`](./week-32-verifier-parity-contract.md) discipline).

## Exit criteria (done means)

- [ ] A short **checklist** (in the implementing PR or follow-on task note) lists touched routes/pages/docs and the contract clause each supports.
- [ ] **Peer review:** no line weakens **Phase 2** non-claims or implies phase transition.
- [ ] **`conditionally_ready_with_explicit_limits`** unchanged unless a **deliberate**, scoped refresh of [`production-readiness-assessment.md`](./production-readiness-assessment.md) is part of the same slice (default: **unchanged**).
- [ ] **Repository tests:** extend **`vitest`** / docs only as needed; **no** new collector or topology pairing work.

## Conditional alternative (pick one per cycle)

If **live lab evidence** shows operator confusion is primarily about **topology partiality** (inference vs collection degradation) rather than dossier/report/export boundaries, the **single** slice may instead be **documentation-first** alignment with [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) and existing schema notes—**still no** default reopen of week **14** pairing implementation. **Do not** run both this alternative and the **labeling** slice as parallel “defaults”; choose **one** narrow theme per bounded cycle.

## References

| Topic | Document |
| --- | --- |
| Week 33 category scan | [`week-33-evidence-backed-reassessment-memo.md`](./week-33-evidence-backed-reassessment-memo.md) |
| Anti-reopen posture | [`post-week-32-bounded-phase2-recommendation.md`](./post-week-32-bounded-phase2-recommendation.md) |
| Operational truth | [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) |
