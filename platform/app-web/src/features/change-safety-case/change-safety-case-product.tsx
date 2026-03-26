import type { ChangeSafetyCaseResponse } from "../../api/contracts";
import { ChangeSafetyCaseActions } from "../../components/change-safety-case-actions";
import { navigateToEvidenceConsistencyWorkspace } from "../../lib/evidence-consistency-navigation";
import { navigateToStabilityWorkspace } from "../../lib/stability-workspace-navigation";
import {
  DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT,
  readSyncRunsLimitFromSearch,
} from "../../lib/investigation-navigation";
import { formatDateTime } from "../../lib/presentation";
import type { ChangeSafetyCaseDownloadTarget } from "../../lib/change-safety-case-download";
import {
  navigateToImpactReportForMaintenance,
  navigateToImpactReportForPolicy,
  navigateToImpactReportForService,
} from "../../lib/impact-report-navigation";
import { navigateToMaintenanceEvidenceWorkspaceForTopologyObject } from "../../lib/maintenance-evidence-workspace-navigation";
import { navigateToMaintenancePreviewForTopologyObject } from "../../lib/maintenance-preview-navigation";
import { navigateToPolicyExplainabilityWorkspace } from "../../lib/policy-dossier-navigation";
import { navigateToServiceDossier } from "../../lib/service-dossier-navigation";
import { navigateToServiceExplorer } from "../../lib/service-explorer-navigation";

export interface ChangeSafetyCaseProductProps {
  data: ChangeSafetyCaseResponse;
  downloadTarget: ChangeSafetyCaseDownloadTarget;
  onReload: () => void | Promise<void>;
}

function navigateToStabilityWorkspaceFromCase(data: ChangeSafetyCaseResponse, syncLim: number): void {
  if (data.safety_case_context === "service_change_safety" && data.anchor_service_id) {
    navigateToStabilityWorkspace({ syncRunsLimit: syncLim, serviceId: data.anchor_service_id });
    return;
  }
  if (data.safety_case_context === "topology_change_safety" && data.anchor_maintenance) {
    const m = data.anchor_maintenance;
    navigateToStabilityWorkspace({
      syncRunsLimit: syncLim,
      topologyObject: { id: m.object_id, kind: m.object_kind },
    });
    return;
  }
  navigateToStabilityWorkspace({ syncRunsLimit: syncLim });
}

export function ChangeSafetyCaseProduct({ data, downloadTarget, onReload }: ChangeSafetyCaseProductProps) {
  const syncLim = readSyncRunsLimitFromSearch(window.location.search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT);

  return (
    <div className="change-safety-case-product" data-testid="change-safety-case-product">
      <header className="change-safety-case-hero">
        <div className="change-safety-case-hero__text">
          <p className="eyebrow">Phase 2 · change_safety_case_v1</p>
          <h2 className="change-safety-case-hero__title">Change Safety Case</h2>
          <p className="body-copy change-safety-case-hero__lede">
            Pre-change <strong>read-side</strong> understanding posture—evidence inventory, gaps, and advisory follow-ups
            only. <strong>Not</strong> validation, approval, safe-to-change truth, dry-run, or execution planning.{" "}
            <strong>Not</strong> <code>impact_report_v1</code> (communication packaging) or <code>evidence_export_v1</code>{" "}
            snapshots—subject-centric <code>change_safety_case_v1</code> narrative and report-route downloads only.
          </p>
        </div>
        <div className="change-safety-case-hero__actions">
          <button type="button" className="change-safety-case-toolbar-reload" onClick={() => void onReload()}>
            Reload
          </button>
        </div>
      </header>

      <div className="change-safety-case-metadata">
        <span>Generated {formatDateTime(data.metadata.generated_at)}</span>
        <span>
          Context <code>{data.safety_case_context}</code>
        </span>
        <span>
          Contract <code>{data.contract_id}</code>
        </span>
      </div>

      <section className="change-safety-case-anchor" aria-labelledby="csc-anchor-heading">
        <h3 id="csc-anchor-heading">Subject</h3>
        <AnchorSummary data={data} />
      </section>

      <section className="change-safety-case-safety" aria-labelledby="csc-safety-heading">
        <h3 id="csc-safety-heading">Bounded safety framing</h3>
        <p className="table-note">{data.safety_framing.summary_disclaimer}</p>
        <h4 className="change-safety-case-subheading">Explicit non-claims</h4>
        <ul className="change-safety-case-non-claims">
          {data.safety_framing.explicit_non_claims.map((c) => (
            <li key={c}>
              <code>{c}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className="change-safety-case-download" aria-labelledby="csc-dl-heading">
        <h3 id="csc-dl-heading">Retrieve case</h3>
        <ChangeSafetyCaseActions target={downloadTarget} />
      </section>

      <section className="change-safety-case-understanding" aria-labelledby="csc-understanding-heading">
        <h3 id="csc-understanding-heading">Understanding posture summary</h3>
        <p className="body-copy">{data.understanding_posture_summary}</p>
      </section>

      <section className="change-safety-case-inventory" aria-labelledby="csc-inventory-heading">
        <h3 id="csc-inventory-heading">Evidence sources considered</h3>
        <ul>
          {data.evidence_inventory.map((row) => (
            <li key={row}>{row}</li>
          ))}
        </ul>
      </section>

      {data.merged_caveats.length > 0 ? (
        <section className="change-safety-case-caveats" aria-labelledby="csc-caveats-heading">
          <h3 id="csc-caveats-heading">Merged caveats</h3>
          <ul>
            {data.merged_caveats.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="change-safety-case-gaps" aria-labelledby="csc-gaps-heading">
        <h3 id="csc-gaps-heading">Evidence gaps and unknowns</h3>
        <p className="table-note">
          Unknowns are a first-class outcome—empty or partial assemblies do <strong>not</strong> mean “low risk.”
        </p>
        <ul>
          {data.evidence_gaps.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </section>

      {data.next_review_guidance.length > 0 ? (
        <section className="change-safety-case-next-review" aria-labelledby="csc-next-heading">
          <h3 id="csc-next-heading">Next-review guidance (advisory only)</h3>
          <p className="table-note">
            Suggestions are interpretation support—not schedules, SLAs, compliance cadence, or authorization to change.
          </p>
          <ul>
            {data.next_review_guidance.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.sparse_case ? (
        <p className="callout change-safety-case-sparse-callout" role="status">
          <strong>Sparse or partial case.</strong> Nested assemblies may be empty or truncated.
          {data.sparse_reasons.length > 0 ? (
            <ul>
              {data.sparse_reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          ) : null}
        </p>
      ) : null}

      <section className="change-safety-case-pivot-hints" aria-labelledby="csc-pivot-hints-heading">
        <h3 id="csc-pivot-hints-heading">Investigation / situation / briefing hints</h3>
        <p className="table-note">Navigation pointers only—not workflow or execution.</p>
        <ul>
          {data.investigation_situation_briefing_pivot_hints.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </section>

      <section className="change-safety-case-nested" aria-labelledby="csc-nested-heading">
        <h3 id="csc-nested-heading">Nested contracts (summary)</h3>
        <NestedSummary data={data} />
        <h4 className="change-safety-case-subheading">Source contract ids</h4>
        <ul className="change-safety-case-contract-ids">
          {data.source_contract_ids.map((id) => (
            <li key={id}>
              <code>{id}</code>
            </li>
          ))}
        </ul>
        {data.recommended_api_pivots.length > 0 ? (
          <>
            <h4 className="change-safety-case-subheading">API pivots (navigation)</h4>
            <ul>
              {data.recommended_api_pivots.map((p) => (
                <li key={p}>
                  <code>{p}</code>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      <section className="change-safety-case-deeper" aria-labelledby="csc-deeper-heading">
        <h3 id="csc-deeper-heading">Open related product surfaces</h3>
        <p className="table-note">Same anchors as this case—deeper panels remain authoritative for full payloads.</p>
        <div className="change-safety-case-deeper__grid">
          <button
            type="button"
            className="nav-drilldown-button"
            onClick={() => navigateToEvidenceConsistencyWorkspace(syncLim)}
          >
            Evidence consistency workspace
          </button>
          <button
            type="button"
            className="nav-drilldown-button"
            onClick={() => navigateToStabilityWorkspaceFromCase(data, syncLim)}
          >
            Stability workspace
          </button>
        </div>
        <DeeperPivots data={data} />
      </section>
    </div>
  );
}

function AnchorSummary({ data }: { data: ChangeSafetyCaseResponse }) {
  if (data.safety_case_context === "policy_change_safety" && data.anchor_policy_id) {
    return (
      <p>
        Policy · <code>{data.anchor_policy_id}</code>
      </p>
    );
  }
  if (data.safety_case_context === "service_change_safety" && data.anchor_service_id) {
    return (
      <p>
        Service · <code>{data.anchor_service_id}</code>
      </p>
    );
  }
  if (data.safety_case_context === "topology_change_safety" && data.anchor_maintenance) {
    const m = data.anchor_maintenance;
    return (
      <p>
        Topology subject ·{" "}
        <strong>
          {m.object_kind} {m.display_name}
        </strong>{" "}
        <code>{m.object_id}</code>
      </p>
    );
  }
  return <p className="table-note">Anchor unavailable in this response.</p>;
}

function NestedSummary({ data }: { data: ChangeSafetyCaseResponse }) {
  if (data.policy_dossier) {
    const d = data.policy_dossier;
    return (
      <p>
        <code>{d.contract_id}</code> · <strong>{d.policy_record.policy_name}</strong>
        {data.policy_explainability ? (
          <>
            {" "}
            · explainability <code>{data.policy_explainability.contract_id}</code>
          </>
        ) : (
          " · explainability not embedded"
        )}
      </p>
    );
  }
  if (data.service_dossier) {
    const sd = data.service_dossier;
    return (
      <p>
        <code>{sd.contract_id}</code> · members <strong>{sd.service_explorer_detail.members_total}</strong> · topology
        evidence <strong>{sd.service_explorer_detail.topology_evidence_status}</strong>
      </p>
    );
  }
  if (data.maintenance_preview) {
    const mp = data.maintenance_preview;
    return (
      <p>
        <code>{mp.contract_id}</code> · preview context <code>{mp.preview_context}</code> · related policies{" "}
        <strong>{mp.failure_impact.rollup_counts.related_policies_total}</strong>
      </p>
    );
  }
  return null;
}

function DeeperPivots({ data }: { data: ChangeSafetyCaseResponse }) {
  if (data.safety_case_context === "policy_change_safety" && data.anchor_policy_id) {
    const pid = data.anchor_policy_id;
    return (
      <div className="change-safety-case-deeper__grid">
        <button type="button" className="nav-drilldown-button" onClick={() => navigateToImpactReportForPolicy(pid)}>
          Impact report (same policy)
        </button>
        <button
          type="button"
          className="nav-drilldown-button"
          onClick={() => navigateToPolicyExplainabilityWorkspace(pid, undefined, "candidates")}
        >
          Policy explainability
        </button>
      </div>
    );
  }
  if (data.safety_case_context === "service_change_safety" && data.anchor_service_id) {
    const sid = data.anchor_service_id;
    return (
      <div className="change-safety-case-deeper__grid">
        <button type="button" className="nav-drilldown-button" onClick={() => navigateToServiceExplorer({ serviceId: sid })}>
          Service Explorer
        </button>
        <button type="button" className="nav-drilldown-button" onClick={() => navigateToServiceDossier({ serviceId: sid })}>
          Service dossier
        </button>
        <button type="button" className="nav-drilldown-button" onClick={() => navigateToImpactReportForService(sid)}>
          Impact report
        </button>
      </div>
    );
  }
  if (data.safety_case_context === "topology_change_safety" && data.anchor_maintenance && data.maintenance_preview) {
    const subj = data.anchor_maintenance;
    const ctx = data.maintenance_preview.preview_context;
    return (
      <div className="change-safety-case-deeper__grid">
        <button
          type="button"
          className="nav-drilldown-button"
          onClick={() =>
            navigateToImpactReportForMaintenance(
              subj.object_kind === "node"
                ? { nodeId: subj.object_id, previewContext: ctx }
                : { linkId: subj.object_id, previewContext: ctx },
            )
          }
        >
          Impact report (same subject)
        </button>
        <button
          type="button"
          className="nav-drilldown-button"
          onClick={() =>
            navigateToMaintenanceEvidenceWorkspaceForTopologyObject(subj.object_id, subj.object_kind, {
              previewContext: ctx,
            })
          }
        >
          Maintenance evidence workspace
        </button>
        <button
          type="button"
          className="nav-drilldown-button"
          onClick={() =>
            navigateToMaintenancePreviewForTopologyObject(subj.object_id, subj.object_kind, { previewContext: ctx })
          }
        >
          Maintenance preview
        </button>
      </div>
    );
  }
  return null;
}
