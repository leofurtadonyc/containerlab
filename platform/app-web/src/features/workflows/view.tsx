import { useMemo, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import { countBy, formatDateTime, formatLabel } from "../../lib/presentation";
import { useWorkflowHistoryQuery } from "./api";

function describeRecency(value: string | null, generatedAt: string): string {
  if (!value) {
    return "No timestamp available";
  }

  const observedDate = new Date(value);
  const generatedDate = new Date(generatedAt);
  if (Number.isNaN(observedDate.getTime()) || Number.isNaN(generatedDate.getTime())) {
    return "Timestamp could not be interpreted";
  }

  const ageMinutes = Math.max(
    0,
    Math.round((generatedDate.getTime() - observedDate.getTime()) / 60000),
  );
  if (ageMinutes <= 5) {
    return `Recent (${ageMinutes}m old)`;
  }
  if (ageMinutes <= 30) {
    return `Aging (${ageMinutes}m old)`;
  }
  return `Stale (${ageMinutes}m old)`;
}

function getDurationSeconds(startedAt: string, finishedAt: string): number | null {
  const startedDate = new Date(startedAt);
  const finishedDate = new Date(finishedAt);
  if (Number.isNaN(startedDate.getTime()) || Number.isNaN(finishedDate.getTime())) {
    return null;
  }

  return Math.max(0, Math.round((finishedDate.getTime() - startedDate.getTime()) / 1000));
}

export function WorkflowsView() {
  const { data, error, isLoading, reload } = useWorkflowHistoryQuery();
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [artifactFilter, setArtifactFilter] = useState("all");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
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
      const matchesScope = scopeFilter === "all" || item.scope === scopeFilter;
      const matchesArtifact =
        artifactFilter === "all" || item.persisted_artifacts.includes(artifactFilter);
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

      return matchesStatus && matchesScope && matchesArtifact && matchesSearch;
    });
  }, [artifactFilter, items, scopeFilter, searchValue, statusFilter]);
  const latestFinishedAt = items[0]?.finished_at ?? null;
  const latestObservedAt = items.find((item) => item.observed_at)?.observed_at ?? null;
  const selectedWorkflow =
    filteredItems.find((item) => item.workflow_id === selectedWorkflowId) ??
    filteredItems[0] ??
    null;

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
          <p className="summary-label">Policy Snapshots</p>
          <strong>{persistedArtifactCounts.policy_snapshot ?? 0}</strong>
          <p>Sync runs that persisted normalized policy snapshot records.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Observed Scope Families</p>
          <strong>{Object.keys(scopeCounts).length}</strong>
          <p>Current platform-side history scope represented in the bounded contract.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Latest Finished Sync</p>
          <strong>{describeRecency(latestFinishedAt, data.generated_at)}</strong>
          <p>How recent the newest persisted workflow-history evidence is.</p>
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
            <li>
              <span>Latest finished</span>
              <strong>{describeRecency(latestFinishedAt, data.generated_at)}</strong>
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
          <h3>Freshness and Evidence</h3>
          <p>
            The current history view is derived from persisted sync runs and related
            snapshot artifacts. It helps operators answer what the platform has been
            doing, without implying an execution workflow engine already exists.
          </p>
          <ul className="compact-list">
            <li>
              <span>Latest observed input</span>
              <strong>{describeRecency(latestObservedAt, data.generated_at)}</strong>
            </li>
            <li>
              <span>Latest persisted finish</span>
              <strong>{describeRecency(latestFinishedAt, data.generated_at)}</strong>
            </li>
          </ul>
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
        <label className="field-group">
          <span>Scope</span>
          <select
            value={scopeFilter}
            onChange={(event) => setScopeFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="device_inventory_read_side">Device inventory</option>
            <option value="topology_read_side">Topology</option>
            <option value="policy_inventory_read_side">Policy</option>
            <option value="platform_read_side">Platform</option>
          </select>
        </label>
        <label className="field-group">
          <span>Persisted artifact</span>
          <select
            value={artifactFilter}
            onChange={(event) => setArtifactFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="inventory_snapshot">Inventory snapshot</option>
            <option value="topology_snapshot">Topology snapshot</option>
            <option value="policy_snapshot">Policy snapshot</option>
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
        <div className="content-grid">
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
                {filteredItems.map((item) => {
                  const isSelected = selectedWorkflow?.workflow_id === item.workflow_id;
                  return (
                    <tr
                      key={item.workflow_id}
                      className={isSelected ? "table-row-selected" : undefined}
                    >
                      <td>
                        <button
                          type="button"
                          className="table-select"
                          onClick={() => setSelectedWorkflowId(item.workflow_id)}
                        >
                          <strong>{formatLabel(item.workflow_name)}</strong>
                          <span>{item.workflow_id}</span>
                        </button>
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
                          : item.persisted_artifacts
                              .map((artifact) => formatLabel(artifact))
                              .join(", ")}
                      </td>
                      <td>{item.record_count}</td>
                      <td>{formatDateTime(item.observed_at)}</td>
                      <td>
                        {formatDateTime(item.finished_at)}
                        <div className="table-note">
                          Started: {formatDateTime(item.started_at)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {selectedWorkflow ? (
            <article className="detail-card">
              <h3>Selected Sync Detail</h3>
              <div className="key-value-list">
                <div className="key-value-row">
                  <span>Workflow</span>
                  <strong>{formatLabel(selectedWorkflow.workflow_name)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Scope</span>
                  <strong>{formatLabel(selectedWorkflow.scope)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Status</span>
                  <strong>{formatLabel(selectedWorkflow.status)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Freshness</span>
                  <strong>{describeRecency(selectedWorkflow.finished_at, data.generated_at)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Duration</span>
                  <strong>
                    {getDurationSeconds(
                      selectedWorkflow.started_at,
                      selectedWorkflow.finished_at,
                    ) ?? "Unknown"}{" "}
                    seconds
                  </strong>
                </div>
                <div className="key-value-row">
                  <span>Record count</span>
                  <strong>{selectedWorkflow.record_count}</strong>
                </div>
                <div className="key-value-row">
                  <span>Observed input</span>
                  <strong>{formatDateTime(selectedWorkflow.observed_at)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Persisted artifacts</span>
                  <strong>
                    {selectedWorkflow.persisted_artifacts.length === 0
                      ? "None recorded"
                      : selectedWorkflow.persisted_artifacts
                          .map((artifact) => formatLabel(artifact))
                          .join(", ")}
                  </strong>
                </div>
                <div className="key-value-row">
                  <span>Source</span>
                  <strong>{selectedWorkflow.source_endpoint}</strong>
                </div>
              </div>
              {selectedWorkflow.notes.length > 0 ? (
                <>
                  <p className="summary-label">Evidence Notes</p>
                  <ul className="notes-list">
                    {selectedWorkflow.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </article>
          ) : null}
        </div>
      )}
    </section>
  );
}
