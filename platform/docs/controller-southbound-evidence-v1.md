# Controller southbound evidence v1

**Historical:** the live product contract is **`controller_southbound_session_truth_v2`** — see [`controller-southbound-session-truth-v2.md`](controller-southbound-session-truth-v2.md) and [`ADR-0009`](decisions/ADR-0009-controller-southbound-session-truth-v2.md). This page documents the v1 shape.

## Contract

- **`contract_id`:** `controller_southbound_evidence_v1`
- **Aggregate API:** `GET /api/v1/controller/evidence`
- **Lane-only APIs:** `GET /api/v1/controller/evidence/bgpls` | `/pcep` | `/netconf`

## Behavior (summary)

1. **`fetch_network_topology_aggregate`** performs one bounded RESTCONF read of **`ietf-network-topology:network-topologies`** or legacy **`network-topology:network-topology`**.
2. **`fetch_bgpls_topology_via_odl(..., preloaded_aggregate=...)`** reuses that payload for the **BGP-LS** normalized snapshot (same enrichment path as deeper topology truth).
3. **`summarize_pcep_lane`** / **`summarize_netconf_lane`** inspect the aggregate for **PCEP**- and **NETCONF**-scoped topology entries (plus optional NETCONF supplemental paths).
4. **`OdlClient.read_controller_observation`** supplies **controller reachability** and capability-probe summary (orthogonal to per-protocol session state on the wire).

## Non-claims

See response **`safety_framing.explicit_non_claims`** and per-lane **`explicit_non_claims`**: RESTCONF presence does not prove dataplane forwarding, TE path truth, or full southbound session health on every device.

## References

- [`ADR-0008-controller-southbound-evidence-v1.md`](decisions/ADR-0008-controller-southbound-evidence-v1.md)
