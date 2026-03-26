import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import type { StabilityPosture } from "../../api/contracts";
import {
  DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT,
  readSyncRunsLimitFromSearch,
} from "../../lib/investigation-navigation";
import { SERVICE_EXPLORER_SERVICE_ID_PARAM } from "../../lib/service-explorer-navigation";
import {
  readStabilityWorkspaceServiceIdFromSearch,
  readStabilityWorkspaceTopologyFromSearch,
} from "../../lib/stability-workspace-navigation";
import { APP_URL_SEARCH_CHANGED, navigateToEvidenceView } from "../../lib/url-app-state";
import { useReplaceUrlSearchParams } from "../../lib/use-url-search-params";
import {
  useOperationalStabilitySummaryQuery,
  useServiceStabilityProfileQuery,
  useTopologyObjectStabilityProfileQuery,
} from "./api";

function readSyncRunsLimitFromWindow(): number {
  return readSyncRunsLimitFromSearch(window.location.search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT);
}

function postureLabel(p: StabilityPosture): string {
  switch (p) {
    case "quiet_or_stable_evidence":
      return "Quiet or stable evidence (bounded)";
    case "elevated_churn":
      return "Elevated churn";
    case "recurrence_suspected":
      return "Recurrence suspected";
    case "degraded_recurrence":
      return "Degraded recurrence";
    case "insufficient_evidence_for_stability_view":
      return "Insufficient evidence for stability view";
    default:
      return p;
  }
}

export function StabilityWorkspaceView() {
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

  const syncRunsLimit = useMemo(() => readSyncRunsLimitFromSearch(search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT), [
    search,
  ]);

  const topologyAnchor = useMemo(() => readStabilityWorkspaceTopologyFromSearch(search), [search]);
  const serviceId = useMemo(() => readStabilityWorkspaceServiceIdFromSearch(search), [search]);

  const summaryQuery = useOperationalStabilitySummaryQuery(syncRunsLimit);
  const topologyProfileQuery = useTopologyObjectStabilityProfileQuery(
    topologyAnchor?.objectId ?? null,
    !!topologyAnchor,
  );
  const serviceProfileQuery = useServiceStabilityProfileQuery(serviceId, !!serviceId);

  const applySyncLimit = useCallback(
    (raw: string) => {
      const n = Number.parseInt(raw, 10);
      const lim = Number.isNaN(n) ? DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT : Math.min(100, Math.max(1, n));
      const sp = new URLSearchParams(search);
      sp.set("sync_runs_limit", String(lim));
      replaceUrlSearchParams(sp);
    },
    [search, replaceUrlSearchParams],
  );

  const applyTopology = useCallback(
    (objectId: string, kind: "node" | "link") => {
      const sp = new URLSearchParams(search);
      const t = objectId.trim();
      if (!t) {
        sp.delete("topology_object");
        sp.delete("topology_object_kind");
      } else {
        sp.set("topology_object", t);
        sp.set("topology_object_kind", kind);
      }
      replaceUrlSearchParams(sp);
    },
    [search, replaceUrlSearchParams],
  );

  const applyServiceId = useCallback(
    (raw: string) => {
      const sp = new URLSearchParams(search);
      const t = raw.trim();
      if (!t) {
        sp.delete(SERVICE_EXPLORER_SERVICE_ID_PARAM);
      } else {
        sp.set(SERVICE_EXPLORER_SERVICE_ID_PARAM, t);
      }
      replaceUrlSearchParams(sp);
    },
    [search, replaceUrlSearchParams],
  );

  if (summaryQuery.isLoading && !summaryQuery.data) {
    return (
      <section className="stability-workspace-route stability-workspace-route--loading">
        <h2>Stability workspace</h2>
        <LoadingState label="Loading operational_stability_summary_v1 from app-api (bounded read-side assembly)." />
      </section>
    );
  }

  if (summaryQuery.error) {
    return (
      <section className="stability-workspace-route stability-workspace-route--error">
        <h2>Stability workspace</h2>
        <ErrorState error={summaryQuery.error} onRetry={summaryQuery.reload} />
        <p className="table-note">
          <button type="button" className="inline-action" onClick={() => navigateToEvidenceView("overview")}>
            Back to Overview
          </button>
        </p>
      </section>
    );
  }

  if (!summaryQuery.data) {
    return (
      <section className="stability-workspace-route stability-workspace-route--empty">
        <h2>Stability workspace</h2>
        <EmptyState
          title="No stability summary"
          description="The backend did not return an operational stability summary for the current request."
        />
      </section>
    );
  }

  const sum = summaryQuery.data;

  return (
    <section className="stability-workspace-route" data-testid="stability-workspace">
      <header className="stability-workspace-hero">
        <div className="stability-workspace-hero__text">
          <p className="eyebrow">Week 37 — read-only</p>
          <h2 className="stability-workspace-hero__title">Stability workspace</h2>
          <p className="body-copy stability-workspace-hero__lede">
            Cross-surface <strong>operational stability summary</strong> plus optional{" "}
            <strong>topology object</strong> and <strong>service</strong> stability profiles. Interpretation support
            only—<strong>not</strong> prediction, SLA truth, approval, workflow authority, or safe-to-change verdicts.
          </p>
        </div>
        <div className="stability-workspace-hero__actions">
          <button type="button" className="inline-action" onClick={() => void summaryQuery.reload()}>
            Reload summary
          </button>
        </div>
      </header>

      <StabilityWorkspaceSetup
        syncRunsLimit={syncRunsLimit}
        onApplySyncLimit={applySyncLimit}
        topologyAnchor={topologyAnchor}
        onApplyTopology={applyTopology}
        serviceId={serviceId}
        onApplyServiceId={applyServiceId}
      />

      <div className="stability-workspace-metadata detail-card" aria-label="Assembly metadata">
        <p className="meta-copy">
          <strong>operational_stability_summary_v1</strong> · generated_at {sum.metadata.generated_at} · sync_runs_limit
          applied {sum.sync_runs_limit_applied}
        </p>
      </div>

      <section className="stability-workspace-summary detail-card" aria-labelledby="stability-summary-heading">
        <h3 id="stability-summary-heading">Operational stability posture</h3>
        <p className="stability-workspace-posture">
          <strong>{postureLabel(sum.operational_stability_posture)}</strong>
        </p>
        <p className="body-copy">{sum.scope_summary}</p>
        <h4 className="stability-workspace-subheading">Explicit non-claims</h4>
        <ul className="stability-workspace-nonclaims">
          {sum.safety_framing.explicit_non_claims.map((c) => (
            <li key={c}>
              <code>{c}</code>
            </li>
          ))}
        </ul>
        {sum.rows.length > 0 ? (
          <ul className="stability-workspace-rows">
            {sum.rows.map((row, idx) => (
              <li key={`${row.row_type}-${idx}`} className="stability-workspace-row">
                <p>
                  <strong>{row.row_type}</strong>
                  {row.stability_posture_hint ? (
                    <>
                      {" "}
                      · <code>{row.stability_posture_hint}</code>
                    </>
                  ) : null}
                </p>
                <p className="body-copy">{row.summary}</p>
                {row.detail ? <p className="meta-copy">{row.detail}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="table-note">No stability rows for this window (honest sparse assembly).</p>
        )}
        {sum.caveats.length > 0 ? (
          <div>
            <h4 className="stability-workspace-subheading">Caveats</h4>
            <ul>
              {sum.caveats.map((c) => (
                <li key={c} className="body-copy">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {topologyAnchor ? (
        <section className="stability-workspace-profile detail-card" data-testid="stability-topology-profile">
          <h3>Topology object stability profile</h3>
          <p className="meta-copy">
            <code>{topologyAnchor.kind}</code> · <code>{topologyAnchor.objectId}</code> ·{" "}
            <code>topology_object_stability_profile_v1</code>
          </p>
          {topologyProfileQuery.isLoading && !topologyProfileQuery.data ? (
            <LoadingState label="Loading topology_object_stability_profile_v1…" />
          ) : null}
          {topologyProfileQuery.error ? (
            <ErrorState error={topologyProfileQuery.error} onRetry={topologyProfileQuery.reload} />
          ) : null}
          {topologyProfileQuery.data ? (
            <TopologyProfileBody data={topologyProfileQuery.data} />
          ) : null}
        </section>
      ) : null}

      {serviceId ? (
        <section className="stability-workspace-profile detail-card" data-testid="stability-service-profile">
          <h3>Service stability profile</h3>
          <p className="meta-copy">
            <code>{serviceId}</code> · <code>service_stability_profile_v1</code>
          </p>
          {serviceProfileQuery.isLoading && !serviceProfileQuery.data ? (
            <LoadingState label="Loading service_stability_profile_v1…" />
          ) : null}
          {serviceProfileQuery.error ? <ErrorState error={serviceProfileQuery.error} onRetry={serviceProfileQuery.reload} /> : null}
          {serviceProfileQuery.data ? <ServiceProfileBody data={serviceProfileQuery.data} /> : null}
        </section>
      ) : null}
    </section>
  );
}

function StabilityWorkspaceSetup({
  syncRunsLimit,
  onApplySyncLimit,
  topologyAnchor,
  onApplyTopology,
  serviceId,
  onApplyServiceId,
}: {
  syncRunsLimit: number;
  onApplySyncLimit: (raw: string) => void;
  topologyAnchor: { objectId: string; kind: "node" | "link" } | null;
  onApplyTopology: (objectId: string, kind: "node" | "link") => void;
  serviceId: string | null;
  onApplyServiceId: (raw: string) => void;
}) {
  const [syncDraft, setSyncDraft] = useState(String(syncRunsLimit));
  const [topId, setTopId] = useState(topologyAnchor?.objectId ?? "");
  const [topKind, setTopKind] = useState<"node" | "link">(topologyAnchor?.kind ?? "node");
  const [svcDraft, setSvcDraft] = useState(serviceId ?? "");

  useEffect(() => {
    setSyncDraft(String(syncRunsLimit));
  }, [syncRunsLimit]);

  useEffect(() => {
    setTopId(topologyAnchor?.objectId ?? "");
    setTopKind(topologyAnchor?.kind ?? "node");
  }, [topologyAnchor]);

  useEffect(() => {
    setSvcDraft(serviceId ?? "");
  }, [serviceId]);

  return (
    <div className="stability-workspace-setup detail-card">
      <h3>Workspace parameters</h3>
      <p className="body-copy">
        Anchors reuse shell query names: <code>sync_runs_limit</code>, <code>topology_object</code> /{" "}
        <code>topology_object_kind</code>, and <code>service_id</code> (Service Explorer forms).
      </p>
      <form
        className="stability-workspace-setup__row"
        onSubmit={(e) => {
          e.preventDefault();
          onApplySyncLimit(syncDraft);
        }}
      >
        <label>
          sync_runs_limit (1–100)
          <input
            type="number"
            min={1}
            max={100}
            value={syncDraft}
            onChange={(e) => setSyncDraft(e.target.value)}
          />
        </label>
        <button type="submit" className="inline-action">
          Apply
        </button>
      </form>
      <form
        className="stability-workspace-setup__row"
        onSubmit={(e) => {
          e.preventDefault();
          onApplyTopology(topId, topKind);
        }}
      >
        <label>
          Topology object_id
          <input value={topId} onChange={(e) => setTopId(e.target.value)} placeholder="e.g. PE1" />
        </label>
        <label>
          kind
          <select value={topKind} onChange={(e) => setTopKind(e.target.value as "node" | "link")}>
            <option value="node">node</option>
            <option value="link">link</option>
          </select>
        </label>
        <button type="submit" className="inline-action">
          Apply topology profile
        </button>
        <button type="button" className="inline-action" onClick={() => onApplyTopology("", "node")}>
          Clear topology
        </button>
      </form>
      <form
        className="stability-workspace-setup__row"
        onSubmit={(e) => {
          e.preventDefault();
          onApplyServiceId(svcDraft);
        }}
      >
        <label>
          service_id (Explorer forms)
          <input
            value={svcDraft}
            onChange={(e) => setSvcDraft(e.target.value)}
            placeholder="e.g. policy:…"
            className="stability-workspace-setup__service-input"
          />
        </label>
        <button type="submit" className="inline-action">
          Apply service profile
        </button>
        <button type="button" className="inline-action" onClick={() => onApplyServiceId("")}>
          Clear service
        </button>
      </form>
    </div>
  );
}

function TopologyProfileBody({ data }: { data: import("../../api/contracts").TopologyObjectStabilityProfileResponse }) {
  return (
    <div>
      <p className="stability-workspace-posture">
        <strong>{postureLabel(data.primary_stability_posture)}</strong>
      </p>
      <p className="body-copy">{data.profile_scope_summary}</p>
      <h4 className="stability-workspace-subheading">Explicit non-claims</h4>
      <ul className="stability-workspace-nonclaims">
        {data.safety_framing.explicit_non_claims.map((c) => (
          <li key={c}>
            <code>{c}</code>
          </li>
        ))}
      </ul>
      {data.volatility_churn_cues.length > 0 ? (
        <ProfileCueList title="Volatility / churn cues" items={data.volatility_churn_cues} />
      ) : null}
      {data.recurrence_and_degraded_cues.length > 0 ? (
        <ProfileCueList title="Recurrence / degraded cues" items={data.recurrence_and_degraded_cues} />
      ) : null}
      {data.evidence_weakness_cues.length > 0 ? (
        <ProfileCueList title="Evidence weakness" items={data.evidence_weakness_cues} />
      ) : null}
      {data.merged_caveats.length > 0 ? <ProfileCueList title="Merged caveats" items={data.merged_caveats} /> : null}
      {data.assembly_notes.length > 0 ? <ProfileCueList title="Assembly notes" items={data.assembly_notes} /> : null}
    </div>
  );
}

function ServiceProfileBody({ data }: { data: import("../../api/contracts").ServiceStabilityProfileResponse }) {
  return (
    <div>
      <p className="stability-workspace-posture">
        <strong>{postureLabel(data.primary_stability_posture)}</strong>
      </p>
      <p className="body-copy">{data.profile_scope_summary}</p>
      <h4 className="stability-workspace-subheading">Explicit non-claims</h4>
      <ul className="stability-workspace-nonclaims">
        {data.safety_framing.explicit_non_claims.map((c) => (
          <li key={c}>
            <code>{c}</code>
          </li>
        ))}
      </ul>
      {data.volatility_churn_cues.length > 0 ? (
        <ProfileCueList title="Volatility / churn cues" items={data.volatility_churn_cues} />
      ) : null}
      {data.recurrence_and_degraded_cues.length > 0 ? (
        <ProfileCueList title="Recurrence / degraded cues" items={data.recurrence_and_degraded_cues} />
      ) : null}
      {data.evidence_weakness_cues.length > 0 ? (
        <ProfileCueList title="Evidence weakness" items={data.evidence_weakness_cues} />
      ) : null}
      {data.merged_caveats.length > 0 ? <ProfileCueList title="Merged caveats" items={data.merged_caveats} /> : null}
      {data.assembly_notes.length > 0 ? <ProfileCueList title="Assembly notes" items={data.assembly_notes} /> : null}
    </div>
  );
}

function ProfileCueList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="stability-workspace-subheading">{title}</h4>
      <ul>
        {items.map((x) => (
          <li key={x} className="body-copy">
            {x}
          </li>
        ))}
      </ul>
    </div>
  );
}
