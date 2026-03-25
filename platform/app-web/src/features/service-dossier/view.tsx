import { useCallback, useEffect, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { APP_URL_SEARCH_CHANGED } from "../../lib/url-app-state";
import { readServiceDossierServiceIdFromSearch, navigateToServiceDossier } from "../../lib/service-dossier-navigation";
import { navigateToServiceExplorer } from "../../lib/service-explorer-navigation";
import { ServiceDossierProduct } from "./service-dossier-product";
import { useServiceDossierQuery } from "./api";

function readStateFromWindow(): { serviceId: string | null } {
  const search = typeof window !== "undefined" ? window.location.search : "";
  return {
    serviceId: readServiceDossierServiceIdFromSearch(search),
  };
}

export function ServiceDossierView() {
  const [{ serviceId }, setRoute] = useState(readStateFromWindow);

  const syncFromUrl = useCallback(() => {
    setRoute(readStateFromWindow());
  }, []);

  useEffect(() => {
    window.addEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
    return () => window.removeEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
  }, [syncFromUrl]);

  const detailQuery = useServiceDossierQuery(serviceId, !!serviceId);

  if (!serviceId) {
    return (
      <section className="service-dossier-route service-dossier-route--empty" data-testid="service-dossier-empty">
        <h2>Service dossier</h2>
        <EmptyState
          title="No service selected"
          description="Choose a service_id (e.g. from Service Explorer detail) or open Service Explorer to pick a grouping."
        />
        <p className="table-note">
          <button type="button" className="inline-action" onClick={() => navigateToServiceExplorer({})}>
            Open Service Explorer
          </button>
        </p>
      </section>
    );
  }

  if (detailQuery.isLoading && !detailQuery.data) {
    return (
      <section className="service-dossier-route service-dossier-route--loading">
        <h2>Service dossier</h2>
        <LoadingState label="Loading service_dossier_v1 assembly from app-api." />
      </section>
    );
  }

  if (detailQuery.error) {
    return (
      <section className="service-dossier-route service-dossier-route--error" data-testid="service-dossier-error">
        <h2>Service dossier</h2>
        <ErrorState error={detailQuery.error} onRetry={detailQuery.reload} />
        <p className="table-note">
          <button type="button" className="inline-action" onClick={() => navigateToServiceDossier({ serviceId: null })}>
            Clear service_id
          </button>{" "}
          or{" "}
          <button type="button" className="inline-action" onClick={() => navigateToServiceExplorer({ serviceId })}>
            Same id in Service Explorer
          </button>
        </p>
      </section>
    );
  }

  if (!detailQuery.data) {
    return (
      <section className="service-dossier-route service-dossier-route--empty">
        <h2>Service dossier</h2>
        <EmptyState title="No dossier payload" description="The dossier request did not return a body." />
      </section>
    );
  }

  return (
    <section
      className={`service-dossier-route${detailQuery.data.sparse_dossier ? " service-dossier-route--sparse" : ""}`}
      data-testid="service-dossier-loaded"
    >
      <ServiceDossierProduct data={detailQuery.data} onReload={detailQuery.reload} />
    </section>
  );
}
