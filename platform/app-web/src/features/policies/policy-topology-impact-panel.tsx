import { ErrorState, LoadingState } from "../../components/query-states";
import {
  PolicyImpactSummaryBlock,
  PolicyImpactSummaryIntro,
} from "../../components/policy-impact-summary";
import { ApiClientError } from "../../api/client";
import type { PolicyTopologyImpactRow } from "../../api/contracts";
import { navigateToPolicyDossierWorkspace } from "../../lib/policy-dossier-navigation";
import { formatLabel } from "../../lib/presentation";
import { navigateToTopologyObject } from "../../lib/topology-policy-navigation";
import { usePolicyTopologyImpactQuery } from "./api";

export interface PolicyTopologyImpactPanelProps {
  policyId: string;
}

function rowFields(row: PolicyTopologyImpactRow) {
  return {
    relationship_kind: row.relationship_kind,
    matched_field: row.matched_field,
    matched_policy_value: row.matched_policy_value,
    matched_topology_identifier: row.matched_topology_identifier,
    anchor_topology_node_id: row.anchor_topology_node_id,
    evidence_source: row.evidence_source,
    caveats: row.caveats,
  };
}

export function PolicyTopologyImpactPanel({ policyId }: PolicyTopologyImpactPanelProps) {
  const { data, error, isLoading, isRefreshing, reload } = usePolicyTopologyImpactQuery(policyId);

  if (isLoading && !data) {
    return (
      <article className="detail-card">
        <h3>Topology impact (naming alignment)</h3>
        <LoadingState label="Loading bounded topology relationship context…" />
      </article>
    );
  }

  if (error) {
    const isNotFound = error instanceof ApiClientError && error.status === 404;
    return (
      <article className="detail-card">
        <h3>Topology impact (naming alignment)</h3>
        {isNotFound ? (
          <div className="query-message">
            <strong>Policy not in current inventory</strong>
            <p>
              The backend could not resolve this policy id in the normalized policy snapshot, so
              topology impact rows cannot be assembled.
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
      <h3>Topology impact (naming alignment)</h3>
      {isRefreshing ? (
        <p className="table-note" role="status">
          Refreshing topology impact…
        </p>
      ) : null}
      <p className="table-note">
        <button
          type="button"
          className="inline-action"
          onClick={() => navigateToPolicyDossierWorkspace(policyId, "topology_impact_panel")}
        >
          Open policy dossier
        </button>
        <span className="table-note"> — unified path, timeline, and delta for this policy id.</span>
      </p>
      <PolicyImpactSummaryIntro />
      <p className="footnote">{data.derivation_summary}</p>
      <p className="table-note">
        Policy <strong>{data.policy_name}</strong> (<code>{data.policy_id}</code>)
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
          No topology nodes or links in the current snapshot string-align with this policy&apos;s
          headend, endpoint, or source_target fields.
        </p>
      ) : (
        <ul className="notes-list">
          {data.items.map((row) => (
            <li key={`${row.topology_object_kind}-${row.topology_object_id}-${row.matched_field}-${row.anchor_topology_node_id}`}>
              <p className="summary-label">
                {formatLabel(row.topology_object_kind)} <code>{row.topology_object_id}</code>
              </p>
              <PolicyImpactSummaryBlock fields={rowFields(row)} />
              <p>
                <button
                  type="button"
                  className="table-select"
                  onClick={() =>
                    navigateToTopologyObject(row.topology_object_id, row.topology_object_kind)
                  }
                >
                  Open in topology
                </button>
              </p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
