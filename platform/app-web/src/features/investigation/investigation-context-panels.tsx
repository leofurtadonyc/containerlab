import type { InvestigationContextAssemblyResponse } from "../../api/contracts";
import { StatusPill } from "../../components/status-pill";
import { CHANGE_INTELLIGENCE_DOMAIN_LABELS } from "../../lib/change-intelligence-domain-labels";
import { countRecentChangeEvidenceStatuses } from "../../lib/change-intelligence-cues";

export interface InvestigationContextPanelsProps {
  data: InvestigationContextAssemblyResponse;
  syncRunsLimit: number;
}

/**
 * At-a-glance cross-domain context: posture, change signals, planning anchors—still bounded and explainable.
 */
export function InvestigationContextPanels({ data, syncRunsLimit }: InvestigationContextPanelsProps) {
  const rc = data.recent_change;
  const ps = data.platform_status;
  const cap = data.capabilities;
  const dry = cap.dry_run_readiness;
  const evidenceMix = countRecentChangeEvidenceStatuses(rc.domains);
  const readPaths = ps.read_paths ?? [];

  const freshnessLines = readPaths.map((rp) => {
    if (rp.oldest_observed_at && rp.newest_observed_at) {
      return `${rp.model_family}: ${rp.oldest_observed_at.slice(0, 10)} → ${rp.newest_observed_at.slice(0, 10)} (observation window)`;
    }
    if (rp.newest_observed_at) {
      return `${rp.model_family}: newest observed ${rp.newest_observed_at.slice(0, 10)}`;
    }
    return `${rp.model_family}: observation window not fully exposed`;
  });

  const degradedPaths = readPaths.filter((rp) => rp.observation_state !== "ok").length;

  return (
    <section className="investigation-context-panels" aria-labelledby="inv-context-heading">
      <h3 id="inv-context-heading">Cross-domain context at a glance</h3>
      <p className="table-note investigation-context-panels__intro">
        Three read-only panels summarize <strong>current posture</strong>, <strong>aggregated change signals</strong>,
        and <strong>planning anchors</strong> from the same nested contracts below—interpretation support, not authority
        or completeness guarantees.
      </p>
      <div className="investigation-context-panels__grid">
        <article className="detail-card investigation-context-panel">
          <h4>Current posture snapshot</h4>
          <p className="investigation-context-panel__lead">
            <strong>Recovery:</strong> {ps.recovery.baseline_posture.replace(/_/g, " ")} ·{" "}
            <strong>Read-side:</strong> {ps.recovery.read_side_posture.replace(/_/g, " ")}
          </p>
          <p className="table-note">{ps.recovery.summary}</p>
          <p className="table-note">
            Read paths: <strong>{readPaths.length}</strong> families · <strong>{degradedPaths}</strong> not in{" "}
            <code>ok</code> observation
          </p>
          {freshnessLines.length > 0 ? (
            <ul className="notes-list investigation-context-panel__list">
              {freshnessLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="table-note">No read-path rows in this platform-status payload.</p>
          )}
          <p className="table-note">
            Components observed:{" "}
            {ps.components.filter((c) => c.observation_state !== "not_checked").length} of {ps.components.length}{" "}
            with a bounded observation.
          </p>
        </article>

        <article className="detail-card investigation-context-panel">
          <h4>Aggregated change signals</h4>
          <p className="investigation-context-panel__lead">
            Evidence mix: <strong>{evidenceMix.present}</strong> present · <strong>{evidenceMix.partial}</strong> partial ·{" "}
            <strong>{evidenceMix.absent}</strong> absent
          </p>
          <p className="table-note">
            Sync-run window requested <strong>{syncRunsLimit}</strong> · applied in summary{" "}
            <strong>{rc.sync_runs_limit_applied}</strong> · readiness rows considered{" "}
            <strong>{rc.readiness_snapshots_considered}</strong>
          </p>
          <p className="table-note">
            Window semantics: <strong>{rc.window_semantics.replace(/_/g, " ")}</strong> · Completeness:{" "}
            <strong>{rc.completeness_posture.replace(/_/g, " ")}</strong>
          </p>
          <ul className="investigation-context-domain-chips">
            {rc.domains.map((d) => (
              <li key={d.domain}>
                <span className="investigation-context-domain-name">
                  {CHANGE_INTELLIGENCE_DOMAIN_LABELS[d.domain]}
                </span>
                <StatusPill value={d.evidence_status} />
              </li>
            ))}
          </ul>
        </article>

        <article className="detail-card investigation-context-panel">
          <h4>Planning &amp; capability anchors</h4>
          <p className="table-note">
            Matrix <strong>{cap.data_status.replace(/_/g, " ")}</strong> · <strong>{cap.count}</strong> capability rows
          </p>
          {cap.readiness_snapshot_id ? (
            <p className="table-note">
              Readiness anchor <code>{cap.readiness_snapshot_id}</code>
              {cap.readiness_persisted_at ? (
                <> · persisted {cap.readiness_persisted_at.slice(0, 10)}</>
              ) : null}
            </p>
          ) : (
            <p className="table-note">No readiness snapshot id on this capabilities payload.</p>
          )}
          {dry ? (
            <p className="table-note">
              Dry-run readiness (planning-only): <strong>{dry.status}</strong> · planning{" "}
              <strong>{dry.planning_readiness}</strong>
              {dry.strongest_blockers.length > 0 ? (
                <>
                  {" "}
                  · <strong>{dry.strongest_blockers.length}</strong> strongest blocker lines
                </>
              ) : null}
            </p>
          ) : (
            <p className="table-note">No dry-run readiness block on this capabilities payload.</p>
          )}
        </article>
      </div>
    </section>
  );
}
