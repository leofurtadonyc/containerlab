import { navigateToEvidenceView } from "../../lib/url-app-state";

export interface EvidenceReplayOverviewEntryProps {
  /** Reserved for future URL sync (e.g. pinned import hints); cockpit uses shell navigation only. */
  syncRunsLimit: number;
}

/**
 * NOC cockpit entry for **Evidence replay** — opens frozen `evidence_export_v1` (or per-member JSON from a bundle),
 * not live product truth (`evidence_replay_viewer_v1`).
 */
export function EvidenceReplayOverviewEntry(_props: EvidenceReplayOverviewEntryProps) {
  return (
    <article className="detail-card evidence-replay-entry-card" data-testid="evidence-replay-overview-entry">
      <div className="evidence-replay-entry-card__intro">
        <h3>Evidence replay</h3>
        <p className="table-note">
          Review a previously downloaded <strong>evidence_export_v1</strong> JSON (or extract a member payload from a{" "}
          <strong>briefing_export_bundle_v1</strong> file) — read-only replay and pivots to live surfaces,{" "}
          <strong>not</strong> tamper proof, compliance hold, or substitute for current Policies / Topology / Situation /
          Investigation APIs.
        </p>
      </div>
      <div className="evidence-replay-entry-card__actions">
        <button
          type="button"
          className="evidence-replay-entry-primary"
          onClick={() => navigateToEvidenceView("evidence-replay")}
        >
          Open evidence replay
        </button>
        <p className="table-note evidence-replay-entry-card__hint">
          For <strong>live</strong> bounded exports, use <strong>Operator briefing</strong> (bundle + per-surface
          downloads) or per-view export actions — this surface is for <strong>frozen</strong> files only.
        </p>
      </div>
    </article>
  );
}
