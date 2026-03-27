import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import type { ReadPathReliabilityPosture } from "../../api/contracts";
import {
  DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT,
  readSyncRunsLimitFromSearch,
} from "../../lib/investigation-navigation";
import { navigateToOperatorBriefingView } from "../../lib/operator-briefing-navigation";
import { APP_URL_SEARCH_CHANGED, navigateToEvidenceView } from "../../lib/url-app-state";
import { useReplaceUrlSearchParams } from "../../lib/use-url-search-params";
import { EvidenceQualityDomainSections } from "./domain-sections";
import { useEvidenceQualityWorkspaceQuery } from "./api";

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
      <section className="evidence-quality-workspace-route evidence-quality-workspace-route--loading">
        <h2>Evidence quality workspace</h2>
        <LoadingState label="Loading evidence_quality_workspace_v1 from app-api (collection assurance summary)." />
      </section>
    );
  }

  if (query.error) {
    return (
      <section className="evidence-quality-workspace-route evidence-quality-workspace-route--error">
        <h2>Evidence quality workspace</h2>
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
      <section className="evidence-quality-workspace-route evidence-quality-workspace-route--empty">
        <h2>Evidence quality workspace</h2>
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
      <section className="evidence-quality-workspace-route evidence-quality-workspace-route--unsupported">
        <h2>Evidence quality workspace</h2>
        <p className="callout">
          Unexpected contract <code>{data.contract_id}</code> — this shell expects{" "}
          <code>evidence_quality_workspace_v1</code>.
        </p>
      </section>
    );
  }

  return (
    <section className="evidence-quality-workspace-route" data-testid="evidence-quality-workspace">
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

      <EvidenceQualityDomainSections rows={data.rows} syncRunsLimit={syncRunsLimit} />
    </section>
  );
}
