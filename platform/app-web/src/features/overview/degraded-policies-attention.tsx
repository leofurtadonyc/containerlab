import type { PoliciesListResponse } from "../../api/contracts";
import { StatusPill } from "../../components/status-pill";
import { navigateToPolicyDossierWorkspace } from "../../lib/policy-dossier-navigation";
import { navigateToServiceExplorerForPolicy } from "../../lib/service-explorer-navigation";
import { navigateToServiceDossierForPolicy } from "../../lib/service-dossier-navigation";

const MAX_ROWS = 8;

const POSTURE_RANK: Record<string, number> = {
  degraded: 0,
  unknown: 1,
  ok: 2,
};

function sortForAttention(items: PoliciesListResponse["items"]) {
  return [...items].sort((a, b) => {
    const pa = POSTURE_RANK[a.degraded_policy_v1.posture] ?? 99;
    const pb = POSTURE_RANK[b.degraded_policy_v1.posture] ?? 99;
    if (pa !== pb) {
      return pa - pb;
    }
    return a.policy_id.localeCompare(b.policy_id);
  });
}

export interface DegradedPoliciesAttentionProps {
  data: PoliciesListResponse | null;
}

/**
 * Top inventory rows by existing degraded_policy_v1 classification — not new scoring.
 */
export function DegradedPoliciesAttention({ data }: DegradedPoliciesAttentionProps) {
  if (!data || data.items.length === 0) {
    return (
      <article className="detail-card" id="degraded-policies-attention">
        <h3>Policy attention (degraded_policy v1)</h3>
        <p className="table-note">
          No policy rows on the current inventory response—open <strong>Policies</strong> for the full list when live
          evidence is available.
        </p>
      </article>
    );
  }

  const rows = sortForAttention(data.items).slice(0, MAX_ROWS);
  const hasMore = data.items.length > rows.length;

  return (
    <article className="detail-card" id="degraded-policies-attention">
      <div className="section-header">
        <div>
          <h3>Policy attention (degraded_policy v1)</h3>
          <p className="table-note">
            Sorted by existing <code>degraded_policy_v1.posture</code> on inventory rows — not dataplane proof, SLA, or
            validation verdict.
          </p>
        </div>
      </div>
      <p className="table-note">
        Showing top {rows.length} of {data.items.length} policy row{data.items.length === 1 ? "" : "s"}
        {hasMore ? " (truncated on NOC cockpit)" : ""}. Inventory contract:{" "}
        <code>{data.read_side_query?.items_returned ?? data.items.length}</code> returned.
      </p>
      <table className="data-table">
        <thead>
          <tr>
            <th>Policy</th>
            <th>Posture (v1)</th>
            <th>Dossier</th>
            <th>Service Explorer</th>
            <th>Service dossier</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.policy_id}>
              <td>
                <strong>{row.policy_name.trim() ? row.policy_name : row.policy_id}</strong>
                <div className="table-note">
                  <code>{row.policy_id}</code>
                </div>
              </td>
              <td>
                <StatusPill value={row.degraded_policy_v1.posture} />
              </td>
              <td>
                <button
                  type="button"
                  className="nav-drilldown-button"
                  onClick={() => navigateToPolicyDossierWorkspace(row.policy_id, "overview_noc_cockpit")}
                >
                  Open policy dossier
                </button>
              </td>
              <td>
                <button
                  type="button"
                  className="nav-drilldown-button"
                  onClick={() => navigateToServiceExplorerForPolicy(row.policy_id)}
                >
                  Open service view
                </button>
              </td>
              <td>
                <button
                  type="button"
                  className="nav-drilldown-button"
                  onClick={() => navigateToServiceDossierForPolicy(row.policy_id)}
                  title="service_dossier_v1 — same policy: anchor as Service Explorer"
                >
                  Open service dossier
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
