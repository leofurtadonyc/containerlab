import type { ImpactReportResponse } from "../../api/contracts";
import { ImpactReportActions } from "../../components/impact-report-actions";
import { formatDateTime } from "../../lib/presentation";
import type { ImpactReportDownloadTarget } from "../../lib/impact-report-download";

export interface ImpactReportProductProps {
  data: ImpactReportResponse;
  downloadTarget: ImpactReportDownloadTarget;
  onReload: () => void | Promise<void>;
}

export function ImpactReportProduct({ data, downloadTarget, onReload }: ImpactReportProductProps) {
  return (
    <div className="impact-report-product">
      <header className="impact-report-hero">
        <div className="impact-report-hero__text">
          <p className="eyebrow">Phase 2 · impact_report_v1</p>
          <h2 className="impact-report-hero__title">Impact Report</h2>
          <p className="body-copy impact-report-hero__lede">
            Operator communication packaging over existing read-side contracts.{" "}
            <strong>Not</strong> compliance, validation sign-off, incident command, or safe-to-change approval.
          </p>
        </div>
        <div className="impact-report-hero__actions">
          <button type="button" className="impact-report-toolbar-reload" onClick={() => void onReload()}>
            Reload
          </button>
        </div>
      </header>

      <div className="impact-report-metadata">
        <span>Generated {formatDateTime(data.metadata.generated_at)}</span>
        <span>
          Context <code>{data.report_context}</code>
        </span>
        <span>
          Contract <code>{data.contract_id}</code>
        </span>
      </div>

      <section className="impact-report-anchor" aria-labelledby="ir-anchor-heading">
        <h3 id="ir-anchor-heading">Anchor</h3>
        <AnchorSummary data={data} />
      </section>

      <section className="impact-report-safety" aria-labelledby="ir-safety-heading">
        <h3 id="ir-safety-heading">Framing</h3>
        <p className="table-note">{data.safety_framing.summary_disclaimer}</p>
        <h4 className="impact-report-subheading">Explicit non-claims</h4>
        <ul className="impact-report-non-claims">
          {data.safety_framing.explicit_non_claims.map((c) => (
            <li key={c}>
              <code>{c}</code>
            </li>
          ))}
        </ul>
        <h4 className="impact-report-subheading">Explicitly out of scope</h4>
        <ul>
          {data.explicit_excluded_concerns.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </section>

      <section className="impact-report-scope" aria-labelledby="ir-scope-heading">
        <h3 id="ir-scope-heading">Scope summary</h3>
        <p className="body-copy">{data.scope_summary}</p>
      </section>

      {data.sparse_report ? (
        <p className="callout impact-report-sparse-callout" role="status">
          <strong>Sparse or partial report.</strong> Nested assemblies may be empty or truncated—honest bounds, not
          “no impact.”
          {data.sparse_reasons.length > 0 ? (
            <ul>
              {data.sparse_reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          ) : null}
        </p>
      ) : null}

      <section className="impact-report-download" aria-labelledby="ir-dl-heading">
        <h3 id="ir-dl-heading">Retrieve report</h3>
        <ImpactReportActions target={downloadTarget} />
      </section>

      <section className="impact-report-nested-hints" aria-labelledby="ir-nested-heading">
        <h3 id="ir-nested-heading">Nested contracts (summary)</h3>
        <p className="table-note">
          Full tables live on their native surfaces—this report only packages them for communication.
        </p>
        <NestedHints data={data} />
        <h4 className="impact-report-subheading">Source contract ids</h4>
        <ul className="impact-report-contract-ids">
          {data.source_contract_ids.map((id) => (
            <li key={id}>
              <code>{id}</code>
            </li>
          ))}
        </ul>
        {data.recommended_api_pivots.length > 0 ? (
          <>
            <h4 className="impact-report-subheading">API pivots (navigation)</h4>
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
    </div>
  );
}

function AnchorSummary({ data }: { data: ImpactReportResponse }) {
  if (data.report_context === "service_impact" && data.anchor_service_id) {
    return (
      <p>
        Service · <code>{data.anchor_service_id}</code>
      </p>
    );
  }
  if (data.report_context === "policy_impact" && data.anchor_policy_id) {
    return (
      <p>
        Policy · <code>{data.anchor_policy_id}</code>
      </p>
    );
  }
  if (data.report_context === "maintenance_impact" && data.anchor_maintenance) {
    const m = data.anchor_maintenance;
    return (
      <p>
        Maintenance subject ·{" "}
        <strong>
          {m.object_kind} {m.display_name}
        </strong>{" "}
        <code>{m.object_id}</code>
      </p>
    );
  }
  return <p className="table-note">Anchor unavailable in this response.</p>;
}

function NestedHints({ data }: { data: ImpactReportResponse }) {
  if (data.service_detail) {
    const d = data.service_detail;
    return (
      <p>
        <code>{d.contract_id}</code> · members <strong>{d.members_total}</strong> · topology evidence{" "}
        <strong>{d.topology_evidence_status}</strong>
      </p>
    );
  }
  if (data.policy_dossier) {
    return (
      <p>
        <code>{data.policy_dossier.contract_id}</code> · <strong>{data.policy_dossier.policy_record.policy_name}</strong>
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
