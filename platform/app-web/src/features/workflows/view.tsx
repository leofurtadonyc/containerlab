import { useMemo, useState } from "react";

import type { WorkflowHistoryItem } from "../../api/contracts";
import { ChangeIntelligenceOverviewLink } from "../../components/change-intelligence-overview-link";
import { HistoryEvidenceDrilldown } from "../../components/history-evidence-drilldown";
import { HistoryPolicyEvidenceTimelineDrilldown } from "../../components/history-policy-evidence-timeline-drilldown";
import { ReadSideQueryPanel } from "../../components/read-side-query-panel";
import { IdentifierChip } from "../../components/identifier-chip";
import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import {
  policyEvidenceTimelineRowsFromComparison,
  workflowHistoryDrilldownTargets,
} from "../../lib/history-evidence-drilldown";
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

function formatSignedDelta(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }
  return `${value}`;
}

function formatDurationSeconds(value: number | null): string {
  if (value === null) {
    return "Unknown";
  }
  return `${value}s`;
}

function describeTimeGap(start: string | null, end: string | null): string {
  if (!start || !end) {
    return "Not available";
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Timestamp could not be interpreted";
  }

  const gapSeconds = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 1000));
  if (gapSeconds < 60) {
    return `${gapSeconds}s`;
  }

  const gapMinutes = Math.round(gapSeconds / 60);
  return `${gapMinutes}m`;
}

function getAgeMinutes(value: string | null, generatedAt: string): number | null {
  if (!value) {
    return null;
  }

  const observedDate = new Date(value);
  const generatedDate = new Date(generatedAt);
  if (Number.isNaN(observedDate.getTime()) || Number.isNaN(generatedDate.getTime())) {
    return null;
  }

  return Math.max(0, Math.round((generatedDate.getTime() - observedDate.getTime()) / 60000));
}

function getRecencyBucket(
  value: string | null,
  generatedAt: string,
): "recent" | "aging" | "stale" | "unknown" {
  const ageMinutes = getAgeMinutes(value, generatedAt);
  if (ageMinutes === null) {
    return "unknown";
  }
  if (ageMinutes <= 5) {
    return "recent";
  }
  if (ageMinutes <= 30) {
    return "aging";
  }
  return "stale";
}

function matchesRecencyFilter(
  value: string | null,
  generatedAt: string,
  recencyFilter: string,
): boolean {
  if (recencyFilter === "all") {
    return true;
  }
  if (recencyFilter === "with_observed_input") {
    return value !== null;
  }
  if (recencyFilter === "without_observed_input") {
    return value === null;
  }
  return getRecencyBucket(value, generatedAt) === recencyFilter;
}

function getWorkflowEvidenceLabel(item: WorkflowHistoryItem): string {
  if (item.inventory_comparison_to_previous) {
    return "Inventory comparison";
  }
  if (item.topology_comparison_to_previous) {
    return "Topology comparison";
  }
  if (item.policy_comparison_to_previous) {
    return "Policy comparison";
  }
  if (item.inventory_snapshot_summary) {
    return "Inventory snapshot";
  }
  if (item.topology_snapshot_summary) {
    return "Topology snapshot";
  }
  if (item.policy_snapshot_summary) {
    return "Policy snapshot";
  }
  return "Sync-only";
}

function getWorkflowEvidencePosture(item: WorkflowHistoryItem): string {
  if (item.inventory_comparison_to_previous) {
    return "Sync run plus bounded inventory comparison evidence";
  }
  if (item.topology_comparison_to_previous) {
    return "Sync run plus bounded topology comparison evidence";
  }
  if (item.policy_comparison_to_previous) {
    return "Sync run plus bounded policy comparison evidence";
  }
  if (item.inventory_snapshot_summary) {
    return "Sync run plus bounded inventory snapshot context";
  }
  if (item.topology_snapshot_summary) {
    return "Sync run plus bounded topology snapshot context";
  }
  if (item.policy_snapshot_summary) {
    return "Sync run plus bounded policy snapshot context";
  }
  return "Sync-run visibility only";
}

function matchesWorkflowEvidenceFilter(
  item: WorkflowHistoryItem,
  evidenceFilter: string,
): boolean {
  if (evidenceFilter === "all") {
    return true;
  }
  if (evidenceFilter === "inventory_snapshot_context") {
    return item.inventory_snapshot_summary !== null;
  }
  if (evidenceFilter === "inventory_comparison") {
    return item.inventory_comparison_to_previous !== null;
  }
  if (evidenceFilter === "topology_snapshot_context") {
    return item.topology_snapshot_summary !== null;
  }
  if (evidenceFilter === "topology_comparison") {
    return item.topology_comparison_to_previous !== null;
  }
  if (evidenceFilter === "policy_snapshot_context") {
    return item.policy_snapshot_summary !== null;
  }
  if (evidenceFilter === "policy_comparison") {
    return item.policy_comparison_to_previous !== null;
  }
  if (evidenceFilter === "notes_present") {
    return item.notes.length > 0;
  }
  return false;
}

function getWorkflowEvidenceWeight(item: WorkflowHistoryItem): number {
  if (
    item.inventory_comparison_to_previous ||
    item.topology_comparison_to_previous ||
    item.policy_comparison_to_previous
  ) {
    return 3;
  }
  if (
    item.inventory_snapshot_summary ||
    item.topology_snapshot_summary ||
    item.policy_snapshot_summary
  ) {
    return 2;
  }
  return 1;
}

export function WorkflowsView() {
  const { data, error, isLoading, reload } = useWorkflowHistoryQuery();
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [artifactFilter, setArtifactFilter] = useState("all");
  const [evidenceFilter, setEvidenceFilter] = useState("all");
  const [recencyFilter, setRecencyFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest_finished");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const items = data?.items ?? [];
  const statusCounts = countBy(items, (item) => item.status);
  const scopeCounts = countBy(items, (item) => item.scope);
  const persistedArtifactCounts = countBy(
    items.flatMap((item) => item.persisted_artifacts),
    (artifact) => artifact,
  );
  const comparisonEvidenceCount = items.filter(
    (item) =>
      item.inventory_comparison_to_previous !== null ||
      item.topology_comparison_to_previous !== null ||
      item.policy_comparison_to_previous !== null,
  ).length;
  const inventoryContextCount = items.filter(
    (item) => item.inventory_snapshot_summary !== null,
  ).length;
  const topologyContextCount = items.filter((item) => item.topology_snapshot_summary !== null).length;
  const policyContextCount = items.filter((item) => item.policy_snapshot_summary !== null).length;
  const itemsWithNotesCount = items.filter((item) => item.notes.length > 0).length;
  const recentFinishedCount = items.filter(
    (item) => getRecencyBucket(item.finished_at, data?.generated_at ?? "") === "recent",
  ).length;
  const agingFinishedCount = items.filter(
    (item) => getRecencyBucket(item.finished_at, data?.generated_at ?? "") === "aging",
  ).length;
  const staleFinishedCount = items.filter(
    (item) => getRecencyBucket(item.finished_at, data?.generated_at ?? "") === "stale",
  ).length;
  const withObservedInputCount = items.filter((item) => item.observed_at !== null).length;
  const inventoryComparisonCount = items.filter(
    (item) => item.inventory_comparison_to_previous !== null,
  ).length;
  const topologyComparisonCount = items.filter(
    (item) => item.topology_comparison_to_previous !== null,
  ).length;
  const policyComparisonCount = items.filter(
    (item) => item.policy_comparison_to_previous !== null,
  ).length;
  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return [...items]
      .filter((item) => {
        const matchesStatus = statusFilter === "all" || item.status === statusFilter;
        const matchesScope = scopeFilter === "all" || item.scope === scopeFilter;
        const matchesArtifact =
          artifactFilter === "all" || item.persisted_artifacts.includes(artifactFilter);
        const matchesEvidence = matchesWorkflowEvidenceFilter(item, evidenceFilter);
        const matchesRecency = matchesRecencyFilter(
          item.finished_at,
          data?.generated_at ?? "",
          recencyFilter,
        );
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

        return (
          matchesStatus &&
          matchesScope &&
          matchesArtifact &&
          matchesEvidence &&
          matchesRecency &&
          matchesSearch
        );
      })
      .sort((left, right) => {
        const leftFinishedAt = new Date(left.finished_at).getTime();
        const rightFinishedAt = new Date(right.finished_at).getTime();
        const leftDuration =
          getDurationSeconds(left.started_at, left.finished_at) ?? Number.NEGATIVE_INFINITY;
        const rightDuration =
          getDurationSeconds(right.started_at, right.finished_at) ?? Number.NEGATIVE_INFINITY;
        const leftEvidenceWeight = getWorkflowEvidenceWeight(left);
        const rightEvidenceWeight = getWorkflowEvidenceWeight(right);

        if (sortOrder === "oldest_finished") {
          return leftFinishedAt - rightFinishedAt;
        }
        if (sortOrder === "scope_then_newest") {
          return left.scope.localeCompare(right.scope) || rightFinishedAt - leftFinishedAt;
        }
        if (sortOrder === "richest_evidence") {
          return rightEvidenceWeight - leftEvidenceWeight || rightFinishedAt - leftFinishedAt;
        }
        if (sortOrder === "longest_duration") {
          return rightDuration - leftDuration || rightFinishedAt - leftFinishedAt;
        }
        if (sortOrder === "highest_record_count") {
          return right.record_count - left.record_count || rightFinishedAt - leftFinishedAt;
        }
        return rightFinishedAt - leftFinishedAt;
      });
  }, [
    artifactFilter,
    evidenceFilter,
    items,
    data?.generated_at,
    recencyFilter,
    scopeFilter,
    searchValue,
    sortOrder,
    statusFilter,
  ]);
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
        <ReadSideQueryPanel variant="workflow-history" />
        <ChangeIntelligenceOverviewLink historySurface="workflow" />
        <LoadingState label="Loading read-only workflow history." />
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2>Workflow History</h2>
        <ReadSideQueryPanel variant="workflow-history" />
        <ChangeIntelligenceOverviewLink historySurface="workflow" />
        <ErrorState error={error} onRetry={reload} />
      </section>
    );
  }

  if (!data) {
    return (
      <section>
        <h2>Workflow History</h2>
        <ReadSideQueryPanel variant="workflow-history" />
        <ChangeIntelligenceOverviewLink historySurface="workflow" />
        <EmptyState
          title="No workflow history"
          description="The backend returned no workflow-history response."
        />
      </section>
    );
  }

  return (
    <section>
      <ReadSideQueryPanel variant="workflow-history" />
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

      <ChangeIntelligenceOverviewLink historySurface="workflow" />

      <div className="callout">
        <strong>History baseline</strong>{" "}
        <StatusPill value={data.baseline_summary.baseline_posture} />
        <p>{data.baseline_summary.summary}</p>
        <p className="table-note">
          Sync- and readiness-derived read-only history for this workspace only—whether bounded
          persisted artifacts are still present after restart or redeploy. Not workflow execution,
          approvals, disaster recovery, or a full audit trail; see Overview and Platform Health for
          recovery posture.
        </p>
      </div>

      <p className="callout">{data.summary}</p>

      <div className="summary-grid">
        <article className="summary-card">
          <p className="summary-label">Baseline Posture</p>
          <StatusPill value={data.baseline_summary.baseline_posture} />
          <p>{data.baseline_summary.summary}</p>
        </article>
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
        <article className="summary-card">
          <p className="summary-label">Recent Syncs</p>
          <strong>{recentFinishedCount}</strong>
          <p>Sync runs whose latest finish evidence is still recent in this generated view.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Stale Syncs</p>
          <strong>{staleFinishedCount}</strong>
          <p>Sync runs whose latest finish evidence is already stale in this generated view.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Comparison Evidence</p>
          <strong>{comparisonEvidenceCount}</strong>
          <p>Sync runs that include bounded inventory, topology, or policy comparison context.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Inventory Snapshot Context</p>
          <strong>{inventoryContextCount}</strong>
          <p>History entries that carry persisted inventory evidence beyond sync status.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Topology Snapshot Context</p>
          <strong>{topologyContextCount}</strong>
          <p>History entries that carry persisted topology evidence beyond sync status.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Policy Snapshot Context</p>
          <strong>{policyContextCount}</strong>
          <p>History entries that carry persisted policy snapshot evidence beyond sync status.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Entries With Notes</p>
          <strong>{itemsWithNotesCount}</strong>
          <p>Sync runs that include explicit backend evidence notes or caveats.</p>
        </article>
      </div>

      <div className="content-grid">
        <article className="detail-card">
          <h3>Baseline Summary</h3>
          <p>{data.baseline_summary.summary}</p>
          <ul className="compact-list">
            <li>
              <span>Baseline posture</span>
              <StatusPill value={data.baseline_summary.baseline_posture} />
            </li>
          </ul>
          {data.baseline_summary.notes.length > 0 ? (
            <ul className="notes-list">
              {data.baseline_summary.notes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          ) : null}
        </article>
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
            <li>
              <span>With comparison evidence</span>
              <strong>{comparisonEvidenceCount}</strong>
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
            <li>
              <span>Bounded snapshot context</span>
              <strong>
                {inventoryContextCount + topologyContextCount + policyContextCount}
              </strong>
            </li>
            <li>
              <span>Recent / aging / stale</span>
              <strong>
                {recentFinishedCount} / {agingFinishedCount} / {staleFinishedCount}
              </strong>
            </li>
            <li>
              <span>Entries with observed input</span>
              <strong>{withObservedInputCount}</strong>
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <h3>Cross-Domain Evidence</h3>
          <p>
            Comparison-ready entries remain bounded to persisted normalized snapshot pairs.
            Snapshot-context entries indicate richer read-side evidence, not workflow actions.
          </p>
          <ul className="compact-list">
            <li>
              <span>Inventory context / comparison</span>
              <strong>
                {inventoryContextCount} / {inventoryComparisonCount}
              </strong>
            </li>
            <li>
              <span>Topology context / comparison</span>
              <strong>
                {topologyContextCount} / {topologyComparisonCount}
              </strong>
            </li>
            <li>
              <span>Policy context / comparison</span>
              <strong>
                {policyContextCount} / {policyComparisonCount}
              </strong>
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
        <label className="field-group">
          <span>Evidence</span>
          <select
            value={evidenceFilter}
            onChange={(event) => setEvidenceFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="inventory_snapshot_context">Inventory snapshot context</option>
            <option value="inventory_comparison">Inventory comparison evidence</option>
            <option value="topology_snapshot_context">Topology snapshot context</option>
            <option value="topology_comparison">Topology comparison evidence</option>
            <option value="policy_snapshot_context">Policy snapshot context</option>
            <option value="policy_comparison">Policy comparison evidence</option>
            <option value="notes_present">Entries with notes</option>
          </select>
        </label>
        <label className="field-group">
          <span>Recency</span>
          <select
            value={recencyFilter}
            onChange={(event) => setRecencyFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="recent">Recent finishes</option>
            <option value="aging">Aging finishes</option>
            <option value="stale">Stale finishes</option>
            <option value="with_observed_input">With observed input</option>
            <option value="without_observed_input">Without observed input</option>
          </select>
        </label>
        <label className="field-group">
          <span>Sort</span>
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
            <option value="newest_finished">Newest finished first</option>
            <option value="oldest_finished">Oldest finished first</option>
            <option value="scope_then_newest">Scope then newest</option>
            <option value="richest_evidence">Richest evidence first</option>
            <option value="longest_duration">Longest duration first</option>
            <option value="highest_record_count">Highest record count first</option>
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
          description="Adjust the search text, evidence filter, or sort controls to widen the workflow-history view."
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
                  <th>Evidence</th>
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
                        {getWorkflowEvidenceLabel(item)}
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
                          {describeRecency(item.finished_at, data.generated_at)} • Started:{" "}
                          {formatDateTime(item.started_at)}
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
              {selectedWorkflow.persisted_artifacts.includes("readiness_snapshot") ? (
                <p className="table-note">
                  This sync run persisted a readiness snapshot artifact. The drilldown below may include
                  Readiness for bounded planning-support navigation — not workflow execution or approvals.
                </p>
              ) : null}
              <HistoryEvidenceDrilldown targets={workflowHistoryDrilldownTargets(selectedWorkflow)} />
              <HistoryPolicyEvidenceTimelineDrilldown
                rows={policyEvidenceTimelineRowsFromComparison(selectedWorkflow)}
              />
              <div className="key-value-list">
                <div className="key-value-row">
                  <span>Workflow</span>
                  <strong>{formatLabel(selectedWorkflow.workflow_name)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Sync-run anchor</span>
                  <IdentifierChip value={selectedWorkflow.sync_run_id} />
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
                  <span>Observed to finished gap</span>
                  <strong>
                    {describeTimeGap(
                      selectedWorkflow.observed_at,
                      selectedWorkflow.finished_at,
                    )}
                  </strong>
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
                <div className="key-value-row">
                  <span>Source type</span>
                  <strong>{formatLabel(selectedWorkflow.source_type)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Evidence posture</span>
                  <strong>{getWorkflowEvidencePosture(selectedWorkflow)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Observed input freshness</span>
                  <strong>{describeRecency(selectedWorkflow.observed_at, data.generated_at)}</strong>
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
              {selectedWorkflow.inventory_snapshot_summary ||
              selectedWorkflow.inventory_comparison_to_previous ? (
                <div className="persisted-evidence-section">
                  <p className="summary-label">Inventory persisted evidence</p>
                  <p className="table-note">
                    Snapshot summary fields (anchors, counts, distributions) when present,
                    and optional latest-versus-previous comparison when the backend
                    attached it to this sync run. Sync-derived read-only context only—not
                    workflow execution steps, approvals, or platform validation verdicts.
                  </p>
                  {selectedWorkflow.inventory_snapshot_summary ? (
                    <>
                      <p className="summary-label">Inventory snapshot summary</p>
                      <div className="key-value-list">
                        <div className="key-value-row">
                          <span>Snapshot anchor</span>
                          <IdentifierChip value={selectedWorkflow.inventory_snapshot_summary.snapshot_id} />
                        </div>
                        <div className="key-value-row">
                          <span>Sync source</span>
                          <strong>{formatLabel(selectedWorkflow.inventory_snapshot_summary.sync_source)}</strong>
                        </div>
                        <div className="key-value-row">
                          <span>Sync status</span>
                          <strong>{formatLabel(selectedWorkflow.inventory_snapshot_summary.sync_status)}</strong>
                        </div>
                        <div className="key-value-row">
                          <span>Persisted at</span>
                          <strong>
                            {formatDateTime(selectedWorkflow.inventory_snapshot_summary.persisted_at)}
                          </strong>
                        </div>
                        <div className="key-value-row">
                          <span>Device count</span>
                          <strong>{selectedWorkflow.inventory_snapshot_summary.device_count}</strong>
                        </div>
                        <div className="key-value-row">
                          <span>Snapshot lag after finish</span>
                          <strong>
                            {describeTimeGap(
                              selectedWorkflow.finished_at,
                              selectedWorkflow.inventory_snapshot_summary.persisted_at,
                            )}
                          </strong>
                        </div>
                        <div className="key-value-row">
                          <span>Snapshot data status</span>
                          <strong>
                            {formatLabel(selectedWorkflow.inventory_snapshot_summary.data_status)}
                          </strong>
                        </div>
                        <div className="key-value-row">
                          <span>Role distribution</span>
                          <strong>
                            {Object.entries(selectedWorkflow.inventory_snapshot_summary.role_counts)
                              .map(([role, count]) => `${formatLabel(role)} ${count}`)
                              .join(", ") || "None"}
                          </strong>
                        </div>
                        <div className="key-value-row">
                          <span>Collector status distribution</span>
                          <strong>
                            {Object.entries(
                              selectedWorkflow.inventory_snapshot_summary.collector_status_counts,
                            )
                              .map(([status, count]) => `${formatLabel(status)} ${count}`)
                              .join(", ") || "None"}
                          </strong>
                        </div>
                        <div className="key-value-row">
                          <span>Observed to persisted lag</span>
                          <strong>
                            {describeTimeGap(
                              selectedWorkflow.inventory_snapshot_summary.observed_at,
                              selectedWorkflow.inventory_snapshot_summary.persisted_at,
                            )}
                          </strong>
                        </div>
                        <div className="key-value-row">
                          <span>Capability summary distribution</span>
                          <strong>
                            {Object.entries(
                              selectedWorkflow.inventory_snapshot_summary.capability_summary_counts,
                            )
                              .map(([status, count]) => `${formatLabel(status)} ${count}`)
                              .join(", ") || "None"}
                          </strong>
                        </div>
                      </div>
                    </>
                  ) : null}
                  {selectedWorkflow.inventory_comparison_to_previous ? (
                    <>
                      <p className="summary-label">Inventory latest-versus-previous comparison</p>
                      <div className="key-value-list">
                        <div className="key-value-row">
                          <span>Current snapshot anchor</span>
                          <IdentifierChip
                            value={selectedWorkflow.inventory_comparison_to_previous.current_snapshot_id}
                          />
                        </div>
                        <div className="key-value-row">
                          <span>Previous snapshot anchor</span>
                          <IdentifierChip
                            value={selectedWorkflow.inventory_comparison_to_previous.previous_snapshot_id}
                          />
                        </div>
                        <div className="key-value-row">
                          <span>Compared snapshots</span>
                          <strong>
                            {formatDateTime(
                              selectedWorkflow.inventory_comparison_to_previous.previous_persisted_at,
                            )}{" "}
                            {"->"}{" "}
                            {formatDateTime(
                              selectedWorkflow.inventory_comparison_to_previous.current_persisted_at,
                            )}
                          </strong>
                        </div>
                        <div className="key-value-row">
                          <span>Device count delta</span>
                          <strong>
                            {formatSignedDelta(
                              selectedWorkflow.inventory_comparison_to_previous.device_count_delta,
                            )}
                          </strong>
                        </div>
                        <div className="key-value-row">
                          <span>Added / removed / changed</span>
                          <strong>
                            {selectedWorkflow.inventory_comparison_to_previous.added_device_count} /{" "}
                            {selectedWorkflow.inventory_comparison_to_previous.removed_device_count} /{" "}
                            {selectedWorkflow.inventory_comparison_to_previous.changed_device_count}
                          </strong>
                        </div>
                      </div>
                      {selectedWorkflow.inventory_comparison_to_previous.notes.length > 0 ? (
                        <ul className="notes-list">
                          {selectedWorkflow.inventory_comparison_to_previous.notes.map((note) => (
                            <li key={note}>{note}</li>
                          ))}
                        </ul>
                      ) : null}
                    </>
                  ) : null}
                  {selectedWorkflow.inventory_snapshot_summary &&
                  !selectedWorkflow.inventory_comparison_to_previous ? (
                    <p className="table-note">
                      No latest-versus-previous comparison envelope is present on this record. That
                      is honest and expected when fewer than two persisted snapshots exist for this
                      scope or the backend did not attach comparison context; it does not indicate a
                      bug or incomplete persisted history for this sync run.
                    </p>
                  ) : null}
                </div>
              ) : null}
              {selectedWorkflow.topology_snapshot_summary ? (
                <>
                  <p className="summary-label">Topology Snapshot Context</p>
                  <div className="key-value-list">
                    <div className="key-value-row">
                      <span>Snapshot anchor</span>
                      <IdentifierChip value={selectedWorkflow.topology_snapshot_summary.snapshot_id} />
                    </div>
                    <div className="key-value-row">
                      <span>Persisted at</span>
                      <strong>
                        {formatDateTime(selectedWorkflow.topology_snapshot_summary.persisted_at)}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Topology</span>
                      <strong>{selectedWorkflow.topology_snapshot_summary.topology_name}</strong>
                    </div>
                    <div className="key-value-row">
                      <span>Snapshot lag after finish</span>
                      <strong>
                        {describeTimeGap(
                          selectedWorkflow.finished_at,
                          selectedWorkflow.topology_snapshot_summary.persisted_at,
                        )}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Nodes / links</span>
                      <strong>
                        {selectedWorkflow.topology_snapshot_summary.node_count} /{" "}
                        {selectedWorkflow.topology_snapshot_summary.link_count}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Completeness</span>
                      <strong>
                        {formatLabel(selectedWorkflow.topology_snapshot_summary.completeness)}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Node states</span>
                      <strong>
                        {Object.entries(selectedWorkflow.topology_snapshot_summary.node_state_counts)
                          .map(([state, count]) => `${formatLabel(state)} ${count}`)
                          .join(", ") || "None"}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Link states</span>
                      <strong>
                        {Object.entries(selectedWorkflow.topology_snapshot_summary.link_state_counts)
                          .map(([state, count]) => `${formatLabel(state)} ${count}`)
                          .join(", ") || "None"}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Observed to persisted lag</span>
                      <strong>
                        {describeTimeGap(
                          selectedWorkflow.topology_snapshot_summary.observed_at,
                          selectedWorkflow.topology_snapshot_summary.persisted_at,
                        )}
                      </strong>
                    </div>
                  </div>
                </>
              ) : null}
              {selectedWorkflow.topology_comparison_to_previous ? (
                <>
                  <p className="summary-label">Topology Comparison Evidence</p>
                  <div className="key-value-list">
                    <div className="key-value-row">
                      <span>Current snapshot anchor</span>
                      <IdentifierChip value={selectedWorkflow.topology_comparison_to_previous.current_snapshot_id} />
                    </div>
                    <div className="key-value-row">
                      <span>Previous snapshot anchor</span>
                      <IdentifierChip value={selectedWorkflow.topology_comparison_to_previous.previous_snapshot_id} />
                    </div>
                    <div className="key-value-row">
                      <span>Compared snapshots</span>
                      <strong>
                        {formatDateTime(
                          selectedWorkflow.topology_comparison_to_previous.previous_persisted_at,
                        )}{" "}
                        {"->"}{" "}
                        {formatDateTime(
                          selectedWorkflow.topology_comparison_to_previous.current_persisted_at,
                        )}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Node / link delta</span>
                      <strong>
                        {formatSignedDelta(
                          selectedWorkflow.topology_comparison_to_previous.node_count_delta,
                        )}{" "}
                        /{" "}
                        {formatSignedDelta(
                          selectedWorkflow.topology_comparison_to_previous.link_count_delta,
                        )}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Added nodes / links</span>
                      <strong>
                        {selectedWorkflow.topology_comparison_to_previous.added_node_count} /{" "}
                        {selectedWorkflow.topology_comparison_to_previous.added_link_count}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Removed nodes / links</span>
                      <strong>
                        {selectedWorkflow.topology_comparison_to_previous.removed_node_count} /{" "}
                        {selectedWorkflow.topology_comparison_to_previous.removed_link_count}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Changed nodes / links</span>
                      <strong>
                        {selectedWorkflow.topology_comparison_to_previous.changed_node_count} /{" "}
                        {selectedWorkflow.topology_comparison_to_previous.changed_link_count}
                      </strong>
                    </div>
                  </div>
                  {selectedWorkflow.topology_comparison_to_previous.notes.length > 0 ? (
                    <ul className="notes-list">
                      {selectedWorkflow.topology_comparison_to_previous.notes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  ) : null}
                </>
              ) : null}
              {selectedWorkflow.policy_snapshot_summary ? (
                <>
                  <p className="summary-label">Policy Snapshot Context</p>
                  <div className="key-value-list">
                    <div className="key-value-row">
                      <span>Snapshot anchor</span>
                      <IdentifierChip value={null} emptyLabel="Not exposed in this summary" />
                    </div>
                    <div className="key-value-row">
                      <span>Persisted at</span>
                      <strong>{formatDateTime(selectedWorkflow.policy_snapshot_summary.persisted_at)}</strong>
                    </div>
                    <div className="key-value-row">
                      <span>Snapshot lag after finish</span>
                      <strong>
                        {describeTimeGap(
                          selectedWorkflow.finished_at,
                          selectedWorkflow.policy_snapshot_summary.persisted_at,
                        )}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Observed policies</span>
                      <strong>{selectedWorkflow.policy_snapshot_summary.observed_policy_count}</strong>
                    </div>
                    <div className="key-value-row">
                      <span>Detailed records</span>
                      <strong>{selectedWorkflow.policy_snapshot_summary.detail_record_count}</strong>
                    </div>
                    <div className="key-value-row">
                      <span>Detail mode</span>
                      <strong>{formatLabel(selectedWorkflow.policy_snapshot_summary.detail_mode)}</strong>
                    </div>
                    <div className="key-value-row">
                      <span>Empty reason</span>
                      <strong>{formatLabel(selectedWorkflow.policy_snapshot_summary.empty_reason)}</strong>
                    </div>
                    <div className="key-value-row">
                      <span>Observed to persisted lag</span>
                      <strong>
                        {describeTimeGap(
                          selectedWorkflow.policy_snapshot_summary.observed_at,
                          selectedWorkflow.policy_snapshot_summary.persisted_at,
                        )}
                      </strong>
                    </div>
                  </div>
                </>
              ) : null}
              {selectedWorkflow.policy_comparison_to_previous ? (
                <>
                  <p className="summary-label">Policy Comparison Evidence</p>
                  <div className="key-value-list">
                    <div className="key-value-row">
                      <span>Current snapshot anchor</span>
                      <IdentifierChip value={selectedWorkflow.policy_comparison_to_previous.current_snapshot_id} />
                    </div>
                    <div className="key-value-row">
                      <span>Previous snapshot anchor</span>
                      <IdentifierChip value={selectedWorkflow.policy_comparison_to_previous.previous_snapshot_id} />
                    </div>
                    <div className="key-value-row">
                      <span>Compared snapshots</span>
                      <strong>
                        {formatDateTime(
                          selectedWorkflow.policy_comparison_to_previous.previous_persisted_at,
                        )}{" "}
                        {"->"}{" "}
                        {formatDateTime(
                          selectedWorkflow.policy_comparison_to_previous.current_persisted_at,
                        )}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Observed policy delta</span>
                      <strong>
                        {formatSignedDelta(
                          selectedWorkflow.policy_comparison_to_previous.observed_policy_delta,
                        )}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Detailed record delta</span>
                      <strong>
                        {formatSignedDelta(
                          selectedWorkflow.policy_comparison_to_previous.detail_record_delta,
                        )}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Added / removed / changed</span>
                      <strong>
                        {selectedWorkflow.policy_comparison_to_previous.added_policy_count} /{" "}
                        {selectedWorkflow.policy_comparison_to_previous.removed_policy_count} /{" "}
                        {selectedWorkflow.policy_comparison_to_previous.changed_policy_count}
                      </strong>
                    </div>
                  </div>
                  {selectedWorkflow.policy_comparison_to_previous.notes.length > 0 ? (
                    <ul className="notes-list">
                      {selectedWorkflow.policy_comparison_to_previous.notes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  ) : null}
                </>
              ) : null}
            </article>
          ) : null}
        </div>
      )}
    </section>
  );
}
