import { ErrorState, LoadingState } from "../../components/query-states";
import { ApiClientError } from "../../api/client";
import type { TopologyObjectEvidenceTimelineEntry } from "../../api/contracts";
import { formatDateTime, formatLabel } from "../../lib/presentation";
import { navigateToPoliciesPolicyEvidenceTimelineFocus } from "../../lib/topology-policy-navigation";
import { useTopologyObjectEvidenceTimelineQuery } from "./api";

export interface TopologyObjectEvidenceTimelinePanelProps {
  objectId: string;
  objectKind: "node" | "link";
}

function entryKindLabel(kind: TopologyObjectEvidenceTimelineEntry["entry_kind"]): string {
  const labels: Record<TopologyObjectEvidenceTimelineEntry["entry_kind"], string> = {
    topology_object_snapshot_anchor: "Topology snapshot",
    failure_impact_assembly_anchor: "Failure impact",
    topology_risk_summary_row_anchor: "Risk summary row",
    related_policies_list_anchor: "Related policies list",
    related_policy_timeline_entry: "Related policy timeline",
    related_policy_history_checkpoint: "Policy history",
    related_path_analysis_assembly_anchor: "Path analysis",
    degraded_policy_signal_for_related_policy: "Degraded policy",
    sync_activity_touch: "Sync activity",
    gap_note: "Gap",
  };
  return labels[kind] ?? formatLabel(kind);
}

export function TopologyObjectEvidenceTimelinePanel({
  objectId,
  objectKind,
}: TopologyObjectEvidenceTimelinePanelProps) {
  const { data, error, isLoading, isRefreshing, reload } = useTopologyObjectEvidenceTimelineQuery(
    objectId,
    true,
  );

  if (!objectId) {
    return null;
  }

  if (isLoading && !data) {
    return (
      <article id="topology-object-evidence-timeline" className="detail-card">
        <h3>Topology object evidence timeline</h3>
        <LoadingState label="Loading bounded topology object evidence timeline (read-only assembly)…" />
      </article>
    );
  }

  if (error) {
    const isNotFound = error instanceof ApiClientError && error.status === 404;
    return (
      <article id="topology-object-evidence-timeline" className="detail-card">
        <h3>Topology object evidence timeline</h3>
        {isNotFound ? (
          <div className="query-message">
            <strong>Evidence timeline not available for this object</strong>
            <p>
              The object id is not a known node_id or link_id in the current normalized topology snapshot. Same
              identity rules as related-policies and failure-impact.
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

  return (
    <article
      id="topology-object-evidence-timeline"
      className="detail-card"
      data-topology-object-kind={objectKind}
    >
      <h3>Topology object evidence timeline</h3>
      {isRefreshing ? (
        <p className="table-note" role="status">
          Refreshing topology object evidence timeline…
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
        <p className="footnote">No discrete timeline anchors were returned for this topology object scope.</p>
      ) : (
        <ol className="notes-list evidence-timeline-ordered">
          {entries.map((entry, index) => (
            <li key={`${entry.sort_key}-${entry.tie_break}-${index}`}>
              <strong>{formatDateTime(entry.sort_key)}</strong>
              {" — "}
              <span className="table-note">{entryKindLabel(entry.entry_kind)}</span>
              {entry.policy_id ? (
                <>
                  {" "}
                  <button
                    type="button"
                    className="inline-action"
                    onClick={() => navigateToPoliciesPolicyEvidenceTimelineFocus(entry.policy_id!)}
                    title="Open Policies with policy evidence timeline focus — full policy-only depth"
                  >
                    Policy timeline ({entry.policy_id})
                  </button>
                </>
              ) : null}
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
                {entry.source_policy_entry_kind ? (
                  <div className="key-value-row">
                    <span>Nested policy entry kind</span>
                    <strong>{entry.source_policy_entry_kind}</strong>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}

      <p className="summary-label">Response metadata</p>
      <div className="key-value-list">
        <div className="key-value-row">
          <span>API generated at</span>
          <strong>{formatDateTime(data.metadata.generated_at)}</strong>
        </div>
        <div className="key-value-row">
          <span>object_kind</span>
          <strong>{data.object_kind}</strong>
        </div>
        <div className="key-value-row">
          <span>object_id</span>
          <strong>{data.object_id}</strong>
        </div>
      </div>
    </article>
  );
}
