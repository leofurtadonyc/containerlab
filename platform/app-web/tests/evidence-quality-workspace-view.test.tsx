import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "../src/api/client";
import type { EvidenceQualitySummaryResponse, EvidenceWeaknessExplanationResponse } from "../src/api/contracts";
import { EvidenceQualityWorkspaceView } from "../src/features/evidence-quality-workspace/view";

const { useEvidenceQualityWorkspaceQuery, useEvidenceWeaknessExplanationQuery } = vi.hoisted(() => ({
  useEvidenceQualityWorkspaceQuery: vi.fn(),
  useEvidenceWeaknessExplanationQuery: vi.fn(),
}));

vi.mock("../src/features/evidence-quality-workspace/api", () => ({
  useEvidenceQualityWorkspaceQuery,
  useEvidenceWeaknessExplanationQuery,
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

function createWeaknessFixture(
  overrides?: Partial<EvidenceWeaknessExplanationResponse>,
): EvidenceWeaknessExplanationResponse {
  return {
    metadata: {
      service: "app-api",
      version: "test",
      phase: "phase_2_read_only_foundation",
      generated_at: "2025-01-01T00:00:00Z",
    },
    contract_id: "evidence_weakness_explanation_v1",
    safety_framing: {
      contract_id: "evidence_weakness_explanation_v1",
      authority_posture: "advisory_read_only_navigation",
      explicit_non_claims: ["not_approval_or_safe_to_change", "not_root_cause_beyond_cited_fields"],
      phase: "phase_2_read_only_foundation",
      summary_disclaimer: "Explanation disclaimer.",
    },
    sync_runs_limit_applied: 20,
    blocks: [
      {
        explanation_category: "collection_assurance_weak",
        evidence_quality_dimension: "collection_assurance",
        evidence_subject_domain: "policies",
        row_summary: "Collector unavailable class honesty.",
        primary_next_best_pivot: {
          pivot_id: "open_policies_list",
          label: "Policies list",
          route_family: "GET /api/v1/policies; view=policies",
          rationale:
            "Advisory read-only pivot for explanation category collection_assurance_weak on policies evidence; not remediation or approval.",
          cited_evidence_fields: ["GET /api/v1/policies — empty_reason"],
        },
        alternate_next_best_pivot: null,
      },
    ],
    caveats: ["Navigation only."],
    assembly_notes: [],
    ...overrides,
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
    isRefreshing: Boolean(opts?.isLoading && data),
    reload: () => {},
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  useEvidenceWeaknessExplanationQuery.mockReturnValue(createQueryState(createWeaknessFixture()));
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
    expect(html).toContain("Evidence weakness explanation");
    expect(html).toContain("collection_assurance_weak");
    expect(html).toContain("Open next-best pivot: Policies list");
    expect(html).toContain("not_root_cause_beyond_cited_fields");
    expect(html).toContain("evidence-quality-workspace");
  });

  it("renders explanation loading state without hiding loaded evidence-quality rows", () => {
    useEvidenceQualityWorkspaceQuery.mockReturnValue(createQueryState(createFixture()));
    useEvidenceWeaknessExplanationQuery.mockReturnValue(createQueryState(null, { isLoading: true }));

    const html = renderToStaticMarkup(<EvidenceQualityWorkspaceView />);

    expect(html).toContain("Loading evidence_weakness_explanation_v1");
    expect(html).toContain("Collector unavailable class honesty");
  });

  it("renders empty explanation blocks as a bounded empty state", () => {
    useEvidenceQualityWorkspaceQuery.mockReturnValue(createQueryState(createFixture()));
    useEvidenceWeaknessExplanationQuery.mockReturnValue(createQueryState(createWeaknessFixture({ blocks: [] })));

    const html = renderToStaticMarkup(<EvidenceQualityWorkspaceView />);

    expect(html).toContain("No explanation blocks");
    expect(html).toContain("No evidence-quality weakness rows were mapped to next-best pivots");
  });

  it("renders explanation error state with non-authoritative fallback copy", () => {
    useEvidenceQualityWorkspaceQuery.mockReturnValue(createQueryState(createFixture()));
    useEvidenceWeaknessExplanationQuery.mockReturnValue(
      createQueryState(null, {
        error: new ApiClientError("Explanation unavailable", 502, "request_failed"),
      }),
    );

    const html = renderToStaticMarkup(<EvidenceQualityWorkspaceView />);

    expect(html).toContain("Explanation pivots are temporarily unavailable");
    expect(html).toContain("The evidence-quality rows below remain the authoritative read-only workspace content");
    expect(html).toContain("Explanation unavailable");
  });

  it("renders unsupported when contract_id mismatches", () => {
    const bad = { ...createFixture(), contract_id: "wrong" };
    useEvidenceQualityWorkspaceQuery.mockReturnValue(createQueryState(bad));

    const html = renderToStaticMarkup(<EvidenceQualityWorkspaceView />);

    expect(html).toContain("evidence-quality-workspace-route--unsupported");
  });
});
