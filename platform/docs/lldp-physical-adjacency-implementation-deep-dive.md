# LLDP physical adjacency evidence v1 — implementation deep dive

This document records the bounded LLDP slice added to the topology family.

## Scope

- Collector path: OpenConfig LLDP (`/openconfig-lldp:lldp`) is polled alongside interface reads.
- Product contract: LLDP is exposed as structured physical-adjacency evidence on normalized topology links and merged topology-truth links.
- Limits: this is not dataplane path truth, not traffic-engineering authority, and not a guarantee that every device exposes LLDP rows.

## Merge rules

- No LLDP and no controller corroboration: `inferred_only`
- One-sided LLDP: stronger than pure inference but still partial device observation
- Bidirectional LLDP: `physical_confirmed`
- Bidirectional LLDP plus controller agreement: `multi_source_confirmed`
- LLDP contradicts interface-derived or controller-correlated topology: `conflicting`

## Collector behavior

- Interface reads remain the baseline topology graph input.
- LLDP reads are executed independently, so missing OpenConfig LLDP support degrades only the physical-adjacency lane.
- Link records expose:
  - `physical_adjacency_posture`
  - `lldp_observation_count`
  - `lldp_bidirectional`
  - `lldp_local_interfaces`
  - `lldp_remote_systems`
  - `lldp_remote_ports`
  - `lldp_correlation_notes`

## Backend behavior

- `/api/v1/topology` preserves LLDP posture on each normalized link.
- `/api/v1/topology/truth` adds `lldp_gnmi` as a distinct source and surfaces the same physical-adjacency evidence in structured form.
- Missing LLDP evidence remains explicit through `suppressed_or_unknown` or `not_observed`; the backend does not collapse those to certainty.

## Observability and verification

- Collector metrics expose LLDP observations, correlated links, bidirectional links, and mismatch links.
- App-api metrics expose the same topology counts plus truth-level `physical_confirmed`, `multi_source_confirmed`, and LLDP mismatch gauges.
- `verify-core-runtime.sh` checks for LLDP UI markers, LLDP-aware topology-truth fields, and the new metric families.