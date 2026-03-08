import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import { countBy, formatLabel } from "../../lib/presentation";
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

        <article className="detail-card">
          <h3>Read-only model posture</h3>
          <ul className="compact-list">
            <li>
              <span>Devices</span>
              <StatusPill value={devicesQuery.data.data_status} />
            </li>
            <li>
              <span>Topology</span>
              <StatusPill value={topologyQuery.data.topology.completeness} />
            </li>
            <li>
              <span>Policies</span>
              <StatusPill value={policiesQuery.data.data_status} />
            </li>
            <li>
              <span>Capabilities</span>
              <StatusPill value={capabilitiesQuery.data.data_status} />
            </li>
          </ul>
        </article>

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
        </article>
      </div>
    </section>
  );
}
