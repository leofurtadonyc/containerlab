import { describe, expect, it } from "vitest";

import {
  assertExportKindMatches,
  parseEvidenceExportJson,
  parseEvidenceExportMarkdown,
} from "../src/lib/evidence-replay";

function minimalSituationRoomExport(overrides?: Record<string, unknown>): string {
  const base = {
    contract_id: "evidence_export_v1",
    export_kind: "situation_room",
    subject_ref: { sync_runs_limit: 5 },
    generated_at: "2025-01-01T00:00:00Z",
    source_contract_ids: ["evidence_pack_phase2_v1"],
    explicit_non_claims: ["not_compliance_or_legal_hold_artifact"],
    export_framing: "Phase 2 read-only evidence export.",
    nested: {
      safety: { contract_id: "evidence_pack_phase2_v1" },
      assembly_notes: ["test"],
    },
  };
  return JSON.stringify({ ...base, ...overrides });
}

describe("parseEvidenceExportJson", () => {
  it("parses valid situation-room JSON export", () => {
    const r = parseEvidenceExportJson(minimalSituationRoomExport());
    expect(r.status).toBe("ok");
    if (r.status !== "ok") {
      return;
    }
    expect(r.model.exportKind).toBe("situation_room");
    expect(r.model.contractId).toBe("evidence_export_v1");
    expect(r.model.subjectRef.sync_runs_limit).toBe(5);
    expect(r.model.sourceContractIds).toContain("evidence_pack_phase2_v1");
    expect(r.model.explicitNonClaims.length).toBeGreaterThan(0);
    expect(r.model.exportFraming.length).toBeGreaterThan(0);
    expect(r.model.nested?.safety).toMatchObject({ contract_id: "evidence_pack_phase2_v1" });
    expect(r.model.partial).toBe(false);
    expect(r.model.parseWarnings).toHaveLength(0);
  });

  it("returns partial replay when nested payload is missing", () => {
    const r = parseEvidenceExportJson(
      minimalSituationRoomExport({ nested: undefined }),
    );
    expect(r.status).toBe("ok");
    if (r.status !== "ok") {
      return;
    }
    expect(r.model.partial).toBe(true);
    expect(r.model.nested).toBeNull();
    expect(r.model.parseWarnings.some((w) => w.includes("nested"))).toBe(true);
  });

  it("returns partial replay when nested is not an object", () => {
    const r = parseEvidenceExportJson(minimalSituationRoomExport({ nested: [] }));
    expect(r.status).toBe("ok");
    if (r.status !== "ok") {
      return;
    }
    expect(r.model.partial).toBe(true);
    expect(r.model.nested).toBeNull();
  });

  it("rejects non-JSON", () => {
    const r = parseEvidenceExportJson("not json {{{");
    expect(r.status).toBe("error");
    if (r.status === "error") {
      expect(r.error.code).toBe("not_json");
    }
  });

  it("rejects missing contract_id", () => {
    const r = parseEvidenceExportJson(JSON.stringify({ export_kind: "situation_room" }));
    expect(r.status).toBe("error");
    if (r.status === "error") {
      expect(r.error.code).toBe("missing_contract_id");
    }
  });

  it("rejects wrong envelope contract_id", () => {
    const r = parseEvidenceExportJson(
      JSON.stringify({
        contract_id: "other",
        export_kind: "situation_room",
        generated_at: "2025-01-01T00:00:00Z",
        subject_ref: {},
        source_contract_ids: [],
        explicit_non_claims: [],
        export_framing: "",
        nested: {},
      }),
    );
    expect(r.status).toBe("error");
    if (r.status === "error") {
      expect(r.error.code).toBe("unsupported_envelope_contract");
    }
  });

  it("rejects unknown export_kind", () => {
    const r = parseEvidenceExportJson(
      JSON.stringify({
        contract_id: "evidence_export_v1",
        export_kind: "future_kind",
        generated_at: "2025-01-01T00:00:00Z",
        subject_ref: {},
        source_contract_ids: [],
        explicit_non_claims: [],
        export_framing: "",
      }),
    );
    expect(r.status).toBe("error");
    if (r.status === "error") {
      expect(r.error.code).toBe("unsupported_export_kind");
    }
  });

  it("assertExportKindMatches errors on mismatch", () => {
    const r = parseEvidenceExportJson(minimalSituationRoomExport());
    expect(r.status).toBe("ok");
    if (r.status !== "ok") {
      return;
    }
    const check = assertExportKindMatches(r.model, "investigation_workspace");
    expect(check.status).toBe("error");
    if (check.status === "error") {
      expect(check.error.code).toBe("export_kind_mismatch");
    }
  });

  it("assertExportKindMatches passes for matching kind", () => {
    const r = parseEvidenceExportJson(minimalSituationRoomExport());
    expect(r.status).toBe("ok");
    if (r.status !== "ok") {
      return;
    }
    const check = assertExportKindMatches(r.model, "situation_room");
    expect(check.status).toBe("ok");
  });
});

describe("parseEvidenceExportMarkdown", () => {
  it("returns markdown_partial with inferred kind and fence hint", () => {
    const md = `# Evidence export: situation_room

Some prose.

\`\`\`json
{"contract_id":"evidence_export_v1"}
\`\`\`
`;
    const r = parseEvidenceExportMarkdown(md);
    expect(r.status).toBe("markdown_partial");
    if (r.status !== "markdown_partial") {
      return;
    }
    expect(r.inferredExportKind).toBe("situation_room");
    expect(r.hasStructuredJsonFence).toBe(true);
    expect(r.parseWarnings.length).toBeGreaterThan(0);
    expect(r.bodyText).toContain("Some prose.");
  });

  it("warns when no json fence", () => {
    const r = parseEvidenceExportMarkdown("# Evidence export: situation_room\n\nhello");
    expect(r.status).toBe("markdown_partial");
    if (r.status !== "markdown_partial") {
      return;
    }
    expect(r.hasStructuredJsonFence).toBe(false);
    expect(r.parseWarnings.some((w) => w.includes("json fence"))).toBe(true);
  });

  it("rejects empty markdown", () => {
    const r = parseEvidenceExportMarkdown("   \n  ");
    expect(r.status).toBe("error");
  });
});
