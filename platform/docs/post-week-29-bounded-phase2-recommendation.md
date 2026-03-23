# Post–Week 29 bounded Phase 2 recommendation

## Purpose

This note records the **next disciplined scheduling posture** after week **29** so planning does not default to reopening the closed **topology object dossier**, **policy dossier**, **global operator search**, **evidence export v1**, **NOC cockpit v1** (**`noc_cockpit_v1`** / **`overview_mode`**), **`verify-core-runtime.sh`** week **29** structural checks (including **app-web** bundle markers), repository **`pytest`** / **`vitest`** week **29** regressions, or **cross-doc alignment** for those surfaces—by momentum.

Week **29** delivered **composed operator workspaces**, **cross-inventory search**, **export envelopes over existing assemblies**, and an **Overview cockpit layout**—all **reuse-only** on top of Phase **2** read APIs already shipped in weeks **24–28**:

- **Contracts / APIs:** **`topology_object_dossier_v1`** ([`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md)); **`GET /api/v1/topology/objects/{object_id}/dossier`**; **`policy_dossier_v1`** ([`policy-dossier-contract.md`](./policy-dossier-contract.md)); **`GET /api/v1/policies/{policy_id}/dossier`**; **`operator_search_pivot_v1`** ([`operator-search-contract.md`](./operator-search-contract.md)); **`GET /api/v1/operator-search`**; **`evidence_export_v1`** ([`evidence-export-contract.md`](./evidence-export-contract.md)); **`GET /api/v1/exports/...`** (policy/topology dossiers, situation room, investigation workspace); **`noc_cockpit_v1`** vocabulary ([`noc-cockpit-contract.md`](./noc-cockpit-contract.md))—**layout and prioritization**, optional **`overview_mode=cockpit`** on **Overview** only
- **WebUI:** **Topology** / **Policies** — dossier workspaces (`topology_workspace=dossier`, `policy_workspace=dossier`) and navigation from tables and panels; **shell** — **`GlobalOperatorSearch`** + **`global_search_q`** deeplink; **Overview** — **Standard** vs **NOC cockpit** (**`NocCockpitSection`**); **Investigation** / **Situation room** / dossier heroes — **Export JSON** / **Export Markdown** via shared download helpers
- **Verifier / tests:** **`verify-core-runtime.sh`** — **`operator-search`** structural **`GET`**; always-on **`exports/situation-room/summary`** and **`exports/investigation-workspace/summary`**; dossier + per-id exports when **`python3`** samples ids; **app-web** **`/`** + **`/assets/*.js`** scan for **`noc_cockpit_v1`** and **`overview_mode`**; repository **`pytest`** / **`vitest`** (dossier, search, export, overview cockpit, evidence-export download tests)
- **Docs:** [`roadmap.md`](./roadmap.md), [`deployment-runbook.md`](./deployment-runbook.md), [`data-flows.md`](./data-flows.md) aligned with the same bounded story where week **29** tasks touched them

It is a **recommendation and anti-drift guardrail** only.

It does **not** authorize:

- phase transition
- workflow implementation, dry-run APIs, or validation engines
- treating **dossiers** as new dataplane proof, SLA, TE resolution, or “single pane” operational truth beyond nested contracts
- treating **operator search** as log search, metrics search, or guaranteed completeness when results are capped or **`ambiguous`**
- treating **evidence export** as compliance artifact, tamper evidence, backup authority, or substitute for live **Policies**, **Topology**, **Investigation**, or **Situation room** views
- treating **NOC cockpit** as incident command, unified health scoring, or a replacement for full per-page tables and assemblies—**it composes existing Phase 2 surfaces only**
- a mandatory **read-only** **`GET /api/v1/.../noc-cockpit`** assembly before honest UI composition (the contract allows optional future API; **v1** shipped as **client composition**)
- Grafana-owned semantics for dossier, search, export, or cockpit (see [`dashboards.md`](./dashboards.md))
- broader topology or policy **truth** than [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) and [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) justify

## Relationship to prior guidance

Week **21** posture remains in [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md). Week **22**–**28** post notes remain in [`post-week-22-bounded-phase2-recommendation.md`](./post-week-22-bounded-phase2-recommendation.md) through [`post-week-28-bounded-phase2-recommendation.md`](./post-week-28-bounded-phase2-recommendation.md). Week **29** **adds** explicit closure of the bounded **dossiers / global operator search / evidence export / NOC cockpit / verifier+test hardening** workstream; it does **not** replace ADR-0001, topology or policy truth-depth reviews, or weeks **22–28** closures. It does **not** subsume change intelligence (week **24**), investigation workspace (week **25**), or evidence pack (week **26**) as separate product brains—those assemblies remain **downstream** of the same read-side contracts. Week **30** closure and anti-reopen guardrails for digest, briefing, replay, export bundle, and cockpit **2.0** are recorded in [`post-week-30-bounded-phase2-recommendation.md`](./post-week-30-bounded-phase2-recommendation.md); that note does **not** replace week **29** or prior post notes.

## What week 29 actually closed

Week **29** is **closed** as bounded Phase **2** composed workspaces, search, export, and cockpit composition (see [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) **Week 29** closure and `agent/sdn-tasks/completed/week-29-*.md`).

Week **29** did **not**:

- add new collector domains or scoring engines for dossiers, search ranking, or cockpit “urgency”
- add workflow, approval, rollback, or safe-change authority
- change the default verdict [`conditionally_ready_with_explicit_limits`](./production-readiness-assessment.md)
- merge **dossier**, **search**, **export**, and **cockpit** into a single backend “operator brain”—each remains **contract-bounded** and **honest about reuse**
- **NOC cockpit** is **not** a new truth engine; it is **layout and prioritization** over existing assemblies only

## What remained intentionally bounded

- **Phase 2 — read-only product foundation** — no phase transition.
- **Dossiers** — **nested** existing responses; **404** when ids are absent from current inventory slices.
- **Search** — **field/token** search across bounded inventory surfaces; **not** omniscient search.
- **Export** — **JSON** canonical + **Markdown** companion; **envelope** over nested **`contract_id`** trees; explicit **non-claims** in export framing.
- **NOC cockpit** — **Standard** overview remains available; **`overview_mode`** is a **client** layout switch; **no** new **`GET`** for cockpit assembly in v1.

## Scheduling default (evidence-first)

There is **still no automatic default implementation lane** after week **29**.

The **primary gate** remains an **evidence-gated reassessment** using:

- [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md)
- [`topology-truth-depth-review.md`](./topology-truth-depth-review.md)
- [`policy-truth-depth-review.md`](./policy-truth-depth-review.md)
- [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md) through [`post-week-28-bounded-phase2-recommendation.md`](./post-week-28-bounded-phase2-recommendation.md); this note (**`post-week-29`**) records week **29** closure and anti-reopen guardrails **without** replacing prior post notes

**Meaning:** choose **at most one** narrow read-only slice only after **live lab or repository evidence** identifies a concrete, bounded gap. Week **29** surfaces are **not** the default churn lane—they are **closed** unless new evidence shows contract drift, verifier false positives/negatives, or a **proven** operator-facing bug.

## Next direction: explainability vs search ergonomics vs export companion vs cockpit copy

Use week **29** evidence to choose **one** of these **only when justified**—not all four, and not by default:

1. **Deeper explainability (Phase 2–safe):** improve **operator comprehension** of **existing** dossier sections, search **empty / ambiguous / capped** states, or export **framing**—**without** new nested “truth” fields that imply simulation, SLA, or compliance authority.

2. **Honest search UX** (no new semantics): **operator search** already returns **`group`**s and **`result_state`**; the only honest expansion is **clearer presentation** of caps, ambiguity, and **pivot** links—**not** a second search engine or log integration.

3. **Export companion ergonomics** (bounded): **Markdown** / download hints **only**—**not** expanding export into new backend assemblies or formats beyond the contract.

4. **Overview cockpit composition** (navigation and copy only): **`NocCockpitSection`** may gain **additional read-only** links or ordering when **specific** gaps are documented—**not** prefetching new **`GET`** assemblies, **not** duplicating **Investigation** or **Situation room** payloads.

If **no** new evidence appears, the default next step is **not** a new feature slice: run the **ADR-0001 / topology / policy** reassessment cycle and keep the stack on **rebuild → redeploy → verify** ([`deployment-runbook.md`](./deployment-runbook.md)).

## Narrow follow-ons that remain *plausible* when evidence appears

1. **Documentation-only alignment** when code, verifier, and operator docs drift.
2. **Structural verifier or pytest tightening** for **existing** week **29** endpoints and **app-web** markers (honest skip/notice behavior)—**not** duplicating assembly logic in shell.
3. **One** bounded UX fix on **Dossier**, **Search**, **Export**, or **Overview** cockpit if a **proven** navigation, labeling, or focus-scroll bug remains after week **29**—**not** reopening API contracts by default.
4. **Collector-first policy or topology truth-depth** only when [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) or [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) plus **live lab evidence** justify a narrow follow-on—unchanged default from prior post notes.

## Explicit anti-recommendations (do not default here)

- **Reopening week 29 themes by momentum:** **`topology-object-dossier-contract.md`**, **`GET /api/v1/topology/objects/{object_id}/dossier`**, **`TopologyObjectDossierWorkspace`** / **`topology_workspace=dossier`**; **`policy-dossier-contract.md`**, **`GET /api/v1/policies/{policy_id}/dossier`**, **`PolicyDossierWorkspace`** / **`policy_workspace=dossier`** / **`policy_dossier_entry`**; **`operator-search-contract.md`**, **`GET /api/v1/operator-search`**, **`GlobalOperatorSearch`**, **`global_search_q`**; **`evidence-export-contract.md`**, **`GET /api/v1/exports/...`**, **`EvidenceExportActions`**, **`downloadEvidenceExport`**; **`noc-cockpit-contract.md`**, **`NocCockpitSection`**, **`overview_mode`**, **`readOverviewModeFromSearch`** / **`navigateOverviewLayoutMode`**; **`verify-core-runtime.sh`** week **29** branches (including **app-web** **`/assets/*.js`** **`noc_cockpit_v1`** + **`overview_mode`** markers); repository **`pytest`** / **`vitest`** week **29** regressions, or cross-doc week **29** wording—**closed** unless **new evidence** shows a concrete bug or contract drift.
- **Reopening weeks 22–28 by momentum** (unchanged from prior post notes): see [`post-week-22-bounded-phase2-recommendation.md`](./post-week-22-bounded-phase2-recommendation.md) through [`post-week-28-bounded-phase2-recommendation.md`](./post-week-28-bounded-phase2-recommendation.md).
- **Topology or policy implementation** by momentum beyond current reviews ([`topology-truth-depth-review.md`](./topology-truth-depth-review.md), [`policy-truth-depth-review.md`](./policy-truth-depth-review.md)).
- **Workflow, dry-run, validation**, or treating Grafana as the product surface for week **29** semantics.
- **Multi-vendor or Juniper parity** claims.
- **Phase transition** language that exceeds `conditionally_ready_with_explicit_limits`.

## Current phase

The project remains **`Phase 2 — read-only product foundation`** until workflow records, workflow-owned APIs, and validation outputs are all real. This note **does not** justify changing [`01-CURRENT-PHASE.md`](../../agent/sdn/01-CURRENT-PHASE.md).

**Confirmation:** Phase remains **unchanged** unless **explicit** new evidence (not scheduling momentum) supports a **documented** phase-boundary review—out of scope for this recommendation.

## References

| Topic | Document |
| --- | --- |
| Current operational truth | [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) |
| Bounded slice scheduling | [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md) |
| Post–week 28 posture | [`post-week-28-bounded-phase2-recommendation.md`](./post-week-28-bounded-phase2-recommendation.md) |
| Topology object dossier | [`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md) |
| Policy dossier | [`policy-dossier-contract.md`](./policy-dossier-contract.md) |
| Operator search | [`operator-search-contract.md`](./operator-search-contract.md) |
| Evidence export | [`evidence-export-contract.md`](./evidence-export-contract.md) |
| NOC cockpit | [`noc-cockpit-contract.md`](./noc-cockpit-contract.md) |
| Topology: closed vs deferred | [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) |
| Policy: proven vs deferred | [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) |
| Roadmap | [`roadmap.md`](./roadmap.md) |
| Post–week 30 posture | [`post-week-30-bounded-phase2-recommendation.md`](./post-week-30-bounded-phase2-recommendation.md) |
