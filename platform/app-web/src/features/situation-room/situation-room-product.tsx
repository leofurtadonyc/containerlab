import type { SituationPackAssemblyResponse } from "../../api/contracts";
import { StatusPill } from "../../components/status-pill";
import { CHANGE_INTELLIGENCE_DOMAIN_LABELS } from "../../lib/change-intelligence-domain-labels";
import { buildSituationEvidenceGapNotes } from "../../lib/situation-room-evidence-gaps";
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
  const ps = inv.platform_status;
  const cap = inv.capabilities;
  const dry = cap.dry_run_readiness;
  const gapNotes = buildSituationEvidenceGapNotes(data);
  const readPaths = ps.read_paths ?? [];
  const degradedPaths = readPaths.filter((rp) => rp.observation_state !== "ok").length;

  return (
    <div className="situation-room-product">
      <header className="situation-room-hero situation-room-hero--product">
        <div className="situation-room-hero__text">
          <p className="eyebrow">Phase 2 · read-only evidence pack</p>
          <h2 className="situation-room-hero__title">Situation room</h2>
          <p className="body-copy situation-room-hero__lede">
            Cross-domain sections below group the same backend-assembled evidence: current inventory truth, platform
            read-path posture, recent change signals, persisted history substrates, planning posture, honest gaps, then
            nested investigation interpretation support. This organizes visibility—it does not validate intent, approve
            changes, score risk, or execute workflows.
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

      <section className="situation-room-cross-section" aria-labelledby="sr-s1-heading">
        <h3 id="sr-s1-heading" className="situation-room-cross-section__title">
          <span className="situation-room-section-index" aria-hidden="true">
            1
          </span>
          Current inventory &amp; policy truth
        </h3>
        <p className="table-note situation-room-cross-section__intro">
          Live or persisted-fallback inventory, topology, and policy snapshots as returned in this pack—not a
          completeness guarantee across every vendor family.
        </p>
        <div className="situation-room-pack-grid situation-room-pack-grid--triple">
          <article className="detail-card situation-room-surface-card">
            <h4>Devices</h4>
            <p className="situation-room-surface-card__stat">
              <strong>{data.devices.count}</strong> devices · {data.devices.data_status} ·{" "}
              {data.devices.serving_mode.replace(/_/g, " ")}
            </p>
            <p className="table-note">{data.devices.summary}</p>
            <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("devices")}>
              Open Devices
            </button>
          </article>
          <article className="detail-card situation-room-surface-card">
            <h4>Topology</h4>
            <p className="situation-room-surface-card__stat">
              <strong>{data.topology.topology.nodes.length}</strong> nodes · <strong>{data.topology.topology.links.length}</strong>{" "}
              links · {data.topology.data_status}
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
        </div>
      </section>

      <section className="situation-room-cross-section" aria-labelledby="sr-s2-heading">
        <h3 id="sr-s2-heading" className="situation-room-cross-section__title">
          <span className="situation-room-section-index" aria-hidden="true">
            2
          </span>
          Platform &amp; read-path posture
        </h3>
        <p className="table-note situation-room-cross-section__intro">
          From nested platform status—current recovery and collector read paths—not Grafana dashboards as authority.
        </p>
        <article className="detail-card situation-room-platform-card">
          <p className="situation-room-platform-card__lead">
            <strong>Status:</strong> {ps.status} · <strong>Topology:</strong> {ps.topology_name}
          </p>
          <p className="table-note">{ps.summary}</p>
          <p className="table-note">
            <strong>Recovery:</strong> {ps.recovery.baseline_posture.replace(/_/g, " ")} ·{" "}
            <strong>Read-side:</strong> {ps.recovery.read_side_posture.replace(/_/g, " ")}
          </p>
          <p className="table-note">{ps.recovery.summary}</p>
          <p className="table-note">
            Read paths: <strong>{readPaths.length}</strong> families · <strong>{degradedPaths}</strong> not in{" "}
            <code>ok</code> observation
          </p>
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("platform-health")}>
            Open Platform Health
          </button>
        </article>
      </section>

      <section className="situation-room-cross-section" aria-labelledby="sr-s3-heading">
        <h3 id="sr-s3-heading" className="situation-room-cross-section__title">
          <span className="situation-room-section-index" aria-hidden="true">
            3
          </span>
          Recent change signals (bounded window)
        </h3>
        <p className="table-note situation-room-cross-section__intro">
          Aggregated change intelligence slices for the same sync-run window as the nested summary—interpretation only,
          not drift verdicts or validation.
        </p>
        <div className="situation-room-recent-change-strip">
          <p className="situation-room-recent-change-strip__meta table-note">
            Completeness <strong>{inv.recent_change.completeness_posture.replace(/_/g, " ")}</strong> · window{" "}
            <strong>{inv.recent_change.window_semantics.replace(/_/g, " ")}</strong> · applied{" "}
            <strong>{inv.recent_change.sync_runs_limit_applied}</strong> sync runs · readiness rows considered{" "}
            <strong>{inv.recent_change.readiness_snapshots_considered}</strong>
          </p>
          <ul className="situation-room-recent-domain-list">
            {inv.recent_change.domains.map((d) => (
              <li key={d.domain} className="situation-room-recent-domain-row">
                <span className="situation-room-recent-domain-label">{CHANGE_INTELLIGENCE_DOMAIN_LABELS[d.domain]}</span>
                <StatusPill value={d.evidence_status} />
                <span className="table-note situation-room-recent-domain-headline">{d.headline}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="situation-room-cross-section" aria-labelledby="sr-s4-heading">
        <h3 id="sr-s4-heading" className="situation-room-cross-section__title">
          <span className="situation-room-section-index" aria-hidden="true">
            4
          </span>
          Persistence &amp; history substrate
        </h3>
        <p className="table-note situation-room-cross-section__intro">
          Sync-derived workflow and audit streams plus persisted readiness snapshot history—not workflow lifecycle
          execution or SOC-grade audit.
        </p>
        <div className="situation-room-pack-grid situation-room-pack-grid--triple">
          <article className="detail-card situation-room-surface-card">
            <h4>Workflow history</h4>
            <p className="situation-room-surface-card__stat">
              <strong>{wf.count}</strong> events · {wf.data_status} · baseline{" "}
              {wf.baseline_summary.baseline_posture.replace(/_/g, " ")}
            </p>
            <p className="table-note">{wf.summary}</p>
            <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("workflows")}>
              Open Workflow history
            </button>
          </article>
          <article className="detail-card situation-room-surface-card">
            <h4>Audit history</h4>
            <p className="situation-room-surface-card__stat">
              <strong>{au.count}</strong> events · {au.data_status} · baseline{" "}
              {au.baseline_summary.baseline_posture.replace(/_/g, " ")}
            </p>
            <p className="table-note">{au.summary}</p>
            <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("audit")}>
              Open Audit history
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
        </div>
      </section>

      <section className="situation-room-cross-section" aria-labelledby="sr-s5-heading">
        <h3 id="sr-s5-heading" className="situation-room-cross-section__title">
          <span className="situation-room-section-index" aria-hidden="true">
            5
          </span>
          Readiness &amp; capability planning posture
        </h3>
        <p className="table-note situation-room-cross-section__intro">
          Capability matrix and dry-run readiness excerpt from the nested assembly—planning support only, not dry-run
          execution or approval.
        </p>
        <article className="detail-card situation-room-capabilities-card">
          <p className="situation-room-capabilities-card__stat">
            Matrix <strong>{cap.data_status.replace(/_/g, " ")}</strong> · <strong>{cap.count}</strong> capability rows
            {cap.readiness_snapshot_id ? (
              <>
                {" "}
                · readiness anchor <code>{cap.readiness_snapshot_id}</code>
              </>
            ) : null}
          </p>
          <p className="table-note">{cap.summary}</p>
          {dry ? (
            <p className="table-note">
              Dry-run readiness (planning-only): <strong>{dry.status}</strong> · planning <strong>{dry.planning_readiness}</strong>
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
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("capabilities")}>
            Open Capabilities
          </button>
        </article>
      </section>

      <section className="situation-room-cross-section" aria-labelledby="sr-s6-heading">
        <h3 id="sr-s6-heading" className="situation-room-cross-section__title">
          <span className="situation-room-section-index" aria-hidden="true">
            6
          </span>
          Honest evidence gaps &amp; partiality
        </h3>
        <p className="table-note situation-room-cross-section__intro">
          Derived only from fields already present in this pack—no synthetic cross-domain scoring. Absence of an entry
          here does not imply “green everywhere.”
        </p>
        {gapNotes.length === 0 ? (
          <p className="table-note situation-room-gaps-empty">
            No explicit partiality callouts matched the simple rules for this response—still not a completeness or
            validation guarantee.
          </p>
        ) : (
          <ul className="situation-room-gap-list">
            {gapNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="situation-room-nested-investigation situation-room-cross-section" aria-labelledby="sr-inv-nested-heading">
        <h3 id="sr-inv-nested-heading" className="situation-room-cross-section__title">
          <span className="situation-room-section-index" aria-hidden="true">
            7
          </span>
          Interpretation support (nested investigation)
        </h3>
        <p className="table-note situation-room-nested-investigation__intro">
          Recency anchors, cross-domain panels, and optional next-inspection hints from the same investigation assembly
          embedded in this pack—still not a unified forensic timeline or workflow chronology.
        </p>
        <InvestigationEvidenceTimeline data={inv} />
        <InvestigationContextPanels data={inv} syncRunsLimit={syncRunsLimit} />
        <InvestigationNextInspection data={inv} />
      </section>

      <section className="situation-room-pack-notes situation-room-cross-section" aria-labelledby="sr-notes-heading">
        <h3 id="sr-notes-heading" className="situation-room-cross-section__title">
          <span className="situation-room-section-index" aria-hidden="true">
            8
          </span>
          Pack assembly notes
        </h3>
        <ul className="situation-room-assembly-notes">
          {data.assembly_notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      <section className="situation-room-nav-hub situation-room-cross-section" aria-labelledby="sr-nav-heading">
        <h3 id="sr-nav-heading" className="situation-room-cross-section__title">
          <span className="situation-room-section-index" aria-hidden="true">
            9
          </span>
          Open full product surfaces
        </h3>
        <p className="table-note">
          Authoritative detail remains on each read-only route. Use <strong>Open investigation workspace</strong> for the
          nested assembly without the numbered cross-domain sections above.
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
