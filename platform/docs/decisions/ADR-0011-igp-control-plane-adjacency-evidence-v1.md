# ADR-0011: IGP control-plane adjacency evidence v1

## Status

Accepted.

## Context

The platform already exposes a bounded normalized topology slice from gNMI-backed interface collection, a device-native LLDP physical-adjacency lane, and a deeper topology-truth merge with optional controller enrichment. That still left a truth gap between "the devices expose a physical neighbor" and "the routing control plane has actually formed adjacency on this link".

Operators need that extra evidence lane to:

- distinguish physical-only confirmation from routing adjacency confirmation
- improve confidence when LLDP is absent or suppressed but the IGP is clearly established
- surface mismatches honestly when device-native OSPF or IS-IS points at a different peer than the current normalized link correlation

## Decision

Introduce a new device-native IGP control-plane adjacency lane inside the existing topology family:

- The collector polls Nokia SR OS OSPF and IS-IS state subtrees independently from interface and LLDP reads, so IGP absence or query failure does not break the whole topology snapshot.
- Normalized topology links carry explicit control-plane fields: `control_plane_adjacency_posture`, `igp_adjacency_observation_count`, protocol lists, protocol-specific adjacency state, and bounded correlation notes.
- `GET /api/v1/topology/truth` treats OSPF and IS-IS as distinct source families (`ospf_adjacency`, `isis_adjacency`) and upgrades link posture to `igp_confirmed` or `multi_source_confirmed` only when live device-native evidence justifies it.
- Missing IGP evidence remains a first-class absence state; it is not treated as automatic conflict.
- Metrics, verifier checks, and WebUI topology panels surface IGP-confirmed links, weak protocol observations, and mismatch markers without implying dataplane path truth.

## Consequences

- The product can now separate interface-derived inference, LLDP-backed physical confirmation, and device-native routing adjacency confirmation.
- Strong IGP confirmation can raise link trust even when LLDP is absent, while still preserving the distinction between physical truth and control-plane truth.
- ODL/controller export remains enrichment only; controller correlation does not override device-native conflicts.
- The topology product remains read-only and bounded: this does not become path validation, TE authority, or service-truth logic.

## References

- [`../deeper-topology-truth-contract-v1.md`](../deeper-topology-truth-contract-v1.md)
- [`../igp-control-plane-adjacency-implementation-deep-dive.md`](../igp-control-plane-adjacency-implementation-deep-dive.md)
- [`ADR-0010-lldp-physical-adjacency-evidence-v1.md`](ADR-0010-lldp-physical-adjacency-evidence-v1.md)
