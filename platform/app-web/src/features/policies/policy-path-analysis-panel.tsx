import { ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import { ApiClientError } from "../../api/client";
import type { PathAnalysisViewResponse } from "../../api/contracts";
import { buildRowPostureStatusDisplay, formatDateTime, formatLabel } from "../../lib/presentation";
import { usePolicyPathAnalysisQuery } from "./api";

export interface PolicyPathAnalysisPanelProps {
  policyId: string;
}

function renderEvidenceList(sources: PathAnalysisViewResponse["evidence_sources"]) {
  if (sources.length === 0) {
    return <p className="footnote">No evidence sources were attributed on this assembly.</p>;
  }
  return (
    <ul className="notes-list">
      {sources.map((src, index) => (
        <li key={`${src.domain}-${index}`}>
          <strong>{formatLabel(src.domain)}</strong>
          {src.reference ? ` — ${src.reference}` : ""}
        </li>
      ))}
    </ul>
  );
}

export function PolicyPathAnalysisPanel({ policyId }: PolicyPathAnalysisPanelProps) {
  const { data, error, isLoading, isRefreshing, reload } = usePolicyPathAnalysisQuery(policyId);

  if (!policyId) {
    return null;
  }

  if (isLoading && !data) {
    return (
      <article id="policy-path-analysis" className="detail-card">
        <h3>Path analysis</h3>
        <LoadingState label="Loading bounded path analysis (read-only assembly)…" />
      </article>
    );
  }

  if (error) {
    const isNotFound = error instanceof ApiClientError && error.status === 404;
    return (
      <article id="policy-path-analysis" className="detail-card">
        <h3>Path analysis</h3>
        {isNotFound ? (
          <div className="query-message">
            <strong>Path analysis not available for this id</strong>
            <p>
              The policy id is not present in the current bounded inventory list, so the path-analysis
              assembly cannot run. This is expected when the list is truncated, filtered, or the record
              was removed since the last snapshot.
            </p>
          </div>
        ) : (
          <ErrorState error={error} onRetry={() => void reload()} />
        )}
      </article>
    );
  }

  if (!data) {
    return null;
  }

  const { safety_framing, freshness, truth_alignment, caveats } = data;

  return (
    <article id="policy-path-analysis" className="detail-card">
      <h3>Path analysis</h3>
      {isRefreshing ? (
        <p className="table-note" role="status">
          Refreshing path analysis…
        </p>
      ) : null}
      <p className="footnote">{safety_framing.summary_disclaimer}</p>
      <p className="summary-label">Authority and scope</p>
      <div className="key-value-list">
        <div className="key-value-row">
          <span>Contract</span>
          <strong>{safety_framing.contract_id}</strong>
        </div>
        <div className="key-value-row">
          <span>Authority posture</span>
          <strong>{formatLabel(safety_framing.authority_posture)}</strong>
        </div>
        <div className="key-value-row">
          <span>Phase</span>
          <strong>{formatLabel(safety_framing.phase)}</strong>
        </div>
      </div>
      <p className="summary-label">Explicit non-claims</p>
      <p className="footnote">
        Path analysis does not imply the following (labels are API-stable keys):
      </p>
      <ul className="notes-list">
        {safety_framing.explicit_non_claims.map((claim) => (
          <li key={claim}>{formatLabel(claim)}</li>
        ))}
      </ul>

      <p className="summary-label">Intended path hints</p>
      {data.intended_path_hints.length === 0 ? (
        <p className="footnote">No intended-side hints were assembled for this slice.</p>
      ) : (
        <ul className="notes-list">
          {data.intended_path_hints.map((hint) => (
            <li key={hint.hint_id}>
              <strong>{formatLabel(hint.kind)}</strong>
              {" — "}
              {hint.summary}
              {hint.evidence_sources.length > 0 ? (
                <span className="table-note">
                  {" "}
                  (sources:{" "}
                  {hint.evidence_sources.map((e) => formatLabel(e.domain)).join(", ")})
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <p className="summary-label">Observed path hints</p>
      {data.observed_path_hints.length === 0 ? (
        <p className="footnote">No observed-side hints were assembled for this slice.</p>
      ) : (
        <ul className="notes-list">
          {data.observed_path_hints.map((hint) => (
            <li key={hint.hint_id}>
              <strong>{formatLabel(hint.kind)}</strong>
              {" — "}
              {hint.summary}
              {hint.candidate_path_name ? (
                <span className="table-note"> (candidate: {hint.candidate_path_name})</span>
              ) : null}
              {hint.observed_path_state ? (
                <span className="table-note"> — path state: {hint.observed_path_state}</span>
              ) : null}
              {hint.notes.length > 0 ? (
                <ul className="notes-list">
                  {hint.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <p className="summary-label">Candidate path summaries</p>
      {data.candidate_path_summaries.length === 0 ? (
        <p className="footnote">No candidate path rows were summarized for this assembly.</p>
      ) : (
        <ul className="notes-list">
          {data.candidate_path_summaries.map((row) => {
            const display = buildRowPostureStatusDisplay(
              row.current_posture,
              row.path_state,
              row.last_recorded_path_state,
              "Last recorded path state",
            );
            return (
              <li key={row.name}>
                <strong>{row.name}</strong>
                {" — "}
                <StatusPill value={display.pillValue} />
                {display.note ? <span className="table-note"> {display.note}</span> : null}
                {row.preference === null ? "" : `, preference ${row.preference}`}
                {row.notes.length > 0 ? ` — ${row.notes.join("; ")}` : ""}
              </li>
            );
          })}
        </ul>
      )}

      <p className="summary-label">Evidence rollup</p>
      {renderEvidenceList(data.evidence_sources)}

      <p className="summary-label">Freshness anchors</p>
      <div className="key-value-list">
        <div className="key-value-row">
          <span>Assembly generated</span>
          <strong>{formatDateTime(freshness.assembly_generated_at)}</strong>
        </div>
        <div className="key-value-row">
          <span>Policy snapshot observed</span>
          <strong>{formatDateTime(freshness.policy_snapshot_observed_at)}</strong>
        </div>
        <div className="key-value-row">
          <span>Topology snapshot observed</span>
          <strong>{formatDateTime(freshness.topology_snapshot_observed_at)}</strong>
        </div>
        <div className="key-value-row">
          <span>Inventory snapshot observed</span>
          <strong>{formatDateTime(freshness.inventory_snapshot_observed_at)}</strong>
        </div>
        <div className="key-value-row">
          <span>Serving mode echo</span>
          <strong>
            {freshness.serving_mode_echo ? formatLabel(freshness.serving_mode_echo) : "Not echoed"}
          </strong>
        </div>
      </div>

      <p className="summary-label">Truth alignment (interpretive, not a verdict)</p>
      <div className="key-value-list">
        <div className="key-value-row">
          <span>Posture</span>
          <strong>
            <StatusPill value={truth_alignment.posture} />
          </strong>
        </div>
      </div>
      <p className="footnote">{truth_alignment.summary}</p>

      <p className="summary-label">Caveats</p>
      {caveats.length === 0 ? (
        <p className="footnote">No additional caveats were attached to this assembly.</p>
      ) : (
        <ul className="notes-list">
          {caveats.map((c, i) => (
            <li key={`${c.code}-${i}`}>
              <strong>{formatLabel(c.code)}</strong>
              {" — "}
              {c.message}
            </li>
          ))}
        </ul>
      )}

      <p className="summary-label">Response metadata</p>
      <div className="key-value-list">
        <div className="key-value-row">
          <span>API generated at</span>
          <strong>{formatDateTime(data.metadata.generated_at)}</strong>
        </div>
        <div className="key-value-row">
          <span>Assembly subject</span>
          <strong>
            {data.subject.policy_name} ({data.subject.policy_id})
          </strong>
        </div>
      </div>
      <p className="footnote">
        Path analysis does not report per-hop label stacks, dataplane forwarding, or controller CSPF
        resolution. Use topology and platform surfaces for coverage and collector posture; compare
        timestamps above when judging staleness.
      </p>
    </article>
  );
}
