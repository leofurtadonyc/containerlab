# Policy Truth-Depth Review

## Purpose

This document reviews the current bounded policy truth posture after the week 14
topology checkpoint.

It answers one narrow question.

Should the project begin a bounded policy truth-depth implementation cycle now,
or should policy remain deferred until the live lab exposes stronger source
detail?

This is a review and recommendation note only.

It does not authorize:

- policy implementation by default
- workflow or dry-run work
- broad capability redesign
- fake per-policy truth claims
- multi-vendor expansion claims

## Current Live Evidence Snapshot

The current live stack shows that policy is no longer purely live-empty, but it
is still blocked at aggregate-only truth.

Live runtime evidence from `/api/v1/policies`, `/api/v1/platform/status`,
collector metrics, app-api metrics, and `verify-core-runtime` currently shows:

- `data_status=live`
- `serving_mode=live_collector`
- `sync_status=ok`
- `completeness=partial`
- `detail_mode=counters_only`
- `empty_reason=per_policy_details_unavailable`
- `observed_target_count=34`
- `policy_capable_target_count=34`
- `observed_policy_count=2`
- `active_policy_count=2`
- `static_policy_count=2`
- `count=0`
- `detail_ready_target_count=0`
- per-target `detail_blocker_reason` posture is now exposed through `target_footprints`

The current evidence-confidence summary is therefore honest and important:

- source posture is live observed
- evidence kind is aggregate only
- confidence posture is blocked
- blocked reason is `per_record_detail_unavailable`

That is the real policy checkpoint.

The platform is receiving live policy evidence from all configured targets, and
it can prove aggregate policy presence plus per-target policy footprint.

The platform still cannot derive bounded normalized per-policy records from the
current live source detail.

## Current Repository Posture By Layer

### Collector posture

`gnmi-collector` already computes and exports the current bounded policy trust
signals the platform needs.

It now exposes:

- configured-versus-observed target coverage
- observed policy counts
- per-target policy footprints
- `detail_ready_target_count`
- `detail_mode`
- freshness-window timestamps
- bounded degraded-scope summaries

The remaining collector-side gap is not missing aggregate vocabulary.

The remaining gap is that the live path still cannot derive stable bounded
detail records from the currently observed policy evidence.

### Backend posture

`app-api` already preserves the right policy semantics for the current slice.

It now distinguishes:

- `no_policies_observed`
- `per_policy_details_unavailable`
- live collector serving versus persisted fallback
- aggregate counts versus normalized record counts
- bounded current-versus-persisted and persisted-versus-previous comparison
  posture

The backend is not the current bottleneck.

It is already expressing the stop line honestly.

### WebUI posture

`app-web` now renders the important policy trust cues the current backend
exposes, including the sharper per-target blocker slice added after the initial
review.

It now makes visible:

- live-empty posture when real
- detail-limited posture when real
- aggregate-only evidence posture
- persisted fallback posture
- coverage gaps between observed policies and detailed records
- per-target `detail_blocker_reason` posture for each exposed target footprint
- comparison posture without claiming drift or workflow truth

That means the product now explains the current stop line more directly, but it
does not change the truth boundary that still blocks deeper policy work.

### Grafana posture

The SR policy dashboard already behaves as observability, not product logic.

It shows:

- policy ingestion health
- observed-versus-detailed policy gaps
- target coverage gaps
- detail-ready target share and blocker-presence flags that mirror the same
  bounded blocker posture numerically
- backend-versus-collector deltas
- bounded evidence-posture signals

Per-target blocker reason codes still belong to the product and verifier until
they exist as durable metric labels. That is still the right role boundary.

### Verifier posture

`verify-core-runtime` already checks the important runtime policy signals.

On the current live stack it now emits the bounded notices that matter:

- zero policy detail-ready targets
- `detail_mode=counters_only`
- per-target blocker reasons such as `per_policy_details_unavailable` when the
  live response exposes them

It no longer reports `no_policies_observed` on the current deployment because
the live lab now shows observed policies.

That is an important change in evidence, not in phase.

## Assessment

### Policy truth maturity

Posture: `aggregate_evidence_is_real_but_per_policy_truth_is_still_blocked`

Reasoning:

- the live stack now observes real policy presence rather than only a live-empty
  posture
- the platform sees `observed_policy_count=2` and `static_policy_count=2`
- all configured policy-capable targets are still being observed successfully
- the current backend and product already preserve the difference between
  aggregate presence and bounded per-policy truth
- the live stack still reports `detail_mode=counters_only`,
  `empty_reason=per_policy_details_unavailable`, `count=0`, and
  `detail_ready_target_count=0`

Conclusion:

- policy is not blocked by missing product semantics
- policy is blocked by missing derivable per-policy source detail on the current
  live path

### Recommendation posture

Posture: `no_go_for_immediate_policy_implementation_but_define_one_conditional_follow_on`

Reasoning:

- the review does not justify immediate backend, frontend, Grafana, or verifier
  redesign, because those layers already expose the bounded policy stop line
  honestly
- the smallest honest next policy slice would have to begin at the live source
  evidence boundary, not at the product-presentation boundary
- starting policy implementation now without stronger detail-ready evidence
  would risk building against counters and footprints rather than against real
  normalized policy records

Conclusion:

- do not begin a default policy implementation cycle now
- do preserve one tightly bounded future candidate, but reopen it only when the
  current live path proves it can produce real bounded policy records

## Exact Prerequisites For Any Later Policy Cycle

Any later bounded policy truth-depth cycle should require all of the following.

1. The live lab must expose enough source detail for at least one supported
   policy type to yield nonzero bounded normalized policy records.
2. `detail_ready_target_count` must become nonzero on the live collector path.
3. `/api/v1/policies` must move beyond `count=0` for the live slice, not only
   for persisted fallback.
4. The derived records must preserve the current honesty boundary: bounded
   static or other explicitly supported policy types only, with no claim of full
   SR policy truth.
5. The cycle must start by proving the collector-source path, not by widening
   WebUI or Grafana semantics that are already present.

## Smallest Honest Future Candidate If Those Prerequisites Become True

If the prerequisites above become true later, the smallest honest future policy
follow-on would be:

- one bounded collector-first truth-depth slice that converts already-exposed
  live source detail for one supported policy type into nonzero normalized
  policy records
- backend propagation only where required to carry those real new records
  through the existing contract
- minimal WebUI, dashboard, and verifier adjustments only if the existing
  bounded semantics cannot already present that new evidence honestly

That would still remain inside `Phase 2`.

It would not justify:

- BGP-signaled policy truth claims
- workflow or pre-change intelligence semantics
- multi-vendor policy parity claims
- broader policy redesign

## Anti-Goals

The following should not happen next.

- do not start policy implementation just because policy remains a known weak
  slice
- do not treat aggregate counters as if they were stable per-policy records
- do not widen the backend, WebUI, or Grafana semantics before the collector
  path can actually derive bounded policy records
- do not infer missing policy truth from `observed_policy_count` alone
- do not relabel this review as permission to leave `Phase 2`
- do not treat policy comparison surfaces as proof of workflow-grade policy
  intelligence

## Conservative Bottom Line

The current review does not support immediate policy implementation.

It does support a clearer checkpoint:

- policy is no longer purely live-empty on the current lab
- policy remains aggregate-only and explicitly blocked at per-policy truth
- the blocker posture is now surfaced more directly in product, verifier, and
  observability without changing the truth boundary
- the next honest policy move is conditional on nonzero detail-ready source
  evidence, not on more product semantics

That means the project should keep policy deferred for now, preserve the week 14
topology checkpoint, and only reopen one bounded policy truth-depth slice when
the live collector path can produce real normalized policy records.