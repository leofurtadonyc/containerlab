import { ErrorState, LoadingState } from "../../components/query-states";
import { ApiClientError } from "../../api/client";
import type {
  TopologyObjectEvidenceDeltaCategory,
  TopologyObjectEvidenceDeltaComparisonStatus,
} from "../../api/contracts";
import { formatDateTime, formatLabel } from "../../lib/presentation";
import { navigateToPoliciesPolicyEvidenceDeltaFocus } from "../../lib/topology-policy-navigation";
import { useTopologyObjectEvidenceDeltaQuery } from "./api";

export interface TopologyObjectEvidenceDeltaPanelProps {
  objectId: string;
  objectKind: "node" | "link";
}

function comparisonStatusLabel(status: TopologyObjectEvidenceDeltaComparisonStatus): string {
  const labels: Record<TopologyObjectEvidenceDeltaComparisonStatus, string> = {
    delta_ready: "Read-side comparison ready",
    no_comparable_anchor: "No comparable persisted anchor",
    insufficient_evidence: "Insufficient evidence to load anchor",
  };
  return labels[status];
}

function deltaCategoryLabel(category: TopologyObjectEvidenceDeltaCategory): string {
  const labels: Record<TopologyObjectEvidenceDeltaCategory, string> = {
    related_policy_set_change: "Related policy set",
    failure_impact_rollup_change: "Failure-impact rollups",
    related_member_degraded_policy_change: "Related member degraded policy (v1)",
    topology_row_observation_change: "Topology row (bounded fields)",
    risk_summary_ranking_inputs_change: "Risk-summary ranking inputs (D/U/R/K)",
    topology_snapshot_caveat_echo_change: "Caveat / completeness echo",
    no_comparable_fields: "No comparable fields",
    gap_note: "Gap or not comparable",
  };
  return labels[category] ?? formatLabel(category);
}

export function TopologyObjectEvidenceDeltaPanel({ objectId, objectKind }: TopologyObjectEvidenceDeltaPanelProps) {
  const { data, error, isLoading, isRefreshing, reload } = useTopologyObjectEvidenceDeltaQuery(objectId, true);

  if (!objectId) {
    return null;
  }

  if (isLoading && !data) {
    return (
      <article id="topology-object-evidence-delta" className="detail-card">
        <h3>Topology object evidence delta</h3>
        <p className="footnote">
          Grouped read-side difference between the current topology-object assembly and the previous persisted
          topology plus policy snapshot pair when history allows—<strong>not</strong> drift detection, pairing proof,
          or blast-radius simulation.
        </p>
        <LoadingState label="Loading bounded topology object evidence delta (read-only assembly)…" />
      </article>
    );
  }

  if (error) {
    const isNotFound = error instanceof ApiClientError && error.status === 404;
    return (
      <article id="topology-object-evidence-delta" className="detail-card">
        <h3>Topology object evidence delta</h3>
        <p className="footnote">
          Grouped read-side difference hints—<strong>not</strong> topology drift truth, SLA impact, or global ranking.
        </p>
        {isNotFound ? (
          <div className="query-message">
            <strong>Evidence delta not available for this object</strong>
            <p>
              The object id is not a known node or link in the current normalized topology snapshot. See related
              policies for identity authority.
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

  const {
    safety_framing,
    scope_summary,
    comparison_status,
    current_anchor,
    previous_anchor,
    delta_items,
    member_policy_delta_pointers,
    caveats,
  } = data;
  const unknownOrGap =
    comparison_status === "no_comparable_anchor" || comparison_status === "insufficient_evidence";

  return (
    <article id="topology-object-evidence-delta" className="detail-card">
      <h3>Topology object evidence delta</h3>
      {isRefreshing ? (
        <p className="table-note" role="status">
          Refreshing topology object evidence delta…
        </p>
      ) : null}
      <p className="footnote">{safety_framing.summary_disclaimer}</p>
      <p className="summary-label">Scope</p>
      <p className="footnote">{scope_summary}</p>

      <p className="summary-label">Comparison status</p>
      <p className="footnote">
        <strong>{comparisonStatusLabel(comparison_status)}</strong>
        {unknownOrGap ? (
          <>
            {" "}
            — anchored read-side comparison is not fully available; see delta items and caveats below.
          </>
        ) : null}
      </p>

      <p className="summary-label">Subject</p>
      <div className="key-value-list">
        <div className="key-value-row">
          <span>object_kind</span>
          <strong>{formatLabel(objectKind)}</strong>
        </div>
        <div className="key-value-row">
          <span>object_id</span>
          <strong>{data.object_id}</strong>
        </div>
      </div>

      <p className="summary-label">Anchors</p>
      <div className="key-value-list">
        <div className="key-value-row">
          <span>Current (topology object assembly)</span>
          <strong>{formatDateTime(current_anchor.generated_at)}</strong>
        </div>
        <div className="key-value-row">
          <span>Current reference</span>
          <strong>{current_anchor.reference}</strong>
        </div>
        {previous_anchor ? (
          <>
            <div className="key-value-row">
              <span>Previous topology snapshot id</span>
              <strong>{previous_anchor.topology_snapshot_id}</strong>
            </div>
            <div className="key-value-row">
              <span>Topology persisted at</span>
              <strong>{formatDateTime(previous_anchor.topology_persisted_at)}</strong>
            </div>
            <div className="key-value-row">
              <span>Previous policy snapshot id</span>
              <strong>{previous_anchor.policy_snapshot_id}</strong>
            </div>
            <div className="key-value-row">
              <span>Policy persisted at</span>
              <strong>{formatDateTime(previous_anchor.policy_persisted_at)}</strong>
            </div>
          </>
        ) : (
          <div className="key-value-row">
            <span>Previous anchor pair</span>
            <strong>Not loaded</strong>
          </div>
        )}
      </div>

      <p className="summary-label">Contract</p>
      <div className="key-value-list">
        <div className="key-value-row">
          <span>Delta contract</span>
          <strong>{data.contract_id}</strong>
        </div>
        <div className="key-value-row">
          <span>Authority posture</span>
          <strong>{formatLabel(safety_framing.authority_posture)}</strong>
        </div>
      </div>

      <p className="summary-label">Explicit non-claims</p>
      <ul className="notes-list">
        {safety_framing.explicit_non_claims.map((claim) => (
          <li key={claim}>{formatLabel(claim)}</li>
        ))}
      </ul>

      <p className="summary-label">Delta categories (sparse)</p>
      {delta_items.length === 0 ? (
        <p className="footnote">No delta rows were returned.</p>
      ) : (
        <ul className="notes-list">
          {delta_items.map((item, i) => (
            <li key={`${item.category}-${i}`}>
              <strong>{deltaCategoryLabel(item.category)}</strong>
              {" — "}
              {item.summary}
              {item.detail ? (
                <>
                  {" "}
                  <span className="table-note">{item.detail}</span>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {member_policy_delta_pointers.length > 0 ? (
        <>
          <p className="summary-label">Per-member policy delta pointers</p>
          <p className="table-note">
            Authoritative per-policy deltas live on Policies—open a member when you need full policy_id depth.
          </p>
          <ul className="notes-list">
            {member_policy_delta_pointers.map((p) => (
              <li key={p.policy_id}>
                <button
                  type="button"
                  className="inline-action"
                  onClick={() => navigateToPoliciesPolicyEvidenceDeltaFocus(p.policy_id)}
                  title="Open Policies with policy evidence delta focus"
                >
                  {p.policy_id}
                </button>
                <span className="table-note"> — {formatLabel(p.comparison_status)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {caveats.length > 0 ? (
        <>
          <p className="summary-label">Caveats</p>
          <ul className="notes-list">
            {caveats.map((c, i) => (
              <li key={`caveat-${i}`}>{c}</li>
            ))}
          </ul>
        </>
      ) : null}

      <p className="summary-label">Response metadata</p>
      <div className="key-value-list">
        <div className="key-value-row">
          <span>API generated at</span>
          <strong>{formatDateTime(data.metadata.generated_at)}</strong>
        </div>
      </div>
    </article>
  );
}
