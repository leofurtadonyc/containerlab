import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiClientError } from "../../api/client";
import { ErrorState, LoadingState } from "../../components/query-states";
import { APP_URL_SEARCH_CHANGED } from "../../lib/url-app-state";
import type { ChangeSafetyCaseDownloadTarget } from "../../lib/change-safety-case-download";
import {
  navigateToChangeSafetyCaseForPolicy,
  navigateToChangeSafetyCaseForService,
  readChangeSafetyCaseRouteFromSearch,
  type ChangeSafetyCaseRoute,
} from "../../lib/change-safety-case-navigation";
import { ChangeSafetyCaseProduct } from "./change-safety-case-product";
import { useChangeSafetyCaseQuery } from "./api";

function readSearch(): string {
  return typeof window !== "undefined" ? window.location.search : "";
}

function routeToDownloadTarget(route: ChangeSafetyCaseRoute): ChangeSafetyCaseDownloadTarget | null {
  if (route.kind === "policy_change_safety") {
    return { kind: "policy_change_safety", policyId: route.policyId };
  }
  if (route.kind === "service_change_safety") {
    return { kind: "service_change_safety", serviceId: route.serviceId };
  }
  if (route.kind === "topology_change_safety") {
    return { kind: "topology_change_safety", query: route.query };
  }
  return null;
}

export function ChangeSafetyCaseView() {
  const [search, setSearch] = useState(readSearch);

  const syncFromUrl = useCallback(() => {
    setSearch(readSearch());
  }, []);

  useEffect(() => {
    window.addEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
    return () => window.removeEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
  }, [syncFromUrl]);

  const route = useMemo(() => readChangeSafetyCaseRouteFromSearch(search), [search]);
  const enabled =
    route.kind === "policy_change_safety" ||
    route.kind === "service_change_safety" ||
    route.kind === "topology_change_safety";
  const q = useChangeSafetyCaseQuery(route, enabled);
  const reload = q.reload;

  const downloadTarget = useMemo(() => (enabled ? routeToDownloadTarget(route) : null), [enabled, route]);

  if (route.kind === "setup") {
    return (
      <section className="change-safety-case-route change-safety-case-route--setup">
        <h2>Change Safety Case</h2>
        <p className="body-copy">
          Open a <strong>change_safety_case_v1</strong> from <strong>Service Explorer</strong>,{" "}
          <strong>Policy explainability</strong>, or <strong>Maintenance Preview</strong>, or use the quick form below.
          This workspace summarizes pre-change evidence posture and gaps—not approval, validation, or safe-to-change
          truth.
        </p>
        <ChangeSafetyCaseSetupForm />
      </section>
    );
  }

  if (route.kind === "invalid") {
    return (
      <section className="change-safety-case-route change-safety-case-route--error">
        <h2>Change Safety Case</h2>
        <ErrorState error={new ApiClientError(route.reason, 422, "shell_validation")} onRetry={syncFromUrl} />
      </section>
    );
  }

  if (q.isLoading && !q.data) {
    return (
      <section className="change-safety-case-route change-safety-case-route--loading">
        <h2>Change Safety Case</h2>
        <LoadingState label="Loading change_safety_case_v1 from app-api." />
      </section>
    );
  }

  if (q.error) {
    return (
      <section className="change-safety-case-route change-safety-case-route--error">
        <h2>Change Safety Case</h2>
        <ErrorState error={q.error} onRetry={reload} />
      </section>
    );
  }

  if (!q.data || !downloadTarget) {
    return null;
  }

  return (
    <section className="change-safety-case-route">
      <ChangeSafetyCaseProduct data={q.data} downloadTarget={downloadTarget} onReload={reload} />
    </section>
  );
}

function ChangeSafetyCaseSetupForm() {
  const [serviceId, setServiceId] = useState("");
  const [policyId, setPolicyId] = useState("");

  return (
    <div className="change-safety-case-setup">
      <h3>Quick open</h3>
      <div className="change-safety-case-setup__row">
        <label htmlFor="csc-setup-service">service_id</label>
        <input
          id="csc-setup-service"
          className="change-safety-case-setup__input"
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          placeholder="e.g. color:100"
          autoComplete="off"
        />
        <button
          type="button"
          className="inline-action"
          disabled={!serviceId.trim()}
          onClick={() => navigateToChangeSafetyCaseForService(serviceId.trim())}
        >
          Open service change safety case
        </button>
      </div>
      <div className="change-safety-case-setup__row">
        <label htmlFor="csc-setup-policy">policy_id</label>
        <input
          id="csc-setup-policy"
          className="change-safety-case-setup__input"
          value={policyId}
          onChange={(e) => setPolicyId(e.target.value)}
          placeholder="from Policies inventory"
          autoComplete="off"
        />
        <button
          type="button"
          className="inline-action"
          disabled={!policyId.trim()}
          onClick={() => navigateToChangeSafetyCaseForPolicy(policyId.trim())}
        >
          Open policy change safety case
        </button>
      </div>
      <p className="table-note">
        Topology subjects reuse the same URL parameters as Maintenance Preview—open Maintenance Preview first, then use{" "}
        <strong>Change safety case</strong> from that workspace, or set{" "}
        <code>view=change-safety-case&amp;change_safety_context=topology_change_safety</code> with maintenance
        selectors.
      </p>
    </div>
  );
}
