import type {
  PlatformReadPathStatus,
  TopologyCoverageSummaryRecord,
  TopologyLinkRecord,
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
      return "good";
    case "degraded":
    case "partial":
    case "partially_paired":
    case "single_sided":
    case "partially_supported":
    case "planned":
    case "placeholder":
    case "stale":
    case "persisted_fallback":
    case "observed_plus_inferred":
    case "aggregate_only":
    case "aggregate_plus_bounded_records":
    case "bounded_partial":
      return "warn";
    case "down":
    case "failed":
    case "empty_scaffold":
    case "unsupported":
    case "unreachable":
    case "blocked":
    case "collector_unavailable":
    case "collector_unavailable_and_no_persisted_snapshot":
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
): TopologyCoverageSummaryRecord["endpoint_pairing_posture"] {
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

export function resolveTopologyCoverageSummary(
  response: Pick<TopologyResponse, "coverage_summary" | "topology">,
): TopologyCoverageSummaryRecord {
  if (response.coverage_summary) {
    return response.coverage_summary;
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
    endpoint_pairing_posture: endpointPairingPosture,
    paired_link_count: pairedLinkCount,
    single_sided_link_count: singleSidedLinkCount,
    summary,
  };
}

export interface TopologyCoverageReadout {
  status: TopologyCoverageSummaryRecord["endpoint_pairing_posture"];
  label: string;
  detail: string;
  countDetail: string;
}

export function describeTopologyCoveragePosture(
  coverageSummary: TopologyCoverageSummaryRecord,
  linkCount: number,
): TopologyCoverageReadout {
  const countDetail =
    linkCount === 0
      ? "No normalized links are currently emitted."
      : `${coverageSummary.paired_link_count} paired • ${coverageSummary.single_sided_link_count} single-sided • ${linkCount} total links.`;

  switch (coverageSummary.endpoint_pairing_posture) {
    case "paired":
      return {
        status: "paired",
        label: "Paired evidence",
        detail: coverageSummary.summary,
        countDetail,
      };
    case "partially_paired":
      return {
        status: "partially_paired",
        label: "Partially paired",
        detail: coverageSummary.summary,
        countDetail,
      };
    case "single_sided":
      return {
        status: "single_sided",
        label: "Single-sided evidence",
        detail: coverageSummary.summary,
        countDetail,
      };
    default:
      return {
        status: "unknown",
        label: linkCount === 0 ? "No link evidence" : "Coverage unclear",
        detail: coverageSummary.summary,
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
      endpoint_pairing_posture: readPath.endpoint_pairing_posture,
      paired_link_count: readPath.paired_link_count ?? 0,
      single_sided_link_count: readPath.single_sided_link_count ?? 0,
      summary: readPath.summary,
    },
    (readPath.paired_link_count ?? 0) + (readPath.single_sided_link_count ?? 0),
  );
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
