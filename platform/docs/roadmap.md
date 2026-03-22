# Platform Roadmap

## Purpose

This document summarizes the platform's phased implementation roadmap.

## Current Status

The project is currently in `Phase 2 — read-only product foundation`.

Phase 2 to date has established:

- repository structure
- service boundaries
- topology skeleton
- Prometheus and Grafana observability (provisioned dashboards; bounded real metrics where implemented)
- bounded live read paths for backend, collector, and frontend; Postgres for the current read-side slice
- normalized model and schema scaffolding
- core architecture documents
- a useful read-only API, WebUI, and observability slice
- bounded persistence for inventory, topology, and policy snapshots plus sync-run history
- bounded workflow-history and audit-history visibility derived from persisted sync activity
- sharper capability semantics plus a stricter descriptive dry-run-planning-readiness assessment
- stronger platform, topology, and SR policy dashboards with bounded freshness, agreement, and evidence-gap cues where real metrics exist
- a first bounded runtime-hardening slice with repo-built local images, startup-contract validation for the most important stateful services, and small post-deploy verification scripts for the core runtime and ODL auth path
- accepted week 13 identity consolidation, with explicit persisted and response-level anchors now exposed where real records exist and no immediate capability item-ID follow-on justified for the current bounded product slice
- bounded platform-status `read_paths` coverage, freshness, degraded-scope, and policy detail-ready posture now carried through the backend, surfaced in the product, and mirrored numerically in the platform overview dashboard
- accepted week 14 topology truth-depth work, with explicit endpoint-pairing posture and paired-versus-single-sided inferred-link counts now carried end to end through collector delivery, backend-owned topology and platform-status contracts, primary WebUI trust cues, Grafana observability, targeted tests, and the live verifier while preserving explicit partial-truth semantics
- the strict policy truth-depth review is now also complete, and it confirms that the live collector path now yields a narrow but real detail-ready policy slice: the current stack exposes `detail_mode=static_policies_when_present`, `empty_reason=none`, `detail_ready_target_count=4`, and 4 normalized live `static_local` policy records, while 30 targets still remain explicitly `no_policies_observed`
- stronger automated verification, with backend and collector tests plus `verify-core-runtime` now checking the accepted week 13 identity, read-path, and week 14 topology-coverage signals directly
- week 16 operational checkpoint: topology coverage history persistence and product consumption, policy source-readiness history persistence and product consumption, workflow-history and audit-history baseline summaries (backend and frontend), same-workspace restart drill with preserved-baseline verifier checks
- week 18 closure (operator truth, history honesty, observability scaffolding): cross-file doc alignment with **devices/inventory** history verifier behavior (same **`history.recent_snapshots`** gate and notices pattern as topology/policy); **workflow/audit** inventory snapshot and comparison trust language in **app-web** plus **`test_app.py`** JSON contracts for presence and honest-null comparison; **Readiness** in **app-web** and **`platform-overview`** aligned on **evaluation sample** versus **persisted snapshot** age plus **mirror** bargauges for status, planning, blockers, and evidence coverage tied to **`platform_app_api_readiness_*`** metrics—observability-only; **change-validation** Grafana family as an explicit **markdown-only** non-claims scaffold (no fake PromQL); **vendor** Grafana overview (**`vendor-overview`**) with **real** bounded **`platform_gnmi_collector_*`** plus **`app-api`** collector-boundary **duration**, **timeout budget**, and **posture** (**Nokia-first**, no multi-vendor parity claims); **`roadmap.md`**, **`production-readiness-assessment.md`**, **`03-CURRENT-STATUS.md`**, **`deployment-runbook.md`**, and **`data-flows.md`** rolled forward as one bounded narrative with **no phase change** and **no** change to **`conditionally_ready_with_explicit_limits`**
- week **19** inventory-history slice (per **`ADR-0001`** default): richer **`/api/v1/devices`** **`history`** (anchors, comparisons, bounded **`change_preview`**), **WebUI** and entry-page cues, expanded **`verify-core-runtime`** inventory **`history`** assertions, **`app-api`** **`/metrics`** **`inventory_snapshots`** table gauges (**`platform_app_api_inventory_snapshots_persisted_total`**, **`platform_app_api_inventory_snapshot_latest_persisted_at_seconds`**) with **`dashboards.md`** / **platform-overview** and cross-doc (**`deployment-runbook.md`**, **`data-flows.md`**, **`production-readiness-assessment.md`**) product-versus-observability alignment—still **read-only**, **no** workflow or validation claims
- **week 20** policy-history slice (parallel narrative to week **19** inventory): richer **`/api/v1/policies`** **`history`** (anchors, nested source-readiness, comparison when two snapshots exist), **WebUI** and verifier hardening, **`app-api`** **`/metrics`** **`policy_snapshots`** table gauges (**`platform_app_api_policy_snapshots_persisted_total`**, **`platform_app_api_policy_snapshot_latest_persisted_at_seconds`**) with **`dashboards.md`**, **SR policy** / **platform-overview**, and cross-doc (**`deployment-runbook.md`**, **`data-flows.md`**, **`production-readiness-assessment.md`**, this file) product-versus-observability alignment—**static_local**-justified policy depth explicit; still **read-only**, **no** workflow or validation claims
- **Week 19 closure (Friday rollup):** **`03-CURRENT-STATUS.md`** records week **19** as delivered bounded value; **`conditionally_ready_with_explicit_limits`** unchanged; full live **`verify-core-runtime`** pass including new **`/metrics`** families requires **rebuilt** **`app-api`** images and redeploy (documented path: **`build-images.sh`** → **`clab deploy`** → **`verify-core-runtime.sh`** → **`verify-odl-auth.sh`**)
- **Week 20 closure (Friday rollup):** **`03-CURRENT-STATUS.md`** records week **20** policy-history deepening as delivered bounded value; **`conditionally_ready_with_explicit_limits`** unchanged; repository **`pytest`** covers expanded contracts and persistence; full live **`verify-core-runtime`** pass including policy **`history`** branches and **`policy_snapshots`** **`/metrics`** families requires **rebuilt** **`app-api`** images and redeploy on a lab stack (same documented path as week **19**)
- **Week 20 closure (Friday task 02):** **`policy-truth-depth-review.md`** adds **Post–Week 20 scheduling note (policy truth-depth checkpoint)**—week **20** closed **history and observability alignment** for the bounded policy envelope, not new live proof beyond **`static_local`**; default next step remains **`ADR-0001`** **Priority 2** evidence-first reassessment
- **Week 21 (Phase 2 doc drift cleanup):** cross-file wording alignment (`platform/README.md`, `platform/docs/*`, service READMEs where needed) so bounded capability, limitation, and observability boundaries stay consistent—**no phase change**, **no** new capability claims beyond evidence, **`conditionally_ready_with_explicit_limits`** unchanged
- **Week 21 closure (Friday rollup):** **`03-CURRENT-STATUS.md`** records week **21** as bounded operator-truth, read-side contract alignment, verifier structural checks, vendor/collector-boundary/ODL wording, and cross-file documentation honesty—**no phase change**, **`conditionally_ready_with_explicit_limits`** unchanged; stacks predating verifier or image changes still need **rebuild → redeploy → verify** to observe the latest checks at runtime (same documented path as prior weeks)
- **Week 21 closure (Friday task 02):** **`post-week-21-bounded-phase2-recommendation.md`** states the post–week **21** **evidence-first** scheduling default, narrow follow-on categories when proof exists, and **anti-recommendations** against topology/policy/vendor expansion by momentum—**no** new default implementation lane, **no** phase transition
- **Week 22 (read-side query ergonomics):** bounded optional query parameters on **`GET /api/v1/devices`**, **`GET /api/v1/policies`**, **`GET /api/v1/workflow-history`**, and **`GET /api/v1/audit-history`** (`limit`, `history_recent_limit`, `sync_runs_limit`, `readiness_snapshot_history_limit` on audit only) with honest **`read_side_query`** echo metadata—**usability and payload sizing only**, not new truth domains; WebUI keeps **`view`** and the same parameter names in the page URL for shareable read-only views; workflow-history and audit-history detail panels add **read-only** navigation to related product surfaces (Devices, Topology, Policies, Readiness) via existing **`view=`** URL patterns—**not** workflow execution or approvals; **`verify-core-runtime.sh`** includes structural checks that optional bounded query strings on history endpoints still return request echo fields in **`read_side_query`**; repository **`pytest`** / **`vitest`** cover validation and echo—**no phase change**, **no** workflow or validation-engine claims, **`conditionally_ready_with_explicit_limits`** unchanged (see **`data-flows.md`**, **`deployment-runbook.md`**)
- **Week 19 closure (Friday task 02):** **`topology-truth-depth-review.md`** adds a **Post–Week 19** note: topology **partiality contract** stays **closed** in shipped code; **default next scheduling** remains **`ADR-0001`** **Priority 2** evidence-first reassessment—**not** topology code by default after inventory work
- **Week 18 delivered value (documentation and trust, not scope expansion):** a single honest operator story for history gates, readiness two-clocks, and Grafana placeholder versus real metrics—without authorizing workflow, dry-run, validation, or broader production-operations claims.
- **Unchanged limits (explicit):** remain in **`Phase 2 — read-only product foundation`**; **Grafana** is not the product surface for readiness, capabilities, or change validation; **change-validation** still has **no** change-validation metric families; workflow implementation and phase transition stay **out of scope** until real contracts exist.
- **Operator narrative alignment:** **`deployment-runbook.md`**, **`data-flows.md`**, **`production-readiness-assessment.md`**, and this roadmap describe the **same** bounded envelope: **`conditionally_ready_with_explicit_limits`**, same-workspace recovery only (host-backed data preserved), **product-owned** persisted history (including rich **`/api/v1/devices`** and **`/api/v1/policies`** **`history`**) versus Grafana **current-metrics** and bounded **`inventory_snapshots`** / **`policy_snapshots`** table mirrors on **`app-api`** **`/metrics`**, optional **read-side query ergonomics** (bounded **`read_side_query`** echo; not search or workflow flags), conditional **`verify-core-runtime`** behavior when persisted rows exist or not, **Readiness** evaluation-sample versus **persisted-snapshot** language where relevant, and explicit **no** workflow, **no** dry-run, **no** validation-engine claims

## Updated Phase 2 Checkpoint Assessment

The current evidence supports a stricter checkpoint conclusion after the accepted
week 13 and week 14 work.

Current maturity by area:

- runtime and verification maturity: strong for the current Phase 2 scope, because repo-built images, startup-contract validation, targeted pytest, and the live `verify-core-runtime` plus `verify-odl-auth` flow now prove the bounded runtime, read-path, and roadmap-posture contracts end to end
- identity maturity: sufficient for bounded operations, because persisted and response-level anchors are explicit where real records exist and the accepted week 13 review closed the default capability item-ID lane with a documented no-change outcome
- read-path maturity: mixed, because inventory is strong enough for routine bounded use, topology pairing semantics are now materially stronger after the accepted week 14 work but topology still remains the weakest current live slice due to partial completeness and still-coarse degraded-scope interpretation, and policy is now stronger than the earlier aggregate-only checkpoint because the current lab exposes 4 detail-ready targets and 4 normalized live `static_local` records even though broader policy truth remains intentionally partial
- history maturity: stronger for read-side evidence but still blocked for workflow implementation, because workflow-history and audit-history now include bounded persisted context, anchors, coverage and source-readiness posture, response-level baseline summaries (preserved versus new baseline), and product consumption on the topology, policies, workflow-history, and audit-history pages, plus a same-workspace restart drill that proves preserved-baseline recovery; they still do not provide durable workflow lifecycle or operator-action history
- capability maturity: strong for planning support and current product interpretation, because support state, implementation status, delivery tier, evidence basis, vendor posture, version scope, workflow-readiness interpretation, and blocker posture are now explicit enough for honest bounded use without implying workflow eligibility or Juniper parity
- workflow-prerequisite clarity: still design-strong but implementation-deferred, because the repository has explicit ownership and sequencing guidance for future workflow-owned state while remaining fully in `Phase 2`

Strongest remaining evidence gap (post week 16–20):

- **No single automatic “next implementation” is prescribed.** Week 16 closed recovery consumption, topology coverage history (persist + consume), policy source-readiness history (persist + consume), history baseline summaries on workflow/audit views, and the same-workspace restart drill with preserved-baseline checks. Week 17 tightened persistence attributes, history API tests, topology/policy history **product + verifier + Grafana honesty**, workflow/audit **baseline callouts**, and verifier/drill **baseline_summary** alignment. Week 18 aligned **devices/inventory** history verifier behavior, workflow/audit inventory trust and contracts, **Readiness** evaluation versus persisted snapshot language (product + Grafana), and honest **change-validation** / **vendor** Grafana scaffolds. **Week 19** closed the **ADR-0001** default **inventory / devices persisted history** slice (API, WebUI, verifier, **`inventory_snapshots`** table metrics, cross-doc alignment). **Week 20** closed the **policy-history deepening** slice (expanded **`/api/v1/policies`** **`history`**, WebUI, verifier, **`policy_snapshots`** table metrics, cross-doc alignment). Pairing, partiality decomposition, node-participation cues, coverage history, week **18–20** inventory- and policy-history and verifier parity, readiness language, and those drill/verifier behaviors should stay **closed unless new evidence reopens them**.
- **Next reassessment (Priority 2):** choose the next *narrow* bounded truth-depth or persistence-backed deepening step based on live lab evidence—either a further topology truth cue only if a concrete gain remains beyond inference, endpoint-pairing, collection-posture, node-participation, and coverage-history work, or an equally bounded policy/history step if that has stronger justification. The live Nokia lab currently supports a narrow detail-ready `static_local` slice (`detail_mode=static_policies_when_present`, bounded detail-ready targets and normalized records in the policy-truth review); broader policy families remain off the table without new collector proof.
- **Workflow implementation, dry-run behavior, and workflow-owned storage** remain out of scope for the default next cycle.

Bounded next steps:

- preserve `Phase 2 — read-only product foundation` and the `conditionally_ready_with_explicit_limits` operating boundary
- keep the accepted week 13 identity no-change outcome closed unless a later concrete consumer proves the remaining item-level identity gap matters in practice
- keep week 14 endpoint-pairing, partiality decomposition, and node-participation implementation outcomes closed; do not reopen pairing- or coverage-history consumption work by default
- keep week 16–17 topology-history, policy-history, history-baseline, restart-drill, and related verifier Grafana doc honesty outcomes closed without new evidence
- keep any policy follow-on constrained to proven live Nokia evidence shapes unless new collector evidence independently proves another supported detail-ready policy family
- preserve `Phase 2 — read-only product foundation` until workflow records, workflow-owned APIs, and validation outputs are all real

## Recommendation For The Next Bounded Cycle

Recommendation: preserve the week **16–20** checkpoint narrative (including **week 19** inventory-history API, product, verifier, metrics, and doc alignment, plus **week 20** policy-history API, verifier, metrics, and cross-doc alignment) and continue bounded Phase 2 product deepening. Do not reopen the completed topology-history, policy-history, history-baseline, restart-drill, week 18–20 inventory- and policy-history, readiness-language, or Grafana-scaffold work without new evidence. Prefer the written decision in **`platform/docs/decisions/ADR-0001-next-bounded-truth-depth-slice.md`** before opening broad implementation in topology, policy, or persistence themes.

Interpret that recommendation narrowly.

- keep the project fully in `Phase 2 — read-only product foundation`
- do not reopen item-identity implementation by default
- do not reopen the accepted week 14 endpoint-pairing slice by default
- do not reopen the already-implemented partiality decomposition by default
- do not reopen the week 16 topology-history, policy-history, history-baseline, or restart-drill slices by default
- do not start workflow implementation, dry-run implementation, or any phase transition work
- keep the backend as the brain, the WebUI as the product, Grafana as the observability layer, and ODL bounded

Why this is the right next-cycle focus:

- week 16 closed the topology coverage history, policy source-readiness history, workflow-history and audit-history baseline summaries, and same-workspace restart drill; those slices are now implemented and documented
- week 18 closed the devices-history verifier alignment, inventory workflow/audit trust and contract tests, readiness evaluation versus persisted snapshot clarity, and honest Grafana families for change-validation and vendor/adapters observability; documentation now matches shipped behavior
- the accepted week 13 work closed the default identity lane with a documented no-change decision
- the accepted week 14 work closed the endpoint-pairing and single-sided-link coverage gap
- runtime hardening, verification, and the restart drill are now strong enough for the current bounded scope
- the next cycle should stay inside the read-only envelope: keep docs and phase boundaries honest, deepen read-only usefulness without faking completeness, and preserve the service and architecture boundaries already established

The recommended next-cycle slice should stay limited to:

- preserving the week **16–19** checkpoint honestly and the current safe-use boundary first
- recording the next truth-depth slice decision (see **`platform/docs/decisions/ADR-0001-next-bounded-truth-depth-slice.md`**) before broad implementation churn
- continuing bounded Phase 2 product deepening only where a concrete gain justifies code changes

## Phased Roadmap

### Phase 1 — platform skeleton and architecture-first foundation

Focus:

- platform structure
- service READMEs
- topology skeleton
- provisioning skeletons
- backend, collector, frontend, and Postgres scaffolding
- normalized model and schema direction
- architecture docs

Current state:

- foundation complete and preserved as the base for the current phase
- still intentionally bounded on broader lifecycle hardening, live ingestion depth, and workflows, even though the initial runtime packaging and verification slice is now real

### Phase 2 — read-only product foundation

Expected focus:

- collector-to-backend delivery
- read-only inventory and topology APIs
- read-only product pages
- early normalized policy visibility
- more meaningful observability panels

### Phase 3 — bounded ODL-backed enrichment

Expected focus:

- explicit ODL-backed enrichment where useful
- deeper controller-side visibility
- ODL inputs translated through backend-owned boundaries

### Phase 4 — dry-run and validation workflows

Expected focus:

- workflow model
- dry-run APIs
- diff and validation views
- audit relationships

### Phase 5 — first safe bounded action workflow

Expected focus:

- one narrow safe workflow
- strong post-check validation
- rollback where feasible

### Phase 6 — vendor expansion groundwork

Expected focus:

- Juniper adapter structure
- richer capability matrix behavior
- explicit vendor caveats and support handling

## Immediate Next Steps

Based on the current repo state after the week **16–19** checkpoints, the next likely work should be:

1. preserve the current `conditionally_ready_with_explicit_limits` operating boundary and keep all near-term work inside the Phase 2 read-only safe-use envelope
2. keep the week 16 topology-history, policy-history, history-baseline, and restart-drill outcomes closed by default; do not reopen those slices without new evidence
3. keep week 18–19 inventory-history verifier alignment, inventory **`/metrics`** / Grafana table-mirror honesty, readiness Grafana language, and change-validation/vendor dashboard honesty closed by default unless new metrics or APIs justify a deliberate update
4. keep the accepted week 13 identity outcome closed by default; only reopen deterministic or snapshot-scoped readiness/capability item IDs if a concrete later consumer proves the existing anchors insufficient
5. record a **narrow next-slice decision** (see **`platform/docs/decisions/ADR-0001-next-bounded-truth-depth-slice.md`**) before large implementation churn; continue bounded Phase 2 product deepening only where a concrete gain justifies code changes

## Boundary Reminder

Phase transitions should not happen just because files exist.

They should happen only when the foundational architecture is both present and honest enough to support the next class of work without drift.

The project now supports stricter future dry-run planning assessment, but it should still remain fully in `Phase 2 — read-only product foundation` until actual workflow-model, dry-run API, preview or diff, validation-result, and workflow-audit relationship contracts become real.
