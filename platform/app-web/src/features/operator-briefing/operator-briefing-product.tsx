import type { OperatorBriefingWorkspaceResponse } from "../../api/contracts";
import { EvidenceExportActions } from "../../components/evidence-export-actions";
import { evidenceStatusPillClass } from "../../lib/change-intelligence-domain-labels";
import { navigateToInvestigationView } from "../../lib/investigation-navigation";
import { navigateToPolicyDossierWorkspace } from "../../lib/policy-dossier-navigation";
import { navigateToSituationRoomView } from "../../lib/situation-room-navigation";
import { navigateToTopologyDossier } from "../../lib/topology-dossier-navigation";
import { formatDateTime } from "../../lib/presentation";
import { navigateToEvidenceView } from "../../lib/url-app-state";

export interface OperatorBriefingProductProps {
  data: OperatorBriefingWorkspaceResponse;
  syncRunsLimit: number;
  onReload: () => void | Promise<void>;
}

function sectionTitle(key: string): string {
  switch (key) {
    case "briefing_context":
      return "Briefing context";
    case "delta_digest":
      return "Delta digest";
    case "policy_dossier":
      return "Policy dossier";
    case "topology_object_dossier":
      return "Topology object dossier";
    case "situation_room":
      return "Situation room (evidence pack)";
    case "investigation_workspace":
      return "Investigation workspace";
    default:
      return key.replace(/_/g, " ");
  }
}

/**
 * Composed operator handoff surface: bounded Phase 2 assemblies with explicit pivots and exports—read-only
 * interpretation support, not incident command or change approval.
 */
export function OperatorBriefingProduct({ data, syncRunsLimit, onReload }: OperatorBriefingProductProps) {
  const ctx = data.briefing_context;
  const dd = data.delta_digest;
  const pol = data.policy_dossier;
  const topo = data.topology_object_dossier;
  const sit = data.situation_pack;
  const inv = data.investigation_workspace;

  return (
    <div className="operator-briefing-product">
      <header className="operator-briefing-hero">
        <div className="operator-briefing-hero__text">
          <p className="eyebrow">Phase 2 · operator_briefing_workspace_v1</p>
          <h2 className="operator-briefing-hero__title">Operator briefing workspace</h2>
          <p className="body-copy operator-briefing-hero__lede">
            One read-only handoff surface that sequences the same backend-owned assemblies you already trust—delta
            digest, optional dossiers, situation pack, and investigation context—with explicit honesty strips and live
            pivots. This does not approve changes, command incidents, replace Grafana, or assert cross-domain truth.
          </p>
        </div>
        <div className="operator-briefing-hero__actions">
          <button type="button" className="operator-briefing-toolbar-reload" onClick={() => void onReload()}>
            Reload briefing
          </button>
          <button type="button" className="inline-action" onClick={() => navigateToEvidenceView("overview")}>
            Back to Overview
          </button>
        </div>
      </header>

      <div className="operator-briefing-metadata" aria-label="Briefing metadata">
        <span>Generated {formatDateTime(data.metadata.generated_at)}</span>
        <span>
          Contract <code>{data.contract_id}</code>
        </span>
        <span>
          Sync window applied <strong>{data.sync_runs_limit_applied}</strong> · URL requested {syncRunsLimit}
        </span>
      </div>

      <section className="operator-briefing-safety" aria-labelledby="ob-safety-heading">
        <h3 id="ob-safety-heading">Read-only framing</h3>
        <p className="callout operator-briefing-safety__primary">{data.safety.summary_disclaimer}</p>
        <p className="table-note">
          Authority posture: <strong>{data.safety.authority_posture.replace(/_/g, " ")}</strong> ·{" "}
          {data.safety.phase.replace(/_/g, " ")}
        </p>
        <h4 className="operator-briefing-safety__sub">Explicit non-claims</h4>
        <ul className="operator-briefing-nonclaims">
          {data.safety.explicit_non_claims.map((c) => (
            <li key={c}>{c.replace(/_/g, " ")}</li>
          ))}
        </ul>
      </section>

      <section className="operator-briefing-context" aria-labelledby="ob-ctx-heading">
        <h3 id="ob-ctx-heading">Briefing scope (echo)</h3>
        <p className="table-note">
          Client hints are echoed for handoff context only—they are <strong>not</strong> validated as authority by
          app-api.
        </p>
        <dl className="operator-briefing-context__dl">
          <div>
            <dt>Sync runs (requested)</dt>
            <dd>{ctx.sync_runs_limit_requested}</dd>
          </div>
          <div>
            <dt>policy_id</dt>
            <dd>{ctx.policy_id ?? "—"}</dd>
          </div>
          <div>
            <dt>topology_object</dt>
            <dd>
              {ctx.topology_object && ctx.topology_object_kind
                ? `${ctx.topology_object_kind} · ${ctx.topology_object}`
                : "—"}
            </dd>
          </div>
          <div>
            <dt>inv_from (shell hint)</dt>
            <dd>{ctx.inv_from_client_hint ?? "—"}</dd>
          </div>
          <div>
            <dt>global_search_q (shell hint)</dt>
            <dd>{ctx.global_search_q_client_hint ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="operator-briefing-live-pivots" aria-labelledby="ob-pivots-heading">
        <h3 id="ob-pivots-heading">Live pivots</h3>
        <p className="table-note operator-briefing-live-pivots__hint">
          Same bounded sync window is preserved on the shell where applicable. These buttons jump to full product
          surfaces.
        </p>
        <div className="operator-briefing-live-pivots__grid">
          <button
            type="button"
            className="nav-drilldown-button operator-briefing-live-pivots__primary"
            onClick={() => navigateToEvidenceView("delta-digest")}
          >
            Delta digest
          </button>
          <button
            type="button"
            className="nav-drilldown-button operator-briefing-live-pivots__primary"
            onClick={() => navigateToInvestigationView(syncRunsLimit, { invFrom: "operator-briefing" })}
          >
            Investigation workspace
          </button>
          <button
            type="button"
            className="nav-drilldown-button operator-briefing-live-pivots__primary"
            onClick={() => navigateToSituationRoomView(syncRunsLimit)}
          >
            Situation room
          </button>
          {pol?.policy_record ? (
            <button
              type="button"
              className="nav-drilldown-button"
              onClick={() => navigateToPolicyDossierWorkspace(pol.policy_record.policy_id, "operator_briefing_workspace")}
            >
              Policy dossier ({pol.policy_record.policy_id})
            </button>
          ) : null}
          {topo?.object_identity ? (
            <button
              type="button"
              className="nav-drilldown-button"
              onClick={() =>
                navigateToTopologyDossier(
                  topo.object_identity.object_id,
                  topo.object_identity.object_kind,
                  "operator_briefing_workspace",
                )
              }
            >
              Topology dossier ({topo.object_identity.object_kind} {topo.object_identity.object_id})
            </button>
          ) : null}
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("devices")}>
            Devices
          </button>
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("topology")}>
            Topology
          </button>
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("policies")}>
            Policies
          </button>
        </div>
      </section>

      <section className="operator-briefing-exports" aria-labelledby="ob-export-heading">
        <h3 id="ob-export-heading">Export entry points</h3>
        <p className="table-note">
          Per-surface bounded snapshots (same assemblies as live views)—no unified “export entire briefing” bundle in
          v1.
        </p>
        <div className="operator-briefing-exports__row">
          <EvidenceExportActions variant="situation" target={{ kind: "situation_room", syncRunsLimit }} />
          <EvidenceExportActions
            variant="investigation"
            target={{ kind: "investigation_workspace", syncRunsLimit }}
          />
          {pol?.policy_record ? (
            <EvidenceExportActions
              variant="dossier"
              target={{ kind: "policy_dossier", policyId: pol.policy_record.policy_id }}
            />
          ) : null}
          {topo?.object_identity ? (
            <EvidenceExportActions
              variant="dossier"
              target={{ kind: "topology_object_dossier", objectId: topo.object_identity.object_id }}
            />
          ) : null}
        </div>
      </section>

      {data.merged_caveats.length > 0 ? (
        <section className="operator-briefing-merged" aria-labelledby="ob-merged-heading">
          <h3 id="ob-merged-heading">Merged caveats (deduped)</h3>
          <ul className="operator-briefing-merged__list">
            {data.merged_caveats.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="operator-briefing-section-meta" aria-labelledby="ob-meta-heading">
        <h3 id="ob-meta-heading">Section evidence strip</h3>
        <div className="operator-briefing-section-meta__grid">
          {data.section_meta.map((section) => (
            <article key={section.section_key} className="detail-card operator-briefing-meta-card">
              <h4>
                {sectionTitle(section.section_key)}{" "}
                <span className={evidenceStatusPillClass(section.evidence_status)}>{section.evidence_status}</span>
              </h4>
              {section.caveats.length > 0 ? (
                <ul className="operator-briefing-meta-card__caveats">
                  {section.caveats.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              ) : (
                <p className="table-note">No section caveats.</p>
              )}
              {section.freshness_lines.length > 0 ? (
                <ul className="operator-briefing-meta-card__fresh">
                  {section.freshness_lines.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              ) : null}
              {section.error_note ? (
                <p className="operator-briefing-meta-card__error" role="status">
                  {section.error_note}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="operator-briefing-api-pivots" aria-labelledby="ob-api-pivots-heading">
        <h3 id="ob-api-pivots-heading">Recommended pivots (backend hints)</h3>
        <p className="table-note">
          Machine-oriented routes and export paths from app-api—use live buttons above for shell navigation.
        </p>
        <ol className="operator-briefing-api-pivots__list">
          {data.recommended_pivots.map((line) => (
            <li key={line}>
              <code className="operator-briefing-api-pivots__code">{line}</code>
            </li>
          ))}
        </ol>
      </section>

      {dd ? (
        <section className="operator-briefing-nested operator-briefing-nested--digest" aria-labelledby="ob-dd-heading">
          <h3 id="ob-dd-heading">Delta digest (embedded)</h3>
          <p className="table-note">
            Completeness <strong>{dd.completeness_posture.replace(/_/g, " ")}</strong> ·{" "}
            {dd.digest_framing_notes.length > 0 ? dd.digest_framing_notes[0] : "See full digest for narrative notes."}
          </p>
          <ul className="operator-briefing-nested__bullets">
            {dd.sections.slice(0, 8).map((s) => (
              <li key={s.section_key}>
                <strong>{s.headline}</strong>{" "}
                <span className={evidenceStatusPillClass(s.evidence_status)}>{s.evidence_status}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : data.delta_digest_error ? (
        <section className="operator-briefing-nested operator-briefing-nested--error" aria-labelledby="ob-dd-err-heading">
          <h3 id="ob-dd-err-heading">Delta digest</h3>
          <p className="callout" role="status">
            Assembly unavailable: {data.delta_digest_error}
          </p>
        </section>
      ) : null}

      {pol?.policy_record ? (
        <section className="operator-briefing-nested" aria-labelledby="ob-pol-heading">
          <h3 id="ob-pol-heading">Policy dossier (embedded)</h3>
          <p className="operator-briefing-nested__lede">
            <strong>{pol.policy_record.policy_name}</strong> · <code>{pol.policy_record.policy_id}</code>
          </p>
          <p className="table-note">{pol.merged_caveats.slice(0, 3).join(" · ") || "No merged caveats on dossier."}</p>
        </section>
      ) : null}

      {topo?.object_identity ? (
        <section className="operator-briefing-nested" aria-labelledby="ob-topo-heading">
          <h3 id="ob-topo-heading">Topology object dossier (embedded)</h3>
          <p className="operator-briefing-nested__lede">
            <strong>{topo.object_identity.display_label}</strong> ·{" "}
            <span className={evidenceStatusPillClass("present")}>{topo.object_identity.object_kind}</span>{" "}
            <code>{topo.object_identity.object_id}</code>
          </p>
          <p className="table-note">{topo.merged_caveats.slice(0, 3).join(" · ") || "No merged caveats on dossier."}</p>
        </section>
      ) : null}

      {sit ? (
        <section className="operator-briefing-nested operator-briefing-nested--situation" aria-labelledby="ob-sit-heading">
          <h3 id="ob-sit-heading">Situation pack (embedded)</h3>
          <p className="operator-briefing-nested__lede">
            Devices <strong>{sit.devices.count}</strong> · Topology nodes <strong>{sit.topology.topology.nodes.length}</strong>{" "}
            · Policies <strong>{sit.policies.items.length}</strong> · Readiness rows{" "}
            <strong>{sit.readiness.items.length}</strong>
          </p>
          <p className="table-note">{sit.situation_pack_guidance_framing}</p>
        </section>
      ) : data.situation_pack_error ? (
        <section className="operator-briefing-nested operator-briefing-nested--error" aria-labelledby="ob-sit-err-heading">
          <h3 id="ob-sit-err-heading">Situation pack</h3>
          <p className="callout" role="status">
            Assembly unavailable: {data.situation_pack_error}
          </p>
        </section>
      ) : null}

      {inv ? (
        <section
          className="operator-briefing-nested operator-briefing-nested--investigation"
          aria-labelledby="ob-inv-heading"
        >
          <h3 id="ob-inv-heading">Investigation workspace (embedded)</h3>
          <p className="operator-briefing-nested__lede">
            Recent change completeness{" "}
            <strong>{inv.recent_change.completeness_posture.replace(/_/g, " ")}</strong> · Domains tracked{" "}
            <strong>{inv.recent_change.domains.length}</strong> · Assembly notes {inv.assembly_notes.length}
          </p>
          <p className="table-note">{inv.next_inspection_framing}</p>
        </section>
      ) : data.investigation_workspace_error ? (
        <section
          className="operator-briefing-nested operator-briefing-nested--error"
          aria-labelledby="ob-inv-err-heading"
        >
          <h3 id="ob-inv-err-heading">Investigation workspace</h3>
          <p className="callout" role="status">
            Assembly unavailable: {data.investigation_workspace_error}
          </p>
        </section>
      ) : null}
    </div>
  );
}
