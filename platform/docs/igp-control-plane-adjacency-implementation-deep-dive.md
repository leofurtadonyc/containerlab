# IGP control-plane adjacency evidence v1 — implementation deep dive

This document records the bounded OSPF/IS-IS slice added to the topology family.

## Scope

- Collector paths: Nokia SR OS OSPF (`/nokia-state:state/router[router-name=Base]/ospf`) and IS-IS (`/nokia-state:state/router[router-name=Base]/isis`) are polled alongside interface and LLDP reads.
- Product contracts: `/api/v1/topology` preserves normalized control-plane adjacency posture on each link, and `/api/v1/topology/truth` surfaces the same evidence in structured merged-link form.
- Limits: this is not dataplane path truth, not TE authority, not service impact truth, and not proof that every platform target exposes usable OSPF or IS-IS state.

## Merge rules

- No LLDP, no strong IGP, no controller corroboration: `inferred_only`
- Strong OSPF or IS-IS adjacency without controller corroboration: `igp_confirmed`
- Strong IGP adjacency plus controller agreement: `multi_source_confirmed`
- Weak protocol observation (`ospf_observed`, `isis_observed`): useful trust cue, but not full adjacency confirmation
- Missing IGP rows: absence or inapplicability, not automatic conflict
- IGP remote identity contradicts the current normalized correlation: `conflicting`

## Collector behavior

- Interface reads remain the baseline graph input.
- LLDP and IGP reads are executed independently, so missing OSPF/IS-IS support degrades only the control-plane evidence lane.
- Link records expose:
  - `control_plane_adjacency_posture`
  - `igp_adjacency_observation_count`
  - `igp_protocols_observed`
  - `ospf_adjacency_state`
  - `isis_adjacency_state`
  - `igp_local_interfaces`
  - `igp_remote_identities`
  - `igp_correlation_notes`

## Backend behavior

- `/api/v1/topology` preserves the normalized control-plane posture on each link as a distinct structure from LLDP physical adjacency.
- `/api/v1/topology/truth` adds `ospf_adjacency` and `isis_adjacency` as distinct source families and can promote links to `igp_confirmed` or `multi_source_confirmed`.
- Missing or weak IGP evidence remains explicit through `not_observed`, `suppressed_or_unknown`, `ospf_observed`, or `isis_observed`; the backend does not collapse those states into certainty.

## Observability and verification

- Collector metrics expose total IGP observations, protocol-specific observation counts, correlated links, confirmed links, and protocol-mismatch links.
- App-api metrics expose truth-level IGP-confirmed, protocol-observed, and mismatch gauges.
- `verify-core-runtime.sh` checks for IGP-aware topology-truth fields, IGP metrics, and WebUI bundle markers.
