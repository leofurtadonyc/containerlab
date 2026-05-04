import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { ActionSafetyCaseResponse } from "../src/api/contracts";
import { ActionSafetyCasePanel, SafeActionWorkspaceView } from "../src/features/safe-action-workspace/view";

vi.mock("../src/api/client", () => ({
  apiClient: {
    createWorkflowLifecycle: vi.fn(),
    transitionWorkflowLifecycle: vi.fn(),
    createPreview: vi.fn(),
    createValidation: vi.fn(),
    createSafeAction: vi.fn(),
    getSafeActionTimeline: vi.fn(),
    getActionSafetyCase: vi.fn(),
    approveSafeAction: vi.fn(),
    executeSafeAction: vi.fn(),
  },
}));

describe("SafeActionWorkspaceView", () => {
  it("renders bounded safe-action framing", () => {
    const html = renderToStaticMarkup(<SafeActionWorkspaceView />);
    expect(html).toContain("Safe action workspace");
    expect(html).toContain("controller configuration push");
    expect(html).toContain("Action safety case");
  });

  it("renders bounded action safety case posture, gates, and non-claims", () => {
    const safetyCase: ActionSafetyCaseResponse = {
      service: "app-api",
      version: "test",
      phase: "phase_2_read_only_foundation",
      generated_at: "2026-01-01T00:00:00Z",
      contract_id: "action_safety_case_v1",
      action_id: "act-1",
      final_bounded_posture: "degraded_evidence",
      action: {
        present: true,
        identifier: "act-1",
        status: "awaiting_approval",
        verdict: "allowed",
        summary: "Action is allowed.",
        route_family: "GET /api/v1/actions/act-1",
        cited_fields: [],
      },
      workflow_lifecycle: {
        present: true,
        identifier: "wf-1",
        status: "approved",
        verdict: null,
        summary: "Workflow approved.",
        route_family: null,
        cited_fields: [],
      },
      preview: {
        present: true,
        identifier: "pv-1",
        status: "generated",
        verdict: "allowed",
        summary: "Preview generated.",
        route_family: null,
        cited_fields: [],
      },
      diff_summary: {
        present: true,
        identifier: "pv-1",
        status: "current",
        verdict: null,
        summary: "Diff has one change.",
        route_family: null,
        cited_fields: [],
      },
      validation: {
        present: true,
        identifier: "val-1",
        status: "completed",
        verdict: "pass",
        summary: "Validation passed.",
        route_family: null,
        cited_fields: [],
      },
      evidence_quality: {
        present: true,
        identifier: null,
        status: "heavily_limited",
        verdict: null,
        summary: "Evidence quality is limited.",
        route_family: null,
        cited_fields: [],
      },
      controller_evidence: {
        present: true,
        identifier: null,
        status: "ok",
        verdict: null,
        summary: "Controller evidence is supporting only.",
        route_family: null,
        cited_fields: [],
      },
      rollback_readiness: {
        present: false,
        identifier: null,
        status: "not_prepared",
        verdict: null,
        summary: "No rollback associated.",
        route_family: null,
        cited_fields: [],
      },
      blocking_gates: [],
      warning_gates: [
        {
          gate_id: "evidence_quality_degraded",
          severity: "warning",
          summary: "Evidence degraded.",
          cited_fields: [],
        },
      ],
      missing_evidence: [],
      operator_next_steps: [
        {
          step_id: "operator_review",
          label: "Review bounded safety case",
          rationale: "Review warnings.",
          route_family: null,
        },
      ],
      safety_framing: {
        contract_id: "action_safety_case_v1",
        authority_posture: "bounded_operator_review_only",
        explicit_limitations: ["This safety case does not claim safe-to-execute authority."],
      },
    };

    const html = renderToStaticMarkup(<ActionSafetyCasePanel safetyCase={safetyCase} />);

    expect(html).toContain("degraded_evidence");
    expect(html).toContain("Evidence degraded.");
    expect(html).toContain("safe-to-execute authority");
    expect(html).toContain("Rollback readiness");
  });
});
