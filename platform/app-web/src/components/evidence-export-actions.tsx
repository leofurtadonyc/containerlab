import { useCallback, useState } from "react";

import {
  downloadEvidenceExport,
  type EvidenceExportFormat,
  type EvidenceExportTarget,
} from "../lib/evidence-export-download";

export interface EvidenceExportActionsProps {
  target: EvidenceExportTarget;
  /** Visual variant for button styling (matches surrounding surface). */
  variant?: "dossier" | "situation" | "investigation" | "briefing_bundle";
}

function buttonClass(variant: EvidenceExportActionsProps["variant"]): string {
  switch (variant) {
    case "situation":
      return "evidence-export-actions__btn evidence-export-actions__btn--situation";
    case "investigation":
      return "evidence-export-actions__btn evidence-export-actions__btn--investigation";
    case "briefing_bundle":
      return "evidence-export-actions__btn evidence-export-actions__btn--briefing-bundle";
    case "dossier":
    default:
      return "evidence-export-actions__btn evidence-export-actions__btn--dossier";
  }
}

function groupAriaLabel(variant: EvidenceExportActionsProps["variant"]): string {
  if (variant === "briefing_bundle") {
    return "Download operator briefing archive bundle (briefing_export_bundle_v1)";
  }
  return "Export bounded evidence snapshot";
}

function formatButtonLabel(
  variant: EvidenceExportActionsProps["variant"],
  format: EvidenceExportFormat,
  busy: boolean,
): string {
  if (variant === "briefing_bundle") {
    if (busy) {
      return format === "json" ? "Preparing bundle JSON…" : "Preparing bundle Markdown…";
    }
    return format === "json" ? "Download bundle (JSON)" : "Download bundle (Markdown)";
  }
  if (busy) {
    return format === "json" ? "Exporting JSON…" : "Exporting Markdown…";
  }
  return format === "json" ? "Export JSON" : "Export Markdown";
}

/**
 * Bounded snapshot download: same Phase 2 read assemblies as on-screen—not compliance artifacts,
 * tamper evidence, or operational authorization.
 */
export function EvidenceExportActions({ target, variant = "dossier" }: EvidenceExportActionsProps) {
  const [busy, setBusy] = useState<EvidenceExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const btn = buttonClass(variant);
  const testId =
    variant === "briefing_bundle" ? "briefing-bundle-export-actions" : "evidence-export-actions";

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
    <div className="evidence-export-actions" data-testid={testId}>
      <div className="evidence-export-actions__buttons" role="group" aria-label={groupAriaLabel(variant)}>
        <button
          type="button"
          className={btn}
          disabled={busy !== null}
          aria-busy={busy === "json"}
          onClick={() => void run("json")}
        >
          {formatButtonLabel(variant, "json", busy === "json")}
        </button>
        <button
          type="button"
          className={btn}
          disabled={busy !== null}
          aria-busy={busy === "markdown"}
          onClick={() => void run("markdown")}
        >
          {formatButtonLabel(variant, "markdown", busy === "markdown")}
        </button>
      </div>
      <p className="evidence-export-actions__hint">
        {variant === "briefing_bundle" ? (
          <>
            <strong>briefing_export_bundle_v1</strong> — one ordered file that wraps multiple{" "}
            <strong>evidence_export_v1</strong> members for this briefing context. It is a{" "}
            <strong>point-in-time archive</strong>, not this live page and not replay UI. Open individual member JSON
            in <strong>Evidence replay</strong> when you need frozen <strong>evidence_export_v1</strong> review. JSON is
            the lossless interchange; Markdown is a human companion.
          </>
        ) : (
          <>
            Snapshot for communication or records only—<strong>not</strong> compliance hold, tamper evidence, backup, or
            substitute for live views.
          </>
        )}
      </p>
      {error ? (
        <p className="evidence-export-actions__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
