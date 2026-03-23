import {
  DEFAULT_OPERATOR_BRIEFING_SYNC_RUNS_LIMIT,
  navigateToOperatorBriefingView,
} from "../../lib/operator-briefing-navigation";

export interface OperatorBriefingOverviewEntryProps {
  /** Same bounded window as the Overview recent-change summary (forwarded to app-api). */
  syncRunsLimit: number;
  /** NOC cockpit quick grid: tighter copy pointing at bundle + per-surface exports. */
  cockpitVariant?: boolean;
}

/**
 * Landing entry for the composed operator briefing workspace: single handoff surface before deeper pivots.
 */
export function OperatorBriefingOverviewEntry({
  syncRunsLimit,
  cockpitVariant = false,
}: OperatorBriefingOverviewEntryProps) {
  const bounded = Math.min(100, Math.max(1, Math.floor(syncRunsLimit)));
  return (
    <article className="detail-card operator-briefing-entry-card">
      <div className="operator-briefing-entry-card__intro">
        <h3>Operator briefing workspace</h3>
        <p className="table-note">
          Open a dedicated briefing that composes delta digest, optional policy and topology dossiers, situation pack,
          and investigation context—with section evidence strips, merged caveats,{" "}
          <strong>briefing bundle + per-surface export</strong> entry points, and live pivots. Read-only interpretation
          support for handoffs—not change approval, incident command, or unified cross-domain truth.
        </p>
        {cockpitVariant ? (
          <p className="table-note operator-briefing-entry-card__cockpit-note">
            In the briefing workspace, use <strong>Briefing archive (bundle)</strong> for a single{" "}
            <code>briefing_export_bundle_v1</code> download aligned to your scope echo — or export individual{" "}
            <code>evidence_export_v1</code> surfaces from the same page.
          </p>
        ) : null}
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
