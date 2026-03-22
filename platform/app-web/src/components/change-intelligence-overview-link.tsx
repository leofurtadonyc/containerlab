import { navigateToEvidenceView } from "../lib/url-app-state";

interface ChangeIntelligenceOverviewLinkProps {
  /** Distinguishes copy between workflow-history and audit-history shells. */
  historySurface: "workflow" | "audit";
}

/**
 * Read-only navigation to Overview, where the bounded recent-change panel aggregates the same
 * persisted sync substrate as row-level history—interpretation only, not validation or workflow authority.
 */
export function ChangeIntelligenceOverviewLink({ historySurface }: ChangeIntelligenceOverviewLinkProps) {
  const rowLevel =
    historySurface === "workflow"
      ? "This page remains row-level sync-derived workflow history."
      : "This page remains row-level sync-derived audit-style history.";

  return (
    <div className="callout change-intelligence-overview-link">
      <strong>Recent change (bounded)</strong>
      <p className="table-note">
        <strong>Overview</strong> aggregates cross-domain recent-change signals from the same persisted sync-run
        window as this substrate—read-only interpretation, not validation, drift verdicts, or workflow
        authority. {rowLevel}
      </p>
      <div className="history-evidence-drilldown-actions">
        <button
          type="button"
          className="nav-drilldown-button"
          onClick={() => navigateToEvidenceView("overview")}
        >
          Open Overview (recent change summary)
        </button>
      </div>
    </div>
  );
}
