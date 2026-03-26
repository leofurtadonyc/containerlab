import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { MaintenanceEvidenceWorkspaceResponse } from "../src/api/contracts";
import { MaintenanceEvidenceWorkspaceProduct } from "../src/features/maintenance-evidence-workspace/maintenance-evidence-workspace-product";

const mpSubject = {
  object_kind: "node" as const,
  object_id: "N1",
  display_name: "N1",
  source_node_id: null,
  target_node_id: null,
};

const workspacePayload = {
  metadata: {
    service: "app-api" as const,
    version: "0.1.0",
    phase: "phase_2_read_only_foundation" as const,
    generated_at: "2025-01-01T00:00:00Z",
  },
  contract_id: "maintenance_evidence_workspace_v1" as const,
  object_kind: "node" as const,
  object_id: "N1",
  preview_context: "topology_drilldown" as const,
  maintenance_framing_summary: "Composed maintenance-centered review from existing assemblies only.",
  maintenance_preview: {
    metadata: {
      service: "app-api" as const,
      version: "0.1.0",
      phase: "phase_2_read_only_foundation" as const,
      generated_at: "2025-01-01T00:00:00Z",
    },
    contract_id: "maintenance_preview_v1" as const,
    safety_framing: {
      contract_id: "maintenance_preview_v1",
      authority_posture: "read_only_assembly_non_authoritative" as const,
      explicit_non_claims: ["not_simulation"],
      phase: "phase_2_read_only_foundation" as const,
      summary_disclaimer: "d",
    },
    preview_context: "topology_drilldown" as const,
    source_contract_ids: ["maintenance_preview_v1"],
    subject: mpSubject,
    sparse_preview: false,
    sparse_reasons: [],
    related_policies: {} as never,
    failure_impact: {} as never,
    related_services: [],
    related_services_total: 0,
    related_services_truncated: false,
    topology_impact: {} as never,
    explainability_pointers: [],
    recommended_pivots: [],
    assembly_caveats: [],
  },
  topology_object_dossier: null,
  topology_object_evidence_timeline: null,
  topology_object_evidence_delta: null,
  change_safety_case: {
    metadata: {
      service: "app-api" as const,
      version: "0.1.0",
      phase: "phase_2_read_only_foundation" as const,
      generated_at: "2025-01-01T00:00:00Z",
    },
    contract_id: "change_safety_case_v1" as const,
    safety_case_context: "topology_change_safety" as const,
    safety_framing: {
      contract_id: "change_safety_case_v1",
      authority_posture: "pre_change_interpretation_only" as const,
      explicit_non_claims: ["not_approval_or_authorization"],
      phase: "phase_2_read_only_foundation" as const,
      summary_disclaimer: "csc",
    },
    source_contract_ids: ["change_safety_case_v1"],
    understanding_posture_summary: "u",
    evidence_inventory: [],
    merged_caveats: [],
    evidence_gaps: [],
    next_review_guidance: [],
    recommended_api_pivots: [],
    investigation_situation_briefing_pivot_hints: [],
    sparse_case: false,
    sparse_reasons: [],
    anchor_maintenance: mpSubject,
    maintenance_preview: null,
  },
  merged_caveats: ["Merged caveat."],
  merged_evidence_gap_notes: ["Gap note."],
  explicit_non_claims: ["maintenance_evidence_workspace_v1 is composed read-only."],
  source_contract_ids: ["maintenance_evidence_workspace_v1", "maintenance_preview_v1"],
  recommended_api_pivots: ["GET /api/v1/maintenance-preview?node_id=N1"],
} as unknown as MaintenanceEvidenceWorkspaceResponse;

describe("MaintenanceEvidenceWorkspaceProduct", () => {
  it("renders maintenance_evidence_workspace_v1 marker and key honesty sections", () => {
    const html = renderToStaticMarkup(
      <MaintenanceEvidenceWorkspaceProduct data={workspacePayload} onReload={vi.fn()} />,
    );
    expect(html).toContain("maintenance_evidence_workspace_v1");
    expect(html).toContain("Composed maintenance-centered review");
    expect(html).toContain("evidence_export_v1");
    expect(html).toContain("Merged caveat.");
    expect(html).toContain("Gap note.");
    expect(html).toContain("GET /api/v1/maintenance-preview?node_id=N1");
  });
});
