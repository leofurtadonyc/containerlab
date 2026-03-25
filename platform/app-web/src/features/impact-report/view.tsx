import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiClientError } from "../../api/client";
import { ErrorState, LoadingState } from "../../components/query-states";
import { APP_URL_SEARCH_CHANGED } from "../../lib/url-app-state";
import {
  readImpactReportRouteFromSearch,
  type ImpactReportRoute,
} from "../../lib/impact-report-navigation";
import { ImpactReportProduct } from "./impact-report-product";
import { useImpactReportQuery } from "./api";
import type { ImpactReportDownloadTarget } from "../../lib/impact-report-download";
import {
  navigateToImpactReportForPolicy,
  navigateToImpactReportForService,
} from "../../lib/impact-report-navigation";

function readSearch(): string {
  return typeof window !== "undefined" ? window.location.search : "";
}

function routeToDownloadTarget(route: ImpactReportRoute): ImpactReportDownloadTarget | null {
  if (route.kind === "service_impact") {
    return { kind: "service_impact", serviceId: route.serviceId };
  }
  if (route.kind === "policy_impact") {
    return { kind: "policy_impact", policyId: route.policyId };
  }
  if (route.kind === "maintenance_impact") {
    return { kind: "maintenance_impact", query: route.query };
  }
  return null;
}

export function ImpactReportView() {
  const [search, setSearch] = useState(readSearch);

  const syncFromUrl = useCallback(() => {
    setSearch(readSearch());
  }, []);

  useEffect(() => {
    window.addEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
    return () => window.removeEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
  }, [syncFromUrl]);

  const route = useMemo(() => readImpactReportRouteFromSearch(search), [search]);
  const enabled = route.kind === "service_impact" || route.kind === "policy_impact" || route.kind === "maintenance_impact";
  const q = useImpactReportQuery(route, enabled);
  const reload = q.reload;

  const downloadTarget = useMemo(() => (enabled ? routeToDownloadTarget(route) : null), [enabled, route]);

  if (route.kind === "setup") {
    return (
      <section className="impact-report-route impact-report-route--setup">
        <h2>Impact Report</h2>
        <p className="body-copy">
          Open an <strong>impact_report_v1</strong> from <strong>Service Explorer</strong> (detail),{" "}
          <strong>Policy explainability</strong>, or <strong>Maintenance Preview</strong>, or use the quick form
          below. This view packages existing read assemblies for communication—not evidence export or briefing bundles.
        </p>
        <ImpactReportSetupForm />
      </section>
    );
  }

  if (route.kind === "invalid") {
    return (
      <section className="impact-report-route impact-report-route--error">
        <h2>Impact Report</h2>
        <ErrorState error={new ApiClientError(route.reason, 422, "shell_validation")} onRetry={syncFromUrl} />
      </section>
    );
  }

  if (q.isLoading && !q.data) {
    return (
      <section className="impact-report-route impact-report-route--loading">
        <h2>Impact Report</h2>
        <LoadingState label="Loading impact_report_v1 from app-api." />
      </section>
    );
  }

  if (q.error) {
    return (
      <section className="impact-report-route impact-report-route--error">
        <h2>Impact Report</h2>
        <ErrorState error={q.error} onRetry={reload} />
      </section>
    );
  }

  if (!q.data || !downloadTarget) {
    return null;
  }

  return (
    <section className="impact-report-route">
      <ImpactReportProduct data={q.data} downloadTarget={downloadTarget} onReload={reload} />
    </section>
  );
}

function ImpactReportSetupForm() {
  const [serviceId, setServiceId] = useState("");
  const [policyId, setPolicyId] = useState("");

  return (
    <div className="impact-report-setup">
      <h3>Quick open</h3>
      <div className="impact-report-setup__row">
        <label htmlFor="ir-setup-service">service_id</label>
        <input
          id="ir-setup-service"
          className="impact-report-setup__input"
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          placeholder="e.g. color:100"
          autoComplete="off"
        />
        <button
          type="button"
          className="inline-action"
          disabled={!serviceId.trim()}
          onClick={() => navigateToImpactReportForService(serviceId.trim())}
        >
          Open service impact report
        </button>
      </div>
      <div className="impact-report-setup__row">
        <label htmlFor="ir-setup-policy">policy_id</label>
        <input
          id="ir-setup-policy"
          className="impact-report-setup__input"
          value={policyId}
          onChange={(e) => setPolicyId(e.target.value)}
          placeholder="from Policies inventory"
          autoComplete="off"
        />
        <button
          type="button"
          className="inline-action"
          disabled={!policyId.trim()}
          onClick={() => navigateToImpactReportForPolicy(policyId.trim())}
        >
          Open policy impact report
        </button>
      </div>
      <p className="table-note">
        Maintenance impact reports reuse the same URL parameters as Maintenance Preview—open Maintenance Preview first,
        then use <strong>Impact Report</strong> from that workspace, or set{" "}
        <code>view=impact-report&amp;impact_report_context=maintenance_impact</code> with maintenance selectors.
      </p>
    </div>
  );
}
