import { useMemo, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import { countBy, formatDateTime } from "../../lib/presentation";
import { usePoliciesQuery } from "./api";

export function PoliciesView() {
  const { data, error, isLoading, reload } = usePoliciesQuery();
  const [healthFilter, setHealthFilter] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const items = data?.items ?? [];
  const healthCounts = countBy(items, (policy) => policy.health_state);
  const observedStateCounts = countBy(items, (policy) => policy.observed_state);
  const supportCounts = countBy(items, (policy) => policy.support_state);
  const hasObservedPolicies = items.length > 0;
  const filteredPolicies = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return items.filter((policy) => {
      const matchesHealth = healthFilter === "all" || policy.health_state === healthFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [policy.policy_name, policy.policy_id, policy.headend, policy.endpoint]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesHealth && matchesSearch;
    });
  }, [items, healthFilter, searchValue]);

  if (isLoading) {
    return (
      <section>
        <h2>Policies</h2>
        <LoadingState label="Loading normalized policy inventory." />
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2>Policies</h2>
        <ErrorState error={error} onRetry={reload} />
      </section>
    );
  }

  if (!data) {
    return (
      <section>
        <h2>Policies</h2>
        <EmptyState
          title="No policy inventory"
          description="The backend returned no policy inventory response."
        />
      </section>
    );
  }

  return (
    <section>
      <div className="section-header">
        <div>
          <h2>Policies</h2>
          <p>
            Policy inventory is read from the live backend contract.
            Workflow execution stays out of scope for this phase.
          </p>
        </div>
        <StatusPill value={data.data_status} />
      </div>

      <div className="metadata-row">
        <span>Data status: {data.data_status}</span>
        <span>Sync source: {data.sync_source}</span>
        <span>Sync status: {data.sync_status}</span>
        <span>Completeness: {data.completeness}</span>
        <span>Count: {data.count}</span>
        <span>Observed: {formatDateTime(data.observed_at)}</span>
        <span>Generated: {formatDateTime(data.generated_at)}</span>
      </div>

      <p className="callout">{data.summary}</p>

      <div className="summary-grid">
        <article className="summary-card">
          <p className="summary-label">Observed Targets</p>
          <strong>{data.observed_target_count}</strong>
          <p>Targets that returned bounded live SR policy observations.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Policy-Capable Targets</p>
          <strong>{data.policy_capable_target_count}</strong>
          <p>Targets exposing live SR policy capability counters.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Active Policies</p>
          <strong>{data.active_policy_count}</strong>
          <p>Active SR policies observed in the current live slice.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Observed Policies</p>
          <strong>{data.count}</strong>
          <p>
            Static: {data.static_policy_count} • BGP: {data.bgp_policy_count} • Degraded:{" "}
            {healthCounts.degraded ?? 0}
          </p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Current Posture</p>
          <strong>{hasObservedPolicies ? "Observed" : "Live Empty"}</strong>
          <p>
            {hasObservedPolicies
              ? "The bounded live slice has policy records to inspect."
              : "The bounded live slice is healthy, but it currently contains no SR policy records."}
          </p>
        </article>
      </div>

      <div className="content-grid">
        <article className="detail-card">
          <h3>Operational Readout</h3>
          <p>{data.summary}</p>
          <ul className="compact-list">
            <li>
              <span>Backend policy status</span>
              <StatusPill value={data.data_status} />
            </li>
            <li>
              <span>Policy sync status</span>
              <StatusPill value={data.sync_status} />
            </li>
            <li>
              <span>Explicit completeness</span>
              <StatusPill value={data.completeness} />
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <h3>Current Evidence</h3>
          <ul className="compact-list">
            <li>
              <span>Observed targets</span>
              <strong>{data.observed_target_count}</strong>
            </li>
            <li>
              <span>Policy-capable targets</span>
              <strong>{data.policy_capable_target_count}</strong>
            </li>
            <li>
              <span>Active policies</span>
              <strong>{data.active_policy_count}</strong>
            </li>
            <li>
              <span>Static / BGP policies</span>
              <strong>
                {data.static_policy_count} / {data.bgp_policy_count}
              </strong>
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <h3>State Distribution</h3>
          <ul className="compact-list">
            <li>
              <span>Observed active</span>
              <strong>{observedStateCounts.active ?? 0}</strong>
            </li>
            <li>
              <span>Observed degraded</span>
              <strong>{observedStateCounts.degraded ?? 0}</strong>
            </li>
            <li>
              <span>Health degraded</span>
              <strong>{healthCounts.degraded ?? 0}</strong>
            </li>
            <li>
              <span>Support unknown</span>
              <strong>{supportCounts.unknown ?? 0}</strong>
            </li>
          </ul>
        </article>
      </div>

      {data.notes.length > 0 ? (
        <div className="callout">
          <strong>Current limits</strong>
          <ul className="notes-list">
            {data.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="toolbar">
        <label className="field-group">
          <span>Search policies</span>
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="policy, headend, endpoint, or id"
          />
        </label>
        <label className="field-group">
          <span>Health state</span>
          <select
            value={healthFilter}
            onChange={(event) => setHealthFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="healthy">Healthy</option>
            <option value="degraded">Degraded</option>
            <option value="down">Down</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
      </div>

      {data.items.length === 0 ? (
        <EmptyState
          title="No SR policies currently observed"
          description={`The live policy slice observed ${data.observed_target_count} targets and ${data.policy_capable_target_count} policy-capable nodes, but no SR policy records are currently present in the lab.`}
        />
      ) : filteredPolicies.length === 0 ? (
        <EmptyState
          title="No policies match the current filter"
          description="Adjust the search text or health-state filter to widen the policy inventory view."
        />
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Policy</th>
                <th>Headend</th>
                <th>Endpoint</th>
                <th>Intent</th>
                <th>Observed</th>
                <th>Support</th>
                <th>Health</th>
              </tr>
            </thead>
            <tbody>
              {filteredPolicies.map((policy) => (
                <tr key={policy.policy_id}>
                  <td>
                    <strong>{policy.policy_name}</strong>
                    <div className="table-note">
                      {policy.policy_id} • color {policy.color} •{" "}
                      {policy.candidate_paths.length} candidate paths
                    </div>
                  </td>
                  <td>{policy.headend}</td>
                  <td>{policy.endpoint}</td>
                  <td>
                    <StatusPill value={policy.intent_state} />
                  </td>
                  <td>
                    <StatusPill value={policy.observed_state} />
                  </td>
                  <td>
                    <StatusPill value={policy.support_state} />
                  </td>
                  <td>
                    <StatusPill value={policy.health_state} />
                    {policy.notes.length > 0 ? (
                      <div className="table-note">{policy.notes.join(" ")}</div>
                    ) : null}
                    <div className="table-note">
                      {policy.candidate_paths
                        .map((candidatePath) => {
                          const preference =
                            candidatePath.preference === null
                              ? ""
                              : ` pref ${candidatePath.preference}`;
                          return `${candidatePath.name} (${candidatePath.path_state}${preference})`;
                        })
                        .join(" • ")}
                    </div>
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
