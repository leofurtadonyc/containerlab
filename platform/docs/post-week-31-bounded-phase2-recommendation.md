# Post–Week 31 bounded Phase 2 recommendation

## Purpose

This note records the **next disciplined scheduling posture** after week **31** so planning does not default to reopening the closed **Service Explorer v1**, **policy explainability workspace v1**, **Maintenance Preview v1**, **Impact Report v1**, **NOC cockpit 3.0** composition (**`NocCockpitOperatorLaunchGrid`**, extended **strategic pivots**), **global operator search** week **31** impact-report pivots and **Impact report hub**, **`verify-core-runtime.sh`** week **31** structural checks (including **`GET /api/v1/maintenance-preview`**, **`service_explorer_v1`** / **`policy_explainability_workspace_v1`** / **`Impact report hub`** in shipped **`/assets/*.js`**, policy/maintenance **impact** **`GET`** sampling), repository **`pytest`** / **`vitest`** week **31** regressions, or **cross-doc alignment** for those surfaces—by momentum.

Week **31** delivered **service-centric inventory lens**, **path-story explainability**, **maintenance-shaped co-occurrence preview**, **composed impact reports** (**`impact_report_v1`**) distinct from **`evidence_export_v1`**, **cockpit launch surfaces** and **search deeplinks**—all **reuse-only** on top of Phase **2** read APIs and assemblies already shipped in weeks **24–30**:

- **Contracts / APIs:** **`service_explorer_v1`** ([`service-explorer-contract.md`](./service-explorer-contract.md)); **`GET /api/v1/services`**; **`policy_explainability_workspace_v1`** ([`policy-explainability-workspace-contract.md`](./policy-explainability-workspace-contract.md)); **`GET /api/v1/policies/{policy_id}/explainability`**; **`maintenance_preview_v1`** ([`maintenance-preview-contract.md`](./maintenance-preview-contract.md)); **`GET /api/v1/maintenance-preview`**; **`impact_report_v1`** ([`impact-report-contract.md`](./impact-report-contract.md)); **`GET /api/v1/reports/service-impact`**, **`policy-impact`**, **`maintenance-impact`**; **`noc_cockpit_v1`** evolution ([`noc-cockpit-contract.md`](./noc-cockpit-contract.md))—**cockpit 3.0** primary launch grid, impact/strategic pivots; **`operator_search_pivot_v1`** extended client pivots ([`operator-search-contract.md`](./operator-search-contract.md)); evidence replay **rejects** root **`impact_report_v1`** JSON as non-export ([`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md))
- **WebUI:** **`view=service-explorer`**, **`policy_workspace=explainability`**, **`view=maintenance-preview`**, **`view=impact-report`**; **Overview** **`NocCockpitOperatorLaunchGrid`**, **`NocCockpitStrategicPivots`** extensions; **`GlobalOperatorSearch`** — **Impact report (policy)**, **Impact report (maintenance)**, **Impact report hub**
- **Verifier / tests:** **`verify-core-runtime.sh`** — **`GET /api/v1/services`** (**`service_explorer_v1`**); policy **explainability** **`GET`**; **`GET /api/v1/maintenance-preview`** (sampled **`node_id`**); policy/maintenance **impact** report **`GET`**s; shipped **`/assets/*.js`** markers including **`service_explorer_v1`**, **`policy_explainability_workspace_v1`**, **`Impact report hub`**, existing **`maintenance_preview_v1`**, **`impact_report_v1`**, **`noc_cockpit_v1`**, **`noc-cockpit-operator-launch`**, …; repository **`pytest`** / **`vitest`** (service explorer, explainability, maintenance preview, impact report, replay parse, global search week **31**, **`noc-cockpit-priority.test.ts`**, …)
- **Docs:** [`deployment-runbook.md`](./deployment-runbook.md), [`data-flows.md`](./data-flows.md) aligned where week **31** tasks touched them; detailed task rows in [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) **Week 31** sections and **Week 31 closure**

It is a **recommendation and anti-drift guardrail** only.

It does **not** authorize:

- phase transition
- workflow implementation, dry-run APIs, or validation engines
- treating **Service Explorer** as a new service catalog, billing source, or traffic proof—**it groups existing policy inventory**
- treating **policy explainability** as dataplane path proof, TE resolution, or validation verdict—**interpretation support** from nested assemblies
- treating **Maintenance Preview** as scheduling authority, change approval, or blast-radius truth—**bounded co-occurrence read-side**
- treating **Impact Report** as **`evidence_export_v1`** replay input, compliance pack, or substitute for live dossiers when freshness matters—**`impact_report_v1`** is a **communication package**; **Evidence replay** expects **`GET /api/v1/exports/...`** exports
- treating **NOC cockpit 3.0** as new backend **`GET`** assemblies, unified scoring, or replacement for full **Policies** / **Topology** / **Investigation** pages—**composition and navigation** over existing signals
- treating **global search** week **31** impact pivots as proof that the query text appears inside a report body—**`global_search_q`** is breadcrumb echo; **hub** opens **setup** without an anchor
- Grafana-owned semantics for service lens, explainability, maintenance preview, impact report, or cockpit (see [`dashboards.md`](./dashboards.md))
- broader topology or policy **truth** than [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) and [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) justify

## Relationship to prior guidance

Week **21** posture remains in [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md). Week **22**–**30** post notes remain in [`post-week-22-bounded-phase2-recommendation.md`](./post-week-22-bounded-phase2-recommendation.md) through [`post-week-30-bounded-phase2-recommendation.md`](./post-week-30-bounded-phase2-recommendation.md). Week **31** **adds** explicit closure of the bounded **service explorer / explainability / maintenance preview / impact report / cockpit 3.0 / global search week 31** workstream; it does **not** replace ADR-0001, topology or policy truth-depth reviews, or weeks **22–30** closures. It does **not** subsume **delta digest**, **operator briefing**, **evidence replay**, or **briefing bundle** (week **30**) as superseded—those remain **closed** under [`post-week-30-bounded-phase2-recommendation.md`](./post-week-30-bounded-phase2-recommendation.md). Week **31** surfaces are **adjacent** communication and lens layers—**not** new operational brains. **Service Dossier** and **Change Safety Case** closure, verifier-parity audit contract, completed-task archive inventory, and anti-reopen guardrails for week **32** live in [`post-week-32-bounded-phase2-recommendation.md`](./post-week-32-bounded-phase2-recommendation.md) and [`../../agent/sdn-tasks/completed/week-32-archive-index.md`](../../agent/sdn-tasks/completed/week-32-archive-index.md)—**not** a replacement for week **31** closure.

## What week 31 actually closed

Week **31** is **closed** as bounded Phase **2** Service Explorer, policy explainability workspace, Maintenance Preview, Impact Report, NOC cockpit 3.0 composition, global search impact pivots, verifier/test hardening, and replay/docs boundary for **`impact_report_v1`** vs **`evidence_export_v1`** (see [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) **Week 31 closure** and `agent/sdn-tasks/completed/week-31-*.md`).

Week **31** did **not**:

- add new collector domains, workflow engines, or cross-domain causal scoring for service groupings
- add maintenance approval, change windows, or safe-to-change authority
- change the default verdict [`conditionally_ready_with_explicit_limits`](./production-readiness-assessment.md)
- merge service lens, explainability, maintenance preview, and impact report into a single backend “operator brain”—each remains **contract-bounded**
- make **Impact Report** authoritative over **evidence export** or **live** **`GET`** responses when the operator needs frozen **`evidence_export_v1`** or current inventory truth

## What remained intentionally bounded

- **Phase 2 — read-only product foundation** — no phase transition.
- **Service Explorer** — **grouped** policy inventory and best-effort topology linkage; **not** a new service registry.
- **Policy explainability** — **path story**, **candidates**, **caveats**; **not** dataplane proof.
- **Maintenance Preview** — **co-occurring** read-side relationships; **not** scheduling system of record.
- **Impact Report** — **narrative packaging** for handoff; distinct from **evidence replay** inputs.
- **NOC cockpit 3.0** — **launch grid** + **priority navigation**; **Standard** overview remains.
- **Global search** — **inventory field** search; week **31** adds **impact** deeplinks + **hub**, not new search corpora.

## Scheduling default (evidence-first)

There is **still no automatic default implementation lane** after week **31**.

The **primary gate** remains an **evidence-gated reassessment** using:

- [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md)
- [`topology-truth-depth-review.md`](./topology-truth-depth-review.md)
- [`policy-truth-depth-review.md`](./policy-truth-depth-review.md)
- [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md) through [`post-week-30-bounded-phase2-recommendation.md`](./post-week-30-bounded-phase2-recommendation.md); this note (**`post-week-31`**) records week **31** closure and anti-reopen guardrails **without** replacing prior post notes; week **32** closure and verifier/archive posture are in [`post-week-32-bounded-phase2-recommendation.md`](./post-week-32-bounded-phase2-recommendation.md)

**Meaning:** choose **at most one** narrow read-only slice only after **live lab or repository evidence** identifies a concrete, bounded gap. Week **31** surfaces are **not** the default churn lane—they are **closed** unless new evidence shows contract drift, verifier false positives/negatives, or a **proven** operator-facing bug.

## Next direction: truth-depth vs labeling vs verifier vs docs-only

Use week **31** evidence to choose **one** of these **only when justified**—not all four, and not by default:

1. **Collector-first policy or topology truth-depth** only when [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) or [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) plus **live lab evidence** justify a narrow follow-on—unchanged default from prior post notes.

2. **Honest operator labeling** (no new semantics): clearer **frozen vs live**, **impact report vs evidence export**, **maintenance preview vs approval** copy on **cockpit** or **search**—**not** new assemblies.

3. **Structural verifier or pytest tightening** for **existing** week **31** endpoints and **app-web** markers (honest skip/notice behavior)—**not** duplicating assembly logic in shell.

4. **Documentation-only alignment** when code, verifier, and operator docs drift.

If **no** new evidence appears, the default next step is **not** a new feature slice: run the **ADR-0001 / topology / policy** reassessment cycle and keep the stack on **rebuild → redeploy → verify** ([`deployment-runbook.md`](./deployment-runbook.md)).

## Forward note for week 32 planning

**Update:** Week **32** executed the bounded lane below (Service Dossier v1 + Change Safety Case v1 + integration); post–week **32** scheduling posture is [`post-week-32-bounded-phase2-recommendation.md`](./post-week-32-bounded-phase2-recommendation.md).

If the project continues with a new innovation lane, the preferred bounded Phase **2** extension is:

1. **Service Dossier v1** — a service-centric composed workspace above week **31** Service Explorer and adjacent dossier / explainability / maintenance / impact surfaces
2. **Change Safety Case v1** — a bounded pre-change decision-support workspace that assembles existing evidence and explicit gaps without claiming dry-run, validation, approval, or execution authority

This note does **not** reopen week **31** by default. It means:
- week **31** Service Explorer, explainability, Maintenance Preview, Impact Report, cockpit **3.0**, and search pivots remain **closed**
- any overlap in week **32** must be justified as composition rather than replacement
- the new lane should target a larger operator-visible vertical slice, not another round of local polish
- `01-CURRENT-PHASE.md` remains unchanged unless explicit evidence supports a separate phase-boundary review

## Narrow follow-ons that remain *plausible* when evidence appears

1. **One** bounded UX fix on **Service Explorer**, **explainability**, **Maintenance Preview**, **Impact Report**, **cockpit**, or **Global search** if a **proven** navigation, labeling, or focus-scroll bug remains after week **31**—**not** reopening API contracts by default.
2. **Structural** **`verify-core-runtime.sh`** adjustment when **app-web** bundling changes string literals—**preserve** honest intent, **not** weaken semantic **`pytest`** / **`vitest`** coverage.
3. **Replay / export honesty** tweaks only when operators confuse **`impact_report_v1`** downloads with **`evidence_export_v1`**—**client copy and docs**, not new truth domains.

## Explicit anti-recommendations (do not default here)

- **Reopening week 31 themes by momentum:** [`service-explorer-contract.md`](./service-explorer-contract.md), **`GET /api/v1/services`**, **`view=service-explorer`**, **`navigateToServiceExplorer`**; [`policy-explainability-workspace-contract.md`](./policy-explainability-workspace-contract.md), **`GET /api/v1/policies/{id}/explainability`**, **`policy_workspace=explainability`**, **`navigateToPolicyExplainabilityWorkspace`**; [`maintenance-preview-contract.md`](./maintenance-preview-contract.md), **`GET /api/v1/maintenance-preview`**, **`view=maintenance-preview`**, **`navigateToMaintenancePreviewForTopologyObject`**; [`impact-report-contract.md`](./impact-report-contract.md), **`GET /api/v1/reports/...`**, **`view=impact-report`**, **`downloadImpactReport`**, **`navigateToImpactReportForPolicy`** / **`navigateToImpactReportForMaintenance`** / **`navigateToImpactReportHub`**; [`noc-cockpit-contract.md`](./noc-cockpit-contract.md), **`NocCockpitOperatorLaunchGrid`**, **`noc-cockpit-operator-launch`**, extended **`NocCockpitStrategicPivots`**, **`noc_cockpit_v1`**; [`operator-search-contract.md`](./operator-search-contract.md), **`GlobalOperatorSearch`**, impact-report deeplinks; [`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md), **`parseEvidenceExportJson`**, **`impact_report_not_evidence_export`**; **`verify-core-runtime.sh`** week **31** branches (services, explainability, maintenance-preview **`GET`**, impact **`GET`s`, extended **`/assets/*.js`** markers); repository **`pytest`** / **`vitest`** week **31** regressions—**closed** unless **new evidence** shows a concrete bug or contract drift.
- **Reopening week 30 or earlier bounded work by momentum** (unchanged): see [`post-week-30-bounded-phase2-recommendation.md`](./post-week-30-bounded-phase2-recommendation.md) and prior post notes.
- **Workflow, dry-run, validation**, or treating Grafana as the product surface for week **31** semantics.
- **Phase transition** language that exceeds `conditionally_ready_with_explicit_limits`.

## Current phase

The project remains **`Phase 2 — read-only product foundation`** until workflow records, workflow-owned APIs, and validation outputs are all real. This note **does not** justify changing [`01-CURRENT-PHASE.md`](../../agent/sdn/01-CURRENT-PHASE.md).

**Confirmation:** Phase remains **unchanged** unless **explicit** new evidence (not scheduling momentum) supports a **documented** phase-boundary review—out of scope for this recommendation.

## References

| Topic | Document |
| --- | --- |
| Current operational truth | [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) |
| Bounded slice scheduling | [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md) |
| Post–week 30 posture | [`post-week-30-bounded-phase2-recommendation.md`](./post-week-30-bounded-phase2-recommendation.md) |
| Service Explorer | [`service-explorer-contract.md`](./service-explorer-contract.md) |
| Policy explainability | [`policy-explainability-workspace-contract.md`](./policy-explainability-workspace-contract.md) |
| Maintenance Preview | [`maintenance-preview-contract.md`](./maintenance-preview-contract.md) |
| Impact Report | [`impact-report-contract.md`](./impact-report-contract.md) |
| Evidence replay vs impact | [`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md), [`evidence-export-contract.md`](./evidence-export-contract.md) |
| NOC cockpit | [`noc-cockpit-contract.md`](./noc-cockpit-contract.md) |
| Operator search | [`operator-search-contract.md`](./operator-search-contract.md) |
| Topology: closed vs deferred | [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) |
| Policy: proven vs deferred | [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) |
| Roadmap | [`roadmap.md`](./roadmap.md) |
| Post–week 32 (Service Dossier / Change Safety Case / parity) | [`post-week-32-bounded-phase2-recommendation.md`](./post-week-32-bounded-phase2-recommendation.md) |
| Week 32 completed-task archive (inventory) | [`../../agent/sdn-tasks/completed/week-32-archive-index.md`](../../agent/sdn-tasks/completed/week-32-archive-index.md) |
