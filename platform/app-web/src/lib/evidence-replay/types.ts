/**
 * Client-side view models for evidence replay (`evidence_replay_viewer_v1`).
 * Parsed exports are **never** live platform truth — see `platform/docs/evidence-replay-viewer-contract.md`.
 */

export const EVIDENCE_EXPORT_ENVELOPE_CONTRACT_ID = "evidence_export_v1" as const;

export const EVIDENCE_REPLAY_VIEWER_CONTRACT_ID = "evidence_replay_viewer_v1" as const;

/** Re-export envelope kinds aligned with `evidence_export_v1`. */
export type EvidenceExportKind =
  | "policy_dossier"
  | "topology_object_dossier"
  | "situation_room"
  | "investigation_workspace";

export type EvidenceReplayParseErrorCode =
  | "not_json"
  | "invalid_json"
  | "missing_contract_id"
  | "unsupported_envelope_contract"
  | "unsupported_export_kind"
  | "export_kind_mismatch"
  /** Root JSON is `impact_report_v1` from `/api/v1/reports/...` — not an `evidence_export_v1` envelope. */
  | "impact_report_not_evidence_export"
  /** Root JSON is `change_safety_case_v1` from `/api/v1/reports/change-safety-case/...` — not an `evidence_export_v1` envelope. */
  | "change_safety_case_not_evidence_export";

export interface EvidenceReplayParseError {
  code: EvidenceReplayParseErrorCode;
  message: string;
}

/** Envelope fields shared by all successful JSON parses. */
export interface EvidenceReplayEnvelopeView {
  contractId: typeof EVIDENCE_EXPORT_ENVELOPE_CONTRACT_ID;
  exportKind: EvidenceExportKind;
  subjectRef: Record<string, unknown>;
  generatedAt: string;
  sourceContractIds: string[];
  explicitNonClaims: string[];
  exportFraming: string;
  /**
   * When true, nested payload was absent or could not be mapped — still **replay**, not live.
   */
  partial: boolean;
  parseWarnings: string[];
}

export interface SituationRoomReplayModel extends EvidenceReplayEnvelopeView {
  exportKind: "situation_room";
  /** Situation pack assembly (`evidence_pack_phase2_v1` family) or null if missing. */
  nested: Record<string, unknown> | null;
}

/**
 * Envelope-level replay for non–situation-room kinds (v1 adapter: envelope + optional nested blob).
 */
export interface GenericEvidenceReplayEnvelope extends EvidenceReplayEnvelopeView {
  exportKind: Exclude<EvidenceExportKind, "situation_room">;
  nested: Record<string, unknown> | null;
}

export type EvidenceReplayModel = SituationRoomReplayModel | GenericEvidenceReplayEnvelope;

export type EvidenceReplayJsonResult =
  | { status: "ok"; model: EvidenceReplayModel }
  | { status: "error"; error: EvidenceReplayParseError };

export interface EvidenceReplayMarkdownPartial {
  status: "markdown_partial";
  /** Raw markdown for read-only display. */
  bodyText: string;
  /** From `# Evidence export: situation_room` line when present. */
  inferredExportKind: string | null;
  /** True when a ```json fence exists (may still fail JSON parse). */
  hasStructuredJsonFence: boolean;
  parseWarnings: string[];
}

export type EvidenceReplayMarkdownResult =
  | EvidenceReplayMarkdownPartial
  | { status: "error"; error: EvidenceReplayParseError };
