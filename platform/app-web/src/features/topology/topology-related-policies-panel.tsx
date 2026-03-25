import { ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import {
  PolicyImpactSummaryBlock,
  PolicyImpactSummaryIntro,
} from "../../components/policy-impact-summary";
import { ApiClientError } from "../../api/client";
import type { PoliciesListResponse, TopologyObjectKind, TopologyRelatedPolicyReference } from "../../api/contracts";
import { buildDegradedPolicyV1ListRowHint, formatLabel } from "../../lib/presentation";
import { navigateToPolicyDossierWorkspace } from "../../lib/policy-dossier-navigation";
import { navigateToServiceExplorerForPolicy } from "../../lib/service-explorer-navigation";
import { navigateToServiceDossierForPolicy } from "../../lib/service-dossier-navigation";
import { navigateToPoliciesPolicy, navigateToPoliciesPolicyPathAnalysis } from "../../lib/topology-policy-navigation";
import { useTopologyRelatedPoliciesQuery } from "./api";

export interface TopologyRelatedPoliciesPanelProps {
  objectId: string;
  objectKind: TopologyObjectKind;
  policiesList: PoliciesListResponse | null;
}

function enrichPolicyInventoryRow(
  policyId: string,
  policiesList: PoliciesListResponse | null,
): {
  health: string | null;
  observed: string | null;
  degradedPosture: string | null;
  degradedHint: string | null;
} {
  const row = policiesList?.items.find((p) => p.policy_id === policyId);
  if (!row) {
    return { health: null, observed: null, degradedPosture: null, degradedHint: null };
  }
  return {
    health: row.health_state,
    observed: row.observed_state,
    degradedPosture: row.degraded_policy_v1.posture,
    degradedHint: buildDegradedPolicyV1ListRowHint(row),
  };
}

function impactFields(item: TopologyRelatedPolicyReference) {
  return {
    relationship_kind: item.relationship_kind,
    matched_field: item.matched_field,
    matched_policy_value: item.matched_policy_value,
    matched_topology_identifier: item.matched_topology_identifier,
    anchor_topology_node_id: item.anchor_topology_node_id,
    evidence_source: item.evidence_source,
    caveats: item.caveats,
  };
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
      <PolicyImpactSummaryIntro />
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
            const { health, observed, degradedPosture, degradedHint } = enrichPolicyInventoryRow(
              item.policy_id,
              policiesList,
            );
            return (
              <li key={`${item.policy_id}-${item.matched_field}-${item.matched_topology_identifier}`}>
                <p className="summary-label">
                  {item.policy_name} <span className="table-note">({item.policy_id})</span>
                </p>
                <div className="key-value-list">
                  <div className="key-value-row">
                    <span>Type</span>
                    <strong>{formatLabel(item.policy_type)}</strong>
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
                  <div className="key-value-row">
                    <span>Degraded policy (v1)</span>
                    <span>
                      {degradedPosture && degradedHint ? (
                        <>
                          <StatusPill value={degradedPosture} />
                          <span className="table-note"> {degradedHint}</span>
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
                <PolicyImpactSummaryBlock fields={impactFields(item)} />
                <p>
                  <button
                    type="button"
                    className="table-select"
                    onClick={() => navigateToPoliciesPolicy(item.policy_id)}
                  >
                    Open policy details
                  </button>{" "}
                  <button
                    type="button"
                    className="inline-action"
                    onClick={() => navigateToPoliciesPolicyPathAnalysis(item.policy_id)}
                  >
                    Path analysis
                  </button>
                  <button
                    type="button"
                    className="inline-action"
                    onClick={() =>
                      navigateToPolicyDossierWorkspace(item.policy_id, "topology_related_policies_panel")
                    }
                  >
                    Policy dossier
                  </button>
                  <button
                    type="button"
                    className="inline-action"
                    onClick={() => navigateToServiceExplorerForPolicy(item.policy_id)}
                  >
                    Service Explorer
                  </button>
                  <button
                    type="button"
                    className="inline-action"
                    onClick={() => navigateToServiceDossierForPolicy(item.policy_id)}
                    title="service_dossier_v1 for policy:… — same service_id anchor as Service Explorer"
                  >
                    Service dossier
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
