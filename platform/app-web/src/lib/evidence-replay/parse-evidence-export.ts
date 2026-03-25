/**
 * Bounded parse/render adapter for `evidence_export_v1` snapshots.
 * Does **not** call app-api; does **not** upgrade replay bytes into live truth.
 */

import {
  EVIDENCE_EXPORT_ENVELOPE_CONTRACT_ID,
  type EvidenceExportKind,
  type EvidenceReplayJsonResult,
  type EvidenceReplayMarkdownResult,
  type EvidenceReplayModel,
  type EvidenceReplayParseError,
  type GenericEvidenceReplayEnvelope,
  type SituationRoomReplayModel,
} from "./types";

const EXPORT_KINDS = new Set<EvidenceExportKind>([
  "policy_dossier",
  "topology_object_dossier",
  "situation_room",
  "investigation_workspace",
]);

function err(code: EvidenceReplayParseError["code"], message: string): EvidenceReplayParseError {
  return { code, message };
}

function readString(o: Record<string, unknown>, key: string): string | null {
  const v = o[key];
  return typeof v === "string" && v.length > 0 ? v : null;
}

function readStringArray(o: Record<string, unknown>, key: string): string[] {
  const v = o[key];
  if (!Array.isArray(v)) {
    return [];
  }
  return v.filter((x): x is string => typeof x === "string");
}

function readSubjectRef(o: Record<string, unknown>): Record<string, unknown> {
  const v = o.subject_ref;
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return {};
}

/**
 * Parse a canonical **`evidence_export_v1`** JSON string (e.g. downloaded export).
 * **Situation room** exports get a typed **`SituationRoomReplayModel`**; other kinds return envelope + nested blob with a specialization warning (v1 adapter focus).
 */
export function parseEvidenceExportJson(raw: string): EvidenceReplayJsonResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "error", error: err("not_json", "File is not valid JSON.") };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { status: "error", error: err("invalid_json", "JSON root must be an object.") };
  }

  const o = parsed as Record<string, unknown>;

  if (!("contract_id" in o)) {
    return { status: "error", error: err("missing_contract_id", "Missing contract_id on export envelope.") };
  }

  if (o.contract_id === "impact_report_v1") {
    return {
      status: "error",
      error: err(
        "impact_report_not_evidence_export",
        "This file is impact_report_v1 (Impact Report from GET /api/v1/reports/...), not evidence_export_v1. Evidence replay only accepts exports from GET /api/v1/exports/.... Use the Impact Report view for report review, or export a dossier / situation / investigation snapshot for replay.",
      ),
    };
  }

  if (o.contract_id === "change_safety_case_v1") {
    return {
      status: "error",
      error: err(
        "change_safety_case_not_evidence_export",
        "This file is change_safety_case_v1 (Change Safety Case from GET /api/v1/reports/change-safety-case/...), not evidence_export_v1. Evidence replay only accepts exports from GET /api/v1/exports/.... Use the Change safety case view for review, or export a dossier / situation / investigation snapshot for replay.",
      ),
    };
  }

  if (o.contract_id !== EVIDENCE_EXPORT_ENVELOPE_CONTRACT_ID) {
    return {
      status: "error",
      error: err(
        "unsupported_envelope_contract",
        `Expected contract_id "${EVIDENCE_EXPORT_ENVELOPE_CONTRACT_ID}" on evidence export envelope.`,
      ),
    };
  }

  const exportKindRaw = o.export_kind;
  if (typeof exportKindRaw !== "string" || !EXPORT_KINDS.has(exportKindRaw as EvidenceExportKind)) {
    return {
      status: "error",
      error: err("unsupported_export_kind", "Unknown or missing export_kind for evidence export."),
    };
  }

  const exportKind = exportKindRaw as EvidenceExportKind;
  const generatedAt = readString(o, "generated_at");
  if (!generatedAt) {
    return { status: "error", error: err("invalid_json", "Missing generated_at on export envelope.") };
  }

  const subjectRef = readSubjectRef(o);
  const sourceContractIds = readStringArray(o, "source_contract_ids");
  const explicitNonClaims = readStringArray(o, "explicit_non_claims");
  const exportFraming = readString(o, "export_framing") ?? "";

  if (exportKind === "situation_room") {
    return buildSituationRoomModel(o, {
      generatedAt,
      subjectRef,
      sourceContractIds,
      explicitNonClaims,
      exportFraming,
    });
  }

  return buildNonSituationEnvelope(
    o,
    exportKind,
    {
      generatedAt,
      subjectRef,
      sourceContractIds,
      explicitNonClaims,
      exportFraming,
    },
  );
}

function buildSituationRoomModel(
  o: Record<string, unknown>,
  base: {
    generatedAt: string;
    subjectRef: Record<string, unknown>;
    sourceContractIds: string[];
    explicitNonClaims: string[];
    exportFraming: string;
  },
): EvidenceReplayJsonResult {
  const warnings: string[] = [];
  let nested: Record<string, unknown> | null = null;

  if (!("nested" in o) || o.nested === null || o.nested === undefined) {
    warnings.push("nested situation pack payload missing — partial replay only.");
  } else if (typeof o.nested !== "object" || Array.isArray(o.nested)) {
    warnings.push("nested payload is not an object — partial replay only.");
  } else {
    nested = o.nested as Record<string, unknown>;
  }

  const partial = warnings.length > 0;

  const model: SituationRoomReplayModel = {
    contractId: EVIDENCE_EXPORT_ENVELOPE_CONTRACT_ID,
    exportKind: "situation_room",
    subjectRef: base.subjectRef,
    generatedAt: base.generatedAt,
    sourceContractIds: base.sourceContractIds,
    explicitNonClaims: base.explicitNonClaims,
    exportFraming: base.exportFraming,
    nested,
    partial,
    parseWarnings: warnings,
  };

  return { status: "ok", model };
}

function buildNonSituationEnvelope(
  o: Record<string, unknown>,
  exportKind: Exclude<EvidenceExportKind, "situation_room">,
  base: {
    generatedAt: string;
    subjectRef: Record<string, unknown>;
    sourceContractIds: string[];
    explicitNonClaims: string[];
    exportFraming: string;
  },
): EvidenceReplayJsonResult {
  const warnings = [
    `export_kind "${exportKind}" — v1 parse adapter specializes situation_room; envelope-only replay.`,
  ];
  let nested: Record<string, unknown> | null = null;
  if ("nested" in o && o.nested !== null && o.nested !== undefined) {
    if (typeof o.nested === "object" && !Array.isArray(o.nested)) {
      nested = o.nested as Record<string, unknown>;
    } else {
      warnings.push("nested payload is not an object — dropped from replay model.");
    }
  } else {
    warnings.push("nested payload missing — partial replay only.");
  }

  const model: GenericEvidenceReplayEnvelope = {
    contractId: EVIDENCE_EXPORT_ENVELOPE_CONTRACT_ID,
    exportKind,
    subjectRef: base.subjectRef,
    generatedAt: base.generatedAt,
    sourceContractIds: base.sourceContractIds,
    explicitNonClaims: base.explicitNonClaims,
    exportFraming: base.exportFraming,
    nested,
    partial: true,
    parseWarnings: warnings,
  };

  return { status: "ok", model };
}

/**
 * When the UI expects a specific export (e.g. user opened from situation-room flow), validate kind.
 */
export function assertExportKindMatches(
  model: EvidenceReplayModel,
  expected: EvidenceExportKind,
): EvidenceReplayJsonResult {
  if (model.exportKind === expected) {
    return { status: "ok", model };
  }
  return {
    status: "error",
    error: err(
      "export_kind_mismatch",
      `Export is ${model.exportKind}; expected ${expected}.`,
    ),
  };
}

/**
 * Markdown companion exports: **no** structured guarantee — read-only prose + light hints.
 * Optional ```json fence may be parsed separately with **`parseEvidenceExportJson`**.
 */
export function parseEvidenceExportMarkdown(raw: string): EvidenceReplayMarkdownResult {
  const bodyText = raw.trim();
  if (!bodyText) {
    return { status: "error", error: err("invalid_json", "Markdown export is empty.") };
  }

  const firstLine = bodyText.split("\n")[0] ?? "";
  const m = /^#\s*Evidence export:\s*(\w+)/.exec(firstLine);
  const inferredExportKind = m ? m[1] : null;
  const hasStructuredJsonFence = bodyText.includes("```json");

  const warnings: string[] = [
    "Markdown companion — structured replay fidelity is weaker than JSON; this is not live product data.",
  ];
  if (!hasStructuredJsonFence) {
    warnings.push("No ```json fence found — nested contract bodies may be prose-only.");
  }

  return {
    status: "markdown_partial",
    bodyText,
    inferredExportKind,
    hasStructuredJsonFence,
    parseWarnings: warnings,
  };
}
