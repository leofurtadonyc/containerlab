import { useCallback, useEffect, useState } from "react";

import {
  mergeAuditHistoryReadSideQuery,
  mergeDevicesPoliciesReadSideQuery,
  mergeWorkflowHistoryReadSideQuery,
  parseAuditHistoryReadSideQuery,
  parseDevicesPoliciesReadSideQuery,
  parseWorkflowHistoryReadSideQuery,
  READ_SIDE_HISTORY_RECENT_LIMIT_MAX,
  READ_SIDE_PRIMARY_LIST_LIMIT_MAX,
  READ_SIDE_READINESS_SNAPSHOT_HISTORY_MAX,
  READ_SIDE_SYNC_RUNS_LIMIT_MAX,
  type AuditHistoryReadSideQuery,
  type DevicesPoliciesReadSideQuery,
  type WorkflowHistoryReadSideQuery,
} from "../api/read-side-query-params";
import { useReplaceUrlSearchParams, useUrlSearchParamsKey } from "../lib/use-url-search-params";

type PanelVariant = "devices-policies" | "workflow-history" | "audit-history";

function optionalIntInput(
  raw: string,
  min: number,
  max: number,
): number | undefined | "invalid" {
  const t = raw.trim();
  if (t === "") {
    return undefined;
  }
  const n = Number.parseInt(t, 10);
  if (!Number.isFinite(n) || n < min || n > max) {
    return "invalid";
  }
  return n;
}

export interface ReadSideQueryPanelProps {
  variant: PanelVariant;
}

export function ReadSideQueryPanel({ variant }: ReadSideQueryPanelProps) {
  const searchKey = useUrlSearchParamsKey();
  const replaceParams = useReplaceUrlSearchParams();

  const [limitInput, setLimitInput] = useState("");
  const [historyRecentInput, setHistoryRecentInput] = useState("");
  const [syncRunsInput, setSyncRunsInput] = useState("");
  const [readinessInput, setReadinessInput] = useState("");
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(searchKey);
    setApplyError(null);
    if (variant === "devices-policies") {
      const p = parseDevicesPoliciesReadSideQuery(sp);
      setLimitInput(p.limit !== undefined ? String(p.limit) : "");
      setHistoryRecentInput(
        p.history_recent_limit !== undefined ? String(p.history_recent_limit) : "",
      );
      setSyncRunsInput("");
      setReadinessInput("");
      return;
    }
    if (variant === "workflow-history") {
      const p = parseWorkflowHistoryReadSideQuery(sp);
      setLimitInput(p.limit !== undefined ? String(p.limit) : "");
      setSyncRunsInput(p.sync_runs_limit !== undefined ? String(p.sync_runs_limit) : "");
      setHistoryRecentInput("");
      setReadinessInput("");
      return;
    }
    const p = parseAuditHistoryReadSideQuery(sp);
    setLimitInput(p.limit !== undefined ? String(p.limit) : "");
    setSyncRunsInput(p.sync_runs_limit !== undefined ? String(p.sync_runs_limit) : "");
    setReadinessInput(
      p.readiness_snapshot_history_limit !== undefined
        ? String(p.readiness_snapshot_history_limit)
        : "",
    );
    setHistoryRecentInput("");
  }, [searchKey, variant]);

  const applyDevicesPolicies = useCallback(() => {
    const lim = optionalIntInput(limitInput, 1, READ_SIDE_PRIMARY_LIST_LIMIT_MAX);
    const hr = optionalIntInput(historyRecentInput, 1, READ_SIDE_HISTORY_RECENT_LIMIT_MAX);
    if (lim === "invalid" || hr === "invalid") {
      setApplyError("Enter integers within the allowed bounds, or leave fields empty for defaults.");
      return;
    }
    const next: DevicesPoliciesReadSideQuery = {};
    if (lim !== undefined) next.limit = lim;
    if (hr !== undefined) next.history_recent_limit = hr;
    const merged = mergeDevicesPoliciesReadSideQuery(
      new URLSearchParams(searchKey),
      next,
    );
    replaceParams(merged);
  }, [historyRecentInput, limitInput, replaceParams, searchKey]);

  const applyWorkflow = useCallback(() => {
    const lim = optionalIntInput(limitInput, 1, READ_SIDE_PRIMARY_LIST_LIMIT_MAX);
    const sr = optionalIntInput(syncRunsInput, 1, READ_SIDE_SYNC_RUNS_LIMIT_MAX);
    if (lim === "invalid" || sr === "invalid") {
      setApplyError("Enter integers within the allowed bounds, or leave fields empty for defaults.");
      return;
    }
    const next: WorkflowHistoryReadSideQuery = {};
    if (lim !== undefined) next.limit = lim;
    if (sr !== undefined) next.sync_runs_limit = sr;
    const merged = mergeWorkflowHistoryReadSideQuery(
      new URLSearchParams(searchKey),
      next,
    );
    replaceParams(merged);
  }, [limitInput, replaceParams, searchKey, syncRunsInput]);

  const applyAudit = useCallback(() => {
    const lim = optionalIntInput(limitInput, 1, READ_SIDE_PRIMARY_LIST_LIMIT_MAX);
    const sr = optionalIntInput(syncRunsInput, 1, READ_SIDE_SYNC_RUNS_LIMIT_MAX);
    const rd = optionalIntInput(
      readinessInput,
      1,
      READ_SIDE_READINESS_SNAPSHOT_HISTORY_MAX,
    );
    if (lim === "invalid" || sr === "invalid" || rd === "invalid") {
      setApplyError("Enter integers within the allowed bounds, or leave fields empty for defaults.");
      return;
    }
    const next: AuditHistoryReadSideQuery = {};
    if (lim !== undefined) next.limit = lim;
    if (sr !== undefined) next.sync_runs_limit = sr;
    if (rd !== undefined) next.readiness_snapshot_history_limit = rd;
    const merged = mergeAuditHistoryReadSideQuery(new URLSearchParams(searchKey), next);
    replaceParams(merged);
  }, [limitInput, readinessInput, replaceParams, searchKey, syncRunsInput]);

  const onApply = () => {
    setApplyError(null);
    if (variant === "devices-policies") {
      applyDevicesPolicies();
      return;
    }
    if (variant === "workflow-history") {
      applyWorkflow();
      return;
    }
    applyAudit();
  };

  const onClear = () => {
    setApplyError(null);
    const sp = new URLSearchParams(searchKey);
    sp.delete("limit");
    sp.delete("history_recent_limit");
    sp.delete("sync_runs_limit");
    sp.delete("readiness_snapshot_history_limit");
    replaceParams(sp);
  };

  const title =
    variant === "devices-policies"
      ? "Read-side query (devices / policies API)"
      : variant === "workflow-history"
        ? "Read-side query (workflow-history API)"
        : "Read-side query (audit-history API)";

  return (
    <div className="read-side-query-panel" role="region" aria-label={title}>
      <p className="read-side-query-panel-title">{title}</p>
      <p className="read-side-query-panel-copy">
        Values are stored in the page URL for shareable, read-only filtered views. Empty fields use
        backend defaults.
      </p>
      <div className="read-side-query-panel-grid">
        <label className="read-side-query-field">
          <span>
            limit (1–{READ_SIDE_PRIMARY_LIST_LIMIT_MAX}, optional <code>items</code> cap)
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={limitInput}
            onChange={(e) => setLimitInput(e.target.value)}
            autoComplete="off"
          />
        </label>
        {variant === "devices-policies" && (
          <label className="read-side-query-field">
            <span>
              history_recent_limit (1–{READ_SIDE_HISTORY_RECENT_LIMIT_MAX})
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={historyRecentInput}
              onChange={(e) => setHistoryRecentInput(e.target.value)}
              autoComplete="off"
            />
          </label>
        )}
        {(variant === "workflow-history" || variant === "audit-history") && (
          <label className="read-side-query-field">
            <span>sync_runs_limit (1–{READ_SIDE_SYNC_RUNS_LIMIT_MAX})</span>
            <input
              type="text"
              inputMode="numeric"
              value={syncRunsInput}
              onChange={(e) => setSyncRunsInput(e.target.value)}
              autoComplete="off"
            />
          </label>
        )}
        {variant === "audit-history" && (
          <label className="read-side-query-field">
            <span>
              readiness_snapshot_history_limit (1–{READ_SIDE_READINESS_SNAPSHOT_HISTORY_MAX})
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={readinessInput}
              onChange={(e) => setReadinessInput(e.target.value)}
              autoComplete="off"
            />
          </label>
        )}
      </div>
      <div className="read-side-query-panel-actions">
        <button type="button" className="read-side-query-apply" onClick={onApply}>
          Apply to URL
        </button>
        <button type="button" className="read-side-query-clear" onClick={onClear}>
          Clear query params
        </button>
      </div>
      {applyError ? <p className="read-side-query-error">{applyError}</p> : null}
    </div>
  );
}
