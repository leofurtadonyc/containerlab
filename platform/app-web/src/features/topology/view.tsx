import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  ControllerEvidenceResponse,
  EvidenceConfidenceSummary,
  TopologyLinkRecord,
  TopologyNodeRecord,
  TopologyTruthResponse,
} from "../../api/contracts";
import { ApiClientError, apiClient } from "../../api/client";
import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { IdentifierChip } from "../../components/identifier-chip";
import { StatusPill } from "../../components/status-pill";
import { WorkspaceHeader } from "../../components/workspace-header";
import { buildCrossSliceConsistencyReadout } from "../../lib/cross-slice-consistency";
import {
  buildFallbackAwareStatusDisplay,
  buildRowPostureStatusDisplay,
  countBy,
  describeTopologyCollectionPosture,
  describeTopologyCoveragePosture,
  describeTopologyInferencePosture,
  describeTopologyLinkPairing,
  formatRowCurrentPosture,
  formatCountLabel,
  formatDateTime,
  formatLabel,
} from "../../lib/presentation";
import {
  buildPolicyEvidenceFallback,
  buildTopologyEvidenceFallback,
  describeBlockedReason,
  describeConfidencePosture,
  describeEvidenceKind,
  describeEvidenceSource,
  normalizeEvidenceConfidence,
} from "../../lib/evidence-confidence";
import {
  DOSSIER_SOURCE_PARAM,
  TOPOLOGY_WORKSPACE_PARAM,
  navigateToTopologyDossier,
} from "../../lib/topology-dossier-navigation";
import { useReplaceUrlSearchParams, useUrlSearchParamsKey } from "../../lib/use-url-search-params";
import { EvidenceQualitySurfaceEntry } from "../evidence-quality-workspace/surface-entry";
import { InvestigationSurfaceEntry } from "../investigation/investigation-surface-entry";
import { usePoliciesQuery } from "../policies/api";
import {
  getTopologyCoverageSummary,
  getTopologyLinkEndpointEvidenceCount,
  getTopologyLinkEndpointPairingState,
  getTopologyNodeParticipationReadout,
  useTopologyQuery,
  useTopologyRiskSummaryQuery,
} from "./api";
import { TopologyRiskAttentionPanel } from "./topology-risk-attention-panel";
import { TopologyFailureImpactPanel } from "./topology-failure-impact-panel";
import { TopologyRelatedPoliciesPanel } from "./topology-related-policies-panel";
import { TopologyObjectDossierWorkspace } from "./topology-object-dossier-workspace";
import { TopologyObjectEvidenceDeltaPanel } from "./topology-object-evidence-delta-panel";
import { TopologyObjectEvidenceTimelinePanel } from "./topology-object-evidence-timeline-panel";

function readTopologyWorkspaceFromUrl(): "standard" | "dossier" {
  if (typeof window === "undefined") {
    return "standard";
  }
  return new URLSearchParams(window.location.search).get(TOPOLOGY_WORKSPACE_PARAM) === "dossier"
    ? "dossier"
    : "standard";
}

function readTopologySelectionFromUrl(): { nodeId: string | null; linkId: string | null } {
  if (typeof window === "undefined") {
    return { nodeId: null, linkId: null };
  }
  const sp = new URLSearchParams(window.location.search);
  const oid = sp.get("topology_object");
  const kind = sp.get("topology_object_kind");
  if (oid && kind === "node") {
    return { nodeId: oid, linkId: null };
  }
  if (oid && kind === "link") {
    return { nodeId: null, linkId: oid };
  }
  return { nodeId: null, linkId: null };
}

function getLinkKnowledgeState(link: TopologyLinkRecord): string {
  return link.attributes.knowledge_state ?? "unknown";
}

function getLinkPhysicalAdjacencyPosture(link: TopologyLinkRecord): string {
  return link.physical_adjacency_posture ?? link.physical_adjacency?.posture ?? "suppressed_or_unknown";
}

function getLinkControlPlaneAdjacencyPosture(link: TopologyLinkRecord): string {
  return (
    link.control_plane_adjacency_posture ??
    link.control_plane_adjacency?.posture ??
    "suppressed_or_unknown"
  );
}

function formatSignedDelta(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }
  return `${value}`;
}

function getServingModeReadout(
  servingMode: "live_collector" | "persisted_fallback" | "empty_scaffold",
): { label: string; detail: string } {
  if (servingMode === "live_collector") {
    return {
      label: "Live collector",
      detail:
        "Current topology is being served from the live collector-backed normalized read path.",
    };
  }
  if (servingMode === "persisted_fallback") {
    return {
      label: "Persisted fallback",
      detail:
        "Current topology is being served from the latest persisted normalized topology snapshot because the live collector path is unavailable.",
    };
  }
  return {
    label: "Empty scaffold",
    detail:
      "Neither a live collector snapshot nor a persisted fallback snapshot could be loaded beyond the empty scaffold.",
  };
}

function describeTimeGap(start: string | null, end: string | null): string {
  if (!start || !end) {
    return "Not available";
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Timestamp could not be interpreted";
  }

  const gapSeconds = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 1000));
  if (gapSeconds < 60) {
    return `${gapSeconds}s`;
  }

  const gapMinutes = Math.round(gapSeconds / 60);
  return `${gapMinutes}m`;
}

function describeComparisonReadout(
  status: "unavailable" | "live_vs_latest_persisted_ready",
  servingMode: "live_collector" | "persisted_fallback" | "empty_scaffold",
): { label: string; detail: string } {
  if (status === "live_vs_latest_persisted_ready") {
    return {
      label: "Comparison ready",
      detail:
        "Bounded normalized comparison is available between the current topology response and the latest persisted topology snapshot.",
    };
  }
  if (servingMode === "persisted_fallback") {
    return {
      label: "Fallback serving",
      detail:
        "Comparison is unavailable here because the current response already reflects the persisted fallback snapshot.",
    };
  }
  return {
    label: "Comparison unavailable",
    detail:
      "The backend does not currently have the extra persisted topology evidence needed for a bounded comparison.",
  };
}

function describeNodeEvidence(node: TopologyNodeRecord): string {
  const hasLoopback =
    node.attributes.loopback_ipv4 !== undefined && node.attributes.loopback_ipv4 !== "unknown";
  if (node.device_id && hasLoopback) {
    return "Linked device plus loopback evidence";
  }
  if (node.device_id) {
    return "Linked device evidence";
  }
  if (hasLoopback) {
    return "Loopback-only evidence";
  }
  return "Limited node evidence";
}

function describeLinkEvidence(link: TopologyLinkRecord): string {
  const physicalAdjacencyPosture = getLinkPhysicalAdjacencyPosture(link);
  const controlPlaneAdjacencyPosture = getLinkControlPlaneAdjacencyPosture(link);
  const knowledgeState = getLinkKnowledgeState(link);
  const pairingState = getTopologyLinkEndpointPairingState(link);
  if (controlPlaneAdjacencyPosture === "igp_confirmed") {
    const protocols = link.control_plane_adjacency.protocols_observed.join(" / ").toUpperCase();
    return protocols
      ? `${protocols} confirms a live control-plane adjacency on this link`
      : "Device-native IGP confirms a live control-plane adjacency on this link";
  }
  if (controlPlaneAdjacencyPosture === "ospf_observed") {
    return "OSPF observes this adjacency, but the state is weaker than a full confirmation";
  }
  if (controlPlaneAdjacencyPosture === "isis_observed") {
    return "IS-IS observes this adjacency, but the state is weaker than a full confirmation";
  }
  if (controlPlaneAdjacencyPosture === "protocol_mismatch") {
    return "Device-native IGP points at a different neighbor than the current normalized link correlation";
  }
  if (physicalAdjacencyPosture === "bidirectional_lldp") {
    return "Bidirectional LLDP confirms the physical adjacency";
  }
  if (physicalAdjacencyPosture === "single_sided_lldp") {
    return "LLDP observed one side of the physical adjacency";
  }
  if (physicalAdjacencyPosture === "lldp_mismatch") {
    return "LLDP contradicts the current interface-derived peer mapping";
  }
  if (knowledgeState === "partial" && pairingState === "single_sided") {
    return "Partial single-sided endpoint inference";
  }
  if (knowledgeState === "partial" && pairingState === "paired") {
    return "Partial inferred link with paired endpoint evidence";
  }
  if (pairingState === "paired") {
    return "Paired endpoint evidence";
  }
  if (pairingState === "single_sided") {
    return "Single-sided endpoint evidence";
  }
  if (knowledgeState === "unknown") {
    return "Knowledge remains unknown";
  }
  return "Bounded inferred link evidence";
}

function buildFreshnessSummary(observedAt: string | null, generatedAt: string) {
  if (!observedAt) {
    return {
      label: "Unknown",
      detail: "The topology response does not currently include an observed timestamp.",
    };
  }

  const observedDate = new Date(observedAt);
  const generatedDate = new Date(generatedAt);

  if (Number.isNaN(observedDate.getTime()) || Number.isNaN(generatedDate.getTime())) {
    return {
      label: "Unclear",
      detail: "The topology timestamps could not be interpreted in the current browser.",
    };
  }

  const ageMinutes = Math.max(0, Math.round((generatedDate.getTime() - observedDate.getTime()) / 60000));
  if (ageMinutes <= 5) {
    return {
      label: "Fresh",
      detail: `Observed ${ageMinutes} minute${ageMinutes === 1 ? "" : "s"} before the API response was generated.`,
    };
  }
  if (ageMinutes <= 30) {
    return {
      label: "Aging",
      detail: `Observed ${ageMinutes} minute${ageMinutes === 1 ? "" : "s"} before the API response was generated.`,
    };
  }
  return {
    label: "Stale",
    detail: `Observed ${ageMinutes} minute${ageMinutes === 1 ? "" : "s"} before the API response was generated.`,
  };
}

export function TopologyView() {
  const { data, error, isLoading, reload } = useTopologyQuery();
  const riskSummaryQuery = useTopologyRiskSummaryQuery(Boolean(data));
  const {
    data: policyData,
    error: policyError,
    isLoading: isPolicyLoading,
  } = usePoliciesQuery();
  const replaceUrlSearchParams = useReplaceUrlSearchParams();
  const initialTopologySelection = readTopologySelectionFromUrl();
  const [nodeSearchValue, setNodeSearchValue] = useState("");
  const [nodeStateFilter, setNodeStateFilter] = useState("all");
  const [nodeRoleFilter, setNodeRoleFilter] = useState("all");
  const [nodeSortBy, setNodeSortBy] = useState("state_then_name");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialTopologySelection.nodeId);
  const [linkSearchValue, setLinkSearchValue] = useState("");
  const [linkStateFilter, setLinkStateFilter] = useState("all");
  const [linkKnowledgeFilter, setLinkKnowledgeFilter] = useState("all");
  const [linkEvidenceFilter, setLinkEvidenceFilter] = useState("all");
  const [linkSortBy, setLinkSortBy] = useState("state_then_id");
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(initialTopologySelection.linkId);
  const [workspaceMode, setWorkspaceMode] = useState<"standard" | "dossier">(readTopologyWorkspaceFromUrl);
  const [controllerEvidence, setControllerEvidence] = useState<ControllerEvidenceResponse | null>(null);
  const [controllerEvidenceLoading, setControllerEvidenceLoading] = useState(false);
  const [controllerEvidenceError, setControllerEvidenceError] = useState<string | null>(null);
  const [truthData, setTruthData] = useState<TopologyTruthResponse | null>(null);
  const [truthLoading, setTruthLoading] = useState(false);
  const [truthError, setTruthError] = useState<string | null>(null);
  const loadControllerEvidence = useCallback(async () => {
    setControllerEvidenceLoading(true);
    setControllerEvidenceError(null);
    try {
      const ce = await apiClient.getControllerEvidence();
      setControllerEvidence(ce);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Failed to load controller southbound evidence.";
      setControllerEvidenceError(message);
    } finally {
      setControllerEvidenceLoading(false);
    }
  }, []);
  const loadTopologyTruth = useCallback(async () => {
    setTruthLoading(true);
    setTruthError(null);
    try {
      const t = await apiClient.getTopologyTruth();
      setTruthData(t);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Failed to load topology truth.";
      setTruthError(message);
    } finally {
      setTruthLoading(false);
    }
  }, []);
  const searchKey = useUrlSearchParamsKey();

  useEffect(() => {
    const sp = new URLSearchParams(searchKey);
    const next = sp.get(TOPOLOGY_WORKSPACE_PARAM) === "dossier" ? "dossier" : "standard";
    setWorkspaceMode(next);
  }, [searchKey]);

  useEffect(() => {
    const sp = new URLSearchParams(searchKey);
    const oid = sp.get("topology_object");
    const kind = sp.get("topology_object_kind");
    if (!oid || !kind) {
      return;
    }
    if (kind === "node") {
      setSelectedNodeId(oid);
      setSelectedLinkId(null);
    } else if (kind === "link") {
      setSelectedLinkId(oid);
      setSelectedNodeId(null);
    }
  }, [searchKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const sp = new URLSearchParams(window.location.search);
    const oid = sp.get("topology_object");
    const kind = sp.get("topology_object_kind");
    const nextOid = selectedNodeId ?? selectedLinkId ?? null;
    const nextKind = selectedNodeId ? "node" : selectedLinkId ? "link" : null;

    let changed = false;
    if (nextOid !== oid || nextKind !== kind) {
      if (nextOid && nextKind) {
        sp.set("topology_object", nextOid);
        sp.set("topology_object_kind", nextKind);
      } else {
        sp.delete("topology_object");
        sp.delete("topology_object_kind");
      }
      changed = true;
    }
    const wsCurrent = sp.get(TOPOLOGY_WORKSPACE_PARAM);
    if (workspaceMode === "dossier" && wsCurrent !== "dossier") {
      sp.set(TOPOLOGY_WORKSPACE_PARAM, "dossier");
      changed = true;
    } else if (workspaceMode === "standard" && (wsCurrent !== null || sp.get(DOSSIER_SOURCE_PARAM))) {
      sp.delete(TOPOLOGY_WORKSPACE_PARAM);
      sp.delete(DOSSIER_SOURCE_PARAM);
      changed = true;
    }
    if (changed) {
      replaceUrlSearchParams(sp);
    }
  }, [selectedNodeId, selectedLinkId, workspaceMode, replaceUrlSearchParams]);
  const topology = data?.topology;
  const nodes = topology?.nodes ?? [];
  const links = topology?.links ?? [];
  const nodeCounts = countBy(nodes, (node) => node.state);
  const linkCounts = countBy(links, (link) => link.state);
  const coverageSummary = useMemo(() => (data ? getTopologyCoverageSummary(data) : null), [data]);
  const nodeParticipationReadout = useMemo(
    () => (data ? getTopologyNodeParticipationReadout(data) : null),
    [data],
  );
  const roleCounts = useMemo(() => countBy(nodes, (node) => node.role), [nodes]);
  const knowledgeCounts = useMemo(() => countBy(links, (link) => getLinkKnowledgeState(link)), [links]);
  const pairingStateCounts = useMemo(
    () => countBy(links, (link) => getTopologyLinkEndpointPairingState(link)),
    [links],
  );
  const sortedRoleCounts = useMemo(
    () => Object.entries(roleCounts).sort((left, right) => right[1] - left[1]),
    [roleCounts],
  );
  const sortedKnowledgeCounts = useMemo(
    () => Object.entries(knowledgeCounts).sort((left, right) => right[1] - left[1]),
    [knowledgeCounts],
  );
  const observedLoopbackCount = useMemo(
    () =>
      nodes.filter(
        (node) =>
          node.attributes.loopback_ipv4 !== undefined &&
          node.attributes.loopback_ipv4 !== "unknown",
      ).length,
    [nodes],
  );
  const freshness = useMemo(
    () => buildFreshnessSummary(topology?.observed_at ?? null, data?.generated_at ?? ""),
    [data?.generated_at, topology?.observed_at],
  );
  const filteredNodes = useMemo(() => {
    const normalizedSearch = nodeSearchValue.trim().toLowerCase();

    return nodes.filter((node) => {
      const matchesState = nodeStateFilter === "all" || node.state === nodeStateFilter;
      const matchesRole = nodeRoleFilter === "all" || node.role === nodeRoleFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          node.display_name,
          node.node_id,
          node.role,
          node.device_id ?? "",
          node.attributes.management_address ?? "",
          node.attributes.loopback_ipv4 ?? "",
          node.attributes.vendor ?? "",
          node.attributes.platform_hint ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesState && matchesRole && matchesSearch;
    });
  }, [nodeRoleFilter, nodeSearchValue, nodeStateFilter, nodes]);
  const sortedNodes = useMemo(() => {
    const stateOrder = { degraded: 0, down: 1, unknown: 2, up: 3 };

    return [...filteredNodes].sort((left, right) => {
      switch (nodeSortBy) {
        case "role_then_name":
          return left.role.localeCompare(right.role) || left.display_name.localeCompare(right.display_name);
        case "name":
          return left.display_name.localeCompare(right.display_name);
        default:
          return (
            (stateOrder[left.state] ?? 99) - (stateOrder[right.state] ?? 99) ||
            left.display_name.localeCompare(right.display_name)
          );
      }
    });
  }, [filteredNodes, nodeSortBy]);
  const selectedNode =
    sortedNodes.find((node) => node.node_id === selectedNodeId) ?? sortedNodes[0] ?? null;
  const selectedNodeStateDisplay = selectedNode
    ? buildRowPostureStatusDisplay(
        selectedNode.current_posture,
        selectedNode.state,
        selectedNode.last_recorded_state,
        "Last recorded state",
      )
    : null;
  const filteredLinks = useMemo(() => {
    const normalizedSearch = linkSearchValue.trim().toLowerCase();

    return links.filter((link) => {
      const matchesState = linkStateFilter === "all" || link.state === linkStateFilter;
      const knowledgeState = getLinkKnowledgeState(link);
      const evidencePosture = getTopologyLinkEndpointPairingState(link);
      const matchesKnowledge =
        linkKnowledgeFilter === "all" || knowledgeState === linkKnowledgeFilter;
      const matchesEvidence =
        linkEvidenceFilter === "all" || evidencePosture === linkEvidenceFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          link.link_id,
          link.source_node_id,
          link.target_node_id,
          knowledgeState,
          evidencePosture,
          link.attributes.inference_method ?? "",
          link.attributes.observed_interfaces ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesState && matchesKnowledge && matchesEvidence && matchesSearch;
    });
  }, [linkEvidenceFilter, linkKnowledgeFilter, linkSearchValue, linkStateFilter, links]);
  const sortedLinks = useMemo(() => {
    const stateOrder = { degraded: 0, down: 1, unknown: 2, up: 3 };

    return [...filteredLinks].sort((left, right) => {
      switch (linkSortBy) {
        case "evidence_then_id":
          return (
            getTopologyLinkEndpointEvidenceCount(right) -
              getTopologyLinkEndpointEvidenceCount(left) ||
            left.link_id.localeCompare(right.link_id)
          );
        case "endpoint_then_id":
          return (
            left.source_node_id.localeCompare(right.source_node_id) ||
            left.target_node_id.localeCompare(right.target_node_id) ||
            left.link_id.localeCompare(right.link_id)
          );
        default:
          return (
            (stateOrder[left.state] ?? 99) - (stateOrder[right.state] ?? 99) ||
            left.link_id.localeCompare(right.link_id)
          );
      }
    });
  }, [filteredLinks, linkSortBy]);
  const selectedLink =
    sortedLinks.find((link) => link.link_id === selectedLinkId) ?? sortedLinks[0] ?? null;
  const dossierObjectId = selectedNodeId ?? selectedLinkId;
  const dossierObjectKind =
    selectedNodeId !== null ? "node" : selectedLinkId !== null ? "link" : null;
  const selectedLinkStateDisplay = selectedLink
    ? buildRowPostureStatusDisplay(
        selectedLink.current_posture,
        selectedLink.state,
        selectedLink.last_recorded_state,
        "Last recorded state",
      )
    : null;

  if (isLoading) {
    return (
      <section>
        <h2>Topology</h2>
        <LoadingState label="Loading normalized topology state." />
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2>Topology</h2>
        <ErrorState error={error} onRetry={reload} />
      </section>
    );
  }

  if (!data) {
    return (
      <section>
        <h2>Topology</h2>
        <EmptyState
          title="No topology data"
          description="The backend did not return a topology response."
        />
      </section>
    );
  }

  if (!topology) {
    return (
      <section>
        <h2>Topology</h2>
        <EmptyState
          title="No topology data"
          description="The backend did not return a topology response."
        />
      </section>
    );
  }

  const comparison = data.comparison_to_latest_persisted;
  const servingMode = getServingModeReadout(data.serving_mode);
  const coverageReadout = describeTopologyCoveragePosture(
    coverageSummary ?? getTopologyCoverageSummary(data),
    topology.links.length,
  );
  const inferenceReadout = describeTopologyInferencePosture(
    coverageSummary ?? getTopologyCoverageSummary(data),
    topology.links.length,
  );
  const collectionReadout = describeTopologyCollectionPosture(
    coverageSummary ?? getTopologyCoverageSummary(data),
  );
  const evidenceConfidence = normalizeEvidenceConfidence(
    data.evidence_confidence,
    buildTopologyEvidenceFallback(data.serving_mode, data.data_status),
  );
  const topologySyncDisplay = buildFallbackAwareStatusDisplay(
    topology.sync_status,
    data.serving_mode,
    "Last recorded sync",
  );
  const topologySyncLabel =
    data.serving_mode === "persisted_fallback" ? "Sync posture" : "Sync status";
  const nodeStateFilterLabel =
    data.serving_mode === "persisted_fallback" ? "Last recorded node state" : "Node state";
  const linkStateFilterLabel =
    data.serving_mode === "persisted_fallback" ? "Last recorded link state" : "Link state";
  const degradedLinksLabel =
    data.serving_mode === "persisted_fallback" ? "Last Recorded Degraded Links" : "Degraded Links";
  const nodesUpLabel =
    data.serving_mode === "persisted_fallback" ? "Last recorded nodes up" : "Nodes up";
  const nodesDegradedLabel =
    data.serving_mode === "persisted_fallback"
      ? "Last recorded nodes degraded"
      : "Nodes degraded";
  const linksUpLabel =
    data.serving_mode === "persisted_fallback" ? "Last recorded links up" : "Links up";
  const linksDegradedLabel =
    data.serving_mode === "persisted_fallback"
      ? "Last recorded links degraded"
      : "Links degraded";
  const policyEvidenceConfidence = policyData
    ? normalizeEvidenceConfidence(
        policyData.evidence_confidence,
        buildPolicyEvidenceFallback(
          policyData.serving_mode,
          policyData.data_status,
          policyData.detail_mode,
          policyData.empty_reason,
        ),
      )
    : null;
  const comparisonReadout = describeComparisonReadout(comparison.status, data.serving_mode);
  const historyComparison = data.history.comparison_to_previous;
  const policyConsistencyReadout = buildCrossSliceConsistencyReadout(
    {
      sliceLabel: "Topology",
      servingMode: data.serving_mode,
      evidenceConfidence,
    },
    {
      sliceLabel: "Policy",
      isLoading: isPolicyLoading,
      hasError: policyError !== null,
      snapshot: policyData && policyEvidenceConfidence
        ? {
            sliceLabel: "Policy",
            servingMode: policyData.serving_mode,
            evidenceConfidence: policyEvidenceConfidence,
          }
        : null,
    },
  );

  const truthNodePostureCounts = truthData
    ? countBy(truthData.merged_topology.nodes, (node) => node.truth_posture)
    : {};
  const truthLinkPostureCounts = truthData
    ? countBy(truthData.merged_topology.links, (link) => link.truth_posture)
    : {};
  const truthControllerObjects = truthData
    ? [
        ...truthData.merged_topology.nodes
          .filter(
            (node) =>
              node.node_id.startsWith("ctrl:") ||
              node.truth_posture === "controller_correlated" ||
              node.provenance.contributing_sources.includes("controller_bgpls"),
          )
          .map((node) => ({
            objectId: node.node_id,
            role: node.role,
            truthPosture: node.truth_posture,
            sourceLabel: "node",
          })),
        ...truthData.merged_topology.links
          .filter((link) => link.provenance.contributing_sources.includes("controller_bgpls"))
          .map((link) => ({
            objectId: link.link_id,
            role: `${link.source_node_id} -> ${link.target_node_id}`,
            truthPosture: link.truth_posture,
            sourceLabel: "link",
          })),
      ].slice(0, 6)
    : [];
  const topologyControllerGapNote =
    controllerEvidence &&
    truthData &&
    controllerEvidence.bgp_ls.session_posture === "established" &&
    truthData.counts.multi_source_confirmed_link_count === 0
      ? "BGP-LS southbound session truth is established, but deeper topology truth still has no multi-source confirmed links. The controller is reachable and session-backed, yet the merged topology path has not produced LLDP-backed physical adjacency confirmation together with controller corroboration."
      : controllerEvidence &&
          truthData &&
          controllerEvidence.bgp_ls.session_posture === "established" &&
          truthData.counts.igp_confirmed_link_count === 0
        ? "BGP-LS southbound session truth is established, but deeper topology truth still has no IGP-confirmed links. The controller is reachable and session-backed, yet the merged topology path has not produced device-native routing adjacency confirmation on any current link."
      : null;

  return (
    <section className="workspace-page">
      <WorkspaceHeader
        eyebrow="Network Truth"
        title="Topology"
        summary="Read the network through the backend-owned normalized topology, trust cues, and bounded controller enrichment rather than raw protocol payloads or observability dashboards."
        statusValue={topology.completeness}
      />

      <InvestigationSurfaceEntry invFrom="topology" />
      <EvidenceQualitySurfaceEntry />

      <div className="metadata-row">
        <span>Data status: {data.data_status}</span>
        <span>Serving mode: {formatLabel(data.serving_mode)}</span>
        <span>Sync source: {topology.sync_source}</span>
        <span>{topologySyncLabel}: {formatLabel(topologySyncDisplay.pillValue)}</span>
        <span>Observed: {formatDateTime(topology.observed_at)}</span>
        <span>Served persisted at: {formatDateTime(data.served_persisted_at)}</span>
        <span>Generated: {formatDateTime(data.generated_at)}</span>
      </div>

      <article className="detail-card" data-product-contract="controller_southbound_session_truth_v2">
        <h3>Controller southbound session truth</h3>
        <p className="meta-copy">
          Bounded BGP-LS, PCEP, and NETCONF lane posture from controller-visible evidence. This is controller context for
          topology reasoning, not dataplane truth, not TE authority, and not a replacement for the normalized topology baseline.
        </p>
        <div className="toolbar">
          <button type="button" className="nav-item" onClick={loadControllerEvidence} disabled={controllerEvidenceLoading}>
            {controllerEvidenceLoading ? "Loading…" : "Load controller evidence"}
          </button>
        </div>
        {controllerEvidenceError ? (
          <div className="query-message query-message-error" role="status">
            {controllerEvidenceError}
          </div>
        ) : null}
        {controllerEvidence ? (
          <>
            <div className="metadata-row">
              <span>Contract: {controllerEvidence.contract_id}</span>
              <span>Reachability: {formatLabel(controllerEvidence.controller_reachability)}</span>
              <span>YANG catalog: {controllerEvidence.yang_module_catalog_count} modules</span>
              <span>Generated: {formatDateTime(controllerEvidence.generated_at)}</span>
            </div>
            <ul className="compact-list">
              <li>
                <span>BGP-LS lane</span>
                <StatusPill value={controllerEvidence.bgp_ls.lane_posture} />
                <span className="table-note">
                  session {formatLabel(controllerEvidence.bgp_ls.session_posture)} · evidence{" "}
                  {formatLabel(controllerEvidence.bgp_ls.evidence_strength)} · {formatLabel(controllerEvidence.bgp_ls.derivation_mode)}
                </span>
                <span className="table-note">
                  exposure {formatLabel(controllerEvidence.bgp_ls.protocol_exposure_posture)} · objects{" "}
                  {formatLabel(controllerEvidence.bgp_ls.object_visibility_posture)} · {controllerEvidence.bgp_ls.node_count} nodes ·{" "}
                  {controllerEvidence.bgp_ls.link_count} links
                </span>
              </li>
              <li>
                <span>PCEP lane</span>
                <StatusPill value={controllerEvidence.pcep.lane_posture} />
                <span className="table-note">
                  session {formatLabel(controllerEvidence.pcep.session_posture)} · evidence{" "}
                  {formatLabel(controllerEvidence.pcep.evidence_strength)} · {formatLabel(controllerEvidence.pcep.derivation_mode)}
                </span>
                <span className="table-note">
                  exposure {formatLabel(controllerEvidence.pcep.protocol_exposure_posture)} · objects{" "}
                  {formatLabel(controllerEvidence.pcep.object_visibility_posture)} · {controllerEvidence.pcep.node_count} nodes ·{" "}
                  {controllerEvidence.pcep.link_count} links
                </span>
              </li>
              <li>
                <span>NETCONF lane</span>
                <StatusPill value={controllerEvidence.netconf.lane_posture} />
                <span className="table-note">
                  session {formatLabel(controllerEvidence.netconf.session_posture)} · evidence{" "}
                  {formatLabel(controllerEvidence.netconf.evidence_strength)} · {formatLabel(controllerEvidence.netconf.derivation_mode)}
                </span>
                <span className="table-note">
                  exposure {formatLabel(controllerEvidence.netconf.protocol_exposure_posture)} · objects{" "}
                  {formatLabel(controllerEvidence.netconf.object_visibility_posture)} · {controllerEvidence.netconf.node_count} nodes ·{" "}
                  {controllerEvidence.netconf.link_count} links
                </span>
              </li>
            </ul>
            <div className="callout">
              <strong>Relationship to topology truth</strong>
              <p>
                Controller southbound session truth and deeper topology truth are separate evidence families. BGP-LS and PCEP can
                be session-backed here while the merged topology view still remains mostly device-backed and inference-bounded.
              </p>
              <p className="table-note">
                PCEP lane evidence is controller-session context only. The deeper topology truth panel below currently consumes the
                bounded controller BGP-LS export path, not PCEP topology objects.
              </p>
            </div>
            {topologyControllerGapNote ? (
              <div className="callout">
                <strong>Current live mismatch explained</strong>
                <p>{topologyControllerGapNote}</p>
              </div>
            ) : null}
            {controllerEvidence.aggregate_fetch_notes.length > 0 ? (
              <div className="callout">
                <strong>Aggregate fetch notes</strong>
                <ul className="notes-list">
                  {controllerEvidence.aggregate_fetch_notes.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : null}
      </article>

      <article className="detail-card" data-product-contract="topology_truth_v1">
        <h3>Deeper topology truth</h3>
        <p className="meta-copy">
          Backend-owned merge of gNMI-normalized topology with optional controller enrichment—not dataplane path
          truth, not sole ODL authority.
        </p>
        <div className="toolbar">
          <button type="button" className="nav-item" onClick={loadTopologyTruth} disabled={truthLoading}>
            {truthLoading ? "Loading…" : "Load merged truth"}
          </button>
        </div>
        {truthError ? (
          <div className="query-message query-message-error" role="status">
            {truthError}
          </div>
        ) : null}
        {truthData ? (
          <>
            <div className="metadata-row">
              <span>Contract: {truthData.contract_id}</span>
              <span>Controller fetch: {formatLabel(truthData.controller_fetch_status)}</span>
              <span>Merged freshness: {formatLabel(truthData.freshness.merged_view)}</span>
              <span>Controller freshness: {formatLabel(truthData.freshness.controller_bgpls)}</span>
              <span>Merged nodes: {truthData.counts.merged_node_count}</span>
              <span>Merged links: {truthData.counts.merged_link_count}</span>
              <span>Conflicts: {truthData.counts.conflicting_object_count}</span>
            </div>
            <div className="summary-grid">
              <article className="summary-card">
                <p className="summary-label">Physical Confirmed Links</p>
                <strong>{truthData.counts.physical_confirmed_link_count}</strong>
                <p>Links with bidirectional LLDP-backed physical adjacency confirmation.</p>
              </article>
              <article className="summary-card">
                <p className="summary-label">IGP-confirmed Links</p>
                <strong>{truthData.counts.igp_confirmed_link_count}</strong>
                <p>Links with strong device-native OSPF or IS-IS adjacency confirmation.</p>
              </article>
              <article className="summary-card">
                <p className="summary-label">Inferred-only Links</p>
                <strong>{truthData.counts.inferred_only_link_count}</strong>
                <p>Links still backed only by bounded inferred topology evidence.</p>
              </article>
              <article className="summary-card">
                <p className="summary-label">Device-only Nodes</p>
                <strong>{truthData.counts.device_only_node_count}</strong>
                <p>Nodes currently present only in the normalized gNMI baseline.</p>
              </article>
              <article className="summary-card">
                <p className="summary-label">Controller-only Nodes</p>
                <strong>{truthData.counts.controller_only_node_count}</strong>
                <p>Nodes present only in bounded controller export.</p>
              </article>
              <article className="summary-card">
                <p className="summary-label">Controller-correlated Nodes</p>
                <strong>{truthNodePostureCounts.controller_correlated ?? 0}</strong>
                <p>Scope markers or controller-side objects retained without device-side merge.</p>
              </article>
              <article className="summary-card">
                <p className="summary-label">Multi-source Confirmed Links</p>
                <strong>{truthData.counts.multi_source_confirmed_link_count}</strong>
                <p>Links where LLDP and/or strong IGP evidence corroborate the controller view of the same edge.</p>
              </article>
              <article className="summary-card">
                <p className="summary-label">OSPF-observed Links</p>
                <strong>{truthData.counts.ospf_observed_link_count}</strong>
                <p>Links with weaker OSPF evidence that did not reach full IGP confirmation.</p>
              </article>
              <article className="summary-card">
                <p className="summary-label">IS-IS-observed Links</p>
                <strong>{truthData.counts.isis_observed_link_count}</strong>
                <p>Links with weaker IS-IS evidence that did not reach full IGP confirmation.</p>
              </article>
              <article className="summary-card">
                <p className="summary-label">One-sided LLDP Links</p>
                <strong>{truthData.counts.lldp_single_sided_link_count}</strong>
                <p>Links with stronger-than-inference physical evidence that is still one-sided.</p>
              </article>
              <article className="summary-card">
                <p className="summary-label">LLDP Mismatch Links</p>
                <strong>{truthData.counts.lldp_mismatch_link_count}</strong>
                <p>Links where LLDP contradicts the current inferred or controller-correlated peer mapping.</p>
              </article>
              <article className="summary-card">
                <p className="summary-label">IGP Mismatch Links</p>
                <strong>{truthData.counts.igp_protocol_mismatch_link_count}</strong>
                <p>Links where device-native IGP points at a different neighbor than the current normalized correlation.</p>
              </article>
            </div>
            <div className="callout">
              <strong>Sources</strong>
              <ul className="notes-list">
                {truthData.sources.map((source) => (
                  <li key={`${source.source_type}-${source.source_id}`}>
                    <strong>{formatLabel(source.source_type)}</strong>: {source.source_summary} Freshness{" "}
                    {formatLabel(source.source_freshness)} · authority {formatLabel(source.source_authority_posture)}.
                  </li>
                ))}
              </ul>
            </div>
            {truthData.controller_notes.length > 0 ? (
              <div className="callout">
                <strong>Controller merge notes</strong>
                <ul className="notes-list">
                  {truthData.controller_notes.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {truthControllerObjects.length > 0 ? (
              <div className="callout">
                <strong>Controller-derived objects in merged view</strong>
                <ul className="notes-list">
                  {truthControllerObjects.map((item) => (
                    <li key={`${item.sourceLabel}-${item.objectId}`}>
                      <strong>{formatLabel(item.sourceLabel)}</strong> <code>{item.objectId}</code> · {item.role} · posture{" "}
                      {formatLabel(item.truthPosture)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {truthData.safety_framing.explicit_non_claims.length > 0 ? (
              <ul className="notes-list">
                {truthData.safety_framing.explicit_non_claims.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
          </>
        ) : null}
      </article>

      <div className="summary-grid">
        <article className="summary-card">
          <p className="summary-label">Nodes</p>
          <strong>{topology.nodes.length}</strong>
          <p>{topology.topology_name}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Links</p>
          <strong>{topology.links.length}</strong>
          <p>{data.summary}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Freshness</p>
          <strong>{freshness.label}</strong>
          <p>{freshness.detail}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Serving Mode</p>
          <strong>{servingMode.label}</strong>
          <p>{servingMode.detail}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Evidence Confidence</p>
          <strong>{formatLabel(evidenceConfidence.confidence_posture)}</strong>
          <p>{describeConfidencePosture(evidenceConfidence.confidence_posture)}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Comparison Status</p>
          <strong>{comparisonReadout.label}</strong>
          <p>{comparisonReadout.detail}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Persisted History</p>
          <strong>{formatLabel(data.history.status)}</strong>
          <p>{data.history.summary}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Policy Slice Posture</p>
          <strong>{policyConsistencyReadout.label}</strong>
          <p>{policyConsistencyReadout.detail}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">{degradedLinksLabel}</p>
          <strong>{linkCounts.degraded ?? 0}</strong>
          <p>Links whose evidence or state is degraded remain explicit.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Single-Sided Evidence</p>
          <strong>{coverageSummary?.single_sided_link_count ?? 0}</strong>
          <p>Links inferred from only one observed endpoint stay explicitly partial.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Node Participation</p>
          <strong>{nodeParticipationReadout?.label ?? "Not exposed"}</strong>
          <p>
            {nodeParticipationReadout?.countDetail ??
              "Linked-versus-isolated node counts are not exposed."}
          </p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Observed Loopbacks</p>
          <strong>{observedLoopbackCount}</strong>
          <p>Nodes with a live loopback carried into the normalized topology view.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Inference Posture</p>
          <strong>{inferenceReadout.label}</strong>
          <p>{inferenceReadout.detail}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Collection Posture</p>
          <strong>{collectionReadout.label}</strong>
          <p>{collectionReadout.detail}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Observed to Generated</p>
          <strong>{describeTimeGap(topology.observed_at, data.generated_at)}</strong>
          <p>How far the current observed timestamp lags behind API generation.</p>
        </article>
      </div>

      <div className="content-grid">
        <article className="detail-card">
          <h3>Trust Readout</h3>
          <p>{evidenceConfidence.summary}</p>
          <ul className="compact-list">
            <li>
              <span>Backend topology status</span>
              <StatusPill value={data.data_status} />
            </li>
            <li>
              <span>Topology sync status</span>
              <div>
                <StatusPill value={topologySyncDisplay.pillValue} />
                {topologySyncDisplay.note ? (
                  <div className="table-note">{topologySyncDisplay.note}</div>
                ) : null}
              </div>
            </li>
            <li>
              <span>Explicit completeness</span>
              <StatusPill value={topology.completeness} />
            </li>
            <li>
              <span>Freshness posture</span>
              <strong>{freshness.label}</strong>
            </li>
            <li>
              <span>Evidence confidence</span>
              <StatusPill value={evidenceConfidence.confidence_posture} />
            </li>
            <li>
              <span>Serving mode</span>
              <strong>{servingMode.label}</strong>
            </li>
            <li>
              <span>Source posture</span>
              <StatusPill value={evidenceConfidence.source_posture} />
            </li>
            <li>
              <span>Observed to generated gap</span>
              <strong>{describeTimeGap(topology.observed_at, data.generated_at)}</strong>
            </li>
            <li>
              <span>Comparison posture</span>
              <strong>{comparisonReadout.label}</strong>
            </li>
            <li>
              <span>Inference posture</span>
              <StatusPill value={inferenceReadout.status} />
            </li>
            <li>
              <span>Endpoint pairing posture</span>
              <StatusPill value={coverageReadout.status} />
            </li>
            <li>
              <span>Collection posture</span>
              <StatusPill value={collectionReadout.status} />
            </li>
            <li>
              <span>Node participation</span>
              <StatusPill value={nodeParticipationReadout?.status ?? "unknown"} />
            </li>
            <li>
              <span>Pairing counts</span>
              <strong>{coverageReadout.countDetail}</strong>
            </li>
            <li>
              <span>Participation counts</span>
              <strong>{nodeParticipationReadout?.countDetail ?? "Not exposed"}</strong>
            </li>
            <li>
              <span>Blocked reason</span>
              <strong>{formatLabel(evidenceConfidence.blocked_reason)}</strong>
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <h3>Evidence Basis</h3>
          <p>
            The current topology response is a backend-owned normalized view. Nodes come
            from collector-backed device evidence, while links may still be inferred from
            bounded interface observations.
          </p>
          <ul className="compact-list">
            <li>
              <span>Primary evidence basis</span>
              <strong>
                {formatLabel(evidenceConfidence.source_posture)}
              </strong>
            </li>
            <li>
              <span>Evidence kind</span>
              <strong>{formatLabel(evidenceConfidence.evidence_kind)}</strong>
            </li>
            <li>
              <span>Confidence posture</span>
              <strong>{formatLabel(evidenceConfidence.confidence_posture)}</strong>
            </li>
            <li>
              <span>Inference posture</span>
              <StatusPill value={inferenceReadout.status} />
            </li>
            <li>
              <span>Endpoint pairing</span>
              <StatusPill value={coverageReadout.status} />
            </li>
            <li>
              <span>Collection posture</span>
              <StatusPill value={collectionReadout.status} />
            </li>
            <li>
              <span>Node participation</span>
              <StatusPill value={nodeParticipationReadout?.status ?? "unknown"} />
            </li>
            <li>
              <span>Inference method</span>
              <strong>
                {links[0]?.attributes.inference_method
                  ? formatLabel(links[0].attributes.inference_method)
                  : "No link inference recorded"}
              </strong>
            </li>
            <li>
              <span>Partial knowledge links</span>
              <strong>{knowledgeCounts.partial ?? 0}</strong>
            </li>
            <li>
              <span>Pairing counts</span>
              <strong>{coverageReadout.countDetail}</strong>
            </li>
            <li>
              <span>Participation counts</span>
              <strong>{nodeParticipationReadout?.countDetail ?? "Not exposed"}</strong>
            </li>
            <li>
              <span>Comparison-ready snapshot</span>
              <strong>{formatDateTime(comparison.comparison_persisted_at)}</strong>
            </li>
          </ul>
          <p className="table-note">
            {describeEvidenceSource(evidenceConfidence.source_posture)}{" "}
            {describeEvidenceKind(evidenceConfidence.evidence_kind)}{" "}
            {describeBlockedReason(evidenceConfidence.blocked_reason)}
          </p>
        </article>
        <article className="detail-card">
          <h3>Current vs Latest Persisted</h3>
          <p>{comparison.summary}</p>
          <ul className="compact-list">
            <li>
              <span>Comparison status</span>
              <strong>{formatLabel(comparison.status)}</strong>
            </li>
            <li>
              <span>Compared persisted snapshot</span>
              <strong>{formatDateTime(comparison.comparison_persisted_at)}</strong>
            </li>
            <li>
              <span>Persisted snapshot anchor</span>
              <IdentifierChip
                value={comparison.comparison_snapshot_id}
                emptyLabel="Not exposed in this posture"
              />
            </li>
            <li>
              <span>Observed to compared snapshot gap</span>
              <strong>
                {describeTimeGap(comparison.comparison_persisted_at, comparison.current_observed_at)}
              </strong>
            </li>
            <li>
              <span>Node delta</span>
              <strong>{formatSignedDelta(comparison.node_count_delta)}</strong>
            </li>
            <li>
              <span>Link delta</span>
              <strong>{formatSignedDelta(comparison.link_count_delta)}</strong>
            </li>
            <li>
              <span>Added / removed nodes</span>
              <strong>
                {comparison.added_node_count} / {comparison.removed_node_count}
              </strong>
            </li>
            <li>
              <span>Added / removed links</span>
              <strong>
                {comparison.added_link_count} / {comparison.removed_link_count}
              </strong>
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <h3>Persisted History And Comparison</h3>
          <p>{data.history.summary}</p>
          <p className="table-note">
            Persisted coverage posture rows compare snapshot-derived trust cues only. They do not
            assert adjacency validation, path validation, controller truth, or workflow eligibility.
          </p>
          {historyComparison ? (
            <ul className="compact-list">
              <li>
                <span>Current snapshot anchor</span>
                <IdentifierChip value={historyComparison.current_snapshot_id} />
              </li>
              <li>
                <span>Previous snapshot anchor</span>
                <IdentifierChip value={historyComparison.previous_snapshot_id} />
              </li>
              <li>
                <span>Current / previous persisted</span>
                <strong>
                  {formatDateTime(historyComparison.current_persisted_at)} /{" "}
                  {formatDateTime(historyComparison.previous_persisted_at)}
                </strong>
              </li>
              <li>
                <span>Node delta</span>
                <strong>{formatSignedDelta(historyComparison.node_count_delta)}</strong>
              </li>
              <li>
                <span>Link delta</span>
                <strong>{formatSignedDelta(historyComparison.link_count_delta)}</strong>
              </li>
              <li>
                <span>Added / removed nodes</span>
                <strong>
                  {historyComparison.added_node_count} / {historyComparison.removed_node_count}
                </strong>
              </li>
              <li>
                <span>Added / removed links</span>
                <strong>
                  {historyComparison.added_link_count} / {historyComparison.removed_link_count}
                </strong>
              </li>
              <li>
                <span>Changed nodes / links</span>
                <strong>
                  {historyComparison.changed_node_count} / {historyComparison.changed_link_count}
                </strong>
              </li>
              {historyComparison.current_inference_posture != null ||
              historyComparison.previous_inference_posture != null ? (
                <>
                  <li>
                    <span>Current inference posture</span>
                    <StatusPill
                      value={historyComparison.current_inference_posture ?? "unknown"}
                    />
                  </li>
                  <li>
                    <span>Previous inference posture</span>
                    <StatusPill
                      value={historyComparison.previous_inference_posture ?? "unknown"}
                    />
                  </li>
                </>
              ) : null}
              {historyComparison.current_endpoint_pairing_posture != null ||
              historyComparison.previous_endpoint_pairing_posture != null ? (
                <>
                  <li>
                    <span>Current endpoint pairing</span>
                    <StatusPill
                      value={
                        historyComparison.current_endpoint_pairing_posture ?? "unknown"
                      }
                    />
                  </li>
                  <li>
                    <span>Previous endpoint pairing</span>
                    <StatusPill
                      value={
                        historyComparison.previous_endpoint_pairing_posture ?? "unknown"
                      }
                    />
                  </li>
                </>
              ) : null}
              {historyComparison.current_collection_posture != null ||
              historyComparison.previous_collection_posture != null ? (
                <>
                  <li>
                    <span>Current collection posture</span>
                    <StatusPill
                      value={historyComparison.current_collection_posture ?? "unknown"}
                    />
                  </li>
                  <li>
                    <span>Previous collection posture</span>
                    <StatusPill
                      value={historyComparison.previous_collection_posture ?? "unknown"}
                    />
                  </li>
                </>
              ) : null}
              {historyComparison.current_node_participation_posture != null ||
              historyComparison.previous_node_participation_posture != null ? (
                <>
                  <li>
                    <span>Current node participation</span>
                    <StatusPill
                      value={
                        historyComparison.current_node_participation_posture ?? "unknown"
                      }
                    />
                  </li>
                  <li>
                    <span>Previous node participation</span>
                    <StatusPill
                      value={
                        historyComparison.previous_node_participation_posture ?? "unknown"
                      }
                    />
                  </li>
                </>
              ) : null}
              {historyComparison.current_paired_link_count != null ||
              historyComparison.previous_paired_link_count != null ? (
                <li>
                  <span>Current / previous paired links</span>
                  <strong>
                    {historyComparison.current_paired_link_count ?? "—"} /{" "}
                    {historyComparison.previous_paired_link_count ?? "—"}
                  </strong>
                </li>
              ) : null}
              {historyComparison.current_single_sided_link_count != null ||
              historyComparison.previous_single_sided_link_count != null ? (
                <li>
                  <span>Current / previous single-sided links</span>
                  <strong>
                    {historyComparison.current_single_sided_link_count ?? "—"} /{" "}
                    {historyComparison.previous_single_sided_link_count ?? "—"}
                  </strong>
                </li>
              ) : null}
              {historyComparison.current_linked_node_count != null ||
              historyComparison.previous_linked_node_count != null ? (
                <li>
                  <span>Current / previous linked nodes</span>
                  <strong>
                    {historyComparison.current_linked_node_count ?? "—"} /{" "}
                    {historyComparison.previous_linked_node_count ?? "—"}
                  </strong>
                </li>
              ) : null}
              {historyComparison.current_isolated_node_count != null ||
              historyComparison.previous_isolated_node_count != null ? (
                <li>
                  <span>Current / previous isolated nodes</span>
                  <strong>
                    {historyComparison.current_isolated_node_count ?? "—"} /{" "}
                    {historyComparison.previous_isolated_node_count ?? "—"}
                  </strong>
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="footnote">
              Bounded comparison is only available once at least two persisted normalized topology
              snapshots exist.
            </p>
          )}
        </article>
        <article className="detail-card">
          <h3>Recent Persisted Snapshots</h3>
          <p className="table-note">
            Persisted coverage posture reflects derived inference, endpoint-pairing, collection,
            and node-participation cues per snapshot. These are trust cues, not validation
            verdicts.
          </p>
          {data.history.recent_snapshots.length > 0 ? (
            <ul className="notes-list">
              {data.history.recent_snapshots.map((entry) => (
                <li key={entry.snapshot_id}>
                  <strong>{formatDateTime(entry.persisted_at)}</strong>
                  {" • anchor "}
                  <IdentifierChip value={entry.snapshot_id} />
                  {" • nodes "}
                  {entry.node_count}
                  {" • links "}
                  {entry.link_count}
                  {" • "}
                  {formatLabel(entry.completeness)}
                  {entry.inference_posture != null ? (
                    <>
                      {" • inference "}
                      <StatusPill value={entry.inference_posture} />
                    </>
                  ) : null}
                  {entry.endpoint_pairing_posture != null ? (
                    <>
                      {" • pairing "}
                      <StatusPill value={entry.endpoint_pairing_posture} />
                    </>
                  ) : null}
                  {entry.collection_posture != null ? (
                    <>
                      {" • collection "}
                      <StatusPill value={entry.collection_posture} />
                    </>
                  ) : null}
                  {entry.node_participation_posture != null ? (
                    <>
                      {" • participation "}
                      <StatusPill value={entry.node_participation_posture} />
                    </>
                  ) : null}
                  {entry.paired_link_count != null || entry.single_sided_link_count != null ? (
                    <>
                      {" • "}
                      {entry.paired_link_count ?? 0} paired / {entry.single_sided_link_count ?? 0}{" "}
                      single-sided
                    </>
                  ) : null}
                  {entry.linked_node_count != null || entry.isolated_node_count != null ? (
                    <>
                      {" • "}
                      {entry.linked_node_count ?? 0} linked / {entry.isolated_node_count ?? 0}{" "}
                      isolated
                    </>
                  ) : null}
                  {entry.observed_at ? ` • observed at ${formatDateTime(entry.observed_at)}` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="footnote">
              No persisted normalized topology snapshots are currently available for this bounded
              view.
            </p>
          )}
        </article>
        <article className="detail-card">
          <h3>Policy Slice Consistency</h3>
          <p>{policyConsistencyReadout.detail}</p>
          {policyData && policyEvidenceConfidence ? (
            <ul className="compact-list">
              <li>
                <span>Policy data status</span>
                <StatusPill value={policyData.data_status} />
              </li>
              <li>
                <span>Policy serving mode</span>
                <strong>{formatLabel(policyData.serving_mode)}</strong>
              </li>
              <li>
                <span>Policy evidence confidence</span>
                <StatusPill value={policyEvidenceConfidence.confidence_posture} />
              </li>
              <li>
                <span>Policy evidence kind</span>
                <strong>{formatLabel(policyEvidenceConfidence.evidence_kind)}</strong>
              </li>
              <li>
                <span>Policy detail mode</span>
                <strong>{formatLabel(policyData.detail_mode)}</strong>
              </li>
              <li>
                <span>Policy empty reason</span>
                <strong>{formatLabel(policyData.empty_reason)}</strong>
              </li>
            </ul>
          ) : (
            <p className="table-note">
              The topology page remains usable even when the companion policy slice is still
              loading or temporarily unavailable.
            </p>
          )}
          <p className="table-note">
            This compares slice posture only. It does not claim that topology and policy
            data are semantically inconsistent with each other.
          </p>
        </article>
        <article className="detail-card">
          <h3>Node Role Distribution</h3>
          {sortedRoleCounts.length === 0 ? (
            <p>No node roles are available in the current topology snapshot.</p>
          ) : (
            <ul className="compact-list">
              {sortedRoleCounts.map(([role, count]) => (
                <li key={role}>
                  <span>{role}</span>
                  <strong>{count}</strong>
                </li>
              ))}
            </ul>
          )}
        </article>
        <article className="detail-card">
          <h3>State and Change Distribution</h3>
          <ul className="compact-list">
            <li>
              <span>{nodesUpLabel}</span>
              <strong>{nodeCounts.up ?? 0}</strong>
            </li>
            <li>
              <span>{nodesDegradedLabel}</span>
              <strong>{nodeCounts.degraded ?? 0}</strong>
            </li>
            <li>
              <span>{linksUpLabel}</span>
              <strong>{linkCounts.up ?? 0}</strong>
            </li>
            <li>
              <span>{linksDegradedLabel}</span>
              <strong>{linkCounts.degraded ?? 0}</strong>
            </li>
            <li>
              <span>Changed nodes vs persisted</span>
              <strong>{comparison.changed_node_count}</strong>
            </li>
            <li>
              <span>Changed links vs persisted</span>
              <strong>{comparison.changed_link_count}</strong>
            </li>
            <li>
              <span>Persisted node / link count</span>
              <strong>
                {comparison.persisted_node_count} / {comparison.persisted_link_count}
              </strong>
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <h3>Node Participation Distribution</h3>
          <p>
            {nodeParticipationReadout?.detail ??
              "Node-participation posture is not exposed on the current topology response."}
          </p>
          <ul className="compact-list">
            <li>
              <span>Participation posture</span>
              <StatusPill value={nodeParticipationReadout?.status ?? "unknown"} />
            </li>
            <li>
              <span>Linked nodes</span>
              <strong>{coverageSummary?.linked_node_count ?? 0}</strong>
            </li>
            <li>
              <span>Isolated nodes</span>
              <strong>{coverageSummary?.isolated_node_count ?? 0}</strong>
            </li>
            <li>
              <span>Total nodes</span>
              <strong>{topology.nodes.length}</strong>
            </li>
            <li>
              <span>Observed loopbacks</span>
              <strong>{observedLoopbackCount}</strong>
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <h3>Link Evidence Distribution</h3>
          <ul className="compact-list">
            <li>
              <span>Paired links</span>
              <strong>{pairingStateCounts.paired ?? 0}</strong>
            </li>
            <li>
              <span>Single-sided links</span>
              <strong>{pairingStateCounts.single_sided ?? 0}</strong>
            </li>
            <li>
              <span>Pairing: unknown</span>
              <strong>{pairingStateCounts.unknown ?? 0}</strong>
            </li>
            <li>
              <span>Knowledge: partial</span>
              <strong>{knowledgeCounts.partial ?? 0}</strong>
            </li>
            <li>
              <span>Total link evidence endpoints</span>
              <strong>
                {links.reduce((total, link) => total + getTopologyLinkEndpointEvidenceCount(link), 0)}
              </strong>
            </li>
          </ul>
        </article>
      </div>

      {historyComparison && historyComparison.notes.length > 0 ? (
        <div className="callout">
          <strong>Persisted history limits</strong>
          <ul className="notes-list">
            {historyComparison.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="callout">
        <strong>How to read this page</strong>
        <p>
          Live collector data remains the primary current truth source. Persisted fallback
          snapshots keep the page usable when live collection is unavailable. Inference
          posture, endpoint pairing, node participation, and collection posture are four orthogonal
          partiality axes—trust cues only, not adjacency validation—and are shown separately so operators
          can see why topology remains partial. Comparison summaries show bounded normalized
          differences only and should not be read as path-validation, controller truth, or
          drift verdicts.
        </p>
        <p className="table-note">
          When the backend can identify the compared persisted topology record explicitly, this
          page now shows that snapshot anchor alongside the comparison timestamp. Persisted
          history and comparison also expose derived coverage posture (endpoint pairing,
          paired/single-sided counts, linked/isolated nodes) per snapshot. These are persisted
          coverage cues only, not validation verdicts.
        </p>
      </div>

      {policyConsistencyReadout.label !== "Aligned live posture" ? (
        <div className="callout">
          <strong>Policy slice posture is being shown alongside topology</strong>
          <p>
            {policyConsistencyReadout.detail} This stays explanatory and does not imply a
            topology-policy mismatch verdict.
          </p>
        </div>
      ) : null}

      {evidenceConfidence.freshness_posture === "stale" ? (
        <div className="callout">
          <strong>Stale topology posture remains explicit</strong>
          <p>
            The topology page is currently relying on persisted normalized evidence from{" "}
            {formatDateTime(data.served_persisted_at)} rather than a current live collector read.
            This keeps the page usable without pretending current topology truth is fully known.
          </p>
        </div>
      ) : null}

      {evidenceConfidence.confidence_posture === "blocked" ? (
        <div className="callout">
          <strong>Blocked topology reasoning remains explicit</strong>
          <p>
            The backend does not currently have enough live or persisted topology evidence to
            support a stronger truth claim for this page. The UI keeps that blocked posture
            visible instead of inventing graph certainty.
          </p>
        </div>
      ) : null}

      {collectionReadout.status === "degraded" ? (
        <div className="callout">
          <strong>Collection degradation remains explicit</strong>
          <p>
            The current topology slice came through a degraded collection window. The page stays
            usable, but it keeps that bounded collection limit visible instead of collapsing it
            into one generic partiality sentence.
          </p>
        </div>
      ) : null}

      {collectionReadout.status === "blocked" ? (
        <div className="callout">
          <strong>Collection blockage remains explicit</strong>
          <p>
            The current topology slice is not backed by a normal live collection window. This is
            distinct from endpoint pairing limits and remains visible as its own trust cue.
          </p>
        </div>
      ) : null}

      {nodeParticipationReadout?.status === "partially_isolated" ? (
        <div className="callout">
          <strong>Isolated observed nodes remain explicit</strong>
          <p>
            The current topology slice includes observed nodes that do not currently participate in a normalized link. This stays separate from endpoint-pairing posture so operators can distinguish isolated nodes from single-sided link evidence.
          </p>
        </div>
      ) : null}

      {nodeParticipationReadout?.status === "isolated_only" ? (
        <div className="callout">
          <strong>Only isolated observed nodes are currently linked into the slice</strong>
          <p>
            The current topology response includes nodes, but none currently participate in a normalized link. The page keeps that limitation explicit instead of implying adjacency certainty.
          </p>
        </div>
      ) : null}

      {topology.notes.length > 0 ? (
        <div className="callout">
          <strong>Current limits</strong>
          <ul className="notes-list">
            {topology.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {evidenceConfidence.notes.length > 0 ? (
        <div className="callout">
          <strong>Evidence-confidence limits</strong>
          <ul className="notes-list">
            {evidenceConfidence.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {comparison.notes.length > 0 ? (
        <div className="callout">
          <strong>Comparison limits</strong>
          <ul className="notes-list">
            {comparison.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <TopologyRiskAttentionPanel
        variant="topology"
        data={riskSummaryQuery.data}
        error={riskSummaryQuery.error}
        isLoading={riskSummaryQuery.isLoading}
        isRefreshing={riskSummaryQuery.isRefreshing}
        onRetry={riskSummaryQuery.reload}
        drillToObject={(objectId, kind) => {
          if (kind === "node") {
            setSelectedNodeId(objectId);
            setSelectedLinkId(null);
          } else {
            setSelectedLinkId(objectId);
            setSelectedNodeId(null);
          }
        }}
      />

      <div className="page-header topology-workspace-switch">
        <div>
          <p className="eyebrow">Topology object workspace</p>
          <h3 className="topology-workspace-switch__title">Standard detail panels vs dossier briefing</h3>
          <p className="meta-copy">
            Week 28 panels stay available in <strong>Standard</strong> view. <strong>Dossier workspace</strong> loads one
            composed <code>topology_object_dossier_v1</code> response—interpretation support only; not a replacement
            for path-analysis or policy detail.
          </p>
        </div>
        <div className="topology-workspace-switch__toggle" role="group" aria-label="Topology object workspace mode">
          <button
            type="button"
            className={workspaceMode === "standard" ? "nav-item active" : "nav-item"}
            onClick={() => setWorkspaceMode("standard")}
          >
            Standard panels
          </button>
          <button
            type="button"
            className={workspaceMode === "dossier" ? "nav-item active" : "nav-item"}
            onClick={() => setWorkspaceMode("dossier")}
          >
            Dossier workspace
          </button>
        </div>
      </div>

      {workspaceMode === "dossier" ? (
        <TopologyObjectDossierWorkspace objectId={dossierObjectId} objectKind={dossierObjectKind} />
      ) : null}

      <div className="toolbar">
        <label className="field-group">
          <span>Search nodes</span>
          <input
            value={nodeSearchValue}
            onChange={(event) => setNodeSearchValue(event.target.value)}
            placeholder="name, node id, role, or linked device"
          />
        </label>
        <label className="field-group">
          <span>{nodeStateFilterLabel}</span>
          <select
            value={nodeStateFilter}
            onChange={(event) => setNodeStateFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="up">Up</option>
            <option value="down">Down</option>
            <option value="degraded">Degraded</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
        <label className="field-group">
          <span>Node role</span>
          <select
            value={nodeRoleFilter}
            onChange={(event) => setNodeRoleFilter(event.target.value)}
          >
            <option value="all">All</option>
            {sortedRoleCounts.map(([role]) => (
              <option key={role} value={role}>
                {formatLabel(role)}
              </option>
            ))}
          </select>
        </label>
        <label className="field-group">
          <span>Sort nodes</span>
          <select value={nodeSortBy} onChange={(event) => setNodeSortBy(event.target.value)}>
            <option value="state_then_name">State then name</option>
            <option value="role_then_name">Role then name</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      {topology.nodes.length === 0 ? (
        <EmptyState
          title="No topology nodes"
          description="The topology contract is present, but no node records are available."
        />
      ) : filteredNodes.length === 0 ? (
        <EmptyState
          title="No nodes match the current filter"
          description="Adjust the search text or state filter to widen the topology view."
        />
      ) : (
        <>
          <div className="table-card">
            <h3>Nodes</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>State</th>
                  <th>Loopback</th>
                  <th>Management</th>
                  <th>Source</th>
                  <th>Device ID</th>
                  <th>Dossier</th>
                </tr>
              </thead>
              <tbody>
                {sortedNodes.map((node) => {
                  const isSelected = selectedNode?.node_id === node.node_id;
                  const nodeStateDisplay = buildRowPostureStatusDisplay(
                    node.current_posture,
                    node.state,
                    node.last_recorded_state,
                    "Last recorded state",
                  );
                  return (
                    <tr key={node.node_id} className={isSelected ? "data-row-selected" : undefined}>
                      <td>
                        <button
                          type="button"
                          className="table-select"
                          onClick={() => setSelectedNodeId(node.node_id)}
                        >
                          <strong>{node.display_name}</strong>
                        </button>
                        <div className="table-note">{node.node_id}</div>
                      </td>
                      <td>{formatLabel(node.role)}</td>
                      <td>
                        <StatusPill value={nodeStateDisplay.pillValue} />
                        {nodeStateDisplay.note ? (
                          <div className="table-note">{nodeStateDisplay.note}</div>
                        ) : null}
                      </td>
                      <td>{node.attributes.loopback_ipv4 ?? "Unknown"}</td>
                      <td>{node.attributes.management_address ?? "Unknown"}</td>
                      <td>{node.source}</td>
                      <td>{node.device_id ?? "Not linked"}</td>
                      <td>
                        <button
                          type="button"
                          className="nav-drilldown-button"
                          onClick={() => navigateToTopologyDossier(node.node_id, "node", "topology_table")}
                        >
                          Open dossier
                        </button>
                        <div className="table-note">Composed briefing for this node.</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {selectedNode && workspaceMode === "standard" ? (
            <div className="content-grid">
              <article className="detail-card">
                <h3>Selected Node Detail</h3>
                <div className="metadata-row">
                  <span>Node: {selectedNode.display_name}</span>
                  <span>Role: {formatLabel(selectedNode.role)}</span>
                  <span>Current posture: {formatRowCurrentPosture(selectedNode.current_posture)}</span>
                  <span>Source: {selectedNode.source}</span>
                </div>
                <div className="key-value-list">
                  <div className="key-value-row">
                    <span>Node ID</span>
                    <strong>{selectedNode.node_id}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Linked device</span>
                    <strong>{selectedNode.device_id ?? "Not linked"}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Management</span>
                    <strong>{selectedNode.attributes.management_address ?? "Unknown"}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Loopback</span>
                    <strong>{selectedNode.attributes.loopback_ipv4 ?? "Unknown"}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Vendor hint</span>
                    <strong>{selectedNode.attributes.vendor ?? "Unknown"}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Platform hint</span>
                    <strong>{selectedNode.attributes.platform_hint ?? "Unknown"}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Node state</span>
                    <div>
                      <StatusPill value={selectedNodeStateDisplay?.pillValue ?? "unknown"} />
                      {selectedNodeStateDisplay?.note ? (
                        <div className="table-note">{selectedNodeStateDisplay.note}</div>
                      ) : null}
                    </div>
                  </div>
                  <div className="key-value-row">
                    <span>Evidence posture</span>
                    <strong>{describeNodeEvidence(selectedNode)}</strong>
                  </div>
                </div>
                <p className="summary-label">Node Evidence</p>
                <div className="key-value-list">
                  {Object.entries(selectedNode.attributes)
                    .sort(([left], [right]) => left.localeCompare(right))
                    .map(([key, value]) => (
                      <div key={`${selectedNode.node_id}-${key}`} className="key-value-row">
                        <span>{formatLabel(key)}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                </div>
              </article>
              <TopologyRelatedPoliciesPanel
                objectId={selectedNode.node_id}
                objectKind="node"
                policiesList={policyData}
              />
              <TopologyFailureImpactPanel objectId={selectedNode.node_id} objectKind="node" />
              <TopologyObjectEvidenceTimelinePanel objectId={selectedNode.node_id} objectKind="node" />
            </div>
          ) : null}
        </>
      )}

      <div className="toolbar">
        <label className="field-group">
          <span>Search links</span>
          <input
            value={linkSearchValue}
            onChange={(event) => setLinkSearchValue(event.target.value)}
            placeholder="link id, endpoint, or evidence"
          />
        </label>
        <label className="field-group">
          <span>{linkStateFilterLabel}</span>
          <select
            value={linkStateFilter}
            onChange={(event) => setLinkStateFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="up">Up</option>
            <option value="down">Down</option>
            <option value="degraded">Degraded</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
        <label className="field-group">
          <span>Knowledge state</span>
          <select
            value={linkKnowledgeFilter}
            onChange={(event) => setLinkKnowledgeFilter(event.target.value)}
          >
            <option value="all">All</option>
            {sortedKnowledgeCounts.map(([knowledgeState]) => (
              <option key={knowledgeState} value={knowledgeState}>
                {formatLabel(knowledgeState)}
              </option>
            ))}
          </select>
        </label>
        <label className="field-group">
          <span>Endpoint pairing</span>
          <select
            value={linkEvidenceFilter}
            onChange={(event) => setLinkEvidenceFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="paired">Paired</option>
            <option value="single_sided">Single sided</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
        <label className="field-group">
          <span>Sort links</span>
          <select value={linkSortBy} onChange={(event) => setLinkSortBy(event.target.value)}>
            <option value="state_then_id">State then ID</option>
            <option value="evidence_then_id">Evidence then ID</option>
            <option value="endpoint_then_id">Endpoints then ID</option>
          </select>
        </label>
      </div>

      {topology.links.length === 0 ? (
        <EmptyState
          title="No topology links"
          description="The topology snapshot is present, but no link records are available yet."
        />
      ) : filteredLinks.length === 0 ? (
        <EmptyState
          title="No links match the current filter"
          description="Adjust the link search text or state filter to widen the topology view."
        />
      ) : (
        <>
          <div className="table-card">
            <h3>Links</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Link</th>
                  <th>Endpoints</th>
                  <th>State</th>
                  <th>Knowledge</th>
                  <th>Evidence</th>
                  <th>Source</th>
                  <th>Dossier</th>
                </tr>
              </thead>
              <tbody>
                {sortedLinks.map((link) => {
                  const isSelected = selectedLink?.link_id === link.link_id;
                  const evidenceCount = getTopologyLinkEndpointEvidenceCount(link);
                  const endpointPairingState = getTopologyLinkEndpointPairingState(link);
                  const linkStateDisplay = buildRowPostureStatusDisplay(
                    link.current_posture,
                    link.state,
                    link.last_recorded_state,
                    "Last recorded state",
                  );
                  return (
                    <tr key={link.link_id} className={isSelected ? "data-row-selected" : undefined}>
                      <td>
                        <button
                          type="button"
                          className="table-select"
                          onClick={() => setSelectedLinkId(link.link_id)}
                        >
                          <strong>{link.link_id}</strong>
                        </button>
                        <div className="table-note">
                          {link.attributes.inference_method ?? "No inference method recorded"}
                        </div>
                      </td>
                      <td>
                        {link.source_node_id} to {link.target_node_id}
                      </td>
                      <td>
                        <StatusPill value={linkStateDisplay.pillValue} />
                        {linkStateDisplay.note ? (
                          <div className="table-note">{linkStateDisplay.note}</div>
                        ) : null}
                      </td>
                      <td>{formatLabel(getLinkKnowledgeState(link))}</td>
                      <td>
                        <StatusPill value={endpointPairingState} />
                        <div className="table-note">
                          {formatCountLabel(evidenceCount, "endpoint")} observed
                          {link.attributes.observed_interfaces
                            ? ` • ${link.attributes.observed_interfaces}`
                            : ""}
                        </div>
                      </td>
                      <td>{link.source}</td>
                      <td>
                        <button
                          type="button"
                          className="nav-drilldown-button"
                          onClick={() => navigateToTopologyDossier(link.link_id, "link", "topology_table")}
                        >
                          Open dossier
                        </button>
                        <div className="table-note">Composed briefing for this link.</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {selectedLink && workspaceMode === "standard" ? (
            <div className="content-grid">
              <article className="detail-card">
                <h3>Selected Link Detail</h3>
                <div className="metadata-row">
                  <span>Link: {selectedLink.link_id}</span>
                  <span>Knowledge: {formatLabel(getLinkKnowledgeState(selectedLink))}</span>
                  <span>Pairing: {formatLabel(getTopologyLinkEndpointPairingState(selectedLink))}</span>
                  <span>Physical adjacency: {formatLabel(getLinkPhysicalAdjacencyPosture(selectedLink))}</span>
                  <span>Current posture: {formatRowCurrentPosture(selectedLink.current_posture)}</span>
                </div>
                <div className="key-value-list">
                  <div className="key-value-row">
                    <span>Endpoints</span>
                    <strong>
                      {selectedLink.source_node_id} to {selectedLink.target_node_id}
                    </strong>
                  </div>
                  <div className="key-value-row">
                    <span>Link state</span>
                    <div>
                      <StatusPill value={selectedLinkStateDisplay?.pillValue ?? "unknown"} />
                      {selectedLinkStateDisplay?.note ? (
                        <div className="table-note">{selectedLinkStateDisplay.note}</div>
                      ) : null}
                    </div>
                  </div>
                  <div className="key-value-row">
                    <span>Knowledge state</span>
                    <strong>{formatLabel(getLinkKnowledgeState(selectedLink))}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Endpoint pairing</span>
                    <strong>{formatLabel(getTopologyLinkEndpointPairingState(selectedLink))}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Endpoint evidence</span>
                    <strong>{formatCountLabel(getTopologyLinkEndpointEvidenceCount(selectedLink), "endpoint")}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>LLDP observations</span>
                    <strong>{formatCountLabel(selectedLink.physical_adjacency.lldp_observation_count, "observation")}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Physical adjacency</span>
                    <strong>{formatLabel(getLinkPhysicalAdjacencyPosture(selectedLink))}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>IGP observations</span>
                    <strong>
                      {formatCountLabel(
                        selectedLink.control_plane_adjacency.observation_count,
                        "observation",
                      )}
                    </strong>
                  </div>
                  <div className="key-value-row">
                    <span>Control-plane adjacency</span>
                    <strong>{formatLabel(getLinkControlPlaneAdjacencyPosture(selectedLink))}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>IGP protocols</span>
                    <strong>
                      {selectedLink.control_plane_adjacency.protocols_observed.length > 0
                        ? selectedLink.control_plane_adjacency.protocols_observed
                            .map((protocol) => protocol.toUpperCase())
                            .join(", ")
                        : "No IGP protocol evidence recorded"}
                    </strong>
                  </div>
                  <div className="key-value-row">
                    <span>IGP remote identities</span>
                    <strong>
                      {selectedLink.control_plane_adjacency.remote_identities.length > 0
                        ? selectedLink.control_plane_adjacency.remote_identities.join(", ")
                        : "No IGP remote identities recorded"}
                    </strong>
                  </div>
                  <div className="key-value-row">
                    <span>Observed interfaces</span>
                    <strong>
                      {selectedLink.attributes.observed_interfaces ?? "No observed interfaces recorded"}
                    </strong>
                  </div>
                  <div className="key-value-row">
                    <span>LLDP remote systems</span>
                    <strong>
                      {selectedLink.physical_adjacency.remote_systems.length > 0
                        ? selectedLink.physical_adjacency.remote_systems.join(", ")
                        : "No LLDP remote systems recorded"}
                    </strong>
                  </div>
                  <div className="key-value-row">
                    <span>LLDP remote ports</span>
                    <strong>
                      {selectedLink.physical_adjacency.remote_ports.length > 0
                        ? selectedLink.physical_adjacency.remote_ports.join(", ")
                        : "No LLDP remote ports recorded"}
                    </strong>
                  </div>
                  <div className="key-value-row">
                    <span>Inference method</span>
                    <strong>
                      {selectedLink.attributes.inference_method ?? "No inference method recorded"}
                    </strong>
                  </div>
                  <div className="key-value-row">
                    <span>Source</span>
                    <strong>{selectedLink.source}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Evidence interpretation</span>
                    <strong>{describeTopologyLinkPairing(selectedLink)}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Inference detail</span>
                    <strong>{describeLinkEvidence(selectedLink)}</strong>
                  </div>
                </div>
                {selectedLink.physical_adjacency.correlation_notes.length > 0 ? (
                  <>
                    <p className="summary-label">LLDP Correlation Notes</p>
                    <ul className="notes-list">
                      {selectedLink.physical_adjacency.correlation_notes.map((note) => (
                        <li key={`${selectedLink.link_id}-${note}`}>{note}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {selectedLink.control_plane_adjacency.correlation_notes.length > 0 ? (
                  <>
                    <p className="summary-label">IGP Correlation Notes</p>
                    <ul className="notes-list">
                      {selectedLink.control_plane_adjacency.correlation_notes.map((note) => (
                        <li key={`${selectedLink.link_id}-igp-${note}`}>{note}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
                <p className="summary-label">Link Evidence</p>
                <div className="key-value-list">
                  {Object.entries(selectedLink.attributes)
                    .sort(([left], [right]) => left.localeCompare(right))
                    .map(([key, value]) => (
                      <div key={`${selectedLink.link_id}-${key}`} className="key-value-row">
                        <span>{formatLabel(key)}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                </div>
              </article>
              <TopologyRelatedPoliciesPanel
                objectId={selectedLink.link_id}
                objectKind="link"
                policiesList={policyData}
              />
              <TopologyFailureImpactPanel objectId={selectedLink.link_id} objectKind="link" />
              <TopologyObjectEvidenceTimelinePanel objectId={selectedLink.link_id} objectKind="link" />
              <TopologyObjectEvidenceDeltaPanel objectId={selectedLink.link_id} objectKind="link" />
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
