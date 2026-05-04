import { useCallback, useEffect, useMemo, useState } from "react";

import { APP_URL_SEARCH_CHANGED } from "../../lib/url-app-state";
import { WorkspaceHeader } from "../../components/workspace-header";
import {
  SERVICE_IMPACT_WORKSPACE_SERVICE_ID_PARAM,
  readServiceImpactWorkspaceServiceIdFromSearch,
} from "../../lib/service-impact-workspace-navigation";
import { useReplaceUrlSearchParams } from "../../lib/use-url-search-params";
import { ServiceImpactWorkspaceProduct } from "./service-impact-workspace-product";

function readSearch(): string {
  return typeof window !== "undefined" ? window.location.search : "";
}

export function ServiceImpactWorkspaceView() {
  const [search, setSearch] = useState(readSearch);
  const replaceUrlSearchParams = useReplaceUrlSearchParams();

  const syncFromUrl = useCallback(() => {
    setSearch(readSearch());
  }, []);

  useEffect(() => {
    window.addEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
    return () => window.removeEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
  }, [syncFromUrl]);

  const serviceId = useMemo(() => readServiceImpactWorkspaceServiceIdFromSearch(search), [search]);

  const applyServiceId = useCallback(
    (raw: string) => {
      const next = new URLSearchParams(search);
      const t = raw.trim();
      if (!t) {
        next.delete(SERVICE_IMPACT_WORKSPACE_SERVICE_ID_PARAM);
      } else {
        next.set(SERVICE_IMPACT_WORKSPACE_SERVICE_ID_PARAM, t);
      }
      replaceUrlSearchParams(next);
    },
    [search, replaceUrlSearchParams],
  );

  return (
    <section className="workspace-page service-impact-workspace-route">
      <ServiceImpactWorkspaceSetup serviceId={serviceId} onApplyServiceId={applyServiceId} />
      {serviceId ? <ServiceImpactWorkspaceProduct serviceId={serviceId} /> : null}
    </section>
  );
}

function ServiceImpactWorkspaceSetup({
  serviceId,
  onApplyServiceId,
}: {
  serviceId: string | null;
  onApplyServiceId: (raw: string) => void;
}) {
  const [draft, setDraft] = useState(serviceId ?? "");

  useEffect(() => {
    setDraft(serviceId ?? "");
  }, [serviceId]);

  return (
    <div className="service-impact-workspace-setup workspace-page">
      <WorkspaceHeader
        eyebrow="Services & Policies"
        title="Service Impact"
        summary="Load a bounded service impact workspace that composes service grouping detail with optional impact context."
      />
      <div className="detail-card">
        <p className="body-copy">
          Enter a <strong>service_id</strong> (same forms as Service Explorer: <code>policy:…</code>,{" "}
          <code>color:…</code>, <code>headend:…</code>, <code>endpoint:…</code>) to load the composed{" "}
          <code>service_impact_workspace_v1</code> workspace (Explorer detail [+ optional failure-impact]). This is
          read-only interpretation support, not blast-radius truth, SLA proof, incident command, or change authority.
        </p>
      <form
        className="service-impact-workspace-setup__form"
        onSubmit={(e) => {
          e.preventDefault();
          onApplyServiceId(draft);
        }}
      >
        <label htmlFor="siw-service-id-input">service_id</label>
        <input
          id="siw-service-id-input"
          className="service-impact-workspace-setup__input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. policy:PE1:static_local:192.0.2.11:100"
          autoComplete="off"
        />
        <button type="submit">Load workspace</button>
      </form>
      </div>
    </div>
  );
}
