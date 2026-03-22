import { useMemo, useState } from "react";

import type {
  CapabilityRecord,
  CapabilityRecordIdentityTuple,
} from "../../api/contracts";
import { IdentifierChip } from "../../components/identifier-chip";
import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import { countBy, formatDateTime, formatLabel } from "../../lib/presentation";
import {
  describeAssessmentAreaStatus,
  describeDryRunReadinessStatus,
  describePlanningReadiness,
  normalizeDryRunReadiness,
} from "../../lib/readiness";
import { navigateToReadinessContext } from "../../lib/readiness-navigation";
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

function describeVendorPosture(value: string): string {
  switch (value) {
    case "current_nokia_focus":
      return "Represents the current Nokia-first delivery focus in the Phase 2 platform slice.";
    case "future_juniper_target":
      return "Represents the next planned vendor expansion target only, not delivered Juniper support.";
    default:
      return "Represents future-ready structure intended to stay vendor-safe without implying parity.";
  }
}

function describeImplementationState(value: string): string {
  switch (value) {
    case "implemented":
      return "The platform has delivered this bounded read-only capability today.";
    case "partial":
      return "The platform delivers useful behavior here, but the slice still has explicit limits.";
    case "planned":
      return "The platform structure accounts for this area, but no delivered implementation exists yet.";
    default:
      return "The platform keeps this area visible as a placeholder without claiming delivered behavior.";
  }
}

function getCapabilityIdentityTuple(
  capability: CapabilityRecord,
): CapabilityRecordIdentityTuple {
  return {
    vendor: capability.vendor,
    platform: capability.platform,
    domain: capability.domain,
    feature: capability.feature,
    version_scope: capability.version_scope,
  };
}

function buildCapabilityIdentityKey(capability: CapabilityRecord): string {
  const identity = getCapabilityIdentityTuple(capability);

  return [
    identity.vendor,
    identity.platform,
    identity.domain,
    identity.feature,
    identity.version_scope ?? "all_versions",
  ].join("::");
}

function describeCapabilityIdentityPosture(capability: CapabilityRecord): string {
  return capability.version_scope
    ? "This record is selected by vendor, platform, domain, feature, and version scope. That tuple is a bounded UI identity only, not a standalone backend item ID."
    : "This record is selected by vendor, platform, domain, and feature. The backend does not expose a standalone capability item ID for this bounded Phase 2 surface."
}

function describeRoadmapPosture(capability: CapabilityRecord): string {
  if (
    capability.delivery_tier === "future_roadmap" ||
    capability.evidence_basis === "roadmap_only" ||
    capability.vendor_posture === "future_juniper_target" ||
    capability.support_status === "not_implemented_in_platform"
  ) {
    return "Treat this record as roadmap direction only. It does not indicate delivered support, device-level entitlement, or Juniper parity today.";
  }

  if (capability.vendor_posture === "current_nokia_focus") {
    return "Treat this record as part of the current Nokia-first support boundary for the stated scope only, not as cross-vendor or all-version parity.";
  }

  return "Treat this record as future-ready structure around the current support boundary, while keeping the stated delivery tier and evidence basis as the real limit.";
}

function normalizeCapabilityRecord(value: Partial<CapabilityRecord>): CapabilityRecord {
  return {
    vendor: value.vendor ?? "unknown",
    platform: value.platform ?? "unknown",
    version_scope: value.version_scope ?? null,
    domain: value.domain ?? "inventory",
    feature: value.feature ?? "unknown_feature",
    support_status: value.support_status ?? "unknown",
    implementation_status: value.implementation_status ?? "placeholder",
    delivery_tier: value.delivery_tier ?? "out_of_scope",
    evidence_basis: value.evidence_basis ?? "design_review",
    vendor_posture: value.vendor_posture ?? "current_nokia_focus",
    availability_scope:
      value.availability_scope ?? "No bounded capability scope was provided by the backend.",
    status_detail:
      value.status_detail ?? "No bounded capability detail was provided by the backend.",
    caveats: value.caveats ?? [],
    source_of_determination:
      value.source_of_determination ?? "capability_matrix_review",
    workflow_readiness_status: value.workflow_readiness_status ?? "context_only",
    workflow_readiness_scopes: value.workflow_readiness_scopes ?? [],
    workflow_readiness_detail:
      value.workflow_readiness_detail ??
      "No bounded workflow-readiness interpretation was provided by the backend.",
    related_readiness_blockers: value.related_readiness_blockers ?? [],
  };
}

function describeWorkflowReadinessStatus(value: string): string {
  switch (value) {
    case "supports_planning":
      return "This capability is strong enough to support future planning interpretation, but not workflow implementation.";
    case "partial_foundation":
      return "This capability contributes useful future workflow-readiness context, but important truth or contract gaps still limit it.";
    case "blocked":
      return "This capability area still blocks stronger workflow-readiness reasoning today.";
    case "roadmap_only":
      return "This record keeps a future direction visible, but it contributes nothing to current workflow-readiness.";
    default:
      return "This capability is useful context, but it is not a primary workflow-readiness foundation.";
  }
}

function describeWorkflowReadinessScope(value: string): string {
  switch (value) {
    case "planning_depth":
      return "Helps explain how much future planning context the current platform can support.";
    case "preview_contracts":
      return "Touches the future preview or diff contract area, but does not imply those contracts exist yet.";
    case "validation_contracts":
      return "Touches future validation semantics, but does not imply validation-result models or verdicts exist yet.";
    case "workflow_audit_relationships":
      return "Touches future workflow-to-audit relationships, but not a delivered workflow lifecycle.";
    default:
      return "Touches whether any workflow-phase move could ever be justified, but does not change the current Phase 2 boundary.";
  }
}

export function CapabilitiesView() {
  const { data, error, isLoading, reload } = useCapabilitiesQuery();
  const [vendorFilter, setVendorFilter] = useState("all");
  const [supportFilter, setSupportFilter] = useState("all");
  const [domainFilter, setDomainFilter] = useState("all");
  const [implementationFilter, setImplementationFilter] = useState("all");
  const [deliveryTierFilter, setDeliveryTierFilter] = useState("all");
  const [workflowReadinessFilter, setWorkflowReadinessFilter] = useState("all");
  const [workflowReadinessScopeFilter, setWorkflowReadinessScopeFilter] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const [selectedCapabilityKey, setSelectedCapabilityKey] = useState<string | null>(null);
  const items = (data?.items ?? []).map((capability) => normalizeCapabilityRecord(capability));
  const vendorCounts = countBy(items, (capability) => capability.vendor);
  const supportCounts = countBy(items, (capability) => capability.support_status);
  const domainCounts = countBy(items, (capability) => capability.domain);
  const implementationCounts = countBy(items, (capability) => capability.implementation_status);
  const deliveryTierCounts = countBy(items, (capability) => capability.delivery_tier);
  const evidenceBasisCounts = countBy(items, (capability) => capability.evidence_basis);
  const vendorPostureCounts = countBy(items, (capability) => capability.vendor_posture);
  const workflowReadinessCountsLocal = countBy(
    items,
    (capability) => capability.workflow_readiness_status,
  );
  const workflowReadinessScopeCountsLocal = countBy(
    items.flatMap((capability) => capability.workflow_readiness_scopes),
    (scope) => scope,
  );
  const [evidenceBasisFilter, setEvidenceBasisFilter] = useState("all");
  const [vendorPostureFilter, setVendorPostureFilter] = useState("all");
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
      const matchesEvidenceBasis =
        evidenceBasisFilter === "all" || capability.evidence_basis === evidenceBasisFilter;
      const matchesVendorPosture =
        vendorPostureFilter === "all" || capability.vendor_posture === vendorPostureFilter;
      const matchesWorkflowReadiness =
        workflowReadinessFilter === "all" ||
        capability.workflow_readiness_status === workflowReadinessFilter;
      const matchesWorkflowReadinessScope =
        workflowReadinessScopeFilter === "all" ||
        capability.workflow_readiness_scopes.includes(
          workflowReadinessScopeFilter as CapabilityRecord["workflow_readiness_scopes"][number],
        );
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
          capability.workflow_readiness_status,
          capability.workflow_readiness_detail,
          ...capability.workflow_readiness_scopes,
          ...capability.related_readiness_blockers,
          capability.availability_scope,
          capability.status_detail,
          capability.source_of_determination,
          ...capability.caveats,
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
        matchesEvidenceBasis &&
        matchesVendorPosture &&
        matchesWorkflowReadiness &&
        matchesWorkflowReadinessScope &&
        matchesSearch
      );
    });
  }, [
    deliveryTierFilter,
    domainFilter,
    evidenceBasisFilter,
    implementationFilter,
    items,
    searchValue,
    supportFilter,
    vendorFilter,
    vendorPostureFilter,
    workflowReadinessFilter,
    workflowReadinessScopeFilter,
  ]);
  const selectedCapability =
    filteredCapabilities.find(
      (capability) => buildCapabilityIdentityKey(capability) === selectedCapabilityKey,
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

  const dryRunReadiness = normalizeDryRunReadiness(data.dry_run_readiness);
  const domainSummaryCounts = data.domain_counts ?? domainCounts;
  const vendorPostureSummaryCounts = data.vendor_posture_counts ?? vendorPostureCounts;
  const workflowReadinessCounts =
    data.workflow_readiness_counts ?? workflowReadinessCountsLocal;
  const workflowReadinessScopeCounts =
    data.workflow_readiness_scope_counts ?? workflowReadinessScopeCountsLocal;
  const blockersByName = new Map(
    dryRunReadiness.blockers.map((blocker) => [blocker.blocker, blocker] as const),
  );

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

      <div className="history-evidence-drilldown">
        <p className="summary-label">Readiness interpretation</p>
        <p className="table-note">
          Open the Readiness page for the same bounded snapshot: blocker posture, prerequisites,
          and assessment coverage. Read-only navigation only — no workflow or execution context.
        </p>
        <div className="history-evidence-drilldown-actions">
          <button
            type="button"
            className="nav-drilldown-button"
            onClick={() => navigateToReadinessContext({})}
          >
            Open Readiness
          </button>
        </div>
      </div>

      <div className="summary-grid">
        <article className="summary-card">
          <p className="summary-label">Dry-Run Readiness</p>
          <strong>{formatLabel(dryRunReadiness.status)}</strong>
          <p>{describeDryRunReadinessStatus(dryRunReadiness.status)}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Planning Readiness</p>
          <strong>{formatLabel(dryRunReadiness.planning_readiness)}</strong>
          <p>{describePlanningReadiness(dryRunReadiness.planning_readiness)}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Current Nokia Focus</p>
          <strong>{vendorPostureSummaryCounts.current_nokia_focus ?? 0}</strong>
          <p>Records aligned to the current Nokia-first delivered platform focus.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Future Juniper Target</p>
          <strong>{vendorPostureSummaryCounts.future_juniper_target ?? 0}</strong>
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
        <article className="summary-card">
          <p className="summary-label">Live Validated</p>
          <strong>
            {data.evidence_basis_counts.live_validated ??
              evidenceBasisCounts.live_validated ??
              0}
          </strong>
          <p>Claims backed by the current live normalized read paths.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Roadmap Only</p>
          <strong>
            {data.evidence_basis_counts.roadmap_only ?? evidenceBasisCounts.roadmap_only ?? 0}
          </strong>
          <p>Future-facing structure that remains explicit without implying implementation.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Supports Planning</p>
          <strong>{workflowReadinessCounts.supports_planning ?? 0}</strong>
          <p>Capability entries strong enough to inform future planning interpretation only.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Partial Foundation</p>
          <strong>{workflowReadinessCounts.partial_foundation ?? 0}</strong>
          <p>Useful future-readiness foundations that still retain important gaps or blockers.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Blocked</p>
          <strong>{workflowReadinessCounts.blocked ?? 0}</strong>
          <p>Capability areas that still block stronger workflow-readiness reasoning today.</p>
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
        <label className="field-group">
          <span>Evidence basis</span>
          <select
            value={evidenceBasisFilter}
            onChange={(event) => setEvidenceBasisFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="live_validated">Live validated</option>
            <option value="persisted_validated">Persisted validated</option>
            <option value="platform_probe">Platform probe</option>
            <option value="design_review">Design review</option>
            <option value="roadmap_only">Roadmap only</option>
          </select>
        </label>
        <label className="field-group">
          <span>Vendor posture</span>
          <select
            value={vendorPostureFilter}
            onChange={(event) => setVendorPostureFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="current_nokia_focus">Current Nokia focus</option>
            <option value="future_juniper_target">Future Juniper target</option>
            <option value="future_multi_vendor_candidate">Future multi-vendor candidate</option>
          </select>
        </label>
        <label className="field-group">
          <span>Workflow readiness</span>
          <select
            value={workflowReadinessFilter}
            onChange={(event) => setWorkflowReadinessFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="supports_planning">Supports planning</option>
            <option value="partial_foundation">Partial foundation</option>
            <option value="blocked">Blocked</option>
            <option value="roadmap_only">Roadmap only</option>
            <option value="context_only">Context only</option>
          </select>
        </label>
        <label className="field-group">
          <span>Workflow scope</span>
          <select
            value={workflowReadinessScopeFilter}
            onChange={(event) => setWorkflowReadinessScopeFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="planning_depth">Planning depth</option>
            <option value="preview_contracts">Preview contracts</option>
            <option value="validation_contracts">Validation contracts</option>
            <option value="workflow_audit_relationships">Workflow audit relationships</option>
            <option value="phase_transition">Phase transition</option>
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

      {(vendorPostureSummaryCounts.future_juniper_target ?? 0) > 0 ? (
        <div className="callout">
          <strong>Future vendor structure remains explicit without implying parity</strong>
          <p>
            Juniper-target records exist to keep the capability model structurally ready for the
            next expansion step, but they remain clearly roadmap-only and should not be read as
            delivered Juniper support.
          </p>
        </div>
      ) : null}

      <div className="callout">
        <strong>Dry-run readiness remains descriptive only</strong>
        <p>
          {dryRunReadiness.summary} This section is preparation metadata, not a
          preview engine, action API, or validation workflow.
        </p>
      </div>

      <div className="callout">
        <strong>Workflow-readiness interpretation remains explanatory only</strong>
        <p>
          Capability records can now show whether they support future planning, remain partial,
          or still block stronger workflow-readiness reasoning. These cues explain gaps and
          dependencies only. They do not mean any workflow is eligible, previewable, or safe to run.
        </p>
      </div>

      <div className="callout">
        <strong>Capability identity stays tuple-scoped in Phase 2</strong>
        <p>
          Capability rows are selected by vendor, platform, domain, feature, and version scope
          when the backend provides one. This keeps version-scoped records distinct without
          implying a durable backend item ID, workflow handle, or cross-response citation key.
        </p>
      </div>

      <div className="callout">
        <strong>Phase recommendation remains unchanged</strong>
        <p>
          {formatLabel(dryRunReadiness.phase_recommendation)} remains the only current
          recommendation. Planning readiness does not justify a phase jump, dry-run API work, or
          any workflow implementation yet.
        </p>
      </div>

      <div className="content-grid">
        <article className="detail-card">
          <p className="summary-label">Assessment Areas</p>
          {dryRunReadiness.assessment_areas.length > 0 ? (
            <ul className="notes-list">
              {dryRunReadiness.assessment_areas.map((assessment) => (
                <li key={assessment.area}>
                  <strong>
                    {formatLabel(assessment.area)}: {formatLabel(assessment.status)}
                  </strong>
                  {" - "}
                  {assessment.summary}
                </li>
              ))}
            </ul>
          ) : (
            <p>No stricter assessment areas are available from the current backend response yet.</p>
          )}
        </article>
        <article className="detail-card">
          <p className="summary-label">Strongest Blockers</p>
          {dryRunReadiness.strongest_blockers.length > 0 ? (
            <ul className="notes-list">
              {dryRunReadiness.strongest_blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          ) : (
            <p>No blockers were provided in the current readiness summary.</p>
          )}
        </article>
        <article className="detail-card">
          <p className="summary-label">Bounded Next Steps</p>
          {dryRunReadiness.bounded_next_steps.length > 0 ? (
            <ul className="notes-list">
              {dryRunReadiness.bounded_next_steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          ) : (
            <p>No bounded next steps are available from the current readiness summary.</p>
          )}
        </article>
        <article className="detail-card">
          <p className="summary-label">Dry-Run Readiness Prerequisites</p>
          <p>{dryRunReadiness.readiness_scope}</p>
          {dryRunReadiness.prerequisites.length > 0 ? (
            <ul className="compact-list">
              {dryRunReadiness.prerequisites.map((prerequisite) => (
                <li key={prerequisite.prerequisite}>
                  <span>
                    {formatLabel(prerequisite.prerequisite)}:{" "}
                    {formatLabel(prerequisite.status)}
                  </span>
                  <strong>{prerequisite.current_evidence}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>No bounded readiness prerequisites are available from the current response yet.</p>
          )}
          {dryRunReadiness.notes.length > 0 ? (
            <>
              <p className="summary-label">Readiness Notes</p>
              <ul className="notes-list">
                {dryRunReadiness.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </>
          ) : null}
        </article>
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
            <li>
              <span>Future Juniper target entries</span>
              <strong>{vendorPostureSummaryCounts.future_juniper_target ?? 0}</strong>
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <p className="summary-label">Workflow-Readiness Posture</p>
          <ul className="compact-list">
            <li>
              <span>Supports planning</span>
              <strong>{workflowReadinessCounts.supports_planning ?? 0}</strong>
            </li>
            <li>
              <span>Partial foundation</span>
              <strong>{workflowReadinessCounts.partial_foundation ?? 0}</strong>
            </li>
            <li>
              <span>Blocked</span>
              <strong>{workflowReadinessCounts.blocked ?? 0}</strong>
            </li>
            <li>
              <span>Roadmap only</span>
              <strong>{workflowReadinessCounts.roadmap_only ?? 0}</strong>
            </li>
            <li>
              <span>Context only</span>
              <strong>{workflowReadinessCounts.context_only ?? 0}</strong>
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <p className="summary-label">Workflow Scope Coverage</p>
          <ul className="compact-list">
            <li>
              <span>Planning depth</span>
              <strong>{workflowReadinessScopeCounts.planning_depth ?? 0}</strong>
            </li>
            <li>
              <span>Preview contracts</span>
              <strong>{workflowReadinessScopeCounts.preview_contracts ?? 0}</strong>
            </li>
            <li>
              <span>Validation contracts</span>
              <strong>{workflowReadinessScopeCounts.validation_contracts ?? 0}</strong>
            </li>
            <li>
              <span>Workflow audit relationships</span>
              <strong>{workflowReadinessScopeCounts.workflow_audit_relationships ?? 0}</strong>
            </li>
            <li>
              <span>Phase transition</span>
              <strong>{workflowReadinessScopeCounts.phase_transition ?? 0}</strong>
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
        <article className="detail-card">
          <p className="summary-label">Vendor Posture Mix</p>
          <ul className="compact-list">
            <li>
              <span>Current Nokia focus</span>
              <strong>{vendorPostureSummaryCounts.current_nokia_focus ?? 0}</strong>
            </li>
            <li>
              <span>Future Juniper target</span>
              <strong>{vendorPostureSummaryCounts.future_juniper_target ?? 0}</strong>
            </li>
            <li>
              <span>Future multi-vendor candidate</span>
              <strong>{vendorPostureSummaryCounts.future_multi_vendor_candidate ?? 0}</strong>
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <p className="summary-label">Domain Coverage</p>
          <ul className="compact-list">
            {Object.entries(domainSummaryCounts)
              .sort(([left], [right]) => left.localeCompare(right))
              .map(([domain, count]) => (
                <li key={domain}>
                  <span>{formatLabel(domain)}</span>
                  <strong>{count}</strong>
                </li>
              ))}
          </ul>
        </article>
        <article className="detail-card">
          <p className="summary-label">Assessment Status Meaning</p>
          <ul className="notes-list">
            <li>
              <strong>Strong for planning:</strong> {describeAssessmentAreaStatus("strong_for_planning")}
            </li>
            <li>
              <strong>Mixed:</strong> {describeAssessmentAreaStatus("mixed")}
            </li>
            <li>
              <strong>Blocked:</strong> {describeAssessmentAreaStatus("blocked")}
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
                  <th>Workflow readiness</th>
                  <th>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {filteredCapabilities.map((capability) => {
                  const capabilityKey = buildCapabilityIdentityKey(capability);
                  const isSelected = selectedCapability?.feature === capability.feature &&
                    selectedCapability.domain === capability.domain &&
                    selectedCapability.vendor === capability.vendor &&
                    selectedCapability.platform === capability.platform &&
                    selectedCapability.version_scope === capability.version_scope;

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
                        <div className="table-note">{formatLabel(capability.vendor_posture)}</div>
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
                      <td>
                        {formatLabel(capability.workflow_readiness_status)}
                        {capability.workflow_readiness_scopes.length > 0 ? (
                          <div className="table-note">
                            {capability.workflow_readiness_scopes
                              .map((scope) => formatLabel(scope))
                              .join(", ")}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        {formatLabel(capability.evidence_basis)}
                        <div className="table-note">{capability.source_of_determination}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {selectedCapability ? (
            <article className="detail-card">
              <p className="summary-label">Selected Capability Detail</p>
              <p>
                This detail view keeps support, evidence, delivery, and roadmap posture tied to
                the exact selected capability tuple without inventing a stronger backend identity
                contract than the current response provides.
              </p>
              <div className="key-value-list">
                <div className="key-value-row">
                  <span>Capability identity</span>
                  <IdentifierChip value={buildCapabilityIdentityKey(selectedCapability)} />
                </div>
                <div className="key-value-row">
                  <span>Identity posture</span>
                  <strong>{describeCapabilityIdentityPosture(selectedCapability)}</strong>
                </div>
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
                  <span>Version scope</span>
                  <strong>{selectedCapability.version_scope ?? "Not scoped further"}</strong>
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
                  <span>Workflow readiness</span>
                  <strong>{formatLabel(selectedCapability.workflow_readiness_status)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Workflow-readiness detail</span>
                  <strong>{selectedCapability.workflow_readiness_detail}</strong>
                </div>
                <div className="key-value-row">
                  <span>Workflow scopes</span>
                  <strong>
                    {selectedCapability.workflow_readiness_scopes.length > 0
                      ? selectedCapability.workflow_readiness_scopes
                          .map((scope) => formatLabel(scope))
                          .join(", ")
                      : "Not a primary workflow-readiness scope"}
                  </strong>
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
                  <span>Vendor Posture Meaning</span>
                  <strong>{describeVendorPosture(selectedCapability.vendor_posture)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Roadmap posture</span>
                  <strong>{describeRoadmapPosture(selectedCapability)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Implementation Meaning</span>
                  <strong>{describeImplementationState(selectedCapability.implementation_status)}</strong>
                </div>
                <div className="key-value-row">
                  <span>Workflow Meaning</span>
                  <strong>
                    {describeWorkflowReadinessStatus(selectedCapability.workflow_readiness_status)}
                  </strong>
                </div>
                <div className="key-value-row">
                  <span>Source</span>
                  <strong>{selectedCapability.source_of_determination}</strong>
                </div>
              </div>
              {selectedCapability.workflow_readiness_scopes.length > 0 ? (
                <>
                  <p className="summary-label">Workflow Scope Meaning</p>
                  <ul className="notes-list">
                    {selectedCapability.workflow_readiness_scopes.map((scope) => (
                      <li key={scope}>
                        <strong>{formatLabel(scope)}:</strong> {describeWorkflowReadinessScope(scope)}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              <p className="summary-label">Operator Interpretation</p>
              <ul className="notes-list">
                <li>
                  <strong>Identity:</strong> {describeCapabilityIdentityPosture(selectedCapability)}
                </li>
                <li>
                  <strong>Delivery:</strong> {describeDeliveryTier(selectedCapability.delivery_tier)}
                </li>
                <li>
                  <strong>Evidence:</strong> {describeEvidenceBasis(selectedCapability.evidence_basis)}
                </li>
                <li>
                  <strong>Roadmap:</strong> {describeRoadmapPosture(selectedCapability)}
                </li>
              </ul>
              <div className="history-evidence-drilldown">
                <p className="summary-label">Readiness navigation</p>
                <p className="table-note">
                  Jump to Readiness with optional scroll to a related blocker. Same evaluation
                  sample as this table; navigation does not authorize workflow or change actions.
                </p>
                <div className="history-evidence-drilldown-actions">
                  <button
                    type="button"
                    className="nav-drilldown-button"
                    onClick={() =>
                      navigateToReadinessContext({
                        capabilityFeature: selectedCapability.feature,
                      })
                    }
                  >
                    Open Readiness (this capability)
                  </button>
                </div>
              </div>
              {selectedCapability.related_readiness_blockers.length > 0 ? (
                <>
                  <p className="summary-label">Related Readiness Blockers</p>
                  <ul className="notes-list">
                    {selectedCapability.related_readiness_blockers.map((blockerName) => {
                      const blocker = blockersByName.get(blockerName);

                      return (
                        <li key={blockerName}>
                          <div>
                            <strong>{formatLabel(blockerName)}:</strong>{" "}
                            {blocker?.summary ??
                              "No blocker summary is available from the current readiness response."}
                          </div>
                          <div className="history-evidence-drilldown-actions">
                            <button
                              type="button"
                              className="nav-drilldown-button"
                              onClick={() =>
                                navigateToReadinessContext({
                                  blocker: blockerName,
                                  capabilityFeature: selectedCapability.feature,
                                })
                              }
                            >
                              View on Readiness
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : null}
              {dryRunReadiness.prerequisites.some(
                (prerequisite) => prerequisite.blocking_gaps.length > 0,
              ) ? (
                <>
                  <p className="summary-label">Readiness Gaps</p>
                  <ul className="notes-list">
                    {dryRunReadiness.prerequisites.flatMap((prerequisite) =>
                      prerequisite.blocking_gaps.map((gap) => (
                        <li key={`${prerequisite.prerequisite}-${gap}`}>
                          {formatLabel(prerequisite.prerequisite)}: {gap}
                        </li>
                      )),
                    )}
                  </ul>
                </>
              ) : null}
              {dryRunReadiness.assessment_areas.some((assessment) => assessment.strongest_gaps.length > 0) ? (
                <>
                  <p className="summary-label">Assessment Gaps</p>
                  <ul className="notes-list">
                    {dryRunReadiness.assessment_areas.flatMap((assessment) =>
                      assessment.strongest_gaps.map((gap) => (
                        <li key={`${assessment.area}-${gap}`}>
                          {formatLabel(assessment.area)}: {gap}
                        </li>
                      )),
                    )}
                  </ul>
                </>
              ) : null}
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
