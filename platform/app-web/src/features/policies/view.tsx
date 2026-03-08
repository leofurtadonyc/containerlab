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
            Policy inventory is read from the current backend-owned contract.
            Workflow execution stays out of scope for this phase.
          </p>
        </div>
        <StatusPill value={data.data_status} />
      </div>

      <div className="metadata-row">
        <span>Count: {data.count}</span>
        <span>Generated: {formatDateTime(data.generated_at)}</span>
      </div>

      <p className="callout">{data.summary}</p>

      <div className="summary-grid">
        <article className="summary-card">
          <p className="summary-label">Healthy</p>
          <strong>{healthCounts.healthy ?? 0}</strong>
          <p>Policies with healthy observed posture.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Degraded</p>
          <strong>{healthCounts.degraded ?? 0}</strong>
          <p>Policies that need operator attention.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Unsupported in platform</p>
          <strong>
            {
              data.items.filter(
                (policy) => policy.support_state === "not_implemented_in_platform",
              ).length
            }
          </strong>
          <p>Policies whose support path is intentionally not built yet.</p>
        </article>
      </div>

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
          title="No policies declared"
          description="The policy read model is available, but no policy records are present."
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
