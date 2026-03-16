# Topology Truth-Depth Review

## Purpose

This note reviews the current topology truth-depth gap end to end for the active
`Phase 2 - read-only product foundation` cycle.

It is intentionally evidence-based.

It describes what the repository already does today across:

- `gnmi-collector`
- `app-api`
- `app-web`
- Prometheus and Grafana observability
- `verify-core-runtime.sh`
- current platform docs

It does not authorize code changes by itself.

The implemented field, metric, and UI-separation contract for the accepted week
14 slice now lives in
`platform/schemas/topology/topology-read-path-coverage-semantics.md`.

That design note now does two things.

First, it records the completed week 14 pairing vocabulary and ownership split
for endpoint pairing, single-sided inferred-link posture, product trust cues,
Grafana numeric projections, and verifier behavior.

Second, it defines the next narrower follow-on contract for decomposing topology
partiality into inference-boundedness, endpoint-coverage limits, and collection
degradation without reopening the completed pairing work.

## Review Scope

This review inspected the current topology path in these files.

Collector and mapping:

- `platform/gnmi-collector/src/gnmi_collector/mappings/topology.py`
- `platform/gnmi-collector/src/gnmi_collector/services/topology.py`
- `platform/gnmi-collector/src/gnmi_collector/models/topology.py`
- `platform/gnmi-collector/tests/test_collector.py`

Backend integration and product contract:

- `platform/app-api/src/app_api/integrations/collector/topology.py`
- `platform/app-api/src/app_api/services/topology.py`
- `platform/app-api/src/app_api/services/platform.py`
- `platform/app-api/src/app_api/schemas/topology.py`
- `platform/app-api/src/app_api/metrics/state.py`
- `platform/app-api/tests/test_app.py`

WebUI product surfaces:

- `platform/app-web/src/features/topology/view.tsx`
- `platform/app-web/src/features/overview/view.tsx`
- `platform/app-web/src/features/platform-health/view.tsx`

Observability and verification:

- `platform/grafana/dashboards/topology/topology-overview.json`
- `platform/docs/dashboards.md`
- `platform/scripts/verify-core-runtime.sh`

Current recommendation and architecture docs:

- `platform/docs/workflow-next-step-recommendation.md`
- `platform/docs/roadmap.md`
- `platform/docs/architecture.md`
- `platform/docs/data-flows.md`

No collector, backend, frontend, dashboard, or verifier code was changed as part
of this review task.

## Current Fact Pattern

### 1. Collector mapping is already honest about inference and partiality

Current collector behavior is strong enough in four important ways.

First, topology nodes and links are normalized before they cross into
`app-api`. The collector does not leak raw Nokia payloads into the product
contract.

Second, link inference is explicit and simple. In
`platform/gnmi-collector/src/gnmi_collector/mappings/topology.py`:

- `_extract_peer_name()` infers a peer only from interface names that start with
  `to-`
- `map_topology_links()` groups evidence by sorted endpoint pair
- a link becomes `single_sided` implicitly when fewer than two endpoint records
  are seen for the pair
- link attributes preserve `knowledge_state=partial`, `inference_method`,
  `endpoint_evidence_count`, and `observed_interfaces`

Third, `platform/gnmi-collector/src/gnmi_collector/services/topology.py`
already promotes the main coverage signals into the delivery envelope and flow
summary:

- configured target count
- observed target count
- success, partial, and failure counts
- freshness window
- normalized node and link counts
- `endpoint_pairing_posture`
- `paired_link_count`
- `single_sided_link_count`
- `degraded_scope_summary`
- `completeness=partial`

Fourth, collector tests already pin the current topology shape in
`platform/gnmi-collector/tests/test_collector.py`, including:

- `link_count == 17`
- `sync_source == "gnmi_collector_topology_interface_inference"`
- `completeness == "partial"`
- `platform_gnmi_collector_topology_single_sided_links`

That means the collector path is not vague. It already exposes the right class
of bounded evidence for a Phase 2 topology slice.

### 2. The original endpoint-pairing gap was narrower than a generic topology gap

The weakest week 14 seam was never that the repo lacked topology evidence in
general.

It was that the current inferred topology slice needed endpoint-pairing depth to
be made explicit and backend-owned rather than left mostly implicit in naming-
driven attributes.

That narrower gap is now closed.

The current contract now exposes:

- per-link `endpoint_pairing_state`
- per-link `endpoint_evidence_count`
- aggregate `endpoint_pairing_posture`
- numeric `paired_link_count`
- numeric `single_sided_link_count`

That means the remaining topology truth question is now broader but still
bounded: whether the current Phase 2 model explains node participation inside
the inferred slice clearly enough, not whether it still needs the week 14
pairing vocabulary or the now-implemented partiality decomposition itself.

The next honest target is therefore not another semantics pass.
It is one backend-owned node participation coverage follow-on that keeps the
completed pairing and partiality work intact while exposing the smallest
remaining gap the current evidence can support honestly:

- `linked_node_count`: observed nodes represented by at least one emitted
  inferred link
- `isolated_node_count`: observed nodes that are present in the normalized
  topology response but not represented by any emitted inferred link

### 3. Backend contracts preserve the bounded topology model correctly

The backend keeps the architecture boundaries intact.

In `platform/app-api/src/app_api/integrations/collector/topology.py`, the
collector boundary is typed and bounded. The client accepts normalized topology
records plus coverage, freshness, degraded-scope, and completeness fields.

In `platform/app-api/src/app_api/services/topology.py`, the backend then:

- maps collector payloads into backend-owned `TopologyNode` and `TopologyLink`
  models
- preserves `serving_mode` as `live_collector`, `persisted_fallback`, or
  `empty_scaffold`
- keeps `completeness` explicit
- exposes bounded comparison to the latest persisted snapshot
- sets `evidence_confidence.evidence_kind` to `observed_plus_inferred`
  instead of overstating certainty

In `platform/app-api/src/app_api/services/platform.py`, the platform-status path
also preserves topology read-path signals as product-owned status:

- coverage counts
- freshness window
- `endpoint_pairing_posture`
- `paired_link_count`
- `single_sided_link_count`
- `degraded_scope_summary`

This is strong enough for Phase 2 because the backend remains the brain and the
topology contract remains normalized, typed, and read-only.

### 4. The product now distinguishes dedicated topology trust cues from summary cues correctly

The topology product surface is strongest on the dedicated page.

In `platform/app-web/src/features/topology/view.tsx`, the dedicated topology page
now exposes:

- backend-owned `coverage_summary.endpoint_pairing_posture`
- backend-owned `paired_link_count` and `single_sided_link_count`
- per-link `endpoint_pairing_state` and `endpoint_evidence_count`
- inference readout and freshness readout
- comparison anchor and comparison posture
- link evidence distribution
- selected-link and selected-node detail
- explicit callouts for stale, blocked, partial, and bounded endpoint-pairing posture

That page already behaves like a proper Phase 2 product surface: evidence-rich,
read-only, and explicit about limits.

The broader summary pages are intentionally coarser.

In `platform/app-web/src/features/overview/view.tsx`, topology trust cues surface:

- serving mode
- freshness posture
- target coverage
- collection posture
- freshness window
- evidence basis
- completeness
- degraded scope
- comparison anchor

Overview now also surfaces endpoint-pairing posture and paired-versus-single-
sided counts directly as a bounded topology trust dimension rather than leaving
those cues buried only in degraded-scope prose.

In `platform/app-web/src/features/platform-health/view.tsx`, topology is even
more aggregated. Platform Health shows bounded read-path coverage, freshness,
and degraded-scope summaries for all read paths, but it deliberately does not
turn topology-specific pairing gaps into a deep topology product view.

This split is now implemented correctly: the dedicated topology page remains the
richest topology product surface, while Overview and Platform Health reuse the
same backend-owned pairing vocabulary more coarsely.

### 5. Observability now uses the improved topology coverage signals without becoming the product

The topology dashboard in
`platform/grafana/dashboards/topology/topology-overview.json` is already aligned
with the current product boundary.

It explicitly documents current limits in the dashboard scope text:

- topology is intentionally partial
- links are inferred from interface naming and operational state
- comparison panels are not drift truth
- evidence posture is not validation logic

The dashboard now visualizes real topology signals such as:

- backend versus collector node delta
- backend versus collector link delta
- backend-owned paired-link counts
- backend-owned single-sided-link counts
- paired-link share
- backend-owned topology pairing-posture label projections
- topology sync age
- topology state distribution
- collector versus backend topology counts
- topology serving and evidence posture

This is a strong product-versus-observability split. Grafana mirrors numeric
posture and agreement signals; it does not attempt to replace the backend-owned
topology contract.

### 6. Verification now treats the improved topology coverage semantics as real but bounded

`platform/scripts/verify-core-runtime.sh` now enforces the presence of the main
topology contract fields and emits bounded notices and warnings for the current
gap.

It explicitly checks:

- topology response presence
- `serving_mode`
- `sync_status`
- `completeness`
- topology `coverage_summary`
- per-link `endpoint_pairing_state`
- per-link `endpoint_evidence_count`
- current comparison surface
- backend topology pairing metrics
- collector topology metrics including
  `platform_gnmi_collector_topology_paired_links`
  and `platform_gnmi_collector_topology_single_sided_links`

It also emits topology-specific messages when:

- the topology read path is non-ok
- `endpoint_pairing_posture=partially_paired`
- `endpoint_pairing_posture=single_sided`
- topology is served from persisted fallback
- topology is blocked by collector loss with no persisted snapshot
- `completeness` remains `partial`

The current verifier behavior is therefore already aligned with the week 14
goal. It treats the current truth-depth problem as endpoint coverage and partial
completeness, not as workflow, validation, or controller-first semantics.

### 7. The remaining wording problem is now narrower than the completed pairing work

The current surfaces now expose enough evidence to see the remaining wording
problem clearly.

Across the reviewed repository surfaces:

- collector delivery and backend contracts still carry `completeness=partial`
  plus a broad `degraded_scope_summary`
- the dedicated topology page now shows explicit pairing posture and counts, but
  the broader product summary surfaces still need the reader to mentally
  separate inference-boundedness from collection degradation
- Grafana mirrors paired-versus-single-sided counts and pairing posture labels,
  but it correctly does not define a fuller partiality taxonomy on its own
- the verifier proves the current contract and emits bounded notices, but it
  still relies on broad `partial` plus pairing notices rather than a smaller
  three-cause decomposition

That means the next honest step is not another pairing implementation slice.
It is a documentation-first contract that states exactly how a later bounded
code follow-on should separate the remaining causes of partiality.

## Surface-By-Surface Classification Of The Current Gap

### Endpoint pairing

Current strength:

- pairing is deterministic inside the current lab because links are derived from
  interface naming and sorted endpoint pairs
- pairing is now modeled explicitly as per-link `endpoint_pairing_state`
- aggregate paired-versus-single-sided coverage is now exposed as
  `endpoint_pairing_posture`, `paired_link_count`, and
  `single_sided_link_count`

Current weakness:

- pairing is still ultimately driven by naming-based inference rather than
  protocol-derived adjacency truth
- the current bounded model still does not expose a larger family of reason
  codes such as `peer_unrecognized` or other richer sub-causes, which is
  appropriate for Phase 2 but remains a limit

Review judgment:

- the original week 14 gap is now closed end to end
- the remaining truth-depth question is no longer missing pairing vocabulary,
  but how far the inferred topology slice can be deepened later without leaving
  the current bounded model

### Single-sided inferred links

Current strength:

- the collector computes `single_sided_link_count`
- the dedicated topology page now surfaces single-sided evidence through
  backend-owned pairing fields rather than older derived posture inference
- Grafana shows paired-versus-single-sided counts and share
- the verifier emits topology-specific notices for `partially_paired` and
  `single_sided` read-path posture

Current weakness:

- the current aggregate remains intentionally coarse and should not be mistaken
  for protocol validation or measured topology completeness
- the remaining limit is not absence of the signal, but the broader boundedness
  of the inferred topology slice around it

Review judgment:

- this area is now strong enough for honest Phase 2 operator interpretation
- further work should deepen truth carefully rather than reopening the same
  week 14 pairing-semantics slice

### Partial completeness

Current strength:

- `completeness=partial` is explicit across collector, backend, UI, dashboard,
  docs, and verifier behavior
- the code and docs consistently refuse to present the current topology slice as
  full operational truth

Current weakness:

- `partial` is broad and currently carries multiple causes at once: inference,
  endpoint coverage gaps, and possible collection degradation
- the current contract does not decompose completeness into more precise bounded
  sub-postures

Review judgment:

- the repo is already honest here
- the next slice should refine why the topology is partial, not remove the
  partial posture
- the narrowest honest decomposition is to keep `completeness=partial` as the
  umbrella boundary while adding explicit `inference_posture` and
  `collection_posture` around the already-implemented
  `endpoint_pairing_posture`

### Degraded-scope wording

Current strength:

- the collector and platform-status path already carry `degraded_scope_summary`
- Overview and Platform Health present that summary as backend-owned product cue
- verifier notices match the same general posture

Current weakness:

- the wording still collapses multiple conditions together in some paths:
  failed targets, partial collection, and single-sided inference can all end up
  in broad degraded-scope prose
- this makes the summary useful but less surgical than the current evidence now
  allows

Review judgment:

- the wording is strong enough for honest Phase 2 use today
- the next slice should sharpen its topology-specific coverage wording rather
  than invent new verdict classes
- the right split is not a new taxonomy of failure reasons; it is one small
  backend-owned decomposition that keeps collection degradation separate from
  inference-boundedness and endpoint coverage
- `degraded_scope_summary` should remain explanatory prose after that split,
  not the typed contract source

### Product-versus-observability split

Current strength:

- `app-web` owns human-readable trust cues
- Grafana owns numeric observability cues
- the backend remains the source of topology posture semantics
- ODL stays out of topology truth ownership

Current weakness:

- no significant architectural weakness was found here
- the main remaining task is to preserve this split while making endpoint
  coverage more explicit in both layers

Review judgment:

- this split is already strong enough and should be preserved

## What Is Already Strong Enough

The following are already strong enough and should not be reopened as if they
were missing foundations.

- Collector-to-backend topology delivery is real, typed, and normalized.
- The backend-owned topology contract is already honest about live, fallback,
  blocked, inferred, and partial semantics.
- The dedicated topology page is already evidence-rich enough for bounded
  operator use.
- Grafana already has real topology observability panels and does not drift into
  product or validation logic.
- `verify-core-runtime.sh` already enforces the presence of topology posture and
  notices the current single-sided and partial limits.
- The docs already describe topology as useful but intentionally partial.

## What Remains Weak

The remaining weakness is specific.

- The topology slice is still inference-based and intentionally partial.
- The current contracts now separate inference-boundedness, endpoint coverage,
  and collection degradation explicitly.
- The current response still does not summarize how much of the observed node
  set is actually represented by at least one inferred link versus remaining
  isolated in the current slice.
- paired-versus-single-sided coverage is now explicit, but it still does not
  imply protocol-derived adjacency truth, controller agreement, or path truth.

## Next Bounded Follow-On

The next bounded topology follow-on should stay narrower than the completed week
14 pairing slice and narrower than the already-implemented partiality
decomposition follow-on.

This review now treats the contract-definition and implementation step for that
partiality decomposition as complete. No collector, backend, frontend,
dashboard, or verifier rework is implied by this checkpoint alone.

It should not revisit whether the repository needs endpoint-pairing vocabulary
or whether it needs `inference_posture` and `collection_posture`.
Those parts are already implemented end to end.

It should only define and later implement one backend-owned node participation
coverage follow-on.

That follow-on should keep `completeness=partial` as the umbrella boundary,
preserve the current inference, endpoint-pairing, and collection posture terms,
and add only these two typed counts derived from the normalized nodes and links
already in hand.

- `linked_node_count`: the number of observed nodes that participate in at
  least one emitted inferred link
- `isolated_node_count`: the number of observed nodes that do not participate
  in any emitted inferred link

This is narrower than the completed work in two important ways.

First, it preserves the existing partiality decomposition rather than replacing
or reinterpreting it.

Second, it does not authorize a broader topology redesign. It only explains how
much of the observed node set is represented by the current inferred link slice
where current evidence already exists.

Ownership for that follow-on should stay explicit.

- collector continues to emit the bounded raw evidence and counts that inform
  the topology path
- backend owns the product-facing node participation counts and preserves the
  already-implemented partiality decomposition terms
- WebUI consumes those backend-owned terms as trust cues
- Grafana mirrors only numeric or projected observability posture from real
  metrics
- verifier proves the runtime contract and emits notices rather than topology
  verdicts

The exact checkpoint for that narrower follow-on is now explicit:

- keep `inference_posture`, `endpoint_pairing_posture`, and
  `collection_posture` closed as the current partiality contract
- reopen topology later only if node participation coverage is still the
  smallest honest truth-depth gain
- if reopened, limit the follow-on to `linked_node_count` and
  `isolated_node_count` or equivalent backend-owned counts derived from the
  existing normalized response

That contract is intentionally smaller than a broader topology redesign and
intentionally preserves `degraded_scope_summary` as supporting prose.

## Safe Operational Interpretation After Week 14

The improved topology slice is now safe to interpret in one bounded way.

- use `paired`, `partially_paired`, and `single_sided` posture as endpoint-
  evidence-depth cues inside the current inferred topology slice
- use the dedicated topology page, Overview, Platform Health, and Grafana only
  as bounded read-side trust surfaces for that evidence
- treat `completeness=partial` as an explicit stop line against complete
  topology truth

It is not safe to interpret the week 14 result in these stronger ways.

- do not treat pairing posture as adjacency validation
- do not treat paired-versus-single-sided counts as controller agreement or
  protocol-derived truth
- do not treat the improved trust cues as permission to infer path truth,
  workflow readiness, or network validation

## Week 14 Implementation Outcome

The smallest honest week 14 slice identified by this review has now been
implemented.

Implemented slice:

1. collector endpoint-pairing semantics were tightened inside the existing
   inference path
2. one explicit backend-owned pairing-coverage summary was exposed for topology
3. that pairing posture now appears in the topology page, Overview, Platform
   Health, Grafana, tests, and verifier only where each surface already carries
   topology trust cues

That implemented slice now covers:

- explicit bounded link pairing posture categories derived from current evidence
- explicit aggregate counts such as fully paired versus single-sided inferred
  links
 - explicit inference-boundedness and collection-degradation posture alongside
   the existing endpoint-pairing posture
 - bounded verifier notices and runtime assertions for those topology coverage
   signals

Any later follow-on should now be about broader truth depth only if it can stay
similarly bounded.

At this checkpoint, the smaller documentation task is complete: the next cycle
no longer needs to rediscover or reimplement the partiality vocabulary, only to
decide later whether one bounded node-participation follow-on is still
justified.

That slice should not attempt:

- LLDP redesign
- IGP adjacency truth
- ODL topology ownership
- validation verdicts
- workflow semantics

## Explicit Anti-Goals For The Next Cycle

The next cycle must not do these things.

- do not reopen the completed week 14 endpoint-pairing vocabulary or its
  already-complete product, observability, test, or verifier consumption by
  default
- do not reopen the already-implemented inference, endpoint-pairing, and
  collection partiality decomposition except to keep docs aligned to live code
- do not reinterpret the topology gap as permission to build validation or drift
  verdicts
- do not let Grafana become the main topology product surface
- do not move topology truth into ODL
- do not redesign the whole topology model around controller-first or
  protocol-first truth
- do not widen the task into policy redesign, workflow planning, or dry-run work
- do not claim complete topology truth when the collector path remains inference
  based and intentionally partial
- do not remove explicit `partial`, `inferred`, `degraded`, `unknown`, or
  fallback semantics from the current contracts

## Bottom Line

The repository evidence supports the completed week 14 direction.

The strongest remaining live topology weakness is no longer absence of explicit
endpoint-pairing semantics across the current product, observability, and
verification surfaces or absence of explicit partiality decomposition. Those
parts are now in place. The remaining limit is that the topology slice itself
is still bounded, inferred, and intentionally partial, and the current response
still says more about emitted link evidence than about how much of the observed
node set participates in that inferred link slice.

Any next implementation slice should therefore stay small and should not reopen
the same pairing-semantics work unless new repository evidence changes the
current boundary. It should preserve the current backend-owned normalized
topology model, the product-versus-observability split, and the explicit
partial-truth posture already established across the repository.

If topology is revisited again inside `Phase 2`, the first honest target is no
longer pairing vocabulary or another partiality-semantics pass. It is one
bounded node-participation coverage follow-on that can expose how many observed
nodes are represented by emitted inferred links versus still isolated without
implying protocol truth, controller truth, or full-topology truth.

That narrower follow-on is now ready as a documented checkpoint rather than a
still-vague idea.

The exact field, metric, and UI-separation rules for keeping the current
partiality contract closed and reopening topology only for node participation
coverage are now aligned with
`platform/schemas/topology/topology-read-path-coverage-semantics.md`.