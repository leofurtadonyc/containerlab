import type { EvidenceDrilldownTarget } from "../lib/history-evidence-drilldown";
import { navigateReadinessDrilldown, navigateToReadinessContext } from "../lib/readiness-navigation";
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

  const readinessBlockerHint = targets.some(
    (t) => t.view === "readiness" && t.readinessParams?.blocker,
  );

  return (
    <div className="history-evidence-drilldown">
      <p className="summary-label">Open related product surface</p>
      <p className="table-note">
        Read-only navigation: target pages show the current bounded slice, not this sync run or
        snapshot in isolation. Lists are not filtered by sync-run id.
      </p>
      {readinessBlockerHint ? (
        <p className="table-note">
          When a readiness row records a strongest-blocker name, opening Readiness may set a bounded
          URL scroll hint if that name matches the current capabilities readiness contract — not a
          validation verdict or filter.
        </p>
      ) : null}
      <div className="history-evidence-drilldown-actions">
        {targets.map((t, index) => (
          <button
            key={`${t.view}-${t.label}-${index}`}
            type="button"
            className="nav-drilldown-button"
            onClick={() => {
              if (t.view === "readiness") {
                if (t.readinessParams?.blocker) {
                  navigateToReadinessContext({ blocker: t.readinessParams.blocker });
                } else if (t.readinessParams?.prerequisite) {
                  navigateReadinessDrilldown({ prerequisite: t.readinessParams.prerequisite });
                } else {
                  navigateToReadinessContext({});
                }
                return;
              }
              navigateToEvidenceView(t.view);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
