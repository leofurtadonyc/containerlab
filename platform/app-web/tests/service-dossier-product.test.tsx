import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { ServiceDossierResponse } from "../src/api/contracts";
import { ServiceDossierProduct } from "../src/features/service-dossier/service-dossier-product";

const degradedOk = {
  contract_id: "degraded_policy_v1" as const,
  posture: "ok" as const,
  reason_codes: [] as [],
  confidence: "medium" as const,
  summary: "ok",
  explicit_non_claims: [],
};

function createBaseDossier(overrides: Partial<ServiceDossierResponse> = {}): ServiceDossierResponse {
  const explorerDetail = {
    service: "app-api" as const,
    version: "0.1.0",
    phase: "phase_2_read_only_foundation" as const,
    generated_at: "2025-01-01T00:00:00Z",
    contract_id: "service_explorer_v1" as const,
    service_id: "color:100",
    kind: "color" as const,
    policy_inventory: {
      data_status: "live" as const,
      serving_mode: "live_collector" as const,
      empty_reason: "none" as const,
      summary: "inv",
      observed_policy_count: 1,
      policy_items_total: 1,
    },
    members: [
      {
        policy_id: "p1",
        policy_name: "n",
        policy_type: "static_local" as const,
        headend: "PE1",
        endpoint: "10.0.0.1",
        color: 100,
        source_target: "PE1",
        degraded_policy_v1: degradedOk,
      },
    ],
    members_total: 1,
    degraded_service: { posture: "ok" as const, reason_codes: [], reason_codes_truncated: false },
    topology_evidence_status: "partial" as const,
    topology_links: [],
    topology_caveats: [],
    caveats: [],
    recommended_pivots: [],
  };

  const base: ServiceDossierResponse = {
    service: "app-api",
    version: "0.1.0",
    phase: "phase_2_read_only_foundation",
    generated_at: "2025-01-01T00:00:00Z",
    contract_id: "service_dossier_v1",
    safety_framing: {
      contract_id: "service_dossier_v1",
      authority_posture: "interpretation_support_only",
      explicit_non_claims: ["not_sla_or_availability_proof"],
      phase: "phase_2_read_only_foundation",
      summary_disclaimer: "Dossier disclaimer.",
    },
    service_explorer_detail: explorerDetail,
    default_member_policy_id: "p1",
    member_posture_counts: { ok: 1 },
    policy_explainability: null,
    explainability_unavailable_note: "Explainability not embedded in test.",
    maintenance_preview: null,
    maintenance_preview_subject_node_id: null,
    maintenance_unavailable_note: "No topology linkage rows for maintenance preview.",
    merged_caveats: ["Merged line."],
    missing_evidence_notes: [],
    source_contract_ids: ["service_dossier_v1", "service_explorer_v1"],
    recommended_api_pivots: ["GET /api/v1/services/color%3A100/dossier"],
    investigation_pivot_hint: "inv_from=service_dossier",
    sparse_dossier: false,
    sparse_reasons: [],
    ...overrides,
  };
  return base;
}

describe("ServiceDossierProduct", () => {
  it("renders contract id and nested explorer service_id", () => {
    const html = renderToStaticMarkup(<ServiceDossierProduct data={createBaseDossier()} onReload={async () => {}} />);
    expect(html).toContain("service_dossier_v1");
    expect(html).toContain("color:100");
    expect(html).toContain("Explicit non-claims");
  });

  it("renders sparse callout when sparse_dossier is true", () => {
    const html = renderToStaticMarkup(
      <ServiceDossierProduct
        data={createBaseDossier({
          sparse_dossier: true,
          sparse_reasons: ["Topology evidence status is partial."],
        })}
        onReload={async () => {}}
      />,
    );
    expect(html).toContain("Sparse or partial assembly");
    expect(html).toContain("Topology evidence status is partial.");
  });
});
