import { useCallback, useEffect, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { APP_URL_SEARCH_CHANGED } from "../../lib/url-app-state";
import {
  readServiceExplorerLimitFromSearch,
  readServiceExplorerServiceIdFromSearch,
  navigateToServiceExplorer,
} from "../../lib/service-explorer-navigation";
import { ServiceExplorerDetailProduct, ServiceExplorerListProduct } from "./service-explorer-product";
import { useServiceDetailQuery, useServicesListQuery } from "./api";

function readStateFromWindow(): { serviceId: string | null; limit: number | null } {
  const search = typeof window !== "undefined" ? window.location.search : "";
  return {
    serviceId: readServiceExplorerServiceIdFromSearch(search),
    limit: readServiceExplorerLimitFromSearch(search),
  };
}

export function ServiceExplorerView() {
  const [{ serviceId, limit }, setRoute] = useState(readStateFromWindow);

  const syncFromUrl = useCallback(() => {
    setRoute(readStateFromWindow());
  }, []);

  useEffect(() => {
    window.addEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
    return () => window.removeEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
  }, [syncFromUrl]);

  const listQuery = useServicesListQuery(limit, !serviceId);
  const detailQuery = useServiceDetailQuery(serviceId, !!serviceId);

  const active = serviceId ? detailQuery : listQuery;
  const isLoading = active.isLoading && !active.data;
  const error = active.error;
  const reload = active.reload;

  if (isLoading) {
    return (
      <section className="service-explorer-route service-explorer-route--loading">
        <h2>Service Explorer</h2>
        <LoadingState label="Loading service_explorer_v1 assembly from app-api." />
      </section>
    );
  }

  if (error) {
    return (
      <section className="service-explorer-route service-explorer-route--error">
        <h2>Service Explorer</h2>
        <ErrorState error={error} onRetry={reload} />
        <p className="table-note">
          <button type="button" className="inline-action" onClick={() => navigateToServiceExplorer({ serviceId: null })}>
            Back to list
          </button>
        </p>
      </section>
    );
  }

  if (serviceId) {
    if (!detailQuery.data) {
      return (
        <section className="service-explorer-route service-explorer-route--empty">
          <h2>Service Explorer</h2>
          <EmptyState title="No detail payload" description="The detail request did not return a body." />
        </section>
      );
    }
    return (
      <section className="service-explorer-route">
        <ServiceExplorerDetailProduct data={detailQuery.data} onReload={reload} />
      </section>
    );
  }

  if (!listQuery.data) {
    return (
      <section className="service-explorer-route service-explorer-route--empty">
        <h2>Service Explorer</h2>
        <EmptyState title="No list payload" description="The list request did not return a body." />
      </section>
    );
  }

  const isSparseList =
    listQuery.data.items.length === 0 || listQuery.data.policy_inventory.empty_reason !== "none";

  return (
    <section className={`service-explorer-route${isSparseList ? " service-explorer-route--sparse" : ""}`}>
      <div className="service-explorer-limit-bar">
        <label className="service-explorer-limit-bar__label" htmlFor="service-explorer-limit">
          Optional list limit (1–500, echo in read_side_query)
        </label>
        <div className="service-explorer-limit-bar__row">
          <input
            id="service-explorer-limit"
            className="service-explorer-limit-input"
            type="number"
            min={1}
            max={500}
            placeholder="omit for full list"
            value={limit ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") {
                navigateToServiceExplorer({ serviceId: null, limit: null });
                return;
              }
              const n = Number.parseInt(v, 10);
              if (!Number.isNaN(n)) {
                navigateToServiceExplorer({ serviceId: null, limit: n });
              }
            }}
          />
          <button
            type="button"
            className="inline-action"
            onClick={() => navigateToServiceExplorer({ serviceId: null, limit: null })}
          >
            Clear limit
          </button>
        </div>
      </div>
      <ServiceExplorerListProduct data={listQuery.data} limitApplied={limit} onReload={reload} />
    </section>
  );
}
