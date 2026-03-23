# Post–Week 30 bounded Phase 2 recommendation

## Purpose

This note records the **next disciplined scheduling posture** after week **30** so planning does not default to reopening the closed **cross-domain delta digest**, **operator briefing workspace**, **evidence replay viewer**, **briefing export bundle**, **NOC cockpit 2.0** composition, **global operator search** week **30** pivots, **`verify-core-runtime.sh`** week **30** structural checks (including **app-web** bundle markers and **`GET /api/v1/delta-digest`** / **`GET /api/v1/operator-briefing`** sampling), repository **`pytest`** / **`vitest`** week **30** regressions, or **cross-doc alignment** for those surfaces—by momentum.

Week **30** delivered **composed handoff and replay surfaces** on top of Phase **2** read APIs and reuse-only assemblies already shipped in weeks **24–29**:

- **Contracts / APIs:** **`cross_domain_delta_digest_v1`** ([`cross-domain-delta-digest-contract.md`](./cross-domain-delta-digest-contract.md)); **`GET /api/v1/delta-digest`**; **`operator_briefing_workspace_v1`** ([`operator-briefing-workspace-contract.md`](./operator-briefing-workspace-contract.md)); **`GET /api/v1/operator-briefing`**; **`evidence_replay_viewer_v1`** ([`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md)); **`briefing_export_bundle_v1`** ([`evidence-export-contract.md`](./evidence-export-contract.md)); **`GET /api/v1/exports/operator-briefing`**; **`noc_cockpit_v1`** evolution ([`noc-cockpit-contract.md`](./noc-cockpit-contract.md))—**cockpit 2.0** quick grid, **strategic pivots**, **evidence replay** entry; **`operator_search_pivot_v1`** extended client pivots ([`operator-search-contract.md`](./operator-search-contract.md))
- **WebUI:** **`view=delta-digest`**, **`view=operator-briefing`**, **`view=evidence-replay`**; **Overview** **`DeltaDigestOverviewEntry`**, **`OperatorBriefingOverviewEntry`**, **`EvidenceReplayOverviewEntry`**, **`NocCockpitStrategicPivots`**; **`GlobalOperatorSearch`** — **Delta digest**, **Evidence replay (frozen file)** footer, per-hit **Delta digest** deeplinks; briefing **Exports** — bundle + per-surface exports
- **Verifier / tests:** **`verify-core-runtime.sh`** — **`GET /api/v1/delta-digest?sync_runs_limit=10`**, **`GET /api/v1/operator-briefing?sync_runs_limit=10`**, **`GET /api/v1/exports/operator-briefing`**, shipped **`/assets/*.js`** markers including **`noc-cockpit-strategic-pivots`**, **`Evidence replay (frozen file)`**, and existing **`cross_domain_delta_digest_v1`**, **`operator_briefing_workspace_v1`**, **`briefing_export_bundle_v1`**, **`evidence_replay_viewer_v1`**, **`noc_cockpit_v1`**, **`overview_mode`**; repository **`pytest`** / **`vitest`** (digest, briefing, replay parse/UI, export bundle, overview cockpit, operator search navigation)
- **Docs:** [`deployment-runbook.md`](./deployment-runbook.md) verifier bullets aligned with week **30** checks; detailed task rows in [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) **Week 30** sections

It is a **recommendation and anti-drift guardrail** only.

It does **not** authorize:

- phase transition
- workflow implementation, dry-run APIs, or validation engines
- treating **delta digest** as a causal “what broke” engine, SLA narrative, or substitute for full **Devices**, **Topology**, **Policies**, **Capabilities**, **Change intelligence**, **Investigation**, or **Situation room** assemblies
- treating **operator briefing** as incident command, unified cross-domain truth, or automatic safe-to-change recommendation—**it composes existing read assemblies**
- treating **evidence replay** as live product truth, tamper evidence, compliance hold, or proof that imported **`evidence_export_v1`** matches current APIs
- treating **briefing export bundle** as interchangeable with single-export **`evidence_export_v1`** replay at the **root** envelope—operators use **per-member** JSON for **`parseEvidenceExportJson`** replay
- treating **NOC cockpit 2.0** as new backend scoring, prefetch of new **`GET`** assemblies, or replacement for full per-page tables—**navigation and copy over existing signals**
- treating **global search** week **30** pivots as proof that **delta digest** or **evidence replay** align with a specific inventory hit—**footer and deeplinks are workspace launches** with honest **`global_search_q`** echo where applicable
- Grafana-owned semantics for digest, briefing, replay, export bundle, or cockpit (see [`dashboards.md`](./dashboards.md))
- broader topology or policy **truth** than [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) and [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) justify

## Relationship to prior guidance

Week **21** posture remains in [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md). Week **22**–**29** post notes remain in [`post-week-22-bounded-phase2-recommendation.md`](./post-week-22-bounded-phase2-recommendation.md) through [`post-week-29-bounded-phase2-recommendation.md`](./post-week-29-bounded-phase2-recommendation.md). Week **30** **adds** explicit closure of the bounded **digest / briefing / replay / briefing-bundle export / cockpit 2.0 / global search week 30** workstream; it does **not** replace ADR-0001, topology or policy truth-depth reviews, or weeks **22–29** closures. It does **not** subsume **change intelligence** (week **24**), **investigation workspace** (week **25**), or **evidence pack** (week **26**) as new “brains”—those remain **downstream** of the same read-side contracts.

## What week 30 actually closed

Week **30** is **closed** as bounded Phase **2** cross-domain digest, composed briefing, evidence replay, briefing archive export, NOC cockpit composition evolution, and global search integration (see [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) **Week 30** closure and `agent/sdn-tasks/completed/week-30-*.md`).

Week **30** did **not**:

- add new collector domains, scoring engines, or cross-domain causal engines for digest sections
- add workflow, approval, rollback, or safe-change authority
- change the default verdict [`conditionally_ready_with_explicit_limits`](./production-readiness-assessment.md)
- merge digest, briefing, replay, export bundle, and cockpit into a single backend “operator brain”—each remains **contract-bounded**
- make **evidence replay** authoritative over live **Policies** / **Topology** / **Investigation** APIs

## What remained intentionally bounded

- **Phase 2 — read-only product foundation** — no phase transition.
- **Delta digest** — **aggregates** existing list/summary signals; **partial** sections are honest; **not** forensic timeline authority.
- **Operator briefing** — **composes** nested assemblies; **caveats** merge for handoff only.
- **Evidence replay** — **client-side** parse/render of **frozen** exports; **pivots** to live surfaces are navigation only.
- **Briefing export bundle** — **multi-member** archive; **not** a substitute for live briefing **`GET`** semantics.
- **NOC cockpit 2.0** — **layout** and **priority navigation**; **Standard** overview remains.
- **Global search** — **inventory field** search; week **30** adds **workspace launches**, not new search corpora.

## Scheduling default (evidence-first)

There is **still no automatic default implementation lane** after week **30**.

The **primary gate** remains an **evidence-gated reassessment** using:

- [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md)
- [`topology-truth-depth-review.md`](./topology-truth-depth-review.md)
- [`policy-truth-depth-review.md`](./policy-truth-depth-review.md)
- [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md) through [`post-week-29-bounded-phase2-recommendation.md`](./post-week-29-bounded-phase2-recommendation.md); this note (**`post-week-30`**) records week **30** closure and anti-reopen guardrails **without** replacing prior post notes

**Meaning:** choose **at most one** narrow read-only slice only after **live lab or repository evidence** identifies a concrete, bounded gap. Week **30** surfaces are **not** the default churn lane—they are **closed** unless new evidence shows contract drift, verifier false positives/negatives, or a **proven** operator-facing bug.

## Next direction: explainability vs navigation copy vs verifier tightening vs truth-depth

Use week **30** evidence to choose **one** of these **only when justified**—not all four, and not by default:

1. **Deeper explainability (Phase 2–safe):** improve **operator comprehension** of **existing** digest **section** states, briefing **section_meta**, replay **warnings**, or export **framing**—**without** new nested “truth” fields that imply simulation, SLA, or compliance authority.

2. **Honest navigation UX** (no new semantics): **Overview** / **cockpit** / **search** already expose **read-only** pivots; the only honest expansion is **clearer labeling** of **frozen vs live**, **bundle vs per-surface export**, and **empty/partial** digest sections—**not** new **`GET`** assemblies for cockpit.

3. **Structural verifier or pytest tightening** for **existing** week **30** endpoints and **app-web** markers (honest skip/notice behavior)—**not** duplicating assembly logic in shell.

4. **Collector-first policy or topology truth-depth** only when [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) or [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) plus **live lab evidence** justify a narrow follow-on—unchanged default from prior post notes.

If **no** new evidence appears, the default next step is **not** a new feature slice: run the **ADR-0001 / topology / policy** reassessment cycle and keep the stack on **rebuild → redeploy → verify** ([`deployment-runbook.md`](./deployment-runbook.md)).

## Narrow follow-ons that remain *plausible* when evidence appears

1. **Documentation-only alignment** when code, verifier, and operator docs drift.
2. **One** bounded UX fix on **Delta digest**, **Operator briefing**, **Evidence replay**, **Exports**, **NOC cockpit**, or **Global search** if a **proven** navigation, labeling, or focus-scroll bug remains after week **30**—**not** reopening API contracts by default.
3. **Structural** **`verify-core-runtime.sh`** adjustment when **app-web** bundling changes string literals—**preserve** honest intent, **not** weaken semantic **`pytest`** coverage.

## Explicit anti-recommendations (do not default here)

- **Reopening week 30 themes by momentum:** [`cross-domain-delta-digest-contract.md`](./cross-domain-delta-digest-contract.md), **`GET /api/v1/delta-digest`**, **`view=delta-digest`**, **`DeltaDigestOverviewEntry`**, **`navigateToDeltaDigestView`** / **`navigateToDeltaDigestFromGlobalSearch`**; [`operator-briefing-workspace-contract.md`](./operator-briefing-workspace-contract.md), **`GET /api/v1/operator-briefing`**, **`view=operator-briefing`**, **`OperatorBriefingOverviewEntry`**, **`navigateToOperatorBriefingView`**; [`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md), **`view=evidence-replay`**, **`EvidenceReplayProduct`**, **`parseEvidenceExportJson`**; [`evidence-export-contract.md`](./evidence-export-contract.md), **`GET /api/v1/exports/operator-briefing`**, **`briefing_export_bundle_v1`**, briefing **Exports** UI; [`noc-cockpit-contract.md`](./noc-cockpit-contract.md), **`NocCockpitSection`**, **`NocCockpitStrategicPivots`**, **`EvidenceReplayOverviewEntry`**, **`overview_mode`**, **`noc-cockpit-strategic-pivots`**; [`operator-search-contract.md`](./operator-search-contract.md), **`GlobalOperatorSearch`**, **`navigateToEvidenceReplayFromGlobalSearch`**, **`navigateToDeltaDigestFromGlobalSearch`**; **`verify-core-runtime.sh`** week **30** branches (digest/briefing **`GET`**s, extended **`/assets/*.js`** markers); repository **`pytest`** / **`vitest`** week **30** regressions—**closed** unless **new evidence** shows a concrete bug or contract drift.
- **Reopening week 29 or earlier bounded work by momentum** (unchanged): see [`post-week-29-bounded-phase2-recommendation.md`](./post-week-29-bounded-phase2-recommendation.md) and prior post notes.
- **Workflow, dry-run, validation**, or treating Grafana as the product surface for week **30** semantics.
- **Phase transition** language that exceeds `conditionally_ready_with_explicit_limits`.

## Current phase

The project remains **`Phase 2 — read-only product foundation`** until workflow records, workflow-owned APIs, and validation outputs are all real. This note **does not** justify changing [`01-CURRENT-PHASE.md`](../../agent/sdn/01-CURRENT-PHASE.md).

**Confirmation:** Phase remains **unchanged** unless **explicit** new evidence (not scheduling momentum) supports a **documented** phase-boundary review—out of scope for this recommendation.

## References

| Topic | Document |
| --- | --- |
| Current operational truth | [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) |
| Bounded slice scheduling | [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md) |
| Post–week 29 posture | [`post-week-29-bounded-phase2-recommendation.md`](./post-week-29-bounded-phase2-recommendation.md) |
| Cross-domain delta digest | [`cross-domain-delta-digest-contract.md`](./cross-domain-delta-digest-contract.md) |
| Operator briefing | [`operator-briefing-workspace-contract.md`](./operator-briefing-workspace-contract.md) |
| Evidence replay | [`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md) |
| Evidence export / bundle | [`evidence-export-contract.md`](./evidence-export-contract.md) |
| NOC cockpit | [`noc-cockpit-contract.md`](./noc-cockpit-contract.md) |
| Operator search | [`operator-search-contract.md`](./operator-search-contract.md) |
| Topology: closed vs deferred | [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) |
| Policy: proven vs deferred | [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) |
| Roadmap | [`roadmap.md`](./roadmap.md) |
