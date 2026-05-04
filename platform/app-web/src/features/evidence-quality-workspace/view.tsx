import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { WorkspaceHeader } from "../../components/workspace-header";
import type {
  EvidenceWeaknessExplanationBlock,
  EvidenceWeaknessExplanationCategory,
  EvidenceWeaknessExplanationResponse,
  EvidenceWeaknessNextBestPivot,
  ReadPathReliabilityPosture,
} from "../../api/contracts";
import type { ApiQueryState } from "../../api/use-api-query";
import { navigateToEvidenceConsistencyWorkspace } from "../../lib/evidence-consistency-navigation";
import {
  DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT,
  navigateToInvestigationView,
  readSyncRunsLimitFromSearch,
} from "../../lib/investigation-navigation";
import { navigateToMaintenanceEvidenceWorkspace } from "../../lib/maintenance-evidence-workspace-navigation";
import { navigateToMaintenanceWindowWorkspaceSetup } from "../../lib/maintenance-window-workspace-navigation";
import { navigateToOperatorBriefingView } from "../../lib/operator-briefing-navigation";
import { navigateToStabilityWorkspace } from "../../lib/stability-workspace-navigation";
import { APP_URL_SEARCH_CHANGED, navigateToEvidenceView } from "../../lib/url-app-state";
import { useReplaceUrlSearchParams } from "../../lib/use-url-search-params";
import { EvidenceQualityDomainSections } from "./domain-sections";
import { useEvidenceQualityWorkspaceQuery, useEvidenceWeaknessExplanationQuery } from "./api";
import { dimensionLabel } from "./labels";

function readSyncRunsLimitFromWindow(): number {
  return readSyncRunsLimitFromSearch(window.location.search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT);
}

function postureLabel(p: ReadPathReliabilityPosture): string {
  switch (p) {
    case "bounded_ok":
      return "Bounded OK (no major weakness rows from sampled fields)";
    case "mixed_degraded":
      return "Mixed / degraded read-path signals";
    case "heavily_limited":
      return "Heavily limited — multiple collection, fallback, or anchor limits";
    default:
      return p;
  }
}

function explanationCategoryLabel(c: EvidenceWeaknessExplanationCategory): string {
  switch (c) {
    case "collection_assurance_weak":
      return "Collection assurance weak";
    case "fallback_or_stale_serving":
      return "Fallback or stale serving";
    case "sparse_history_or_anchors":
      return "Sparse history or anchors";
    case "comparison_or_scope_limited":
      return "Comparison or scope limited";
    case "partial_or_unsupported_detail":
      return "Partial or unsupported detail";
    case "cross_surface_scope_note":
      return "Cross-surface scope note";
    default:
      return c;
  }
}

function evidenceDomainLabel(domain: EvidenceWeaknessExplanationBlock["evidence_subject_domain"]): string {
  return domain.replace(/_/g, " ");
}

function handlePivotNavigation(pivot: EvidenceWeaknessNextBestPivot, syncRunsLimit: number): void {
  switch (pivot.pivot_id) {
    case "open_devices_list":
      navigateToEvidenceView("devices");
      return;
    case "open_topology_view":
      navigateToEvidenceView("topology");
      return;
    case "open_policies_list":
      navigateToEvidenceView("policies");
      return;
    case "open_platform_health":
      navigateToEvidenceView("platform-health");
      return;
    case "open_capabilities":
      navigateToEvidenceView("capabilities");
      return;
    case "open_service_explorer":
      navigateToEvidenceView("service-explorer");
      return;
    case "open_maintenance_evidence_workspace":
      navigateToMaintenanceEvidenceWorkspace();
      return;
    case "open_maintenance_window_workspace":
      navigateToMaintenanceWindowWorkspaceSetup();
      return;
    case "open_stability_workspace":
      navigateToStabilityWorkspace({ syncRunsLimit });
      return;
    case "open_evidence_consistency_workspace":
      navigateToEvidenceConsistencyWorkspace(syncRunsLimit);
      return;
    case "open_investigation_workspace":
      navigateToInvestigationView(syncRunsLimit);
      return;
    default:
      return;
  }
}

function PivotButton({
  pivot,
  syncRunsLimit,
  labelPrefix,
}: {
  pivot: EvidenceWeaknessNextBestPivot;
  syncRunsLimit: number;
  labelPrefix: string;
}) {
  return (
    <button
      type="button"
      className="nav-drilldown-button"
      onClick={() => handlePivotNavigation(pivot, syncRunsLimit)}
      title={`${pivot.route_family} — ${pivot.rationale}`}
    >
      {labelPrefix}: {pivot.label}
    </button>
  );
}

function EvidenceWeaknessExplanationPanel({
  query,
  syncRunsLimit,
}: {
  query: ApiQueryState<EvidenceWeaknessExplanationResponse>;
  syncRunsLimit: number;
}) {
  if (query.isLoading && !query.data) {
    return (
      <section className="detail-card evidence-weakness-explanation" aria-labelledby="ewe-heading">
        <h3 id="ewe-heading">Evidence weakness explanation</h3>
        <LoadingState label="Loading evidence_weakness_explanation_v1 (bounded next-best pivots)." />
      </section>
    );
  }

  if (query.error) {
    return (
      <section
        className="detail-card evidence-weakness-explanation evidence-weakness-explanation--error"
        aria-labelledby="ewe-heading"
      >
        <h3 id="ewe-heading">Evidence weakness explanation</h3>
        <p className="callout">
          Explanation pivots are temporarily unavailable. The evidence-quality rows below remain the authoritative
          read-only workspace content for this request.
        </p>
        <ErrorState error={query.error} onRetry={query.reload} />
      </section>
    );
  }

  if (!query.data) {
    return (
      <section
        className="detail-card evidence-weakness-explanation evidence-weakness-explanation--empty"
        aria-labelledby="ewe-heading"
      >
        <h3 id="ewe-heading">Evidence weakness explanation</h3>
        <EmptyState
          title="No weakness explanation response"
          description="The backend did not return evidence_weakness_explanation_v1 for the current bounded sync window."
        />
      </section>
    );
  }

  const data = query.data;
  const blocks = data.contract_id === "evidence_weakness_explanation_v1" ? data.blocks : [];

  return (
    <section
      className="detail-card evidence-weakness-explanation"
      aria-labelledby="ewe-heading"
      data-testid="evidence-weakness-explanation"
    >
      <div className="evidence-weakness-explanation__header">
        <div>
          <h3 id="ewe-heading">Evidence weakness explanation</h3>
          <p className="body-copy">
            Bounded explanations and read-only next-best pivots from <code>{data.contract_id}</code>. These hints
            support navigation only; they do not assign root cause, approve changes, or replace consistency, stability,
            or investigation workspaces.
          </p>
        </div>
        <button type="button" className="inline-action" onClick={() => void query.reload()}>
          Reload explanation
        </button>
      </div>
      <p className="callout">{data.safety_framing.summary_disclaimer}</p>
      <p className="table-note">
        Confidence language: <strong>{data.safety_framing.authority_posture.replace(/_/g, " ")}</strong>; applied{" "}
        <strong>{data.sync_runs_limit_applied}</strong> sync runs.
      </p>

      {blocks.length === 0 ? (
        <EmptyState
          title="No explanation blocks"
          description="No evidence-quality weakness rows were mapped to next-best pivots for this bounded assembly."
        />
      ) : (
        <ul className="evidence-weakness-explanation__blocks">
          {blocks.map((block, idx) => (
            <li
              key={`${block.evidence_subject_domain}-${block.evidence_quality_dimension}-${block.explanation_category}-${idx}`}
              className="evidence-weakness-explanation__block"
            >
              <div className="evidence-quality-workspace-domain-row__cues">
                <span className="evidence-quality-workspace-cue">
                  {explanationCategoryLabel(block.explanation_category)}
                </span>
                <span className="evidence-quality-workspace-cue evidence-quality-workspace-cue--detail">
                  {evidenceDomainLabel(block.evidence_subject_domain)}
                </span>
              </div>
              <p className="body-copy">
                <strong>{dimensionLabel(block.evidence_quality_dimension)}:</strong> {block.row_summary}
              </p>
              <p className="table-note">
                Likely explanation: <code>{block.explanation_category}</code> maps this weakness to bounded
                read-path or collection evidence only, based on cited fields when present.
              </p>
              <p className="table-note">
                Primary pivot rationale: {block.primary_next_best_pivot.rationale}
              </p>
              {block.primary_next_best_pivot.cited_evidence_fields?.length ? (
                <ul className="evidence-quality-workspace-row__cites">
                  {block.primary_next_best_pivot.cited_evidence_fields.map((c) => (
                    <li key={c}>
                      <code>{c}</code>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="evidence-quality-workspace-domain__pivots">
                <PivotButton
                  pivot={block.primary_next_best_pivot}
                  syncRunsLimit={syncRunsLimit}
                  labelPrefix="Open next-best pivot"
                />
                {block.alternate_next_best_pivot ? (
                  <PivotButton
                    pivot={block.alternate_next_best_pivot}
                    syncRunsLimit={syncRunsLimit}
                    labelPrefix="Alternate pivot"
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {data.safety_framing.explicit_non_claims.length > 0 ? (
        <>
          <h4 className="evidence-quality-workspace-subheading">Non-claims for this explanation layer</h4>
          <ul className="evidence-quality-workspace-nonclaims">
            {data.safety_framing.explicit_non_claims.slice(0, 5).map((c) => (
              <li key={c}>
                <code>{c}</code>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

export function EvidenceQualityWorkspaceView() {
  const [search, setSearch] = useState(() =>
    typeof window !== "undefined" ? window.location.search : "",
  );
  const replaceUrlSearchParams = useReplaceUrlSearchParams();

  const syncFromUrl = useCallback(() => {
    setSearch(typeof window !== "undefined" ? window.location.search : "");
  }, []);

  useEffect(() => {
    window.addEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
    return () => window.removeEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
  }, [syncFromUrl]);

  const syncRunsLimit = useMemo(
    () => readSyncRunsLimitFromSearch(search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT),
    [search],
  );

  const query = useEvidenceQualityWorkspaceQuery(syncRunsLimit);
  const weaknessExplanationQuery = useEvidenceWeaknessExplanationQuery(syncRunsLimit);

  const applySyncLimit = useCallback(
    (raw: string) => {
      const n = Number.parseInt(raw, 10);
      const lim = Number.isNaN(n)
        ? DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT
        : Math.min(100, Math.max(1, n));
      const sp = new URLSearchParams(search);
      sp.set("sync_runs_limit", String(lim));
      replaceUrlSearchParams(sp);
    },
    [search, replaceUrlSearchParams],
  );

  if (query.isLoading && !query.data) {
    return (
      <section className="workspace-page evidence-quality-workspace-route evidence-quality-workspace-route--loading">
        <WorkspaceHeader
          eyebrow="Investigate"
          title="Evidence Quality"
          summary="Review collection assurance, read-path reliability, and bounded evidence weakness across current surfaces."
        />
        <LoadingState label="Loading evidence_quality_workspace_v1 from app-api (collection assurance summary)." />
      </section>
    );
  }

  if (query.error) {
    return (
      <section className="workspace-page evidence-quality-workspace-route evidence-quality-workspace-route--error">
        <WorkspaceHeader
          eyebrow="Investigate"
          title="Evidence Quality"
          summary="Review collection assurance, read-path reliability, and bounded evidence weakness across current surfaces."
        />
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
      <section className="workspace-page evidence-quality-workspace-route evidence-quality-workspace-route--empty">
        <WorkspaceHeader
          eyebrow="Investigate"
          title="Evidence Quality"
          summary="Review collection assurance, read-path reliability, and bounded evidence weakness across current surfaces."
        />
        <EmptyState
          title="No evidence quality summary"
          description="The backend did not return an evidence quality workspace response for the current request."
        />
      </section>
    );
  }

  const data = query.data;

  if (data.contract_id !== "evidence_quality_workspace_v1") {
    return (
      <section className="workspace-page evidence-quality-workspace-route evidence-quality-workspace-route--unsupported">
        <WorkspaceHeader
          eyebrow="Investigate"
          title="Evidence Quality"
          summary="Review collection assurance, read-path reliability, and bounded evidence weakness across current surfaces."
        />
        <p className="callout">
          Unexpected contract <code>{data.contract_id}</code> — this shell expects{" "}
          <code>evidence_quality_workspace_v1</code>.
        </p>
      </section>
    );
  }

  return (
    <section className="workspace-page evidence-quality-workspace-route" data-testid="evidence-quality-workspace">
      <header className="evidence-quality-workspace-hero">
        <div className="evidence-quality-workspace-hero__text">
          <p className="eyebrow">Phase 2 · {data.contract_id}</p>
          <h2 className="evidence-quality-workspace-hero__title">Evidence quality workspace</h2>
          <p className="body-copy evidence-quality-workspace-hero__lede">
            <strong>Collection assurance</strong> and <strong>read-path reliability</strong> hints from existing list
            and platform status assemblies—explicitly <strong>not</strong> validation, approval, remediation orders, or
            a substitute for evidence-consistency or stability workspaces.
          </p>
        </div>
        <div className="evidence-quality-workspace-hero__actions">
          <button type="button" className="evidence-quality-workspace-toolbar-reload" onClick={() => void query.reload()}>
            Reload summary
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() =>
              navigateToOperatorBriefingView(syncRunsLimit, { invFrom: "evidence-quality-workspace" })
            }
            title="operator_briefing_workspace_v1 — same sync window; inv_from shell hint only"
          >
            Operator briefing
          </button>
          <button type="button" className="inline-action" onClick={() => navigateToEvidenceView("overview")}>
            Back to Overview
          </button>
        </div>
      </header>

      <div className="evidence-quality-workspace-toolbar detail-card">
        <label className="evidence-quality-workspace-toolbar__label" htmlFor="eqw-sync-limit">
          sync_runs_limit (bounded, aligned with other summaries)
        </label>
        <input
          id="eqw-sync-limit"
          type="number"
          min={1}
          max={100}
          className="evidence-quality-workspace-toolbar__input"
          defaultValue={readSyncRunsLimitFromWindow()}
          key={search}
          onChange={(e) => applySyncLimit(e.target.value)}
        />
      </div>

      <div className="evidence-quality-workspace-metadata" aria-label="Assembly metadata">
        <span>
          Applied <strong>{data.sync_runs_limit_applied}</strong> · URL {syncRunsLimit}
        </span>
        <span>Generated {data.metadata.generated_at}</span>
      </div>

      <section className="detail-card" aria-labelledby="eqw-collection-heading">
        <h3 id="eqw-collection-heading">Collection assurance summary</h3>
        <p className="body-copy">{data.collection_assurance_summary}</p>
        <p className="table-note">
          Read-path reliability posture: <strong>{postureLabel(data.read_path_reliability_posture)}</strong> (
          <code>{data.read_path_reliability_posture}</code>)
        </p>
      </section>

      <section className="detail-card" aria-labelledby="eqw-safety-heading">
        <h3 id="eqw-safety-heading">Safety framing</h3>
        <p className="callout">{data.safety_framing.summary_disclaimer}</p>
        <p className="table-note">
          Authority: <strong>{data.safety_framing.authority_posture.replace(/_/g, " ")}</strong>
        </p>
        <h4 className="evidence-quality-workspace-subheading">Explicit non-claims</h4>
        <ul className="evidence-quality-workspace-nonclaims">
          {data.safety_framing.explicit_non_claims.map((c) => (
            <li key={c}>
              <code>{c}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className="detail-card" aria-labelledby="eqw-scope-heading">
        <h3 id="eqw-scope-heading">Scope summary</h3>
        <p className="body-copy">{data.scope_summary}</p>
      </section>

      {data.assembly_notes.length > 0 ? (
        <section className="detail-card" aria-labelledby="eqw-assembly-heading">
          <h3 id="eqw-assembly-heading">Assembly notes</h3>
          <ul>
            {data.assembly_notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.caveats.length > 0 ? (
        <section className="detail-card" aria-labelledby="eqw-caveats-heading">
          <h3 id="eqw-caveats-heading">Caveats</h3>
          <ul>
            {data.caveats.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <EvidenceWeaknessExplanationPanel query={weaknessExplanationQuery} syncRunsLimit={syncRunsLimit} />

      <EvidenceQualityDomainSections rows={data.rows} syncRunsLimit={syncRunsLimit} />
    </section>
  );
}
