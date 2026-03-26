import type { MaintenanceEvidenceWorkspaceResponse } from "../../api/contracts";
import {
  DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT,
  readSyncRunsLimitFromSearch,
} from "../../lib/investigation-navigation";
import { formatDateTime } from "../../lib/presentation";
import { navigateToChangeSafetyCaseForMaintenance } from "../../lib/change-safety-case-navigation";
import { navigateToImpactReportForMaintenance } from "../../lib/impact-report-navigation";
import { navigateToMaintenancePreview } from "../../lib/maintenance-preview-navigation";
import { navigateToMaintenanceWindowWorkspaceForTopologyObject } from "../../lib/maintenance-window-workspace-navigation";
import { navigateToTopologyDossier } from "../../lib/topology-dossier-navigation";
import { navigateToStabilityWorkspace } from "../../lib/stability-workspace-navigation";

export interface MaintenanceEvidenceWorkspaceProductProps {
  data: MaintenanceEvidenceWorkspaceResponse;
  onReload: () => void | Promise<void>;
}

export function MaintenanceEvidenceWorkspaceProduct({ data, onReload }: MaintenanceEvidenceWorkspaceProductProps) {
  const subj = data.maintenance_preview.subject;
  const ctx = data.preview_context;
  const syncLim =
    typeof window !== "undefined"
      ? readSyncRunsLimitFromSearch(window.location.search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT)
      : DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT;

  return (
    <div
      className="maintenance-preview-product maintenance-evidence-workspace-product"
      data-contract="maintenance_evidence_workspace_v1"
    >
      <header className="maintenance-preview-hero">
        <div className="maintenance-preview-hero__text">
          <p className="eyebrow">Phase 2 · maintenance_evidence_workspace_v1</p>
          <h2 className="maintenance-preview-hero__title">Maintenance evidence workspace</h2>
          <p className="body-copy maintenance-preview-hero__lede">{data.maintenance_framing_summary}</p>
        </div>
        <div className="maintenance-preview-hero__actions">
          <button
            type="button"
            className="inline-action"
            onClick={() =>
              navigateToImpactReportForMaintenance(
                subj.object_kind === "node"
                  ? { nodeId: subj.object_id, previewContext: ctx }
                  : { linkId: subj.object_id, previewContext: ctx },
              )
            }
            title="impact_report_v1 — separate GET family; not evidence_export_v1"
          >
            Impact report
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() =>
              navigateToChangeSafetyCaseForMaintenance(
                subj.object_kind === "node"
                  ? { nodeId: subj.object_id, previewContext: ctx }
                  : { linkId: subj.object_id, previewContext: ctx },
              )
            }
            title="change_safety_case_v1 — not approval or dry-run"
          >
            Change safety case
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() =>
              navigateToMaintenancePreview(
                subj.object_kind === "node"
                  ? { nodeId: subj.object_id, previewContext: ctx }
                  : { linkId: subj.object_id, previewContext: ctx },
              )
            }
            title="Narrow maintenance_preview_v1 surface (same subject)"
          >
            Maintenance preview only
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() =>
              navigateToTopologyDossier(data.object_id, data.object_kind, "maintenance_evidence_workspace")
            }
            title="Topology object dossier workspace (separate composed GET)"
          >
            Topology dossier
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() =>
              navigateToMaintenanceWindowWorkspaceForTopologyObject(subj.object_id, subj.object_kind, {
                previewContext: ctx,
                syncRunsLimit: syncLim,
              })
            }
            title="maintenance_window_workspace_v1 — multi-subject rollup; starts with this subject only"
          >
            Maintenance window workspace
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() =>
              navigateToStabilityWorkspace({
                syncRunsLimit: syncLim,
                topologyObject: { id: subj.object_id, kind: subj.object_kind },
              })
            }
            title="Stability workspace — same topology subject; not maintenance evidence JSON assembly"
          >
            Stability workspace
          </button>
          <button type="button" className="maintenance-preview-toolbar-reload" onClick={() => void onReload()}>
            Reload
          </button>
        </div>
      </header>

      <div className="maintenance-preview-metadata">
        <span>Generated {formatDateTime(data.metadata.generated_at)}</span>
        <span>
          Contract <code>{data.contract_id}</code>
        </span>
        <span>
          Subject · <strong>{data.object_kind}</strong> <code>{data.object_id}</code>
        </span>
        <span>
          Preview context <code>{data.preview_context}</code>
        </span>
      </div>

      <p className="table-note">
        This workspace <strong>composes</strong> nested Phase 2 read assemblies. Nested JSON remains authoritative for
        its own fields; composition does <strong>not</strong> strengthen evidence. This is <strong>not</strong>{" "}
        <code>evidence_export_v1</code>, maintenance approval, simulation, or safe-to-change authority.
      </p>

      <section className="maintenance-preview-safety" aria-labelledby="mew-nonclaims-heading">
        <h3 id="mew-nonclaims-heading">Workspace explicit non-claims</h3>
        <ul className="maintenance-preview-non-claims">
          {data.explicit_non_claims.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      {data.merged_caveats.length > 0 ? (
        <section className="detail-card" aria-labelledby="mew-merged-caveats">
          <h3 id="mew-merged-caveats">Merged caveats (from nested assemblies)</h3>
          <ul className="notes-list">
            {data.merged_caveats.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.merged_evidence_gap_notes.length > 0 ? (
        <section className="detail-card" aria-labelledby="mew-gaps-heading">
          <h3 id="mew-gaps-heading">Evidence gap notes</h3>
          <ul className="notes-list">
            {data.merged_evidence_gap_notes.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="detail-card" aria-labelledby="mew-nested-heading">
        <h3 id="mew-nested-heading">Nested assembly presence</h3>
        <p className="table-note">
          Optional bodies may be absent when assembly is partial; see gap notes above. Open specialized views for full
          panels.
        </p>
        <ul className="notes-list">
          <li>
            <strong>topology_object_dossier_v1</strong>: {data.topology_object_dossier ? "present" : "absent"}
          </li>
          <li>
            <strong>topology_object_evidence_timeline_v1</strong>:{" "}
            {data.topology_object_evidence_timeline ? "present" : "absent"}
          </li>
          <li>
            <strong>topology_object_evidence_delta_v1</strong>:{" "}
            {data.topology_object_evidence_delta ? "present" : "absent"}
          </li>
          <li>
            <strong>change_safety_case_v1</strong> (topology_change_safety): nested in response — use{" "}
            <strong>Change safety case</strong> pivot for the dedicated report view and downloads.
          </li>
        </ul>
      </section>

      <section className="maintenance-preview-related-services" aria-labelledby="mew-pivots-api-heading">
        <h3 id="mew-pivots-api-heading">Recommended API pivots (read-only hints)</h3>
        <ul className="notes-list">
          {data.recommended_api_pivots.map((p) => (
            <li key={p}>
              <code>{p}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className="maintenance-preview-explainability" aria-labelledby="mew-source-ids-heading">
        <h3 id="mew-source-ids-heading">Source contract ids</h3>
        <ul className="maintenance-preview-non-claims">
          {data.source_contract_ids.map((id) => (
            <li key={id}>
              <code>{id}</code>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
