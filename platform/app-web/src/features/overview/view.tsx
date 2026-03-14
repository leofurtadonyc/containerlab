import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import { TrustCueCard } from "../../components/trust-cue-card";
import { countBy, formatDateTime, formatLabel } from "../../lib/presentation";
import { normalizeDryRunReadiness, summarizeReadinessItemIdentitySupport } from "../../lib/readiness";
import { useCapabilitiesQuery } from "../capabilities/api";
import { useDevicesQuery } from "../devices/api";
import { usePlatformStatusQuery } from "../platform-health/api";
import { usePoliciesQuery } from "../policies/api";
import { useTopologyQuery } from "../topology/api";

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
        a persisted anchor for bounded comparison or readiness support.
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
          <strong>{topologyQuery.data.topology.nodes.length} nodes</strong>
          <p>{formatLabel(topologyQuery.data.topology.completeness)}</p>
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
          summary="Routine device use depends on whether inventory is live-backed, stale, or fallback-served, and whether a persisted comparison anchor is already available."
          rows={[
            {
              label: "Serving mode",
              kind: "status",
              value: devicesQuery.data.serving_mode,
              note: devicesQuery.data.summary,
            },
            {
              label: "Freshness posture",
              kind: "status",
              value: devicesQuery.data.evidence_confidence.freshness_posture,
            },
            {
              label: "Evidence basis",
              kind: "status",
              value: devicesQuery.data.evidence_confidence.evidence_kind,
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
          summary="Topology routine use depends on live-versus-fallback serving, partial completeness, and whether the page can point to a persisted comparison anchor for bounded context."
          rows={[
            {
              label: "Serving mode",
              kind: "status",
              value: topologyQuery.data.serving_mode,
              note: topologyQuery.data.summary,
            },
            {
              label: "Freshness posture",
              kind: "status",
              value: topologyQuery.data.evidence_confidence.freshness_posture,
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
              label: "Comparison anchor",
              kind: "anchor",
              value: topologyQuery.data.comparison_to_latest_persisted.comparison_snapshot_id,
              emptyLabel: "No comparison anchor exposed",
            },
          ]}
        />

        <TrustCueCard
          title="Policies Trust Cues"
          summary="Policy routine use is grounded in serving mode, freshness posture, evidence kind, and whether the current page can point to a bounded persisted comparison anchor."
          rows={[
            {
              label: "Serving mode",
              kind: "status",
              value: policiesQuery.data.serving_mode,
              note: policiesQuery.data.summary,
            },
            {
              label: "Freshness posture",
              kind: "status",
              value: policiesQuery.data.evidence_confidence.freshness_posture,
            },
            {
              label: "Evidence basis",
              kind: "status",
              value: policiesQuery.data.evidence_confidence.evidence_kind,
            },
            {
              label: "Current posture",
              kind: "status",
              value: policiesQuery.data.empty_reason === "none" ? "ok" : policiesQuery.data.empty_reason,
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
          </p>
        </article>
      </div>
    </section>
  );
}
