import { useMemo, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
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

export function AuditView() {
  const { data, error, isLoading, reload } = useAuditHistoryQuery();
  const [searchValue, setSearchValue] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [evidenceFilter, setEvidenceFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest_occurred");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const items = data?.items ?? [];
  const resultCounts = countBy(items, (item) => item.result);
  const scopeCounts = countBy(items, (item) => item.target_scope);
  const comparisonEvidenceCount = items.filter(
    (item) => item.policy_comparison_to_previous !== null,
  ).length;
  const policyContextCount = items.filter((item) => item.policy_snapshot_summary !== null).length;
  const itemsWithNotesCount = items.filter((item) => item.notes.length > 0).length;
  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return [...items]
      .filter((item) => {
        const matchesResult = resultFilter === "all" || item.result === resultFilter;
        const matchesScope = scopeFilter === "all" || item.target_scope === scopeFilter;
        const matchesEvidence =
          evidenceFilter === "all" ||
          (evidenceFilter === "policy_snapshot_context" &&
            item.policy_snapshot_summary !== null) ||
          (evidenceFilter === "policy_comparison" &&
            item.policy_comparison_to_previous !== null) ||
          (evidenceFilter === "notes_present" && item.notes.length > 0);
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

        return matchesResult && matchesScope && matchesEvidence && matchesSearch;
      })
      .sort((left, right) => {
        const leftOccurredAt = new Date(left.occurred_at).getTime();
        const rightOccurredAt = new Date(right.occurred_at).getTime();

        if (sortOrder === "oldest_occurred") {
          return leftOccurredAt - rightOccurredAt;
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
  }, [evidenceFilter, items, resultFilter, scopeFilter, searchValue, sortOrder]);
  const latestOccurredAt = items[0]?.occurred_at ?? null;
  const selectedEvent =
    filteredItems.find((item) => item.event_id === selectedEventId) ??
    filteredItems[0] ??
    null;

  if (isLoading) {
    return (
      <section>
        <h2>Audit History</h2>
        <LoadingState label="Loading read-only audit history." />
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2>Audit History</h2>
        <ErrorState error={error} onRetry={reload} />
      </section>
    );
  }

  if (!data) {
    return (
      <section>
        <h2>Audit History</h2>
        <EmptyState
          title="No audit history"
          description="The backend returned no audit-history response."
        />
      </section>
    );
  }

  return (
    <section>
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

      <p className="callout">{data.summary}</p>

      <div className="summary-grid">
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
          <p className="summary-label">Policy Comparison Evidence</p>
          <strong>{comparisonEvidenceCount}</strong>
          <p>Audit-style events that include bounded persisted policy snapshot comparison context.</p>
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
              <span>Bounded policy snapshot context</span>
              <strong>{policyContextCount}</strong>
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
            <option value="policy_snapshot_context">Policy snapshot context</option>
            <option value="policy_comparison">Policy comparison evidence</option>
            <option value="notes_present">Entries with notes</option>
          </select>
        </label>
        <label className="field-group">
          <span>Sort</span>
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
            <option value="newest_occurred">Newest occurred first</option>
            <option value="oldest_occurred">Oldest occurred first</option>
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
                        {item.policy_comparison_to_previous
                          ? "Comparison ready"
                          : item.policy_snapshot_summary
                            ? "Snapshot context"
                            : "Sync-only"}
                      </td>
                      <td>{formatDateTime(item.occurred_at)}</td>
                      <td>{item.correlation_id}</td>
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
                  <span>Message</span>
                  <strong>{selectedEvent.message}</strong>
                </div>
                <div className="key-value-row">
                  <span>Evidence posture</span>
                  <strong>
                    {selectedEvent.policy_comparison_to_previous
                      ? "Audit event plus bounded comparison evidence"
                      : selectedEvent.policy_snapshot_summary
                        ? "Audit event plus bounded snapshot context"
                        : "Audit visibility only"}
                  </strong>
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
              {selectedEvent.policy_snapshot_summary ? (
                <>
                  <p className="summary-label">Policy Snapshot Context</p>
                  <div className="key-value-list">
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
