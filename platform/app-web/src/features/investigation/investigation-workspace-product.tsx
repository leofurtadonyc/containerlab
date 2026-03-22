import type { ReactNode } from "react";

import type { ChangeEvidenceDomain, InvestigationContextAssemblyResponse } from "../../api/contracts";
import { StatusPill } from "../../components/status-pill";
import {
  CHANGE_INTELLIGENCE_DOMAIN_LABELS,
  evidenceStatusPillClass,
} from "../../lib/change-intelligence-domain-labels";
import { countRecentChangeEvidenceStatuses } from "../../lib/change-intelligence-cues";
import {
  isChangeIntelligenceHistorySurfaceDomain,
  isChangeIntelligenceProductSurfaceDomain,
  viewIdForChangeIntelligenceHistoryDomain,
} from "../../lib/change-intelligence-navigation";
import { formatDateTime } from "../../lib/presentation";
import { navigateToEvidenceView } from "../../lib/url-app-state";
import { InvestigationContextPanels } from "./investigation-context-panels";
import { InvestigationEvidenceTimeline } from "./investigation-evidence-timeline";

export interface InvestigationWorkspaceProductProps {
  data: InvestigationContextAssemblyResponse;
  syncRunsLimit: number;
  onReload: () => void | Promise<void>;
}

function renderChangeDomainAction(domain: ChangeEvidenceDomain): ReactNode {
  if (isChangeIntelligenceProductSurfaceDomain(domain)) {
    return (
      <button
        type="button"
        className="nav-drilldown-button"
        onClick={() => navigateToEvidenceView(domain)}
      >
        Open {CHANGE_INTELLIGENCE_DOMAIN_LABELS[domain]}
      </button>
    );
  }
  if (isChangeIntelligenceHistorySurfaceDomain(domain)) {
    return (
      <button
        type="button"
        className="nav-drilldown-button"
        onClick={() => navigateToEvidenceView(viewIdForChangeIntelligenceHistoryDomain(domain))}
      >
        Open {CHANGE_INTELLIGENCE_DOMAIN_LABELS[domain]}
      </button>
    );
  }
  if (domain === "readiness") {
    return (
      <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("readiness")}>
        Open Readiness
      </button>
    );
  }
  return null;
}

/**
 * Dedicated read-only investigation workspace: bounded evidence from app-api assembly only.
 */
export function InvestigationWorkspaceProduct({
  data,
  syncRunsLimit,
  onReload,
}: InvestigationWorkspaceProductProps) {
  const rc = data.recent_change;
  const ps = data.platform_status;
  const cap = data.capabilities;
  const evidenceMix = countRecentChangeEvidenceStatuses(rc.domains);
  const dry = cap.dry_run_readiness;
  const readPaths = ps.read_paths ?? [];

  return (
    <div className="investigation-workspace-product">
      <header className="investigation-workspace-hero">
        <div className="investigation-workspace-hero__text">
          <p className="eyebrow">Phase 2 · read-only assembly</p>
          <h2 className="investigation-workspace-hero__title">Investigation workspace</h2>
          <p className="body-copy investigation-workspace-hero__lede">
            One operator-facing surface that stitches together the same backend contracts you already trust—recent
            change intelligence, current platform posture, and the capability matrix—without inventing validation,
            drift verdicts, safe-to-change scoring, workflow execution, or approval semantics.
          </p>
        </div>
        <div className="investigation-workspace-hero__actions">
          <button type="button" className="inline-action" onClick={() => navigateToEvidenceView("overview")}>
            Back to Overview
          </button>
          <button type="button" className="investigation-workspace-toolbar-reload" onClick={() => void onReload()}>
            Reload assembly
          </button>
        </div>
      </header>

      <div className="investigation-workspace-metadata">
        <span>Assembly generated {formatDateTime(data.metadata.generated_at)}</span>
        <span>
          Contract <code>{data.safety.contract_id}</code>
        </span>
        <span>Authority {data.safety.authority_posture.replace(/_/g, " ")}</span>
        <span>
          Sync window requested: {syncRunsLimit} · applied in nested summary: {rc.sync_runs_limit_applied}
        </span>
      </div>

      <InvestigationEvidenceTimeline data={data} />
      <InvestigationContextPanels data={data} syncRunsLimit={syncRunsLimit} />

      <section className="investigation-workspace-safety" aria-labelledby="inv-safety-heading">
        <h3 id="inv-safety-heading">Safety framing (always visible)</h3>
        <p className="callout investigation-workspace-safety__primary">{data.safety.summary_disclaimer}</p>
        <div className="investigation-workspace-safety__grid">
          <article className="detail-card investigation-workspace-safety__card">
            <h4>Investigation workspace explicit non-claims</h4>
            <ul className="notes-list investigation-workspace-nonclaim-list">
              {data.safety.explicit_non_claims.map((claim) => (
                <li key={claim}>
                  <code>{claim}</code>
                </li>
              ))}
            </ul>
          </article>
          <article className="detail-card investigation-workspace-safety__card">
            <h4>Nested change intelligence disclaimer</h4>
            <p className="table-note">{rc.safety.summary_disclaimer}</p>
            <p className="table-note">
              Completeness posture: <strong>{rc.completeness_posture.replace(/_/g, " ")}</strong> · Window:{" "}
              <strong>{rc.window_semantics.replace(/_/g, " ")}</strong> · Readiness rows considered:{" "}
              {rc.readiness_snapshots_considered}
            </p>
          </article>
        </div>
      </section>

      {data.assembly_notes.length > 0 ? (
        <section className="investigation-workspace-assembly-notes">
          <h3>What the backend assembled</h3>
          <ul className="notes-list">
            {data.assembly_notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="investigation-workspace-pane-grid">
        <section className="detail-card investigation-workspace-pane" aria-labelledby="inv-rc-heading">
          <div className="investigation-workspace-pane__head">
            <h3 id="inv-rc-heading">Recent change intelligence</h3>
            <p className="table-note">
              Cross-domain summary only—same contract as Overview. Evidence mix:{" "}
              <strong>{evidenceMix.present}</strong> present, <strong>{evidenceMix.partial}</strong> partial,{" "}
              <strong>{evidenceMix.absent}</strong> absent.
            </p>
            <p className="table-note">
              Nested contract <code>{rc.safety.contract_id}</code> · authority{" "}
              {rc.safety.authority_posture.replace(/_/g, " ")}
            </p>
          </div>
          <ul className="investigation-workspace-domain-list">
            {rc.domains.map((slice) => {
              const domainAction = renderChangeDomainAction(slice.domain);
              return (
                <li key={slice.domain}>
                  <div className="investigation-workspace-domain-row">
                    <span className="investigation-workspace-domain-label">
                      {CHANGE_INTELLIGENCE_DOMAIN_LABELS[slice.domain]}
                    </span>
                    <span className={evidenceStatusPillClass(slice.evidence_status)} title={slice.evidence_status}>
                      {slice.evidence_status}
                    </span>
                  </div>
                  <p className="investigation-workspace-headline">{slice.headline}</p>
                  {slice.detail_notes.length > 0 ? (
                    <ul className="notes-list investigation-workspace-detail-notes">
                      {slice.detail_notes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  ) : null}
                  {domainAction ? (
                    <div className="investigation-workspace-domain-actions">{domainAction}</div>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {rc.aggregation_notes.length > 0 ? (
            <ul className="notes-list investigation-workspace-aggregation-notes">
              {rc.aggregation_notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="detail-card investigation-workspace-pane" aria-labelledby="inv-platform-heading">
          <div className="investigation-workspace-pane__head">
            <h3 id="inv-platform-heading">Current platform posture</h3>
            <p className="table-note">{ps.summary}</p>
          </div>
          <div className="investigation-workspace-recovery">
            <p>
              <strong>Recovery:</strong> {ps.recovery.baseline_posture.replace(/_/g, " ")} ·{" "}
              <strong>Read-side:</strong> {ps.recovery.read_side_posture.replace(/_/g, " ")}
            </p>
            <p className="table-note">{ps.recovery.summary}</p>
            <p className="table-note">
              Persisted artifacts: inventory {String(ps.recovery.persisted_artifacts.inventory_snapshot)} · topology{" "}
              {String(ps.recovery.persisted_artifacts.topology_snapshot)} · policy{" "}
              {String(ps.recovery.persisted_artifacts.policy_snapshot)} · sync history{" "}
              {String(ps.recovery.persisted_artifacts.sync_history)} · readiness{" "}
              {String(ps.recovery.persisted_artifacts.readiness_snapshot)}
            </p>
            {ps.recovery.notes.length > 0 ? (
              <ul className="notes-list">
                {ps.recovery.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <h4 className="investigation-workspace-subheading">Collector read paths</h4>
          {readPaths.length > 0 ? (
            <div className="investigation-workspace-read-paths">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Model family</th>
                    <th scope="col">Observation</th>
                    <th scope="col">Targets</th>
                    <th scope="col">Degraded scope</th>
                  </tr>
                </thead>
                <tbody>
                  {readPaths.map((rp) => (
                    <tr key={rp.model_family}>
                      <td>{rp.model_family}</td>
                      <td>{rp.observation_state}</td>
                      <td>
                        {rp.observed_target_count}/{rp.configured_target_count}
                      </td>
                      <td className="investigation-workspace-table-clip">{rp.degraded_scope_summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="table-note">No read-path rows in this platform-status payload.</p>
          )}

          <h4 className="investigation-workspace-subheading">Declared components (observed)</h4>
          <ul className="investigation-workspace-component-list compact-list">
            {ps.components.map((c) => (
              <li key={c.name}>
                <span>{c.name}</span>
                <StatusPill value={c.observation_state} />
              </li>
            ))}
          </ul>
        </section>

        <section className="detail-card investigation-workspace-pane investigation-workspace-pane--wide" aria-labelledby="inv-cap-heading">
          <div className="investigation-workspace-pane__head">
            <h3 id="inv-cap-heading">Capabilities &amp; planning posture</h3>
            <p className="table-note">{cap.summary}</p>
          </div>
          <div className="investigation-workspace-cap-meta">
            <p>
              Matrix: <strong>{cap.data_status.replace(/_/g, " ")}</strong> · <strong>{cap.count}</strong> rows
              {cap.readiness_snapshot_id ? (
                <>
                  {" "}
                  · Readiness anchor <code>{cap.readiness_snapshot_id}</code>
                </>
              ) : null}
            </p>
            {cap.readiness_persisted_at ? (
              <p className="table-note">Readiness persisted at {formatDateTime(cap.readiness_persisted_at)}</p>
            ) : null}
          </div>

          {dry ? (
            <div className="investigation-workspace-dry-readiness">
              <h4>Dry-run readiness assessment (planning-only)</h4>
              <p className="table-note">
                Status <strong>{dry.status}</strong> · Planning <strong>{dry.planning_readiness}</strong> · Phase
                recommendation <strong>{dry.phase_recommendation}</strong>
              </p>
              {dry.strongest_blockers.length > 0 ? (
                <div>
                  <p className="table-note">
                    <strong>Strongest blockers ({dry.strongest_blockers.length}):</strong>
                  </p>
                  <ul className="notes-list">
                    {dry.strongest_blockers.slice(0, 5).map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="table-note">No dry-run readiness block included in this capabilities payload.</p>
          )}

          <h4 className="investigation-workspace-subheading">Capability matrix (first rows)</h4>
          {cap.items.length > 0 ? (
            <div className="investigation-workspace-cap-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Feature</th>
                    <th scope="col">Domain</th>
                    <th scope="col">Support</th>
                    <th scope="col">Delivery</th>
                  </tr>
                </thead>
                <tbody>
                  {cap.items.slice(0, 10).map((row) => (
                    <tr key={`${row.domain}-${row.feature}`}>
                      <td>{row.feature}</td>
                      <td>{row.domain}</td>
                      <td>{row.support_status}</td>
                      <td>{row.delivery_tier.replace(/_/g, " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {cap.items.length > 10 ? (
                <p className="table-note">Showing 10 of {cap.items.length} rows—full matrix on Capabilities.</p>
              ) : null}
            </div>
          ) : (
            <p className="table-note">No capability rows in this response.</p>
          )}
        </section>
      </div>

      <section className="detail-card investigation-workspace-nav-hub" aria-labelledby="inv-nav-heading">
        <h3 id="inv-nav-heading">Navigate to full product surfaces</h3>
        <p className="table-note">
          These routes expose the authoritative read-only contracts. This workspace does not replace them—it aligns
          what you already pulled above with one place to start from.
        </p>
        <div className="investigation-workspace-nav-hub__buttons">
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
