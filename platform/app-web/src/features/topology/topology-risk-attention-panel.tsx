import type { TopologyObjectKind, TopologyRiskSummaryResponse } from "../../api/contracts";
import { EmptyState, LoadingState, QueryStateSummaryCard } from "../../components/query-states";
import { formatDateTime, formatLabel } from "../../lib/presentation";
import { navigateToTopologyObject } from "../../lib/topology-policy-navigation";

export interface TopologyRiskAttentionPanelProps {
  variant: "overview" | "topology";
  data: TopologyRiskSummaryResponse | null;
  error: { message: string } | null;
  isLoading: boolean;
  isRefreshing: boolean;
  onRetry: () => void | Promise<void>;
  /** When set (typically on Topology view), selects the object in-page; otherwise navigates from Overview. */
  drillToObject?: (objectId: string, kind: TopologyObjectKind) => void;
}

const OVERVIEW_MAX_ROWS = 5;

export function TopologyRiskAttentionPanel({
  variant,
  data,
  error,
  isLoading,
  isRefreshing,
  onRetry,
  drillToObject,
}: TopologyRiskAttentionPanelProps) {

  if (error) {
    return (
      <QueryStateSummaryCard
        title="Topology attention (risk summary v1)"
        stateLabel="Unavailable"
        detail={error.message}
        tone="error"
        onRetry={() => void onRetry()}
        retryLabel="Retry topology attention summary"
      />
    );
  }

  if (isLoading && !data) {
    return (
      <article className="detail-card" id="topology-risk-attention">
        <h3>Topology attention (risk summary v1)</h3>
        <LoadingState label="Loading ranked topology attention summary from the read-only backend…" />
      </article>
    );
  }

  if (!data) {
    return null;
  }

  const rows =
    variant === "overview"
      ? data.ranked_objects.slice(0, OVERVIEW_MAX_ROWS)
      : data.ranked_objects;
  const hasMore = variant === "overview" && data.ranked_objects.length > OVERVIEW_MAX_ROWS;

  return (
    <article className="detail-card" id="topology-risk-attention">
      <div className="section-header">
        <div>
          <h3>Topology attention (risk summary v1)</h3>
          <p className="table-note">{data.safety_framing.summary_disclaimer}</p>
        </div>
        <span
          className={`status-pill ${data.assembly_confidence === "low" ? "status-warn" : "status-neutral"}`}
        >
          Assembly confidence: {data.assembly_confidence}
        </span>
      </div>

      <p className="callout">
        Ranked using <strong>related-policy breadth</strong> and <strong>degraded_policy v1</strong> posture
        counts only — <strong>not</strong> SLA risk, traffic risk, failure probability, or blast radius. Per-object
        failure-impact detail stays on Topology after you select an object.
      </p>

      <div className="metadata-row">
        <span>Generated {formatDateTime(data.metadata.generated_at)}</span>
        <span>Objects ranked: {data.total_objects}</span>
        <span>Policy serving: {data.freshness.policy_serving_mode_echo}</span>
      </div>

      {isRefreshing ? (
        <p className="table-note">Refreshing topology attention summary…</p>
      ) : null}

      {data.ranked_objects.length === 0 ? (
        <EmptyState
          title="No topology objects to rank"
          description="The topology snapshot had no nodes or links to include in this summary."
        />
      ) : (
        <>
          <p className="table-note">
            {variant === "overview"
              ? `Showing top ${rows.length} of ${data.ranked_objects.length} ranked object${
                  data.ranked_objects.length === 1 ? "" : "s"
                }${hasMore ? " (truncated on Overview)" : ""}. `
              : `Full ranked list (${data.ranked_objects.length} object${
                  data.ranked_objects.length === 1 ? "" : "s"
                }). `}
            Sort: {data.ranking_basis}
          </p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Object</th>
                <th>D / U / R / K</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.object_kind}-${row.object_id}`}>
                  <td>{row.rank_index}</td>
                  <td>
                    <strong>{formatLabel(row.object_kind)}</strong>{" "}
                    <code>{row.object_id}</code>
                  </td>
                  <td>
                    {row.ranking_inputs.degraded_related_count} degraded ·{" "}
                    {row.ranking_inputs.unknown_related_count} unknown · {row.ranking_inputs.related_policy_breadth}{" "}
                    related · {row.ranking_inputs.ok_related_count} ok
                  </td>
                  <td>
                    <button
                      type="button"
                      className="nav-drilldown-button"
                      onClick={() => {
                        if (drillToObject) {
                          drillToObject(row.object_id, row.object_kind);
                        } else {
                          navigateToTopologyObject(row.object_id, row.object_kind);
                        }
                      }}
                    >
                      {drillToObject ? "Select object" : "Open in Topology"}
                    </button>
                    <div className="table-note">
                      {drillToObject
                        ? "Scroll to node/link tables if needed; related policies and failure-impact panels load below when selected."
                        : "Opens Topology with this object selected so related policies and failure-impact panels load."}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

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
          <strong>Evidence limits</strong>
          <ul className="notes-list">
            {data.missing_evidence_notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {variant === "overview" ? (
        <p className="table-note">
          Open the <strong>Topology</strong> view for the full ranked list and per-object failure-impact detail.
        </p>
      ) : null}
    </article>
  );
}
