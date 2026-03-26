import { useCallback, useState } from "react";

import {
  downloadChangeSafetyCase,
  type ChangeSafetyCaseDownloadFormat,
  type ChangeSafetyCaseDownloadTarget,
} from "../lib/change-safety-case-download";

export interface ChangeSafetyCaseActionsProps {
  target: ChangeSafetyCaseDownloadTarget;
}

/**
 * Download change_safety_case_v1 JSON/Markdown from app-api — report-route packaging only.
 * Not evidence_export_v1, not briefing_export_bundle_v1, not Evidence replay.
 */
export function ChangeSafetyCaseActions({ target }: ChangeSafetyCaseActionsProps) {
  const [busy, setBusy] = useState<ChangeSafetyCaseDownloadFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (format: ChangeSafetyCaseDownloadFormat) => {
      setError(null);
      setBusy(format);
      try {
        await downloadChangeSafetyCase(target, format);
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
    <div className="change-safety-case-actions" data-testid="change-safety-case-actions">
      <div className="change-safety-case-actions__buttons" role="group" aria-label="Download change safety case">
        <button
          type="button"
          className="change-safety-case-actions__btn"
          disabled={busy !== null}
          aria-busy={busy === "json"}
          onClick={() => void run("json")}
        >
          {busy === "json" ? "Preparing JSON…" : "Download case (JSON)"}
        </button>
        <button
          type="button"
          className="change-safety-case-actions__btn"
          disabled={busy !== null}
          aria-busy={busy === "markdown"}
          onClick={() => void run("markdown")}
        >
          {busy === "markdown" ? "Preparing Markdown…" : "Download case (Markdown)"}
        </button>
      </div>
      <p className="change-safety-case-actions__hint">
        <strong>change_safety_case_v1</strong> — pre-change evidence posture from existing read assemblies.{" "}
        <strong>Not</strong> <code>impact_report_v1</code> (communication packaging). <strong>Not</strong>{" "}
        <code>evidence_export_v1</code>, <strong>not</strong> briefing bundle, <strong>not</strong> Evidence replay. JSON
        is canonical; Markdown embeds the same payload.
      </p>
      {error ? (
        <p className="change-safety-case-actions__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
