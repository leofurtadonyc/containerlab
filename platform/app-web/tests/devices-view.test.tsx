import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "../src/api/client";
import { DevicesView } from "../src/features/devices/view";

const { useDevicesQuery, usePoliciesQuery, useTopologyRelatedPoliciesQuery } = vi.hoisted(() => ({
  useDevicesQuery: vi.fn(),
  usePoliciesQuery: vi.fn(),
  useTopologyRelatedPoliciesQuery: vi.fn(),
}));

vi.mock("../src/features/devices/api", () => ({
  useDevicesQuery,
}));

vi.mock("../src/features/policies/api", () => ({
  usePoliciesQuery,
}));

vi.mock("../src/features/topology/api", async () => {
  const actual = await vi.importActual<typeof import("../src/features/topology/api")>(
    "../src/features/topology/api",
  );

  return {
    ...actual,
    useTopologyRelatedPoliciesQuery,
  };
});

function createQueryState<T>(
  data: T | null,
  options?: { error?: ApiClientError | null; isLoading?: boolean },
) {
  return {
    data,
    error: options?.error ?? null,
    isLoading: options?.isLoading ?? false,
    reload: vi.fn(async () => undefined),
  };
}

const baseDevicesPayload = {
  service: "app-api" as const,
  version: "test",
  phase: "phase_2_read_only_foundation" as const,
  generated_at: "2025-01-01T00:00:00Z",
  data_status: "live" as const,
  serving_mode: "live_collector" as const,
  evidence_confidence: {
    source_posture: "live_observed" as const,
    evidence_kind: "direct_observed" as const,
    confidence_posture: "strong_for_current_slice" as const,
    freshness_posture: "current" as const,
    blocked_reason: "none" as const,
    summary: "Inventory summary.",
    notes: [],
  },
  summary: "Inventory summary.",
  served_persisted_at: null as string | null,
  comparison_to_latest_persisted: {
    status: "live_vs_latest_persisted_ready" as const,
    summary: "Comparison ready.",
    comparison_snapshot_id: "inventory-snapshot-latest",
    comparison_persisted_at: "2025-01-01T00:00:00Z",
    current_device_count: 2,
    persisted_device_count: 1,
    device_count_delta: 1,
    added_device_count: 1,
    removed_device_count: 0,
    changed_device_count: 1,
    current_role_counts: { p: 1, pe: 1 },
    persisted_role_counts: { pe: 1 },
    current_collector_status_counts: { ok: 2 },
    persisted_collector_status_counts: { degraded: 1 },
    current_capability_summary_counts: { partially_supported: 2 },
    persisted_capability_summary_counts: { unknown: 1 },
    notes: [],
  },
  count: 2,
  items: [
    {
      device_id: "PE1",
      vendor: "nokia",
      platform: "7750 SR-1",
      software_version: "B-25.10.R2",
      role: "pe",
      management_address: "172.20.20.107",
      current_posture: "current" as const,
      collector_status: "ok" as const,
      last_recorded_collector_status: "ok" as const,
      capability_summary: "partially_supported" as const,
      capability_detail: "Support remains bounded.",
    },
    {
      device_id: "P1",
      vendor: "nokia",
      platform: "7750 SR-1",
      software_version: "B-25.10.R2",
      role: "p",
      management_address: "172.20.20.109",
      current_posture: "current" as const,
      collector_status: "ok" as const,
      last_recorded_collector_status: "ok" as const,
      capability_summary: "partially_supported" as const,
      capability_detail: "Support remains bounded.",
    },
  ],
  read_side_query: {
    limit_requested: null,
    items_total: 2,
    items_returned: 2,
    history_recent_limit_requested: null,
    history_recent_limit_effective: 3,
    history_recent_snapshots_returned: 2,
    sync_runs_limit_requested: null,
    sync_runs_limit_effective: null,
    readiness_snapshot_history_limit_requested: null,
    readiness_snapshot_history_limit_effective: null,
  },
};

function createDevicesDataFullHistory() {
  return {
    ...baseDevicesPayload,
    history: {
      status: "comparison_ready" as const,
      summary:
        "Recent persisted normalized inventory snapshots are available for bounded current-versus-previous comparison.",
      recent_snapshots: [
        {
          snapshot_id: "inventory-snapshot-current",
          sync_run_id: "sync-run-current",
          persisted_at: "2025-01-01T00:00:00Z",
          observed_at: null,
          sync_source: "gnmi_collector_inventory",
          sync_status: "partial_live_feed",
          data_status: "degraded" as const,
          source_endpoint: "http://gnmi-collector:9804/inventory/snapshot",
          device_count: 1,
          role_counts: { pe: 1 },
          collector_status_counts: { degraded: 1 },
          capability_summary_counts: { unknown: 1 },
        },
        {
          snapshot_id: "inventory-snapshot-older",
          sync_run_id: "sync-run-older",
          persisted_at: "2024-12-31T23:30:00Z",
          observed_at: null,
          sync_source: "gnmi_collector_inventory",
          sync_status: "live_normalized_feed",
          data_status: "live" as const,
          source_endpoint: "http://gnmi-collector:9804/inventory/snapshot",
          device_count: 2,
          role_counts: { p: 1, pe: 1 },
          collector_status_counts: { ok: 2 },
          capability_summary_counts: { partially_supported: 2 },
        },
      ],
      comparison_to_previous: {
        current_snapshot_id: "inventory-snapshot-current",
        previous_snapshot_id: "inventory-snapshot-older",
        current_persisted_at: "2025-01-01T00:00:00Z",
        previous_persisted_at: "2024-12-31T23:30:00Z",
        current_observed_at: null,
        previous_observed_at: null,
        current_sync_status: "partial_live_feed",
        previous_sync_status: "live_normalized_feed",
        current_data_status: "degraded" as const,
        previous_data_status: "live" as const,
        current_device_count: 1,
        previous_device_count: 2,
        device_count_delta: -1,
        added_device_count: 0,
        removed_device_count: 1,
        changed_device_count: 1,
        change_preview: [
          {
            device_id: "P1",
            vendor: "nokia",
            platform: "7750 SR-1",
            role: "p",
            change_kind: "removed" as const,
            changed_fields: [] as string[],
          },
        ],
        notes: ["Bounded inventory history note."],
      },
    },
  };
}

function createDevicesDataComparisonWithoutPreview() {
  const full = createDevicesDataFullHistory();
  return {
    ...full,
    history: {
      ...full.history,
      comparison_to_previous: full.history.comparison_to_previous
        ? {
            ...full.history.comparison_to_previous,
            change_preview: [],
          }
        : null,
    },
  };
}

function createDevicesDataCurrentOnlyNoComparison() {
  return {
    ...baseDevicesPayload,
    read_side_query: {
      ...baseDevicesPayload.read_side_query,
      history_recent_snapshots_returned: 1,
    },
    history: {
      status: "current_only" as const,
      summary: "One persisted inventory snapshot exists; comparison to previous is not available.",
      recent_snapshots: [
        {
          snapshot_id: "inventory-snapshot-only",
          sync_run_id: "sync-run-only",
          persisted_at: "2025-01-01T00:00:00Z",
          observed_at: "2025-01-01T00:00:00Z",
          sync_source: "gnmi_collector_inventory",
          sync_status: "live_normalized_feed",
          data_status: "live" as const,
          source_endpoint: "http://gnmi-collector:9804/inventory/snapshot",
          device_count: 2,
          role_counts: { pe: 2 },
          collector_status_counts: { ok: 2 },
          capability_summary_counts: { partially_supported: 2 },
        },
      ],
      comparison_to_previous: null,
    },
  };
}

function createDevicesDataUnavailableEmpty() {
  return {
    ...baseDevicesPayload,
    read_side_query: {
      ...baseDevicesPayload.read_side_query,
      history_recent_snapshots_returned: 0,
    },
    history: {
      status: "unavailable" as const,
      summary: "No persisted inventory history in this posture.",
      recent_snapshots: [] as [],
      comparison_to_previous: null,
    },
  };
}

function createEmptyRelatedPoliciesResponse(objectId: string) {
  return {
    metadata: {
      service: "app-api" as const,
      version: "test",
      phase: "phase_2_read_only_foundation" as const,
      generated_at: "2025-01-01T00:00:00Z",
    },
    object_kind: "node" as const,
    object_id: objectId,
    derivation_summary: "Derived via string equality on inventory device id as topology node id.",
    global_caveats: [] as string[],
    items: [] as [],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  usePoliciesQuery.mockReturnValue({
    data: null,
    error: null,
    isLoading: false,
    isRefreshing: false,
    reload: vi.fn(async () => undefined),
  });
  useTopologyRelatedPoliciesQuery.mockReturnValue({
    data: createEmptyRelatedPoliciesResponse("PE1"),
    error: null,
    isLoading: false,
    isRefreshing: false,
    reload: vi.fn(async () => undefined),
  });
});

describe("devices view", () => {
  it("renders persisted inventory history, snapshot anchors, sync run, source endpoint, and change preview table", () => {
    useDevicesQuery.mockReturnValue(createQueryState(createDevicesDataFullHistory()));

    const html = renderToStaticMarkup(<DevicesView />);

    expect(html).toContain("Persisted History And Comparison");
    expect(html).toContain("Recent Persisted Snapshots");
    expect(html).toContain("Comparison ready");
    expect(html).toContain("inventory-snapshot-current");
    expect(html).toContain("inventory-snapshot-older");
    expect(html).toContain("sync-run-current");
    expect(html).toContain("sync-run-older");
    expect(html).toContain("Source endpoint:");
    expect(html).toContain("http://gnmi-collector:9804/inventory/snapshot");
    expect(html).toContain("Bounded change preview");
    expect(html).toContain("P1");
    expect(html).toContain("removed");
    expect(html).toContain("Bounded inventory history note.");
    expect(html).toContain("read-side, persisted-inventory evidence");
    expect(html).toContain("Bounded query readout (from API)");
    expect(html).toContain("Persisted snapshot summaries:");
  });

  it("omits change preview table when the backend returns an empty preview list", () => {
    useDevicesQuery.mockReturnValue(createQueryState(createDevicesDataComparisonWithoutPreview()));

    const html = renderToStaticMarkup(<DevicesView />);

    expect(html).not.toContain("Bounded change preview");
    expect(html).toContain("Persisted History And Comparison");
  });

  it("shows an honest footnote when only one snapshot exists and comparison is absent", () => {
    useDevicesQuery.mockReturnValue(createQueryState(createDevicesDataCurrentOnlyNoComparison()));

    const html = renderToStaticMarkup(<DevicesView />);

    expect(html).toContain("Current snapshot only");
    expect(html).toContain("Only one persisted normalized inventory snapshot exists");
    expect(html).toContain("sync-run-only");
  });

  it("shows unavailable history and empty recent snapshots without implying a bug", () => {
    useDevicesQuery.mockReturnValue(createQueryState(createDevicesDataUnavailableEmpty()));

    const html = renderToStaticMarkup(<DevicesView />);

    expect(html).toContain("History unavailable");
    expect(html).toContain("No persisted inventory history window is available from the backend");
  });

  it("surfaces primary list truncation honestly when the API echo shows fewer rows than the logical total", () => {
    useDevicesQuery.mockReturnValue(
      createQueryState({
        ...createDevicesDataFullHistory(),
        read_side_query: {
          ...baseDevicesPayload.read_side_query,
          limit_requested: 1,
          items_total: 2,
          items_returned: 1,
        },
      }),
    );

    const html = renderToStaticMarkup(<DevicesView />);

    expect(html).toContain("Primary device inventory list shows 1 of 2 rows");
  });

  it("renders API error state with retry", () => {
    useDevicesQuery.mockReturnValue(
      createQueryState(null, { error: new ApiClientError("devices fetch failed", 0, "network_error") }),
    );

    const html = renderToStaticMarkup(<DevicesView />);

    expect(html).toContain("devices fetch failed");
  });

  it("renders loading state", () => {
    useDevicesQuery.mockReturnValue(createQueryState(null, { isLoading: true }));

    const html = renderToStaticMarkup(<DevicesView />);

    expect(html).toContain("Loading normalized device inventory");
  });

  it("renders device context and related policies panel for the selected device", () => {
    useDevicesQuery.mockReturnValue(createQueryState(createDevicesDataFullHistory()));

    const html = renderToStaticMarkup(<DevicesView />);

    expect(html).toContain("Device context");
    expect(html).toContain("Related policies");
    expect(html).toContain("Derived via string equality on inventory device id as topology node id.");
  });
});
