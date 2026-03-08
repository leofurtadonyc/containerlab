import { useMemo, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import { countBy, formatDateTime, formatLabel } from "../../lib/presentation";
import { useDevicesQuery } from "./api";

export function DevicesView() {
  const { data, error, isLoading, reload } = useDevicesQuery();
  const [searchValue, setSearchValue] = useState("");
  const [collectorFilter, setCollectorFilter] = useState("all");
  const items = data?.items ?? [];
  const collectorCounts = countBy(items, (device) => device.collector_status);
  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return items.filter((device) => {
      const matchesCollector =
        collectorFilter === "all" || device.collector_status === collectorFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          device.device_id,
          device.vendor,
          device.platform,
          device.role ?? "",
          device.management_address,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesCollector && matchesSearch;
    });
  }, [collectorFilter, items, searchValue]);

  if (isLoading) {
    return (
      <section>
        <h2>Devices</h2>
        <LoadingState label="Loading normalized device inventory." />
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2>Devices</h2>
        <ErrorState error={error} onRetry={reload} />
      </section>
    );
  }

  if (!data) {
    return (
      <section>
        <h2>Devices</h2>
        <EmptyState
          title="No device inventory"
          description="The backend returned no device records for the current query."
        />
      </section>
    );
  }

  return (
    <section>
      <div className="section-header">
        <div>
          <h2>Devices</h2>
          <p>
            Device inventory is now read from the backend API contract rather than
            direct collector or vendor payloads.
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
          <p className="summary-label">Collector OK</p>
          <strong>{collectorCounts.ok ?? 0}</strong>
          <p>Devices with healthy collector reachability.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Collector Unknown</p>
          <strong>{collectorCounts.unknown ?? 0}</strong>
          <p>Inventory exists, but observed collector certainty remains partial.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Capability Gaps</p>
          <strong>
            {
              data.items.filter(
                (device) => device.capability_summary === "not_implemented_in_platform",
              ).length
            }
          </strong>
          <p>Devices where support is intentionally not yet implemented.</p>
        </article>
      </div>

      <div className="toolbar">
        <label className="field-group">
          <span>Search devices</span>
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="device, vendor, platform, role, or management IP"
          />
        </label>
        <label className="field-group">
          <span>Collector state</span>
          <select
            value={collectorFilter}
            onChange={(event) => setCollectorFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="ok">OK</option>
            <option value="degraded">Degraded</option>
            <option value="unreachable">Unreachable</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
      </div>

      {data.items.length === 0 ? (
        <EmptyState
          title="No devices discovered"
          description="Inventory is connected, but no device records are currently available."
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="No devices match the current filter"
          description="Adjust the search text or collector-state filter to widen the device view."
        />
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Device</th>
                <th>Vendor</th>
                <th>Platform</th>
                <th>Role</th>
                <th>Management</th>
                <th>Collector</th>
                <th>Capability posture</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((device) => (
                <tr key={device.device_id}>
                  <td>
                    <strong>{device.device_id}</strong>
                    {device.software_version ? (
                      <div className="table-note">{device.software_version}</div>
                    ) : null}
                  </td>
                  <td>{device.vendor}</td>
                  <td>{device.platform}</td>
                  <td>{device.role ?? "Not set"}</td>
                  <td>{device.management_address}</td>
                  <td>
                    <StatusPill value={device.collector_status} />
                  </td>
                  <td>
                    <StatusPill value={device.capability_summary} />
                    {device.capability_summary === "not_implemented_in_platform" ? (
                      <div className="table-note">
                        Support remains intentionally explicit in the current read-only phase.
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="footnote">
        Current inventory status: {formatLabel(data.data_status)}. This view stays
        product-oriented and does not expose raw collector payloads.
      </p>
    </section>
  );
}
