import { useMemo, useState } from "react";

import type {
  EvidenceConfidenceSummary,
  TopologyLinkRecord,
  TopologyNodeRecord,
} from "../../api/contracts";
import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { IdentifierChip } from "../../components/identifier-chip";
import { StatusPill } from "../../components/status-pill";
import { buildCrossSliceConsistencyReadout } from "../../lib/cross-slice-consistency";
import { countBy, formatDateTime, formatLabel } from "../../lib/presentation";
import {
  buildPolicyEvidenceFallback,
  buildTopologyEvidenceFallback,
  describeBlockedReason,
  describeConfidencePosture,
  describeEvidenceKind,
  describeEvidenceSource,
  normalizeEvidenceConfidence,
} from "../../lib/evidence-confidence";
import { usePoliciesQuery } from "../policies/api";
import { useTopologyQuery } from "./api";

function getLinkEvidenceCount(link: TopologyLinkRecord): number {
  return Number.parseInt(link.attributes.endpoint_evidence_count ?? "0", 10) || 0;
}

function getLinkKnowledgeState(link: TopologyLinkRecord): string {
  return link.attributes.knowledge_state ?? "unknown";
}

function getLinkEvidencePosture(link: TopologyLinkRecord): string {
  const evidenceCount = getLinkEvidenceCount(link);

  if (evidenceCount <= 1) {
    return "single_sided";
  }

  return "multi_sided";
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

function describeInferenceReadout(
  singleSidedLinkCount: number,
  linkCount: number,
  knowledgeCounts: Record<string, number>,
): { label: string; detail: string } {
  if (linkCount === 0) {
    return {
      label: "No inferred links",
      detail: "No normalized link evidence is currently available in this topology response.",
    };
  }
  if (singleSidedLinkCount === 0 && (knowledgeCounts.partial ?? 0) === 0) {
    return {
      label: "Stronger evidence",
      detail:
        "Current link evidence is still bounded, but it does not currently show any single-sided or explicitly partial inferred links.",
    };
  }
  return {
    label: "Bounded inference",
    detail:
      "Link evidence remains bounded and inference-based. Single-sided and partial counts help show how much of the graph is still interpretive rather than fully observed.",
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
  const knowledgeState = getLinkKnowledgeState(link);
  const posture = getLinkEvidencePosture(link);
  if (knowledgeState === "partial" && posture === "single_sided") {
    return "Partial single-sided inference";
  }
  if (knowledgeState === "partial" && posture === "multi_sided") {
    return "Partial multi-sided inference";
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
  const {
    data: policyData,
    error: policyError,
    isLoading: isPolicyLoading,
  } = usePoliciesQuery();
  const [nodeSearchValue, setNodeSearchValue] = useState("");
  const [nodeStateFilter, setNodeStateFilter] = useState("all");
  const [nodeRoleFilter, setNodeRoleFilter] = useState("all");
  const [nodeSortBy, setNodeSortBy] = useState("state_then_name");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [linkSearchValue, setLinkSearchValue] = useState("");
  const [linkStateFilter, setLinkStateFilter] = useState("all");
  const [linkKnowledgeFilter, setLinkKnowledgeFilter] = useState("all");
  const [linkEvidenceFilter, setLinkEvidenceFilter] = useState("all");
  const [linkSortBy, setLinkSortBy] = useState("state_then_id");
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const topology = data?.topology;
  const nodes = topology?.nodes ?? [];
  const links = topology?.links ?? [];
  const nodeCounts = countBy(nodes, (node) => node.state);
  const linkCounts = countBy(links, (link) => link.state);
  const roleCounts = useMemo(() => countBy(nodes, (node) => node.role), [nodes]);
  const knowledgeCounts = useMemo(() => countBy(links, (link) => getLinkKnowledgeState(link)), [links]);
  const evidencePostureCounts = useMemo(
    () => countBy(links, (link) => getLinkEvidencePosture(link)),
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
  const singleSidedLinkCount = useMemo(
    () => links.filter((link) => getLinkEvidencePosture(link) === "single_sided").length,
    [links],
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
  const filteredLinks = useMemo(() => {
    const normalizedSearch = linkSearchValue.trim().toLowerCase();

    return links.filter((link) => {
      const matchesState = linkStateFilter === "all" || link.state === linkStateFilter;
      const knowledgeState = getLinkKnowledgeState(link);
      const evidencePosture = getLinkEvidencePosture(link);
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
            getLinkEvidenceCount(left) - getLinkEvidenceCount(right) ||
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
  const evidenceConfidence = normalizeEvidenceConfidence(
    data.evidence_confidence,
    buildTopologyEvidenceFallback(data.serving_mode, data.data_status),
  );
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
  const inferenceReadout = describeInferenceReadout(
    singleSidedLinkCount,
    topology.links.length,
    knowledgeCounts,
  );
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

  return (
    <section>
      <div className="section-header">
        <div>
          <h2>Topology</h2>
          <p>
            Topology is shown through the backend-owned normalized read model rather
            than direct observability dashboards or raw protocol payloads.
          </p>
        </div>
        <StatusPill value={topology.completeness} />
      </div>

      <div className="metadata-row">
        <span>Data status: {data.data_status}</span>
        <span>Serving mode: {formatLabel(data.serving_mode)}</span>
        <span>Sync source: {topology.sync_source}</span>
        <span>Sync status: {topology.sync_status}</span>
        <span>Observed: {formatDateTime(topology.observed_at)}</span>
        <span>Served persisted at: {formatDateTime(data.served_persisted_at)}</span>
        <span>Generated: {formatDateTime(data.generated_at)}</span>
      </div>

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
          <p className="summary-label">Policy Slice Posture</p>
          <strong>{policyConsistencyReadout.label}</strong>
          <p>{policyConsistencyReadout.detail}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Degraded Links</p>
          <strong>{linkCounts.degraded ?? 0}</strong>
          <p>Links whose evidence or state is degraded remain explicit.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Single-Sided Evidence</p>
          <strong>{singleSidedLinkCount}</strong>
          <p>Links inferred from only one observed endpoint stay explicitly partial.</p>
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
              <StatusPill value={topology.sync_status} />
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
              <span>Link evidence posture</span>
              <strong>{inferenceReadout.label}</strong>
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
              <span>Single-sided inferred links</span>
              <strong>{singleSidedLinkCount}</strong>
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
              <span>Nodes up</span>
              <strong>{nodeCounts.up ?? 0}</strong>
            </li>
            <li>
              <span>Nodes degraded</span>
              <strong>{nodeCounts.degraded ?? 0}</strong>
            </li>
            <li>
              <span>Links up</span>
              <strong>{linkCounts.up ?? 0}</strong>
            </li>
            <li>
              <span>Links degraded</span>
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
              <span>Persisted node count</span>
              <strong>{comparison.persisted_node_count}</strong>
            </li>
            <li>
              <span>Persisted link count</span>
              <strong>{comparison.persisted_link_count}</strong>
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <h3>Link Evidence Distribution</h3>
          <ul className="compact-list">
            <li>
              <span>Single-sided links</span>
              <strong>{evidencePostureCounts.single_sided ?? 0}</strong>
            </li>
            <li>
              <span>Multi-sided links</span>
              <strong>{evidencePostureCounts.multi_sided ?? 0}</strong>
            </li>
            <li>
              <span>Knowledge: partial</span>
              <strong>{knowledgeCounts.partial ?? 0}</strong>
            </li>
            <li>
              <span>Knowledge: unknown</span>
              <strong>{knowledgeCounts.unknown ?? 0}</strong>
            </li>
            <li>
              <span>Total link evidence endpoints</span>
              <strong>
                {links.reduce((total, link) => total + getLinkEvidenceCount(link), 0)}
              </strong>
            </li>
          </ul>
        </article>
      </div>

      <div className="callout">
        <strong>How to read this page</strong>
        <p>
          Live collector data remains the primary current truth source. Persisted fallback
          snapshots keep the page usable when live collection is unavailable. Comparison
          summaries show bounded normalized differences only and should not be read as
          path-validation, controller truth, or drift verdicts.
        </p>
        <p className="table-note">
          When the backend can identify the compared persisted topology record explicitly, this
          page now shows that snapshot anchor alongside the comparison timestamp.
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
          <span>Node state</span>
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
                </tr>
              </thead>
              <tbody>
                {sortedNodes.map((node) => {
                  const isSelected = selectedNode?.node_id === node.node_id;
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
                        <StatusPill value={node.state} />
                      </td>
                      <td>{node.attributes.loopback_ipv4 ?? "Unknown"}</td>
                      <td>{node.attributes.management_address ?? "Unknown"}</td>
                      <td>{node.source}</td>
                      <td>{node.device_id ?? "Not linked"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {selectedNode ? (
            <div className="content-grid">
              <article className="detail-card">
                <h3>Selected Node Detail</h3>
                <div className="metadata-row">
                  <span>Node: {selectedNode.display_name}</span>
                  <span>Role: {formatLabel(selectedNode.role)}</span>
                  <span>State: {formatLabel(selectedNode.state)}</span>
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
          <span>Link state</span>
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
          <span>Evidence posture</span>
          <select
            value={linkEvidenceFilter}
            onChange={(event) => setLinkEvidenceFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="single_sided">Single sided</option>
            <option value="multi_sided">Multi sided</option>
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
                </tr>
              </thead>
              <tbody>
                {sortedLinks.map((link) => {
                  const isSelected = selectedLink?.link_id === link.link_id;
                  const evidenceCount = getLinkEvidenceCount(link);
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
                        <StatusPill value={link.state} />
                      </td>
                      <td>{formatLabel(getLinkKnowledgeState(link))}</td>
                      <td>
                        <strong>
                          {evidenceCount} endpoint{evidenceCount === 1 ? "" : "s"}
                        </strong>
                        <div className="table-note">
                          {link.attributes.observed_interfaces ?? "No observed interfaces recorded"}
                        </div>
                      </td>
                      <td>{link.source}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {selectedLink ? (
            <div className="content-grid">
              <article className="detail-card">
                <h3>Selected Link Detail</h3>
                <div className="metadata-row">
                  <span>Link: {selectedLink.link_id}</span>
                  <span>Knowledge: {formatLabel(getLinkKnowledgeState(selectedLink))}</span>
                  <span>Evidence: {formatLabel(getLinkEvidencePosture(selectedLink))}</span>
                  <span>Source: {selectedLink.source}</span>
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
                    <strong>{formatLabel(selectedLink.state)}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Knowledge state</span>
                    <strong>{formatLabel(getLinkKnowledgeState(selectedLink))}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Endpoint evidence</span>
                    <strong>{getLinkEvidenceCount(selectedLink)}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Observed interfaces</span>
                    <strong>
                      {selectedLink.attributes.observed_interfaces ?? "No observed interfaces recorded"}
                    </strong>
                  </div>
                  <div className="key-value-row">
                    <span>Inference method</span>
                    <strong>
                      {selectedLink.attributes.inference_method ?? "No inference method recorded"}
                    </strong>
                  </div>
                  <div className="key-value-row">
                    <span>Evidence interpretation</span>
                    <strong>{describeLinkEvidence(selectedLink)}</strong>
                  </div>
                </div>
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
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
