import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import type { EvidenceConsistencyItemRow, EvidenceConsistencySignal } from "../../api/contracts";
import { navigateEvidenceConsistencyPivotFromHint } from "../../lib/evidence-consistency-pivots";
import { navigateToDeltaDigestView } from "../../lib/delta-digest-navigation";
import {
  DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT,
  readSyncRunsLimitFromSearch,
} from "../../lib/investigation-navigation";
import { APP_URL_SEARCH_CHANGED, navigateToEvidenceView } from "../../lib/url-app-state";
import { useEvidenceConsistencySummaryQuery } from "../overview/api";

function readSyncRunsLimitFromWindow(): number {
  return readSyncRunsLimitFromSearch(window.location.search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT);
}

function signalGroupLabel(signal: EvidenceConsistencySignal): string {
  switch (signal) {
    case "appears_in_tension":
      return "Tension (interpretation support)";
    case "weak_alignment":
      return "Weak alignment";
    case "appears_aligned":
      return "Appears aligned (still non-authoritative)";
    case "not_comparable":
      return "Not comparable";
    case "gap_note":
      return "Gap / incomparable note";
  }
}

function signalOrder(a: EvidenceConsistencySignal, b: EvidenceConsistencySignal): number {
  const rank: Record<EvidenceConsistencySignal, number> = {
    appears_in_tension: 0,
    weak_alignment: 1,
    gap_note: 2,
    not_comparable: 3,
    appears_aligned: 4,
  };
  return (rank[a] ?? 9) - (rank[b] ?? 9);
}

export function EvidenceConsistencyView() {
  const [syncRunsLimit, setSyncRunsLimit] = useState(readSyncRunsLimitFromWindow);

  const syncFromUrl = useCallback(() => {
    setSyncRunsLimit(readSyncRunsLimitFromWindow());
  }, []);

  useEffect(() => {
    window.addEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
    return () => window.removeEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
  }, [syncFromUrl]);

  const query = useEvidenceConsistencySummaryQuery(syncRunsLimit);

  const groupedItems = useMemo(() => {
    if (!query.data?.items.length) {
      return [];
    }
    const bySignal = new Map<EvidenceConsistencySignal, EvidenceConsistencyItemRow[]>();
    for (const row of query.data.items) {
      const list = bySignal.get(row.consistency_signal) ?? [];
      list.push(row);
      bySignal.set(row.consistency_signal, list);
    }
    return [...bySignal.entries()].sort((x, y) => signalOrder(x[0], y[0]));
  }, [query.data?.items]);

  if (query.isLoading && !query.data) {
    return (
      <section className="evidence-consistency-route evidence-consistency-route--loading">
        <h2>Evidence consistency workspace</h2>
        <LoadingState label="Loading evidence_consistency_summary_v1 from app-api (bounded read-side assembly)." />
      </section>
    );
  }

  if (query.error) {
    return (
      <section className="evidence-consistency-route evidence-consistency-route--error">
        <h2>Evidence consistency workspace</h2>
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
      <section className="evidence-consistency-route evidence-consistency-route--empty">
        <h2>Evidence consistency workspace</h2>
        <EmptyState
          title="No consistency summary"
          description="The backend did not return an evidence consistency summary for the current request."
        />
      </section>
    );
  }

  const data = query.data;

  return (
    <section className="evidence-consistency-route" data-testid="evidence-consistency-workspace">
      <header className="evidence-consistency-hero">
        <div className="evidence-consistency-hero__text">
          <p className="eyebrow">Phase 2 · {data.contract_id}</p>
          <h2 className="evidence-consistency-hero__title">Evidence consistency workspace</h2>
          <p className="body-copy evidence-consistency-hero__lede">
            Cross-domain <strong>alignment / tension</strong> hints assembled from existing read APIs—explicitly{" "}
            <strong>not</strong> validation, drift proof, root cause, or safe-to-change approval. Use pivots to open
            authoritative list and dossier surfaces.
          </p>
        </div>
        <div className="evidence-consistency-hero__actions">
          <button type="button" className="evidence-consistency-toolbar-reload" onClick={() => void query.reload()}>
            Reload summary
          </button>
          <button type="button" className="inline-action" onClick={() => navigateToEvidenceView("overview")}>
            Back to Overview
          </button>
          <button type="button" className="inline-action" onClick={() => navigateToDeltaDigestView(syncRunsLimit)}>
            Open delta digest (related)
          </button>
        </div>
      </header>

      <div className="evidence-consistency-metadata" aria-label="Assembly metadata">
        <span>
          Sync window applied <strong>{data.sync_runs_limit_applied}</strong> · URL requested {syncRunsLimit}
        </span>
        <span>
          Generated {data.metadata.generated_at}
        </span>
      </div>

      <section className="detail-card" aria-labelledby="ecs-safety-heading">
        <h3 id="ecs-safety-heading">Safety framing</h3>
        <p className="callout">{data.safety_framing.summary_disclaimer}</p>
        <p className="table-note">
          Authority: <strong>{data.safety_framing.authority_posture.replace(/_/g, " ")}</strong> ·{" "}
          {data.safety_framing.phase.replace(/_/g, " ")}
        </p>
        <h4 className="evidence-consistency-subheading">Explicit non-claims</h4>
        <ul className="evidence-consistency-nonclaims">
          {data.safety_framing.explicit_non_claims.map((c) => (
            <li key={c}>
              <code>{c}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className="detail-card" aria-labelledby="ecs-scope-heading">
        <h3 id="ecs-scope-heading">Scope summary</h3>
        <p className="body-copy">{data.scope_summary}</p>
      </section>

      {data.domain_freshness_echo.length > 0 ? (
        <section className="detail-card" aria-labelledby="ecs-fresh-heading">
          <h3 id="ecs-fresh-heading">Domain freshness echo</h3>
          <p className="table-note">Read-side status hints from upstream list assemblies—not collector truth verdicts.</p>
          <ul className="notes-list">
            {data.domain_freshness_echo.map((d) => (
              <li key={d.domain}>
                <strong>{d.domain}</strong>
                {d.data_status ? ` · data_status ${d.data_status}` : ""}
                {d.serving_mode ? ` · serving ${d.serving_mode}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.assembly_notes.length > 0 ? (
        <section className="detail-card" aria-labelledby="ecs-assembly-heading">
          <h3 id="ecs-assembly-heading">Assembly notes</h3>
          <ul>
            {data.assembly_notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.caveats.length > 0 ? (
        <section className="detail-card" aria-labelledby="ecs-caveats-heading">
          <h3 id="ecs-caveats-heading">Caveats</h3>
          <ul>
            {data.caveats.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="evidence-consistency-items" aria-labelledby="ecs-items-heading">
        <h3 id="ecs-items-heading">Consistency rows (by signal)</h3>
        <p className="table-note">
          <strong>Tension</strong> vs <strong>weak alignment</strong> vs <strong>aligned</strong> are heuristic labels
          over visible API evidence—operators should confirm in destination surfaces.
        </p>
        {groupedItems.length === 0 ? (
          <p className="table-note">No rows returned for this window.</p>
        ) : (
          groupedItems.map(([signal, rows]) => (
            <div key={signal} className="evidence-consistency-signal-group">
              <h4 className="evidence-consistency-signal-group__title">{signalGroupLabel(signal)}</h4>
              <ul className="evidence-consistency-item-list">
                {rows.map((row, idx) => (
                  <li key={`${row.category}-${idx}`} className="evidence-consistency-item">
                    <p className="evidence-consistency-item__category">
                      <code>{row.category}</code>
                    </p>
                    <p className="body-copy">{row.summary}</p>
                    {row.detail ? <p className="table-note">{row.detail}</p> : null}
                    {row.pivot_hints.length > 0 ? (
                      <div className="evidence-consistency-item__pivots">
                        {row.pivot_hints.map((h) => (
                          <button
                            key={h.route_family}
                            type="button"
                            className="nav-drilldown-button"
                            onClick={() => navigateEvidenceConsistencyPivotFromHint(h, syncRunsLimit)}
                          >
                            {h.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </section>
  );
}
