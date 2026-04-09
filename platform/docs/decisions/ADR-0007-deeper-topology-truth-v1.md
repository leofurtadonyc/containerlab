# ADR-0007: Deeper topology truth v1 (merged multi-source read model)

## Status

Accepted.

## Context

The platform already serves a **normalized topology** read model from gNMI-backed collection. Operators need **clearer provenance** when **controller-exported** topology (e.g. ODL `network-topology`) is available, without treating any single source as universal truth or conflating topology adjacency with **path** or **forwarding** truth.

## Decision

Introduce **`topology_truth_v1`** as a **backend-owned merge**:

- **`GET /api/v1/topology/truth`** returns **`TopologyTruthResponse`** with per-object **postures**, **provenance**, **disagreements**, and **explicit non-claims**.
- Optional **ODL RESTCONF** read enriches when reachable; **degraded/empty** outcomes are first-class.
- Optional **Postgres** persistence of merged snapshots (`topology_truth_snapshots`) and **Prometheus** metrics **`platform_app_api_topology_truth_*`** for observability.
- **WebUI** surfaces an on-demand panel on **Topology**; contract id **`topology_truth_v1`** is retained in shipped JS for verifier alignment.

## Consequences

- Product copy can distinguish **inferred**, **device-observed**, **protocol-confirmed**, and **conflicting** cases without implying **dataplane** or **TE** completeness.
- ODL remains a **bounded integration**, not the architecture’s sole topology authority.

## References

- [`deeper-topology-truth-contract-v1.md`](../deeper-topology-truth-contract-v1.md)
