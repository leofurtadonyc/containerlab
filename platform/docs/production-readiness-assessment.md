# Bounded Production Readiness Assessment

## Purpose

This document gives a strict readiness assessment for the current platform in
its active `Phase 2 - read-only product foundation` role.

It answers one narrow question.

Is the current platform ready for routine bounded operational use in the job it
was meant to do first.

It does not authorize:

- a phase change
- workflow implementation
- dry-run implementation
- broad production-marketing language
- claims of full topology, policy, or lifecycle truth

## Verdict

Verdict: `conditionally_ready_with_explicit_limits`

The platform is ready for routine bounded operational use only when it is used
as a read-only product slice for platform health, inventory visibility, bounded
topology visibility, bounded policy visibility, anchored comparison context,
bounded sync-derived history, and readiness-support interpretation.

It is not ready to be treated as:

- full network truth
- workflow-grade history or lifecycle state
- a dry-run or validation system
- a full production-operations program

## Evidence Basis

This assessment is grounded in the current repository state plus live runtime
evidence gathered from the running platform on `2026-03-14`.

### Live runtime verification

- `./scripts/verify-core-runtime.sh` passed for the current deployment
- `./scripts/verify-odl-auth.sh` passed for the bounded ODL helper path
- `docker ps` showed healthy runtime state for `postgres`, `prometheus`,
  `grafana`, `gnmi-collector`, `app-api`, and `app-web`; `odl` was running and
  its bounded auth path also passed the explicit verification script

### Live API posture

- `/api/v1/devices` reported `data_status=live`,
  `serving_mode=live_collector`, `count=34`, and an explicit
  `comparison_snapshot_id`
- `/api/v1/topology` reported `data_status=live`,
  `serving_mode=live_collector`, `completeness=partial`, and an explicit
  `comparison_snapshot_id`
- `/api/v1/policies` reported `data_status=live`,
  `serving_mode=live_collector`, `completeness=partial`,
  `detail_mode=counters_only`, `empty_reason=no_policies_observed`, `count=0`,
  an explicit `comparison_snapshot_id`, and explicit persisted anchor IDs on
  the previous-snapshot comparison surface
- `/api/v1/capabilities` reported `data_status=bounded_matrix`, `count=13`,
  `planning_readiness=readiness_planning_supported`,
  `phase_recommendation=remain_phase_2_read_only_foundation`, and an explicit
  `readiness_snapshot_id`
- `/api/v1/workflow-history` reported `data_status=persisted_activity_history`,
  `count=50`, and current records carrying explicit `workflow_id` plus embedded
  persisted comparison anchors where they exist
- `/api/v1/audit-history` reported `data_status=persisted_activity_history`,
  `count=51`, synthesized `event_id` values correlated back to stronger
  underlying IDs, and explicit embedded persisted comparison anchors where they
  exist

### Documentation and operational-boundary evidence

The current repository now explicitly documents:

- the repo-owned build, deploy, replace, and verify path
- the stop line when verification fails
- healthy-state interpretation and first-response troubleshooting
- the durability boundary for Postgres, Prometheus, and Grafana host-backed
  data
- restart and redeploy expectations
- safe-use versus unsafe-claim boundaries for the current slice

## Assessment By Area

### Anchor identity maturity

Posture: `sufficient_for_bounded_operations_but_not_workflow_grade`

Why this is strong enough now:

- persisted-backed comparison surfaces now expose explicit snapshot anchors
- readiness-support surfaces expose the persisted readiness anchor
- current workflow-history and audit-history responses now expose stronger
  underlying sync-run or persisted comparison anchors where those records exist
- the product surfaces now expose those anchors or anchor-presence cues as
  trust signals rather than hiding them behind timestamps alone

Why this is still bounded:

- non-persisted readiness items and capability items still do not have
  citation-grade item identities
- projection envelopes such as workflow-history and audit-history remain
  read-only views, not workflow-owned source records
- current history ordering remains bounded post hoc source chronology or
  presentation order rather than workflow-grade chronology

Assessment:

- strong enough for routine read-only interpretation of persisted-backed
  evidence surfaces
- not strong enough for workflow-grade citation, lifecycle reasoning, or
  execution semantics

### Deployment maturity

Posture: `good_for_repo_owned_repeatable_deployments`

Why this is strong enough now:

- the platform deploys from repo-built images owned by the repository
- the documented build and deploy flow has been rerun successfully on the live
  stack
- the runbook now defines a strict operator flow with an explicit verification
  stop line

Why this is still bounded:

- this is not yet a full production deployment program with secret rotation,
  TLS, orchestrated rollback, automated backup, or restore drills
- current reproducibility is strong at the software and topology-shape layer,
  not at the prior-runtime-data recreation layer

Assessment:

- ready for routine repo-owned rebuild, replace, and verify cycles
- not ready to be described as fully hardened production deployment machinery

### Runtime maturity

Posture: `good_for_the_current_phase2_slice`

Why this is strong enough now:

- packaged startup contracts exist for the key repo-built services
- Docker health checks now cover the main app services plus the three support
  services used by the current slice
- collector, backend, frontend, metrics, persistence, and observability all
  participate in the verified runtime contract
- the bounded ODL helper path has an explicit auth verification step that now
  passes on the live stack

Why this is still bounded:

- ODL remains a bounded helper rather than a first-class truth source
- the current runtime slice does not include broader production controls such
  as TLS, secret-management discipline, HA, or automated recovery

Assessment:

- operationally usable for the current read-only product slice
- not equivalent to full operational hardening across a broader production
  platform program

### Post-deploy verification maturity

Posture: `strong_for_current_contract_validation`

Why this is strong enough now:

- `verify-core-runtime` checks startup contracts, support-service health,
  collector metrics, WebUI proxy health, read-side API contract presence,
  dashboard-critical metric families, and Prometheus target posture
- `verify-odl-auth` validates the configured ODL credential path and rejects
  the default fallback
- degraded but honest states such as partial topology or live-empty policy
  posture are surfaced as bounded notices instead of being hidden

Why this is still bounded:

- verification proves contract presence and runtime posture, not full business
  correctness or full data completeness
- verification does not transform bounded partial truth into validation-grade
  truth

Assessment:

- strong enough to gate routine deploy and redeploy decisions for the current
  slice
- not strong enough to be mistaken for network validation, policy validation,
  or workflow correctness testing

### Durability and recovery clarity

Posture: `operationally_clear_but_intentionally_partial`

Why this is strong enough now:

- the runbook, installation guide, backend docs, and Postgres docs now state
  clearly what survives restart or replacement in the same workspace
- the repo-owned rebuild boundary is explicitly separated from historical-data
  survival
- operators now have clear guidance on when persisted history, readiness, and
  observability state will remain available

Why this is still bounded:

- repo files do not recreate prior Postgres read-side history, Prometheus TSDB
  history, or Grafana local state by themselves
- the current slice still lacks backup automation, restore automation, and
  disaster-recovery discipline

Assessment:

- clear enough for honest bounded operations
- not strong enough for disaster-recovery or full production resilience claims

### Truth maturity

Posture: `mixed_and_explicitly_bounded`

Current strengths:

- inventory is live and useful for the current Nokia-first slice
- topology is live and operationally useful, but explicitly partial
- policy surfaces preserve honest aggregate and per-target footprint evidence,
  even when the current lab has no observed SR policies
- persisted comparison and bounded history surfaces now expose stronger anchor
  identity where underlying records exist

Current limits:

- topology remains partial by design and must not be treated as complete
  topology truth
- policy remains partial, aggregate-heavy, and currently live-empty for actual
  observed SR policy items in the present lab
- workflow-history and audit-history remain sync-derived or readiness-derived
  platform history, not workflow lifecycle or operator-activity truth
- readiness and capability surfaces remain planning-support truth, not
  execution truth

Assessment:

- truth is strong enough for bounded read-only interpretation
- truth is not strong enough for full pre-change reasoning, validation
  conclusions, or workflow-grade accountability

### Trust-cue maturity

Posture: `good_for_routine_operator_interpretation`

Why this is strong enough now:

- Overview and Platform Health now surface freshness, serving posture, anchor
  posture, evidence basis, observation coverage, and degraded scope more
  clearly
- topology, policy, readiness, workflow-history, and audit-history views now
  expose stronger trust and anchor cues where the backend supports them
- trust cues are now aligned better with actual backend truth posture rather
  than generic UI reassurance

Why this is still bounded:

- trust cues help operators interpret evidence correctly, but they do not
  substitute for deeper topology or policy truth
- the UI remains a bounded read-only product, not a validation engine or a
  workflow console

Assessment:

- strong enough to support routine use without overclaiming certainty
- not a replacement for stronger source truth that does not yet exist

## What The Platform Is Safe To Be Used For Now

The current platform is safe to use for the following bounded jobs.

- routine read-only monitoring of current platform service posture, collector
  posture, backend posture, and observability posture
- routine read-only visibility into the current live inventory slice for the
  onboarded Nokia-first lab topology
- routine read-only visibility into the current bounded topology slice, with
  explicit acceptance that it is partial rather than complete
- routine read-only visibility into the current bounded policy slice,
  especially aggregate coverage, per-target footprint posture, live-empty
  versus persisted context, and bounded current-versus-persisted comparison
  signals
- routine use of persisted anchors, comparison anchors, sync-run anchors, and
  readiness anchors where the backend now exposes them
- routine use of the repo-owned rebuild, redeploy, and verification flow for
  the current workspace and host-backed runtime
- routine use of capabilities and readiness as descriptive planning-support
  context only

## What Remains Outside Safe Use

The current platform is not yet safe to use for the following jobs.

- full topology truth, full policy truth, or network-validation conclusions
- pre-change safety reasoning that depends on complete topology or policy truth
- workflow execution, approvals, rollback, or any action-oriented lifecycle
- dry-run, preview, diff, or validation-result behavior
- treating workflow-history or audit-history as workflow-grade lifecycle,
  approval, rollback, or operator-accountability history
- repo-only recreation of prior runtime data after Postgres, Prometheus, or
  Grafana host-backed state has been lost
- full production-operations claims around HA, backup automation, restore
  automation, TLS, or broader secret-management maturity

## Strict Operating Conditions

This verdict holds only if the following conditions remain true.

- the platform remains in `Phase 2 - read-only product foundation`
- deploys continue to use the documented repo-owned image-build and topology
  flow
- `./scripts/verify-core-runtime.sh` passes before the platform is treated as
  ready for routine use
- `./scripts/verify-odl-auth.sh` passes whenever the bounded ODL helper path is
  part of the expected posture
- operators continue to interpret topology and policy surfaces using the
  documented partial-truth and bounded-detail semantics rather than full-truth
  assumptions
- historical recovery expectations remain bounded to cases where the host-backed
  data directories survive

## Bottom Line

The current platform has crossed the threshold for routine bounded operational
use in the exact role it was meant to do first: a read-only product for current
platform posture, inventory visibility, bounded topology and policy visibility,
bounded persisted comparison context, bounded sync-derived history, and
readiness-support interpretation.

It has not crossed the threshold for full production claims, workflow-grade
truth, dry-run behavior, validation conclusions, or durable recovery claims
beyond the documented host-backed persistence boundary.