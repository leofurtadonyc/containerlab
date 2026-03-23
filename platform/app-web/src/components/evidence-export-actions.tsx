import { useCallback, useState } from "react";

import {
  downloadEvidenceExport,
  type EvidenceExportFormat,
  type EvidenceExportTarget,
} from "../lib/evidence-export-download";

export interface EvidenceExportActionsProps {
  target: EvidenceExportTarget;
  /** Visual variant for button styling (matches surrounding surface). */
  variant?: "dossier" | "situation" | "investigation";
}

function buttonClass(variant: EvidenceExportActionsProps["variant"]): string {
  switch (variant) {
    case "situation":
      return "evidence-export-actions__btn evidence-export-actions__btn--situation";
    case "investigation":
      return "evidence-export-actions__btn evidence-export-actions__btn--investigation";
    case "dossier":
    default:
      return "evidence-export-actions__btn evidence-export-actions__btn--dossier";
  }
}

/**
 * Bounded snapshot download: same Phase 2 read assemblies as on-screen—not compliance artifacts,
 * tamper evidence, or operational authorization.
 */
export function EvidenceExportActions({ target, variant = "dossier" }: EvidenceExportActionsProps) {
  const [busy, setBusy] = useState<EvidenceExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const btn = buttonClass(variant);

  const run = useCallback(
    async (format: EvidenceExportFormat) => {
      setError(null);
      setBusy(format);
      try {
        await downloadEvidenceExport(target, format);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Export failed.";
        setError(msg);
      } finally {
        setBusy(null);
      }
    },
    [target],
  );

  return (
    <div className="evidence-export-actions" data-testid="evidence-export-actions">
      <div className="evidence-export-actions__buttons" role="group" aria-label="Export bounded evidence snapshot">
        <button
          type="button"
          className={btn}
          disabled={busy !== null}
          aria-busy={busy === "json"}
          onClick={() => void run("json")}
        >
          {busy === "json" ? "Exporting JSON…" : "Export JSON"}
        </button>
        <button
          type="button"
          className={btn}
          disabled={busy !== null}
          aria-busy={busy === "markdown"}
          onClick={() => void run("markdown")}
        >
          {busy === "markdown" ? "Exporting Markdown…" : "Export Markdown"}
        </button>
      </div>
      <p className="evidence-export-actions__hint">
        Snapshot for communication or records only—<strong>not</strong> compliance hold, tamper evidence, backup, or
        substitute for live views.
      </p>
      {error ? (
        <p className="evidence-export-actions__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
