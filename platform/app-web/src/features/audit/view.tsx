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

export function AuditView() {
  const { data, error, isLoading, reload } = useAuditHistoryQuery();
  const [searchValue, setSearchValue] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const items = data?.items ?? [];
  const resultCounts = countBy(items, (item) => item.result);
  const scopeCounts = countBy(items, (item) => item.target_scope);
  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return items.filter((item) => {
      const matchesResult = resultFilter === "all" || item.result === resultFilter;
      const matchesScope = scopeFilter === "all" || item.target_scope === scopeFilter;
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

      return matchesResult && matchesScope && matchesSearch;
    });
  }, [items, resultFilter, scopeFilter, searchValue]);
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
      </div>

      {data.items.length === 0 ? (
        <EmptyState
          title="No audit events"
          description="No persisted audit-style sync events are currently available for this product view."
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="No audit events match the current filter"
          description="Adjust the search text or result filter to widen the audit-history view."
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
            </article>
          ) : null}
        </div>
      )}
    </section>
  );
}
