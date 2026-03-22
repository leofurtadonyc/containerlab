import { useMemo, useState } from "react";

import type { EvidenceConfidenceSummary } from "../../api/contracts";
import { ReadSideQueryEchoCallout } from "../../components/read-side-query-echo";
import { ReadSideQueryPanel } from "../../components/read-side-query-panel";
import { IdentifierChip } from "../../components/identifier-chip";
import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import {
  buildRowPostureStatusDisplay,
  countBy,
  formatDateTime,
  formatLabel,
} from "../../lib/presentation";
import {
  describeBlockedReason,
  describeConfidencePosture,
  describeEvidenceKind,
  describeEvidenceSource,
  describeFreshnessPosture,
  normalizeEvidenceConfidence,
} from "../../lib/evidence-confidence";
import { recentSnapshotsEmptyFootnote } from "../../lib/read-side-query-product-copy";
import { useDevicesQuery } from "./api";

function getInventoryEvidenceFallback(
  servingMode: "live_collector" | "persisted_fallback" | "empty_scaffold",
  dataStatus: "placeholder" | "integration_scaffold" | "live" | "degraded",
): EvidenceConfidenceSummary {
  if (servingMode === "live_collector") {
    return {
      source_posture: "live_observed",
      evidence_kind: "direct_observed",
      confidence_posture:
        dataStatus === "live" ? "strong_for_current_slice" : "degraded",
      freshness_posture: "current",
      blocked_reason: "none",
      summary:
        dataStatus === "live"
          ? "Device inventory is backed by the current live observed normalized inventory path."
          : "Device inventory remains live observed, but the current collector evidence is degraded.",
      notes: [
        "This fallback UI summary is used when the backend response does not yet include explicit evidence-confidence details.",
      ],
    };
  }
  if (servingMode === "persisted_fallback") {
    return {
      source_posture: "persisted_fallback",
      evidence_kind: "direct_observed",
      confidence_posture: "degraded",
      freshness_posture: "stale",
      blocked_reason: "collector_unavailable",
      summary:
        "Device inventory is being served from a persisted normalized fallback snapshot because the live collector path is unavailable.",
      notes: [
        "This fallback UI summary is used when the backend response does not yet include explicit evidence-confidence details.",
      ],
    };
  }
  return {
    source_posture: "empty_scaffold",
    evidence_kind: "unknown",
    confidence_posture: "blocked",
    freshness_posture: "unknown",
    blocked_reason: "collector_unavailable_and_no_persisted_snapshot",
    summary:
      "The devices page only has empty-scaffold posture because neither live collector evidence nor a persisted fallback snapshot is available.",
    notes: [
      "This fallback UI summary is used when the backend response does not yet include explicit evidence-confidence details.",
    ],
  };
}

function describeInventoryComparisonReadout(
  status: "unavailable" | "live_vs_latest_persisted_ready",
  servingMode: "live_collector" | "persisted_fallback" | "empty_scaffold",
): { label: string; detail: string } {
  if (status === "live_vs_latest_persisted_ready") {
    return {
      label: "Comparison ready",
      detail:
        "Bounded normalized comparison is available between the current device response and the latest persisted inventory snapshot.",
    };
  }
  if (servingMode === "persisted_fallback") {
    return {
      label: "Fallback serving",
      detail:
        "Comparison is unavailable here because the current response already reflects the persisted fallback snapshot.",
    };
  }
  return {
    label: "Comparison unavailable",
    detail:
      "The backend does not currently have the extra persisted inventory evidence needed for a bounded comparison.",
  };
}

function formatSignedDelta(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }
  return `${value}`;
}

function describeInventoryHistoryWindowStatus(
  status: "unavailable" | "current_only" | "comparison_ready",
): { label: string; detail: string } {
  if (status === "comparison_ready") {
    return {
      label: "Comparison ready",
      detail:
        "At least two persisted normalized inventory snapshots exist in this bounded window; the latest pair can be compared read-side.",
    };
  }
  if (status === "current_only") {
    return {
      label: "Current snapshot only",
      detail:
        "Only one persisted snapshot is listed in this bounded window; comparison to the immediately previous snapshot is not available yet.",
    };
  }
  return {
    label: "History unavailable",
    detail:
      "No persisted inventory history window is available in this posture (fresh baseline, empty history, or backend limitation).",
  };
}

function inventoryComparisonAbsentFootnote(
  status: "unavailable" | "current_only" | "comparison_ready",
): string {
  if (status === "current_only") {
    return (
      "Only one persisted normalized inventory snapshot exists in this bounded window; comparison to the immediately previous snapshot " +
      "is not available yet. That can be an honest fresh baseline or first-persist state—not a product fault."
    );
  }
  if (status === "unavailable") {
    return (
      "Persisted inventory history is not available for this bounded view, or no snapshots exist yet. Absence here is explicit—not hidden " +
      "behind inferred comparison."
    );
  }
  return (
    "Bounded comparison is only available once at least two persisted normalized inventory snapshots exist for this read-side window."
  );
}

export function DevicesView() {
  const { data, error, isLoading, reload } = useDevicesQuery();
  const [searchValue, setSearchValue] = useState("");
  const [collectorFilter, setCollectorFilter] = useState("all");
  const [capabilityFilter, setCapabilityFilter] = useState("all");
  const items = data?.items ?? [];
  const collectorCounts = countBy(items, (device) => device.collector_status);
  const capabilityCounts = countBy(items, (device) => device.capability_summary);
  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return items.filter((device) => {
      const matchesCollector =
        collectorFilter === "all" || device.collector_status === collectorFilter;
      const matchesCapability =
        capabilityFilter === "all" || device.capability_summary === capabilityFilter;
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

      return matchesCollector && matchesCapability && matchesSearch;
    });
  }, [capabilityFilter, collectorFilter, items, searchValue]);

  if (isLoading) {
    return (
      <section>
        <h2>Devices</h2>
        <ReadSideQueryPanel variant="devices-policies" />
        <LoadingState label="Loading normalized device inventory." />
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2>Devices</h2>
        <ReadSideQueryPanel variant="devices-policies" />
        <ErrorState error={error} onRetry={reload} />
      </section>
    );
  }

  if (!data) {
    return (
      <section>
        <h2>Devices</h2>
        <ReadSideQueryPanel variant="devices-policies" />
        <EmptyState
          title="No device inventory"
          description="The backend returned no device records for the current query."
        />
      </section>
    );
  }

  const evidenceConfidence = normalizeEvidenceConfidence(
    data.evidence_confidence,
    getInventoryEvidenceFallback(data.serving_mode, data.data_status),
  );
  const comparisonReadout = describeInventoryComparisonReadout(
    data.comparison_to_latest_persisted.status,
    data.serving_mode,
  );
  const historyComparison = data.history.comparison_to_previous;
  const historyWindowReadout = describeInventoryHistoryWindowStatus(data.history.status);
  const collectorFilterLabel =
    data.serving_mode === "persisted_fallback"
      ? "Last recorded collector state"
      : "Collector state";
  const collectorOkLabel =
    data.serving_mode === "persisted_fallback" ? "Last Recorded Collector OK" : "Collector OK";
  const collectorOkDetail =
    data.serving_mode === "persisted_fallback"
      ? "Devices whose latest persisted snapshot last recorded healthy collector reachability."
      : "Devices with healthy collector reachability.";
  const collectorUnknownLabel =
    data.serving_mode === "persisted_fallback"
      ? "Last Recorded Collector Unknown"
      : "Collector Unknown";
  const collectorUnknownDetail =
    data.serving_mode === "persisted_fallback"
      ? "Inventory exists, but the latest persisted snapshot still carries uncertain collector posture for these devices."
      : "Inventory exists, but observed collector certainty remains partial.";

  return (
    <section>
      <ReadSideQueryPanel variant="devices-policies" />
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
        <span>Serving mode: {formatLabel(data.serving_mode)}</span>
        <span>Evidence confidence: {formatLabel(evidenceConfidence.confidence_posture)}</span>
        <span>Freshness posture: {formatLabel(evidenceConfidence.freshness_posture)}</span>
        <span>Generated: {formatDateTime(data.generated_at)}</span>
        <span>Served persisted at: {formatDateTime(data.served_persisted_at)}</span>
      </div>

      <ReadSideQueryEchoCallout echo={data.read_side_query} slice="devices" />

      <p className="callout">{data.summary}</p>

      <div className="summary-grid">
        <article className="summary-card">
          <p className="summary-label">Devices</p>
          <strong>{data.count}</strong>
          <p>Normalized inventory records currently shown on this page.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Evidence Confidence</p>
          <strong>{formatLabel(evidenceConfidence.confidence_posture)}</strong>
          <p>{describeConfidencePosture(evidenceConfidence.confidence_posture)}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Freshness Posture</p>
          <strong>{formatLabel(evidenceConfidence.freshness_posture)}</strong>
          <p>{describeFreshnessPosture(evidenceConfidence.freshness_posture)}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Serving Mode</p>
          <strong>{formatLabel(data.serving_mode)}</strong>
          <p>{describeEvidenceSource(evidenceConfidence.source_posture)}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Current vs Latest Persisted</p>
          <strong>{comparisonReadout.label}</strong>
          <p>{comparisonReadout.detail}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Persisted History</p>
          <strong>{historyWindowReadout.label}</strong>
          <p>{data.history.summary}</p>
          <p className="table-note">{historyWindowReadout.detail}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">{collectorOkLabel}</p>
          <strong>{collectorCounts.ok ?? 0}</strong>
          <p>{collectorOkDetail}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">{collectorUnknownLabel}</p>
          <strong>{collectorCounts.unknown ?? 0}</strong>
          <p>{collectorUnknownDetail}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Capability Gaps</p>
          <strong>{capabilityCounts.not_implemented_in_platform ?? 0}</strong>
          <p>Devices where support is intentionally not yet implemented.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Partially Supported</p>
          <strong>{capabilityCounts.partially_supported ?? 0}</strong>
          <p>Devices with useful read-only coverage but bounded deeper semantics.</p>
        </article>
      </div>

      {evidenceConfidence.freshness_posture === "stale" ? (
        <div className="callout">
          <strong>Stale inventory posture remains explicit</strong>
          <p>
            The devices page is currently relying on persisted normalized inventory evidence
            from {formatDateTime(data.served_persisted_at)} rather than a current live collector
            read. This keeps the page useful without pretending present live truth is known.
          </p>
        </div>
      ) : null}

      {evidenceConfidence.confidence_posture === "blocked" ? (
        <div className="callout">
          <strong>Blocked inventory reasoning remains explicit</strong>
          <p>
            The backend does not currently have enough live or persisted inventory evidence to
            support a stronger truth claim for this page. The UI keeps that blocked posture
            visible instead of inventing device certainty.
          </p>
        </div>
      ) : null}

      {data.comparison_to_latest_persisted.status === "live_vs_latest_persisted_ready" ? (
        <div className="callout">
          <strong>Bounded current-versus-persisted comparison is available</strong>
          <p>
            The current device response can be compared with the latest persisted normalized
            inventory snapshot from{" "}
            {formatDateTime(data.comparison_to_latest_persisted.comparison_persisted_at)}. This
            remains bounded normalized evidence, not an automated network-diff or operator sign-off.
          </p>
          <p className="table-note">
            Persisted snapshot anchor:{" "}
            <IdentifierChip
              value={data.comparison_to_latest_persisted.comparison_snapshot_id}
              emptyLabel="Not exposed in this posture"
            />
          </p>
        </div>
      ) : null}

      <div className="content-grid">
        <article className="detail-card">
          <h3>Trust Readout</h3>
          <p>{evidenceConfidence.summary}</p>
          <ul className="compact-list">
            <li>
              <span>Backend inventory status</span>
              <StatusPill value={data.data_status} />
            </li>
            <li>
              <span>Evidence confidence</span>
              <StatusPill value={evidenceConfidence.confidence_posture} />
            </li>
            <li>
              <span>Freshness posture</span>
              <StatusPill value={evidenceConfidence.freshness_posture} />
            </li>
            <li>
              <span>Source posture</span>
              <StatusPill value={evidenceConfidence.source_posture} />
            </li>
            <li>
              <span>Blocked reason</span>
              <StatusPill value={evidenceConfidence.blocked_reason} />
            </li>
            <li>
              <span>Current comparison posture</span>
              <strong>{comparisonReadout.label}</strong>
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <h3>Evidence Basis</h3>
          <p>
            The current devices page is a backend-owned normalized inventory view. It may reflect
            live observed records, a persisted fallback snapshot, or a blocked empty scaffold when
            backend-owned evidence is missing.
          </p>
          <ul className="compact-list">
            <li>
              <span>Source posture</span>
              <strong>{formatLabel(evidenceConfidence.source_posture)}</strong>
            </li>
            <li>
              <span>Evidence kind</span>
              <strong>{formatLabel(evidenceConfidence.evidence_kind)}</strong>
            </li>
            <li>
              <span>Confidence posture</span>
              <strong>{formatLabel(evidenceConfidence.confidence_posture)}</strong>
            </li>
            <li>
              <span>Freshness posture</span>
              <strong>{formatLabel(evidenceConfidence.freshness_posture)}</strong>
            </li>
            <li>
              <span>Blocked reason</span>
              <strong>{formatLabel(evidenceConfidence.blocked_reason)}</strong>
            </li>
          </ul>
          <p className="table-note">
            {describeEvidenceSource(evidenceConfidence.source_posture)}{" "}
            {describeEvidenceKind(evidenceConfidence.evidence_kind)}{" "}
            {describeBlockedReason(evidenceConfidence.blocked_reason)}
          </p>
        </article>
        <article className="detail-card">
          <h3>Current vs Latest Persisted</h3>
          <p>{data.comparison_to_latest_persisted.summary}</p>
          <ul className="compact-list">
            <li>
              <span>Comparison status</span>
              <strong>{comparisonReadout.label}</strong>
            </li>
            <li>
              <span>Compared persisted snapshot</span>
              <strong>
                {formatDateTime(data.comparison_to_latest_persisted.comparison_persisted_at)}
              </strong>
            </li>
            <li>
              <span>Persisted snapshot anchor</span>
              <IdentifierChip
                value={data.comparison_to_latest_persisted.comparison_snapshot_id}
                emptyLabel="Not exposed in this posture"
              />
            </li>
            <li>
              <span>Device delta</span>
              <strong>{formatSignedDelta(data.comparison_to_latest_persisted.device_count_delta)}</strong>
            </li>
            <li>
              <span>Current / persisted devices</span>
              <strong>
                {data.comparison_to_latest_persisted.current_device_count} /{" "}
                {data.comparison_to_latest_persisted.persisted_device_count}
              </strong>
            </li>
            <li>
              <span>Added / removed devices</span>
              <strong>
                {data.comparison_to_latest_persisted.added_device_count} /{" "}
                {data.comparison_to_latest_persisted.removed_device_count}
              </strong>
            </li>
            <li>
              <span>Changed devices</span>
              <strong>{data.comparison_to_latest_persisted.changed_device_count}</strong>
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <h3>Persisted History And Comparison</h3>
          <p>{data.history.summary}</p>
          <p className="table-note">
            These rows are read-side, persisted-inventory evidence from the backend. They help you
            see what changed between stored snapshots—they do not assert controller ground truth,
            deployment readiness, or operator approval to modify the network.
          </p>
          {historyComparison ? (
            <>
              <ul className="compact-list">
                <li>
                  <span>Current snapshot anchor</span>
                  <IdentifierChip value={historyComparison.current_snapshot_id} />
                </li>
                <li>
                  <span>Previous snapshot anchor</span>
                  <IdentifierChip value={historyComparison.previous_snapshot_id} />
                </li>
                <li>
                  <span>Current / previous persisted</span>
                  <strong>
                    {formatDateTime(historyComparison.current_persisted_at)} /{" "}
                    {formatDateTime(historyComparison.previous_persisted_at)}
                  </strong>
                </li>
                <li>
                  <span>Current / previous observed</span>
                  <strong>
                    {historyComparison.current_observed_at
                      ? formatDateTime(historyComparison.current_observed_at)
                      : "Not set"}
                    {" / "}
                    {historyComparison.previous_observed_at
                      ? formatDateTime(historyComparison.previous_observed_at)
                      : "Not set"}
                  </strong>
                </li>
                <li>
                  <span>Current / previous sync status</span>
                  <strong>
                    {formatLabel(historyComparison.current_sync_status)} /{" "}
                    {formatLabel(historyComparison.previous_sync_status)}
                  </strong>
                </li>
                <li>
                  <span>Current / previous data status</span>
                  <strong>
                    {formatLabel(historyComparison.current_data_status)} /{" "}
                    {formatLabel(historyComparison.previous_data_status)}
                  </strong>
                </li>
                <li>
                  <span>Device delta</span>
                  <strong>{formatSignedDelta(historyComparison.device_count_delta)}</strong>
                </li>
                <li>
                  <span>Current / previous devices</span>
                  <strong>
                    {historyComparison.current_device_count} / {historyComparison.previous_device_count}
                  </strong>
                </li>
                <li>
                  <span>Added / removed devices</span>
                  <strong>
                    {historyComparison.added_device_count} / {historyComparison.removed_device_count}
                  </strong>
                </li>
                <li>
                  <span>Changed devices</span>
                  <strong>{historyComparison.changed_device_count}</strong>
                </li>
              </ul>
              {historyComparison.change_preview.length > 0 ? (
                <div className="history-change-preview">
                  <p className="summary-label">Bounded change preview</p>
                  <p className="table-note">
                    Short list of normalized device records illustrating this comparison. The backend
                    may cap the list; absence of a device here does not mean no other changes
                    occurred.
                  </p>
                  <div className="table-card table-card--nested">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Device</th>
                          <th>Vendor</th>
                          <th>Platform</th>
                          <th>Role</th>
                          <th>Change</th>
                          <th>Fields</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyComparison.change_preview.map((row, index) => (
                          <tr key={`${row.device_id}-${row.change_kind}-${index}`}>
                            <td>
                              <strong>{row.device_id}</strong>
                            </td>
                            <td>{row.vendor}</td>
                            <td>{row.platform}</td>
                            <td>{row.role ?? "—"}</td>
                            <td>{formatLabel(row.change_kind)}</td>
                            <td>
                              {row.changed_fields.length > 0
                                ? row.changed_fields.join(", ")
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <p className="footnote">{inventoryComparisonAbsentFootnote(data.history.status)}</p>
          )}
        </article>
        <article className="detail-card">
          <h3>Recent Persisted Snapshots</h3>
          <p className="table-note">
            Each row is one persisted normalized inventory snapshot the backend exposes in this
            bounded window—anchors, sync metadata, and counts are trust cues from stored reads, not
            live-controller ground truth.
          </p>
          {data.history.recent_snapshots.length > 0 ? (
            <ul className="notes-list">
              {data.history.recent_snapshots.map((entry) => (
                <li key={entry.snapshot_id}>
                  <div>
                    <strong>{formatDateTime(entry.persisted_at)}</strong>
                    {" · "}
                    {formatLabel(entry.data_status)}
                    {" · "}
                    {entry.device_count} devices
                  </div>
                  <div className="table-note">
                    Snapshot <IdentifierChip value={entry.snapshot_id} />
                    {" · sync run "}
                    <IdentifierChip value={entry.sync_run_id} />
                  </div>
                  <div className="table-note">
                    {formatLabel(entry.sync_source)} · sync {formatLabel(entry.sync_status)}
                    {entry.observed_at ? ` · observed ${formatDateTime(entry.observed_at)}` : ""}
                  </div>
                  <div className="table-note">Source endpoint: {entry.source_endpoint}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="footnote">
              {recentSnapshotsEmptyFootnote(
                data.history.status,
                data.read_side_query,
                "devices",
              )}
            </p>
          )}
        </article>
      </div>

      {evidenceConfidence.notes.length > 0 ? (
        <div className="callout">
          <strong>Evidence-confidence limits</strong>
          <ul className="notes-list">
            {evidenceConfidence.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.comparison_to_latest_persisted.notes.length > 0 ? (
        <div className="callout">
          <strong>Comparison limits</strong>
          <ul className="notes-list">
            {data.comparison_to_latest_persisted.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {historyComparison && historyComparison.notes.length > 0 ? (
        <div className="callout">
          <strong>Persisted history limits</strong>
          <ul className="notes-list">
            {historyComparison.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="callout">
        <strong>Device capability posture stays intentionally coarse</strong>
        <p>
          The capability status on each device row is a bounded support summary for the current
          product slice. It is not a per-device capability inventory, a roadmap guarantee, or a
          substitute for the capabilities matrix.
        </p>
      </div>

      {(capabilityCounts.not_implemented_in_platform ?? 0) > 0 ? (
        <div className="callout">
          <strong>Not implemented does not mean the device is unhealthy</strong>
          <p>
            A device row marked as not implemented means the current platform does not yet deliver
            that capability for the relevant vendor or platform slice. It remains a support-boundary
            cue, not a device fault or roadmap promise.
          </p>
        </div>
      ) : null}

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
          <span>{collectorFilterLabel}</span>
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
        <label className="field-group">
          <span>Capability posture</span>
          <select
            value={capabilityFilter}
            onChange={(event) => setCapabilityFilter(event.target.value)}
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
              {filteredItems.map((device) => {
                const collectorStatusDisplay = buildRowPostureStatusDisplay(
                  device.current_posture,
                  device.collector_status,
                  device.last_recorded_collector_status,
                  "Last recorded collector",
                );

                return (
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
                      <StatusPill value={collectorStatusDisplay.pillValue} />
                      {collectorStatusDisplay.note ? (
                        <div className="table-note">{collectorStatusDisplay.note}</div>
                      ) : null}
                    </td>
                    <td>
                      <StatusPill value={device.capability_summary} />
                      <div className="table-note">{device.capability_detail}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="footnote">
        Current inventory status: {formatLabel(data.data_status)}. This view stays
        product-oriented, keeps uncertainty explicit, does not expose raw collector payloads, and
        leaves capability identity, delivery tier, evidence basis, and roadmap posture on the
        dedicated capabilities page.
      </p>
    </section>
  );
}
