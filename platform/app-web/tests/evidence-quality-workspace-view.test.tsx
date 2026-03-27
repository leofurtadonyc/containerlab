import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "../src/api/client";
import type { EvidenceQualitySummaryResponse } from "../src/api/contracts";
import { EvidenceQualityWorkspaceView } from "../src/features/evidence-quality-workspace/view";

const { useEvidenceQualityWorkspaceQuery } = vi.hoisted(() => ({
  useEvidenceQualityWorkspaceQuery: vi.fn(),
}));

vi.mock("../src/features/evidence-quality-workspace/api", () => ({
  useEvidenceQualityWorkspaceQuery,
}));

function createFixture(): EvidenceQualitySummaryResponse {
  return {
    metadata: {
      service: "app-api",
      version: "test",
      phase: "phase_2_read_only_foundation",
      generated_at: "2025-01-01T00:00:00Z",
    },
    contract_id: "evidence_quality_workspace_v1",
    safety_framing: {
      contract_id: "evidence_quality_workspace_v1",
      authority_posture: "interpretation_support_only",
      explicit_non_claims: ["not_validation_or_approval"],
      phase: "phase_2_read_only_foundation",
      summary_disclaimer: "Evidence quality disclaimer.",
    },
    read_path_reliability_posture: "mixed_degraded",
    collection_assurance_summary: "inventory: ok; policy: degraded.",
    scope_summary: "Evidence quality (bounded): rows=1.",
    sync_runs_limit_applied: 20,
    rows: [
      {
        evidence_quality_dimension: "collection_assurance",
        evidence_subject_domain: "policies",
        summary: "Collector unavailable class honesty.",
        detail: null,
        source_citations: ["GET /api/v1/policies — empty_reason"],
      },
    ],
    caveats: ["Caveat one."],
    assembly_notes: [],
  };
}

function createQueryState<T>(
  data: T | null,
  opts?: { error?: ApiClientError; isLoading?: boolean },
) {
  return {
    data,
    error: opts?.error ?? null,
    isLoading: opts?.isLoading ?? false,
    reload: () => {},
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EvidenceQualityWorkspaceView", () => {
  it("renders loading route while fetching", () => {
    useEvidenceQualityWorkspaceQuery.mockReturnValue(createQueryState(null, { isLoading: true }));

    const html = renderToStaticMarkup(<EvidenceQualityWorkspaceView />);

    expect(html).toContain("evidence-quality-workspace-route--loading");
  });

  it("renders error route with retry affordance", () => {
    useEvidenceQualityWorkspaceQuery.mockReturnValue(
      createQueryState(null, {
        error: new ApiClientError("Upstream failed", 502, "request_failed"),
      }),
    );

    const html = renderToStaticMarkup(<EvidenceQualityWorkspaceView />);

    expect(html).toContain("evidence-quality-workspace-route--error");
    expect(html).toContain("Upstream failed");
  });

  it("renders summary and rows when data loads", () => {
    useEvidenceQualityWorkspaceQuery.mockReturnValue(createQueryState(createFixture()));

    const html = renderToStaticMarkup(<EvidenceQualityWorkspaceView />);

    expect(html).toContain('data-testid="evidence-quality-workspace"');
    expect(html).toContain("evidence_quality_workspace_v1");
    expect(html).toContain("Collection assurance summary");
    expect(html).toContain("Collector unavailable class honesty");
    expect(html).toContain("data-testid=\"evidence-quality-domain-sections\"");
    expect(html).toContain("Operator briefing");
    expect(html).toContain("evidence-quality-workspace");
  });

  it("renders unsupported when contract_id mismatches", () => {
    const bad = { ...createFixture(), contract_id: "wrong" };
    useEvidenceQualityWorkspaceQuery.mockReturnValue(createQueryState(bad));

    const html = renderToStaticMarkup(<EvidenceQualityWorkspaceView />);

    expect(html).toContain("evidence-quality-workspace-route--unsupported");
  });
});
