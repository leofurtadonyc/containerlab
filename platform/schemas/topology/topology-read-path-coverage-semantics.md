# Topology Read-Path Coverage Semantics

## Purpose

This document defines the bounded topology coverage vocabulary for the accepted
week 14 slice and the next narrower topology partiality follow-on inside
`Phase 2 - read-only product foundation`.

The accepted week 14 slice made one narrow part of the current topology slice
clearer:

- endpoint pairing
- single-sided inferred links
- the product-versus-observability split around those signals

The next bounded follow-on exists to make one remaining weak area clearer
without reopening the completed pairing work:

- inference-boundedness
- endpoint-coverage limits
- collection degradation
- why those three causes should not stay compressed into one broad
  `completeness=partial` or `degraded_scope_summary` posture

This document is the contract-definition step for that narrower follow-on.

It defines the smallest backend-owned vocabulary that should exist before any
later code change tries to sharpen topology partiality semantics.

It does not authorize:

- topology validation verdicts
- workflow semantics
- ODL-first topology truth
- IGP or unbounded controller enrichment
- claims of complete topology truth

## Design Constraints

These rules are mandatory.

- The backend remains the owner of product-facing coverage semantics.
- Grafana remains limited to numeric observability projections.
- No raw vendor payload structure becomes the coverage contract.
- Coverage signals must remain bounded read-side truth cues only.
- Coverage signals must not become workflow eligibility, drift verdicts, or
  validation status.
- If a signal cannot be defined honestly from current live evidence, exclude it.

## Topology Partiality Decomposition

The next bounded follow-on should not replace `completeness=partial`.

`partial` remains the top-level stop line that says the current topology slice
is still bounded and not full topology truth.

The follow-on decomposes **why** the topology is partial using **four**
backend-owned response-level terms. Each answers a **different** question; they
must not be overloaded into `completeness`, `degraded_scope_summary`, or each other.

| Term | Answers | Does **not** answer |
|------|---------|---------------------|
| `inference_posture` | Are emitted links still **inference-bounded** vs unclassifiable? | Collection health; per-link endpoint strength; whether nodes are isolated |
| `endpoint_pairing_posture` | **Aggregate** mix of paired vs single-sided endpoint evidence on emitted links | Global topology completeness %; inference basis; collection status |
| `collection_posture` | Is the **live collection path** ok, degraded, blocked, or unclassifiable? | Whether inference is wrong; pairing quality; node isolation |
| `node_participation_posture` | Among **observed nodes**, are any isolated from all emitted inferred links? | Per-link `endpoint_pairing_state`; protocol adjacency truth |

The four terms are:

- `inference_posture`
- `endpoint_pairing_posture`
- `collection_posture`
- `node_participation_posture`

These separate four things that are easy to blur together when only prose or a
single “partial/degraded” label is available.

### Response-level term: `inference_posture`

This term belongs on a backend-owned topology coverage summary.

Allowed values:

- `inferred`
- `unknown`

Definitions:

- `inferred`: the emitted topology links remain bounded inferred topology links
  rather than direct adjacency truth.
- `unknown`: the current response cannot honestly classify the inference basis
  of the emitted topology links from available normalized evidence.

Explicit non-meanings:

- `inferred` does not mean the topology is low quality; it means the current
  topology slice is still inference-based.
- `inferred` does not mean collection failed.
- `unknown` does not imply controller truth exists elsewhere.

### Response-level term: `endpoint_pairing_posture`

This term remains the bounded endpoint-coverage dimension of topology
partiality.

It keeps the existing week 14 vocabulary rather than replacing it.

Allowed values:

- `paired`
- `partially_paired`
- `single_sided`
- `unknown`

Definitions:

- `paired`: all emitted normalized links in the current response are classified
  as `paired`.
- `partially_paired`: the current response includes a mix of `paired` and
  `single_sided` links.
- `single_sided`: the current response emits link records, but none of those
  links have paired endpoint evidence.
- `unknown`: the current response cannot honestly summarize pairing posture from
  the emitted normalized link evidence.

Explicit non-meanings:

- `paired` does not mean complete topology.
- `partially_paired` does not mean a measured percentage of true topology
  completeness.
- `single_sided` does not mean the topology is unusable; it means endpoint
  coverage remains weak.
- `unknown` does not mean the platform knows a hidden topology and refuses to
  show it.

### Response-level term: `collection_posture`

This term belongs on a backend-owned topology coverage summary.

Allowed values:

- `ok`
- `degraded`
- `blocked`
- `unknown`

Definitions:

- `ok`: current topology collection completed without current target failures or
  partial-collection evidence affecting the emitted live topology response.
- `degraded`: the current response is still served, but current collection
  counts or degraded-scope facts show partial collection or failed collection
  for part of the topology path.
- `blocked`: the current topology path cannot currently produce a live topology
  result because collection is blocked.
- `unknown`: the current response cannot honestly classify collection posture
  from available normalized evidence.

Explicit non-meanings:

- `ok` does not mean complete topology truth.
- `degraded` does not automatically mean the inferred links are wrong.
- `blocked` does not replace `serving_mode`, fallback posture, or other
  existing runtime-contract fields.

### Relationship to `completeness`

The follow-on should preserve this interpretation.

- `completeness=partial` stays as the umbrella topology truth boundary.
- `inference_posture` explains whether the current slice is still bounded by
  inference.
- `endpoint_pairing_posture` explains how much endpoint evidence supports the
  emitted inferred links.
- `collection_posture` explains whether the current collection window degraded
  or blocked the live topology response.

This means the topology can remain honestly `partial` even when
`collection_posture=ok`, because inference-boundedness and endpoint coverage are
separate from collection degradation.

This also means the topology can remain honestly `partial` even when
`endpoint_pairing_posture=paired`, because paired endpoint evidence still does
not turn an inferred topology slice into full adjacency truth.

## Update note

The shipped topology slice now also carries LLDP-backed `physical_adjacency_posture` on link rows. That LLDP lane is additive and does not replace the four response-level coverage terms defined here.

### Relationship to `degraded_scope_summary`

`degraded_scope_summary` remains useful, but it must not remain the contract.

Keep this split explicit:

- `inference_posture` is the contract field for inference-boundedness
- `endpoint_pairing_posture` is the contract field for endpoint-coverage limits
- `collection_posture` is the contract field for current collection
  degradation or blockage
- `degraded_scope_summary` remains supporting prose that can explain those
  fields in operator language when a short note is useful

This keeps the contract boring and typed while preserving room for human-
readable explanation.

## Vocabulary

This design uses boring, explicit names.

### Link-level term: `endpoint_pairing_state`

This term belongs on one emitted normalized topology link record.

Allowed values:

- `paired`
- `single_sided`
- `unknown`

Definitions:

- `paired`: the current inferred link has observed endpoint evidence from both
  endpoints in the same bounded collection window.
- `single_sided`: the current inferred link has observed endpoint evidence from
  only one endpoint, while the peer endpoint is still inferred from current
  bounded evidence such as the interface naming convention.
- `unknown`: the current link record exists, but the bounded read path cannot
  classify its endpoint pairing honestly from the available normalized evidence.

Explicit non-meanings:

- `paired` does not mean protocol adjacency validated.
- `paired` does not mean forwarding validated.
- `paired` does not mean controller agreement.
- `single_sided` does not automatically mean broken forwarding.
- `unknown` does not imply failure by itself.

## Signals To Keep

The following signals are already honest enough to preserve and extend.

- `configured_target_count`
- `observed_target_count`
- `collection_success_count`
- `collection_partial_count`
- `collection_failure_count`
- `oldest_observed_at`
- `newest_observed_at`
- `completeness`
- `degraded_scope_summary`
- `endpoint_pairing_posture`
- `single_sided_link_count`
- per-link `endpoint_evidence_count`

## Signals To Add

The next bounded follow-on should add only the smallest new coverage signals
that current live evidence can support honestly.

### Bounded status fields

These should be bounded status fields, not scores.

- `inference_posture`
- `collection_posture`

Definitions:

- `inference_posture`: backend-owned statement of whether the emitted topology
  slice remains bounded by inference.
- `collection_posture`: backend-owned statement of whether current collection
  degradation is affecting the live topology response.

Implementation status (current repository):

- implemented in `gnmi-collector` and `app-api` for `inference_posture`,
  `collection_posture`, and `node_participation_posture` on the live topology path
  where the collector envelope supplies them; backend derives pairing and
  participation counts when needed
- implemented in `app-web`, Grafana, and `verify-core-runtime` for the bounded
  pairing and coverage signals aligned with this document (see week 14–17
  completion notes below)

### Numeric counts

These should be numeric counts.

- `paired_link_count`
- `single_sided_link_count`
- `linked_node_count`
- `isolated_node_count`

Definitions:

- `paired_link_count`: number of emitted normalized topology links whose
  `endpoint_pairing_state` is `paired`.
- `single_sided_link_count`: number of emitted normalized topology links whose
  `endpoint_pairing_state` is `single_sided`.
- `linked_node_count`: number of observed normalized topology nodes that are
  represented by at least one emitted inferred link.
- `isolated_node_count`: number of observed normalized topology nodes that are
  not represented by any emitted inferred link.

Do not add an `unknown_link_count` unless the runtime actually emits link
records that can be honestly classified as `unknown`.

Implementation status after the accepted week 14 slice:

- implemented now in `gnmi-collector`: per-link `endpoint_pairing_state` and
  `endpoint_evidence_count`
- implemented now in `gnmi-collector`: aggregate `paired_link_count`,
  `single_sided_link_count`, and `endpoint_pairing_posture`
- implemented now in `gnmi-collector` metrics: paired-link and single-sided-link
  gauges
- implemented now in `app-api` topology and platform-status contracts:
  backend-owned response-level pairing posture and paired-versus-single-sided
  counts
- implemented now in `app-api` topology response: explicit per-link
  `endpoint_pairing_state` and `endpoint_evidence_count` fields exposed through
  backend-owned read models
- implemented now in `app-api` metrics: bounded backend-owned topology pairing
  posture plus paired-link and single-sided-link gauges
- implemented now in `app-web`: primary topology, overview, and platform-health
  trust-cue consumption of these backend-owned typed fields
- implemented now in Grafana: paired-link, single-sided-link, share, and
  backend-owned pairing-posture dashboard consumption from real metrics
- implemented now in verifier and targeted tests: live runtime checks plus
  bounded notices for backend-owned and collector-owned pairing signals,
  alongside collector and backend pytest coverage for the newer topology
  pairing contracts

Collector-owned node participation evidence status after the bounded week 15
collector slice:

- implemented now in `gnmi-collector`: aggregate `linked_node_count`,
  `isolated_node_count`, and `node_participation_posture` derived only from the
  current normalized nodes and inferred links already in hand
- implemented now in `gnmi-collector` metrics: linked-node,
  isolated-node, and current node-participation-posture gauges
- implemented now in collector tests: healthy fully-linked and isolated-node
  evidence cases pinned end to end
- implemented now in `app-api`: `coverage_summary.node_participation_posture`
  and counts, with backend derivation when the collector omits explicit values
- implemented now in `app-web`, Grafana, and verifier behavior for bounded
  runtime-contract and notice-oriented checks (not validation verdicts)

### Response-level term: `node_participation_posture` (collector-fed, backend-owned)

The collector may emit `node_participation_posture` in the delivery envelope; the
backend also derives it when absent. It is the **fourth** response-level partiality
axis (with the same allowed values and meanings as in the coverage summary).

Allowed values:

- `fully_linked`
- `partially_isolated`
- `isolated_only`
- `unknown`

Definitions:

- `fully_linked`: all observed normalized nodes participate in at least one
  emitted inferred link.
- `partially_isolated`: the current response includes both linked and isolated
  observed nodes.
- `isolated_only`: observed normalized nodes are present, but none of them are
  represented by any emitted inferred link.
- `unknown`: the current response cannot honestly classify node participation
  from the normalized nodes and emitted links in hand.

Explicit non-meanings:

- `fully_linked` does **not** mean every emitted link is `paired` (participation
  is “on any link,” not “strong endpoint evidence on every link”).
- `isolated_only` does **not** mean collection failed; collection may be `ok`
  while the inferred graph leaves nodes unused.
- This posture does **not** replace per-link `endpoint_pairing_state` or
  `endpoint_pairing_posture`.

### Prose-only notes

These should remain prose rather than turning into new enum fields.

- `degraded_scope_summary`
- topology `summary` text
- explanatory notes such as why the topology remains partial, why inference is
  bounded, and what the current endpoint-pairing limits mean

These prose fields may mention one or more of the four partiality dimensions, but
they must not replace the four-term backend-owned contract above.

The design should not create a large family of enum values for every reason or
sub-reason when a short explicit note is enough.

## Layer Ownership Rules

### 1. Collector delivery and collector metrics

Collector ownership:

- emit per-link `endpoint_pairing_state`
- emit per-link `endpoint_evidence_count`
- emit aggregate `paired_link_count`
- emit aggregate `single_sided_link_count`
- emit aggregate `endpoint_pairing_posture`
- emit aggregate `linked_node_count`
- emit aggregate `isolated_node_count`
- emit aggregate `node_participation_posture`
- preserve current collection counts, freshness window, and degraded-scope
  summary

Collector may later emit the bounded raw facts that allow the backend to derive
`inference_posture` and `collection_posture`, but the backend remains the owner
of those product-facing decomposition terms.

Collector non-ownership:

- do not define workflow meaning
- do not define topology validation meaning
- do not expose vendor-native evidence structures as the product contract
- do not become the final owner of topology partiality decomposition semantics

Collector metric semantics:

- `platform_gnmi_collector_topology_paired_links`: gauge count of emitted
  normalized topology links with `endpoint_pairing_state=paired`
- `platform_gnmi_collector_topology_single_sided_links`: gauge count of emitted
  normalized topology links with `endpoint_pairing_state=single_sided`
- `platform_gnmi_collector_topology_linked_nodes`: gauge count of observed
  normalized topology nodes represented by at least one emitted inferred link
- `platform_gnmi_collector_topology_isolated_nodes`: gauge count of observed
  normalized topology nodes not represented by any emitted inferred link
- `platform_gnmi_collector_topology_node_participation_posture`: one-hot gauge
  for the current collector-owned node participation posture

Do not add:

- topology quality scores
- topology confidence scores
- string-heavy metric labels that duplicate product prose

### 2. Backend-owned topology contract

Backend ownership:

- translate collector-side coverage signals into product-facing bounded topology
  semantics
- expose explicit aggregate topology coverage summary on the topology response
- decompose topology partiality into inference-boundedness, endpoint-coverage,
  and collection-degradation dimensions without replacing `completeness`
- preserve current evidence-confidence and serving-mode posture semantics
- keep `degraded_scope_summary` as explanatory prose rather than the sole
  machine-readable statement of topology partiality

Topology-response aggregate fields:

- `coverage_summary.inference_posture`
- `coverage_summary.endpoint_pairing_posture`
- `coverage_summary.collection_posture`
- `coverage_summary.node_participation_posture`
- `coverage_summary.paired_link_count`
- `coverage_summary.single_sided_link_count`
- `coverage_summary.linked_node_count`
- `coverage_summary.isolated_node_count`

Current status:

- `endpoint_pairing_posture`, `paired_link_count`, and
  `single_sided_link_count` are implemented now in `app-api`
- `inference_posture` and `collection_posture` are implemented now in
  `app-api`

Per-link topology fields:

- `endpoint_pairing_state`
- `endpoint_evidence_count`

Current status:

- implemented now in `app-api`

Backend non-ownership on this slice:

- do not convert coverage posture into validation or drift results
- do not infer complete topology from pairing improvements alone
- do not collapse inference-boundedness and collection degradation back into one
  broad topology-quality label

### 3. Backend-owned platform-status contract

Platform-status ownership:

- carry topology read-path coverage aggregates as read-path posture
- keep these values close to other bounded read-path cues such as target
  coverage, freshness window, and degraded scope
- keep the topology read-path row explicit about which part of the posture is
  inference-boundedness, which part is endpoint coverage, and which part is
  collection degradation

Topology read-path fields:

- `inference_posture`
- `endpoint_pairing_posture`
- `collection_posture`
- `paired_link_count`
- `single_sided_link_count`

Current status:

- `endpoint_pairing_posture`, `paired_link_count`, and
  `single_sided_link_count` are implemented now in `app-api`
- `inference_posture` and `collection_posture` are implemented now in
  `app-api`

Platform-status non-ownership:

- do not turn Platform Health into a full topology product page
- do not overload platform-status with per-link detail

### 4. WebUI product trust cues

WebUI ownership:

- show backend-owned coverage posture and counts as product trust cues
- preserve the dedicated topology page as the richest topology product surface
- keep Overview and Platform Health intentionally coarser than the topology page

WebUI interpretation rules:

- Topology page may show `inference_posture`, `endpoint_pairing_posture`,
  `collection_posture`, `paired_link_count`, `single_sided_link_count`, and
  per-link `endpoint_pairing_state`
- Overview may show `inference_posture`, `endpoint_pairing_posture`, and
  `collection_posture` plus the two counts as bounded trust cues
- Platform Health may show the same values only in the topology read-path row or
  read-path trust summary, not as a separate topology product analysis surface

WebUI non-ownership:

- do not invent additional topology-quality labels
- do not turn pairing posture into green or red workflow meaning
- do not use pairing posture as a proxy for eligibility, approval, or validation
- do not convert `inference_posture` or `collection_posture` into a topology
  score
- do not treat `degraded_scope_summary` as if it were the typed source of the
  partiality contract

### 5. Grafana numeric observability views

Grafana ownership:

- show numeric counts and derived shares only
- mirror collector and backend metric posture, not product prose

Allowed Grafana signals:

- paired link count
- single-sided link count
- paired-versus-single-sided share
- backend-owned `endpoint_pairing_posture` labels only when projected directly
  from real metrics
- backend-owned `inference_posture` and `collection_posture` labels only when
  projected directly from real metrics
- existing collector-versus-backend count deltas
- existing freshness and sync-age signals

Grafana non-ownership:

- do not render `endpoint_pairing_posture` as a product contract or workflow
  state
- do not render `inference_posture` or `collection_posture` as a dashboard-only
  taxonomy disconnected from the backend contract
- do not invent dashboard-only pairing vocabulary beyond what backend-owned
  metrics already expose
- do not duplicate backend `degraded_scope_summary` prose verbatim
- do not claim topology validation or protocol truth

### 6. Verifier notices and warnings

Verifier ownership:

- emit bounded notices for honest topology evidence limits
- fail only on runtime-contract breakage, not on expected bounded partial truth

Current verifier behavior:

- continue warning when topology serving mode is fallback or blocked
- continue noticing when `completeness=partial`
- continue proving that the topology can be honestly partial even when current
  collection posture is otherwise healthy
- continue proving the live presence of backend-owned `inference_posture` and
  `collection_posture` fields
- continue noticing when `endpoint_pairing_posture=partially_paired`
  or `endpoint_pairing_posture=single_sided`
- continue noticing when `collection_posture=degraded`
  or `collection_posture=blocked`
- continue proving the live presence of backend-owned topology coverage fields
  and backend plus collector pairing metrics as runtime-contract checks

Next follow-on verifier behavior:

- if a later node-participation follow-on is implemented, prove the presence of
  `linked_node_count` and `isolated_node_count` or equivalent backend-owned
  fields as runtime-contract fields
- if a later node-participation follow-on is implemented, notice nonzero
  isolated-node counts without treating them as topology validation verdicts
- continue treating `degraded_scope_summary` as supporting explanatory text
  rather than the field that defines topology partiality categories

Verifier non-ownership:

- do not fail the build because single-sided links exist in a bounded Phase 2
  slice
- do not treat pairing posture as a validation verdict
- do not fail the build only because topology remains inference-bounded

## Allowed Interpretations

These interpretations are allowed.

- `inference_posture=inferred` tells operators that the topology slice remains
  bounded by inferred-link logic even if collection is otherwise healthy.
- `paired_link_count` tells operators how many emitted inferred links are backed
  by both observed endpoints.
- `single_sided_link_count` tells operators how many emitted inferred links are
  still backed by only one observed endpoint.
- `endpoint_pairing_posture=partially_paired` tells operators that the current
  topology slice includes both stronger and weaker link evidence in the same
  response.
- `endpoint_pairing_posture=single_sided` tells operators that the current
  topology slice has emitted inferred links, but none of them are backed by both
  observed endpoints.
- `collection_posture=degraded` tells operators that current collection
  degradation affected the live topology read path, which is a different problem
  from inference-boundedness or single-sided endpoint evidence.
- these signals improve trust interpretation inside the existing bounded inferred
  topology model.

## Forbidden Interpretations

These interpretations are forbidden.

- do not interpret `paired` as protocol adjacency truth
- do not interpret `paired` as end-to-end path correctness
- do not interpret `paired` as controller agreement
- do not interpret `inference_posture=inferred` as a collection failure label
- do not interpret `partially_paired` as a measured completeness percentage for
  the whole network
- do not interpret `single_sided` as a direct fault verdict
- do not interpret `collection_posture=ok` as full topology truth
- do not interpret any new coverage field as workflow readiness or workflow
  eligibility
- do not interpret these signals as permission to leave `Phase 2`

## Completed Week 14 Slice

The accepted week 14 implementation slice did only this.

1. add explicit pairing vocabulary to collector delivery and topology product
   contracts
2. add the two honest numeric counts: `paired_link_count` and
   `single_sided_link_count`
3. surface those counts and the bounded aggregate pairing posture through the
   backend-owned topology and platform-status contracts
4. mirror the counts numerically in Grafana
5. keep verifier behavior notice-oriented rather than validation-oriented

That completed slice should not be reopened by default.

## Next Bounded Follow-On

The next bounded follow-on should do only this.

1. preserve `completeness=partial` as the umbrella topology truth boundary
2. preserve the completed inference, endpoint-pairing, and collection
  partiality decomposition exactly as the current backend-owned contract
3. add one backend-owned node participation coverage summary so the read path
  can state how many observed nodes are represented by at least one emitted
  inferred link
4. if topology is reopened, limit that follow-on to `linked_node_count` and
  `isolated_node_count` or equivalent counts derived from the normalized nodes
  and links already in hand
5. keep the backend as the owner of that follow-on, with Grafana limited to
  numeric or projected observability signals and verifier behavior limited to
  bounded runtime-contract checks and notices

It should not do more than that.

## Persisted topology snapshots and history-derived coverage

When `app-api` writes normalized topology snapshots to Postgres, per-link
`endpoint_pairing_state` and `endpoint_evidence_count` are stored inside the
link row JSON `attributes` (alongside any other normalized link attributes),
not as separate columns. On read, `resolve_topology_link_endpoint_evidence`
reads those keys from `attributes` the same way as from typed `TopologyLink`
fields.

Snapshots **without** those keys behave as honest **unknown** pairing evidence
for coverage derivation unless integer evidence counts in attributes allow
inference (see `resolve_topology_link_endpoint_evidence`).

`recent_snapshots` and `comparison_to_previous` on `/api/v1/topology` derive
inference, endpoint-pairing, collection, and node-participation postures from
persisted nodes and links only. That derivation remains **trust cues**, not
topology validation or workflow semantics.

## Week 21 note — partiality contract refinement (documentation)

Week 21 aligned **schema Field descriptions** (`app-api` `TopologyCoverageSummaryRecord`),
**internal model** docstrings, and this document so the **four** partiality axes
are explicitly **non-interchangeable**. No topology discovery, pairing algorithm,
or inference logic was changed as part of that refinement; it is contract clarity
only.