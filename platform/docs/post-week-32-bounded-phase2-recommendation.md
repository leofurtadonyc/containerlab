# Post–Week 32 bounded Phase 2 recommendation

## Purpose

This note records the **next disciplined scheduling posture** after week **32** so planning does not default to reopening the closed **Service Dossier v1**, **Change Safety Case v1**, **NOC cockpit** + **global operator search** week **32** integration (**Service dossier** / **Change safety case** pivots and hubs), **`verify-core-runtime.sh`** **app-web bundle** structural checks for **`service_dossier_v1`** and **`change_safety_case_v1`** in shipped **`/assets/*.js`**, plus bounded live **`GET`** sampling for **`GET /api/v1/services/{service_id}/dossier`** and **`GET /api/v1/reports/change-safety-case/{policy,service,maintenance}`** when **`python3`** and the usual sampled **`policy_id`** / **`service_id`** / **`node_id`** gates exist (see [`week-32-verifier-parity-contract.md`](./week-32-verifier-parity-contract.md)), report-route **`GET /api/v1/reports/change-safety-case/...`** **product** semantics, **evidence replay** rejection of root **`change_safety_case_v1`** (parallel to **`impact_report_v1`**), repository **`pytest`** / **`vitest`** week **32** regressions, or **cross-doc alignment** for those surfaces—by momentum.

Week **32** delivered **service-centric composed dossier** and **pre-change interpretation packaging** (**reuse-only** on Phase **2** read APIs and assemblies from weeks **24–31**):

- **Contracts / APIs:** **`service_dossier_v1`** ([`service-dossier-contract.md`](./service-dossier-contract.md)); **`GET /api/v1/services/{service_id}/dossier`**; **`change_safety_case_v1`** ([`change-safety-case-contract.md`](./change-safety-case-contract.md)); **`GET /api/v1/reports/change-safety-case/policy`**, **`…/service`**, **`…/maintenance`**; report downloads and live fetch share the same routes—**not** **`evidence_export_v1`**; evidence replay **rejects** root **`change_safety_case_v1`** JSON as non-export ([`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md))
- **WebUI:** **`view=service-dossier`**, **`view=change-safety-case`** with bounded URL context; **Overview** **`NocCockpitOperatorLaunchGrid`** / **`NocCockpitStrategicPivots`** and **`GlobalOperatorSearch`** — **Service dossier** (policy-shaped) and **Change safety case** (policy, maintenance, **Change safety case hub**) alongside week **31** surfaces—still **`operator_search_pivot_v1`** / **`GET /api/v1/operator-search`** inventory search only; **no** new corpora or ranking engines
- **Verifier / tests:** **`verify-core-runtime.sh`** — shipped **`/assets/*.js`** must include **`service_dossier_v1`** and **`change_safety_case_v1`** alongside existing NOC / digest / briefing / replay / week **31** markers; when **`python3`** and sampling gates match, structural compact **`GET`**s to **`/api/v1/services/{service_id}/dossier`** and **`/api/v1/reports/change-safety-case/...`** (policy / service / maintenance)—[`week-32-verifier-parity-contract.md`](./week-32-verifier-parity-contract.md); repository **`pytest`** / **`vitest`** (service dossier, change safety case navigation, global search, overview NOC, evidence replay parse, downloads)
- **Docs / audit trail:** [`deployment-runbook.md`](./deployment-runbook.md), [`data-flows.md`](./data-flows.md), [`roadmap.md`](./roadmap.md) aligned with shipped week **32** story; detailed task rows in [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) **Week 32** sections and **Week 32 closure**; completed-task inventory [`../../agent/sdn-tasks/completed/week-32-archive-index.md`](../../agent/sdn-tasks/completed/week-32-archive-index.md) (anti-reopen traceability—does not replace **`03-CURRENT-STATUS.md`** operational truth)

It is a **recommendation and anti-drift guardrail** only.

It does **not** authorize:

- phase transition
- workflow implementation, dry-run APIs, or validation engines
- treating **Service Dossier** as a new service catalog, billing source, or traffic proof—**it composes existing** Service Explorer / explainability / maintenance / impact **pointers** and merged caveats
- treating **Change Safety Case** as dry-run, approval, simulation, safe-to-change verdict, or substitute for **Impact Report** or **evidence export** when the operator needs those contracts—**`change_safety_case_v1`** is **interpretation and handoff packaging** over reused evidence; **Evidence replay** expects **`GET /api/v1/exports/...`** exports
- treating **NOC cockpit** or **global search** week **32** pivots as proof of unified scoring or new backend assemblies—**bounded navigation** over existing signals; **`global_search_q`** is echo/breadcrumb where applied
- Grafana-owned semantics for dossier or change safety case (see [`dashboards.md`](./dashboards.md))
- broader topology or policy **truth** than [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) and [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) justify

## Relationship to prior guidance

Week **21** posture remains in [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md). Week **22**–**31** post notes remain in [`post-week-22-bounded-phase2-recommendation.md`](./post-week-22-bounded-phase2-recommendation.md) through [`post-week-31-bounded-phase2-recommendation.md`](./post-week-31-bounded-phase2-recommendation.md). Week **32** **adds** explicit closure of the bounded **service dossier / change safety case** workstream and cockpit/search integration; it does **not** replace ADR-0001, topology or policy truth-depth reviews, or weeks **22–31** closures. It does **not** subsume **Service Explorer**, **Impact Report**, **Maintenance Preview**, or week **31** surfaces as superseded—those remain **closed** under [`post-week-31-bounded-phase2-recommendation.md`](./post-week-31-bounded-phase2-recommendation.md).

## What week 32 actually closed

Week **32** is **closed** as bounded Phase **2** Service Dossier v1, Change Safety Case v1 (API + WebUI + report/export/replay boundaries), NOC cockpit and global search entry integration for **Service dossier** and **Change safety case**, and verifier/test/doc alignment (see [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) **Week 32 closure**; completed-task inventory [`../../agent/sdn-tasks/completed/week-32-archive-index.md`](../../agent/sdn-tasks/completed/week-32-archive-index.md); per-task artifacts `agent/sdn-tasks/completed/week-32-*.md`).

Week **32** did **not**:

- add new collector domains, workflow engines, or cross-domain causal scoring beyond composed read-side assembly
- add maintenance approval, change windows, or execution authority
- change the default verdict [`conditionally_ready_with_explicit_limits`](./production-readiness-assessment.md)
- merge dossier and change safety case into a single backend “operator brain”—each remains **contract-bounded**
- make **Change Safety Case** authoritative over **evidence export** or **live** **`GET`** responses when the operator needs frozen **`evidence_export_v1`** or current inventory truth

## What remained intentionally bounded

- **Phase 2 — read-only product foundation** — no phase transition.
- **Service Dossier** — **composed** read-side workspace; **not** a new registry of record.
- **Change Safety Case** — **evidence inventory**, gaps, advisory **next-review** framing; **not** validation or safe-to-change proof.
- **Cockpit / search week 32** — **navigation composition**; **Standard** overview and full product pages remain the detailed surfaces.
- **Global search** — same **`GET /api/v1/operator-search`** contract; week **32** adds **dossier** and **change safety case** deeplinks + hubs, not new search backends.

## Scheduling default (evidence-first)

There is **still no automatic default implementation lane** after week **32**.

The **primary gate** remains an **evidence-gated reassessment** using:

- [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md)
- [`topology-truth-depth-review.md`](./topology-truth-depth-review.md)
- [`policy-truth-depth-review.md`](./policy-truth-depth-review.md)
- [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md) through this note (**`post-week-32`**)—week **32** closure and anti-reopen guardrails **without** replacing prior post notes

**Meaning:** choose **at most one** narrow read-only slice only after **live lab or repository evidence** identifies a concrete, bounded gap. Week **32** surfaces are **not** the default churn lane—they are **closed** unless new evidence shows contract drift, verifier false positives/negatives, or a **proven** operator-facing bug.

## Next direction: truth-depth vs labeling vs verifier vs docs-only

Use week **32** evidence to choose **one** of these **only when justified**—not all four, and not by default:

1. **Collector-first policy or topology truth-depth** only when [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) or [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) plus **live lab evidence** justify a narrow follow-on—unchanged default from prior post notes.

2. **Honest operator labeling** (no new semantics): clearer **dossier vs explorer**, **change safety case vs impact report vs evidence export** copy—**not** new assemblies.

3. **Structural verifier or pytest tightening** for **existing** week **32** endpoints and **app-web** markers (honest skip/notice behavior)—**not** duplicating assembly logic in shell.

4. **Documentation-only alignment** when code, verifier, and operator docs drift.

If **no** new evidence appears, the default next step is **not** a new feature slice: run the **ADR-0001 / topology / policy** reassessment cycle and keep the stack on **rebuild → redeploy → verify** ([`deployment-runbook.md`](./deployment-runbook.md)).

## Week 33 integrity lane (status)

The bounded **Phase 2 integrity-and-evidence** follow-on after week **32** is **largely executed** in documentation and verification—**not** new Service Dossier or Change Safety Case **product** semantics:

- **Verifier parity:** [`week-32-verifier-parity-contract.md`](./week-32-verifier-parity-contract.md) is the audit contract; **`verify-core-runtime.sh`** performs **app-web** bundle markers for **`service_dossier_v1`** / **`change_safety_case_v1`** and **optional** structural **`GET`** sampling when **`python3`** and list gates pass (honest skip when gates fail)—see contract **Evidence layers → A — Live `verify-core-runtime.sh`**.
- **Completed-task archive:** [`../../agent/sdn-tasks/completed/week-32-archive-index.md`](../../agent/sdn-tasks/completed/week-32-archive-index.md) lists all ten Week **32** task artifacts; **[`week-32-schedule-overview.md`](../../agent/sdn-tasks/completed/week-32-schedule-overview.md)** is planning context only.
- **Cross-doc alignment:** [`roadmap.md`](./roadmap.md) **Week 32 closure** and [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) **Week 32 closure** describe the same verified story as this note.

**Default next scheduling move** remains **unchanged:** evidence-gated **at most one** narrow slice via ADR / truth-depth reviews (below)—**not** semantic churn on week **32** surfaces because parity or archive work “found something to tweak.”

**Phase:** [`01-CURRENT-PHASE.md`](../../agent/sdn/01-CURRENT-PHASE.md) stays **Phase 2 — read-only product foundation** unless explicit evidence supports a separate phase-boundary review.

## Explicit anti-recommendations (do not default here)

- **Misusing integrity work as product backlog:** verifier parity, **`week-32-verifier-parity-contract.md`**, archive restoration ([`week-32-archive-index.md`](../../agent/sdn-tasks/completed/week-32-archive-index.md)), roadmap/status wording fixes, or **Week 33** doc tasks **do not** constitute grounds to “finish” or **expand** Service Dossier / Change Safety Case **meaning**—those tracks were **verification and traceability**, and week **32** product closure remains **valid** ([`week-32-friday-task-02-week32-docs-roadmap-rollup-and-posture.md`](../../agent/sdn-tasks/completed/week-32-friday-task-02-week32-docs-roadmap-rollup-and-posture.md)).
- **Reopening week 32 themes by momentum:** [`service-dossier-contract.md`](./service-dossier-contract.md), **`GET /api/v1/services/{service_id}/dossier`**, **`view=service-dossier`**, **`navigateToServiceDossierForPolicy`** / related pivots; [`change-safety-case-contract.md`](./change-safety-case-contract.md), **`GET /api/v1/reports/change-safety-case/...`**, **`view=change-safety-case`**, **`navigateToChangeSafetyCaseForPolicy`** / **`navigateToChangeSafetyCaseForMaintenance`** / **`navigateToChangeSafetyCaseHub`**; [`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md), **`change_safety_case_not_evidence_export`**; **`verify-core-runtime.sh`** **`service_dossier_v1`** / **`change_safety_case_v1`** bundle markers and bounded **Service Dossier** + **Change Safety Case** report-route **`GET`** sampling (when gates match); NOC cockpit **`noc-cockpit-launch-change-safety-case`** and strategic pivots; **`GlobalOperatorSearch`** dossier/CSC pivots; repository **`pytest`** / **`vitest`** week **32** regressions—**closed** unless **new evidence** shows a concrete bug or contract drift.
- **Reopening week 31 or earlier bounded work by momentum** (unchanged): see [`post-week-31-bounded-phase2-recommendation.md`](./post-week-31-bounded-phase2-recommendation.md) and prior post notes.
- **Workflow, dry-run, validation**, or treating Grafana as the product surface for week **32** semantics.
- **Phase transition** language that exceeds `conditionally_ready_with_explicit_limits`.

## Current phase

The project remains **`Phase 2 — read-only product foundation`** until workflow records, workflow-owned APIs, and validation outputs are all real. This note **does not** justify changing [`01-CURRENT-PHASE.md`](../../agent/sdn/01-CURRENT-PHASE.md).

**Confirmation:** Phase remains **unchanged** unless **explicit** new evidence (not scheduling momentum) supports a **documented** phase-boundary review—out of scope for this recommendation.

## References

| Topic | Document |
| --- | --- |
| Current operational truth | [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) |
| Bounded slice scheduling | [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md) |
| Post–week 31 posture | [`post-week-31-bounded-phase2-recommendation.md`](./post-week-31-bounded-phase2-recommendation.md) |
| Service Dossier | [`service-dossier-contract.md`](./service-dossier-contract.md) |
| Change Safety Case | [`change-safety-case-contract.md`](./change-safety-case-contract.md) |
| Evidence replay vs reports | [`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md), [`evidence-export-contract.md`](./evidence-export-contract.md) |
| Impact Report | [`impact-report-contract.md`](./impact-report-contract.md) |
| Operator search | [`operator-search-contract.md`](./operator-search-contract.md) |
| NOC cockpit | [`noc-cockpit-contract.md`](./noc-cockpit-contract.md) |
| Topology: closed vs deferred | [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) |
| Policy: proven vs deferred | [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) |
| Roadmap | [`roadmap.md`](./roadmap.md) |
| Week 32 verifier parity (audit contract) | [`week-32-verifier-parity-contract.md`](./week-32-verifier-parity-contract.md) |
| Week 32 completed-task archive (inventory) | [`../../agent/sdn-tasks/completed/week-32-archive-index.md`](../../agent/sdn-tasks/completed/week-32-archive-index.md) |
