import { useMemo, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import { countBy, formatDateTime, formatLabel } from "../../lib/presentation";
import { useWorkflowHistoryQuery } from "./api";

export function WorkflowsView() {
  const { data, error, isLoading, reload } = useWorkflowHistoryQuery();
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const items = data?.items ?? [];
  const statusCounts = countBy(items, (item) => item.status);
  const scopeCounts = countBy(items, (item) => item.scope);
  const persistedArtifactCounts = countBy(
    items.flatMap((item) => item.persisted_artifacts),
    (artifact) => artifact,
  );
  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return items.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          item.workflow_name,
          item.workflow_id,
          item.scope,
          item.source_type,
          item.source_endpoint,
          item.persisted_artifacts.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [items, searchValue, statusFilter]);

  if (isLoading) {
    return (
      <section>
        <h2>Workflow History</h2>
        <LoadingState label="Loading read-only workflow history." />
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2>Workflow History</h2>
        <ErrorState error={error} onRetry={reload} />
      </section>
    );
  }

  if (!data) {
    return (
      <section>
        <h2>Workflow History</h2>
        <EmptyState
          title="No workflow history"
          description="The backend returned no workflow-history response."
        />
      </section>
    );
  }

  return (
    <section>
      <div className="section-header">
        <div>
          <h2>Workflow History</h2>
          <p>
            This page shows bounded platform-side sync activity exposed through the
            backend workflow-history contract. It does not implement execution
            workflows, approvals, or rollback controls.
          </p>
        </div>
        <StatusPill value={data.data_status} />
      </div>

      <div className="metadata-row">
        <span>Data status: {data.data_status}</span>
        <span>Count: {data.count}</span>
        <span>Generated: {formatDateTime(data.generated_at)}</span>
      </div>

      <p className="callout">{data.summary}</p>

      <div className="summary-grid">
        <article className="summary-card">
          <p className="summary-label">Completed Syncs</p>
          <strong>{statusCounts.completed ?? 0}</strong>
          <p>Persisted read-side sync runs that finished without degraded fetch status.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Partial Syncs</p>
          <strong>{statusCounts.partial ?? 0}</strong>
          <p>Sync runs that carried bounded but explicitly partial platform knowledge.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Inventory Snapshots</p>
          <strong>{persistedArtifactCounts.inventory_snapshot ?? 0}</strong>
          <p>Sync runs that persisted normalized inventory snapshot records.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Topology Snapshots</p>
          <strong>{persistedArtifactCounts.topology_snapshot ?? 0}</strong>
          <p>Sync runs that persisted normalized topology snapshot records.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Observed Scope Families</p>
          <strong>{Object.keys(scopeCounts).length}</strong>
          <p>Current platform-side history scope represented in the bounded contract.</p>
        </article>
      </div>

      <div className="content-grid">
        <article className="detail-card">
          <h3>What This Means</h3>
          <p>{data.summary}</p>
          <ul className="compact-list">
            <li>
              <span>History contract status</span>
              <StatusPill value={data.data_status} />
            </li>
            <li>
              <span>Completed</span>
              <strong>{statusCounts.completed ?? 0}</strong>
            </li>
            <li>
              <span>Partial</span>
              <strong>{statusCounts.partial ?? 0}</strong>
            </li>
            <li>
              <span>Failed</span>
              <strong>{statusCounts.failed ?? 0}</strong>
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <h3>Current Scope</h3>
          {Object.entries(scopeCounts).length === 0 ? (
            <p>No workflow-history scope is currently represented.</p>
          ) : (
            <ul className="compact-list">
              {Object.entries(scopeCounts)
                .sort((left, right) => right[1] - left[1])
                .map(([scope, count]) => (
                  <li key={scope}>
                    <span>{formatLabel(scope)}</span>
                    <strong>{count}</strong>
                  </li>
                ))}
            </ul>
          )}
        </article>
        <article className="detail-card">
          <h3>Why It Is Bounded</h3>
          <p>
            The current history view is derived from persisted sync runs and related
            snapshot artifacts. It helps operators answer what the platform has been
            doing, without implying an execution workflow engine already exists.
          </p>
        </article>
      </div>

      <div className="toolbar">
        <label className="field-group">
          <span>Search history</span>
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="workflow, scope, source, endpoint, or artifact"
          />
        </label>
        <label className="field-group">
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="partial">Partial</option>
            <option value="failed">Failed</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
      </div>

      {data.items.length === 0 ? (
        <EmptyState
          title="No platform sync history"
          description="No persisted platform-side sync runs are currently available for the workflow-history view."
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="No history matches the current filter"
          description="Adjust the search text or status filter to widen the workflow-history view."
        />
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Workflow</th>
                <th>Scope</th>
                <th>Status</th>
                <th>Artifacts</th>
                <th>Record count</th>
                <th>Observed</th>
                <th>Finished</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.workflow_id}>
                  <td>
                    <strong>{formatLabel(item.workflow_name)}</strong>
                    <div className="table-note">{item.workflow_id}</div>
                    <div className="table-note">{item.source_endpoint}</div>
                  </td>
                  <td>
                    {formatLabel(item.scope)}
                    <div className="table-note">{item.source_type}</div>
                  </td>
                  <td>
                    <StatusPill value={item.status} />
                    <div className="table-note">{formatLabel(item.workflow_type)}</div>
                  </td>
                  <td>
                    {item.persisted_artifacts.length === 0
                      ? "None recorded"
                      : item.persisted_artifacts.map((artifact) => formatLabel(artifact)).join(", ")}
                  </td>
                  <td>{item.record_count}</td>
                  <td>{formatDateTime(item.observed_at)}</td>
                  <td>
                    {formatDateTime(item.finished_at)}
                    <div className="table-note">
                      Started: {formatDateTime(item.started_at)}
                    </div>
                    {item.notes.length > 0 ? (
                      <div className="table-note">{item.notes.join(" ")}</div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
