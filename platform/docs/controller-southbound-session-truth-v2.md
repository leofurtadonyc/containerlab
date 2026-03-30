# Controller southbound session truth v2

**Contract id:** `controller_southbound_session_truth_v2`  
**Endpoints:** `GET /api/v1/controller/evidence`, `.../bgpls`, `.../pcep`, `.../netconf`

## Purpose

Expose **honest, bounded** controller-exported evidence for **BGP-LS**, **PCEP**, and **NETCONF** southbound lanes so operators can distinguish:

- **Controller reachability** (RESTCONF / capability-style probe) from **per-lane southbound session posture**
- **Protocol exposure** (YANG catalog hints) from **object visibility** and **session-backed** hints
- **Strong** evidence (protocol-native or session-oriented JSON) from **weaker** derivation (topology partition, heuristic scan)

This is **not** wire-level proof on every device, **not** dataplane or TE authority, **not** a guarantee that every southbound session is healthy.

## Field model (summary)

| Field | Role |
| --- | --- |
| `controller_reachability` | From `OdlClient.read_controller_observation()` — separate from lane session truth |
| `yang_module_catalog_count` | Number of module names returned from `ietf-yang-library` modules-state (0 on failure) |
| `lane_posture` | Lane-level availability / emptiness / degradation |
| `protocol_exposure_posture` | Whether the YANG catalog suggests the protocol family is present on the controller |
| `object_visibility_posture` | Whether protocol-related topology/objects were observed vs scope-only |
| `session_posture` | Best-effort southbound session hint from native + derived inputs |
| `evidence_strength` | e.g. `session_backed`, `object_backed`, `scope_only`, `heuristic_only`, `unavailable` |
| `derivation_mode` | e.g. `protocol_native`, `controller_object_parse`, `topology_partition_heuristic`, `supplemental_restconf` |
| `fallback_notes` | Short explanations when not using the strongest source |

## Implementation map

1. **`fetch_yang_module_names` / `module_hints_for_lanes`** — module inventory and coarse family flags per lane.
2. **`probe_*_native`** — bounded RESTCONF GETs and JSON scans for session-oriented lists under known ODL families (best-effort; 404/degraded paths are normal).
3. **Existing lane summaries** — `fetch_bgpls_topology_via_odl`, `summarize_pcep_lane`, `summarize_netconf_lane` on `fetch_network_topology_aggregate`.
4. **`derive_*_truth`** — merges native probes + summaries + hints into `LaneTruthDerivation`, then **`_lane_v2`** builds `ProtocolLaneDetailV2`.
5. **Persistence** — `ControllerEvidenceSnapshotTable.lanes_payload` JSON includes each lane’s `model_dump`, `contract_id`, and `yang_module_catalog_count`.
6. **Metrics** — `record_controller_evidence_v2_observation` increments reachability and per-lane session/evidence counters.

## Limitations

- ODL may not expose clean, stable RESTCONF trees for every session type; **unknown** / **not_observed** are valid outcomes.
- Heuristic JSON scans can produce false negatives; **derivation_mode** and **fallback_notes** document that path.
- Lane-only routes call the full aggregate builder (same as v1 cost profile).

## Related

- **ADR:** [`decisions/ADR-0009-controller-southbound-session-truth-v2.md`](decisions/ADR-0009-controller-southbound-session-truth-v2.md)
- **Prior v1 doc:** [`controller-southbound-evidence-v1.md`](controller-southbound-evidence-v1.md)
