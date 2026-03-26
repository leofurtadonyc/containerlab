import { ErrorState, LoadingState } from "../../components/query-states";
import { ApiClientError } from "../../api/client";
import type { ServiceEvidenceDeltaCategory, ServiceEvidenceDeltaComparisonStatus } from "../../api/contracts";
import { formatDateTime, formatLabel } from "../../lib/presentation";
import { navigateToPoliciesPolicyEvidenceDeltaFocus } from "../../lib/topology-policy-navigation";
import { useServiceEvidenceDeltaQuery } from "./api";

export interface ServiceEvidenceDeltaPanelProps {
  serviceId: string;
}

function comparisonStatusLabel(status: ServiceEvidenceDeltaComparisonStatus): string {
  const labels: Record<ServiceEvidenceDeltaComparisonStatus, string> = {
    delta_ready: "Read-side comparison ready",
    no_comparable_anchor: "No comparable persisted anchor",
    insufficient_evidence: "Insufficient evidence to load anchor",
  };
  return labels[status];
}

function deltaCategoryLabel(category: ServiceEvidenceDeltaCategory): string {
  const labels: Record<ServiceEvidenceDeltaCategory, string> = {
    service_membership_change: "Membership (policy_id set)",
    degraded_service_roll_up_change: "Degraded service roll-up",
    member_degraded_policy_change: "Member degraded policy (v1)",
    topology_linkage_change: "Topology linkage",
    policy_inventory_echo_change: "Policy inventory echo",
    no_comparable_fields: "No comparable fields",
    gap_note: "Gap or not comparable",
  };
  return labels[category] ?? formatLabel(category);
}

export function ServiceEvidenceDeltaPanel({ serviceId }: ServiceEvidenceDeltaPanelProps) {
  const { data, error, isLoading, isRefreshing, reload } = useServiceEvidenceDeltaQuery(serviceId, true);

  if (!serviceId) {
    return null;
  }

  if (isLoading && !data) {
    return (
      <article id="service-evidence-delta" className="detail-card">
        <h3>Service evidence delta</h3>
        <p className="footnote">
          Grouped read-side difference between current Service Explorer detail and the previous persisted policy
          snapshot when history allows—<strong>not</strong> drift detection, SLA proof, or workflow validation.
        </p>
        <LoadingState label="Loading bounded service evidence delta (read-only assembly)…" />
      </article>
    );
  }

  if (error) {
    const isNotFound = error instanceof ApiClientError && error.status === 404;
    return (
      <article id="service-evidence-delta" className="detail-card">
        <h3>Service evidence delta</h3>
        <p className="footnote">
          Grouped read-side difference hints—<strong>not</strong> service drift truth or customer impact.
        </p>
        {isNotFound ? (
          <div className="query-message">
            <strong>Evidence delta not available for this service_id</strong>
            <p>
              The service id is not supported or has no members in the current inventory slice. See Service Explorer
              detail for membership authority.
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
    <article id="service-evidence-delta" className="detail-card">
      <h3>Service evidence delta</h3>
      {isRefreshing ? (
        <p className="table-note" role="status">
          Refreshing service evidence delta…
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

      <p className="summary-label">Anchors</p>
      <div className="key-value-list">
        <div className="key-value-row">
          <span>Current (Explorer detail)</span>
          <strong>{formatDateTime(current_anchor.generated_at)}</strong>
        </div>
        <div className="key-value-row">
          <span>Current reference</span>
          <strong>{current_anchor.reference}</strong>
        </div>
        {previous_anchor ? (
          <>
            <div className="key-value-row">
              <span>Previous snapshot id</span>
              <strong>{previous_anchor.snapshot_id}</strong>
            </div>
            <div className="key-value-row">
              <span>Previous persisted at</span>
              <strong>{formatDateTime(previous_anchor.persisted_at)}</strong>
            </div>
          </>
        ) : (
          <div className="key-value-row">
            <span>Previous anchor</span>
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
        <div className="key-value-row">
          <span>service_id</span>
          <strong>{data.service_id}</strong>
        </div>
      </div>
    </article>
  );
}
