import { useCallback, useEffect, useRef } from "react";

import {
  EmptyState,
  ErrorState,
  LoadingState,
  QueryStateDetailCard,
  QueryStateSummaryCard,
} from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import { TrustCueCard } from "../../components/trust-cue-card";
import type { PlatformReadPathStatus } from "../../api/contracts";
import {
  countBy,
  describeTopologyCollectionPosture,
  describeTopologyCoveragePosture,
  describeTopologyInferencePosture,
  describeTopologyReadPathNodeParticipation,
  describeTopologyReadPathCollection,
  describeTopologyReadPathInference,
  describeTopologyReadPathPairing,
  formatDateTime,
  formatLabel,
} from "../../lib/presentation";
import { normalizeDryRunReadiness, summarizeReadinessItemIdentitySupport } from "../../lib/readiness";
import { useCapabilitiesQuery } from "../capabilities/api";
import { useDevicesQuery } from "../devices/api";
import {
  buildOverviewRenderState,
  reloadOverviewSlicesSequentially,
  type OverviewSliceState,
} from "./model";
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

function buildSliceAvailabilitySummary(summary: string, sliceState: OverviewSliceState): string {
  switch (sliceState.status) {
    case "refreshing":
      return `${summary} Latest refresh is still in flight, so this page is showing the last successful slice.`;
    case "stale_error":
      return `${summary} Latest refresh failed, so this page is keeping the last successful slice visible until retry succeeds.`;
    default:
      return summary;
  }
}

function buildSliceAvailabilityNote(sliceState: OverviewSliceState): string | null {
  switch (sliceState.status) {
    case "refreshing":
    case "stale_error":
      return sliceState.detail;
    default:
      return null;
  }
}

function renderMissingSliceDetailCard(
  title: string,
  description: string,
  sliceState: OverviewSliceState,
  onRetry: () => void,
  retryLabel: string,
) {
  return (
    <QueryStateDetailCard
      title={title}
      stateLabel={sliceState.stateLabel}
      detail={sliceState.detail}
      tone={sliceState.tone}
      onRetry={onRetry}
      retryLabel={retryLabel}
    >
      <p className="table-note">{description}</p>
    </QueryStateDetailCard>
  );
}

export function OverviewView() {
  const refreshInFlightRef = useRef(false);
  const devicesQuery = useDevicesQuery();
  const devicesSettled = devicesQuery.data !== null || devicesQuery.error !== null;
  const topologyQuery = useTopologyQuery(devicesSettled);
  const topologySettled = topologyQuery.data !== null || topologyQuery.error !== null;
  const policiesQuery = usePoliciesQuery(topologySettled);
  const policiesSettled = policiesQuery.data !== null || policiesQuery.error !== null;
  const platformQuery = usePlatformStatusQuery(policiesSettled);
  const capabilitiesQuery = useCapabilitiesQuery();

  const reloadAllSlices = useCallback(async () => {
    if (refreshInFlightRef.current) {
      return;
    }

    refreshInFlightRef.current = true;

    try {
      await reloadOverviewSlicesSequentially([
        devicesQuery,
        topologyQuery,
        policiesQuery,
        platformQuery,
        capabilitiesQuery,
      ]);
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [
    capabilitiesQuery.reload,
    devicesQuery.reload,
    platformQuery.reload,
    policiesQuery.reload,
    topologyQuery.reload,
  ]);

  const overviewSlices = [
    {
      label: "Platform status",
      data: platformQuery.data,
      error: platformQuery.error,
      isLoading: platformQuery.isLoading,
      isRefreshing: platformQuery.isRefreshing,
      reload: platformQuery.reload,
      retryLabel: "Retry platform status",
    },
    {
      label: "Devices",
      data: devicesQuery.data,
      error: devicesQuery.error,
      isLoading: devicesQuery.isLoading,
      isRefreshing: devicesQuery.isRefreshing,
      reload: devicesQuery.reload,
      retryLabel: "Retry devices",
    },
    {
      label: "Topology",
      data: topologyQuery.data,
      error: topologyQuery.error,
      isLoading: topologyQuery.isLoading,
      isRefreshing: topologyQuery.isRefreshing,
      reload: topologyQuery.reload,
      retryLabel: "Retry topology",
    },
    {
      label: "Policies",
      data: policiesQuery.data,
      error: policiesQuery.error,
      isLoading: policiesQuery.isLoading,
      isRefreshing: policiesQuery.isRefreshing,
      reload: policiesQuery.reload,
      retryLabel: "Retry policies",
    },
    {
      label: "Capabilities",
      data: capabilitiesQuery.data,
      error: capabilitiesQuery.error,
      isLoading: capabilitiesQuery.isLoading,
      isRefreshing: capabilitiesQuery.isRefreshing,
      reload: capabilitiesQuery.reload,
      retryLabel: "Retry capabilities",
    },
  ] as const;

  useEffect(() => {
    const refreshTimer = window.setInterval(() => {
      void reloadAllSlices();
    }, 60000);

    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [reloadAllSlices]);

  const overviewState = buildOverviewRenderState(
    overviewSlices.map((slice) => ({
      label: slice.label,
      data: slice.data as object | null,
      error: slice.error,
      isLoading: slice.isLoading,
      isRefreshing: slice.isRefreshing,
    })),
    overviewSlices.every((slice) => slice.data !== null),
  );
  const overviewSliceStateByLabel = new Map(
    overviewState.slices.map((sliceState) => [sliceState.label, sliceState] as const),
  );
  const platformSliceState = overviewSliceStateByLabel.get("Platform status")!;
  const devicesSliceState = overviewSliceStateByLabel.get("Devices")!;
  const topologySliceState = overviewSliceStateByLabel.get("Topology")!;
  const policiesSliceState = overviewSliceStateByLabel.get("Policies")!;
  const capabilitiesSliceState = overviewSliceStateByLabel.get("Capabilities")!;
  const readySliceCount = overviewState.slices.filter((slice) => slice.hasData).length;
  const missingSliceCount = overviewState.slices.filter((slice) => !slice.hasData).length;
  const impairedSliceCount = overviewState.slices.filter((slice) => slice.status !== "ready").length;
  const showPartialWarning = overviewState.slices.some((slice) =>
    ["error", "stale_error", "waiting"].includes(slice.status),
  );

  if (overviewState.mode === "loading") {
    return (
      <section>
        <h2>Overview</h2>
        <LoadingState label="Loading platform summary from the read-only backend APIs." />
      </section>
    );
  }

  if (overviewState.mode === "error" && overviewState.firstError) {
    return (
      <section>
        <h2>Overview</h2>
        <ErrorState
          error={overviewState.firstError}
          onRetry={reloadAllSlices}
        />
      </section>
    );
  }

  if (readySliceCount === 0) {
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

  const platformData = platformQuery.data;
  const devicesData = devicesQuery.data;
  const topologyData = topologyQuery.data;
  const policiesData = policiesQuery.data;
  const capabilitiesData = capabilitiesQuery.data;
  const observedComponentCount = platformData?.components.filter(
    (component) => component.observation_state !== "not_checked",
  ).length ?? 0;
  const degradedComponentCount = platformData?.components.filter((component) =>
    ["degraded", "unreachable", "unknown"].includes(component.observation_state),
  ).length ?? 0;
  const availableCoreSlices = [devicesData, topologyData, policiesData].filter(
    (
      slice,
    ): slice is
      | NonNullable<typeof devicesData>
      | NonNullable<typeof topologyData>
      | NonNullable<typeof policiesData> => slice !== null,
  );
  const liveBackedSliceCount = availableCoreSlices.filter(
    (slice) => slice.serving_mode === "live_collector",
  ).length;
  const fallbackOrBlockedSliceCount = availableCoreSlices.filter(
    (slice) =>
      slice.serving_mode !== "live_collector" ||
      slice.evidence_confidence.confidence_posture === "blocked",
  ).length;
  const anchorBackedSurfaceCount = [
    devicesData?.comparison_to_latest_persisted.comparison_snapshot_id,
    topologyData?.comparison_to_latest_persisted.comparison_snapshot_id,
    policiesData?.comparison_to_latest_persisted.comparison_snapshot_id,
    capabilitiesData?.readiness_snapshot_id,
  ].filter(Boolean).length;
  const staleSliceCount = availableCoreSlices.filter(
    (slice) => slice.evidence_confidence.freshness_posture === "stale",
  ).length;
  const readPaths = platformData?.read_paths ?? [];
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
  const topologyCoverageSummary = topologyData ? getTopologyCoverageSummary(topologyData) : null;
  const topologyCoverageReadout = topologyCoverageSummary
    ? describeTopologyCoveragePosture(
        topologyCoverageSummary,
        topologyData?.topology.links.length ?? 0,
      )
    : null;
  const topologyInferenceReadout = topologyCoverageSummary
    ? describeTopologyInferencePosture(topologyCoverageSummary, topologyData?.topology.links.length ?? 0)
    : null;
  const topologyCollectionReadout = topologyCoverageSummary
    ? describeTopologyCollectionPosture(topologyCoverageSummary)
    : null;
  const topologyReadPathPairing = describeTopologyReadPathPairing(topologyReadPath);
  const topologyReadPathInference = describeTopologyReadPathInference(topologyReadPath);
  const topologyReadPathCollection = describeTopologyReadPathCollection(topologyReadPath);
  const topologyReadPathNodeParticipation = describeTopologyReadPathNodeParticipation(topologyReadPath);
  const readiness = normalizeDryRunReadiness(capabilitiesData?.dry_run_readiness);
  const readinessIdentity = summarizeReadinessItemIdentitySupport(readiness);
  const degradedPolicyCount = policiesData
    ? countBy(policiesData.items, (policy) => policy.health_state).degraded ?? 0
    : 0;
  const degradedTopologyNodeCount = topologyData
    ? countBy(topologyData.topology.nodes, (node) => node.state).degraded ?? 0
    : 0;
  const interpretationNotes = [
    ...(topologyData?.topology.notes ?? []),
    ...(policiesData?.items.flatMap((policy) => policy.notes).slice(0, 2) ?? []),
  ];

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
        <StatusPill value={platformData?.status ?? (showPartialWarning ? "degraded" : "unknown")} />
      </div>

      {overviewState.mode === "partial" && showPartialWarning ? (
        <div className="query-message query-message-error">
          <strong>Overview is currently partial</strong>
          <div>
            <p>
              {missingSliceCount > 0
                ? `${readySliceCount} of ${overviewState.slices.length} summary slices are currently renderable. Missing slices stay explicit here instead of blanking the page.`
                : `All overview slices still render, but ${impairedSliceCount} slice${impairedSliceCount === 1 ? " is" : "s are"} refreshing or showing last successful data after a failed refresh.`}
            </p>
            {overviewState.firstError ? <p>{overviewState.firstError.message}</p> : null}
            <button type="button" className="inline-action" onClick={() => void reloadAllSlices()}>
              Retry all slices
            </button>
          </div>
        </div>
      ) : null}

      {platformData || devicesData || topologyData || policiesData || capabilitiesData ? (
        <div className="metadata-row">
          {platformData ? <span>Platform generated: {formatDateTime(platformData.generated_at)}</span> : null}
          {devicesData ? <span>Devices generated: {formatDateTime(devicesData.generated_at)}</span> : null}
          {topologyData ? <span>Topology generated: {formatDateTime(topologyData.generated_at)}</span> : null}
          {policiesData ? <span>Policies generated: {formatDateTime(policiesData.generated_at)}</span> : null}
          {capabilitiesData ? <span>Capabilities generated: {formatDateTime(capabilitiesData.generated_at)}</span> : null}
        </div>
      ) : null}

      <p className="callout">
        Routine-use trust cues stay explicit here: {liveBackedSliceCount} of {availableCoreSlices.length} currently available core read-side
        slice{liveBackedSliceCount === 1 ? " is" : "slices are"} live-backed,
        {" "}
        {fallbackOrBlockedSliceCount} slice
        {fallbackOrBlockedSliceCount === 1 ? " remains" : "s remain"} fallback or blocked,
        and {anchorBackedSurfaceCount} surface
        {anchorBackedSurfaceCount === 1 ? " currently exposes" : "s currently expose"}{" "}
        a persisted anchor for bounded comparison or readiness support. Bounded collector-to-backend
        coverage is currently visible
        {platformData
          ? ` for ${okReadPathCount} of ${readPaths.length} exposed read paths, with ${coverageWindowCount} freshness window${coverageWindowCount === 1 ? "" : "s"} and ${degradedReadPathCount} read path${degradedReadPathCount === 1 ? " needing" : "s needing"} closer interpretation.`
          : " only where the platform-status slice is available; read-path coverage cues are temporarily absent while that slice reloads."}
        {availableCoreSlices.length < 3
          ? ` ${3 - availableCoreSlices.length} core slice${3 - availableCoreSlices.length === 1 ? " is" : "s are"} currently unavailable and called out separately below.`
          : ""}
      </p>

      <div className="summary-grid">
        {platformData ? (
          <article className="summary-card">
            <p className="summary-label">Declared platform components</p>
            <strong>{platformData.components.length}</strong>
            <p>{platformData.summary}</p>
            {buildSliceAvailabilityNote(platformSliceState) ? (
              <p className="table-note">{buildSliceAvailabilityNote(platformSliceState)}</p>
            ) : null}
          </article>
        ) : (
          <QueryStateSummaryCard
            title="Declared platform components"
            stateLabel={platformSliceState.stateLabel}
            detail={platformSliceState.detail}
            tone={platformSliceState.tone}
            onRetry={platformQuery.reload}
            retryLabel="Retry platform status"
          />
        )}
        {devicesData ? (
          <article className="summary-card">
            <p className="summary-label">Device inventory</p>
            <strong>{devicesData.count}</strong>
            <p>{formatLabel(devicesData.data_status)}</p>
            {buildSliceAvailabilityNote(devicesSliceState) ? (
              <p className="table-note">{buildSliceAvailabilityNote(devicesSliceState)}</p>
            ) : null}
          </article>
        ) : (
          <QueryStateSummaryCard
            title="Device inventory"
            stateLabel={devicesSliceState.stateLabel}
            detail={devicesSliceState.detail}
            tone={devicesSliceState.tone}
            onRetry={devicesQuery.reload}
            retryLabel="Retry devices"
          />
        )}
        {topologyData && topologyCoverageReadout && topologyInferenceReadout && topologyCollectionReadout ? (
          <article className="summary-card">
            <p className="summary-label">Topology coverage</p>
            <strong>{topologyCoverageReadout.label}</strong>
            <p>
              {topologyInferenceReadout.label} • {topologyCollectionReadout.label} • {topologyReadPathNodeParticipation.label} • {topologyReadPathNodeParticipation.countDetail}
            </p>
            {buildSliceAvailabilityNote(topologySliceState) ? (
              <p className="table-note">{buildSliceAvailabilityNote(topologySliceState)}</p>
            ) : null}
          </article>
        ) : (
          <QueryStateSummaryCard
            title="Topology coverage"
            stateLabel={topologySliceState.stateLabel}
            detail={topologySliceState.detail}
            tone={topologySliceState.tone}
            onRetry={topologyQuery.reload}
            retryLabel="Retry topology"
          />
        )}
        {policiesData ? (
          <article className="summary-card">
            <p className="summary-label">Policy inventory</p>
            <strong>{policiesData.observed_policy_count}</strong>
            <p>
              Observed policies • Detailed records: {policiesData.count} • {formatLabel(policiesData.data_status)}
            </p>
            {buildSliceAvailabilityNote(policiesSliceState) ? (
              <p className="table-note">{buildSliceAvailabilityNote(policiesSliceState)}</p>
            ) : null}
          </article>
        ) : (
          <QueryStateSummaryCard
            title="Policy inventory"
            stateLabel={policiesSliceState.stateLabel}
            detail={policiesSliceState.detail}
            tone={policiesSliceState.tone}
            onRetry={policiesQuery.reload}
            retryLabel="Retry policies"
          />
        )}
        {capabilitiesData ? (
          <article className="summary-card">
            <p className="summary-label">Capabilities</p>
            <strong>{capabilitiesData.count}</strong>
            <p>{formatLabel(capabilitiesData.data_status)}</p>
            {buildSliceAvailabilityNote(capabilitiesSliceState) ? (
              <p className="table-note">{buildSliceAvailabilityNote(capabilitiesSliceState)}</p>
            ) : null}
          </article>
        ) : (
          <QueryStateSummaryCard
            title="Capabilities"
            stateLabel={capabilitiesSliceState.stateLabel}
            detail={capabilitiesSliceState.detail}
            tone={capabilitiesSliceState.tone}
            onRetry={capabilitiesQuery.reload}
            retryLabel="Retry capabilities"
          />
        )}
        {topologyData || policiesData ? (
          <article className="summary-card">
            <p className="summary-label">Immediate attention</p>
            <strong>{degradedPolicyCount + degradedTopologyNodeCount}</strong>
            <p>
              Degraded policy or topology items visible in currently available product views.
            </p>
          </article>
        ) : (
          <QueryStateSummaryCard
            title="Immediate attention"
            stateLabel="Unavailable"
            detail="Topology and policy slices are both unavailable, so overview cannot summarize immediate attention counts yet."
            tone="warn"
            onRetry={() => void reloadAllSlices()}
            retryLabel="Retry all slices"
          />
        )}
        <article className="summary-card">
          <p className="summary-label">Live-Backed Slices</p>
          <strong>{liveBackedSliceCount}</strong>
          <p>
            Devices, topology, and policies currently served from live collector-backed paths across the available core slices.
          </p>
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
        {platformData ? (
          <article className="summary-card">
            <p className="summary-label">Read-Path Coverage</p>
            <strong>
              {totalObservedTargets}/{totalConfiguredTargets || 0}
            </strong>
            <p>Configured target coverage currently summarized by the platform-status contract.</p>
            {buildSliceAvailabilityNote(platformSliceState) ? (
              <p className="table-note">{buildSliceAvailabilityNote(platformSliceState)}</p>
            ) : null}
          </article>
        ) : (
          <QueryStateSummaryCard
            title="Read-Path Coverage"
            stateLabel={platformSliceState.stateLabel}
            detail="Platform-status read-path coverage is unavailable until the platform slice reloads."
            tone={platformSliceState.tone}
            onRetry={platformQuery.reload}
            retryLabel="Retry platform status"
          />
        )}
        {platformData ? (
          <article className="summary-card">
            <p className="summary-label">Read-Path Attention</p>
            <strong>{degradedReadPathCount}</strong>
            <p>Collector-backed model families currently reporting degraded or incomplete scope.</p>
            {buildSliceAvailabilityNote(platformSliceState) ? (
              <p className="table-note">{buildSliceAvailabilityNote(platformSliceState)}</p>
            ) : null}
          </article>
        ) : (
          <QueryStateSummaryCard
            title="Read-Path Attention"
            stateLabel={platformSliceState.stateLabel}
            detail="Overview cannot summarize read-path attention while the platform-status slice is unavailable."
            tone={platformSliceState.tone}
            onRetry={platformQuery.reload}
            retryLabel="Retry platform status"
          />
        )}
      </div>

      <div className="content-grid">
        {platformData ? (
          <article className="detail-card">
            <h3>Platform status</h3>
            <p>{buildSliceAvailabilitySummary(platformData.summary, platformSliceState)}</p>
            <ul className="compact-list">
              {platformData.components.map((component) => (
                <li key={component.name}>
                  <span>{component.name}</span>
                  <StatusPill value={component.observation_state} />
                </li>
              ))}
            </ul>
          </article>
        ) : (
          renderMissingSliceDetailCard(
            "Platform status",
            "Platform summary and read-path coverage stay unavailable until this slice reloads.",
            platformSliceState,
            platformQuery.reload,
            "Retry platform status",
          )
        )}

        {devicesData ? (
          <TrustCueCard
            title="Devices Trust Cues"
            summary={buildSliceAvailabilitySummary(
              "Routine device use depends on whether inventory is live-backed, stale, or fallback-served, plus the bounded collector coverage and freshness window the platform-status contract now carries for inventory.",
              devicesSliceState,
            )}
            rows={[
              {
                label: "Serving mode",
                kind: "status",
                value: devicesData.serving_mode,
                note: [devicesData.summary, inventoryReadPath?.summary ?? "Inventory read-path coverage is not exposed by the current platform-status response."],
              },
              {
                label: "Freshness posture",
                kind: "status",
                value: devicesData.evidence_confidence.freshness_posture,
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
                value: devicesData.evidence_confidence.evidence_kind,
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
                value: devicesData.comparison_to_latest_persisted.comparison_snapshot_id,
                emptyLabel: "No comparison anchor exposed",
              },
              {
                label: "Served persisted at",
                kind: "text",
                value: formatDateTime(devicesData.served_persisted_at),
                note: buildSliceAvailabilityNote(devicesSliceState) ?? undefined,
              },
            ]}
          />
        ) : (
          renderMissingSliceDetailCard(
            "Devices Trust Cues",
            "Inventory trust cues are temporarily unavailable, but the rest of the overview remains usable where slices loaded.",
            devicesSliceState,
            devicesQuery.reload,
            "Retry devices",
          )
        )}

        {topologyData && topologyCoverageReadout && topologyInferenceReadout && topologyCollectionReadout ? (
          <TrustCueCard
            title="Topology Trust Cues"
            summary={buildSliceAvailabilitySummary(
              "Topology routine use depends on live-versus-fallback serving, partial completeness, backend-owned inference posture, endpoint-pairing posture, collection posture, and the bounded target coverage and freshness posture now exposed for the topology read path.",
              topologySliceState,
            )}
            rows={[
              {
                label: "Serving mode",
                kind: "status",
                value: topologyData.serving_mode,
                note: [topologyData.summary, topologyReadPath?.summary ?? "Topology read-path coverage is not exposed by the current platform-status response."],
              },
              {
                label: "Freshness posture",
                kind: "status",
                value: topologyData.evidence_confidence.freshness_posture,
              },
              {
                label: "Inference posture",
                kind: "status",
                value: topologyReadPathInference.status,
                note: topologyInferenceReadout.detail,
              },
              {
                label: "Endpoint pairing",
                kind: "status",
                value: topologyReadPathPairing.status,
                note: [topologyCoverageReadout.detail, topologyCoverageReadout.countDetail],
              },
              {
                label: "Collection posture",
                kind: "status",
                value: topologyReadPathCollection.status,
                note: topologyCollectionReadout.detail,
              },
              {
                label: "Node participation",
                kind: "status",
                value: topologyReadPathNodeParticipation.status,
                note: [
                  topologyReadPathNodeParticipation.detail,
                  topologyReadPathNodeParticipation.countDetail,
                ],
              },
              {
                label: "Target coverage",
                kind: "text",
                value: formatReadPathCoverage(topologyReadPath),
              },
              {
                label: "Collection counts",
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
                value: topologyData.evidence_confidence.evidence_kind,
              },
              {
                label: "Completeness",
                kind: "status",
                value: topologyData.topology.completeness,
              },
              {
                label: "Degraded scope",
                kind: "status",
                value: topologyReadPath?.observation_state ?? "unknown",
                note: [
                  topologyReadPath?.degraded_scope_summary ?? "No topology degraded-scope summary is exposed.",
                  topologyReadPathInference.detail,
                  topologyReadPathCollection.detail,
                  topologyReadPathPairing.countDetail,
                  topologyReadPathNodeParticipation.countDetail,
                ],
              },
              {
                label: "Comparison anchor",
                kind: "anchor",
                value: topologyData.comparison_to_latest_persisted.comparison_snapshot_id,
                emptyLabel: "No comparison anchor exposed",
                note: buildSliceAvailabilityNote(topologySliceState) ?? undefined,
              },
            ]}
          />
        ) : (
          renderMissingSliceDetailCard(
            "Topology Trust Cues",
            "Topology trust cues stay explicit when present, but this slice is currently unavailable and needs its own retry path.",
            topologySliceState,
            topologyQuery.reload,
            "Retry topology",
          )
        )}

        {policiesData ? (
          <TrustCueCard
            title="Policies Trust Cues"
            summary={buildSliceAvailabilitySummary(
              "Policy routine use is grounded in serving mode, freshness posture, evidence kind, and the bounded coverage and detail-ready posture now exposed for the policy read path.",
              policiesSliceState,
            )}
            rows={[
              {
                label: "Serving mode",
                kind: "status",
                value: policiesData.serving_mode,
                note: [policiesData.summary, policyReadPath?.summary ?? "Policy read-path coverage is not exposed by the current platform-status response."],
              },
              {
                label: "Freshness posture",
                kind: "status",
                value: policiesData.evidence_confidence.freshness_posture,
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
                value: policiesData.evidence_confidence.evidence_kind,
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
                value: policiesData.empty_reason === "none" ? "ok" : policiesData.empty_reason,
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
                value: policiesData.comparison_to_latest_persisted.comparison_snapshot_id,
                emptyLabel: "No comparison anchor exposed",
                note: buildSliceAvailabilityNote(policiesSliceState) ?? undefined,
              },
            ]}
          />
        ) : (
          renderMissingSliceDetailCard(
            "Policies Trust Cues",
            "Policy trust cues are temporarily unavailable, but successful overview slices still remain visible above.",
            policiesSliceState,
            policiesQuery.reload,
            "Retry policies",
          )
        )}

        {capabilitiesData ? (
          <TrustCueCard
            title="Capabilities And Readiness Cues"
            summary={buildSliceAvailabilitySummary(
              "The capability matrix stays descriptive. The readiness surface uses the persisted snapshot anchor as the strongest trust cue, while child item identifiers may remain absent or mixed across backend versions and never imply workflow handles.",
              capabilitiesSliceState,
            )}
            rows={[
              {
                label: "Matrix status",
                kind: "status",
                value: capabilitiesData.data_status,
                note: capabilitiesData.summary,
              },
              {
                label: "Planning readiness",
                kind: "status",
                value: readiness.planning_readiness,
              },
              {
                label: "Readiness anchor",
                kind: "anchor",
                value: capabilitiesData.readiness_snapshot_id,
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
                value: formatDateTime(capabilitiesData.readiness_persisted_at ?? null),
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
                note: buildSliceAvailabilityNote(capabilitiesSliceState) ?? undefined,
              },
            ]}
          />
        ) : (
          renderMissingSliceDetailCard(
            "Capabilities And Readiness Cues",
            "Capability and readiness cues are temporarily unavailable until this slice reloads.",
            capabilitiesSliceState,
            capabilitiesQuery.reload,
            "Retry capabilities",
          )
        )}

        <article className="detail-card">
          <h3>What needs interpretation</h3>
          {interpretationNotes.length > 0 ? (
            <ul className="notes-list">
              {interpretationNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : (
            <p className="table-note">
              Currently available slices do not expose additional interpretation notes, or the note-bearing slices are unavailable.
            </p>
          )}
        </article>

        <article className="detail-card">
          <h3>Why this is in the product</h3>
          <p>
            These pages organize backend-owned inventory, topology, policy, and
            capability contracts into operator-readable views. Deep time-series
            troubleshooting still belongs in Grafana.
          </p>
          <p className="table-note">
            {platformData
              ? `Platform observation coverage: ${observedComponentCount} of ${platformData.components.length} declared components currently have a bounded live observation on the product-facing platform status surface, and ${degradedComponentCount} currently need closer review. Read-path coverage and degraded-scope summaries stay here as backend-owned product cues, while Grafana remains the place for numeric gap trends and scrape-oriented troubleshooting.`
              : "The platform-status slice is currently unavailable, so this page cannot summarize platform observation coverage right now. That absence stays explicit here instead of blanking the rest of the overview."}
          </p>
        </article>
      </div>
    </section>
  );
}
