# ADR-0008: Controller southbound evidence v1 (distinct protocol lanes)

## Status

Accepted.

## Context

The platform already had **bounded ODL RESTCONF** reads for **`network-topology`** (used by deeper topology truth) and a **YANG-library capability probe** (platform health). Operators still could not see **distinct, source-aware evidence lanes** for **BGP-LS**, **PCEP**, and **NETCONF** in one backend-owned read model, with explicit degradation when modules or southbound data are absent.

## Decision

Introduce **`controller_southbound_evidence_v1`**:

- **`GET /api/v1/controller/evidence`** returns an aggregate **`ControllerEvidenceResponse`** with three **`ProtocolLaneSummary`** objects: **`bgp_ls`**, **`pcep`**, **`netconf`**.
- **BGP-LS lane** reuses the existing **`fetch_bgpls_topology_via_odl`** parse (with optional **`preloaded_aggregate`** to avoid duplicate RESTCONF GETs when combined with lane partitioning).
- **PCEP** and **NETCONF** lanes partition the **same** network-topology aggregate JSON (`fetch_network_topology_aggregate`) using **topology-types** / **topology-id** heuristics; **NETCONF** may perform an additional bounded supplemental RESTCONF read when registered.
- **Controller reachability** comes from the existing **`OdlClient.read_controller_observation()`** probe (not equated with protocol session liveness on devices).
- **Postgres** table **`platform_app.controller_evidence_snapshots`** stores append-only lane payloads for review; live reads remain authoritative.
- **Prometheus** exposes **`platform_app_api_controller_evidence_*`** counters on app-api **`/metrics`**.
- **WebUI**: Platform Health includes an on-demand **Controller southbound evidence** panel; contract id **`controller_southbound_evidence_v1`**.

## Consequences

- The product can **honestly** show **empty / partial / available** per lane without collapsing everything into a single “controller topology” blob.
- **Backend** remains merge and product truth owner; ODL is **southbound helper / enrichment**, not sole authority.
- **Explicit non-claims** remain in API responses (no dataplane path truth, no TE omniscience).

## References

- [`agent/sdn/odl-controller.md`](../../../agent/sdn/odl-controller.md) (task intent)
- Implementation modules: `integrations/odl/network_topology_common.py`, `pcep_lane.py`, `netconf_lane.py`, `services/controller_evidence.py`
