import type { EvidenceDrilldownTarget } from "../lib/history-evidence-drilldown";
import { navigateToEvidenceView } from "../lib/url-app-state";

interface HistoryEvidenceDrilldownProps {
  targets: EvidenceDrilldownTarget[];
}

export function HistoryEvidenceDrilldown({ targets }: HistoryEvidenceDrilldownProps) {
  if (targets.length === 0) {
    return (
      <div className="history-evidence-drilldown">
        <p className="summary-label">Related product surfaces</p>
        <p className="table-note">
          No Devices, Topology, Policies, or Readiness drilldown applies to this entry from scope and
          persisted evidence alone—anchors above remain the bounded sync-derived record.
        </p>
      </div>
    );
  }

  return (
    <div className="history-evidence-drilldown">
      <p className="summary-label">Open related product surface</p>
      <p className="table-note">
        Read-only navigation: target pages show the current bounded slice, not this sync run or
        snapshot in isolation. Lists are not filtered by sync-run id.
      </p>
      <div className="history-evidence-drilldown-actions">
        {targets.map((t) => (
          <button
            key={t.view}
            type="button"
            className="nav-drilldown-button"
            onClick={() => navigateToEvidenceView(t.view)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
