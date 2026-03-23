# Post–Week 28 bounded Phase 2 recommendation

## Purpose

This note records the **next disciplined scheduling posture** after week **28** so planning does not default to reopening the closed **failure-impact**, **topology risk summary**, **policy evidence timeline**, **policy evidence delta**, **Overview operator-workspace composition**, **investigation shell hints** (**`failure_impact_entry`**, **`risk_summary_entry`**), **`verify-core-runtime.sh`** week **27–28** structural checks, repository **`pytest`** / **`vitest`** week **28** regressions, or **cross-doc alignment** for those surfaces—by momentum.

Week **28** delivered **read-side interpretation and navigation** on top of **existing** normalized topology, policy, and history contracts:

- **Contracts / APIs:** **`failure_impact_v1`** ([`failure-impact-contract.md`](./failure-impact-contract.md)); **`GET /api/v1/topology/objects/{object_id}/failure-impact`**; **`topology_risk_summary_v1`** ([`topology-risk-summary-contract.md`](./topology-risk-summary-contract.md)); **`GET /api/v1/topology/risk-summary`**; **`policy_evidence_timeline_v1`** ([`policy-evidence-timeline-contract.md`](./policy-evidence-timeline-contract.md)); **`GET /api/v1/policies/{policy_id}/evidence-timeline`**; **`policy_evidence_delta_v1`** ([`policy-evidence-delta-contract.md`](./policy-evidence-delta-contract.md)); **`GET /api/v1/policies/{policy_id}/evidence-delta`**
- **WebUI:** **Topology** — **`TopologyFailureImpactPanel`**, **`TopologyRiskAttentionPanel`**; **Overview** — **`TopologyRiskAttentionPanel`**, **`OperatorWorkspaceEntry`**; **Policies** — **`PolicyEvidenceTimelinePanel`**, **`PolicyEvidenceDeltaPanel`**; client-only URL hints **`policy_evidence_timeline_focus`**, **`policy_evidence_delta_focus`**; **Investigation** — **`failure_impact_entry=v1`**, **`risk_summary_entry=v1`** (navigation framing only); **workflow-history** / **audit-history** — **`HistoryPolicyEvidenceTimelineDrilldown`**
- **Verifier / tests:** **`verify-core-runtime.sh`** always **`GET /api/v1/topology/risk-summary`**; samples **`failure_impact_v1`**, **`policy_evidence_timeline_v1`**, **`policy_evidence_delta_v1`** when **`python3`** and lists allow; repository **`pytest`** / **`vitest`** (e.g. **`test_week28_read_api_contract_ids.py`**, **`api-client-week28-paths.test.tsx`**)
- **Docs:** [`architecture.md`](./architecture.md), [`data-flows.md`](./data-flows.md), [`services.md`](./services.md), [`dashboards.md`](./dashboards.md), [`roadmap.md`](./roadmap.md), [`README.md`](../README.md) aligned on non-claims

It is a **recommendation and anti-drift guardrail** only.

It does **not** authorize:

- phase transition
- workflow implementation, dry-run APIs, or validation engines
- treating **failure-impact** as blast-radius, dependency simulation, or global inventory health truth
- treating **topology risk summary** as SLA, traffic risk, optimization, or “replace” per-object failure-impact detail
- treating **policy evidence timeline** as a unified forensic log, packet-path proof, or workflow execution chronology
- treating **policy evidence delta** as drift truth, configuration diff authority, or policy correctness verdict
- treating **Overview** **`OperatorWorkspaceEntry`** as new backend semantics or ranked “what to fix first” authority beyond the listed navigation
- Grafana-owned semantics for failure-impact, risk summary, policy timeline, or policy delta (see [`dashboards.md`](./dashboards.md))
- broader topology or policy **truth** than [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) and [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) justify

## Relationship to prior guidance

Week **21** posture remains in [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md). Week **22**–**27** post notes remain in [`post-week-22-bounded-phase2-recommendation.md`](./post-week-22-bounded-phase2-recommendation.md) through [`post-week-27-bounded-phase2-recommendation.md`](./post-week-27-bounded-phase2-recommendation.md). Week **28** **adds** explicit closure of the bounded **failure-impact / topology risk summary / policy evidence timeline+delta / operator-workspace navigation / investigation shell hints / verifier** workstream; it does **not** replace ADR-0001, topology or policy truth-depth reviews, or weeks **22–27** closures. It does **not** subsume change intelligence (week **24**), investigation workspace (week **25**), or evidence pack (week **26**) as separate product brains—those assemblies remain **downstream** of the same read-side contracts. Week **29** bounded **dossiers / global operator search / evidence export / NOC cockpit** closure is recorded in [`post-week-29-bounded-phase2-recommendation.md`](./post-week-29-bounded-phase2-recommendation.md).

## What week 28 actually closed

Week **28** is **closed** as bounded Phase **2** read-side interpretation, ranking, and drill-through (see [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) **Week 28** closure and `agent/sdn-tasks/completed/week-28-*.md`).

Week **28** did **not**:

- prove new collector domains for simulated failure, traffic risk, or blast-radius
- add workflow, approval, rollback, or safe-change authority
- change the default verdict [`conditionally_ready_with_explicit_limits`](./production-readiness-assessment.md)
- merge **`failure_impact_entry`** and **`risk_summary_entry`** into a single investigation “severity” engine—**mutually exclusive** shell hints remain intentional
- turn **`OperatorWorkspaceEntry`** into a second investigation or situation-room assembly—**composition-only** shortcuts

## Scheduling default (evidence-first)

There is **still no automatic default implementation lane** after week **28**.

The **primary gate** remains an **evidence-gated reassessment** using:

- [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md)
- [`topology-truth-depth-review.md`](./topology-truth-depth-review.md)
- [`policy-truth-depth-review.md`](./policy-truth-depth-review.md)
- [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md) through [`post-week-27-bounded-phase2-recommendation.md`](./post-week-27-bounded-phase2-recommendation.md); this note (**`post-week-28`**) records week **28** closure and anti-reopen guardrails **without** replacing prior post notes

**Meaning:** choose **at most one** narrow read-only slice only after **live lab or repository evidence** identifies a concrete, bounded gap. Week **28** surfaces are **not** the default churn lane—they are **closed** unless new evidence shows contract drift, verifier false positives/negatives, or a **proven** operator-facing bug.

## Next direction: explainability vs ranking vs overview composition

Use week **28** evidence to choose **one** of these **only when justified**—not all three, and not by default:

1. **Deeper explainability (Phase 2–safe):** improve **operator comprehension** of **existing** contracts—copy, empty/partial states, caveat visibility, or cross-links between **failure-impact**, **risk summary**, **timeline**, and **delta**—**without** new “truth” fields that imply simulation, SLA, or drift authority.

2. **Honest ranking / attention UX** (no new semantics): **topology risk summary** already ranks by inspectable **`D`/`U`/`R`** inputs; the only honest expansion is **clearer presentation** of **ranking_basis**, **caveats**, and **`missing_evidence_notes`**—**not** a second ranking engine or cross-domain score.

3. **Overview composition** (navigation only): **`OperatorWorkspaceEntry`** may gain **additional read-only** links or copy when **specific** navigation gaps are documented—**not** prefetching backend assemblies, **not** duplicating **Investigation** or **Situation room** payloads.

If **no** new evidence appears, the default next step is **not** a new feature slice: run the **ADR-0001 / topology / policy** reassessment cycle and keep the stack on **rebuild → redeploy → verify** ([`deployment-runbook.md`](./deployment-runbook.md)).

## Narrow follow-ons that remain *plausible* when evidence appears

1. **Documentation-only alignment** when code, verifier, and operator docs drift.
2. **Structural verifier or pytest tightening** for **existing** week **28** endpoints (honest skip/notice behavior)—**not** duplicating assembly logic in shell.
3. **One** bounded UX fix on **Topology** / **Policies** / **Overview** if a **proven** navigation, labeling, or focus-scroll bug remains after week **28**—**not** reopening API contracts by default.
4. **Collector-first policy or topology truth-depth** only when [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) or [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) plus **live lab evidence** justify a narrow follow-on—unchanged default from prior post notes.

## Explicit anti-recommendations (do not default here)

- **Reopening week 28 themes by momentum:** **`failure-impact-contract.md`**, **`GET /api/v1/topology/objects/{object_id}/failure-impact`**, **`TopologyFailureImpactPanel`**, **`topology-risk-summary-contract.md`**, **`GET /api/v1/topology/risk-summary`**, **`TopologyRiskAttentionPanel`**, **`policy-evidence-timeline-contract.md`**, **`GET /api/v1/policies/{policy_id}/evidence-timeline`**, **`PolicyEvidenceTimelinePanel`**, **`HistoryPolicyEvidenceTimelineDrilldown`**, **`policy_evidence_timeline_focus`**, **`policy-evidence-delta-contract.md`**, **`GET /api/v1/policies/{policy_id}/evidence-delta`**, **`PolicyEvidenceDeltaPanel`**, **`policy_evidence_delta_focus`**, **`OperatorWorkspaceEntry`**, **`failure_impact_entry`**, **`risk_summary_entry`**, **`verify-core-runtime.sh`** week **27–28** branches, repository **`pytest`** / **`vitest`** week **28** regressions, or cross-doc week **28** wording—**closed** unless **new evidence** shows a concrete bug or contract drift.
- **Reopening weeks 22–27 by momentum** (unchanged from prior post notes): see [`post-week-22-bounded-phase2-recommendation.md`](./post-week-22-bounded-phase2-recommendation.md) through [`post-week-27-bounded-phase2-recommendation.md`](./post-week-27-bounded-phase2-recommendation.md).
- **Topology or policy implementation** by momentum beyond current reviews ([`topology-truth-depth-review.md`](./topology-truth-depth-review.md), [`policy-truth-depth-review.md`](./policy-truth-depth-review.md)).
- **Workflow, dry-run, validation**, or treating Grafana as the product surface for week **28** semantics.
- **Multi-vendor or Juniper parity** claims.
- **Phase transition** language that exceeds `conditionally_ready_with_explicit_limits`.

## Current phase

The project remains **`Phase 2 — read-only product foundation`** until workflow records, workflow-owned APIs, and validation outputs are all real. This note **does not** justify changing [`01-CURRENT-PHASE.md`](../../agent/sdn/01-CURRENT-PHASE.md).

## References

| Topic | Document |
| --- | --- |
| Current operational truth | [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) |
| Bounded slice scheduling | [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md) |
| Post–week 27 posture | [`post-week-27-bounded-phase2-recommendation.md`](./post-week-27-bounded-phase2-recommendation.md) |
| Failure impact | [`failure-impact-contract.md`](./failure-impact-contract.md) |
| Topology risk summary | [`topology-risk-summary-contract.md`](./topology-risk-summary-contract.md) |
| Policy evidence timeline | [`policy-evidence-timeline-contract.md`](./policy-evidence-timeline-contract.md) |
| Policy evidence delta | [`policy-evidence-delta-contract.md`](./policy-evidence-delta-contract.md) |
| Topology: closed vs deferred | [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) |
| Policy: proven vs deferred | [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) |
| Roadmap | [`roadmap.md`](./roadmap.md) |
| Post–week 29 posture | [`post-week-29-bounded-phase2-recommendation.md`](./post-week-29-bounded-phase2-recommendation.md) |
