import { navigateToSituationRoomView } from "../../lib/situation-room-navigation";

export interface SituationRoomOverviewEntryProps {
  /** Same bounded window as the Overview recent-change summary (forwarded to app-api). */
  syncRunsLimit: number;
}

/**
 * Primary landing entrypoint for opening the read-only situation room from Overview.
 * Prefetch is not required; the Situation room view loads the assembly from app-api.
 */
export function SituationRoomOverviewEntry({ syncRunsLimit }: SituationRoomOverviewEntryProps) {
  return (
    <article className="detail-card situation-room-entry-card">
      <div className="situation-room-entry-card__intro">
        <h3>Situation room (bounded evidence pack)</h3>
        <p className="table-note">
          Step from this summary into one read-only surface that assembles the backend-owned evidence pack:
          inventory, topology, policies, readiness snapshot history, workflow and audit history, plus a nested
          investigation context (recent change intelligence, platform status, and capabilities). This is
          interpretation support for operators—not validation, approval, incident command, safe-to-change
          scoring, drift verdicts, or workflow execution.
        </p>
      </div>
      <div className="situation-room-entry-card__actions">
        <button
          type="button"
          className="situation-room-entry-primary"
          onClick={() => navigateToSituationRoomView(syncRunsLimit)}
        >
          Open situation room
        </button>
        <p className="table-note situation-room-entry-card__hint">
          Uses the same <strong>sync run window</strong> as <strong>Recent change (bounded)</strong> below (
          {syncRunsLimit} sync runs). Deep metrics and charts stay in Grafana.
        </p>
      </div>
    </article>
  );
}
