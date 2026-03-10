import { useMemo, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import { countBy, formatDateTime, formatLabel } from "../../lib/presentation";
import { usePoliciesQuery } from "./api";

export function PoliciesView() {
  const { data, error, isLoading, reload } = usePoliciesQuery();
  const [healthFilter, setHealthFilter] = useState("all");
  const [supportFilter, setSupportFilter] = useState("all");
  const [observedFilter, setObservedFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("health_then_name");
  const [searchValue, setSearchValue] = useState("");
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const items = data?.items ?? [];
  const healthCounts = countBy(items, (policy) => policy.health_state);
  const observedStateCounts = countBy(items, (policy) => policy.observed_state);
  const supportCounts = countBy(items, (policy) => policy.support_state);
  const policyTypeCounts = countBy(items, (policy) => policy.policy_type);
  const hasObservedPolicies = items.length > 0;
  const filteredPolicies = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return items.filter((policy) => {
      const matchesHealth = healthFilter === "all" || policy.health_state === healthFilter;
      const matchesSupport = supportFilter === "all" || policy.support_state === supportFilter;
      const matchesObserved = observedFilter === "all" || policy.observed_state === observedFilter;
      const matchesType = typeFilter === "all" || policy.policy_type === typeFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          policy.policy_name,
          policy.policy_id,
          policy.headend,
          policy.endpoint,
          policy.source_target,
          policy.source_target_role ?? "",
          policy.policy_type,
          ...policy.notes,
          ...policy.candidate_paths.flatMap((candidatePath) => [
            candidatePath.name,
            ...(candidatePath.notes ?? []),
          ]),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesHealth && matchesSupport && matchesObserved && matchesType && matchesSearch;
    });
  }, [items, healthFilter, observedFilter, searchValue, supportFilter, typeFilter]);
  const sortedPolicies = useMemo(() => {
    const healthOrder = { healthy: 0, degraded: 1, down: 2, unknown: 3 };
    const supportOrder = {
      supported: 0,
      partially_supported: 1,
      unknown: 2,
      not_implemented_in_platform: 3,
      unsupported: 4,
    };
    const observedOrder = { active: 0, inactive: 1, degraded: 2, unknown: 3 };

    return [...filteredPolicies].sort((left, right) => {
      switch (sortBy) {
        case "name":
          return left.policy_name.localeCompare(right.policy_name);
        case "endpoint":
          return left.endpoint.localeCompare(right.endpoint);
        case "source_target":
          return left.source_target.localeCompare(right.source_target);
        case "support_then_name":
          return (
            (supportOrder[left.support_state] ?? 99) - (supportOrder[right.support_state] ?? 99) ||
            left.policy_name.localeCompare(right.policy_name)
          );
        case "observed_then_name":
          return (
            (observedOrder[left.observed_state] ?? 99) - (observedOrder[right.observed_state] ?? 99) ||
            left.policy_name.localeCompare(right.policy_name)
          );
        default:
          return (
            (healthOrder[left.health_state] ?? 99) - (healthOrder[right.health_state] ?? 99) ||
            left.policy_name.localeCompare(right.policy_name)
          );
      }
    });
  }, [filteredPolicies, sortBy]);
  const selectedPolicy =
    sortedPolicies.find((policy) => policy.policy_id === selectedPolicyId) ?? sortedPolicies[0] ?? null;
  const detailCoveragePercentage =
    data && data.observed_policy_count > 0
      ? Math.round((data.count / data.observed_policy_count) * 100)
      : 0;
  const evidenceGapCount = data ? Math.max(data.observed_policy_count - data.count, 0) : 0;
  const currentPosture = hasObservedPolicies
    ? "Observed Detail"
    : data?.empty_reason === "per_policy_details_unavailable"
      ? "Detail Limited"
      : "Live Empty";

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
        <span>Detail mode: {formatLabel(data.detail_mode)}</span>
        <span>Detail records: {data.count}</span>
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
          <p className="summary-label">Detail Coverage</p>
          <strong>{detailCoveragePercentage}%</strong>
          <p>
            Detailed records: {data.count} of {data.observed_policy_count} observed policies.
          </p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Observed Policies</p>
          <strong>{data.observed_policy_count}</strong>
          <p>
            Active: {data.active_policy_count} • Static: {data.static_policy_count} • BGP:{" "}
            {data.bgp_policy_count}
          </p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Current Posture</p>
          <strong>{currentPosture}</strong>
          <p>
            {hasObservedPolicies
              ? "The bounded live slice has per-policy records to inspect."
              : data.empty_reason === "per_policy_details_unavailable"
                ? "Policies are counted, but the current bounded path could not derive per-policy detail records."
                : "The bounded live slice is healthy, but it currently contains no SR policy records."}
          </p>
        </article>
      </div>

      {evidenceGapCount > 0 ? (
        <div className="callout">
          <strong>Evidence gap remains explicit</strong>
          <p>
            The platform currently observes {data.observed_policy_count} policies but only has{" "}
            {data.count} detailed records. This is expected when the current bounded path can count
            policy presence but not derive stable per-policy detail for every observed type.
          </p>
        </div>
      ) : null}

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
            <li>
              <span>Detail mode</span>
              <strong>{formatLabel(data.detail_mode)}</strong>
            </li>
            <li>
              <span>Empty reason</span>
              <strong>{formatLabel(data.empty_reason)}</strong>
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
              <span>Observed policies</span>
              <strong>{data.observed_policy_count}</strong>
            </li>
            <li>
              <span>Active policies</span>
              <strong>
                {data.active_policy_count}
              </strong>
            </li>
            <li>
              <span>Static / BGP policies</span>
              <strong>{data.static_policy_count} / {data.bgp_policy_count}</strong>
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
              <span>Observed inactive</span>
              <strong>{observedStateCounts.inactive ?? 0}</strong>
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
        <article className="detail-card">
          <h3>Type And Support Mix</h3>
          <ul className="compact-list">
            <li>
              <span>Static local</span>
              <strong>{policyTypeCounts.static_local ?? 0}</strong>
            </li>
            <li>
              <span>Static non-local</span>
              <strong>{policyTypeCounts.static_non_local ?? 0}</strong>
            </li>
            <li>
              <span>Partially supported</span>
              <strong>{supportCounts.partially_supported ?? 0}</strong>
            </li>
            <li>
              <span>Unsupported</span>
              <strong>{supportCounts.unsupported ?? 0}</strong>
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
            placeholder="policy, endpoint, source target, type, or note"
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
        <label className="field-group">
          <span>Support state</span>
          <select
            value={supportFilter}
            onChange={(event) => setSupportFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="supported">Supported</option>
            <option value="partially_supported">Partially supported</option>
            <option value="unsupported">Unsupported</option>
            <option value="unknown">Unknown</option>
            <option value="not_implemented_in_platform">Not implemented</option>
          </select>
        </label>
        <label className="field-group">
          <span>Observed state</span>
          <select
            value={observedFilter}
            onChange={(event) => setObservedFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="degraded">Degraded</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
        <label className="field-group">
          <span>Policy type</span>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="all">All</option>
            <option value="static_local">Static local</option>
            <option value="static_non_local">Static non-local</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
        <label className="field-group">
          <span>Sort</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="health_then_name">Health then name</option>
            <option value="support_then_name">Support then name</option>
            <option value="observed_then_name">Observed then name</option>
            <option value="name">Name</option>
            <option value="endpoint">Endpoint</option>
            <option value="source_target">Source target</option>
          </select>
        </label>
      </div>

      {data.items.length === 0 ? (
        <EmptyState
          title={
            data.empty_reason === "per_policy_details_unavailable"
              ? "Per-policy details are not currently available"
              : "No SR policies currently observed"
          }
          description={
            data.empty_reason === "per_policy_details_unavailable"
              ? `The live policy slice counted ${data.observed_policy_count} observed policies across ${data.observed_target_count} targets, but the current bounded detail path could not derive per-policy records for the observed policy types.`
              : `The live policy slice observed ${data.observed_target_count} targets and ${data.policy_capable_target_count} policy-capable nodes, but no SR policy records are currently present in the lab.`
          }
        />
      ) : filteredPolicies.length === 0 ? (
        <EmptyState
          title="No policies match the current filter"
          description="Adjust the filters or search text to widen the current policy inventory view."
        />
      ) : (
        <>
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Policy</th>
                  <th>Type</th>
                  <th>Observed On</th>
                  <th>Headend</th>
                  <th>Endpoint</th>
                  <th>Intent</th>
                  <th>Observed</th>
                  <th>Support</th>
                  <th>Health</th>
                </tr>
              </thead>
              <tbody>
                {sortedPolicies.map((policy) => {
                  const isSelected = selectedPolicy?.policy_id === policy.policy_id;
                  return (
                    <tr key={policy.policy_id} className={isSelected ? "data-row-selected" : undefined}>
                      <td>
                        <button
                          type="button"
                          className="table-select"
                          onClick={() => setSelectedPolicyId(policy.policy_id)}
                        >
                          <strong>{policy.policy_name}</strong>
                        </button>
                        <div className="table-note">
                          {policy.policy_id} • color {policy.color} •{" "}
                          {policy.candidate_paths.length} candidate paths
                        </div>
                      </td>
                      <td>{formatLabel(policy.policy_type)}</td>
                      <td>
                        {policy.source_target}
                        <div className="table-note">
                          {policy.source_target_role ?? "unknown role"}
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {selectedPolicy ? (
            <div className="content-grid">
              <article className="detail-card">
                <h3>Selected Policy Detail</h3>
                <div className="metadata-row">
                  <span>Policy: {selectedPolicy.policy_name}</span>
                  <span>Type: {formatLabel(selectedPolicy.policy_type)}</span>
                  <span>Source target: {selectedPolicy.source_target}</span>
                  <span>Role: {selectedPolicy.source_target_role ?? "unknown"}</span>
                </div>
                <div className="content-grid">
                  <div>
                    <p className="summary-label">Operational Semantics</p>
                    <ul className="compact-list">
                      <li>
                        <span>Intent state</span>
                        <StatusPill value={selectedPolicy.intent_state} />
                      </li>
                      <li>
                        <span>Observed state</span>
                        <StatusPill value={selectedPolicy.observed_state} />
                      </li>
                      <li>
                        <span>Support state</span>
                        <StatusPill value={selectedPolicy.support_state} />
                      </li>
                      <li>
                        <span>Health state</span>
                        <StatusPill value={selectedPolicy.health_state} />
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="summary-label">Identity And Scope</p>
                    <ul className="compact-list">
                      <li>
                        <span>Policy ID</span>
                        <strong>{selectedPolicy.policy_id}</strong>
                      </li>
                      <li>
                        <span>Headend</span>
                        <strong>{selectedPolicy.headend}</strong>
                      </li>
                      <li>
                        <span>Endpoint</span>
                        <strong>{selectedPolicy.endpoint}</strong>
                      </li>
                      <li>
                        <span>Color</span>
                        <strong>{selectedPolicy.color}</strong>
                      </li>
                    </ul>
                  </div>
                </div>
                <p className="summary-label">Candidate Path Evidence</p>
                {selectedPolicy.candidate_paths.length === 0 ? (
                  <p className="footnote">
                    No candidate-path detail is currently available for this bounded policy record.
                  </p>
                ) : (
                  <ul className="notes-list">
                    {selectedPolicy.candidate_paths.map((candidatePath) => (
                      <li key={`${selectedPolicy.policy_id}-${candidatePath.name}`}>
                        <strong>{candidatePath.name}</strong> -{" "}
                        {formatLabel(candidatePath.path_state)}
                        {candidatePath.preference === null ? "" : `, pref ${candidatePath.preference}`}
                        {candidatePath.notes.length > 0
                          ? `, ${candidatePath.notes.join(", ")}`
                          : ""}
                      </li>
                    ))}
                  </ul>
                )}
                {selectedPolicy.notes.length > 0 ? (
                  <>
                    <p className="summary-label">Record Notes</p>
                    <ul className="notes-list">
                      {selectedPolicy.notes.map((note) => (
                        <li key={`${selectedPolicy.policy_id}-${note}`}>{note}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </article>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
