import type { ApiClientError } from "../../api/client";
import type { CrossDomainDeltaDigestResponse } from "../../api/contracts";
import { navigateToDeltaDigestView } from "../../lib/delta-digest-navigation";

export interface DeltaDigestOverviewEntryProps {
  /** Same bounded window as Overview recent-change and digest API (`sync_runs_limit`). */
  syncRunsLimit: number;
  deltaDigest: {
    data: CrossDomainDeltaDigestResponse | null;
    error: ApiClientError | null;
    isLoading: boolean;
    reload: () => void | Promise<void>;
  };
}

function weakDigestSectionsCount(data: CrossDomainDeltaDigestResponse): number {
  return data.sections.filter((s) =>
    ["partial", "absent", "unavailable"].includes(s.evidence_status),
  ).length;
}

/**
 * Overview / NOC cockpit entry for the cross-domain delta digest (`cross_domain_delta_digest_v1`).
 * Composition-only: reuses the same digest GET the full workspace uses; no separate cockpit assembly.
 */
export function DeltaDigestOverviewEntry({ syncRunsLimit, deltaDigest }: DeltaDigestOverviewEntryProps) {
  const { data, error, isLoading, reload } = deltaDigest;

  return (
    <article className="detail-card delta-digest-entry-card" data-testid="delta-digest-overview-entry">
      <div className="delta-digest-entry-card__intro">
        <h3>Delta digest (cross-domain)</h3>
        <p className="table-note">
          Bounded “what changed recently?” orientation across existing read-side contracts—same{" "}
          <code>cross_domain_delta_digest_v1</code> assembly as the Delta digest workspace, not a separate score,
          timeline, or incident priority signal.
        </p>
      </div>

      {error && !data ? (
        <div className="delta-digest-entry-card__state delta-digest-entry-card__state--error">
          <p className="table-note">{error.message}</p>
          <button type="button" className="inline-action" onClick={() => void reload()}>
            Retry delta digest preview
          </button>
        </div>
      ) : null}

      {isLoading && !data && !error ? (
        <p className="table-note delta-digest-entry-card__state">Loading digest summary from app-api…</p>
      ) : null}

      {data ? (
        <div className="delta-digest-entry-card__summary" data-testid="delta-digest-cockpit-summary">
          <p className="table-note">
            <strong>{data.contract_id}</strong> · completeness{" "}
            <span className="status-pill status-neutral">{data.completeness_posture.replace(/_/g, " ")}</span> · sync
            window applied {data.sync_runs_limit_applied} (URL {syncRunsLimit})
          </p>
          <p className="table-note">
            Sections with partial/absent/unavailable evidence: <strong>{weakDigestSectionsCount(data)}</strong> of{" "}
            {data.sections.length} — honest bounded visibility, not silent “all clear.”
          </p>
        </div>
      ) : null}

      <div className="delta-digest-entry-card__actions">
        <button
          type="button"
          className="delta-digest-entry-primary"
          onClick={() => navigateToDeltaDigestView(syncRunsLimit)}
        >
          Open delta digest
        </button>
        <p className="table-note delta-digest-entry-card__hint">
          Same <strong>sync run window</strong> as <strong>Recent change (bounded)</strong> below when opened from
          Overview ({syncRunsLimit} sync runs). Full sections and pivots live on the digest workspace.
        </p>
      </div>
    </article>
  );
}
