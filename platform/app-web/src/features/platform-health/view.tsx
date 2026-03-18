import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import { TrustCueCard } from "../../components/trust-cue-card";
import type { PoliciesListResponse, PlatformReadPathStatus } from "../../api/contracts";
import {
  countBy,
  describeTopologyReadPathNodeParticipation,
  describeTopologyReadPathCollection,
  describeTopologyReadPathInference,
  describeTopologyReadPathPairing,
  formatDateTime,
  formatLabel,
} from "../../lib/presentation";
import { usePoliciesQuery } from "../policies/api";
import { getPlatformReadPath, usePlatformStatusQuery } from "./api";

function formatReadPathCoverage(readPath: PlatformReadPathStatus): string {
  return `${readPath.observed_target_count} of ${readPath.configured_target_count} configured targets`;
}

function formatReadPathCollection(readPath: PlatformReadPathStatus): string {
  return `success ${readPath.collection_success_count} • partial ${readPath.collection_partial_count} • failed ${readPath.collection_failure_count}`;
}

function formatReadPathFreshness(readPath: PlatformReadPathStatus): string {
  if (!readPath.oldest_observed_at || !readPath.newest_observed_at) {
    return "Not exposed";
  }

  return `${formatDateTime(readPath.oldest_observed_at)} -> ${formatDateTime(readPath.newest_observed_at)}`;
}

function buildPolicyDetailReadinessReadout(readPath: PlatformReadPathStatus | null): {
  label: string;
  detail: string;
  blockedTargetCount: number;
} {
  if (
    !readPath ||
    readPath.policy_capable_target_count === null ||
    readPath.detail_ready_target_count === null
  ) {
    return {
      label: "Not exposed",
      detail:
        "Platform status does not currently expose policy detail-readiness counts on this response.",
      blockedTargetCount: 0,
    };
  }

  const blockedTargetCount = Math.max(
    readPath.policy_capable_target_count - readPath.detail_ready_target_count,
    0,
  );

  if (readPath.policy_capable_target_count === 0) {
    return {
      label: "0/0",
      detail: "No policy-capable targets are currently exposed on the bounded policy read path.",
      blockedTargetCount,
    };
  }

  if (blockedTargetCount === 0) {
    return {
      label: `${readPath.detail_ready_target_count}/${readPath.policy_capable_target_count}`,
      detail:
        "All currently exposed policy-capable targets are detail-ready on the bounded policy read path.",
      blockedTargetCount,
    };
  }

  return {
    label: `${readPath.detail_ready_target_count}/${readPath.policy_capable_target_count}`,
    detail:
      `${blockedTargetCount} policy-capable targets remain blocked to aggregate-only or partial policy detail on the current read path. See the Policies page for per-target blocker reasons.`,
    blockedTargetCount,
  };
}

function buildPolicySourceReadinessReadout(
  policiesData: PoliciesListResponse | null | undefined,
  isLoading: boolean,
  hasError: boolean,
  detailReadyTargetCount: number,
): { label: string; detail: string } {
  if (isLoading) {
    return {
      label: "Loading",
      detail: "The supporting Policies query is still loading the backend-owned source-readiness cue.",
    };
  }

  if (hasError || !policiesData) {
    return {
      label: "Unavailable",
      detail:
        "Platform Health could not load the supporting Policies response, so source-readiness posture is not summarized here.",
    };
  }

  const readiness = policiesData.detail_source_readiness;
  const sourceVisibleTargetCount =
    detailReadyTargetCount +
    readiness.no_policies_observed_target_count +
    readiness.detail_unavailable_target_count +
    readiness.partial_detail_target_count;

  switch (readiness.posture) {
    case "ready":
      return {
        label: "Ready",
        detail:
          "All current source-visible policy targets are detail-ready. See the Policies page for per-target evidence.",
      };
    case "no_policies_observed":
      return {
        label: "Live-empty",
        detail:
          `${readiness.no_policies_observed_target_count} of ${sourceVisibleTargetCount} source-visible targets are currently healthy but live-empty on the bounded policy slice.`,
      };
    case "source_detail_unavailable":
      return {
        label: "Detail unavailable",
        detail:
          `${readiness.detail_unavailable_target_count} of ${sourceVisibleTargetCount} source-visible targets currently observe policy presence without bounded per-policy detail.`,
      };
    case "partially_ready":
      return {
        label: "Partially ready",
        detail:
          `${detailReadyTargetCount} of ${sourceVisibleTargetCount} source-visible targets are detail-ready; the rest remain live-empty, detail-unavailable, or partially covered. See the Policies page for the richer breakdown.`,
      };
    default:
      return {
        label: "Not exposed",
        detail:
          "The supporting Policies response did not expose a bounded source-readiness posture on this page load.",
      };
  }
}

export function PlatformHealthView() {
  const { data, error, isLoading, reload } = usePlatformStatusQuery();
  const {
    data: policiesData,
    error: policiesError,
    isLoading: isPoliciesLoading,
  } = usePoliciesQuery();

  if (isLoading) {
    return (
      <section>
        <h2>Platform Health</h2>
        <LoadingState label="Loading product-facing platform status." />
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2>Platform Health</h2>
        <ErrorState error={error} onRetry={reload} />
      </section>
    );
  }

  if (!data) {
    return (
      <section>
        <h2>Platform Health</h2>
        <EmptyState
          title="No platform status"
          description="The backend did not return a platform status response."
        />
      </section>
    );
  }

  const observedCount = data.components.filter(
    (component) => component.observation_state !== "not_checked",
  ).length;
  const degradedCount = data.components.filter((component) =>
    ["degraded", "unreachable", "unknown"].includes(component.observation_state),
  ).length;
  const notCheckedCount = data.components.filter(
    (component) => component.observation_state === "not_checked",
  ).length;
  const probeBackedCount = data.components.filter(
    (component) => component.observation_source !== null,
  ).length;
  const observationSourceCounts = countBy(
    data.components.filter((component) => component.observation_source !== null),
    (component) => component.observation_source ?? "not_checked",
  );
  const observationSourceSummary =
    Object.entries(observationSourceCounts)
      .map(([source, count]) => `${formatLabel(source)}: ${count}`)
      .join(" • ") || "No bounded observation source is currently exposed on this page.";
  const readPaths = data.read_paths ?? [];
  const okReadPathCount = readPaths.filter((readPath) => readPath.observation_state === "ok").length;
  const degradedReadPathCount = readPaths.filter(
    (readPath) => readPath.observation_state !== "ok",
  ).length;
  const totalObservedTargets = readPaths.reduce(
    (sum, readPath) => sum + readPath.observed_target_count,
    0,
  );
  const totalConfiguredTargets = readPaths.reduce(
    (sum, readPath) => sum + readPath.configured_target_count,
    0,
  );
  const freshnessWindowCount = readPaths.filter(
    (readPath) => readPath.oldest_observed_at && readPath.newest_observed_at,
  ).length;
  const topologyReadPath = getPlatformReadPath(readPaths, "topology");
  const policyReadPath = getPlatformReadPath(readPaths, "policy");
  const topologyInferenceReadout = describeTopologyReadPathInference(topologyReadPath);
  const topologyCollectionReadout = describeTopologyReadPathCollection(topologyReadPath);
  const topologyPairingReadout = describeTopologyReadPathPairing(topologyReadPath);
  const topologyNodeParticipationReadout = describeTopologyReadPathNodeParticipation(topologyReadPath);
  const policyDetailReadiness = buildPolicyDetailReadinessReadout(policyReadPath);
  const policySourceReadiness = buildPolicySourceReadinessReadout(
    policiesData,
    isPoliciesLoading,
    policiesError !== null,
    policyReadPath?.detail_ready_target_count ?? 0,
  );

  return (
    <section>
      <div className="section-header">
        <div>
          <h2>Platform Health</h2>
          <p>
            This page stays product-oriented. It summarizes declared platform
            components, bounded collector-to-backend read-path posture, and current
            API-level status without duplicating Grafana's deeper metrics views.
          </p>
        </div>
        <StatusPill value={data.status} />
      </div>

      <div className="metadata-row">
        <span>Topology: {data.topology_name}</span>
        <span>Generated: {formatDateTime(data.generated_at)}</span>
        <span>Observed components: {observedCount}</span>
        <span>Not checked: {notCheckedCount}</span>
        <span>Read paths: {readPaths.length}</span>
      </div>

      <p className="callout">{data.summary}</p>

      <div className="callout">
        <strong>Observation scope remains explicit</strong>
        <p>
          This page summarizes declared platform components, bounded collector-to-backend read-path
          coverage, and one bounded controller-helper probe. It does not claim persisted snapshot
          anchors, fallback serving, or full dependency health coverage for every service.
        </p>
        <p className="table-note">
          Persisted readiness anchors and any readiness child-item identity cues belong on the
          Readiness page, not on this bounded current-status surface.
        </p>
      </div>

      {policyDetailReadiness.blockedTargetCount > 0 ? (
        <div className="callout">
          <strong>Policy detail blockers remain explicit</strong>
          <p>{policyDetailReadiness.detail}</p>
          <p className="table-note">{policySourceReadiness.detail}</p>
        </div>
      ) : null}

      <div className="summary-grid">
        <article className="summary-card">
          <p className="summary-label">Declared Components</p>
          <strong>{data.components.length}</strong>
          <p>Platform services represented in the current topology contract.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Observed Components</p>
          <strong>{observedCount}</strong>
          <p>Components with a bounded live observation on this product page.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Degraded Observations</p>
          <strong>{degradedCount}</strong>
          <p>Live checks that currently need operator attention.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Not Checked</p>
          <strong>{notCheckedCount}</strong>
          <p>Declared services that this bounded page does not yet probe directly.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Probe-Backed</p>
          <strong>{probeBackedCount}</strong>
          <p>Components with a concrete bounded observation source on this page.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Read Paths OK</p>
          <strong>
            {okReadPathCount}/{readPaths.length}
          </strong>
          <p>Collector-backed model families currently reporting usable bounded coverage.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Read-Path Coverage</p>
          <strong>
            {totalObservedTargets}/{totalConfiguredTargets || 0}
          </strong>
          <p>Observed versus configured targets across the exposed inventory, topology, and policy paths.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Freshness Windows</p>
          <strong>{freshnessWindowCount}</strong>
          <p>Read paths currently exposing bounded oldest-to-newest observation timestamps.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Observation Sources</p>
          <strong>{Object.keys(observationSourceCounts).length}</strong>
          <p>Distinct bounded observation-source families currently exposed in product status.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Topology Node Participation</p>
          <strong>{topologyNodeParticipationReadout.label}</strong>
          <p>{topologyNodeParticipationReadout.countDetail}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Policy Detail Readiness</p>
          <strong>{policyDetailReadiness.label}</strong>
          <p>{policyDetailReadiness.detail}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Policy Source Readiness</p>
          <strong>{policySourceReadiness.label}</strong>
          <p>{policySourceReadiness.detail}</p>
        </article>
      </div>

      <div className="content-grid">
        <TrustCueCard
          title="Routine-Use Trust Cues"
          summary="Platform Health is a current API response rather than an anchored history surface, so the key cues are freshness, observation coverage, read-path scope, topology endpoint pairing posture, topology node participation posture, and how much of the page is probe-backed versus declared-only."
          rows={[
            {
              label: "API freshness",
              kind: "text",
              value: formatDateTime(data.generated_at),
            },
            {
              label: "Serving posture",
              kind: "text",
              value: "Live platform-status API",
              note: "This page is generated on demand from app-api rather than served from a persisted fallback snapshot.",
            },
            {
              label: "Observation coverage",
              kind: "text",
              value: `${observedCount} of ${data.components.length} declared components`,
            },
            {
              label: "Read-path coverage",
              kind: "text",
              value: `${totalObservedTargets} of ${totalConfiguredTargets || 0} configured targets`,
              note:
                readPaths.length > 0
                  ? readPaths.map(
                      (readPath) =>
                        readPath.model_family === "policy"
                          ? `${formatLabel(readPath.model_family)}: ${formatReadPathCoverage(readPath)} • ${buildPolicyDetailReadinessReadout(readPath).detail} • ${policySourceReadiness.detail}`
                          : `${formatLabel(readPath.model_family)}: ${formatReadPathCoverage(readPath)}`,
                    )
                  : "No bounded read-path summaries are currently exposed.",
            },
            {
              label: "Topology inference",
              kind: "status",
              value: topologyInferenceReadout.status,
              note: topologyInferenceReadout.detail,
            },
            {
              label: "Topology endpoint pairing",
              kind: "status",
              value: topologyPairingReadout.status,
              note: [topologyPairingReadout.detail, topologyPairingReadout.countDetail],
            },
            {
              label: "Topology node participation",
              kind: "status",
              value: topologyNodeParticipationReadout.status,
              note: [
                topologyNodeParticipationReadout.detail,
                topologyNodeParticipationReadout.countDetail,
              ],
            },
            {
              label: "Topology collection posture",
              kind: "status",
              value: topologyCollectionReadout.status,
              note: topologyCollectionReadout.detail,
            },
            {
              label: "Freshness windows",
              kind: "text",
              value: `${freshnessWindowCount} exposed`,
              note:
                readPaths.length > 0
                  ? readPaths.map(
                      (readPath) =>
                        `${formatLabel(readPath.model_family)}: ${formatReadPathFreshness(readPath)}`,
                    )
                  : undefined,
            },
            {
              label: "Anchor posture",
              kind: "anchor",
              value: null,
              emptyLabel: "Not exposed on this page",
              note: "Platform status does not currently expose a persisted snapshot identifier because this page is a bounded current-status surface rather than a persisted readiness or history view.",
            },
            {
              label: "Readiness identity cues",
              kind: "text",
              value: "See Readiness page",
              note: "Readiness snapshot anchors and any per-item readiness identifiers are intentionally kept with the readiness-support contract instead of this platform-status view.",
            },
            {
              label: "Degraded scope",
              kind: "status",
              value: degradedCount > 0 || degradedReadPathCount > 0 ? "degraded" : "ok",
              note:
                degradedReadPathCount > 0
                  ? readPaths
                      .filter((readPath) => readPath.observation_state !== "ok")
                      .map(
                        (readPath) =>
                          `${formatLabel(readPath.model_family)}: ${readPath.degraded_scope_summary}`,
                      )
                  : "No exposed read path currently reports degraded bounded scope.",
            },
          ]}
        />

        <TrustCueCard
          title="Observation Basis"
          summary="Current evidence on this page comes from declared component inventory plus the bounded observation sources and read-path summaries the backend can complete without turning Platform Health into a full dependency-monitoring system."
          rows={[
            {
              label: "Probe-backed components",
              kind: "text",
              value: `${probeBackedCount}`,
            },
            {
              label: "Declared-only components",
              kind: "text",
              value: `${notCheckedCount}`,
            },
            {
              label: "Observation sources",
              kind: "text",
              value: observationSourceSummary,
            },
            {
              label: "Read-path posture",
              kind: "text",
              value: `${okReadPathCount} ok • ${degradedReadPathCount} degraded`,
              note:
                readPaths.length > 0
                  ? readPaths.map(
                      (readPath) =>
                        readPath.model_family === "topology"
                          ? `${formatLabel(readPath.model_family)}: ${topologyInferenceReadout.label} • ${topologyCollectionReadout.label} • ${topologyNodeParticipationReadout.label} • ${formatReadPathCollection(readPath)} • ${topologyPairingReadout.countDetail} • ${topologyNodeParticipationReadout.countDetail}`
                          : readPath.model_family === "policy"
                            ? `${formatLabel(readPath.model_family)}: ${formatReadPathCollection(readPath)} • ${buildPolicyDetailReadinessReadout(readPath).detail}`
                          : `${formatLabel(readPath.model_family)}: ${formatReadPathCollection(readPath)}`,
                    )
                  : "No bounded read-path summaries are currently exposed.",
            },
            {
              label: "Status baseline",
              kind: "status",
              value: data.status,
            },
          ]}
        />
      </div>

      <div className="table-card">
        <h3>Bounded Read-Path Coverage</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Read Path</th>
              <th>Observation</th>
              <th>Coverage</th>
              <th>Collection</th>
              <th>Freshness</th>
              <th>Degraded Scope</th>
            </tr>
          </thead>
          <tbody>
            {readPaths.length > 0 ? (
              readPaths.map((readPath) => (
                <tr key={readPath.model_family}>
                  <td>
                    <strong>{formatLabel(readPath.model_family)}</strong>
                    <p className="table-note">{readPath.summary}</p>
                  </td>
                  <td>
                    <StatusPill value={readPath.observation_state} />
                  </td>
                  <td>{formatReadPathCoverage(readPath)}</td>
                  <td>{formatReadPathCollection(readPath)}</td>
                  <td>{formatReadPathFreshness(readPath)}</td>
                  <td>
                    <p className="table-note">{readPath.degraded_scope_summary}</p>
                    {readPath.model_family === "topology" ? (
                      <p className="table-note">
                        {topologyInferenceReadout.detail} {topologyCollectionReadout.detail} {topologyPairingReadout.detail} {topologyPairingReadout.countDetail} {topologyNodeParticipationReadout.detail} {topologyNodeParticipationReadout.countDetail}
                      </p>
                    ) : null}
                    {readPath.model_family === "policy" ? (
                      <p className="table-note">{buildPolicyDetailReadinessReadout(readPath).detail}</p>
                    ) : null}
                    {readPath.notes.length > 0 ? (
                      <ul className="notes-list">
                        {readPath.notes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    ) : null}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <span className="meta-copy">
                    No bounded read-path summaries are currently exposed by the platform-status response.
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Role</th>
              <th>Lifecycle</th>
              <th>Observation</th>
              <th>Observed Source</th>
              <th>Observation Detail</th>
            </tr>
          </thead>
          <tbody>
            {data.components.map((component) => (
              <tr key={component.name}>
                <td>{component.name}</td>
                <td>{component.role}</td>
                <td>
                  <StatusPill value={component.lifecycle_state} />
                </td>
                <td>
                  <StatusPill value={component.observation_state} />
                </td>
                <td>{component.observation_source ?? "Not checked"}</td>
                <td>
                  {component.observation_summary ? (
                    <div>
                      <p className="table-note">{component.observation_summary}</p>
                      {component.observed_capabilities.length > 0 ? (
                        <p className="table-note">
                          Capabilities:{" "}
                          {component.observed_capabilities
                            .join(", ")
                            .split("_")
                            .join(" ")}
                        </p>
                      ) : null}
                      {component.notes.length > 0 ? (
                        <ul className="notes-list">
                          {component.notes.map((note) => (
                            <li key={note}>{note}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : (
                    <span className="meta-copy">No live observation yet.</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
