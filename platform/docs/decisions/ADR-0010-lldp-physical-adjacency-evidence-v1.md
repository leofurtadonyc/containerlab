# ADR-0010: LLDP physical adjacency evidence v1

## Status

Accepted.

## Context

The platform already exposes a bounded topology read model from live gNMI-backed interface collection and a deeper topology truth merge with optional controller enrichment. Operators still need one device-native lane that can say whether an adjacency is physically observed by the devices themselves rather than merely inferred from interface naming or correlated from controller export.

## Decision

Introduce an OpenConfig-first LLDP physical adjacency lane inside the existing topology family:

- The collector polls `openconfig-lldp:lldp` as a topology subscription, independently from interface reads, so LLDP absence or query failure does not break the whole topology snapshot.
- Normalized topology links carry explicit physical-adjacency fields: `physical_adjacency_posture`, `lldp_observation_count`, `lldp_bidirectional`, correlation notes, and bounded local/remote identity hints.
- `GET /api/v1/topology/truth` treats LLDP as a distinct `lldp_gnmi` source and upgrades link posture to `physical_confirmed`, `multi_source_confirmed`, `partial`, or `conflicting` only when live LLDP evidence justifies it.
- Metrics, verifier checks, and WebUI topology panels surface LLDP observation counts and mismatch markers without implying dataplane path truth.

## Consequences

- The product can distinguish inference-only topology from device-native physical adjacency evidence.
- Controller export remains enrichment only; multi-source confirmation now requires LLDP-backed physical adjacency together with controller correlation.
- Empty or unavailable LLDP tables remain first-class outcomes rather than silent gaps.

## References

- [`../deeper-topology-truth-contract-v1.md`](../deeper-topology-truth-contract-v1.md)
- [`../lldp-physical-adjacency-implementation-deep-dive.md`](../lldp-physical-adjacency-implementation-deep-dive.md)