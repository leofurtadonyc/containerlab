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

  const observedCount = data.components.filter(
    (component) => component.observation_state !== "not_checked",
  ).length;
  const degradedCount = data.components.filter((component) =>
    ["degraded", "unreachable", "unknown"].includes(component.observation_state),
  ).length;

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
