import type { CrossDomainDeltaDigestResponse } from "../../api/contracts";
import { RecentChangeIntelligencePanel } from "../overview/recent-change";
import { evidenceStatusPillClass } from "../../lib/change-intelligence-domain-labels";
import {
  extractExamplePolicyIdFromDigestNotes,
  extractExampleTopologyNodeIdFromDigestNotes,
} from "../../lib/delta-digest-pivots";
import { navigateToInvestigationView } from "../../lib/investigation-navigation";
import { navigateToPolicyDossierWorkspace } from "../../lib/policy-dossier-navigation";
import { navigateToSituationRoomView } from "../../lib/situation-room-navigation";
import { navigateToTopologyDossier } from "../../lib/topology-dossier-navigation";
import { formatDateTime } from "../../lib/presentation";
import { navigateToEvidenceView } from "../../lib/url-app-state";

export interface DeltaDigestProductProps {
  data: CrossDomainDeltaDigestResponse;
  syncRunsLimit: number;
  onReload: () => void | Promise<void>;
}

function nonClaimLabel(raw: string): string {
  return raw.replace(/_/g, " ");
}

export function DeltaDigestProduct({ data, syncRunsLimit, onReload }: DeltaDigestProductProps) {
  const pivotSection = data.sections.find((s) => s.section_key === "recommended_pivots");
  const pivotNotes = pivotSection?.detail_notes ?? [];
  const examplePolicyId = extractExamplePolicyIdFromDigestNotes(pivotNotes);
  const exampleNodeId = extractExampleTopologyNodeIdFromDigestNotes(pivotNotes);

  const weakSectionCount = data.sections.filter((s) =>
    ["partial", "absent", "unavailable"].includes(s.evidence_status),
  ).length;
  const showSparseBanner =
    data.completeness_posture === "bounded_partial" || weakSectionCount >= 3;

  return (
    <div className="delta-digest-product">
      <header className="delta-digest-hero">
        <div className="delta-digest-hero__text">
          <p className="eyebrow">Phase 2 · cross-domain digest (not a timeline)</p>
          <h2 className="delta-digest-hero__title">Delta digest</h2>
          <p className="body-copy delta-digest-hero__lede">
            Bounded “what changed?” orientation across existing read-side contracts—navigation and caveats, not a
            forensic chronology or a duplicate of full product pages.
          </p>
        </div>
        <div className="delta-digest-hero__actions">
          <button type="button" className="inline-action" onClick={() => navigateToEvidenceView("overview")}>
            Back to Overview
          </button>
          <button type="button" className="delta-digest-toolbar-reload" onClick={() => void onReload()}>
            Reload digest
          </button>
        </div>
      </header>

      <div className="delta-digest-metadata">
        <span>Generated {formatDateTime(data.metadata.generated_at)}</span>
        <span>
          Contract <code>{data.contract_id}</code>
        </span>
        <span>
          Completeness <span className="status-pill status-neutral">{data.completeness_posture.replace(/_/g, " ")}</span>
        </span>
        <span>
          Sync window applied: {data.sync_runs_limit_applied} · URL requested: {syncRunsLimit}
        </span>
      </div>

      {showSparseBanner ? (
        <p className="callout delta-digest-sparse-banner" role="status">
          This assembly may be sparse or partial for some domains—treat absent or degraded sections as honest limits,
          not silent confirmation. Open owning surfaces for full list semantics.
        </p>
      ) : null}

      <section className="delta-digest-pivots" aria-labelledby="delta-digest-pivots-heading">
        <h3 id="delta-digest-pivots-heading">Quick pivots</h3>
        <p className="table-note delta-digest-pivots__hint">
          Same bounded sync window is preserved where applicable. Investigation records entry from this digest.
        </p>
        <div className="delta-digest-pivots__grid">
          <button
            type="button"
            className="nav-drilldown-button"
            onClick={() => navigateToInvestigationView(syncRunsLimit, { invFrom: "delta-digest" })}
          >
            Investigation workspace
          </button>
          <button
            type="button"
            className="nav-drilldown-button"
            onClick={() => navigateToSituationRoomView(syncRunsLimit)}
          >
            Situation room
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
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("workflows")}>
            Workflow history
          </button>
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("audit")}>
            Audit history
          </button>
          {examplePolicyId ? (
            <button
              type="button"
              className="nav-drilldown-button"
              onClick={() => navigateToPolicyDossierWorkspace(examplePolicyId, "delta_digest_workspace")}
            >
              Example policy dossier
            </button>
          ) : null}
          {exampleNodeId ? (
            <button
              type="button"
              className="nav-drilldown-button"
              onClick={() => navigateToTopologyDossier(exampleNodeId, "node", "delta_digest_workspace")}
            >
              Example topology dossier (node)
            </button>
          ) : null}
        </div>
      </section>

      <section className="delta-digest-safety" aria-labelledby="delta-digest-safety-heading">
        <h3 id="delta-digest-safety-heading">Safety framing</h3>
        <p className="callout delta-digest-safety__primary">{data.safety.summary_disclaimer}</p>
        {data.digest_framing_notes.length > 0 ? (
          <ul className="delta-digest-framing-notes">
            {data.digest_framing_notes.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
        <div className="delta-digest-nonclaims">
          <h4>Explicit non-claims</h4>
          <ul>
            {data.safety.explicit_non_claims.map((c) => (
              <li key={c}>
                <code>{c}</code> — {nonClaimLabel(c)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <details className="delta-digest-embedded-rc">
        <summary>Embedded recent change summary (same sync window; expand for domain rows)</summary>
        <RecentChangeIntelligencePanel
          data={data.recent_change_summary}
          error={null}
          isLoading={false}
          onRetry={() => void onReload()}
        />
      </details>

      <section className="delta-digest-sections" aria-labelledby="delta-digest-sections-heading">
        <h3 id="delta-digest-sections-heading">Digest sections</h3>
        <ol className="delta-digest-section-list">
          {data.sections.map((section, idx) => (
            <li key={section.section_key} className="delta-digest-section-card">
              <div className="delta-digest-section-card__head">
                <span className="situation-room-section-index" aria-hidden>
                  {idx + 1}
                </span>
                <div>
                  <h4 className="delta-digest-section-card__title">{section.headline}</h4>
                  <p className="table-note">
                    <code>{section.section_key}</code>
                  </p>
                </div>
                <span className={evidenceStatusPillClass(section.evidence_status)} title={section.evidence_status}>
                  {section.evidence_status}
                </span>
              </div>
              {section.detail_notes.length > 0 ? (
                <ul className="delta-digest-detail-notes">
                  {section.detail_notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              ) : null}
              {section.caveats.length > 0 ? (
                <div className="delta-digest-caveats">
                  <p className="delta-digest-caveats__label">Caveats</p>
                  <ul>
                    {section.caveats.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="delta-digest-provenance" aria-labelledby="delta-digest-prov-heading">
        <h3 id="delta-digest-prov-heading">Source provenance</h3>
        <ul className="delta-digest-provenance-list">
          {data.source_provenance.map((row) => (
            <li key={`${row.source}-${row.note}`}>
              <strong>{row.source}</strong>
              {row.generated_at ? <span className="delta-digest-prov-time"> · {formatDateTime(row.generated_at)}</span> : null}
              <p className="table-note">{row.note}</p>
              {row.data_status_or_serving_hint ? (
                <p className="table-note">
                  <code>{row.data_status_or_serving_hint}</code>
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
