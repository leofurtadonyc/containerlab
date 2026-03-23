import {
  DEFAULT_OPERATOR_BRIEFING_SYNC_RUNS_LIMIT,
  navigateToOperatorBriefingView,
} from "../../lib/operator-briefing-navigation";

export interface OperatorBriefingOverviewEntryProps {
  /** Same bounded window as the Overview recent-change summary (forwarded to app-api). */
  syncRunsLimit: number;
}

/**
 * Landing entry for the composed operator briefing workspace: single handoff surface before deeper pivots.
 */
export function OperatorBriefingOverviewEntry({ syncRunsLimit }: OperatorBriefingOverviewEntryProps) {
  const bounded = Math.min(100, Math.max(1, Math.floor(syncRunsLimit)));
  return (
    <article className="detail-card operator-briefing-entry-card">
      <div className="operator-briefing-entry-card__intro">
        <h3>Operator briefing workspace</h3>
        <p className="table-note">
          Open a dedicated briefing that composes delta digest, optional policy and topology dossiers, situation pack,
          and investigation context—with section evidence strips, merged caveats, export entry points, and live pivots.
          Read-only interpretation support for handoffs—not change approval, incident command, or unified cross-domain
          truth.
        </p>
      </div>
      <div className="operator-briefing-entry-card__actions">
        <button
          type="button"
          className="operator-briefing-entry-primary"
          onClick={() =>
            navigateToOperatorBriefingView(bounded || DEFAULT_OPERATOR_BRIEFING_SYNC_RUNS_LIMIT, {
              invFrom: "overview",
              clearPinnedScope: true,
            })
          }
        >
          Open operator briefing
        </button>
        <p className="table-note operator-briefing-entry-card__hint">
          Uses the same <strong>sync run window</strong> as <strong>Recent change (bounded)</strong> below (
          {bounded} sync runs). Pin <code>policy_id</code> or topology hints from other views before returning here
          if you need scoped dossier previews.
        </p>
      </div>
    </article>
  );
}
