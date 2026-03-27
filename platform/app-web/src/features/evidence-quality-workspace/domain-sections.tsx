import type { EvidenceQualityRow, EvidenceQualitySubjectDomain } from "../../api/contracts";
import { navigateToEvidenceConsistencyWorkspace } from "../../lib/evidence-consistency-navigation";
import { navigateToMaintenanceEvidenceWorkspace } from "../../lib/maintenance-evidence-workspace-navigation";
import { navigateToMaintenanceWindowWorkspaceSetup } from "../../lib/maintenance-window-workspace-navigation";
import { navigateToStabilityWorkspace } from "../../lib/stability-workspace-navigation";
import { navigateToEvidenceView } from "../../lib/url-app-state";
import { dimensionLabel, evidenceQualityCueLabel } from "./labels";

type SectionKey =
  | "platform"
  | "devices"
  | "topology"
  | "policies"
  | "capabilities"
  | "services"
  | "maintenance"
  | "stability"
  | "global";

const DOMAIN_MEMBERS: Record<SectionKey, EvidenceQualitySubjectDomain[]> = {
  platform: ["platform_read_paths", "platform_recovery"],
  devices: ["devices"],
  topology: ["topology"],
  policies: ["policies"],
  capabilities: ["capabilities"],
  services: [],
  maintenance: [],
  stability: [],
  global: ["global"],
};

interface SectionMeta {
  key: SectionKey;
  title: string;
  lede: string;
  /** Sections without API rows today — pivots explain where weakness is reviewed next. */
  pivotOnly?: boolean;
}

const SECTIONS: SectionMeta[] = [
  {
    key: "platform",
    title: "Platform & collection",
    lede:
      "Collector-to-backend read paths and recovery posture from platform status—not a substitute for live lab proof.",
  },
  {
    key: "devices",
    title: "Devices (inventory)",
    lede: "Inventory serving mode, history gates, and comparison readiness—bounded Phase 2 truth.",
  },
  {
    key: "topology",
    title: "Topology",
    lede: "Topology coverage postures, history depth, and live vs persisted comparison limits.",
  },
  {
    key: "policies",
    title: "Policies",
    lede: "Policy detail modes, empty reasons, and snapshot comparison honesty.",
  },
  {
    key: "capabilities",
    title: "Capabilities",
    lede: "Matrix placeholder vs bounded rows—planning support only, not workflow eligibility.",
  },
  {
    key: "services",
    title: "Services",
    lede:
      "Service-scoped evidence lives on Service Explorer / dossier / impact surfaces. This assembly does not emit per-service rows yet.",
    pivotOnly: true,
  },
  {
    key: "maintenance",
    title: "Maintenance-oriented surfaces",
    lede:
      "Maintenance preview, maintenance evidence workspace, and maintenance window workspace hold maintenance-primary assemblies—orthogonal to this cross-cutting quality summary.",
    pivotOnly: true,
  },
  {
    key: "stability",
    title: "Stability intelligence",
    lede:
      "Operational stability summary and profiles answer steadiness vs churn—not the same question as read-path fragility here. Open Stability for that bounded story.",
    pivotOnly: true,
  },
  {
    key: "global",
    title: "Cross-domain scope",
    lede: "Notes that apply across domains when no single inventory/topology/policy row captures the limit.",
  },
];

function rowsForSection(key: SectionKey, rows: EvidenceQualityRow[]): EvidenceQualityRow[] {
  const members = DOMAIN_MEMBERS[key];
  return rows.filter((r) => members.includes(r.evidence_subject_domain));
}

export interface EvidenceQualityDomainSectionsProps {
  rows: EvidenceQualityRow[];
  syncRunsLimit: number;
}

/**
 * Per-domain evidence weakness sections: groups API rows and adds read-only pivots where
 * the backend does not yet attach rows (services, maintenance, stability).
 */
export function EvidenceQualityDomainSections({ rows, syncRunsLimit }: EvidenceQualityDomainSectionsProps) {
  return (
    <div className="evidence-quality-workspace-domains" data-testid="evidence-quality-domain-sections">
      <header className="evidence-quality-workspace-domains__intro detail-card">
        <h3 id="eqw-domains-heading">Evidence weakness by domain</h3>
        <p className="body-copy">
          This is a <strong>dedicated evidence-quality review</strong> of read-path limits—not Overview trust cues, not
          evidence-consistency alignment/tension, and not stability churn analysis. Use pivots to open authoritative
          list or workspace surfaces.
        </p>
        <div className="evidence-quality-workspace-domains__related">
          <button
            type="button"
            className="nav-drilldown-button"
            onClick={() => navigateToEvidenceConsistencyWorkspace(syncRunsLimit)}
          >
            Open evidence consistency (alignment / tension — different question)
          </button>
          <button
            type="button"
            className="nav-drilldown-button"
            onClick={() => navigateToStabilityWorkspace({ syncRunsLimit })}
          >
            Open stability workspace (steadiness / churn — different question)
          </button>
        </div>
      </header>

      {SECTIONS.map((meta) => {
        const sectionRows = rowsForSection(meta.key, rows);
        const testId = `eqw-domain-${meta.key}`;
        return (
          <section
            key={meta.key}
            className="evidence-quality-workspace-domain detail-card"
            data-testid={testId}
            aria-labelledby={`${testId}-title`}
          >
            <h4 id={`${testId}-title`} className="evidence-quality-workspace-domain__title">
              {meta.title}
            </h4>
            <p className="table-note evidence-quality-workspace-domain__lede">{meta.lede}</p>

            {meta.pivotOnly ? (
              <div className="evidence-quality-workspace-domain__pivotonly">
                <p className="body-copy">
                  {meta.key === "services" && (
                    <>
                      Review service membership, timelines, and deltas on{" "}
                      <strong>Service Explorer</strong> and related dossiers—read-only navigation below.
                    </>
                  )}
                  {meta.key === "maintenance" && (
                    <>
                      Maintenance-specific composed evidence (preview, dossier, timeline/delta) lives on maintenance
                      workspaces—not duplicated here.
                    </>
                  )}
                  {meta.key === "stability" && (
                    <>
                      Use <strong>Stability workspace</strong> for <code>operational_stability_summary_v1</code> and
                      optional profiles; this page stays on collection/read-path quality.
                    </>
                  )}
                </p>
                <div className="evidence-quality-workspace-domain__pivots">
                  {meta.key === "services" ? (
                    <>
                      <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("service-explorer")}>
                        Open Service Explorer
                      </button>
                      <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("service-dossier")}>
                        Open Service dossier (shell)
                      </button>
                      <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("service-impact-workspace")}>
                        Open Service Impact workspace
                      </button>
                    </>
                  ) : null}
                  {meta.key === "maintenance" ? (
                    <>
                      <button
                        type="button"
                        className="nav-drilldown-button"
                        onClick={() => navigateToMaintenanceEvidenceWorkspace()}
                      >
                        Open Maintenance evidence workspace
                      </button>
                      <button
                        type="button"
                        className="nav-drilldown-button"
                        onClick={() => navigateToMaintenanceWindowWorkspaceSetup()}
                      >
                        Open Maintenance window workspace
                      </button>
                      <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("maintenance-preview")}>
                        Open Maintenance Preview
                      </button>
                    </>
                  ) : null}
                  {meta.key === "stability" ? (
                    <button
                      type="button"
                      className="nav-drilldown-button"
                      onClick={() => navigateToStabilityWorkspace({ syncRunsLimit })}
                    >
                      Open Stability workspace
                    </button>
                  ) : null}
                </div>
              </div>
            ) : sectionRows.length === 0 ? (
              <p className="evidence-quality-workspace-domain--empty table-note" data-empty-reason="no-rows">
                No evidence-quality rows for this domain in this assembly—weakness may still exist on underlying GET
                responses; open the list view to inspect live payloads.
              </p>
            ) : (
              <ul className="evidence-quality-workspace-domain-rows">
                {sectionRows.map((row, idx) => (
                  <li
                    key={`${row.evidence_subject_domain}-${row.evidence_quality_dimension}-${idx}`}
                    className="evidence-quality-workspace-domain-row"
                  >
                    <div className="evidence-quality-workspace-domain-row__cues">
                      <span className="evidence-quality-workspace-cue" data-cue={row.evidence_quality_dimension}>
                        {evidenceQualityCueLabel(row.evidence_quality_dimension)}
                      </span>
                      <span className="evidence-quality-workspace-cue evidence-quality-workspace-cue--detail">
                        {dimensionLabel(row.evidence_quality_dimension)}
                      </span>
                    </div>
                    <p className="body-copy">{row.summary}</p>
                    {row.detail ? <p className="table-note">{row.detail}</p> : null}
                    {row.source_citations.length > 0 ? (
                      <ul className="evidence-quality-workspace-row__cites">
                        {row.source_citations.map((c) => (
                          <li key={c}>
                            <code>{c}</code>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            {!meta.pivotOnly ? (
              <div className="evidence-quality-workspace-domain__footer-pivots">
                <DomainSectionPivots domainKey={meta.key} />
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function DomainSectionPivots({ domainKey }: { domainKey: SectionKey }) {
  switch (domainKey) {
    case "devices":
      return (
        <button type="button" className="inline-action" onClick={() => navigateToEvidenceView("devices")}>
          Open Devices
        </button>
      );
    case "topology":
      return (
        <button type="button" className="inline-action" onClick={() => navigateToEvidenceView("topology")}>
          Open Topology
        </button>
      );
    case "policies":
      return (
        <button type="button" className="inline-action" onClick={() => navigateToEvidenceView("policies")}>
          Open Policies
        </button>
      );
    case "capabilities":
      return (
        <button type="button" className="inline-action" onClick={() => navigateToEvidenceView("capabilities")}>
          Open Capabilities
        </button>
      );
    case "platform":
      return (
        <button type="button" className="inline-action" onClick={() => navigateToEvidenceView("platform-health")}>
          Open Platform Health
        </button>
      );
    case "global":
      return (
        <button type="button" className="inline-action" onClick={() => navigateToEvidenceView("overview")}>
          Open Overview
        </button>
      );
    default:
      return null;
  }
}
