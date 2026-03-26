import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import type { ServiceEvidenceDeltaResponse } from "../src/api/contracts";
import { ServiceEvidenceDeltaPanel } from "../src/features/service-explorer/service-evidence-delta-panel";

const { useServiceEvidenceDeltaQuery } = vi.hoisted(() => ({
  useServiceEvidenceDeltaQuery: vi.fn(),
}));

vi.mock("../src/features/service-explorer/api", () => ({
  useServiceEvidenceDeltaQuery,
}));

function baseFixture(overrides: Partial<ServiceEvidenceDeltaResponse> = {}): ServiceEvidenceDeltaResponse {
  return {
    metadata: {
      service: "app-api",
      version: "0.1.0",
      phase: "phase_2_read_only_foundation",
      generated_at: "2025-01-01T00:00:00Z",
    },
    contract_id: "service_evidence_delta_v1",
    safety_framing: {
      contract_id: "service_evidence_delta_v1",
      authority_posture: "interpretation_support_only",
      explicit_non_claims: ["not_service_drift_truth"],
      phase: "phase_2_read_only_foundation",
      summary_disclaimer: "Disclaimer",
    },
    service_id: "policy:p1",
    comparison_status: "delta_ready",
    scope_summary: "Bounded delta",
    current_anchor: {
      anchor_role: "current_explorer_detail",
      generated_at: "2025-01-01T00:00:00Z",
      reference: "GET /api/v1/services/{service_id}",
    },
    previous_anchor: {
      anchor_role: "previous_persisted_policy_snapshot",
      snapshot_id: "snap-prev",
      persisted_at: "2024-12-31T00:00:00Z",
      observed_at: null,
    },
    delta_items: [],
    member_policy_delta_pointers: [],
    caveats: [],
    ...overrides,
  };
}

describe("ServiceEvidenceDeltaPanel", () => {
  it("renders loading state", () => {
    useServiceEvidenceDeltaQuery.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
      isRefreshing: false,
      reload: vi.fn(),
    });
    const html = renderToStaticMarkup(<ServiceEvidenceDeltaPanel serviceId="policy:p1" />);
    expect(html).toContain("Loading bounded service evidence delta");
  });

  it("renders delta items and contract id", () => {
    useServiceEvidenceDeltaQuery.mockReturnValue({
      data: baseFixture({
        delta_items: [
          {
            category: "service_membership_change",
            summary: "Members changed",
            detail: "added=[] removed=[]",
          },
        ],
      }),
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(),
    });
    const html = renderToStaticMarkup(<ServiceEvidenceDeltaPanel serviceId="policy:p1" />);
    expect(html).toContain("Membership (policy_id set)");
    expect(html).toContain("service_evidence_delta_v1");
  });
});
