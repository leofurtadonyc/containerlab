import { ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import { ApiClientError } from "../../api/client";
import type { PoliciesListResponse, TopologyObjectKind } from "../../api/contracts";
import { formatLabel } from "../../lib/presentation";
import { navigateToPoliciesPolicy } from "../../lib/topology-policy-navigation";
import { useTopologyRelatedPoliciesQuery } from "./api";

export interface TopologyRelatedPoliciesPanelProps {
  objectId: string;
  objectKind: TopologyObjectKind;
  policiesList: PoliciesListResponse | null;
}

function enrichHealth(
  policyId: string,
  policiesList: PoliciesListResponse | null,
): { health: string | null; observed: string | null } {
  const row = policiesList?.items.find((p) => p.policy_id === policyId);
  if (!row) {
    return { health: null, observed: null };
  }
  return { health: row.health_state, observed: row.observed_state };
}

export function TopologyRelatedPoliciesPanel({
  objectId,
  objectKind,
  policiesList,
}: TopologyRelatedPoliciesPanelProps) {
  const { data, error, isLoading, isRefreshing, reload } = useTopologyRelatedPoliciesQuery(objectId);

  if (isLoading && !data) {
    return (
      <article className="detail-card">
        <h3>Related policies</h3>
        <LoadingState label="Loading policies related to this topology object…" />
      </article>
    );
  }

  if (error) {
    const isNotFound = error instanceof ApiClientError && error.status === 404;
    return (
      <article className="detail-card">
        <h3>Related policies</h3>
        {isNotFound ? (
          <div className="query-message">
            <strong>No topology object for this id</strong>
            <p>
              The backend did not find this object id in the current topology snapshot. Related
              policies cannot be assembled until the node or link exists in the normalized topology
              response.
            </p>
          </div>
        ) : (
          <ErrorState error={error} onRetry={() => void reload()} />
        )}
      </article>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <article className="detail-card">
      <h3>Related policies</h3>
      {isRefreshing ? (
        <p className="table-note" role="status">
          Refreshing related policies…
        </p>
      ) : null}
      <p className="footnote">{data.derivation_summary}</p>
      <p className="table-note">
        Object: <strong>{formatLabel(objectKind)}</strong> <code>{data.object_id}</code> — string
        equality pivot only; not operational dependency or TE path truth.
      </p>
      {data.global_caveats.length > 0 ? (
        <div className="callout">
          <strong>Response caveats</strong>
          <ul className="notes-list">
            {data.global_caveats.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {data.items.length === 0 ? (
        <p className="footnote">
          No policy inventory records matched this topology object using the bounded string fields
          (headend, endpoint, source_target versus node identifiers).
        </p>
      ) : (
        <ul className="notes-list">
          {data.items.map((item) => {
            const { health, observed } = enrichHealth(item.policy_id, policiesList);
            return (
              <li key={`${item.policy_id}-${item.matched_field}-${item.matched_topology_identifier}`}>
                <div className="key-value-list">
                  <div className="key-value-row">
                    <span>Policy</span>
                    <strong>{item.policy_name}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Policy id</span>
                    <strong>{item.policy_id}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Type</span>
                    <strong>{formatLabel(item.policy_type)}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Relationship</span>
                    <strong>{formatLabel(item.relationship_kind)}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Matched field</span>
                    <strong>{item.matched_field}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Health / observed</span>
                    <span>
                      {health && observed ? (
                        <>
                          <StatusPill value={health} /> / <StatusPill value={observed} />
                        </>
                      ) : (
                        <span className="table-note">
                          Not present in the current policies list response (list may be truncated or
                          stale versus this assembly).
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                {item.caveats.length > 0 ? (
                  <ul className="notes-list">
                    {item.caveats.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                ) : null}
                <p>
                  <button
                    type="button"
                    className="table-select"
                    onClick={() => navigateToPoliciesPolicy(item.policy_id)}
                  >
                    Open policy details
                  </button>
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
