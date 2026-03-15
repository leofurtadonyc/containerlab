# Topology Read-Path Coverage Semantics

## Purpose

This document defines the bounded topology coverage vocabulary that the week 14
`Phase 2 - read-only product foundation` cycle should implement.

It exists to make one narrow part of the current topology slice clearer:

- endpoint pairing
- single-sided inferred links
- partial-completeness interpretation
- the product-versus-observability split around those signals

It does not authorize:

- topology validation verdicts
- workflow semantics
- ODL-first topology truth
- LLDP, IGP, or deeper controller enrichment
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

### Response-level term: `endpoint_pairing_posture`

This term belongs on an aggregate topology coverage summary, not on one link.

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
- `single_sided_link_count`
- per-link `endpoint_evidence_count`

## Signals To Add

The week 14 implementation should add only the smallest new coverage signals
that current live evidence can support honestly.

### Numeric counts

These should be numeric counts.

- `paired_link_count`
- `single_sided_link_count`

Definitions:

- `paired_link_count`: number of emitted normalized topology links whose
  `endpoint_pairing_state` is `paired`.
- `single_sided_link_count`: number of emitted normalized topology links whose
  `endpoint_pairing_state` is `single_sided`.

Do not add an `unknown_link_count` unless the runtime actually emits link
records that can be honestly classified as `unknown`.

### Bounded status fields

These should be bounded status fields, not scores.

- `endpoint_pairing_state`
- `endpoint_pairing_posture`

These fields answer a narrow question:

How much endpoint evidence supports the emitted inferred links in the current
read-side topology slice.

They do not answer:

- whether the topology is operationally correct
- whether protocol adjacency is validated
- whether intent matches observed state
- whether a workflow may proceed

### Prose-only notes

These should remain prose rather than turning into new enum fields.

- `degraded_scope_summary`
- topology `summary` text
- explanatory notes such as why the topology remains partial, why inference is
  bounded, and what the current endpoint-pairing limits mean

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
- preserve current collection counts, freshness window, and degraded-scope
  summary

Collector non-ownership:

- do not define workflow meaning
- do not define topology validation meaning
- do not expose vendor-native evidence structures as the product contract

Collector metric semantics:

- `platform_gnmi_collector_topology_paired_links`: gauge count of emitted
  normalized topology links with `endpoint_pairing_state=paired`
- `platform_gnmi_collector_topology_single_sided_links`: gauge count of emitted
  normalized topology links with `endpoint_pairing_state=single_sided`

Do not add:

- topology quality scores
- topology confidence scores
- string-heavy metric labels that duplicate product prose

### 2. Backend-owned topology contract

Backend ownership:

- translate collector-side coverage signals into product-facing bounded topology
  semantics
- expose explicit aggregate topology coverage summary on the topology response
- preserve current evidence-confidence and serving-mode posture semantics

Planned topology-response aggregate fields:

- `coverage_summary.endpoint_pairing_posture`
- `coverage_summary.paired_link_count`
- `coverage_summary.single_sided_link_count`

Planned per-link topology fields:

- `endpoint_pairing_state`
- `endpoint_evidence_count`

Backend non-ownership on this slice:

- do not convert coverage posture into validation or drift results
- do not infer complete topology from pairing improvements alone

### 3. Backend-owned platform-status contract

Platform-status ownership:

- carry topology read-path coverage aggregates as read-path posture
- keep these values close to other bounded read-path cues such as target
  coverage, freshness window, and degraded scope

Planned topology read-path fields:

- `endpoint_pairing_posture`
- `paired_link_count`
- `single_sided_link_count`

Platform-status non-ownership:

- do not turn Platform Health into a full topology product page
- do not overload platform-status with per-link detail

### 4. WebUI product trust cues

WebUI ownership:

- show backend-owned coverage posture and counts as product trust cues
- preserve the dedicated topology page as the richest topology product surface
- keep Overview and Platform Health intentionally coarser than the topology page

WebUI interpretation rules:

- Topology page may show `endpoint_pairing_posture`, `paired_link_count`,
  `single_sided_link_count`, and per-link `endpoint_pairing_state`
- Overview may show `endpoint_pairing_posture` plus the two counts as bounded
  trust cues
- Platform Health may show the same values only in the topology read-path row or
  read-path trust summary, not as a separate topology product analysis surface

WebUI non-ownership:

- do not invent additional topology-quality labels
- do not turn pairing posture into green or red workflow meaning
- do not use pairing posture as a proxy for eligibility, approval, or validation

### 5. Grafana numeric observability views

Grafana ownership:

- show numeric counts and derived shares only
- mirror collector and backend metric posture, not product prose

Allowed Grafana signals:

- paired link count
- single-sided link count
- paired-versus-single-sided share
- existing collector-versus-backend count deltas
- existing freshness and sync-age signals

Grafana non-ownership:

- do not render `endpoint_pairing_posture` as a product contract or workflow
  state
- do not duplicate backend `degraded_scope_summary` prose verbatim
- do not claim topology validation or protocol truth

### 6. Verifier notices and warnings

Verifier ownership:

- emit bounded notices for honest topology evidence limits
- fail only on runtime-contract breakage, not on expected bounded partial truth

Planned verifier behavior:

- continue warning when topology serving mode is fallback or blocked
- continue noticing when `completeness=partial`
- continue noticing when `single_sided_link_count > 0`
- optionally add one notice when `endpoint_pairing_posture=partially_paired`
  or `endpoint_pairing_posture=single_sided`

Verifier non-ownership:

- do not fail the build because single-sided links exist in a bounded Phase 2
  slice
- do not treat pairing posture as a validation verdict

## Allowed Interpretations

These interpretations are allowed.

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
- these signals improve trust interpretation inside the existing bounded inferred
  topology model.

## Forbidden Interpretations

These interpretations are forbidden.

- do not interpret `paired` as protocol adjacency truth
- do not interpret `paired` as end-to-end path correctness
- do not interpret `paired` as controller agreement
- do not interpret `partially_paired` as a measured completeness percentage for
  the whole network
- do not interpret `single_sided` as a direct fault verdict
- do not interpret any new coverage field as workflow readiness or workflow
  eligibility
- do not interpret these signals as permission to leave `Phase 2`

## Week 14 Implementation Shape

The smallest honest week 14 implementation slice should therefore do only this.

1. add explicit pairing vocabulary to collector delivery and topology product
   contracts
2. add the two honest numeric counts: `paired_link_count` and
   `single_sided_link_count`
3. surface those counts and the bounded aggregate pairing posture through the
   backend-owned topology and platform-status contracts
4. mirror the counts numerically in Grafana
5. keep verifier behavior notice-oriented rather than validation-oriented

It should not do more than that.