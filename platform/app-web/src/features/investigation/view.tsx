import { useCallback, useEffect, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { APP_URL_SEARCH_CHANGED, navigateToEvidenceView } from "../../lib/url-app-state";
import { countRecentChangeEvidenceStatuses } from "../../lib/change-intelligence-cues";
import { formatDateTime } from "../../lib/presentation";
import { OVERVIEW_RECENT_CHANGE_SYNC_LIMIT } from "../overview/api";
import { useInvestigationWorkspaceContextQuery } from "./api";

function readSyncRunsLimitFromSearch(): number {
  const sp = new URLSearchParams(window.location.search);
  const raw = sp.get("sync_runs_limit");
  if (!raw) {
    return OVERVIEW_RECENT_CHANGE_SYNC_LIMIT;
  }
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) {
    return OVERVIEW_RECENT_CHANGE_SYNC_LIMIT;
  }
  return Math.min(100, Math.max(1, n));
}

export function InvestigationView() {
  const [syncRunsLimit, setSyncRunsLimit] = useState(readSyncRunsLimitFromSearch);

  const syncFromUrl = useCallback(() => {
    setSyncRunsLimit(readSyncRunsLimitFromSearch());
  }, []);

  useEffect(() => {
    window.addEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
    return () => window.removeEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
  }, [syncFromUrl]);

  const query = useInvestigationWorkspaceContextQuery(syncRunsLimit);

  if (query.isLoading && !query.data) {
    return (
      <section>
        <h2>Investigation workspace</h2>
        <LoadingState label="Loading bounded investigation context from app-api (nested existing responses only)." />
      </section>
    );
  }

  if (query.error) {
    return (
      <section>
        <h2>Investigation workspace</h2>
        <ErrorState error={query.error} onRetry={query.reload} />
        <p className="table-note">
          <button type="button" className="inline-action" onClick={() => navigateToEvidenceView("overview")}>
            Back to Overview
          </button>
        </p>
      </section>
    );
  }

  if (!query.data) {
    return (
      <section>
        <h2>Investigation workspace</h2>
        <EmptyState
          title="No investigation context"
          description="The backend did not return an investigation assembly for the current request."
        />
      </section>
    );
  }

  const data = query.data;
  const rc = data.recent_change;
  const evidenceMix = countRecentChangeEvidenceStatuses(rc.domains);
  const ps = data.platform_status;
  const cap = data.capabilities;

  return (
    <section>
      <div className="section-header">
        <div>
          <h2>Investigation workspace</h2>
          <p>
            Read-only assembly from <code>GET /api/v1/investigation-workspace/context</code>. Nested blocks
            are the same product contracts you already get from individual APIs—combined here for coherent
            interpretation without new authority claims.
          </p>
        </div>
        <button type="button" className="inline-action" onClick={() => navigateToEvidenceView("overview")}>
          Back to Overview
        </button>
      </div>

      <p className="callout">{data.safety.summary_disclaimer}</p>

      <div className="metadata-row">
        <span>Assembly generated {formatDateTime(data.metadata.generated_at)}</span>
        <span>Contract {data.safety.contract_id}</span>
        <span>Authority {data.safety.authority_posture.replace(/_/g, " ")}</span>
      </div>

      <article className="detail-card">
        <h3>What this workspace does not prove</h3>
        <ul className="notes-list">
          {data.safety.explicit_non_claims.map((claim) => (
            <li key={claim}>
              <code>{claim}</code>
            </li>
          ))}
        </ul>
      </article>

      {data.assembly_notes.length > 0 ? (
        <article className="detail-card">
          <h3>Assembly notes (backend)</h3>
          <ul className="notes-list">
            {data.assembly_notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </article>
      ) : null}

      <div className="summary-grid">
        <article className="summary-card">
          <p className="summary-label">Recent change (nested)</p>
          <strong>
            {evidenceMix.present} present · {evidenceMix.partial} partial · {evidenceMix.absent} absent
          </strong>
          <p>
            Change intelligence contract {rc.safety.contract_id}; sync runs in window {rc.sync_runs_limit_applied}{" "}
            (requested window {syncRunsLimit}).
          </p>
          <p className="table-note">{rc.safety.summary_disclaimer}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Platform status (nested)</p>
          <strong>{ps.status}</strong>
          <p>{ps.summary}</p>
          <p className="table-note">
            Recovery: {ps.recovery.baseline_posture.replace(/_/g, " ")} · read-side{" "}
            {ps.recovery.read_side_posture.replace(/_/g, " ")}
          </p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Capabilities (nested)</p>
          <strong>{cap.count} rows</strong>
          <p>{cap.data_status.replace(/_/g, " ")} · {cap.summary.slice(0, 200)}</p>
        </article>
      </div>

      <article className="detail-card">
        <h3>Where to read full detail</h3>
        <p className="table-note">
          Use Overview, Platform Health, Devices, Topology, Policies, Capabilities, Readiness, Workflow history,
          and Audit history for the full nested payloads. This page stays a bounded landing surface—not a
          replacement for those routes.
        </p>
        <div className="investigation-entry-card__actions">
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("devices")}>
            Open Devices
          </button>
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("topology")}>
            Open Topology
          </button>
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("policies")}>
            Open Policies
          </button>
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("capabilities")}>
            Open Capabilities
          </button>
          <button
            type="button"
            className="nav-drilldown-button"
            onClick={() => navigateToEvidenceView("platform-health")}
          >
            Open Platform Health
          </button>
        </div>
      </article>
    </section>
  );
}
