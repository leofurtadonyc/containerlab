import type { SituationPackAssemblyResponse } from "../../api/contracts";
import { formatDateTime } from "../../lib/presentation";
import { navigateToEvidenceView } from "../../lib/url-app-state";
import { navigateToInvestigationView } from "../../lib/investigation-navigation";
import { InvestigationContextPanels } from "../investigation/investigation-context-panels";
import { InvestigationEvidenceTimeline } from "../investigation/investigation-evidence-timeline";
import { InvestigationNextInspection } from "../investigation/investigation-next-inspection";

export interface SituationRoomProductProps {
  data: SituationPackAssemblyResponse;
  syncRunsLimit: number;
  onReload: () => void | Promise<void>;
}

/**
 * Dedicated read-only situation room: bounded evidence pack from app-api only—no client-side scoring
 * or synthesis beyond layout and navigation.
 */
export function SituationRoomProduct({ data, syncRunsLimit, onReload }: SituationRoomProductProps) {
  const inv = data.investigation_context;
  const wf = data.workflow_history;
  const au = data.audit_history;

  return (
    <div className="situation-room-product">
      <header className="situation-room-hero situation-room-hero--product">
        <div className="situation-room-hero__text">
          <p className="eyebrow">Phase 2 · read-only evidence pack</p>
          <h2 className="situation-room-hero__title">Situation room</h2>
          <p className="body-copy situation-room-hero__lede">
            One operator-facing surface for the backend-assembled pack: inventory, topology, policies, readiness
            snapshot history, workflow and audit history, plus a nested investigation context (recent change
            intelligence, platform status, capabilities). This organizes visibility—it does not validate intent,
            approve changes, score risk, or execute workflows.
          </p>
        </div>
        <div className="situation-room-hero__actions">
          <button type="button" className="situation-room-toolbar-reload" onClick={() => void onReload()}>
            Reload assembly
          </button>
          <button type="button" className="inline-action" onClick={() => navigateToEvidenceView("overview")}>
            Back to Overview
          </button>
        </div>
      </header>

      <div className="situation-room-metadata-strip" aria-label="Evidence pack metadata">
        <span>Pack generated {formatDateTime(data.metadata.generated_at)}</span>
        <span>
          Pack contract <code>{data.safety.contract_id}</code>
        </span>
        <span>Authority {data.safety.authority_posture.replace(/_/g, " ")}</span>
        <span>
          Sync window (URL) {syncRunsLimit} · nested change summary applied{" "}
          {inv.recent_change.sync_runs_limit_applied} · workflow history sync-run load{" "}
          {wf.read_side_query.sync_runs_limit_effective ?? "—"} · audit sync-run load{" "}
          {au.read_side_query.sync_runs_limit_effective ?? "—"}
        </span>
      </div>

      <section className="situation-room-safety-section" aria-labelledby="sr-pack-safety-heading">
        <h3 id="sr-pack-safety-heading">Safety framing (evidence pack)</h3>
        <p className="callout situation-room-safety-section__primary">{data.safety.summary_disclaimer}</p>
        <p className="table-note situation-room-safety-section__guidance">{data.situation_pack_guidance_framing}</p>
        <h4 className="situation-room-safety-section__sub">Explicit non-claims</h4>
        <ul className="situation-room-nonclaims situation-room-nonclaims--full">
          {data.safety.explicit_non_claims.map((c) => (
            <li key={c}>{c.replace(/_/g, " ")}</li>
          ))}
        </ul>
      </section>

      <section className="situation-room-pack-surfaces" aria-labelledby="sr-surfaces-heading">
        <h3 id="sr-surfaces-heading">Pack surfaces (read-side excerpts)</h3>
        <p className="table-note situation-room-pack-surfaces__intro">
          Each card summarizes fields already returned by the corresponding API in this assembly. Honest absence and
          partiality stay on the full pages—this grid is for orientation only.
        </p>
        <div className="situation-room-pack-grid">
          <article className="detail-card situation-room-surface-card">
            <h4>Devices</h4>
            <p className="situation-room-surface-card__stat">
              <strong>{data.devices.count}</strong> devices · {data.devices.data_status} · {data.devices.serving_mode.replace(/_/g, " ")}
            </p>
            <p className="table-note">{data.devices.summary}</p>
            <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("devices")}>
              Open Devices
            </button>
          </article>
          <article className="detail-card situation-room-surface-card">
            <h4>Topology</h4>
            <p className="situation-room-surface-card__stat">
              <strong>{data.topology.topology.nodes.length}</strong> nodes · <strong>{data.topology.topology.links.length}</strong> links ·{" "}
              {data.topology.data_status}
            </p>
            <p className="table-note">{data.topology.summary}</p>
            <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("topology")}>
              Open Topology
            </button>
          </article>
          <article className="detail-card situation-room-surface-card">
            <h4>Policies</h4>
            <p className="situation-room-surface-card__stat">
              <strong>{data.policies.count}</strong> policies · {data.policies.data_status}
            </p>
            <p className="table-note">{data.policies.summary}</p>
            <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("policies")}>
              Open Policies
            </button>
          </article>
          <article className="detail-card situation-room-surface-card">
            <h4>Readiness snapshot history</h4>
            <p className="situation-room-surface-card__stat">
              <strong>{data.readiness.count}</strong> rows · {data.readiness.data_status}
            </p>
            <p className="table-note">{data.readiness.summary}</p>
            <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("readiness")}>
              Open Readiness
            </button>
          </article>
          <article className="detail-card situation-room-surface-card">
            <h4>Workflow history</h4>
            <p className="situation-room-surface-card__stat">
              <strong>{wf.count}</strong> events · {wf.data_status} · baseline {wf.baseline_summary.baseline_posture.replace(/_/g, " ")}
            </p>
            <p className="table-note">{wf.summary}</p>
            <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("workflows")}>
              Open Workflow history
            </button>
          </article>
          <article className="detail-card situation-room-surface-card">
            <h4>Audit history</h4>
            <p className="situation-room-surface-card__stat">
              <strong>{au.count}</strong> events · {au.data_status} · baseline {au.baseline_summary.baseline_posture.replace(/_/g, " ")}
            </p>
            <p className="table-note">{au.summary}</p>
            <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("audit")}>
              Open Audit history
            </button>
          </article>
        </div>
      </section>

      <section className="situation-room-nested-investigation" aria-labelledby="sr-inv-nested-heading">
        <h3 id="sr-inv-nested-heading">Investigation context (nested assembly)</h3>
        <p className="table-note situation-room-nested-investigation__intro">
          The same bounded investigation workspace contracts as <strong>Investigation</strong>—recent change intelligence,
          platform status, and capabilities—embedded here so you can correlate pack-wide surfaces with cross-domain
          interpretation support. Still not validation, drift verdicts, or workflow authority.
        </p>
        <InvestigationEvidenceTimeline data={inv} />
        <InvestigationContextPanels data={inv} syncRunsLimit={syncRunsLimit} />
        <InvestigationNextInspection data={inv} />
      </section>

      <section className="situation-room-pack-notes" aria-labelledby="sr-notes-heading">
        <h3 id="sr-notes-heading">Pack assembly notes</h3>
        <ul className="situation-room-assembly-notes">
          {data.assembly_notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      <section className="situation-room-nav-hub" aria-labelledby="sr-nav-heading">
        <h3 id="sr-nav-heading">Open full product surfaces</h3>
        <p className="table-note">
          Authoritative detail remains on each read-only route. Use <strong>Open investigation workspace</strong> when
          you want the same nested assembly without the six pack surface cards above.
        </p>
        <div className="situation-room-nav-hub__buttons">
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToInvestigationView(syncRunsLimit)}>
            Open investigation workspace
          </button>
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("devices")}>
            Devices
          </button>
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("topology")}>
            Topology
          </button>
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("policies")}>
            Policies
          </button>
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("capabilities")}>
            Capabilities
          </button>
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("readiness")}>
            Readiness
          </button>
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("workflows")}>
            Workflow history
          </button>
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("audit")}>
            Audit history
          </button>
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("platform-health")}>
            Platform Health
          </button>
        </div>
      </section>
    </div>
  );
}
