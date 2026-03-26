import { ErrorState, LoadingState } from "../../components/query-states";
import { ApiClientError } from "../../api/client";
import type { ServiceEvidenceTimelineEntry } from "../../api/contracts";
import { formatDateTime, formatLabel } from "../../lib/presentation";
import { navigateToPoliciesPolicyEvidenceTimelineFocus } from "../../lib/topology-policy-navigation";
import { useServiceEvidenceTimelineQuery } from "./api";

export interface ServiceEvidenceTimelinePanelProps {
  serviceId: string;
}

function entryKindLabel(kind: ServiceEvidenceTimelineEntry["entry_kind"]): string {
  const labels: Record<ServiceEvidenceTimelineEntry["entry_kind"], string> = {
    service_membership_snapshot_anchor: "Service membership",
    member_policy_timeline_entry: "Member policy timeline",
    member_policy_history_checkpoint: "Member policy history",
    member_path_analysis_assembly_anchor: "Member path analysis",
    degraded_posture_shift_for_member: "Degraded posture shift",
    service_degraded_roll_up_context: "Service degraded roll-up",
    sync_activity_touch: "Sync activity",
    gap_note: "Gap",
  };
  return labels[kind] ?? formatLabel(kind);
}

export function ServiceEvidenceTimelinePanel({ serviceId }: ServiceEvidenceTimelinePanelProps) {
  const { data, error, isLoading, isRefreshing, reload } = useServiceEvidenceTimelineQuery(serviceId, true);

  if (!serviceId) {
    return null;
  }

  if (isLoading && !data) {
    return (
      <article id="service-evidence-timeline" className="detail-card">
        <h3>Service evidence timeline</h3>
        <LoadingState label="Loading bounded service evidence timeline (read-only assembly)…" />
      </article>
    );
  }

  if (error) {
    const isNotFound = error instanceof ApiClientError && error.status === 404;
    return (
      <article id="service-evidence-timeline" className="detail-card">
        <h3>Service evidence timeline</h3>
        {isNotFound ? (
          <div className="query-message">
            <strong>Evidence timeline not available for this service_id</strong>
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

  const { safety_framing, scope_summary, entries, missing_evidence_notes } = data;

  return (
    <article id="service-evidence-timeline" className="detail-card">
      <h3>Service evidence timeline</h3>
      {isRefreshing ? (
        <p className="table-note" role="status">
          Refreshing service evidence timeline…
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
        <p className="footnote">No discrete timeline anchors were returned for this service scope.</p>
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
          <span>service_id</span>
          <strong>{data.service_id}</strong>
        </div>
      </div>
    </article>
  );
}
