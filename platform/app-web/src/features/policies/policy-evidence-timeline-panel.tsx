import { ErrorState, LoadingState } from "../../components/query-states";
import { ApiClientError } from "../../api/client";
import type { PolicyEvidenceTimelineEntry } from "../../api/contracts";
import { formatDateTime, formatLabel } from "../../lib/presentation";
import {
  navigateToInvestigationView,
  readSyncRunsLimitFromSearch,
} from "../../lib/investigation-navigation";
import { scrollToPolicyPathAnalysisCard } from "../../lib/topology-policy-navigation";
import { usePolicyEvidenceTimelineQuery } from "./api";

export interface PolicyEvidenceTimelinePanelProps {
  policyId: string;
  /** Brief visual emphasis (e.g. after history drillthrough with `policy_evidence_timeline_focus=v1`). */
  emphasize?: boolean;
}

function entryKindLabel(kind: PolicyEvidenceTimelineEntry["entry_kind"]): string {
  const labels: Record<PolicyEvidenceTimelineEntry["entry_kind"], string> = {
    policy_inventory_snapshot_anchor: "Inventory snapshot",
    policy_history_persisted_checkpoint: "History checkpoint",
    policy_history_comparison_span: "History comparison",
    path_analysis_assembly_anchor: "Path analysis assembly",
    degraded_policy_v1_signal_anchor: "Degraded policy (v1)",
  };
  return labels[kind] ?? formatLabel(kind);
}

export function PolicyEvidenceTimelinePanel({ policyId, emphasize }: PolicyEvidenceTimelinePanelProps) {
  const { data, error, isLoading, isRefreshing, reload } = usePolicyEvidenceTimelineQuery(policyId);

  if (!policyId) {
    return null;
  }

  if (isLoading && !data) {
    return (
      <article
        id="policy-evidence-timeline"
        className={`detail-card${emphasize ? " detail-card--focus-flash" : ""}`}
      >
        <h3>Policy evidence timeline</h3>
        <LoadingState label="Loading bounded policy evidence timeline (read-only assembly)…" />
      </article>
    );
  }

  if (error) {
    const isNotFound = error instanceof ApiClientError && error.status === 404;
    return (
      <article
        id="policy-evidence-timeline"
        className={`detail-card${emphasize ? " detail-card--focus-flash" : ""}`}
      >
        <h3>Policy evidence timeline</h3>
        {isNotFound ? (
          <div className="query-message">
            <strong>Evidence timeline not available for this id</strong>
            <p>
              The policy id is not present in the current bounded inventory list, so the evidence
              timeline cannot be assembled. This is expected when the list is truncated, filtered, or
              the record was removed since the last snapshot.
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

  const { safety_framing, scope_summary, entries, missing_evidence_notes } = data;
  const hasPathAnalysisAnchor = entries.some(
    (e) => e.entry_kind === "path_analysis_assembly_anchor",
  );

  return (
    <article
      id="policy-evidence-timeline"
      className={`detail-card${emphasize ? " detail-card--focus-flash" : ""}`}
    >
      <h3>Policy evidence timeline</h3>
      {isRefreshing ? (
        <p className="table-note" role="status">
          Refreshing evidence timeline…
        </p>
      ) : null}
      <p className="footnote">{safety_framing.summary_disclaimer}</p>
      <p className="summary-label">Scope</p>
      <p className="footnote">{scope_summary}</p>

      <p className="summary-label">Contract</p>
      <div className="key-value-list">
        <div className="key-value-row">
          <span>Timeline contract</span>
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

      {missing_evidence_notes.length > 0 ? (
        <>
          <p className="summary-label">Honest gaps and partial evidence</p>
          <ul className="notes-list">
            {missing_evidence_notes.map((note, i) => (
              <li key={`gap-${i}`}>{note}</li>
            ))}
          </ul>
        </>
      ) : null}

      <p className="summary-label">Ordered anchors (newest first)</p>
      {entries.length === 0 ? (
        <p className="footnote">
          No discrete timeline anchors were returned for this policy in the current assembly window.
          Use the gaps above when the API explains missing history or partial snapshots.
        </p>
      ) : (
        <ol className="notes-list evidence-timeline-ordered">
          {entries.map((entry, index) => (
            <li key={`${entry.sort_key}-${entry.tie_break}-${index}`}>
              <strong>{formatDateTime(entry.sort_key)}</strong>
              {" — "}
              <span className="table-note">{entryKindLabel(entry.entry_kind)}</span>
              <div className="key-value-list evidence-timeline-entry-meta">
                <div className="key-value-row">
                  <span>Summary</span>
                  <strong>{entry.summary}</strong>
                </div>
                <div className="key-value-row">
                  <span>Source</span>
                  <strong>{entry.provenance}</strong>
                </div>
                <div className="key-value-row">
                  <span>Reference</span>
                  <strong>{entry.reference}</strong>
                </div>
              </div>
            </li>
          ))}
        </ol>
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
        <button type="button" className="inline-action" onClick={() => scrollToPolicyPathAnalysisCard()}>
          Path analysis
        </button>
        {hasPathAnalysisAnchor ? (
          <span className="table-note"> — timeline includes a path-analysis anchor above.</span>
        ) : null}
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
