import { navigateToEvidenceView } from "../lib/url-app-state";

/**
 * Bounded read-only links from the same change-intelligence summary context as Overview
 * (`navigateToEvidenceView`); lists on target pages are not filtered by the summary window.
 */
export function ChangeIntelligenceProductSurfaceLinks() {
  return (
    <div className="change-intelligence-product-surface-links">
      <p className="summary-label">Open Devices, Topology, Policies</p>
      <p className="table-note">
        Read-only navigation: target pages show the current bounded slice, not filtered by this aggregation
        window.
      </p>
      <div className="history-evidence-drilldown-actions">
        <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("devices")}>
          Open Devices
        </button>
        <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("topology")}>
          Open Topology
        </button>
        <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("policies")}>
          Open Policies
        </button>
      </div>
    </div>
  );
}
