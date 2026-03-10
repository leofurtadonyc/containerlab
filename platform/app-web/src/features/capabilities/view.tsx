import { useMemo, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import { countBy, formatDateTime, formatLabel } from "../../lib/presentation";
import { useCapabilitiesQuery } from "./api";

function describeSupportState(value: string): string {
  switch (value) {
    case "supported":
      return "The platform can currently claim this bounded read-only capability honestly for the stated scope.";
    case "partially_supported":
      return "The platform has useful coverage here, but some semantics or deeper evidence remain intentionally bounded.";
    case "not_implemented_in_platform":
      return "The platform architecture accounts for this area, but the implementation does not exist yet.";
    case "unsupported":
      return "This capability is currently outside the delivered platform support boundary.";
    default:
      return "The platform does not yet have enough stable evidence to make a stronger support claim here.";
  }
}

export function CapabilitiesView() {
  const { data, error, isLoading, reload } = useCapabilitiesQuery();
  const [supportFilter, setSupportFilter] = useState("all");
  const [domainFilter, setDomainFilter] = useState("all");
  const [implementationFilter, setImplementationFilter] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const [selectedCapabilityKey, setSelectedCapabilityKey] = useState<string | null>(null);
  const items = data?.items ?? [];
  const supportCounts = countBy(items, (capability) => capability.support_status);
  const domainCounts = countBy(items, (capability) => capability.domain);
  const implementationCounts = countBy(items, (capability) => capability.implementation_status);
  const filteredCapabilities = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return items.filter((capability) => {
      const matchesSupport =
        supportFilter === "all" || capability.support_status === supportFilter;
      const matchesDomain = domainFilter === "all" || capability.domain === domainFilter;
      const matchesImplementation =
        implementationFilter === "all" || capability.implementation_status === implementationFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          capability.vendor,
          capability.platform,
          capability.domain,
          capability.feature,
          capability.availability_scope,
          capability.status_detail,
          capability.source_of_determination,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesSupport && matchesDomain && matchesImplementation && matchesSearch;
    });
  }, [domainFilter, implementationFilter, items, searchValue, supportFilter]);
  const selectedCapability =
    filteredCapabilities.find(
      (capability) =>
        `${capability.vendor}-${capability.platform}-${capability.domain}-${capability.feature}` ===
        selectedCapabilityKey,
    ) ?? filteredCapabilities[0] ?? null;

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
          <strong>{data.support_counts.supported ?? supportCounts.supported ?? 0}</strong>
          <p>Capabilities the platform can currently claim as supported.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Partially Supported</p>
          <strong>
            {data.support_counts.partially_supported ?? supportCounts.partially_supported ?? 0}
          </strong>
          <p>Useful read-only slices that still retain bounded gaps or caveats.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Unknown</p>
          <strong>{data.support_counts.unknown ?? supportCounts.unknown ?? 0}</strong>
          <p>Areas where the current support picture remains incomplete.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Not Implemented</p>
          <strong>
            {data.support_counts.not_implemented_in_platform ??
              supportCounts.not_implemented_in_platform ??
              0}
          </strong>
          <p>Explicit roadmap items that remain outside delivered platform support.</p>
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
        <label className="field-group">
          <span>Domain</span>
          <select
            value={domainFilter}
            onChange={(event) => setDomainFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="inventory">Inventory</option>
            <option value="topology">Topology</option>
            <option value="policy">Policy</option>
            <option value="platform_health">Platform health</option>
            <option value="workflow_history">Workflow history</option>
            <option value="audit_history">Audit history</option>
          </select>
        </label>
        <label className="field-group">
          <span>Implementation state</span>
          <select
            value={implementationFilter}
            onChange={(event) => setImplementationFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="implemented">Implemented</option>
            <option value="partial">Partial</option>
            <option value="planned">Planned</option>
            <option value="placeholder">Placeholder</option>
          </select>
        </label>
      </div>

      {data.support_counts.not_implemented_in_platform ? (
        <div className="callout">
          <strong>Nokia-first capability scope remains intentional</strong>
          <p>
            This matrix makes roadmap gaps explicit so operators do not mistake
            architecture direction for delivered multi-vendor feature parity.
          </p>
        </div>
      ) : null}

      <div className="content-grid">
        <article className="detail-card">
          <p className="summary-label">Current Matrix Posture</p>
          <ul className="compact-list">
            <li>
              <span>Domains represented</span>
              <strong>{Object.keys(domainCounts).length}</strong>
            </li>
            <li>
              <span>Implemented slices</span>
              <strong>
                {data.implementation_counts.implemented ??
                  implementationCounts.implemented ??
                  0}
              </strong>
            </li>
            <li>
              <span>Partial slices</span>
              <strong>
                {data.implementation_counts.partial ?? implementationCounts.partial ?? 0}
              </strong>
            </li>
            <li>
              <span>Planned-only slices</span>
              <strong>
                {data.implementation_counts.planned ?? implementationCounts.planned ?? 0}
              </strong>
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <p className="summary-label">Support Semantics</p>
          <p>
            `supported` means the current bounded read-only product slice is delivered
            for the stated scope. `partially supported` means useful coverage exists,
            but the product is still intentionally explicit about remaining gaps.
          </p>
          <p>
            `unknown` means the platform does not yet have enough stable evidence to
            make a stronger claim. `not implemented` marks roadmap intent without
            implying parity.
          </p>
        </article>
      </div>

      {data.items.length === 0 ? (
        <EmptyState
          title="No capability records"
          description="No capability records are currently available from the backend."
        />
      ) : filteredCapabilities.length === 0 ? (
        <EmptyState
          title="No capabilities match the current filter"
          description="Adjust the search text or capability filters to widen the capability view."
        />
      ) : (
        <div className="content-grid">
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Domain</th>
                  <th>Feature</th>
                  <th>Support</th>
                  <th>Implementation</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {filteredCapabilities.map((capability) => {
                  const capabilityKey = `${capability.vendor}-${capability.platform}-${capability.domain}-${capability.feature}`;
                  const isSelected = selectedCapability?.feature === capability.feature &&
                    selectedCapability.domain === capability.domain &&
                    selectedCapability.vendor === capability.vendor &&
                    selectedCapability.platform === capability.platform;

                  return (
                    <tr
                      key={capabilityKey}
                      className={isSelected ? "table-row-selected" : undefined}
                    >
                      <td>
                        <button
                          type="button"
                          className="table-select"
                          onClick={() => setSelectedCapabilityKey(capabilityKey)}
                        >
                          <strong>{capability.vendor}</strong>
                          <span>{capability.platform}</span>
                        </button>
                      </td>
                      <td>{formatLabel(capability.domain)}</td>
                      <td>
                        {formatLabel(capability.feature)}
                        {capability.version_scope ? (
                          <div className="table-note">{capability.version_scope}</div>
                        ) : null}
                      </td>
                      <td>
                        <StatusPill value={capability.support_status} />
                      </td>
                      <td>
                        <StatusPill value={capability.implementation_status} />
                      </td>
                      <td>{capability.source_of_determination}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {selectedCapability ? (
            <article className="detail-card">
              <p className="summary-label">Selected Capability Detail</p>
              <div className="key-value-list">
                <div className="key-value-row">
                  <span>Vendor</span>
                  <strong>
                    {selectedCapability.vendor} / {selectedCapability.platform}
                  </strong>
                </div>
                <div className="key-value-row">
                  <span>Domain</span>
                  <strong>{formatLabel(selectedCapability.domain)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Feature</span>
                  <strong>{formatLabel(selectedCapability.feature)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Support</span>
                  <strong>{formatLabel(selectedCapability.support_status)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Implementation</span>
                  <strong>{formatLabel(selectedCapability.implementation_status)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Availability Scope</span>
                  <strong>{selectedCapability.availability_scope}</strong>
                </div>
                <div className="key-value-row">
                  <span>Status Detail</span>
                  <strong>{selectedCapability.status_detail}</strong>
                </div>
                <div className="key-value-row">
                  <span>Support Meaning</span>
                  <strong>{describeSupportState(selectedCapability.support_status)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Source</span>
                  <strong>{selectedCapability.source_of_determination}</strong>
                </div>
              </div>
              {selectedCapability.caveats.length > 0 ? (
                <>
                  <p className="summary-label">Caveats</p>
                  <ul className="notes-list">
                    {selectedCapability.caveats.map((caveat) => (
                      <li key={caveat}>{caveat}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </article>
          ) : null}
        </div>
      )}
    </section>
  );
}
