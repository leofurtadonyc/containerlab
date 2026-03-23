import { ErrorState, LoadingState } from "../../components/query-states";
import { ApiClientError } from "../../api/client";
import type { TopologyObjectKind } from "../../api/contracts";
import { formatLabel } from "../../lib/presentation";
import {
  navigateToInvestigationView,
  readSyncRunsLimitFromSearch,
  DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT,
} from "../../lib/investigation-navigation";
import { navigateToEvidenceView, navigateToPoliciesWithDegradedPolicyV1Posture } from "../../lib/url-app-state";
import { navigateToTopologyDossier } from "../../lib/topology-dossier-navigation";
import { useTopologyFailureImpactQuery } from "./api";

function formatExplicitNonClaim(key: string): string {
  return key
    .split("_")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export interface TopologyFailureImpactPanelProps {
  /** When null, prompts the operator to select a topology object first. */
  objectId: string | null;
  objectKind: TopologyObjectKind | null;
}

export function TopologyFailureImpactPanel({ objectId, objectKind }: TopologyFailureImpactPanelProps) {
  const { data, error, isLoading, isRefreshing, reload } = useTopologyFailureImpactQuery(objectId);

  if (objectId === null || objectKind === null) {
    return (
      <article className="detail-card">
        <h3>Failure impact (v1)</h3>
        <p className="table-note">
          Select a node or link in the tables above to load a bounded, read-only rollup of related
          policy evidence. This is not blast-radius simulation or dependency analysis.
        </p>
      </article>
    );
  }

  if (isLoading && !data) {
    return (
      <article className="detail-card">
        <h3>Failure impact (v1)</h3>
        <LoadingState label="Loading failure-impact rollups for this topology object…" />
      </article>
    );
  }

  if (error) {
    const isNotFound = error instanceof ApiClientError && error.status === 404;
    return (
      <article className="detail-card">
        <h3>Failure impact (v1)</h3>
        {isNotFound ? (
          <div className="query-message">
            <strong>No topology object for this id</strong>
            <p>
              The backend did not find this object in the current topology snapshot, so failure-impact
              rollups cannot be assembled. Choose a node or link that exists in normalized topology.
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

  const rc = data.rollup_counts;
  const pathPartial =
    rc.related_policies_total > 0 &&
    rc.related_policies_path_analysis_supported_total < rc.related_policies_total;
  const hasDegraded = rc.degraded_related_policies_total > 0;

  const syncRuns =
    typeof window !== "undefined"
      ? readSyncRunsLimitFromSearch(window.location.search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT)
      : DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT;

  return (
    <article className="detail-card">
      <h3>Failure impact (v1)</h3>
      {isRefreshing ? (
        <p className="table-note" role="status">
          Refreshing failure-impact rollups…
        </p>
      ) : null}
      <p className="table-note">
        <strong>Bounded, read-only, evidence-based.</strong> This panel summarizes string-aligned
        related policies and degraded-policy (v1) signals for the selected object. It is{" "}
        <strong>not</strong> a blast-radius simulation, dependency graph, dataplane verdict, or
        safe-change authority.
      </p>
      <p className="footnote">{data.safety_framing.summary_disclaimer}</p>
      <p className="table-note">
        Subject: <strong>{formatLabel(data.subject.kind)}</strong> <code>{data.subject.object_id}</code>{" "}
        — counts apply only to the related-policy set for this object, not global inventory health.
      </p>
      <div className="callout">
        <strong>Explicit non-claims</strong>
        <ul className="notes-list">
          {data.safety_framing.explicit_non_claims.map((k) => (
            <li key={k}>{formatExplicitNonClaim(k)}</li>
          ))}
        </ul>
      </div>
      <div className="key-value-list">
        <div className="key-value-row">
          <span>Related policies (distinct)</span>
          <strong>{rc.related_policies_total}</strong>
        </div>
        <div className="key-value-row">
          <span>Degraded (v1) — related subset</span>
          <strong>{rc.degraded_related_policies_total}</strong>
        </div>
        <div className="key-value-row">
          <span>Non-degraded (ok + unknown) — related subset</span>
          <strong>{rc.non_degraded_related_policies_total}</strong>
        </div>
        <div className="key-value-row">
          <span>Path-analysis interpretation supported</span>
          <strong>{rc.related_policies_path_analysis_supported_total}</strong>
        </div>
      </div>
      <p className="summary-label">Degraded posture breakdown (related policies)</p>
      <div className="key-value-list">
        <div className="key-value-row">
          <span>Ok</span>
          <strong>{data.degraded_posture_breakdown.ok}</strong>
        </div>
        <div className="key-value-row">
          <span>Degraded</span>
          <strong>{data.degraded_posture_breakdown.degraded}</strong>
        </div>
        <div className="key-value-row">
          <span>Unknown</span>
          <strong>{data.degraded_posture_breakdown.unknown}</strong>
        </div>
      </div>
      {rc.related_policies_total === 0 ? (
        <p className="footnote">
          No related policies matched this object using bounded string equality — so there is no
          degraded or path-analysis rollup to show here yet.
        </p>
      ) : null}
      {pathPartial ? (
        <div className="callout">
          <strong>Partial path-analysis support</strong>
          <p className="table-note">
            At least one related policy blocks full path-analysis interpretation (unsupported or
            not-implemented support posture). Use per-policy path analysis from Policies for detail.
          </p>
        </div>
      ) : null}
      {data.caveats.length > 0 ? (
        <div className="callout">
          <strong>Caveats</strong>
          <ul className="notes-list">
            {data.caveats.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {data.missing_evidence_notes.length > 0 ? (
        <div className="callout">
          <strong>Missing or limited evidence</strong>
          <ul className="notes-list">
            {data.missing_evidence_notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="summary-label">Freshness</p>
      <div className="key-value-list">
        <div className="key-value-row">
          <span>Policy inventory serving mode (echo)</span>
          <strong>{data.freshness.policy_serving_mode_echo}</strong>
        </div>
        {data.freshness.policy_inventory_empty_reason ? (
          <div className="key-value-row">
            <span>Policy inventory empty reason</span>
            <strong>{data.freshness.policy_inventory_empty_reason}</strong>
          </div>
        ) : null}
      </div>
      <p className="summary-label">Related views</p>
      <p className="table-note">
        <button
          type="button"
          className="nav-drilldown-button"
          onClick={() => navigateToTopologyDossier(objectId, objectKind, "failure_impact")}
        >
          Open dossier workspace
        </button>{" "}
        <button type="button" className="table-select" onClick={() => navigateToEvidenceView("policies")}>
          Open policy inventory
        </button>{" "}
        {hasDegraded ? (
          <button
            type="button"
            className="inline-action"
            onClick={() => navigateToPoliciesWithDegradedPolicyV1Posture("degraded")}
          >
            Policies filtered to degraded (v1)
          </button>
        ) : null}{" "}
        <button
          type="button"
          className="table-select"
          onClick={() =>
            navigateToInvestigationView(syncRuns, {
              invFrom: "topology",
              topologyObject: { id: objectId, kind: objectKind },
              failureImpactEntry: true,
            })
          }
        >
          Open in Investigation
        </button>
      </p>
      <p className="footnote">
        Opens the investigation workspace with <code>topology_object</code>,{" "}
        <code>topology_object_kind</code>, and <code>failure_impact_entry=v1</code> in the URL for
        breadcrumb context — read-only navigation, not workflow execution.
      </p>
    </article>
  );
}
