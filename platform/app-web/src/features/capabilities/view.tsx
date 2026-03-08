import { useMemo, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import { countBy, formatDateTime } from "../../lib/presentation";
import { useCapabilitiesQuery } from "./api";

export function CapabilitiesView() {
  const { data, error, isLoading, reload } = useCapabilitiesQuery();
  const [supportFilter, setSupportFilter] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const items = data?.items ?? [];
  const supportCounts = countBy(items, (capability) => capability.support_status);
  const filteredCapabilities = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return items.filter((capability) => {
      const matchesSupport =
        supportFilter === "all" || capability.support_status === supportFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          capability.vendor,
          capability.platform,
          capability.feature,
          capability.source_of_determination,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesSupport && matchesSearch;
    });
  }, [items, searchValue, supportFilter]);

  if (isLoading) {
    return (
      <section>
        <h2>Capabilities</h2>
        <LoadingState label="Loading vendor capability visibility." />
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2>Capabilities</h2>
        <ErrorState error={error} onRetry={reload} />
      </section>
    );
  }

  if (!data) {
    return (
      <section>
        <h2>Capabilities</h2>
        <EmptyState
          title="No capability data"
          description="The backend returned no capability inventory response."
        />
      </section>
    );
  }

  return (
    <section>
      <div className="section-header">
        <div>
          <h2>Capabilities</h2>
          <p>
            This view makes support boundaries explicit so the product does not imply
            feature parity that the platform has not implemented yet.
          </p>
        </div>
        <StatusPill value={data.data_status} />
      </div>

      <div className="metadata-row">
        <span>Count: {data.count}</span>
        <span>Generated: {formatDateTime(data.generated_at)}</span>
      </div>

      <p className="callout">{data.summary}</p>

      <div className="summary-grid">
        <article className="summary-card">
          <p className="summary-label">Supported</p>
          <strong>{supportCounts.supported ?? 0}</strong>
          <p>Capabilities the platform can currently claim as supported.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Unknown</p>
          <strong>{supportCounts.unknown ?? 0}</strong>
          <p>Areas where the current support picture remains incomplete.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Not implemented</p>
          <strong>{supportCounts.not_implemented_in_platform ?? 0}</strong>
          <p>Explicitly unsupported product paths that stay honest in Phase 1.</p>
        </article>
      </div>

      <div className="toolbar">
        <label className="field-group">
          <span>Search capabilities</span>
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="vendor, platform, feature, or source"
          />
        </label>
        <label className="field-group">
          <span>Support state</span>
          <select
            value={supportFilter}
            onChange={(event) => setSupportFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="supported">Supported</option>
            <option value="partially_supported">Partially supported</option>
            <option value="unsupported">Unsupported</option>
            <option value="unknown">Unknown</option>
            <option value="not_implemented_in_platform">Not implemented</option>
          </select>
        </label>
      </div>

      {supportCounts.not_implemented_in_platform ? (
        <div className="callout">
          <strong>Unsupported capability state is intentional</strong>
          <p>
            This page makes support gaps explicit so operators do not mistake planned
            architecture for delivered feature parity.
          </p>
        </div>
      ) : null}

      {data.items.length === 0 ? (
        <EmptyState
          title="No capability records"
          description="No capability records are currently available from the backend."
        />
      ) : filteredCapabilities.length === 0 ? (
        <EmptyState
          title="No capabilities match the current filter"
          description="Adjust the search text or support-state filter to widen the capability view."
        />
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Platform</th>
                <th>Feature</th>
                <th>Support</th>
                <th>Implementation</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredCapabilities.map((capability) => (
                <tr
                  key={`${capability.vendor}-${capability.platform}-${capability.feature}`}
                >
                  <td>{capability.vendor}</td>
                  <td>
                    {capability.platform}
                    {capability.version_scope ? (
                      <div className="table-note">{capability.version_scope}</div>
                    ) : null}
                  </td>
                  <td>{capability.feature}</td>
                  <td>
                    <StatusPill value={capability.support_status} />
                  </td>
                  <td>
                    <StatusPill value={capability.implementation_status} />
                    {capability.caveats.length > 0 ? (
                      <div className="table-note">{capability.caveats.join(" ")}</div>
                    ) : null}
                  </td>
                  <td>{capability.source_of_determination}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
