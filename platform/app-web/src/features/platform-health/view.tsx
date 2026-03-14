import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import { TrustCueCard } from "../../components/trust-cue-card";
import { countBy, formatDateTime, formatLabel } from "../../lib/presentation";
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
        <span>Observed components: {observedCount}</span>
        <span>Not checked: {notCheckedCount}</span>
      </div>

      <p className="callout">{data.summary}</p>

      <div className="callout">
        <strong>Observation scope remains explicit</strong>
        <p>
          This page summarizes declared platform components plus one bounded live observation path.
          It does not claim persisted snapshot anchors, fallback serving, or full dependency health
          coverage for every service.
        </p>
      </div>

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
          <p className="summary-label">Observation Sources</p>
          <strong>{Object.keys(observationSourceCounts).length}</strong>
          <p>Distinct bounded observation-source families currently exposed in product status.</p>
        </article>
      </div>

      <div className="content-grid">
        <TrustCueCard
          title="Routine-Use Trust Cues"
          summary="Platform Health is a current API response rather than an anchored history surface, so the key cues are freshness, observation coverage, and how much of the page is probe-backed versus declared-only."
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
              label: "Anchor posture",
              kind: "anchor",
              value: null,
              emptyLabel: "Not exposed on this page",
              note: "Platform status does not currently expose a persisted snapshot identifier because this page is a bounded current-status surface.",
            },
            {
              label: "Degraded scope",
              kind: "status",
              value: degradedCount > 0 ? "degraded" : "ok",
            },
          ]}
        />

        <TrustCueCard
          title="Observation Basis"
          summary="Current evidence on this page comes from declared component inventory plus the bounded observation sources the backend can complete without turning Platform Health into a full dependency-monitoring system."
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
              label: "Status baseline",
              kind: "status",
              value: data.status,
            },
          ]}
        />
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
