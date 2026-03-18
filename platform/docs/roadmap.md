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

## Updated Phase 2 Checkpoint Assessment

The current evidence supports a stricter checkpoint conclusion after the accepted
week 13 and week 14 work.

Current maturity by area:

- runtime and verification maturity: strong for the current Phase 2 scope, because repo-built images, startup-contract validation, targeted pytest, and the live `verify-core-runtime` plus `verify-odl-auth` flow now prove the bounded runtime, read-path, and roadmap-posture contracts end to end
- identity maturity: sufficient for bounded operations, because persisted and response-level anchors are explicit where real records exist and the accepted week 13 review closed the default capability item-ID lane with a documented no-change outcome
- read-path maturity: mixed, because inventory is strong enough for routine bounded use, topology pairing semantics are now materially stronger after the accepted week 14 work but topology still remains the weakest current live slice due to partial completeness and still-coarse degraded-scope interpretation, and policy is now stronger than the earlier aggregate-only checkpoint because the current lab exposes 4 detail-ready targets and 4 normalized live `static_local` records even though broader policy truth remains intentionally partial
- history maturity: mixed for read-side evidence but still blocked for workflow implementation, because workflow-history and audit-history now include bounded persisted context and anchors but still do not provide durable workflow lifecycle or operator-action history
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

Recommendation: keep any next topology cycle limited to one backend-owned node
participation coverage follow-on inside the current inferred slice, and only
implement it later if a concrete truth-depth gain still justifies code changes.

Interpret that recommendation narrowly.

- keep the project fully in `Phase 2 — read-only product foundation`
- do not reopen item-identity implementation by default
- do not reopen the accepted week 14 endpoint-pairing slice by default
- do not reopen the already-implemented partiality decomposition by default
- do not start workflow implementation, dry-run implementation, or any phase transition work
- keep the backend as the brain, the WebUI as the product, Grafana as the observability layer, and ODL bounded

Why this is the right next-cycle focus:

- the accepted week 13 work closed the default identity lane with a documented no-change decision rather than exposing a new must-build contract gap
- the accepted week 14 work closed the narrower endpoint-pairing and single-sided-link coverage gap across collector, backend, product, observability, tests, and verifier behavior rather than leaving that slice as a pending recommendation
- the smaller topology partiality decomposition contract is no longer a pending recommendation; it is already implemented in the current backend, product, observability, test, and verifier surfaces, so the next cycle no longer needs another semantics pass in this area
- runtime hardening and verification are now strong enough for the current bounded scope and are no longer the primary bottleneck
- topology still exposes the clearest remaining live truth gap, but the honest next question is no longer whether to add pairing vocabulary or partiality decomposition; those are already complete, and the narrower remaining step is whether the backend should expose node participation coverage inside the inferred slice from the evidence already in hand, while policy is now eligible for one bounded collector-first follow-on only if it stays limited to the currently proven Nokia `static_local` source path

The recommended next-cycle slice should stay limited to:

- checkpointing the accepted week 14 result honestly and preserving the current safe-use boundary first
- reopening topology only if a concrete follow-on remains after that checkpoint review
- if reopened, tightening only node participation coverage inside the current inferred slice so the product can state how many observed nodes are linked versus isolated without widening topology truth claims

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

Based on the current repo state, the next likely work should be:

1. preserve the current `conditionally_ready_with_explicit_limits` operating boundary and keep all near-term work inside the Phase 2 read-only safe-use envelope
2. keep the accepted week 13 identity outcome closed by default; only reopen deterministic or snapshot-scoped readiness/capability item IDs if a concrete later consumer proves the existing anchors insufficient
3. treat backend-owned node participation coverage inside the inferred slice as the only justified topology reopening in this area, and only implement it later if the concrete next gain is still explicit linked-versus-isolated observed-node coverage rather than any repeat of the completed week 14 pairing or partiality-consumption work; otherwise preserve the current checkpoint and continue bounded Phase 2 product deepening elsewhere

## Boundary Reminder

Phase transitions should not happen just because files exist.

They should happen only when the foundational architecture is both present and honest enough to support the next class of work without drift.

The project now supports stricter future dry-run planning assessment, but it should still remain fully in `Phase 2 — read-only product foundation` until actual workflow-model, dry-run API, preview or diff, validation-result, and workflow-audit relationship contracts become real.
