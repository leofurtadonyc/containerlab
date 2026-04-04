# Deeper topology truth v1 (Phase 2, read-only)

## Purpose

This document is the **backend-owned bounded contract** for **`topology_truth_v1`**: a **merged, source-aware** topology read model that combines the **normalized gNMI-backed topology snapshot**, **device-native LLDP physical adjacency evidence**, and **optional OpenDaylight RESTCONF** `network-topology` enrichment, without claiming **dataplane path truth**, **traffic-engineering authority**, or **controller-sole truth**.

Stable **`contract_id`:** **`topology_truth_v1`**

Implementation references:

- **`GET /api/v1/topology/truth`** — optional query **`truth_posture`** (filters merged nodes/links to one posture label after the full merge)
- **`schemas/topology_truth.py`**, **`services/topology_truth.py`**, **`integrations/odl/bgp_ls_topology.py`**, route on **`routers/topology.py`**
- Persistence: **`platform_app.topology_truth_snapshots`** (optional snapshot of merged payload; migration **`20260329_0011_topology_truth_v1`**)
- Metrics: **`platform_app_api_topology_truth_*`** on app-api **`/metrics`**
- Repository **`pytest`:** **`tests/test_topology_truth.py`**

---

## Honest limits (explicit non-claims)

The API echoes **`safety_framing.explicit_non_claims`**. Semantics align with:

- Merged topology truth is **not** end-to-end traffic path truth or full TE authority.
- ODL/controller inputs are **enrichment only**; the backend **owns** the merged read model.
- Interface-derived gNMI links remain distinct from LLDP-backed physical confirmation when sources disagree or controller data is missing.

---

## Evidence sources

| Source | Role |
| --- | --- |
| **Device / gNMI normalized topology** | Baseline nodes, links, and partiality from the same snapshot family as **`GET /api/v1/topology`**. |
| **LLDP / gNMI physical adjacency** | Device-native physical adjacency evidence when the target exposes usable OpenConfig LLDP rows. |
| **Controller BGP-LS / network-topology** | Bounded read of ODL **`/rests/data/network-topology:network-topology`** when available; may be empty or degraded. |
| **Persisted merge snapshot** | Optional durable row for last merged view (not a substitute for live merge semantics). |

---

## Response shape (summary)

- **`sources`:** contributing **`TopologySourceRef`** rows with freshness and authority posture.
- **`controller_fetch_status`:** `ok` | `degraded` | `unreachable` | `empty` — bounded health of the controller read, not controller correctness.
- **`freshness`:** per-channel and merged-view freshness labels.
- **`counts`:** merged node/link counts, inferred-only vs physically confirmed vs multi-source confirmed links, LLDP mismatch markers, controller-only / device-only nodes, conflicts, stale markers.
- **`disagreements`:** explicit cross-source disagreements for nodes or links.
- **`merged_topology`:** graph-shaped **`nodes`** / **`links`** with **`truth_posture`**, **`provenance`**, and structured **`physical_adjacency`** per link.

---

## WebUI

**Topology** exposes a **Deeper topology truth** panel: on-demand **Load merged truth** calls **`getTopologyTruth()`** (same contract). **`data-product-contract="topology_truth_v1"`** is retained in shipped bundles for **`verify-core-runtime.sh`** substring checks.

---

## Downstream relationships

- **Preview / validation / rollback:** use this contract as **read-side context** only; it does **not** replace preview diffs, validation verdicts, or rollback compensation semantics (`ADR-0003`, `ADR-0004`, `ADR-0005`, `ADR-0006`).
