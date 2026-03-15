import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import { TrustCueCard } from "../../components/trust-cue-card";
import type { PlatformReadPathStatus } from "../../api/contracts";
import {
  countBy,
  describeTopologyCoveragePosture,
  describeTopologyReadPathPairing,
  formatDateTime,
  formatLabel,
} from "../../lib/presentation";
import { normalizeDryRunReadiness, summarizeReadinessItemIdentitySupport } from "../../lib/readiness";
import { useCapabilitiesQuery } from "../capabilities/api";
import { useDevicesQuery } from "../devices/api";
import { getPlatformReadPath, usePlatformStatusQuery } from "../platform-health/api";
import { usePoliciesQuery } from "../policies/api";
import { getTopologyCoverageSummary, useTopologyQuery } from "../topology/api";

function formatReadPathCoverage(readPath: PlatformReadPathStatus | null): string {
  if (!readPath) {
    return "Not exposed";
  }

  return `${readPath.observed_target_count} of ${readPath.configured_target_count} configured targets`;
}

function formatReadPathCollection(readPath: PlatformReadPathStatus | null): string {
  if (!readPath) {
    return "Not exposed";
  }

  return `success ${readPath.collection_success_count} • partial ${readPath.collection_partial_count} • failed ${readPath.collection_failure_count}`;
}

function formatReadPathFreshness(readPath: PlatformReadPathStatus | null): string {
  if (!readPath?.oldest_observed_at || !readPath.newest_observed_at) {
    return "Not exposed";
  }

  return `${formatDateTime(readPath.oldest_observed_at)} -> ${formatDateTime(readPath.newest_observed_at)}`;
}

export function OverviewView() {
  const platformQuery = usePlatformStatusQuery();
  const devicesQuery = useDevicesQuery();
  const topologyQuery = useTopologyQuery();
  const policiesQuery = usePoliciesQuery();
  const capabilitiesQuery = useCapabilitiesQuery();

  const isLoading =
    platformQuery.isLoading ||
    devicesQuery.isLoading ||
    topologyQuery.isLoading ||
    policiesQuery.isLoading ||
    capabilitiesQuery.isLoading;

  const error =
    platformQuery.error ??
    devicesQuery.error ??
    topologyQuery.error ??
    policiesQuery.error ??
    capabilitiesQuery.error;

  if (isLoading) {
    return (
      <section>
        <h2>Overview</h2>
        <LoadingState label="Loading platform summary from the read-only backend APIs." />
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2>Overview</h2>
        <ErrorState
          error={error}
          onRetry={() => {
            platformQuery.reload();
            devicesQuery.reload();
            topologyQuery.reload();
            policiesQuery.reload();
            capabilitiesQuery.reload();
          }}
        />
      </section>
    );
  }

  if (
    !platformQuery.data ||
    !devicesQuery.data ||
    !topologyQuery.data ||
    !policiesQuery.data ||
    !capabilitiesQuery.data
  ) {
    return (
      <section>
        <h2>Overview</h2>
        <EmptyState
          title="No overview data"
          description="The backend returned no overview content for the current platform state."
        />
      </section>
    );
  }

  const observedComponentCount = platformQuery.data.components.filter(
    (component) => component.observation_state !== "not_checked",
  ).length;
  const degradedComponentCount = platformQuery.data.components.filter((component) =>
    ["degraded", "unreachable", "unknown"].includes(component.observation_state),
  ).length;
  const liveBackedSliceCount = [devicesQuery.data, topologyQuery.data, policiesQuery.data].filter(
    (slice) => slice.serving_mode === "live_collector",
  ).length;
  const fallbackOrBlockedSliceCount = [
    devicesQuery.data,
    topologyQuery.data,
    policiesQuery.data,
  ].filter(
    (slice) =>
      slice.serving_mode !== "live_collector" ||
      slice.evidence_confidence.confidence_posture === "blocked",
  ).length;
  const anchorBackedSurfaceCount = [
    devicesQuery.data.comparison_to_latest_persisted.comparison_snapshot_id,
    topologyQuery.data.comparison_to_latest_persisted.comparison_snapshot_id,
    policiesQuery.data.comparison_to_latest_persisted.comparison_snapshot_id,
    capabilitiesQuery.data.readiness_snapshot_id,
  ].filter(Boolean).length;
  const staleSliceCount = [devicesQuery.data, topologyQuery.data, policiesQuery.data].filter(
    (slice) => slice.evidence_confidence.freshness_posture === "stale",
  ).length;
  const readPaths = platformQuery.data.read_paths ?? [];
  const okReadPathCount = readPaths.filter((readPath) => readPath.observation_state === "ok").length;
  const degradedReadPathCount = readPaths.filter(
    (readPath) => readPath.observation_state !== "ok",
  ).length;
  const coverageWindowCount = readPaths.filter(
    (readPath) => readPath.oldest_observed_at && readPath.newest_observed_at,
  ).length;
  const totalObservedTargets = readPaths.reduce(
    (sum, readPath) => sum + readPath.observed_target_count,
    0,
  );
  const totalConfiguredTargets = readPaths.reduce(
    (sum, readPath) => sum + readPath.configured_target_count,
    0,
  );
  const inventoryReadPath = getPlatformReadPath(readPaths, "inventory");
  const topologyReadPath = getPlatformReadPath(readPaths, "topology");
  const policyReadPath = getPlatformReadPath(readPaths, "policy");
  const topologyCoverageSummary = getTopologyCoverageSummary(topologyQuery.data);
  const topologyCoverageReadout = describeTopologyCoveragePosture(
    topologyCoverageSummary,
    topologyQuery.data.topology.links.length,
  );
  const topologyReadPathPairing = describeTopologyReadPathPairing(topologyReadPath);
  const readiness = normalizeDryRunReadiness(capabilitiesQuery.data.dry_run_readiness);
  const readinessIdentity = summarizeReadinessItemIdentitySupport(readiness);

  return (
    <section>
      <div className="section-header">
        <div>
          <h2>Overview</h2>
          <p>
            The WebUI now reads stable product contracts from `app-api` to summarize
            what exists, what is healthy, and where the current read-only foundation remains intentionally
            partial.
          </p>
        </div>
        <StatusPill value={platformQuery.data.status} />
      </div>

      <div className="metadata-row">
        <span>Platform generated: {formatDateTime(platformQuery.data.generated_at)}</span>
        <span>Devices generated: {formatDateTime(devicesQuery.data.generated_at)}</span>
        <span>Topology generated: {formatDateTime(topologyQuery.data.generated_at)}</span>
        <span>Policies generated: {formatDateTime(policiesQuery.data.generated_at)}</span>
        <span>Capabilities generated: {formatDateTime(capabilitiesQuery.data.generated_at)}</span>
      </div>

      <p className="callout">
        Routine-use trust cues stay explicit here: {liveBackedSliceCount} core read-side
        slice{liveBackedSliceCount === 1 ? " is" : "slices are"} currently live-backed,
        {" "}
        {fallbackOrBlockedSliceCount} slice
        {fallbackOrBlockedSliceCount === 1 ? " remains" : "s remain"} fallback or blocked,
        and {anchorBackedSurfaceCount} surface
        {anchorBackedSurfaceCount === 1 ? " currently exposes" : "s currently expose"}{" "}
        a persisted anchor for bounded comparison or readiness support. Bounded collector-to-backend
        coverage is currently visible for {okReadPathCount} of {readPaths.length} exposed read paths,
        with {coverageWindowCount} freshness window
        {coverageWindowCount === 1 ? "" : "s"} and {degradedReadPathCount} read path
        {degradedReadPathCount === 1 ? " needing" : "s needing"} closer interpretation.
      </p>

      <div className="summary-grid">
        <article className="summary-card">
          <p className="summary-label">Declared platform components</p>
          <strong>{platformQuery.data.components.length}</strong>
          <p>{platformQuery.data.summary}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Device inventory</p>
          <strong>{devicesQuery.data.count}</strong>
          <p>{formatLabel(devicesQuery.data.data_status)}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Topology coverage</p>
          <strong>{topologyCoverageReadout.label}</strong>
          <p>{topologyCoverageReadout.countDetail}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Policy inventory</p>
          <strong>{policiesQuery.data.count}</strong>
          <p>{formatLabel(policiesQuery.data.data_status)}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Capabilities</p>
          <strong>{capabilitiesQuery.data.count}</strong>
          <p>{formatLabel(capabilitiesQuery.data.data_status)}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Immediate attention</p>
          <strong>
            {(countBy(policiesQuery.data.items, (policy) => policy.health_state).degraded ??
              0) +
              (countBy(topologyQuery.data.topology.nodes, (node) => node.state).degraded ??
                0)}
          </strong>
          <p>Degraded policy or topology items visible in current product views.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Live-Backed Slices</p>
          <strong>{liveBackedSliceCount}</strong>
          <p>Devices, topology, and policies currently served from live collector-backed paths.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Fallback Or Blocked</p>
          <strong>{fallbackOrBlockedSliceCount}</strong>
          <p>Core slices where routine interpretation still depends on fallback or blocked posture.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Anchor-Backed Surfaces</p>
          <strong>{anchorBackedSurfaceCount}</strong>
          <p>Current comparison or readiness surfaces exposing persisted anchor identifiers.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Stale Slice Posture</p>
          <strong>{staleSliceCount}</strong>
          <p>Core slices whose current evidence is explicitly stale rather than current.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Read-Path Coverage</p>
          <strong>
            {totalObservedTargets}/{totalConfiguredTargets || 0}
          </strong>
          <p>Configured target coverage currently summarized by the platform-status contract.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Read-Path Attention</p>
          <strong>{degradedReadPathCount}</strong>
          <p>Collector-backed model families currently reporting degraded or incomplete scope.</p>
        </article>
      </div>

      <div className="content-grid">
        <article className="detail-card">
          <h3>Platform status</h3>
          <p>{platformQuery.data.summary}</p>
          <ul className="compact-list">
            {platformQuery.data.components.map((component) => (
              <li key={component.name}>
                <span>{component.name}</span>
                <StatusPill value={component.observation_state} />
              </li>
            ))}
          </ul>
        </article>

        <TrustCueCard
          title="Devices Trust Cues"
          summary="Routine device use depends on whether inventory is live-backed, stale, or fallback-served, plus the bounded collector coverage and freshness window the platform-status contract now carries for inventory."
          rows={[
            {
              label: "Serving mode",
              kind: "status",
              value: devicesQuery.data.serving_mode,
              note: [devicesQuery.data.summary, inventoryReadPath?.summary ?? "Inventory read-path coverage is not exposed by the current platform-status response."],
            },
            {
              label: "Freshness posture",
              kind: "status",
              value: devicesQuery.data.evidence_confidence.freshness_posture,
            },
            {
              label: "Target coverage",
              kind: "text",
              value: formatReadPathCoverage(inventoryReadPath),
            },
            {
              label: "Collection posture",
              kind: "text",
              value: formatReadPathCollection(inventoryReadPath),
            },
            {
              label: "Freshness window",
              kind: "text",
              value: formatReadPathFreshness(inventoryReadPath),
            },
            {
              label: "Evidence basis",
              kind: "status",
              value: devicesQuery.data.evidence_confidence.evidence_kind,
            },
            {
              label: "Degraded scope",
              kind: "status",
              value: inventoryReadPath?.observation_state ?? "unknown",
              note: inventoryReadPath?.degraded_scope_summary,
            },
            {
              label: "Comparison anchor",
              kind: "anchor",
              value: devicesQuery.data.comparison_to_latest_persisted.comparison_snapshot_id,
              emptyLabel: "No comparison anchor exposed",
            },
            {
              label: "Served persisted at",
              kind: "text",
              value: formatDateTime(devicesQuery.data.served_persisted_at),
            },
          ]}
        />

        <TrustCueCard
          title="Topology Trust Cues"
          summary="Topology routine use depends on live-versus-fallback serving, partial completeness, backend-owned endpoint-pairing posture, and the bounded target coverage and freshness posture now exposed for the topology read path."
          rows={[
            {
              label: "Serving mode",
              kind: "status",
              value: topologyQuery.data.serving_mode,
              note: [topologyQuery.data.summary, topologyReadPath?.summary ?? "Topology read-path coverage is not exposed by the current platform-status response."],
            },
            {
              label: "Freshness posture",
              kind: "status",
              value: topologyQuery.data.evidence_confidence.freshness_posture,
            },
            {
              label: "Endpoint pairing",
              kind: "status",
              value: topologyReadPathPairing.status,
              note: [topologyCoverageReadout.detail, topologyCoverageReadout.countDetail],
            },
            {
              label: "Target coverage",
              kind: "text",
              value: formatReadPathCoverage(topologyReadPath),
            },
            {
              label: "Collection posture",
              kind: "text",
              value: formatReadPathCollection(topologyReadPath),
            },
            {
              label: "Freshness window",
              kind: "text",
              value: formatReadPathFreshness(topologyReadPath),
            },
            {
              label: "Evidence basis",
              kind: "status",
              value: topologyQuery.data.evidence_confidence.evidence_kind,
            },
            {
              label: "Completeness",
              kind: "status",
              value: topologyQuery.data.topology.completeness,
            },
            {
              label: "Degraded scope",
              kind: "status",
              value: topologyReadPath?.observation_state ?? "unknown",
              note: [
                topologyReadPath?.degraded_scope_summary ?? "No topology degraded-scope summary is exposed.",
                topologyReadPathPairing.countDetail,
              ],
            },
            {
              label: "Comparison anchor",
              kind: "anchor",
              value: topologyQuery.data.comparison_to_latest_persisted.comparison_snapshot_id,
              emptyLabel: "No comparison anchor exposed",
            },
          ]}
        />

        <TrustCueCard
          title="Policies Trust Cues"
          summary="Policy routine use is grounded in serving mode, freshness posture, evidence kind, and the bounded coverage and detail-ready posture now exposed for the policy read path."
          rows={[
            {
              label: "Serving mode",
              kind: "status",
              value: policiesQuery.data.serving_mode,
              note: [policiesQuery.data.summary, policyReadPath?.summary ?? "Policy read-path coverage is not exposed by the current platform-status response."],
            },
            {
              label: "Freshness posture",
              kind: "status",
              value: policiesQuery.data.evidence_confidence.freshness_posture,
            },
            {
              label: "Target coverage",
              kind: "text",
              value: formatReadPathCoverage(policyReadPath),
            },
            {
              label: "Collection posture",
              kind: "text",
              value: formatReadPathCollection(policyReadPath),
            },
            {
              label: "Freshness window",
              kind: "text",
              value: formatReadPathFreshness(policyReadPath),
            },
            {
              label: "Evidence basis",
              kind: "status",
              value: policiesQuery.data.evidence_confidence.evidence_kind,
            },
            {
              label: "Detail-ready targets",
              kind: "text",
              value:
                policyReadPath?.detail_ready_target_count !== null &&
                policyReadPath?.detail_ready_target_count !== undefined
                  ? `${policyReadPath.detail_ready_target_count}`
                  : "Not exposed",
              note:
                policyReadPath?.policy_capable_target_count !== null &&
                policyReadPath?.policy_capable_target_count !== undefined
                  ? `Policy-capable targets: ${policyReadPath.policy_capable_target_count}`
                  : undefined,
            },
            {
              label: "Current posture",
              kind: "status",
              value: policiesQuery.data.empty_reason === "none" ? "ok" : policiesQuery.data.empty_reason,
            },
            {
              label: "Degraded scope",
              kind: "status",
              value: policyReadPath?.observation_state ?? "unknown",
              note: policyReadPath?.degraded_scope_summary,
            },
            {
              label: "Comparison anchor",
              kind: "anchor",
              value: policiesQuery.data.comparison_to_latest_persisted.comparison_snapshot_id,
              emptyLabel: "No comparison anchor exposed",
            },
          ]}
        />

        <TrustCueCard
          title="Capabilities And Readiness Cues"
          summary="The capability matrix stays descriptive. The readiness surface uses the persisted snapshot anchor as the strongest trust cue, while child item identifiers may remain absent or mixed across backend versions and never imply workflow handles."
          rows={[
            {
              label: "Matrix status",
              kind: "status",
              value: capabilitiesQuery.data.data_status,
              note: capabilitiesQuery.data.summary,
            },
            {
              label: "Planning readiness",
              kind: "status",
              value: readiness.planning_readiness,
            },
            {
              label: "Readiness anchor",
              kind: "anchor",
              value: capabilitiesQuery.data.readiness_snapshot_id,
              emptyLabel: "No readiness anchor exposed",
              note: "The response anchor is the durable reference for the persisted readiness-support record when it is available.",
            },
            {
              label: "Child item identity",
              kind: "text",
              value: formatLabel(readinessIdentity.posture),
              note: readinessIdentity.note,
            },
            {
              label: "Readiness persisted at",
              kind: "text",
              value: formatDateTime(capabilitiesQuery.data.readiness_persisted_at ?? null),
            },
            {
              label: "Identifiers exposed",
              kind: "text",
              value: `${readinessIdentity.exposedCount} of ${readinessIdentity.totalCount}`,
            },
            {
              label: "Strongest blocker count",
              kind: "text",
              value: `${readiness.strongest_blockers.length}`,
            },
          ]}
        />

        <article className="detail-card">
          <h3>What needs interpretation</h3>
          <ul className="notes-list">
            {topologyQuery.data.topology.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
            {policiesQuery.data.items
              .flatMap((policy) => policy.notes)
              .slice(0, 2)
              .map((note) => (
                <li key={note}>{note}</li>
              ))}
          </ul>
        </article>

        <article className="detail-card">
          <h3>Why this is in the product</h3>
          <p>
            These pages organize backend-owned inventory, topology, policy, and
            capability contracts into operator-readable views. Deep time-series
            troubleshooting still belongs in Grafana.
          </p>
          <p className="table-note">
            Platform observation coverage: {observedComponentCount} of {platformQuery.data.components.length}
            {" "}
            declared components currently have a bounded live observation on the product-facing
            platform status surface, and {degradedComponentCount} currently need closer review.
            Read-path coverage and degraded-scope summaries stay here as backend-owned product cues,
            while Grafana remains the place for numeric gap trends and scrape-oriented troubleshooting.
          </p>
        </article>
      </div>
    </section>
  );
}
