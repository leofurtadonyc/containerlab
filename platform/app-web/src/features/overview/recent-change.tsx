import type { ChangeEvidenceDomain, RecentChangeSummaryResponse } from "../../api/contracts";
import { QueryStateSummaryCard } from "../../components/query-states";
import {
  isChangeIntelligenceHistorySurfaceDomain,
  isChangeIntelligenceProductSurfaceDomain,
  viewIdForChangeIntelligenceHistoryDomain,
} from "../../lib/change-intelligence-navigation";
import { formatDateTime } from "../../lib/presentation";
import { navigateToEvidenceView } from "../../lib/url-app-state";

const DOMAIN_LABELS: Record<ChangeEvidenceDomain, string> = {
  devices: "Devices",
  topology: "Topology",
  policies: "Policies",
  readiness: "Readiness",
  workflow_history: "Workflow history",
  audit_history: "Audit history",
};

function statusPillClass(evidenceStatus: string): string {
  switch (evidenceStatus) {
    case "present":
      return "status-pill status-good";
    case "partial":
      return "status-pill status-warn";
    default:
      return "status-pill status-neutral";
  }
}

export interface RecentChangeIntelligencePanelProps {
  data: RecentChangeSummaryResponse | null;
  error: { message: string } | null;
  isLoading: boolean;
  onRetry: () => void | Promise<void>;
}

export function RecentChangeIntelligencePanel({
  data,
  error,
  isLoading,
  onRetry,
}: RecentChangeIntelligencePanelProps) {
  if (error) {
    return (
      <QueryStateSummaryCard
        title="Recent change (bounded)"
        stateLabel="Unavailable"
        detail={error.message}
        tone="error"
        onRetry={() => void onRetry()}
        retryLabel="Retry recent change summary"
      />
    );
  }

  if (isLoading && !data) {
    return (
      <article className="detail-card recent-change-card">
        <h3>Recent change (bounded)</h3>
        <p className="table-note">Loading cross-domain persisted evidence summary from the backend…</p>
      </article>
    );
  }

  if (!data) {
    return null;
  }

  const presentCount = data.domains.filter((d) => d.evidence_status === "present").length;
  const partialCount = data.domains.filter((d) => d.evidence_status === "partial").length;
  const absentCount = data.domains.filter((d) => d.evidence_status === "absent").length;

  return (
    <article className="detail-card recent-change-card">
      <div className="section-header recent-change-card__header">
        <div>
          <h3>Recent change (bounded)</h3>
          <p className="table-note">{data.safety.summary_disclaimer}</p>
        </div>
        <span className="status-pill status-neutral">{data.completeness_posture.replace(/_/g, " ")}</span>
      </div>

      <p className="callout recent-change-card__callout">
        Aggregated read-only visibility from persisted snapshot tables and read-side sync history—
        <strong> not </strong>
        validation, drift detection, safe-to-change scoring, or workflow authority. Domain detail remains on
        Devices, Topology, Policies, Readiness, Workflow history, and Audit history.
      </p>

      <div className="metadata-row">
        <span>Generated {formatDateTime(data.metadata.generated_at)}</span>
        <span>Sync runs in window: {data.sync_runs_limit_applied}</span>
        <span>Readiness rows considered: {data.readiness_snapshots_considered}</span>
      </div>

      <ul className="recent-change-summary">
        <li>
          <strong>{presentCount}</strong> domain{presentCount === 1 ? "" : "s"} with present evidence
        </li>
        <li>
          <strong>{partialCount}</strong> partial
        </li>
        <li>
          <strong>{absentCount}</strong> absent
        </li>
      </ul>

      <p className="table-note recent-change-product-drilldown-note">
        For Devices, Topology, and Policies, use <strong>Open …</strong> below each row to jump to that
        read-only product surface — evidence may still be absent; lists are not filtered by this summary
        window.
      </p>
      <p className="table-note recent-change-history-drilldown-note">
        For Workflow history and Audit history, use <strong>Open …</strong> below to open the same sync-derived
        row-level lists — not filtered by this aggregation; honest absence on those pages stays explicit.
      </p>

      <ul className="recent-change-domain-list">
        {data.domains.map((slice) => (
          <li key={slice.domain}>
            <span className="recent-change-domain-label">{DOMAIN_LABELS[slice.domain]}</span>
            <span className={statusPillClass(slice.evidence_status)} title={slice.evidence_status}>
              {slice.evidence_status}
            </span>
            <p className="recent-change-headline">{slice.headline}</p>
            {isChangeIntelligenceProductSurfaceDomain(slice.domain) ? (
              <div className="recent-change-domain-actions">
                <button
                  type="button"
                  className="nav-drilldown-button"
                  onClick={() => navigateToEvidenceView(slice.domain)}
                >
                  Open {DOMAIN_LABELS[slice.domain]}
                </button>
              </div>
            ) : isChangeIntelligenceHistorySurfaceDomain(slice.domain) ? (
              <div className="recent-change-domain-actions">
                <button
                  type="button"
                  className="nav-drilldown-button"
                  onClick={() => {
                    const d = slice.domain;
                    if (isChangeIntelligenceHistorySurfaceDomain(d)) {
                      navigateToEvidenceView(viewIdForChangeIntelligenceHistoryDomain(d));
                    }
                  }}
                >
                  Open {DOMAIN_LABELS[slice.domain]}
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {data.aggregation_notes.length > 0 ? (
        <ul className="notes-list">
          {data.aggregation_notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
