import type {
  CurrentRowPosture,
  PlatformReadPathStatus,
  PlatformRecoveryStatus,
  TopologyCollectionPosture,
  TopologyCoverageSummaryRecord,
  TopologyEndpointPairingPosture,
  TopologyInferencePosture,
  TopologyLinkRecord,
  TopologyNodeParticipationPosture,
  TopologyResponse,
} from "../api/contracts";

export function formatLabel(value: string): string {
  return value.split("_").join(" ");
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function getStatusTone(value: string): "good" | "warn" | "bad" | "neutral" {
  switch (value) {
    case "ok":
    case "up":
    case "paired":
    case "supported":
    case "implemented":
    case "active":
    case "healthy":
    case "current":
    case "live_collector":
    case "live_observed":
    case "direct_observed":
    case "strong_for_current_slice":
    case "fully_linked":
    case "preserved_same_workspace_baseline":
    case "live_recollection_ready":
      return "good";
    case "degraded":
    case "partial":
    case "partially_paired":
    case "single_sided":
    case "partially_supported":
    case "planned":
    case "placeholder":
    case "stale":
    case "inferred":
    case "persisted_fallback":
    case "observed_plus_inferred":
    case "aggregate_only":
    case "aggregate_plus_bounded_records":
    case "bounded_partial":
    case "partially_isolated":
    case "new_baseline":
    case "degraded_with_persisted_baseline":
      return "warn";
    case "down":
    case "failed":
    case "empty_scaffold":
    case "unsupported":
    case "unreachable":
    case "blocked":
    case "collector_unavailable":
    case "collector_unavailable_and_no_persisted_snapshot":
    case "isolated_only":
    case "degraded_without_persisted_baseline":
      return "bad";
    default:
      return "neutral";
  }
}

export function countBy<T>(
  items: T[],
  getKey: (item: T) => string,
): Record<string, number> {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

export function formatCountLabel(
  count: number,
  singularLabel: string,
  pluralLabel = `${singularLabel}s`,
): string {
  return `${count} ${count === 1 ? singularLabel : pluralLabel}`;
}

export interface FallbackAwareStatusDisplay {
  pillValue: string;
  note: string | null;
}

export interface RowPostureAwareStatusDisplay {
  pillValue: string;
  note: string | null;
}

export function buildFallbackAwareStatusDisplay(
  value: string,
  servingMode: "live_collector" | "persisted_fallback" | "empty_scaffold",
  notePrefix = "Last recorded",
): FallbackAwareStatusDisplay {
  if (servingMode === "persisted_fallback") {
    return {
      pillValue: "persisted_fallback",
      note: `${notePrefix}: ${formatLabel(value)}`,
    };
  }

  if (servingMode === "empty_scaffold") {
    return {
      pillValue: "empty_scaffold",
      note: null,
    };
  }

  return {
    pillValue: value,
    note: null,
  };
}

export function buildRowPostureStatusDisplay(
  currentPosture: CurrentRowPosture,
  currentValue: string,
  lastRecordedValue: string,
  notePrefix = "Last recorded",
): RowPostureAwareStatusDisplay {
  if (currentPosture === "stale") {
    return {
      pillValue: "stale",
      note: `${notePrefix}: ${formatLabel(lastRecordedValue)}`,
    };
  }

  return {
    pillValue: currentValue,
    note: null,
  };
}

export function formatRowCurrentPosture(currentPosture: CurrentRowPosture): string {
  return currentPosture === "stale" ? "Stale fallback" : "Current";
}

function parseCount(value: number | string | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, value);
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return Math.max(0, parsed);
    }
  }

  return 0;
}

export function resolveTopologyLinkEndpointEvidenceCount(link: TopologyLinkRecord): number {
  return parseCount(link.endpoint_evidence_count ?? link.attributes.endpoint_evidence_count);
}

export function resolveTopologyLinkEndpointPairingState(
  link: TopologyLinkRecord,
): TopologyEndpointPairingPosture {
  if (
    link.endpoint_pairing_state === "paired" ||
    link.endpoint_pairing_state === "single_sided" ||
    link.endpoint_pairing_state === "unknown"
  ) {
    return link.endpoint_pairing_state;
  }

  const attributeState = link.attributes.endpoint_pairing_state;
  if (
    attributeState === "paired" ||
    attributeState === "single_sided" ||
    attributeState === "unknown"
  ) {
    return attributeState;
  }

  const evidenceCount = resolveTopologyLinkEndpointEvidenceCount(link);
  if (evidenceCount >= 2) {
    return "paired";
  }
  if (evidenceCount === 1) {
    return "single_sided";
  }

  return "unknown";
}

function resolveTopologyInferencePosture(
  response: Pick<TopologyResponse, "coverage_summary" | "topology">,
): TopologyInferencePosture {
  if (
    response.coverage_summary &&
    (response.coverage_summary.inference_posture === "inferred" ||
      response.coverage_summary.inference_posture === "unknown")
  ) {
    return response.coverage_summary.inference_posture;
  }

  return response.topology.links.length > 0 ? "inferred" : "unknown";
}

function resolveTopologyCollectionPosture(
  response: Pick<TopologyResponse, "coverage_summary" | "topology" | "serving_mode">,
): TopologyCollectionPosture {
  if (
    response.coverage_summary &&
    (response.coverage_summary.collection_posture === "ok" ||
      response.coverage_summary.collection_posture === "degraded" ||
      response.coverage_summary.collection_posture === "blocked" ||
      response.coverage_summary.collection_posture === "unknown")
  ) {
    return response.coverage_summary.collection_posture;
  }

  if (response.serving_mode !== "live_collector") {
    return "blocked";
  }

  switch (response.topology.sync_status) {
    case "ok":
      return "ok";
    case "degraded":
      return "degraded";
    case "failed":
      return "blocked";
    default:
      return "unknown";
  }
}

export function resolveTopologyCoverageSummary(
  response: Pick<TopologyResponse, "coverage_summary" | "topology" | "serving_mode">,
): TopologyCoverageSummaryRecord {
  if (response.coverage_summary) {
    return {
      ...response.coverage_summary,
      inference_posture: resolveTopologyInferencePosture(response),
      collection_posture: resolveTopologyCollectionPosture(response),
    };
  }

  const pairedLinkCount = response.topology.links.filter(
    (link) => resolveTopologyLinkEndpointPairingState(link) === "paired",
  ).length;
  const singleSidedLinkCount = response.topology.links.filter(
    (link) => resolveTopologyLinkEndpointPairingState(link) === "single_sided",
  ).length;
  const linkCount = response.topology.links.length;

  let endpointPairingPosture: TopologyCoverageSummaryRecord["endpoint_pairing_posture"] =
    "unknown";
  if (linkCount === 0) {
    endpointPairingPosture = "unknown";
  } else if (pairedLinkCount === linkCount && singleSidedLinkCount === 0) {
    endpointPairingPosture = "paired";
  } else if (pairedLinkCount > 0 && singleSidedLinkCount > 0) {
    endpointPairingPosture = "partially_paired";
  } else if (pairedLinkCount === 0 && singleSidedLinkCount > 0) {
    endpointPairingPosture = "single_sided";
  }

  const linkedNodeIds = new Set(
    response.topology.links.flatMap((link) => [link.source_node_id, link.target_node_id]),
  );
  const linkedNodeCount = response.topology.nodes.filter((node) => linkedNodeIds.has(node.node_id)).length;
  const isolatedNodeCount = Math.max(0, response.topology.nodes.length - linkedNodeCount);
  let nodeParticipationPosture: TopologyNodeParticipationPosture = "unknown";
  if (response.topology.nodes.length === 0) {
    nodeParticipationPosture = "unknown";
  } else if (linkedNodeCount === response.topology.nodes.length && isolatedNodeCount === 0) {
    nodeParticipationPosture = "fully_linked";
  } else if (linkedNodeCount > 0 && isolatedNodeCount > 0) {
    nodeParticipationPosture = "partially_isolated";
  } else if (linkedNodeCount === 0 && isolatedNodeCount === response.topology.nodes.length) {
    nodeParticipationPosture = "isolated_only";
  }

  let summary =
    "Current topology response cannot summarize endpoint-pairing posture honestly from the available normalized link evidence.";
  if (linkCount === 0) {
    summary =
      "Current topology response does not emit any normalized links, so endpoint-pairing posture remains unknown.";
  } else if (endpointPairingPosture === "paired") {
    summary =
      "All emitted normalized topology links are currently backed by paired endpoint evidence within the bounded inference slice.";
  } else if (endpointPairingPosture === "partially_paired") {
    summary =
      "Current normalized topology links include a mix of paired and single-sided endpoint evidence within the bounded inference slice.";
  } else if (endpointPairingPosture === "single_sided") {
    summary =
      "Current normalized topology links are inferred from single-sided endpoint evidence only within the bounded inference slice.";
  }

  return {
    inference_posture: resolveTopologyInferencePosture(response),
    endpoint_pairing_posture: endpointPairingPosture,
    collection_posture: resolveTopologyCollectionPosture(response),
    node_participation_posture: nodeParticipationPosture,
    paired_link_count: pairedLinkCount,
    single_sided_link_count: singleSidedLinkCount,
    linked_node_count: linkedNodeCount,
    isolated_node_count: isolatedNodeCount,
    summary,
  };
}

export interface TopologyPostureReadout<TStatus extends string> {
  status: TStatus;
  label: string;
  detail: string;
}

export interface TopologyCoverageReadout {
  status: TopologyEndpointPairingPosture;
  label: string;
  detail: string;
  countDetail: string;
}

export interface TopologyNodeParticipationReadout {
  status: TopologyNodeParticipationPosture;
  label: string;
  detail: string;
  countDetail: string;
}

export function describeTopologyInferencePosture(
  coverageSummary: TopologyCoverageSummaryRecord,
  linkCount: number,
): TopologyPostureReadout<TopologyInferencePosture> {
  if (coverageSummary.inference_posture === "inferred") {
    return {
      status: "inferred",
      label: "Inferred slice",
      detail:
        linkCount === 0
          ? "Topology currently exposes no normalized links, but any future link slice remains bounded to inferred evidence rather than protocol-derived adjacency truth. Separate from collection health and endpoint pairing strength. Trust cue only—not a validation verdict."
          : "Current normalized topology links remain a bounded inferred slice rather than direct adjacency or controller truth. Separate from collection health and endpoint pairing strength. Trust cue only—not a validation verdict.",
    };
  }

  return {
    status: "unknown",
    label: linkCount === 0 ? "No inferred links" : "Inference unclear",
    detail:
      linkCount === 0
        ? "No normalized links are currently emitted, so inference posture stays unknown. Trust cue only—not a validation verdict."
        : "The current topology response does not expose enough evidence to classify inference posture more clearly. Trust cue only—not a validation verdict.",
  };
}

export function describeTopologyCollectionPosture(
  coverageSummary: TopologyCoverageSummaryRecord,
): TopologyPostureReadout<TopologyCollectionPosture> {
  switch (coverageSummary.collection_posture) {
    case "ok":
      return {
        status: "ok",
        label: "Collection ok",
        detail:
          "The current topology slice comes from a usable live collection window rather than a blocked or degraded one. Separate from inference-boundedness and per-link endpoint pairing. Trust cue only—not a validation verdict.",
      };
    case "degraded":
      return {
        status: "degraded",
        label: "Collection degraded",
        detail:
          "The current topology slice was collected with partial degradation, so operators should expect bounded gaps rather than full live coverage. Separate from inference-boundedness and endpoint pairing. Trust cue only—not a validation verdict.",
      };
    case "blocked":
      return {
        status: "blocked",
        label: "Collection blocked",
        detail:
          "The current topology slice is not backed by a normal live collection window and should be treated as fallback or blocked posture. Trust cue only—not a validation verdict.",
      };
    default:
      return {
        status: "unknown",
        label: "Collection unclear",
        detail:
          "The current topology response does not expose a clearer collection posture for this slice. Trust cue only—not a validation verdict.",
      };
  }
}

export function describeTopologyCoveragePosture(
  coverageSummary: TopologyCoverageSummaryRecord,
  linkCount: number,
): TopologyCoverageReadout {
  const countDetail =
    linkCount === 0
      ? "No normalized links are currently emitted."
      : `${coverageSummary.paired_link_count} paired • ${coverageSummary.single_sided_link_count} single-sided • ${linkCount} total links.`;

  const pairingScopeNote =
    " Aggregate endpoint evidence on links only; separate from node participation and collection posture. Trust cue only—not adjacency validation.";

  switch (coverageSummary.endpoint_pairing_posture) {
    case "paired":
      return {
        status: "paired",
        label: "Paired evidence",
        detail: `${coverageSummary.summary}${pairingScopeNote}`,
        countDetail,
      };
    case "partially_paired":
      return {
        status: "partially_paired",
        label: "Partially paired",
        detail: `${coverageSummary.summary}${pairingScopeNote}`,
        countDetail,
      };
    case "single_sided":
      return {
        status: "single_sided",
        label: "Single-sided evidence",
        detail: `${coverageSummary.summary}${pairingScopeNote}`,
        countDetail,
      };
    default:
      return {
        status: "unknown",
        label: linkCount === 0 ? "No link evidence" : "Coverage unclear",
        detail: `${coverageSummary.summary}${pairingScopeNote}`,
        countDetail,
      };
  }
}

export function describeTopologyReadPathPairing(
  readPath: PlatformReadPathStatus | null,
): TopologyCoverageReadout {
  if (!readPath || readPath.endpoint_pairing_posture === null) {
    return {
      status: "unknown",
      label: "Not exposed",
      detail: "The current platform-status response does not expose topology endpoint-pairing posture.",
      countDetail: "Pairing counts are not exposed on this response.",
    };
  }

  return describeTopologyCoveragePosture(
    {
      inference_posture: readPath.inference_posture ?? "unknown",
      endpoint_pairing_posture: readPath.endpoint_pairing_posture,
      collection_posture: readPath.collection_posture ?? "unknown",
      node_participation_posture: readPath.node_participation_posture ?? "unknown",
      paired_link_count: readPath.paired_link_count ?? 0,
      single_sided_link_count: readPath.single_sided_link_count ?? 0,
      linked_node_count: readPath.linked_node_count ?? 0,
      isolated_node_count: readPath.isolated_node_count ?? 0,
      summary: readPath.summary,
    },
    (readPath.paired_link_count ?? 0) + (readPath.single_sided_link_count ?? 0),
  );
}

export function describeTopologyNodeParticipationPosture(
  coverageSummary: TopologyCoverageSummaryRecord,
  nodeCount: number,
): TopologyNodeParticipationReadout {
  const countDetail =
    nodeCount === 0
      ? "No normalized nodes are currently emitted."
      : `${coverageSummary.linked_node_count} linked • ${coverageSummary.isolated_node_count} isolated • ${nodeCount} total nodes.`;

  switch (coverageSummary.node_participation_posture) {
    case "fully_linked":
      return {
        status: "fully_linked",
        label: "Fully linked",
        detail:
          "All currently emitted topology nodes participate in at least one normalized link within the bounded inferred slice. Separate from per-link endpoint pairing; fully linked does not mean every link is paired. Trust cue only—not a validation verdict.",
        countDetail,
      };
    case "partially_isolated":
      return {
        status: "partially_isolated",
        label: "Partially isolated",
        detail:
          "Current topology nodes include a mix of linked and isolated observed nodes within the bounded inferred slice. Trust cue only—not a validation verdict.",
        countDetail,
      };
    case "isolated_only":
      return {
        status: "isolated_only",
        label: "Isolated only",
        detail:
          "Current topology nodes are present, but none currently participate in a normalized link within the bounded inferred slice. Trust cue only—not a validation verdict.",
        countDetail,
      };
    default:
      return {
        status: "unknown",
        label: nodeCount === 0 ? "No nodes emitted" : "Participation unclear",
        detail:
          nodeCount === 0
            ? "No normalized nodes are currently emitted, so node-participation posture remains unknown. Trust cue only—not a validation verdict."
            : "The current topology response does not expose enough evidence to classify node participation more clearly. Trust cue only—not a validation verdict.",
        countDetail,
      };
  }
}

export function describeTopologyReadPathNodeParticipation(
  readPath: PlatformReadPathStatus | null,
): TopologyNodeParticipationReadout {
  if (!readPath || readPath.node_participation_posture === null) {
    return {
      status: "unknown",
      label: "Not exposed",
      detail: "The current platform-status response does not expose topology node-participation posture.",
      countDetail: "Linked-versus-isolated node counts are not exposed on this response.",
    };
  }

  const linkedNodeCount = readPath.linked_node_count ?? 0;
  const isolatedNodeCount = readPath.isolated_node_count ?? 0;
  return describeTopologyNodeParticipationPosture(
    {
      inference_posture: readPath.inference_posture ?? "unknown",
      endpoint_pairing_posture: readPath.endpoint_pairing_posture ?? "unknown",
      collection_posture: readPath.collection_posture ?? "unknown",
      node_participation_posture: readPath.node_participation_posture,
      paired_link_count: readPath.paired_link_count ?? 0,
      single_sided_link_count: readPath.single_sided_link_count ?? 0,
      linked_node_count: linkedNodeCount,
      isolated_node_count: isolatedNodeCount,
      summary: readPath.summary,
    },
    linkedNodeCount + isolatedNodeCount,
  );
}

export function describeTopologyReadPathInference(
  readPath: PlatformReadPathStatus | null,
): TopologyPostureReadout<TopologyInferencePosture | "unknown"> {
  if (!readPath || readPath.inference_posture === null) {
    return {
      status: "unknown",
      label: "Not exposed",
      detail: "The current platform-status response does not expose topology inference posture.",
    };
  }

  if (readPath.inference_posture === "inferred") {
    return {
      status: "inferred",
      label: "Inferred slice",
      detail:
        "Platform status reports that topology links remain bounded to inferred evidence rather than direct adjacency truth. Prefer the topology API for the same axis when both are loaded. Trust cue only.",
    };
  }

  return {
    status: "unknown",
    label: "Inference unclear",
    detail:
      "Platform status does not provide enough evidence to classify topology inference posture more strongly. Trust cue only.",
  };
}

export function describeTopologyReadPathCollection(
  readPath: PlatformReadPathStatus | null,
): TopologyPostureReadout<TopologyCollectionPosture | "unknown"> {
  if (!readPath || readPath.collection_posture === null) {
    return {
      status: "unknown",
      label: "Not exposed",
      detail: "The current platform-status response does not expose topology collection posture.",
    };
  }

  switch (readPath.collection_posture) {
    case "ok":
      return {
        status: "ok",
        label: "Collection ok",
        detail:
          "Platform status reports a usable live topology collection window for the current bounded slice. Prefer the topology API for the same axis when both are loaded. Trust cue only.",
      };
    case "degraded":
      return {
        status: "degraded",
        label: "Collection degraded",
        detail:
          "Platform status reports partial degradation in the current topology collection window. Trust cue only.",
      };
    case "blocked":
      return {
        status: "blocked",
        label: "Collection blocked",
        detail:
          "Platform status reports that the current topology slice is blocked from normal live collection. Trust cue only.",
      };
    default:
      return {
        status: "unknown",
        label: "Collection unclear",
        detail:
          "Platform status does not provide enough evidence to classify topology collection posture more strongly. Trust cue only.",
      };
  }
}

export function describeTopologyLinkPairing(link: TopologyLinkRecord): string {
  const endpointPairingState = resolveTopologyLinkEndpointPairingState(link);
  const endpointEvidenceCount = resolveTopologyLinkEndpointEvidenceCount(link);

  if (endpointPairingState === "paired") {
    return `Paired endpoint evidence from ${formatCountLabel(endpointEvidenceCount, "endpoint")}.`;
  }
  if (endpointPairingState === "single_sided") {
    return `Single-sided endpoint evidence from ${formatCountLabel(endpointEvidenceCount, "endpoint")}.`;
  }

  return "Endpoint pairing remains unknown in the current normalized topology contract.";
}

export interface RecoveryPostureReadout {
  baselineLabel: string;
  readSideLabel: string;
  summary: string;
  artifactCount: number;
  artifactTotal: number;
}

export function describeRecoveryPosture(
  recovery: PlatformRecoveryStatus | null | undefined,
): RecoveryPostureReadout | null {
  if (!recovery) {
    return null;
  }

  const baselineLabels: Record<PlatformRecoveryStatus["baseline_posture"], string> = {
    preserved_same_workspace_baseline: "Preserved same-workspace baseline",
    new_baseline: "New baseline",
  };

  const readSideLabels: Record<PlatformRecoveryStatus["read_side_posture"], string> = {
    live_recollection_ready: "Live recollection ready",
    degraded_with_persisted_baseline: "Degraded with persisted baseline",
    degraded_without_persisted_baseline: "Degraded without persisted baseline",
  };

  const artifacts = recovery.persisted_artifacts;
  const artifactCount = [
    artifacts.inventory_snapshot,
    artifacts.topology_snapshot,
    artifacts.policy_snapshot,
    artifacts.sync_history,
    artifacts.readiness_snapshot,
  ].filter(Boolean).length;
  const artifactTotal = 5;

  return {
    baselineLabel: baselineLabels[recovery.baseline_posture],
    readSideLabel: readSideLabels[recovery.read_side_posture],
    summary: recovery.summary,
    artifactCount,
    artifactTotal,
  };
}
