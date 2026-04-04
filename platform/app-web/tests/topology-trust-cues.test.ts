import { describe, expect, it } from "vitest";

import type {
  PlatformReadPathStatus,
  TopologyLinkRecord,
  TopologyResponse,
} from "../src/api/contracts";
import {
  describeTopologyCollectionPosture,
  describeTopologyCoveragePosture,
  describeTopologyInferencePosture,
  describeTopologyNodeParticipationPosture,
  describeTopologyReadPathCollection,
  describeTopologyReadPathInference,
  describeTopologyReadPathNodeParticipation,
  describeTopologyReadPathPairing,
  resolveTopologyCoverageSummary,
  resolveTopologyLinkEndpointPairingState,
} from "../src/lib/presentation";

function createLink(overrides: Partial<TopologyLinkRecord> = {}): TopologyLinkRecord {
  return {
    link_id: "link-1",
    source_node_id: "leaf-1",
    target_node_id: "spine-1",
    current_posture: "current",
    state: "up",
    last_recorded_state: "up",
    source: "collector",
    endpoint_pairing_state: "unknown",
    endpoint_evidence_count: null,
    physical_adjacency_posture: "suppressed_or_unknown",
    physical_adjacency: {
      posture: "suppressed_or_unknown",
      lldp_observation_count: 0,
      lldp_bidirectional: false,
      local_interfaces: [],
      remote_systems: [],
      remote_ports: [],
      correlation_notes: [],
    },
    attributes: {},
    ...overrides,
  };
}

function createResponse(overrides: Partial<TopologyResponse> = {}): TopologyResponse {
  return {
    service: "app-api",
    version: "test",
    phase: "phase_2_read_only_foundation",
    generated_at: "2025-01-01T00:00:00Z",
    data_status: "live",
    serving_mode: "live_collector",
    evidence_confidence: {
      source_posture: "live_observed",
      evidence_kind: "observed_plus_inferred",
      confidence_posture: "bounded_partial",
      freshness_posture: "current",
      blocked_reason: "none",
      summary: "test",
      notes: [],
    },
    summary: "test",
    served_persisted_at: null,
    comparison_to_latest_persisted: {
      status: "unavailable",
      summary: "test",
      comparison_snapshot_id: null,
      comparison_persisted_at: null,
      current_observed_at: null,
      current_node_count: 0,
      persisted_node_count: 0,
      current_link_count: 0,
      persisted_link_count: 0,
      node_count_delta: 0,
      link_count_delta: 0,
      added_node_count: 0,
      removed_node_count: 0,
      changed_node_count: 0,
      added_link_count: 0,
      removed_link_count: 0,
      changed_link_count: 0,
      notes: [],
    },
    coverage_summary: {
      inference_posture: "unknown",
      endpoint_pairing_posture: "unknown",
      collection_posture: "unknown",
      node_participation_posture: "unknown",
      paired_link_count: 0,
      single_sided_link_count: 0,
      linked_node_count: 0,
      isolated_node_count: 0,
      summary: "unknown",
    },
    topology: {
      topology_id: "topology-1",
      topology_name: "platform",
      nodes: [],
      links: [],
      sync_source: "collector",
      sync_status: "ok",
      completeness: "partial",
      observed_at: null,
      notes: [],
    },
    ...overrides,
  };
}

describe("topology trust cues", () => {
  it("preserves backend coverage summary when exposed", () => {
    const response = createResponse({
      coverage_summary: {
        inference_posture: "inferred",
        endpoint_pairing_posture: "partially_paired",
        collection_posture: "degraded",
        node_participation_posture: "partially_isolated",
        paired_link_count: 36,
        single_sided_link_count: 2,
        linked_node_count: 28,
        isolated_node_count: 6,
        summary: "Current normalized topology links include a mix of paired and single-sided endpoint evidence.",
      },
    });

    expect(resolveTopologyCoverageSummary(response)).toEqual(response.coverage_summary);
  });

  it("falls back to pairing state when coverage summary is absent", () => {
    const response = createResponse({
      coverage_summary: undefined as unknown as TopologyResponse["coverage_summary"],
      topology: {
        ...createResponse().topology,
        links: [
          createLink({ endpoint_pairing_state: "paired", endpoint_evidence_count: 2 }),
          createLink({ link_id: "link-2", endpoint_pairing_state: "single_sided", endpoint_evidence_count: 1 }),
        ],
      },
    });

    expect(resolveTopologyCoverageSummary(response)).toEqual({
      inference_posture: "inferred",
      endpoint_pairing_posture: "partially_paired",
      collection_posture: "ok",
      node_participation_posture: "unknown",
      paired_link_count: 1,
      single_sided_link_count: 1,
      linked_node_count: 0,
      isolated_node_count: 0,
      summary:
        "Current normalized topology links include a mix of paired and single-sided endpoint evidence within the bounded inference slice.",
    });
  });

  it("maps attribute fallback evidence counts into pairing state", () => {
    const link = createLink({
      endpoint_pairing_state: undefined as unknown as TopologyLinkRecord["endpoint_pairing_state"],
      endpoint_evidence_count: null,
      attributes: { endpoint_evidence_count: "2" },
    });

    expect(resolveTopologyLinkEndpointPairingState(link)).toBe("paired");
  });

  it("builds operator-facing readout for partial topology pairing", () => {
    const readout = describeTopologyCoveragePosture(
      {
        inference_posture: "inferred",
        endpoint_pairing_posture: "partially_paired",
        collection_posture: "degraded",
        node_participation_posture: "unknown",
        paired_link_count: 36,
        single_sided_link_count: 2,
        linked_node_count: 0,
        isolated_node_count: 0,
        summary: "Current normalized topology links include a mix of paired and single-sided endpoint evidence within the bounded inference slice.",
      },
      38,
    );

    expect(readout.label).toBe("Partially paired");
    expect(readout.countDetail).toBe("36 paired • 2 single-sided • 38 total links.");
  });

  it("builds operator-facing inference and collection readouts", () => {
    const coverageSummary = {
      inference_posture: "inferred" as const,
      endpoint_pairing_posture: "partially_paired" as const,
      collection_posture: "degraded" as const,
      node_participation_posture: "unknown" as const,
      paired_link_count: 36,
      single_sided_link_count: 2,
      linked_node_count: 0,
      isolated_node_count: 0,
      summary: "Current normalized topology links include a mix of paired and single-sided endpoint evidence within the bounded inference slice.",
    };

    expect(describeTopologyInferencePosture(coverageSummary, 38)).toEqual({
      status: "inferred",
      label: "Inferred slice",
      detail:
        "Current normalized topology links remain a bounded inferred slice rather than direct adjacency or controller truth. Separate from collection health and endpoint pairing strength. Trust cue only—not a validation verdict.",
    });
    expect(describeTopologyCollectionPosture(coverageSummary)).toEqual({
      status: "degraded",
      label: "Collection degraded",
      detail:
        "The current topology slice was collected with partial degradation, so operators should expect bounded gaps rather than full live coverage. Separate from inference-boundedness and endpoint pairing. Trust cue only—not a validation verdict.",
    });
  });

  it("builds a topology read-path pairing readout from platform-status data", () => {
    const readPath: PlatformReadPathStatus = {
      model_family: "topology",
      observation_state: "degraded",
      configured_target_count: 40,
      observed_target_count: 38,
      collection_success_count: 36,
      collection_partial_count: 2,
      collection_failure_count: 2,
      oldest_observed_at: null,
      newest_observed_at: null,
      policy_capable_target_count: null,
      detail_ready_target_count: null,
      inference_posture: "inferred",
      endpoint_pairing_posture: "partially_paired",
      collection_posture: "blocked",
      node_participation_posture: "partially_isolated",
      paired_link_count: 36,
      single_sided_link_count: 2,
      linked_node_count: 28,
      isolated_node_count: 6,
      degraded_scope_summary: "Two links remain single-sided.",
      summary: "Current normalized topology links include a mix of paired and single-sided endpoint evidence.",
      notes: [],
    };

    const readout = describeTopologyReadPathPairing(readPath);
    const inferenceReadout = describeTopologyReadPathInference(readPath);
    const collectionReadout = describeTopologyReadPathCollection(readPath);
    const nodeParticipationReadout = describeTopologyReadPathNodeParticipation(readPath);

    expect(readout.status).toBe("partially_paired");
    expect(readout.detail).toBe(
      `${readPath.summary} Aggregate endpoint evidence on links only; separate from node participation and collection posture. Trust cue only—not adjacency validation.`,
    );
    expect(readout.countDetail).toBe("36 paired • 2 single-sided • 38 total links.");
    expect(inferenceReadout).toEqual({
      status: "inferred",
      label: "Inferred slice",
      detail:
        "Platform status reports that topology links remain bounded to inferred evidence rather than direct adjacency truth. Prefer the topology API for the same axis when both are loaded. Trust cue only.",
    });
    expect(collectionReadout).toEqual({
      status: "blocked",
      label: "Collection blocked",
      detail:
        "Platform status reports that the current topology slice is blocked from normal live collection. Trust cue only.",
    });
    expect(nodeParticipationReadout).toEqual({
      status: "partially_isolated",
      label: "Partially isolated",
      detail:
        "Current topology nodes include a mix of linked and isolated observed nodes within the bounded inferred slice. Trust cue only—not a validation verdict.",
      countDetail: "28 linked • 6 isolated • 34 total nodes.",
    });
  });

  it("builds operator-facing node-participation readouts", () => {
    const readout = describeTopologyNodeParticipationPosture(
      {
        inference_posture: "inferred",
        endpoint_pairing_posture: "paired",
        collection_posture: "ok",
        node_participation_posture: "partially_isolated",
        paired_link_count: 36,
        single_sided_link_count: 0,
        linked_node_count: 28,
        isolated_node_count: 6,
        summary: "test",
      },
      34,
    );

    expect(readout).toEqual({
      status: "partially_isolated",
      label: "Partially isolated",
      detail:
        "Current topology nodes include a mix of linked and isolated observed nodes within the bounded inferred slice. Trust cue only—not a validation verdict.",
      countDetail: "28 linked • 6 isolated • 34 total nodes.",
    });
  });
});