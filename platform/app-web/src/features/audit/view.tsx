import { useMemo, useState } from "react";

import type { AuditHistoryItem } from "../../api/contracts";
import { HistoryEvidenceDrilldown } from "../../components/history-evidence-drilldown";
import { ReadSideQueryPanel } from "../../components/read-side-query-panel";
import { IdentifierChip } from "../../components/identifier-chip";
import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import { auditHistoryDrilldownTargets } from "../../lib/history-evidence-drilldown";
import { countBy, formatDateTime, formatLabel } from "../../lib/presentation";
import { useAuditHistoryQuery } from "./api";

function describeRecency(value: string, generatedAt: string): string {
  const occurredDate = new Date(value);
  const generatedDate = new Date(generatedAt);
  if (Number.isNaN(occurredDate.getTime()) || Number.isNaN(generatedDate.getTime())) {
    return "Timestamp could not be interpreted";
  }

  const ageMinutes = Math.max(
    0,
    Math.round((generatedDate.getTime() - occurredDate.getTime()) / 60000),
  );
  if (ageMinutes <= 5) {
    return `Recent (${ageMinutes}m old)`;
  }
  if (ageMinutes <= 30) {
    return `Aging (${ageMinutes}m old)`;
  }
  return `Stale (${ageMinutes}m old)`;
}

function formatSignedDelta(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }
  return `${value}`;
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

  const occurredDate = new Date(value);
  const generatedDate = new Date(generatedAt);
  if (Number.isNaN(occurredDate.getTime()) || Number.isNaN(generatedDate.getTime())) {
    return null;
  }

  return Math.max(0, Math.round((generatedDate.getTime() - occurredDate.getTime()) / 60000));
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
  return getRecencyBucket(value, generatedAt) === recencyFilter;
}

function getAuditEvidenceLabel(item: AuditHistoryItem): string {
  if (item.readiness_snapshot_summary) {
    return "Readiness snapshot";
  }
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

function getAuditEvidencePosture(item: AuditHistoryItem): string {
  if (item.readiness_snapshot_summary) {
    return "Audit event plus bounded readiness snapshot context";
  }
  if (item.inventory_comparison_to_previous) {
    return "Audit event plus bounded inventory comparison evidence";
  }
  if (item.topology_comparison_to_previous) {
    return "Audit event plus bounded topology comparison evidence";
  }
  if (item.policy_comparison_to_previous) {
    return "Audit event plus bounded policy comparison evidence";
  }
  if (item.inventory_snapshot_summary) {
    return "Audit event plus bounded inventory snapshot context";
  }
  if (item.topology_snapshot_summary) {
    return "Audit event plus bounded topology snapshot context";
  }
  if (item.policy_snapshot_summary) {
    return "Audit event plus bounded policy snapshot context";
  }
  return "Audit visibility only";
}

function matchesAuditEvidenceFilter(item: AuditHistoryItem, evidenceFilter: string): boolean {
  if (evidenceFilter === "all") {
    return true;
  }
  if (evidenceFilter === "readiness_snapshot_context") {
    return item.readiness_snapshot_summary !== null;
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

function getAuditEvidenceWeight(item: AuditHistoryItem): number {
  if (
    item.inventory_comparison_to_previous ||
    item.topology_comparison_to_previous ||
    item.policy_comparison_to_previous
  ) {
    return 3;
  }
  if (
    item.readiness_snapshot_summary ||
    item.inventory_snapshot_summary ||
    item.topology_snapshot_summary ||
    item.policy_snapshot_summary
  ) {
    return 2;
  }
  return 1;
}

export function AuditView() {
  const { data, error, isLoading, reload } = useAuditHistoryQuery();
  const [searchValue, setSearchValue] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [evidenceFilter, setEvidenceFilter] = useState("all");
  const [recencyFilter, setRecencyFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest_occurred");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const items = data?.items ?? [];
  const resultCounts = countBy(items, (item) => item.result);
  const scopeCounts = countBy(items, (item) => item.target_scope);
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
  const readinessContextCount = items.filter(
    (item) => item.readiness_snapshot_summary !== null,
  ).length;
  const recentEventCount = items.filter(
    (item) => getRecencyBucket(item.occurred_at, data?.generated_at ?? "") === "recent",
  ).length;
  const agingEventCount = items.filter(
    (item) => getRecencyBucket(item.occurred_at, data?.generated_at ?? "") === "aging",
  ).length;
  const staleEventCount = items.filter(
    (item) => getRecencyBucket(item.occurred_at, data?.generated_at ?? "") === "stale",
  ).length;
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
        const matchesResult = resultFilter === "all" || item.result === resultFilter;
        const matchesScope = scopeFilter === "all" || item.target_scope === scopeFilter;
        const matchesEvidence = matchesAuditEvidenceFilter(item, evidenceFilter);
        const matchesRecency = matchesRecencyFilter(
          item.occurred_at,
          data?.generated_at ?? "",
          recencyFilter,
        );
        const matchesSearch =
          normalizedSearch.length === 0 ||
          [
            item.event_id,
            item.target_scope,
            item.message,
            item.correlation_id,
            item.event_type,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch);
        return matchesResult && matchesScope && matchesEvidence && matchesRecency && matchesSearch;
      })
      .sort((left, right) => {
        const leftOccurredAt = new Date(left.occurred_at).getTime();
        const rightOccurredAt = new Date(right.occurred_at).getTime();
        const leftEvidenceWeight = getAuditEvidenceWeight(left);
        const rightEvidenceWeight = getAuditEvidenceWeight(right);

        if (sortOrder === "oldest_occurred") {
          return leftOccurredAt - rightOccurredAt;
        }
        if (sortOrder === "richest_evidence") {
          return rightEvidenceWeight - leftEvidenceWeight || rightOccurredAt - leftOccurredAt;
        }
        if (sortOrder === "scope_then_newest") {
          return (
            left.target_scope.localeCompare(right.target_scope) ||
            rightOccurredAt - leftOccurredAt
          );
        }
        if (sortOrder === "message_a_z") {
          return left.message.localeCompare(right.message) || rightOccurredAt - leftOccurredAt;
        }
        return rightOccurredAt - leftOccurredAt;
      });
  }, [
    data?.generated_at,
    evidenceFilter,
    items,
    recencyFilter,
    resultFilter,
    scopeFilter,
    searchValue,
    sortOrder,
  ]);
  const latestOccurredAt = items[0]?.occurred_at ?? null;
  const selectedEvent =
    filteredItems.find((item) => item.event_id === selectedEventId) ??
    filteredItems[0] ??
    null;

  if (isLoading) {
    return (
      <section>
        <h2>Audit History</h2>
        <ReadSideQueryPanel variant="audit-history" />
        <LoadingState label="Loading read-only audit history." />
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2>Audit History</h2>
        <ReadSideQueryPanel variant="audit-history" />
        <ErrorState error={error} onRetry={reload} />
      </section>
    );
  }

  if (!data) {
    return (
      <section>
        <h2>Audit History</h2>
        <ReadSideQueryPanel variant="audit-history" />
        <EmptyState
          title="No audit history"
          description="The backend returned no audit-history response."
        />
      </section>
    );
  }

  return (
    <section>
      <ReadSideQueryPanel variant="audit-history" />
      <div className="section-header">
        <div>
          <h2>Audit History</h2>
          <p>
            This page shows platform-recorded audit-style events derived from persisted
            sync activity. It is product-facing history visibility, not an approvals or
            execution control surface.
          </p>
        </div>
        <StatusPill value={data.data_status} />
      </div>

      <div className="metadata-row">
        <span>Data status: {data.data_status}</span>
        <span>Count: {data.count}</span>
        <span>Generated: {formatDateTime(data.generated_at)}</span>
      </div>

      <div className="callout">
        <strong>History baseline</strong>{" "}
        <StatusPill value={data.baseline_summary.baseline_posture} />
        <p>{data.baseline_summary.summary}</p>
        <p className="table-note">
          Read-only sync- and readiness-derived audit-style visibility for this workspace only—whether
          bounded persisted artifacts are still present after restart or redeploy. Not approvals,
          execution controls, disaster recovery, or forensic-grade audit; see Overview and Platform
          Health for recovery posture.
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
          <p className="summary-label">Succeeded Events</p>
          <strong>{resultCounts.succeeded ?? 0}</strong>
          <p>Platform-recorded sync events that completed successfully.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Partial Events</p>
          <strong>{resultCounts.partial ?? 0}</strong>
          <p>Events where bounded or degraded knowledge remained explicit.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Failed Events</p>
          <strong>{resultCounts.failed ?? 0}</strong>
          <p>Events where the sync activity did not complete successfully.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Tracked Scopes</p>
          <strong>{Object.keys(scopeCounts).length}</strong>
          <p>Distinct platform target scopes represented in current audit visibility.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Latest Event</p>
          <strong>
            {latestOccurredAt ? describeRecency(latestOccurredAt, data.generated_at) : "None"}
          </strong>
          <p>How recent the newest persisted audit-style event is.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Recent Events</p>
          <strong>{recentEventCount}</strong>
          <p>Audit-style events whose occurrence time is still recent in this generated view.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Stale Events</p>
          <strong>{staleEventCount}</strong>
          <p>Audit-style events whose occurrence time is already stale in this generated view.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Comparison Evidence</p>
          <strong>{comparisonEvidenceCount}</strong>
          <p>Audit events that include bounded inventory, topology, or policy comparison context.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Readiness Snapshot Context</p>
          <strong>{readinessContextCount}</strong>
          <p>Events that include bounded persisted readiness-support evidence.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Inventory Snapshot Context</p>
          <strong>{inventoryContextCount}</strong>
          <p>Events that include bounded persisted inventory evidence beyond plain audit messaging.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Topology Snapshot Context</p>
          <strong>{topologyContextCount}</strong>
          <p>Events that include bounded persisted topology evidence beyond plain audit messaging.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Policy Snapshot Context</p>
          <strong>{policyContextCount}</strong>
          <p>Events that include bounded persisted policy snapshot evidence beyond plain audit messaging.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Events With Notes</p>
          <strong>{itemsWithNotesCount}</strong>
          <p>Audit entries that carry explicit evidence notes or caveats from the backend.</p>
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
            {data.baseline_summary.notes.length > 0 ? (
              data.baseline_summary.notes.map((note, idx) => (
                <li key={idx}>
                  <span>Interpretation</span>
                  <span className="table-note">{note}</span>
                </li>
              ))
            ) : null}
          </ul>
        </article>
        <article className="detail-card">
          <h3>Audit Readout</h3>
          <p>{data.summary}</p>
          <ul className="compact-list">
            <li>
              <span>Audit contract status</span>
              <StatusPill value={data.data_status} />
            </li>
            <li>
              <span>Succeeded</span>
              <strong>{resultCounts.succeeded ?? 0}</strong>
            </li>
            <li>
              <span>Partial</span>
              <strong>{resultCounts.partial ?? 0}</strong>
            </li>
            <li>
              <span>Failed</span>
              <strong>{resultCounts.failed ?? 0}</strong>
            </li>
            <li>
              <span>Latest event</span>
              <strong>
                {latestOccurredAt
                  ? describeRecency(latestOccurredAt, data.generated_at)
                  : "None"}
              </strong>
            </li>
            <li>
              <span>With comparison evidence</span>
              <strong>{comparisonEvidenceCount}</strong>
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <h3>Scope Distribution</h3>
          {Object.entries(scopeCounts).length === 0 ? (
            <p>No audit-history scopes are currently represented.</p>
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
          <h3>Evidence Boundary</h3>
          <p>
            Audit history helps operators understand what platform-side sync activity
            was recorded and when it happened. Richer actor history, approvals, and
            change actions remain intentionally outside the current phase.
          </p>
          <ul className="compact-list">
            <li>
              <span>Latest event freshness</span>
              <strong>
                {latestOccurredAt
                  ? describeRecency(latestOccurredAt, data.generated_at)
                  : "None"}
              </strong>
            </li>
            <li>
              <span>Bounded snapshot context</span>
              <strong>
                {readinessContextCount + inventoryContextCount + topologyContextCount + policyContextCount}
              </strong>
            </li>
            <li>
              <span>Recent / aging / stale</span>
              <strong>
                {recentEventCount} / {agingEventCount} / {staleEventCount}
              </strong>
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <h3>Cross-Domain Evidence</h3>
          <p>
            Comparison-ready audit entries remain bounded to persisted normalized snapshot pairs.
            They show what the platform recorded, not who approved or executed change actions.
          </p>
          <ul className="compact-list">
            <li>
              <span>Readiness context</span>
              <strong>{readinessContextCount}</strong>
            </li>
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
          <span>Search events</span>
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="event, scope, correlation, or message"
          />
        </label>
        <label className="field-group">
          <span>Result</span>
          <select
            value={resultFilter}
            onChange={(event) => setResultFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="succeeded">Succeeded</option>
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
          <span>Evidence</span>
          <select
            value={evidenceFilter}
            onChange={(event) => setEvidenceFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="readiness_snapshot_context">Readiness snapshot context</option>
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
            <option value="recent">Recent events</option>
            <option value="aging">Aging events</option>
            <option value="stale">Stale events</option>
          </select>
        </label>
        <label className="field-group">
          <span>Sort</span>
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
            <option value="newest_occurred">Newest occurred first</option>
            <option value="oldest_occurred">Oldest occurred first</option>
            <option value="richest_evidence">Richest evidence first</option>
            <option value="scope_then_newest">Scope then newest</option>
            <option value="message_a_z">Message A-Z</option>
          </select>
        </label>
      </div>

      {data.items.length === 0 ? (
        <EmptyState
          title="No audit events"
          description="No persisted audit-style sync events are currently available for this product view."
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="No audit events match the current filter"
          description="Adjust the search text, evidence filter, or sort controls to widen the audit-history view."
        />
      ) : (
        <div className="content-grid">
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Scope</th>
                  <th>Result</th>
                  <th>Evidence</th>
                  <th>Occurred</th>
                  <th>Correlation</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isSelected = selectedEvent?.event_id === item.event_id;
                  return (
                    <tr
                      key={item.event_id}
                      className={isSelected ? "table-row-selected" : undefined}
                    >
                      <td>
                        <button
                          type="button"
                          className="table-select"
                          onClick={() => setSelectedEventId(item.event_id)}
                        >
                          <strong>{formatLabel(item.event_type)}</strong>
                          <span>{item.event_id}</span>
                        </button>
                        <div className="table-note">
                          {formatLabel(item.source)} • {formatLabel(item.actor)}
                        </div>
                      </td>
                      <td>{formatLabel(item.target_scope)}</td>
                      <td>
                        <StatusPill value={item.result} />
                      </td>
                      <td>
                        {getAuditEvidenceLabel(item)}
                      </td>
                      <td>{formatDateTime(item.occurred_at)}</td>
                      <td>
                        {item.correlation_id}
                        <div className="table-note">
                          {describeRecency(item.occurred_at, data.generated_at)}
                        </div>
                      </td>
                      <td>{item.message}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {selectedEvent ? (
            <article className="detail-card">
              <h3>Selected Event Detail</h3>
              {selectedEvent.readiness_snapshot_summary ||
              selectedEvent.event_type === "readiness_snapshot_recorded" ? (
                <p className="table-note">
                  Readiness snapshot context on this event can add a Readiness drilldown; when a
                  strongest-blocker name is present, navigation may set a bounded URL scroll hint —
                  interpretation only, not a validation verdict.
                </p>
              ) : null}
              <HistoryEvidenceDrilldown targets={auditHistoryDrilldownTargets(selectedEvent)} />
              <div className="key-value-list">
                <div className="key-value-row">
                  <span>Event</span>
                  <strong>{formatLabel(selectedEvent.event_type)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Scope</span>
                  <strong>{formatLabel(selectedEvent.target_scope)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Result</span>
                  <strong>{formatLabel(selectedEvent.result)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Occurred</span>
                  <strong>{formatDateTime(selectedEvent.occurred_at)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Freshness</span>
                  <strong>{describeRecency(selectedEvent.occurred_at, data.generated_at)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Correlation</span>
                  <strong>{selectedEvent.correlation_id}</strong>
                </div>
                <div className="key-value-row">
                  <span>Sync-run anchor</span>
                  <IdentifierChip
                    value={selectedEvent.sync_run_id}
                    emptyLabel="Not a sync-run-backed event"
                  />
                </div>
                <div className="key-value-row">
                  <span>Readiness snapshot anchor</span>
                  <IdentifierChip
                    value={selectedEvent.readiness_snapshot_id}
                    emptyLabel="Not a readiness-backed event"
                  />
                </div>
                <div className="key-value-row">
                  <span>Message</span>
                  <strong>{selectedEvent.message}</strong>
                </div>
                <div className="key-value-row">
                  <span>Source</span>
                  <strong>
                    {formatLabel(selectedEvent.source)} / {formatLabel(selectedEvent.actor)}
                  </strong>
                </div>
                <div className="key-value-row">
                  <span>Evidence posture</span>
                  <strong>{getAuditEvidencePosture(selectedEvent)}</strong>
                </div>
              </div>
              {selectedEvent.notes.length > 0 ? (
                <>
                  <p className="summary-label">Evidence Notes</p>
                  <ul className="notes-list">
                    {selectedEvent.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {selectedEvent.readiness_snapshot_summary ? (
                <>
                  <p className="summary-label">Readiness Snapshot Context</p>
                  <div className="key-value-list">
                    <div className="key-value-row">
                      <span>Snapshot anchor</span>
                      <IdentifierChip value={selectedEvent.readiness_snapshot_summary.snapshot_id} />
                    </div>
                    <div className="key-value-row">
                      <span>Persisted at</span>
                      <strong>
                        {formatDateTime(selectedEvent.readiness_snapshot_summary.persisted_at)}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Occurred to persisted gap</span>
                      <strong>
                        {describeTimeGap(
                          selectedEvent.occurred_at,
                          selectedEvent.readiness_snapshot_summary.persisted_at,
                        )}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Readiness status</span>
                      <strong>
                        {formatLabel(selectedEvent.readiness_snapshot_summary.readiness_status)}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Planning readiness</span>
                      <strong>
                        {formatLabel(selectedEvent.readiness_snapshot_summary.planning_readiness)}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Phase recommendation</span>
                      <strong>
                        {formatLabel(selectedEvent.readiness_snapshot_summary.phase_recommendation)}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Blocker count</span>
                      <strong>{selectedEvent.readiness_snapshot_summary.blocker_count}</strong>
                    </div>
                  </div>
                  <p className="table-note">{selectedEvent.readiness_snapshot_summary.summary}</p>
                </>
              ) : null}
              {selectedEvent.inventory_snapshot_summary ||
              selectedEvent.inventory_comparison_to_previous ? (
                <div className="persisted-evidence-section">
                  <p className="summary-label">Inventory persisted evidence</p>
                  <p className="table-note">
                    Snapshot summary fields (anchors, counts, distributions) when present,
                    and optional latest-versus-previous comparison when the backend attached
                    it to this audit event. Sync-derived read-only context only—not approvals,
                    operator forensics, or platform validation verdicts.
                  </p>
                  {selectedEvent.inventory_snapshot_summary ? (
                    <>
                      <p className="summary-label">Inventory snapshot summary</p>
                      <div className="key-value-list">
                        <div className="key-value-row">
                          <span>Snapshot anchor</span>
                          <IdentifierChip value={selectedEvent.inventory_snapshot_summary.snapshot_id} />
                        </div>
                        <div className="key-value-row">
                          <span>Sync source</span>
                          <strong>{formatLabel(selectedEvent.inventory_snapshot_summary.sync_source)}</strong>
                        </div>
                        <div className="key-value-row">
                          <span>Sync status</span>
                          <strong>{formatLabel(selectedEvent.inventory_snapshot_summary.sync_status)}</strong>
                        </div>
                        <div className="key-value-row">
                          <span>Persisted at</span>
                          <strong>
                            {formatDateTime(selectedEvent.inventory_snapshot_summary.persisted_at)}
                          </strong>
                        </div>
                        <div className="key-value-row">
                          <span>Device count</span>
                          <strong>{selectedEvent.inventory_snapshot_summary.device_count}</strong>
                        </div>
                        <div className="key-value-row">
                          <span>Occurred to persisted gap</span>
                          <strong>
                            {describeTimeGap(
                              selectedEvent.occurred_at,
                              selectedEvent.inventory_snapshot_summary.persisted_at,
                            )}
                          </strong>
                        </div>
                        <div className="key-value-row">
                          <span>Snapshot data status</span>
                          <strong>
                            {formatLabel(selectedEvent.inventory_snapshot_summary.data_status)}
                          </strong>
                        </div>
                        <div className="key-value-row">
                          <span>Role distribution</span>
                          <strong>
                            {Object.entries(selectedEvent.inventory_snapshot_summary.role_counts)
                              .map(([role, count]) => `${formatLabel(role)} ${count}`)
                              .join(", ") || "None"}
                          </strong>
                        </div>
                        <div className="key-value-row">
                          <span>Collector status distribution</span>
                          <strong>
                            {Object.entries(
                              selectedEvent.inventory_snapshot_summary.collector_status_counts,
                            )
                              .map(([status, count]) => `${formatLabel(status)} ${count}`)
                              .join(", ") || "None"}
                          </strong>
                        </div>
                        <div className="key-value-row">
                          <span>Observed to persisted lag</span>
                          <strong>
                            {describeTimeGap(
                              selectedEvent.inventory_snapshot_summary.observed_at,
                              selectedEvent.inventory_snapshot_summary.persisted_at,
                            )}
                          </strong>
                        </div>
                        <div className="key-value-row">
                          <span>Capability summary distribution</span>
                          <strong>
                            {Object.entries(
                              selectedEvent.inventory_snapshot_summary.capability_summary_counts,
                            )
                              .map(([status, count]) => `${formatLabel(status)} ${count}`)
                              .join(", ") || "None"}
                          </strong>
                        </div>
                      </div>
                    </>
                  ) : null}
                  {selectedEvent.inventory_comparison_to_previous ? (
                    <>
                      <p className="summary-label">Inventory latest-versus-previous comparison</p>
                      <div className="key-value-list">
                        <div className="key-value-row">
                          <span>Current snapshot anchor</span>
                          <IdentifierChip
                            value={selectedEvent.inventory_comparison_to_previous.current_snapshot_id}
                          />
                        </div>
                        <div className="key-value-row">
                          <span>Previous snapshot anchor</span>
                          <IdentifierChip
                            value={selectedEvent.inventory_comparison_to_previous.previous_snapshot_id}
                          />
                        </div>
                        <div className="key-value-row">
                          <span>Compared snapshots</span>
                          <strong>
                            {formatDateTime(
                              selectedEvent.inventory_comparison_to_previous.previous_persisted_at,
                            )}{" "}
                            {"->"}{" "}
                            {formatDateTime(
                              selectedEvent.inventory_comparison_to_previous.current_persisted_at,
                            )}
                          </strong>
                        </div>
                        <div className="key-value-row">
                          <span>Device count delta</span>
                          <strong>
                            {formatSignedDelta(
                              selectedEvent.inventory_comparison_to_previous.device_count_delta,
                            )}
                          </strong>
                        </div>
                        <div className="key-value-row">
                          <span>Added / removed / changed</span>
                          <strong>
                            {selectedEvent.inventory_comparison_to_previous.added_device_count} /{" "}
                            {selectedEvent.inventory_comparison_to_previous.removed_device_count} /{" "}
                            {selectedEvent.inventory_comparison_to_previous.changed_device_count}
                          </strong>
                        </div>
                      </div>
                      {selectedEvent.inventory_comparison_to_previous.notes.length > 0 ? (
                        <ul className="notes-list">
                          {selectedEvent.inventory_comparison_to_previous.notes.map((note) => (
                            <li key={note}>{note}</li>
                          ))}
                        </ul>
                      ) : null}
                    </>
                  ) : null}
                  {selectedEvent.inventory_snapshot_summary &&
                  !selectedEvent.inventory_comparison_to_previous ? (
                    <p className="table-note">
                      No latest-versus-previous comparison envelope is present on this record. That
                      is honest and expected when fewer than two persisted snapshots exist for this
                      scope or the backend did not attach comparison context; it does not indicate a
                      bug or incomplete persisted history for this event.
                    </p>
                  ) : null}
                </div>
              ) : null}
              {selectedEvent.topology_snapshot_summary ? (
                <>
                  <p className="summary-label">Topology Snapshot Context</p>
                  <div className="key-value-list">
                    <div className="key-value-row">
                      <span>Snapshot anchor</span>
                      <IdentifierChip value={selectedEvent.topology_snapshot_summary.snapshot_id} />
                    </div>
                    <div className="key-value-row">
                      <span>Persisted at</span>
                      <strong>
                        {formatDateTime(selectedEvent.topology_snapshot_summary.persisted_at)}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Topology</span>
                      <strong>{selectedEvent.topology_snapshot_summary.topology_name}</strong>
                    </div>
                    <div className="key-value-row">
                      <span>Occurred to persisted gap</span>
                      <strong>
                        {describeTimeGap(
                          selectedEvent.occurred_at,
                          selectedEvent.topology_snapshot_summary.persisted_at,
                        )}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Nodes / links</span>
                      <strong>
                        {selectedEvent.topology_snapshot_summary.node_count} /{" "}
                        {selectedEvent.topology_snapshot_summary.link_count}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Completeness</span>
                      <strong>
                        {formatLabel(selectedEvent.topology_snapshot_summary.completeness)}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Node states</span>
                      <strong>
                        {Object.entries(selectedEvent.topology_snapshot_summary.node_state_counts)
                          .map(([state, count]) => `${formatLabel(state)} ${count}`)
                          .join(", ") || "None"}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Link states</span>
                      <strong>
                        {Object.entries(selectedEvent.topology_snapshot_summary.link_state_counts)
                          .map(([state, count]) => `${formatLabel(state)} ${count}`)
                          .join(", ") || "None"}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Observed to persisted lag</span>
                      <strong>
                        {describeTimeGap(
                          selectedEvent.topology_snapshot_summary.observed_at,
                          selectedEvent.topology_snapshot_summary.persisted_at,
                        )}
                      </strong>
                    </div>
                  </div>
                </>
              ) : null}
              {selectedEvent.topology_comparison_to_previous ? (
                <>
                  <p className="summary-label">Topology Comparison Evidence</p>
                  <div className="key-value-list">
                    <div className="key-value-row">
                      <span>Current snapshot anchor</span>
                      <IdentifierChip value={selectedEvent.topology_comparison_to_previous.current_snapshot_id} />
                    </div>
                    <div className="key-value-row">
                      <span>Previous snapshot anchor</span>
                      <IdentifierChip value={selectedEvent.topology_comparison_to_previous.previous_snapshot_id} />
                    </div>
                    <div className="key-value-row">
                      <span>Compared snapshots</span>
                      <strong>
                        {formatDateTime(
                          selectedEvent.topology_comparison_to_previous.previous_persisted_at,
                        )}{" "}
                        {"->"}{" "}
                        {formatDateTime(
                          selectedEvent.topology_comparison_to_previous.current_persisted_at,
                        )}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Node / link delta</span>
                      <strong>
                        {formatSignedDelta(
                          selectedEvent.topology_comparison_to_previous.node_count_delta,
                        )}{" "}
                        /{" "}
                        {formatSignedDelta(
                          selectedEvent.topology_comparison_to_previous.link_count_delta,
                        )}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Added nodes / links</span>
                      <strong>
                        {selectedEvent.topology_comparison_to_previous.added_node_count} /{" "}
                        {selectedEvent.topology_comparison_to_previous.added_link_count}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Removed nodes / links</span>
                      <strong>
                        {selectedEvent.topology_comparison_to_previous.removed_node_count} /{" "}
                        {selectedEvent.topology_comparison_to_previous.removed_link_count}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Changed nodes / links</span>
                      <strong>
                        {selectedEvent.topology_comparison_to_previous.changed_node_count} /{" "}
                        {selectedEvent.topology_comparison_to_previous.changed_link_count}
                      </strong>
                    </div>
                  </div>
                  {selectedEvent.topology_comparison_to_previous.notes.length > 0 ? (
                    <ul className="notes-list">
                      {selectedEvent.topology_comparison_to_previous.notes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  ) : null}
                </>
              ) : null}
              {selectedEvent.policy_snapshot_summary ? (
                <>
                  <p className="summary-label">Policy Snapshot Context</p>
                  <div className="key-value-list">
                    <div className="key-value-row">
                      <span>Snapshot anchor</span>
                      <IdentifierChip value={null} emptyLabel="Not exposed in this summary" />
                    </div>
                    <div className="key-value-row">
                      <span>Persisted at</span>
                      <strong>{formatDateTime(selectedEvent.policy_snapshot_summary.persisted_at)}</strong>
                    </div>
                    <div className="key-value-row">
                      <span>Occurred to persisted gap</span>
                      <strong>
                        {describeTimeGap(
                          selectedEvent.occurred_at,
                          selectedEvent.policy_snapshot_summary.persisted_at,
                        )}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Observed policies</span>
                      <strong>{selectedEvent.policy_snapshot_summary.observed_policy_count}</strong>
                    </div>
                    <div className="key-value-row">
                      <span>Detailed records</span>
                      <strong>{selectedEvent.policy_snapshot_summary.detail_record_count}</strong>
                    </div>
                    <div className="key-value-row">
                      <span>Detail mode</span>
                      <strong>{formatLabel(selectedEvent.policy_snapshot_summary.detail_mode)}</strong>
                    </div>
                    <div className="key-value-row">
                      <span>Observed to persisted lag</span>
                      <strong>
                        {describeTimeGap(
                          selectedEvent.policy_snapshot_summary.observed_at,
                          selectedEvent.policy_snapshot_summary.persisted_at,
                        )}
                      </strong>
                    </div>
                  </div>
                </>
              ) : null}
              {selectedEvent.policy_comparison_to_previous ? (
                <>
                  <p className="summary-label">Policy Comparison Evidence</p>
                  <div className="key-value-list">
                    <div className="key-value-row">
                      <span>Current snapshot anchor</span>
                      <IdentifierChip value={selectedEvent.policy_comparison_to_previous.current_snapshot_id} />
                    </div>
                    <div className="key-value-row">
                      <span>Previous snapshot anchor</span>
                      <IdentifierChip value={selectedEvent.policy_comparison_to_previous.previous_snapshot_id} />
                    </div>
                    <div className="key-value-row">
                      <span>Compared snapshots</span>
                      <strong>
                        {formatDateTime(
                          selectedEvent.policy_comparison_to_previous.previous_persisted_at,
                        )}{" "}
                        {"->"}{" "}
                        {formatDateTime(
                          selectedEvent.policy_comparison_to_previous.current_persisted_at,
                        )}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Observed policy delta</span>
                      <strong>
                        {formatSignedDelta(
                          selectedEvent.policy_comparison_to_previous.observed_policy_delta,
                        )}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Detailed record delta</span>
                      <strong>
                        {formatSignedDelta(
                          selectedEvent.policy_comparison_to_previous.detail_record_delta,
                        )}
                      </strong>
                    </div>
                    <div className="key-value-row">
                      <span>Added / removed / changed</span>
                      <strong>
                        {selectedEvent.policy_comparison_to_previous.added_policy_count} /{" "}
                        {selectedEvent.policy_comparison_to_previous.removed_policy_count} /{" "}
                        {selectedEvent.policy_comparison_to_previous.changed_policy_count}
                      </strong>
                    </div>
                  </div>
                  {selectedEvent.policy_comparison_to_previous.notes.length > 0 ? (
                    <ul className="notes-list">
                      {selectedEvent.policy_comparison_to_previous.notes.map((note) => (
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
