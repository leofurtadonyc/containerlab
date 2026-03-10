import { useMemo, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import { countBy, formatDateTime, formatLabel } from "../../lib/presentation";
import { usePoliciesQuery } from "./api";

function buildFreshnessSummary(observedAt: string | null, generatedAt: string) {
  if (!observedAt) {
    return {
      label: "Unknown",
      detail: "The policy response does not currently include an observed timestamp.",
    };
  }

  const observedDate = new Date(observedAt);
  const generatedDate = new Date(generatedAt);

  if (Number.isNaN(observedDate.getTime()) || Number.isNaN(generatedDate.getTime())) {
    return {
      label: "Unclear",
      detail: "The policy timestamps could not be interpreted in the current browser.",
    };
  }

  const ageMinutes = Math.max(0, Math.round((generatedDate.getTime() - observedDate.getTime()) / 60000));
  if (ageMinutes <= 5) {
    return {
      label: "Fresh",
      detail: `Observed ${ageMinutes} minute${ageMinutes === 1 ? "" : "s"} before the API response was generated.`,
    };
  }
  if (ageMinutes <= 30) {
    return {
      label: "Aging",
      detail: `Observed ${ageMinutes} minute${ageMinutes === 1 ? "" : "s"} before the API response was generated.`,
    };
  }
  return {
    label: "Stale",
    detail: `Observed ${ageMinutes} minute${ageMinutes === 1 ? "" : "s"} before the API response was generated.`,
  };
}

function describeSupportState(value: string): string {
  switch (value) {
    case "supported":
      return "The bounded platform path can interpret this record shape without known support gaps.";
    case "partially_supported":
      return "The platform can expose useful evidence, but some policy semantics remain intentionally incomplete.";
    case "unsupported":
      return "The current bounded platform path does not support this policy record shape.";
    case "not_implemented_in_platform":
      return "The platform recognizes the state category, but this bounded read-only slice does not model it yet.";
    default:
      return "The current bounded slice cannot yet determine complete support semantics for this record.";
  }
}

function formatRoleCoverage(roleCounts: Record<string, number>): string {
  const entries = Object.entries(roleCounts).filter(([, count]) => count > 0);
  if (entries.length === 0) {
    return "No role coverage is currently available.";
  }
  return entries
    .sort(([leftRole], [rightRole]) => leftRole.localeCompare(rightRole))
    .map(([role, count]) => `${formatLabel(role)}: ${count}`)
    .join(" • ");
}

function formatSignedDelta(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }
  return `${value}`;
}

export function PoliciesView() {
  const { data, error, isLoading, reload } = usePoliciesQuery();
  const [healthFilter, setHealthFilter] = useState("all");
  const [supportFilter, setSupportFilter] = useState("all");
  const [observedFilter, setObservedFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourceRoleFilter, setSourceRoleFilter] = useState("all");
  const [candidatePathFilter, setCandidatePathFilter] = useState("all");
  const [sortBy, setSortBy] = useState("health_then_name");
  const [searchValue, setSearchValue] = useState("");
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const items = data?.items ?? [];
  const healthCounts = countBy(items, (policy) => policy.health_state);
  const observedStateCounts = countBy(items, (policy) => policy.observed_state);
  const supportCounts = countBy(items, (policy) => policy.support_state);
  const policyTypeCounts = countBy(items, (policy) => policy.policy_type);
  const candidatePathPostureCounts = countBy(items, (policy) =>
    policy.candidate_paths.length > 0 ? "with_candidate_paths" : "without_candidate_paths",
  );
  const hasObservedPolicies = items.length > 0;
  const freshness = useMemo(
    () => buildFreshnessSummary(data?.observed_at ?? null, data?.generated_at ?? ""),
    [data?.generated_at, data?.observed_at],
  );
  const filteredPolicies = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return items.filter((policy) => {
      const matchesHealth = healthFilter === "all" || policy.health_state === healthFilter;
      const matchesSupport = supportFilter === "all" || policy.support_state === supportFilter;
      const matchesObserved = observedFilter === "all" || policy.observed_state === observedFilter;
      const matchesType = typeFilter === "all" || policy.policy_type === typeFilter;
      const matchesSourceRole =
        sourceRoleFilter === "all" || (policy.source_target_role ?? "unknown") === sourceRoleFilter;
      const matchesCandidatePaths =
        candidatePathFilter === "all" ||
        (candidatePathFilter === "with_candidate_paths"
          ? policy.candidate_paths.length > 0
          : policy.candidate_paths.length === 0);
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

      return (
        matchesHealth &&
        matchesSupport &&
        matchesObserved &&
        matchesType &&
        matchesSourceRole &&
        matchesCandidatePaths &&
        matchesSearch
      );
    });
  }, [
    items,
    candidatePathFilter,
    healthFilter,
    observedFilter,
    searchValue,
    sourceRoleFilter,
    supportFilter,
    typeFilter,
  ]);
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
        case "candidate_paths_then_name":
          return (
            right.candidate_paths.length - left.candidate_paths.length ||
            left.policy_name.localeCompare(right.policy_name)
          );
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

  const comparison = data.history.comparison_to_previous;

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
          <p>{formatRoleCoverage(data.observed_target_role_counts)}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Policy-Capable Targets</p>
          <strong>{data.policy_capable_target_count}</strong>
          <p>{formatRoleCoverage(data.policy_capable_target_role_counts)}</p>
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
            Active: {data.active_policy_count} • Static local: {data.static_local_policy_count} •
            Static non-local: {data.static_non_local_policy_count} • BGP: {data.bgp_policy_count}
          </p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Counter Footprint</p>
          <strong>{data.ttm_preference_count}</strong>
          <p>
            TTM preferences • Binding SIDs: {data.binding_sid_count} • SRv6 binding SIDs:{" "}
            {data.srv6_binding_sid_count}
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
        <article className="summary-card">
          <p className="summary-label">Freshness</p>
          <strong>{freshness.label}</strong>
          <p>{freshness.detail}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">History Status</p>
          <strong>{formatLabel(data.history.status)}</strong>
          <p>{data.history.summary}</p>
        </article>
      </div>

      {data.data_status === "degraded" ? (
        <div className="callout">
          <strong>Degraded live policy visibility remains explicit</strong>
          <p>
            The current policy response is available, but one or more targets returned partial or
            degraded observations. The page continues to surface that bounded state rather than
            hiding it behind optimistic summaries.
          </p>
        </div>
      ) : null}

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
            <li>
              <span>Freshness posture</span>
              <strong>{freshness.label}</strong>
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
              <span>Observed target roles</span>
              <strong>{formatRoleCoverage(data.observed_target_role_counts)}</strong>
            </li>
            <li>
              <span>Policy-capable roles</span>
              <strong>{formatRoleCoverage(data.policy_capable_target_role_counts)}</strong>
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
              <span>Static local / non-local / BGP</span>
              <strong>
                {data.static_local_policy_count} / {data.static_non_local_policy_count} /{" "}
                {data.bgp_policy_count}
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
          <h3>Observation Footprint</h3>
          <ul className="compact-list">
            <li>
              <span>TTM preferences</span>
              <strong>{data.ttm_preference_count}</strong>
            </li>
            <li>
              <span>Binding SIDs allocated</span>
              <strong>{data.binding_sid_count}</strong>
            </li>
            <li>
              <span>SRv6 binding SIDs allocated</span>
              <strong>{data.srv6_binding_sid_count}</strong>
            </li>
            <li>
              <span>With candidate paths</span>
              <strong>{candidatePathPostureCounts.with_candidate_paths ?? 0}</strong>
            </li>
            <li>
              <span>Without candidate paths</span>
              <strong>{candidatePathPostureCounts.without_candidate_paths ?? 0}</strong>
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <h3>Type And Support Mix</h3>
          <ul className="compact-list">
            <li>
              <span>Detailed static local</span>
              <strong>{policyTypeCounts.static_local ?? 0}</strong>
            </li>
            <li>
              <span>Detailed static non-local</span>
              <strong>{policyTypeCounts.static_non_local ?? 0}</strong>
            </li>
            <li>
              <span>Observed static total</span>
              <strong>{data.static_policy_count}</strong>
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
        <article className="detail-card">
          <h3>Support Semantics</h3>
          <p>
            Support states describe how much of the observed policy record the current bounded
            platform path can interpret, not whether the network itself is healthy or complete.
          </p>
          <ul className="notes-list">
            <li>
              <strong>Supported:</strong> the current bounded slice can interpret the record
              shape without known support gaps.
            </li>
            <li>
              <strong>Partially supported:</strong> the page has useful evidence, but some
              policy semantics remain intentionally incomplete.
            </li>
            <li>
              <strong>Unknown or not implemented:</strong> the platform still makes those gaps
              explicit instead of pretending the record is fully understood.
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <h3>Persisted Comparison</h3>
          <p>{data.history.summary}</p>
          {comparison ? (
            <>
              <ul className="compact-list">
                <li>
                  <span>Current / previous persisted</span>
                  <strong>
                    {formatDateTime(comparison.current_persisted_at)} /{" "}
                    {formatDateTime(comparison.previous_persisted_at)}
                  </strong>
                </li>
                <li>
                  <span>Observed policy delta</span>
                  <strong>{formatSignedDelta(comparison.observed_policy_delta)}</strong>
                </li>
                <li>
                  <span>Detailed record delta</span>
                  <strong>{formatSignedDelta(comparison.detail_record_delta)}</strong>
                </li>
                <li>
                  <span>Added / removed detailed policies</span>
                  <strong>
                    {comparison.added_policy_count} / {comparison.removed_policy_count}
                  </strong>
                </li>
                <li>
                  <span>Changed detailed policies</span>
                  <strong>{comparison.changed_policy_count}</strong>
                </li>
              </ul>
              {comparison.notes.length > 0 ? (
                <ul className="notes-list">
                  {comparison.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : (
            <p className="footnote">
              Bounded comparison is only available once at least two persisted normalized policy
              snapshots exist.
            </p>
          )}
        </article>
        <article className="detail-card">
          <h3>Recent Persisted Snapshots</h3>
          {data.history.recent_snapshots.length > 0 ? (
            <ul className="notes-list">
              {data.history.recent_snapshots.map((entry) => (
                <li key={entry.persisted_at}>
                  <strong>{formatDateTime(entry.persisted_at)}</strong>
                  {" • "}
                  {formatLabel(entry.data_status)}
                  {" • observed "}
                  {entry.observed_policy_count}
                  {" • detail "}
                  {entry.detail_record_count}
                  {" • "}
                  {formatLabel(entry.detail_mode)}
                  {entry.observed_at ? ` • observed at ${formatDateTime(entry.observed_at)}` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="footnote">
              No persisted normalized policy snapshots are currently available for this bounded view.
            </p>
          )}
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
          <span>Source role</span>
          <select
            value={sourceRoleFilter}
            onChange={(event) => setSourceRoleFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="pe">PE</option>
            <option value="p">P</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
        <label className="field-group">
          <span>Candidate paths</span>
          <select
            value={candidatePathFilter}
            onChange={(event) => setCandidatePathFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="with_candidate_paths">With candidate paths</option>
            <option value="without_candidate_paths">Without candidate paths</option>
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
            <option value="candidate_paths_then_name">Candidate paths then name</option>
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
                  <article>
                    <p className="summary-label">Operational Semantics</p>
                    <div className="key-value-list">
                      <div className="key-value-row">
                        <span>Intent state</span>
                        <strong>
                          <StatusPill value={selectedPolicy.intent_state} />
                        </strong>
                      </div>
                      <div className="key-value-row">
                        <span>Observed state</span>
                        <strong>
                          <StatusPill value={selectedPolicy.observed_state} />
                        </strong>
                      </div>
                      <div className="key-value-row">
                        <span>Support state</span>
                        <strong>
                          <StatusPill value={selectedPolicy.support_state} />
                        </strong>
                      </div>
                      <div className="key-value-row">
                        <span>Health state</span>
                        <strong>
                          <StatusPill value={selectedPolicy.health_state} />
                        </strong>
                      </div>
                    </div>
                    <p className="footnote">{describeSupportState(selectedPolicy.support_state)}</p>
                  </article>
                  <article>
                    <p className="summary-label">Identity And Scope</p>
                    <div className="key-value-list">
                      <div className="key-value-row">
                        <span>Policy ID</span>
                        <strong>{selectedPolicy.policy_id}</strong>
                      </div>
                      <div className="key-value-row">
                        <span>Headend</span>
                        <strong>{selectedPolicy.headend}</strong>
                      </div>
                      <div className="key-value-row">
                        <span>Endpoint</span>
                        <strong>{selectedPolicy.endpoint}</strong>
                      </div>
                      <div className="key-value-row">
                        <span>Color</span>
                        <strong>{selectedPolicy.color}</strong>
                      </div>
                      <div className="key-value-row">
                        <span>Source target</span>
                        <strong>{selectedPolicy.source_target}</strong>
                      </div>
                      <div className="key-value-row">
                        <span>Source role</span>
                        <strong>{selectedPolicy.source_target_role ?? "unknown"}</strong>
                      </div>
                    </div>
                  </article>
                </div>
                <p className="summary-label">Snapshot Context</p>
                <div className="key-value-list">
                  <div className="key-value-row">
                    <span>Observed timestamp</span>
                    <strong>{formatDateTime(data.observed_at)}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Generated timestamp</span>
                    <strong>{formatDateTime(data.generated_at)}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Freshness posture</span>
                    <strong>{freshness.label}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Detail mode</span>
                    <strong>{formatLabel(data.detail_mode)}</strong>
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
                        <strong>{candidatePath.name}</strong> - {formatLabel(candidatePath.path_state)}
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
