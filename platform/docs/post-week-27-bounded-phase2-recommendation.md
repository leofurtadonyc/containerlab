# Post–Week 27 bounded Phase 2 recommendation

## Purpose

This note records the **next disciplined scheduling posture** after week **27** so planning does not default to reopening the closed **path-analysis**, **topology↔policy naming pivots**, **degraded-policy v1**, **investigation shell context**, or **verify-core-runtime** week **27** structural checks—by momentum.

Week **27** delivered **interpretation and navigation** on top of **existing** normalized policy and topology fields:

- **Contracts / APIs:** **`path_analysis_phase2_v1`** ([`path-analysis-contract.md`](./path-analysis-contract.md), [`ADR-0002`](./decisions/ADR-0002-path-analysis-phase2-read-only-contract.md)); **`GET /api/v1/policies/{policy_id}/path-analysis`**; **`GET /api/v1/topology/objects/{object_id}/related-policies`** and **`GET /api/v1/policies/{policy_id}/topology-impact`** ([`topology-related-policies-contract.md`](./topology-related-policies-contract.md)); **`degraded_policy_v1`** on each policy record ([`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md))
- **WebUI:** **Policies** — Path analysis, Topology impact, degraded filter/detail; **Topology** / **Devices** — related policies panel; **Overview** / **Platform Health** — degraded-policy counts; **Investigation** — optional **`inv_from`** breadcrumbs and surface entry buttons
- **Verifier:** **`verify-core-runtime.sh`** samples first policy id and first topology node id (when **`python3`** and non-empty lists) and asserts structural substrings on path-analysis and related-policies plus **`degraded_policy_v1`** contract id on items
- **Docs:** [`architecture.md`](./architecture.md), [`data-flows.md`](./data-flows.md), [`services.md`](./services.md), [`dashboards.md`](./dashboards.md), [`roadmap.md`](./roadmap.md), [`README.md`](../README.md) aligned on non-claims

It is a **recommendation and anti-drift guardrail** only.

It does **not** authorize:

- phase transition
- workflow implementation, dry-run APIs, or validation engines
- treating path-analysis as dataplane forwarding truth, TE resolution, or controller-computed path authority
- treating topology↔policy pivots as operational dependency, blast-radius, or failure-impact simulation
- treating **degraded_policy_v1** as SLA, availability guarantee, or validation verdict
- broader topology or policy **truth** than [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) and [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) justify
- Grafana-owned semantics for path-analysis, pivots, or degraded classification (see [`dashboards.md`](./dashboards.md))

## Relationship to prior guidance

Week **21** posture remains in [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md). Week **22**–**26** post notes remain in [`post-week-22-bounded-phase2-recommendation.md`](./post-week-22-bounded-phase2-recommendation.md) through [`post-week-26-bounded-phase2-recommendation.md`](./post-week-26-bounded-phase2-recommendation.md). Week **27** **adds** explicit closure of the bounded **path / naming-pivot / degraded-policy v1 / investigation URL context / verifier** workstream; it does **not** replace ADR-0001, topology or policy truth-depth reviews, or weeks **22–26** closures. Week **28** bounded **failure-impact / topology risk summary / policy evidence timeline+delta / operator-workspace / investigation shell hints / verifier** closure is recorded in [`post-week-28-bounded-phase2-recommendation.md`](./post-week-28-bounded-phase2-recommendation.md).

## What week 27 actually closed

Week **27** is **closed** as bounded Phase **2** read-side interpretation and drill-through (see [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) **Week 27** closure and `agent/sdn-tasks/completed/week-27-*.md`).

Week **27** did **not**:

- prove new collector or persistence domains for path computation
- add workflow, approval, rollback, or safe-change authority
- change the default verdict [`conditionally_ready_with_explicit_limits`](./production-readiness-assessment.md)
- subsume change intelligence (week **24**), investigation workspace (week **25**), or evidence pack (week **26**) as separate product brains—those assemblies remain **downstream** of the same read-side contracts

## Scheduling default (evidence-first)

There is **still no automatic default implementation lane** after week **27**.

The **primary gate** remains an **evidence-gated reassessment** using:

- [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md)
- [`topology-truth-depth-review.md`](./topology-truth-depth-review.md)
- [`policy-truth-depth-review.md`](./policy-truth-depth-review.md)
- [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md) through [`post-week-26-bounded-phase2-recommendation.md`](./post-week-26-bounded-phase2-recommendation.md)

**Meaning:** choose **at most one** narrow read-only slice only after **live lab or repository evidence** identifies a concrete, bounded gap. Path-analysis and naming pivots are **not** the default churn lane—they are **closed** unless new evidence shows contract drift or a real operator bug.

## Next direction: path explainability vs “impact” vs control-plane prep

Use week **27** evidence to choose **one** of these **only when justified**—not all three, and not by default:

1. **Deeper path explainability (Phase 2–safe):** improve **operator comprehension** of the **existing** path-analysis contract—copy, empty/partial states, caveat visibility, or cross-links to policies/topology—**without** new “truth” fields that imply dataplane or TE authority. Appropriate when **specific** confusion is documented (supportability, UX study, or repeated misread of explicit non-claims).

2. **Richer “impact” surfaces (honest scope):** the product **does not** simulate impact. The only honest expansion is **clearer presentation** of **relationship_kind**, **matched_field**, and caveats already in [`topology-related-policies-contract.md`](./topology-related-policies-contract.md)—still **string equality**, not graph analytics. Do **not** relabel pivots as “impact analysis” in a way that implies dependency or blast-radius.

3. **Narrow Phase 2–safe preparation for future validated control:** **not** write paths, **not** dry-run execution in this recommendation. Preparation means **documentation and gating clarity** (readiness blockers, capability posture, ADR alignment)—**not** sneaking control-plane automation into Phase **2**.

If **no** new evidence appears, the default next step is **not** a new feature slice: run the **ADR-0001 / topology / policy** reassessment cycle and keep the stack on **rebuild → redeploy → verify** ([`deployment-runbook.md`](./deployment-runbook.md)).

## Narrow follow-ons that remain *plausible* when evidence appears

1. **Documentation-only alignment** when code, verifier, and operator docs drift.
2. **Structural verifier or pytest tightening** for **existing** week **27** endpoints (honest skip/notice behavior)—**not** duplicating assembly logic in shell.
3. **One** bounded UX fix on **Policies** / **Topology** / **Devices** if a **proven** navigation or labeling bug remains after week **27** (for example related-policies empty state copy)—**not** reopening API contracts by default.
4. **Collector-first policy or topology truth-depth** only when [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) or [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) plus **live lab evidence** justify a narrow follow-on—unchanged default from prior post notes.

## Explicit anti-recommendations (do not default here)

- **Reopening week 27 themes by momentum:** **`path-analysis-contract.md`**, **`path_analysis_phase2_v1`**, **`GET /api/v1/policies/{policy_id}/path-analysis`**, **`PolicyPathAnalysisPanel`**, **`topology-related-policies-contract.md`**, **`GET /api/v1/topology/objects/{object_id}/related-policies`**, **`GET /api/v1/policies/{policy_id}/topology-impact`**, **`TopologyRelatedPoliciesPanel`**, **`PolicyTopologyImpactPanel`**, **`degraded_policy_v1`** assembly and Policies/Overview/Platform Health surfaces, **`inv_from`** / investigation breadcrumbs, **`verify-core-runtime.sh`** week **27** sampling, or cross-doc week **27** wording—**closed** unless **new evidence** shows a concrete bug or contract drift.
- **Reopening weeks 22–26 by momentum** (unchanged from prior post notes): see [`post-week-22-bounded-phase2-recommendation.md`](./post-week-22-bounded-phase2-recommendation.md) through [`post-week-26-bounded-phase2-recommendation.md`](./post-week-26-bounded-phase2-recommendation.md).
- **Topology or policy implementation** by momentum beyond current reviews ([`topology-truth-depth-review.md`](./topology-truth-depth-review.md), [`policy-truth-depth-review.md`](./policy-truth-depth-review.md)).
- **Workflow, dry-run, validation**, or treating Grafana as the product surface for path-analysis, pivots, or degraded-policy semantics.
- **Multi-vendor or Juniper parity** claims.
- **Phase transition** language that exceeds `conditionally_ready_with_explicit_limits`.

## References

| Topic | Document |
| --- | --- |
| Current operational truth | [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) |
| Bounded slice scheduling | [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md) |
| Post–week 26 posture | [`post-week-26-bounded-phase2-recommendation.md`](./post-week-26-bounded-phase2-recommendation.md) |
| Path analysis contract | [`path-analysis-contract.md`](./path-analysis-contract.md) |
| Topology↔policy pivots | [`topology-related-policies-contract.md`](./topology-related-policies-contract.md) |
| Degraded policy v1 | [`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md) |
| Topology: closed vs deferred | [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) |
| Policy: proven vs deferred | [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) |
| Roadmap | [`roadmap.md`](./roadmap.md) |
| Post–week 28 posture (failure-impact / risk summary / policy evidence / operator workspace closure) | [`post-week-28-bounded-phase2-recommendation.md`](./post-week-28-bounded-phase2-recommendation.md) |
