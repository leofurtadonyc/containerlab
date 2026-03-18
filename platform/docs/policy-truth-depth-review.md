# Policy Truth-Depth Review

## Purpose

This document reassesses the current bounded policy truth posture after the
earlier aggregate-only checkpoint.

It answers one narrow question.

Can the current collector-first live path now produce nonzero detail-ready
policy targets for any supported policy type, and if so, does that justify a
later bounded policy truth-depth cycle?

This is a review and recommendation note only.

It does not authorize:

- workflow or dry-run work
- broad policy redesign
- fake per-policy truth claims
- Juniper or multi-vendor policy parity claims
- any phase change beyond `Phase 2`

## Current Live Evidence Snapshot

The current live stack now proves a narrow but real detail-ready policy slice.

Live runtime evidence from the collector, backend, metrics, and the documented
runtime verifier currently shows:

- collector `/policies/snapshot` reports `delivery_status=live_ready`
- collector `/policies/snapshot` reports `observed_target_count=34`
- collector `/policies/snapshot` reports `policy_count=4`
- collector `/policies/snapshot` reports `static_policy_count=4`
- collector `/policies/snapshot` reports `detail_ready_target_count=4`
- collector `/policies/snapshot` now exposes `detail_source_readiness.posture=partially_ready`
- collector `/policies/snapshot` now exposes `detail_source_readiness.no_policies_observed_target_count=30`
- collector `/policies/snapshot` now exposes `detail_source_readiness.detail_unavailable_target_count=0`
- collector `/policies/snapshot` now exposes `detail_source_readiness.partial_detail_target_count=0`
- collector `/policies/snapshot` shows 4 target footprints with `detail_blocker_reason=none`
- collector `/policies/snapshot` shows 30 target footprints with `detail_blocker_reason=no_policies_observed`
- backend `/api/v1/policies` reports `data_status=live`
- backend `/api/v1/policies` reports `serving_mode=live_collector`
- backend `/api/v1/policies` reports `detail_mode=static_policies_when_present`
- backend `/api/v1/policies` now exposes the same bounded `detail_source_readiness` slice from the collector-first path
- backend `/api/v1/policies` reports `empty_reason=none`
- backend `/api/v1/policies` reports `count=4`
- backend `/api/v1/policies` reports `evidence_kind=aggregate_plus_bounded_records`
- backend `/api/v1/policies` reports `confidence_posture=bounded_partial`
- backend `/api/v1/platform/status` reports `policy_capable_target_count=34` and `detail_ready_target_count=4` on the policy read path
- collector metrics report `platform_gnmi_collector_policy_detail_ready_targets 4`
- collector metrics now expose a low-cardinality `platform_gnmi_collector_policy_detail_source_readiness` posture plus `platform_gnmi_collector_policy_detail_source_targets{reason=...}` counts
- backend metrics report `platform_app_api_policy_snapshot_status{data_status="live",serving_mode="live_collector",sync_status="ok",completeness="partial",detail_mode="static_policies_when_present",empty_reason="none"} 1`
- backend metrics now expose the same bounded `platform_app_api_policy_detail_source_readiness` posture and `platform_app_api_policy_detail_source_targets{reason=...}` counts
- `verify-core-runtime` now passes and emits the bounded notice that some targets remain `no_policies_observed`; it no longer warns about zero detail-ready targets

The current live normalized records are also concrete.

The backend currently exposes 4 live normalized policy records, all with:

- `policy_type=static_local`
- `support_state=supported`
- `source_target_role=pe`
- source targets `PE1`, `PE2`, `PE3`, and `PE4`

That is the new checkpoint.

The platform is no longer limited to aggregate-only policy evidence on the live
slice.

It now has one supported detail-ready policy shape with nonzero normalized live
records.

## Current Source Detail By Layer

### Collector posture

`gnmi-collector` is still the gating layer.

The live policy source path currently combines:

- Nokia `nokia-state` SR policy counters from `/state/router[router-name=Base]/segment-routing/sr-policies`
- Nokia `nokia-state` runtime `sr-path` payloads discovered in that same subtree
- Nokia `nokia-conf` static-policy detail from `/configure/router[router-name=Base]/segment-routing/sr-policies/static-policy`

The collector then derives:

- aggregate policy counts
- per-target policy footprints
- `detail_ready_target_count`
- one bounded `detail_source_readiness` slice that separates live-empty targets from detail-unavailable or partially covered source-visible targets
- normalized bounded policy records where the source detail is strong enough

The current live evidence proves that this collector-first path can now derive
bounded normalized records for Nokia `static_local` policies.

### Backend posture

`app-api` is carrying the stronger live policy evidence honestly.

It now exposes:

- live collector serving for the current policy slice
- `detail_mode=static_policies_when_present`
- explicit bounded `detail_source_readiness` posture and reason counts
- `empty_reason=none`
- 4 normalized live records on the current response
- aggregate-plus-bounded-records evidence posture
- explicit per-target blocker posture for the remaining live-empty targets

The backend is not inventing broader truth.

It still keeps the bounded stop line explicit through `bounded_partial`
confidence posture and through target footprints that remain
`no_policies_observed` on 30 targets.

### Product and observability posture

The product and observability layers are no longer the gating issue.

`app-web`, Grafana, and `verify-core-runtime` are already able to present the
collector or backend truth cues that matter:

- some targets are genuinely detail-ready
- many targets remain healthy live-empty
- the current detail-ready slice is bounded rather than broad policy truth

That means the gating question has moved back to source detail scope, not UI
wording.

The repository can now explain that scope more precisely than before.

For the current live checkpoint, the stronger instrumentation says:

- posture is `partially_ready`
- 4 targets are detail-ready
- 30 source-visible targets are still `no_policies_observed`
- 0 current targets are in the bounded `detail_unavailable` bucket
- 0 current targets are in the bounded `partial_detail` bucket

That is stronger than the older checkpoint because the repository no longer has
to infer whether zero or partial coverage comes from source absence or source
detail limits.

## What Source Detail Is Actually Available Now

The current lab now proves the following live source-detail availability.

### Proven now

- nonzero detail-ready policy targets exist on the live collector path
- nonzero live normalized policy records exist on the current backend response
- the proven record family is Nokia `static_local`
- the proven current live targets are `PE1`, `PE2`, `PE3`, and `PE4`
- the current collector path can correlate static-policy config detail with live SR policy counters and runtime state strongly enough to surface bounded records

### Not proven now

- live normalized detail for `static_non_local` policies is not yet proven by the current checkpoint
- live normalized detail for BGP-signaled SR policy is not yet proven by the current checkpoint
- broad per-target detail coverage is not present, because 30 targets still report `no_policies_observed`
- any Juniper or broader multi-vendor policy detail path remains out of scope

## Assessment

### Policy truth maturity

Posture: `narrow_detail_ready_policy_truth_now_exists`

Reasoning:

- the collector now proves nonzero detail-ready targets on the live path
- the backend now serves nonzero live normalized policy records
- the current record family is explicit and bounded rather than inferred from counters alone
- the product continues to preserve live-empty targets and bounded evidence posture honestly

Conclusion:

- policy is no longer source-blocked at aggregate-only truth
- policy is now source-proven for one narrow supported live shape only

### Recommendation posture

Posture: `go_for_one_bounded_collector_first_policy_cycle`

Reasoning:

- the old `no_go` checkpoint is no longer honest because the live collector path now yields nonzero detail-ready targets and nonzero normalized live records
- the proven source shape is narrow enough that a follow-on can stay bounded and collector-first
- the remaining risk is overreading this proof into unsupported policy types or broad policy parity, not lack of any detail-ready source evidence

Conclusion:

- a later bounded policy truth-depth cycle is now justified
- that cycle must stay explicitly limited to the currently proven Nokia `static_local` live path unless new source evidence appears

## Concrete Prerequisites For Any Later Detail-Ready Policy Follow-On

Any later bounded policy cycle should require all of the following.

1. Keep the scope collector-first and limited to the currently proven Nokia `static_local` source path unless new live evidence independently proves another policy type.
2. Preserve live proof in the runtime contract: the collector and backend must continue to expose nonzero `detail_ready_target_count` and nonzero live normalized `count` for the bounded slice.
3. Preserve the current honesty split between detail-ready targets and healthy live-empty targets; `no_policies_observed` must remain explicit for the 30 targets that are not currently part of the detail-ready slice.
4. Do not generalize the current proof into `static_non_local`, BGP-signaled SR policy, Juniper, or broad multi-vendor policy truth without separate live source evidence.
5. Start any later work at the collector and mapping boundary, then propagate only the real new detail through backend contracts, product views, dashboards, and verifier surfaces as needed.

## Smallest Honest Future Candidate

The smallest honest future policy candidate is now:

- one bounded collector-first policy truth-depth slice limited to the currently proven Nokia `static_local` live path
- backend propagation only where additional proven source detail needs to be surfaced beyond the current 4 normalized live records
- minimal product, dashboard, and verifier changes only when the existing bounded semantics cannot already present that new detail honestly

That future slice would still remain inside `Phase 2`.

It would still not justify:

- broad policy redesign
- workflow or pre-change intelligence semantics
- BGP-signaled policy truth claims
- static-non-local policy truth claims without new source proof
- multi-vendor policy parity claims

## Anti-Goals

The following should not happen next.

- do not treat the current `static_local` proof as permission to claim broad per-policy truth everywhere
- do not infer missing policy truth from counters alone on targets that still report `no_policies_observed`
- do not widen the backend, WebUI, or Grafana semantics ahead of the collector evidence boundary
- do not relabel this review as permission to leave `Phase 2`
- do not turn this checkpoint into capability redesign, workflow planning, or vendor-parity work

## Persisted Policy History Source-Readiness

Policy snapshot persistence now carries source-readiness posture and supporting counts
so operators can tell whether supported policy detail coverage improved or regressed
over time.

When policy snapshots are persisted, the backend stores:

- `detail_source_readiness_posture` (e.g. `partially_ready`, `no_policies_observed`)
- `detail_ready_target_count`
- `no_policies_observed_target_count`
- `detail_unavailable_target_count`
- `partial_detail_target_count`

These fields flow through:

- `/api/v1/policies` history `recent_snapshots` and `comparison_to_previous`
- workflow-history and audit-history policy snapshot summaries and comparisons

Scope remains strictly collector-first and limited to the proven Nokia `static_local`
slice. These are coverage and trust cues, not validation verdicts or workflow semantics.

## Conservative Bottom Line

The current review lands on a narrow `go`, not on the old aggregate-only `no-go`.

The exact checkpoint is now:

- the live collector path proves 4 detail-ready targets and 4 normalized live policy records
- the proven detail-ready record family is Nokia `static_local`
- 30 targets still remain explicitly `no_policies_observed`
- broader policy truth beyond that current `static_local` slice remains intentionally partial and still requires new live source evidence

That means the repository now has one unambiguous policy checkpoint:

- go for one bounded collector-first future policy cycle if it stays inside the proven `static_local` source boundary
- no-go for any broader policy truth claims until new live evidence proves them