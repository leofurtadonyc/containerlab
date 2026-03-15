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

The follow-on design note for the next week 14 implementation slice now lives in
`platform/schemas/topology/topology-read-path-coverage-semantics.md`.

That design note turns this review into one concrete vocabulary and ownership
contract for endpoint pairing, single-sided inferred-link posture, product trust
cues, Grafana numeric projections, and verifier behavior.

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

### 2. The current endpoint-pairing gap is narrower than a generic topology gap

The weakest current seam is not that the repo lacks topology evidence.

The weak seam is that endpoint pairing remains implicit and naming-driven.

Today, pairing is determined by interface-name conventions plus sorted endpoint
pairs. That is workable for the current Nokia-first lab, but it leaves the
current contract weaker in three ways.

- There is no explicit per-link pairing posture beyond derived attributes such
  as `endpoint_evidence_count` and `knowledge_state=partial`
- There is no explicit reason code for why a link is single-sided versus fully
  paired versus missing a recognizable peer name
- The main aggregate signal is `single_sided_link_count`, which is useful but
  still narrower than a full endpoint-pairing coverage summary

This is why the current recommendation should stay focused on endpoint-pairing
and single-sided-link semantics rather than drifting into a broad topology
redesign.

The newly added design note now also makes that narrower target concrete:

- per-link `endpoint_pairing_state`
- aggregate `endpoint_pairing_posture`
- numeric `paired_link_count`
- numeric `single_sided_link_count`

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
- `single_sided_link_count`
- `degraded_scope_summary`

This is strong enough for Phase 2 because the backend remains the brain and the
topology contract remains normalized, typed, and read-only.

### 4. The product already distinguishes the topology page from summary pages

The topology product surface is strongest on the dedicated page.

In `platform/app-web/src/features/topology/view.tsx`, the dedicated topology page
already exposes:

- link evidence posture as `single_sided` versus `multi_sided`
- link `knowledge_state`
- inference readout and freshness readout
- comparison anchor and comparison posture
- link evidence distribution
- selected-link and selected-node detail
- explicit callouts for stale, blocked, and partial posture

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

Overview also adds the topology `single_sided_link_count`, but only inside the
degraded-scope note rather than as a first-class trust dimension.

In `platform/app-web/src/features/platform-health/view.tsx`, topology is even
more aggregated. Platform Health shows bounded read-path coverage, freshness,
and degraded-scope summaries for all read paths, but it deliberately does not
turn topology-specific pairing gaps into a deep topology product view.

This split is directionally correct.

### 5. Observability is already using real topology signals without becoming the product

The topology dashboard in
`platform/grafana/dashboards/topology/topology-overview.json` is already aligned
with the current product boundary.

It explicitly documents current limits in the dashboard scope text:

- topology is intentionally partial
- links are inferred from interface naming and operational state
- comparison panels are not drift truth
- evidence posture is not validation logic

The dashboard already visualizes real topology signals such as:

- backend versus collector node delta
- backend versus collector link delta
- `platform_gnmi_collector_topology_single_sided_links`
- single-sided link share
- topology sync age
- topology state distribution
- collector versus backend topology counts
- topology serving and evidence posture

This is a strong product-versus-observability split. Grafana mirrors numeric
posture and agreement signals; it does not attempt to replace the backend-owned
topology contract.

### 6. Verification already treats the topology gap as real but bounded

`platform/scripts/verify-core-runtime.sh` now enforces the presence of the main
topology contract fields and emits bounded notices and warnings for the current
gap.

It explicitly checks:

- topology response presence
- `serving_mode`
- `sync_status`
- `completeness`
- current comparison surface
- collector topology metrics including
  `platform_gnmi_collector_topology_single_sided_links`

It also emits topology-specific messages when:

- the topology read path is non-ok
- `single_sided_link_count > 0`
- topology is served from persisted fallback
- topology is blocked by collector loss with no persisted snapshot
- `completeness` remains `partial`

The current verifier behavior is therefore already aligned with the week 14
goal. It treats the current truth-depth problem as endpoint coverage and partial
completeness, not as workflow, validation, or controller-first semantics.

## Surface-By-Surface Classification Of The Current Gap

### Endpoint pairing

Current strength:

- pairing is deterministic inside the current lab because links are derived from
  interface naming and sorted endpoint pairs
- paired evidence is preserved indirectly in `endpoint_evidence_count` and
  `observed_interfaces`

Current weakness:

- pairing is still implicit rather than first-class
- the contract does not explicitly distinguish `fully_paired`, `single_sided`,
  `peer_unrecognized`, or similar bounded pairing states
- neither the topology response nor platform-status read paths expose a direct
  paired-link coverage count

Review judgment:

- this is the strongest remaining live truth-depth gap
- it is narrow and implementable without redesigning the whole topology model

### Single-sided inferred links

Current strength:

- the collector computes `single_sided_link_count`
- the dedicated topology page derives and surfaces single-sided evidence posture
- Grafana shows single-sided count and share
- the verifier emits a topology-specific notice when the count is non-zero

Current weakness:

- the current aggregate is useful but still coarse
- the backend does not yet expose a richer endpoint-pairing summary than the raw
  count plus degraded-scope prose
- summary pages do not treat single-sided coverage as a dedicated, named trust
  dimension beyond notes and aggregate posture

Review judgment:

- this area is already strong enough to support a small improvement pass
- it does not need reinvention, only clearer explicit semantics

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

- Endpoint pairing is naming-driven but not yet modeled explicitly enough as a
  first-class bounded coverage posture.
- Single-sided evidence is tracked, but mostly as an aggregate count rather than
  a fuller pairing summary.
- `partial` and `degraded_scope_summary` remain broader than they need to be for
  the topology slice.
- Overview and Platform Health surface topology trust cues honestly, but they do
  not yet name endpoint-pairing coverage as directly as the dedicated topology
  page and the Grafana dashboard imply.

## Smallest Honest Next Implementation Slice

The smallest honest next slice should remain narrower than a generic topology
redesign.

Recommended slice:

1. tighten collector endpoint-pairing semantics inside the existing inference
   path
2. expose one explicit backend-owned pairing-coverage summary for topology
3. surface that pairing posture in the topology page, Overview, Platform Health,
   Grafana, and verifier only where each surface already carries topology trust
   cues

That slice should likely cover:

- explicit bounded link pairing posture categories derived from current evidence
- explicit aggregate counts such as fully paired versus single-sided inferred
  links
- narrower degraded-scope wording that separates collection degradation from
  endpoint-pairing limitations
- one verifier notice or assertion extension only for those new topology
  coverage signals

That slice should not attempt:

- LLDP redesign
- IGP adjacency truth
- ODL topology ownership
- validation verdicts
- workflow semantics

## Explicit Anti-Goals For The Next Cycle

The next cycle must not do these things.

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

The repository evidence supports the current week 14 direction.

The strongest remaining live topology weakness is not absence of topology data in
general. It is the narrower gap around endpoint-pairing semantics and the way
single-sided inferred links are summarized and explained across the current
Phase 2 product, observability, and verification surfaces.

The next implementation slice should therefore stay small.

It should tighten endpoint-pairing and single-sided-link coverage semantics end
to end, while preserving the current backend-owned normalized topology model,
the product-versus-observability split, and the explicit partial-truth posture
already established across the repository.

The exact field, metric, and UI-separation rules for that slice are now defined
in `platform/schemas/topology/topology-read-path-coverage-semantics.md`.