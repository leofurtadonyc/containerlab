import { ErrorState, LoadingState } from "../../components/query-states";
import { ApiClientError } from "../../api/client";
import type { PolicyEvidenceDeltaCategory, PolicyEvidenceDeltaComparisonStatus } from "../../api/contracts";
import { formatDateTime, formatLabel } from "../../lib/presentation";
import {
  navigateToInvestigationView,
  readSyncRunsLimitFromSearch,
} from "../../lib/investigation-navigation";
import { scrollToPolicyEvidenceTimelineCard, scrollToPolicyPathAnalysisCard } from "../../lib/topology-policy-navigation";
import { usePolicyEvidenceDeltaQuery } from "./api";

export interface PolicyEvidenceDeltaPanelProps {
  policyId: string;
  emphasize?: boolean;
}

function comparisonStatusLabel(status: PolicyEvidenceDeltaComparisonStatus): string {
  const labels: Record<PolicyEvidenceDeltaComparisonStatus, string> = {
    delta_ready: "Read-side comparison ready",
    no_comparable_anchor: "No comparable persisted anchor",
    anchor_policy_absent: "Previous snapshot has no row for this policy",
    insufficient_evidence: "Insufficient evidence to load anchor",
  };
  return labels[status];
}

function deltaCategoryLabel(category: PolicyEvidenceDeltaCategory): string {
  const labels: Record<PolicyEvidenceDeltaCategory, string> = {
    posture_or_state_field_change: "Posture / state fields",
    degraded_policy_v1_change: "Degraded policy (v1)",
    candidate_path_shape_change: "Candidate paths",
    path_analysis_availability_change: "Path-analysis availability",
    serving_mode_or_freshness_change: "Serving / freshness",
    no_comparable_fields: "No comparable fields",
    gap_note: "Gap or not comparable",
  };
  return labels[category] ?? formatLabel(category);
}

export function PolicyEvidenceDeltaPanel({ policyId, emphasize }: PolicyEvidenceDeltaPanelProps) {
  const { data, error, isLoading, isRefreshing, reload } = usePolicyEvidenceDeltaQuery(policyId);

  if (!policyId) {
    return null;
  }

  if (isLoading && !data) {
    return (
      <article
        id="policy-evidence-delta"
        className={`detail-card${emphasize ? " detail-card--focus-flash" : ""}`}
      >
        <h3>Policy evidence delta</h3>
        <p className="footnote">
          Read-side evidence difference between the current inventory row and the previous persisted
          snapshot when history allows—<strong>not</strong> drift detection, configuration diff
          authority, or validation.
        </p>
        <LoadingState label="Loading bounded policy evidence delta (read-only assembly)…" />
      </article>
    );
  }

  if (error) {
    const isNotFound = error instanceof ApiClientError && error.status === 404;
    return (
      <article
        id="policy-evidence-delta"
        className={`detail-card${emphasize ? " detail-card--focus-flash" : ""}`}
      >
        <h3>Policy evidence delta</h3>
        <p className="footnote">
          Read-side evidence difference between inventory snapshots—<strong>not</strong> drift detection
          or policy correctness.
        </p>
        {isNotFound ? (
          <div className="query-message">
            <strong>Evidence delta not available for this id</strong>
            <p>
              The policy id is not present in the current bounded inventory list, so a read-side delta
              cannot be assembled. This is expected when the list is truncated, filtered, or the record
              was removed since the last snapshot.
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

  const { safety_framing, scope_summary, comparison_status, current_anchor, previous_anchor, delta_items, caveats } =
    data;
  const unknownOrGap =
    comparison_status === "no_comparable_anchor" ||
    comparison_status === "insufficient_evidence" ||
    comparison_status === "anchor_policy_absent";

  return (
    <article
      id="policy-evidence-delta"
      className={`detail-card${emphasize ? " detail-card--focus-flash" : ""}`}
    >
      <h3>Policy evidence delta</h3>
      {isRefreshing ? (
        <p className="table-note" role="status">
          Refreshing evidence delta…
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
            — the API does not claim a comparable pair of anchors for this slice; treat this as an
            honest boundary, not a &quot;no change&quot; verdict.
          </>
        ) : null}
      </p>

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

      <p className="summary-label">Current anchor (inventory)</p>
      <div className="key-value-list">
        <div className="key-value-row">
          <span>observed_at</span>
          <strong>{current_anchor.observed_at ? formatDateTime(current_anchor.observed_at) : "—"}</strong>
        </div>
        <div className="key-value-row">
          <span>Row posture</span>
          <strong>{formatLabel(current_anchor.row_posture)}</strong>
        </div>
        <div className="key-value-row">
          <span>Serving mode</span>
          <strong>{formatLabel(current_anchor.serving_mode)}</strong>
        </div>
      </div>

      {previous_anchor ? (
        <>
          <p className="summary-label">Previous anchor (persisted snapshot)</p>
          <div className="key-value-list">
            <div className="key-value-row">
              <span>snapshot_id</span>
              <strong>{previous_anchor.snapshot_id}</strong>
            </div>
            <div className="key-value-row">
              <span>persisted_at</span>
              <strong>{formatDateTime(previous_anchor.persisted_at)}</strong>
            </div>
            <div className="key-value-row">
              <span>observed_at</span>
              <strong>{previous_anchor.observed_at ? formatDateTime(previous_anchor.observed_at) : "—"}</strong>
            </div>
          </div>
        </>
      ) : (
        <p className="footnote">
          No previous persisted snapshot anchor is attached to this response—see comparison status and
          scope above.
        </p>
      )}

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

      <p className="summary-label">Delta items</p>
      {delta_items.length === 0 ? (
        <p className="footnote">
          No categorized delta lines in this response. When comparison is ready, this usually means the
          normalized fields compared equal between anchors—still not a drift or validation conclusion.
        </p>
      ) : (
        <ul className="notes-list">
          {delta_items.map((item, index) => (
            <li key={`${item.category}-${index}`}>
              <strong>{deltaCategoryLabel(item.category)}</strong>
              {" — "}
              {item.summary}
              {item.detail ? (
                <>
                  {" "}
                  <span className="table-note">({item.detail})</span>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <p className="summary-label">Related surfaces (read-only)</p>
      <p className="footnote">
        <button
          type="button"
          className="inline-action"
          onClick={() =>
            navigateToInvestigationView(readSyncRunsLimitFromSearch(window.location.search), {
              invFrom: "policies",
            })
          }
        >
          Open investigation workspace
        </button>
        {" · "}
        <button type="button" className="inline-action" onClick={() => scrollToPolicyEvidenceTimelineCard()}>
          Evidence timeline
        </button>
        {" · "}
        <button type="button" className="inline-action" onClick={() => scrollToPolicyPathAnalysisCard()}>
          Path analysis
        </button>
      </p>

      <p className="summary-label">Response metadata</p>
      <div className="key-value-list">
        <div className="key-value-row">
          <span>API generated at</span>
          <strong>{formatDateTime(data.metadata.generated_at)}</strong>
        </div>
        <div className="key-value-row">
          <span>Policy id</span>
          <strong>{data.policy_id}</strong>
        </div>
      </div>
    </article>
  );
}
