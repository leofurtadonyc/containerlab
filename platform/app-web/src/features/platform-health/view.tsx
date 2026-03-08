import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import { formatDateTime } from "../../lib/presentation";
import { usePlatformStatusQuery } from "./api";

export function PlatformHealthView() {
  const { data, error, isLoading, reload } = usePlatformStatusQuery();

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

  return (
    <section>
      <div className="section-header">
        <div>
          <h2>Platform Health</h2>
          <p>
            This page stays product-oriented. It summarizes declared platform
            components and current API-level status without duplicating Grafana's
            deeper metrics views.
          </p>
        </div>
        <StatusPill value={data.status} />
      </div>

      <div className="metadata-row">
        <span>Topology: {data.topology_name}</span>
        <span>Generated: {formatDateTime(data.generated_at)}</span>
      </div>

      <p className="callout">{data.summary}</p>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Role</th>
              <th>Lifecycle</th>
              <th>Observation</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
