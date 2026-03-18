# Platform Roadmap

## Purpose

This document summarizes the platform's phased implementation roadmap.

## Current Status

The project is currently in `Phase 2 — read-only product foundation`.

Most of the week's work has established:

- repository structure
- service boundaries
- topology skeleton
- observability scaffolding
- backend, collector, frontend, and database-direction scaffolding
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

Strongest remaining evidence gap:

- topology truth depth remains the clearest remaining bounded candidate because the live stack already exposes stable topology evidence and the accepted week 14 slice plus the later topology checkpoint closed the narrower pairing-vocabulary and partiality-decomposition lanes end to end; the next smaller follow-on is now node participation coverage inside the current inferred slice so operators can see how many observed nodes are represented by at least one emitted inferred link versus remaining isolated, derived only from the normalized nodes and links already in hand
- policy detail is no longer source-blocked by absent detail-ready evidence, because the current lab now reports `detail_mode=static_policies_when_present`, `empty_reason=none`, `detail_ready_target_count=4`, and 4 normalized live `static_local` records; any policy-first cycle is therefore now justified if it stays collector-first and limited to that proven source shape rather than broadening into unsupported policy types
- workflow implementation, dry-run behavior, and workflow-owned storage remain out of scope, but they are no longer the right immediate planning target for the next cycle either

Bounded next steps:

- preserve `Phase 2 — read-only product foundation` and the `conditionally_ready_with_explicit_limits` operating boundary
- keep the accepted week 13 identity no-change outcome closed unless a later concrete consumer proves the remaining item-level identity gap matters in practice
- keep the accepted week 14 endpoint-pairing implementation outcome closed as well; do not reopen pairing-consumption work across product, observability, tests, or verifier surfaces by default
- keep the completed topology partiality decomposition contract closed as well; only reopen topology code work if there is still a concrete next gain in backend-owned node participation coverage inside the current inferred slice, preferably as linked-versus-isolated observed-node counts derived from the normalized response already in hand
- keep any later policy follow-on constrained to the currently proven live Nokia `static_local` source path unless new collector evidence independently proves another supported detail-ready policy family
- preserve `Phase 2 — read-only product foundation` until workflow records, workflow-owned APIs, and validation outputs are all real

## Recommendation For The Next Bounded Cycle

Recommendation: preserve the week 16 checkpoint and continue bounded Phase 2 product deepening. Do not reopen the completed topology-history, policy-history, history-baseline, or restart-drill work without new evidence.

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
- the accepted week 13 work closed the default identity lane with a documented no-change decision
- the accepted week 14 work closed the endpoint-pairing and single-sided-link coverage gap
- runtime hardening, verification, and the restart drill are now strong enough for the current bounded scope
- the next cycle should stay inside the read-only envelope: keep docs and phase boundaries honest, deepen read-only usefulness without faking completeness, and preserve the service and architecture boundaries already established

The recommended next-cycle slice should stay limited to:

- checkpointing the week 16 result honestly and preserving the current safe-use boundary first
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

Based on the current repo state after the week 16 checkpoint, the next likely work should be:

1. preserve the current `conditionally_ready_with_explicit_limits` operating boundary and keep all near-term work inside the Phase 2 read-only safe-use envelope
2. keep the week 16 topology-history, policy-history, history-baseline, and restart-drill outcomes closed by default; do not reopen those slices without new evidence
3. keep the accepted week 13 identity outcome closed by default; only reopen deterministic or snapshot-scoped readiness/capability item IDs if a concrete later consumer proves the existing anchors insufficient
4. continue bounded Phase 2 product deepening only where a concrete gain justifies code changes; otherwise preserve the current checkpoint

## Boundary Reminder

Phase transitions should not happen just because files exist.

They should happen only when the foundational architecture is both present and honest enough to support the next class of work without drift.

The project now supports stricter future dry-run planning assessment, but it should still remain fully in `Phase 2 — read-only product foundation` until actual workflow-model, dry-run API, preview or diff, validation-result, and workflow-audit relationship contracts become real.
