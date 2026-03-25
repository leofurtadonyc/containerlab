import { useCallback, useState } from "react";

import {
  downloadImpactReport,
  type ImpactReportDownloadFormat,
  type ImpactReportDownloadTarget,
} from "../lib/impact-report-download";

export interface ImpactReportActionsProps {
  target: ImpactReportDownloadTarget;
}

/**
 * Download impact_report_v1 JSON/Markdown from app-api — communication packaging only.
 * Not evidence_export_v1, not briefing_export_bundle_v1, not Evidence replay.
 */
export function ImpactReportActions({ target }: ImpactReportActionsProps) {
  const [busy, setBusy] = useState<ImpactReportDownloadFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (format: ImpactReportDownloadFormat) => {
      setError(null);
      setBusy(format);
      try {
        await downloadImpactReport(target, format);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Download failed.";
        setError(msg);
      } finally {
        setBusy(null);
      }
    },
    [target],
  );

  return (
    <div className="impact-report-actions" data-testid="impact-report-actions">
      <div className="impact-report-actions__buttons" role="group" aria-label="Download impact report">
        <button
          type="button"
          className="impact-report-actions__btn"
          disabled={busy !== null}
          aria-busy={busy === "json"}
          onClick={() => void run("json")}
        >
          {busy === "json" ? "Preparing JSON…" : "Download report (JSON)"}
        </button>
        <button
          type="button"
          className="impact-report-actions__btn"
          disabled={busy !== null}
          aria-busy={busy === "markdown"}
          onClick={() => void run("markdown")}
        >
          {busy === "markdown" ? "Preparing Markdown…" : "Download report (Markdown)"}
        </button>
      </div>
      <p className="impact-report-actions__hint">
        <strong>impact_report_v1</strong> — reuses existing Phase 2 assemblies for handoff.{" "}
        <strong>Not</strong> <code>evidence_export_v1</code>, <strong>not</strong> briefing bundle,{" "}
        <strong>not</strong> Evidence replay. JSON is canonical; Markdown embeds the same payload.
      </p>
      {error ? (
        <p className="impact-report-actions__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
