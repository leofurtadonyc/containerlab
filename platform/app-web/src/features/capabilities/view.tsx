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

function describeDeliveryTier(value: string): string {
  switch (value) {
    case "delivered_read_only":
      return "Delivered now as a stable bounded read-only slice.";
    case "bounded_partial_read_only":
      return "Delivered now, but intentionally bounded and explicit about remaining gaps.";
    case "future_roadmap":
      return "Included to make the roadmap explicit, not to imply delivered support.";
    default:
      return "Outside the current delivered Phase 2 product slice.";
  }
}

function describeEvidenceBasis(value: string): string {
  switch (value) {
    case "live_validated":
      return "Backed by the current live normalized read path.";
    case "persisted_validated":
      return "Backed by persisted normalized records or snapshot comparison evidence.";
    case "platform_probe":
      return "Backed by one bounded platform-side probe rather than a full domain read path.";
    case "roadmap_only":
      return "Roadmap-only architecture direction with no delivered implementation yet.";
    default:
      return "Based on bounded design review rather than delivered runtime validation.";
  }
}

export function CapabilitiesView() {
  const { data, error, isLoading, reload } = useCapabilitiesQuery();
  const [vendorFilter, setVendorFilter] = useState("all");
  const [supportFilter, setSupportFilter] = useState("all");
  const [domainFilter, setDomainFilter] = useState("all");
  const [implementationFilter, setImplementationFilter] = useState("all");
  const [deliveryTierFilter, setDeliveryTierFilter] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const [selectedCapabilityKey, setSelectedCapabilityKey] = useState<string | null>(null);
  const items = data?.items ?? [];
  const vendorCounts = countBy(items, (capability) => capability.vendor);
  const supportCounts = countBy(items, (capability) => capability.support_status);
  const domainCounts = countBy(items, (capability) => capability.domain);
  const implementationCounts = countBy(items, (capability) => capability.implementation_status);
  const deliveryTierCounts = countBy(items, (capability) => capability.delivery_tier);
  const evidenceBasisCounts = countBy(items, (capability) => capability.evidence_basis);
  const filteredCapabilities = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return items.filter((capability) => {
      const matchesVendor = vendorFilter === "all" || capability.vendor === vendorFilter;
      const matchesSupport =
        supportFilter === "all" || capability.support_status === supportFilter;
      const matchesDomain = domainFilter === "all" || capability.domain === domainFilter;
      const matchesImplementation =
        implementationFilter === "all" || capability.implementation_status === implementationFilter;
      const matchesDeliveryTier =
        deliveryTierFilter === "all" || capability.delivery_tier === deliveryTierFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          capability.vendor,
          capability.platform,
          capability.domain,
          capability.feature,
          capability.delivery_tier,
          capability.evidence_basis,
          capability.vendor_posture,
          capability.availability_scope,
          capability.status_detail,
          capability.source_of_determination,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return (
        matchesVendor &&
        matchesSupport &&
        matchesDomain &&
        matchesImplementation &&
        matchesDeliveryTier &&
        matchesSearch
      );
    });
  }, [
    deliveryTierFilter,
    domainFilter,
    implementationFilter,
    items,
    searchValue,
    supportFilter,
    vendorFilter,
  ]);
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
          <p className="summary-label">Nokia Focus Entries</p>
          <strong>{data.vendor_counts.nokia ?? vendorCounts.nokia ?? 0}</strong>
          <p>Current delivered or planned records tied to the present Nokia-first platform focus.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Juniper Roadmap Entries</p>
          <strong>{data.vendor_counts.juniper ?? vendorCounts.juniper ?? 0}</strong>
          <p>Future-target records kept explicit without implying delivered parity.</p>
        </article>
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
        <article className="summary-card">
          <p className="summary-label">Delivered Read-Only</p>
          <strong>
            {data.delivery_tier_counts.delivered_read_only ??
              deliveryTierCounts.delivered_read_only ??
              0}
          </strong>
          <p>Stable read-only slices the platform can claim as delivered today.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Bounded Partial Read-Only</p>
          <strong>
            {data.delivery_tier_counts.bounded_partial_read_only ??
              deliveryTierCounts.bounded_partial_read_only ??
              0}
          </strong>
          <p>Delivered slices that stay intentionally explicit about gaps and limits.</p>
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
          <span>Vendor</span>
          <select value={vendorFilter} onChange={(event) => setVendorFilter(event.target.value)}>
            <option value="all">All</option>
            <option value="nokia">Nokia</option>
            <option value="juniper">Juniper</option>
          </select>
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
        <label className="field-group">
          <span>Delivery tier</span>
          <select
            value={deliveryTierFilter}
            onChange={(event) => setDeliveryTierFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="delivered_read_only">Delivered read-only</option>
            <option value="bounded_partial_read_only">Bounded partial read-only</option>
            <option value="future_roadmap">Future roadmap</option>
            <option value="out_of_scope">Out of scope</option>
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
              <span>Vendors represented</span>
              <strong>{Object.keys(vendorCounts).length}</strong>
            </li>
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
            <li>
              <span>Roadmap-only delivery tiers</span>
              <strong>
                {data.delivery_tier_counts.future_roadmap ??
                  deliveryTierCounts.future_roadmap ??
                  0}
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
          <p>
            `delivery tier` answers whether the slice is delivered now, delivered but
            intentionally bounded, or still roadmap-only. `evidence basis` answers
            whether the claim is backed by live reads, persisted evidence, a bounded
            platform probe, or only design/roadmap review.
          </p>
        </article>
        <article className="detail-card">
          <p className="summary-label">Evidence Basis Mix</p>
          <ul className="compact-list">
            <li>
              <span>Live validated</span>
              <strong>
                {data.evidence_basis_counts.live_validated ??
                  evidenceBasisCounts.live_validated ??
                  0}
              </strong>
            </li>
            <li>
              <span>Persisted validated</span>
              <strong>
                {data.evidence_basis_counts.persisted_validated ??
                  evidenceBasisCounts.persisted_validated ??
                  0}
              </strong>
            </li>
            <li>
              <span>Platform probe</span>
              <strong>
                {data.evidence_basis_counts.platform_probe ??
                  evidenceBasisCounts.platform_probe ??
                  0}
              </strong>
            </li>
            <li>
              <span>Design or roadmap only</span>
              <strong>
                {(data.evidence_basis_counts.design_review ?? evidenceBasisCounts.design_review ?? 0) +
                  (data.evidence_basis_counts.roadmap_only ??
                    evidenceBasisCounts.roadmap_only ??
                    0)}
              </strong>
            </li>
          </ul>
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
                  <th>Delivery tier</th>
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
                      <td>{formatLabel(capability.delivery_tier)}</td>
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
                  <span>Delivery tier</span>
                  <strong>{formatLabel(selectedCapability.delivery_tier)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Evidence basis</span>
                  <strong>{formatLabel(selectedCapability.evidence_basis)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Vendor posture</span>
                  <strong>{formatLabel(selectedCapability.vendor_posture)}</strong>
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
                  <span>Delivery Meaning</span>
                  <strong>{describeDeliveryTier(selectedCapability.delivery_tier)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Evidence Meaning</span>
                  <strong>{describeEvidenceBasis(selectedCapability.evidence_basis)}</strong>
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
