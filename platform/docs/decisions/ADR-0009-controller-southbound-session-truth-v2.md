# ADR-0009: Controller southbound session truth v2 (verified lanes)

## Status

Accepted.

## Context

**ADR-0008** introduced **`controller_southbound_evidence_v1`**: three distinct lanes (BGP-LS, PCEP, NETCONF) with lane **posture** and shared topology reads. That improved structure, but **controller reachability** (RESTCONF / YANG-library probe) could still be read as implying southbound protocol health. PCEP and NETCONF lanes leaned on **topology partitioning** when module-specific session state was not surfaced distinctly.

## Decision

Evolve the aggregate read model to **`controller_southbound_session_truth_v2`**:

- **Contract id:** `controller_southbound_session_truth_v2`.
- **Per lane (`ProtocolLaneDetailV2`):** `lane_posture`, `protocol_exposure_posture`, `object_visibility_posture`, `session_posture`, `evidence_strength`, `derivation_mode`, `fallback_notes`, lane + aggregate `explicit_non_claims`.
- **Aggregate:** `controller_reachability` (unchanged probe family), `controller_capability_probe_summary`, `yang_module_catalog_count`, `aggregate_fetch_notes`, `safety_framing`.
- **ODL integration:** `yang_module_catalog` (module names + per-lane hints), `native_session_probes` (bounded RESTCONF reads / JSON scans for session-oriented hints), `session_truth_derivation` (combines native probes, lane summaries, topology aggregate).
- **Persistence:** `platform_app.controller_evidence_snapshots.lanes_payload` stores full lane JSON plus `contract_id` and `yang_module_catalog_count`.
- **Metrics:** existing fetch/reachability counters plus **`platform_app_api_controller_evidence_lane_posture_total`**, **`platform_app_api_controller_evidence_lane_session_posture_total`**, **`platform_app_api_controller_evidence_lane_evidence_strength_total`**, and **`platform_app_api_controller_evidence_lane_session_backed_total`** (labeled by lane).
- **WebUI:** Platform Health panel uses contract marker **`controller_southbound_session_truth_v2`** and shows session posture, evidence strength, derivation mode, catalog count.

## Consequences

- Reachability and southbound session truth are **structurally separable** in API responses.
- Missing YANG catalog access now leaves protocol exposure at **`unknown`**; the platform only emits **`unsupported`** when both module exposure and lane-native/object evidence are absent.
- Weaker derivations (topology partition, heuristic scan) must be labeled via **`derivation_mode`** and **`fallback_notes`**, not hidden.
- **ADR-0008** remains the historical record of v1; v2 **supersedes** the product contract while reusing endpoints and persistence table shape.

## References

- [`agent/sdn/odl-controller-part2.md`](../../../agent/sdn/odl-controller-part2.md)
- [`platform/docs/controller-southbound-session-truth-v2.md`](../controller-southbound-session-truth-v2.md)
- Code: `integrations/odl/yang_module_catalog.py`, `native_session_probes.py`, `session_truth_derivation.py`, `services/controller_evidence.py`, `schemas/controller_evidence.py`
