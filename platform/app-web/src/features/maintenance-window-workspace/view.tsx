import { useCallback, useEffect, useMemo, useState } from "react";

import type { MaintenancePreviewContext } from "../../api/contracts";
import { ApiClientError, type MaintenanceWindowWorkspaceQuery } from "../../api/client";
import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { WorkspaceHeader } from "../../components/workspace-header";
import { APP_URL_SEARCH_CHANGED } from "../../lib/url-app-state";
import {
  MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS,
  navigateToMaintenanceWindowWorkspace,
  navigateToMaintenanceWindowWorkspaceSetup,
  readMaintenanceWindowSubjectsFromSearch,
  type MaintenanceWindowSubjectRef,
} from "../../lib/maintenance-window-workspace-navigation";
import { MaintenanceWindowWorkspaceProduct } from "./maintenance-window-workspace-product";
import { useMaintenanceWindowWorkspaceQuery } from "./api";

function readSearch(): string {
  return typeof window !== "undefined" ? window.location.search : "";
}

function urlStateToQuery(
  subjects: MaintenanceWindowSubjectRef[],
  previewContext: MaintenancePreviewContext,
  syncRunsLimit: number,
): MaintenanceWindowWorkspaceQuery {
  return { subjects, previewContext, syncRunsLimit };
}

export function MaintenanceWindowWorkspaceView() {
  const [search, setSearch] = useState(readSearch);

  const syncFromUrl = useCallback(() => {
    setSearch(readSearch());
  }, []);

  useEffect(() => {
    window.addEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
    return () => window.removeEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
  }, [syncFromUrl]);

  const urlState = useMemo(() => readMaintenanceWindowSubjectsFromSearch(search), [search]);
  const clientQuery = useMemo(() => {
    if (urlState.kind !== "ready") {
      return null;
    }
    return urlStateToQuery(urlState.subjects, urlState.previewContext, urlState.syncRunsLimit);
  }, [urlState]);

  const enabled = urlState.kind === "ready" && clientQuery != null;
  const workspaceQuery = useMaintenanceWindowWorkspaceQuery(clientQuery, enabled);
  const reload = workspaceQuery.reload;

  if (urlState.kind === "invalid") {
    return (
      <section className="workspace-page maintenance-preview-route maintenance-preview-route--error">
        <WorkspaceHeader
          eyebrow="Change & Safety"
          title="Maintenance window workspace"
          summary="Coordinate a bounded multi-subject maintenance window with explicit subject selection and safety framing."
        />
        <ErrorState
          error={
            new ApiClientError(
              urlState.reason,
              422,
              "shell_validation",
            )
          }
          onRetry={syncFromUrl}
        />
        <p className="table-note">
          <button type="button" className="inline-action" onClick={() => navigateToMaintenanceWindowWorkspaceSetup()}>
            Clear subject params
          </button>
        </p>
      </section>
    );
  }

  if (urlState.kind === "empty") {
    return (
      <section className="workspace-page maintenance-preview-route maintenance-preview-route--setup">
        <WorkspaceHeader
          eyebrow="Change & Safety"
          title="Maintenance window workspace"
          summary="Coordinate a bounded multi-subject maintenance window with explicit subject selection and safety framing."
        />
        <MaintenanceWindowWorkspaceSetupForm />
      </section>
    );
  }

  if (workspaceQuery.isLoading && !workspaceQuery.data) {
    return (
      <section className="workspace-page maintenance-preview-route maintenance-preview-route--loading">
        <WorkspaceHeader
          eyebrow="Change & Safety"
          title="Maintenance window workspace"
          summary="Coordinate a bounded multi-subject maintenance window with explicit subject selection and safety framing."
        />
        <LoadingState label="Loading maintenance_window_workspace_v1 assembly from app-api." />
      </section>
    );
  }

  if (workspaceQuery.error) {
    return (
      <section className="workspace-page maintenance-preview-route maintenance-preview-route--error">
        <WorkspaceHeader
          eyebrow="Change & Safety"
          title="Maintenance window workspace"
          summary="Coordinate a bounded multi-subject maintenance window with explicit subject selection and safety framing."
        />
        <ErrorState error={workspaceQuery.error} onRetry={reload} />
        <p className="table-note">
          <button type="button" className="inline-action" onClick={() => navigateToMaintenanceWindowWorkspaceSetup()}>
            Change subjects
          </button>
        </p>
      </section>
    );
  }

  if (!workspaceQuery.data) {
    return (
      <section className="workspace-page maintenance-preview-route maintenance-preview-route--empty">
        <WorkspaceHeader
          eyebrow="Change & Safety"
          title="Maintenance window workspace"
          summary="Coordinate a bounded multi-subject maintenance window with explicit subject selection and safety framing."
        />
        <EmptyState title="No payload" description="The workspace request did not return a body." />
      </section>
    );
  }

  return (
    <section className="workspace-page maintenance-preview-route">
      <WorkspaceHeader
        eyebrow="Change & Safety"
        title="Maintenance window workspace"
        summary="Coordinate a bounded multi-subject maintenance window without treating it as maintenance approval, execution, or simulation authority."
        actions={
          <div className="workspace-toolbar">
            <button
              type="button"
              className="shell-action-button shell-action-button--secondary"
              onClick={() => navigateToMaintenanceWindowWorkspaceSetup()}
            >
              Change subjects
            </button>
          </div>
        }
      />
      <p className="workspace-inline-note">
        Multi-subject <strong>planning support</strong> only. Use single-subject <strong>Maintenance Preview</strong> or{" "}
        <strong>Maintenance Evidence</strong> for deeper per-object drill-down.
      </p>
      <MaintenanceWindowWorkspaceProduct
        data={workspaceQuery.data}
        onReload={reload}
        onChangeSubjects={() => navigateToMaintenanceWindowWorkspaceSetup()}
      />
    </section>
  );
}

const CONTEXT_OPTIONS: { value: MaintenancePreviewContext; label: string }[] = [
  { value: "explicit_subject", label: "Explicit subject" },
  { value: "planning_window", label: "Planning window (framing)" },
  { value: "topology_drilldown", label: "Topology drilldown (framing)" },
  { value: "change_adjacent", label: "Change-adjacent (framing)" },
];

function emptyRows(): Array<{ id: number; mode: "node" | "link"; objectId: string }> {
  return [{ id: 1, mode: "node", objectId: "" }];
}

function MaintenanceWindowWorkspaceSetupForm() {
  const [rows, setRows] = useState(emptyRows);
  const [previewContext, setPreviewContext] = useState<MaintenancePreviewContext>("planning_window");
  const [syncRunsLimit, setSyncRunsLimit] = useState(20);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, { id: Math.max(0, ...prev.map((r) => r.id)) + 1, mode: "node", objectId: "" }]);
  }, []);

  const removeRow = useCallback((id: number) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }, []);

  const apply = useCallback(() => {
    const subjects: MaintenanceWindowSubjectRef[] = [];
    for (const row of rows) {
      const oid = row.objectId.trim();
      if (!oid) {
        continue;
      }
      subjects.push({ objectKind: row.mode, objectId: oid });
    }
    if (subjects.length === 0) {
      return;
    }
    navigateToMaintenanceWindowWorkspace({
      subjects,
      previewContext,
      syncRunsLimit,
    });
  }, [rows, previewContext, syncRunsLimit]);

  return (
    <div className="maintenance-preview-setup">
      <p className="body-copy">
        Add up to <strong>{MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS}</strong> topology <code>node_id</code> or{" "}
        <code>link_id</code> values from the current snapshot. The backend unions maintenance preview evidence across
        subjects — read-only planning support; <strong>not</strong> workflow, approval, or safe-to-change verdicts.
      </p>
      {rows.map((row, idx) => (
        <div key={row.id} className="maintenance-preview-setup__row maintenance-window-workspace-setup__row">
          <label className="maintenance-preview-setup__label">
            Subject {idx + 1}
            <div className="maintenance-preview-setup__radios">
              <label>
                <input
                  type="radio"
                  name={`mww-kind-${row.id}`}
                  checked={row.mode === "node"}
                  onChange={() =>
                    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, mode: "node" } : r)))
                  }
                />{" "}
                Node
              </label>
              <label>
                <input
                  type="radio"
                  name={`mww-kind-${row.id}`}
                  checked={row.mode === "link"}
                  onChange={() =>
                    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, mode: "link" } : r)))
                  }
                />{" "}
                Link
              </label>
            </div>
          </label>
          <input
            className="maintenance-preview-setup__input"
            type="text"
            placeholder={row.mode === "node" ? "e.g. PE1" : "e.g. P1--PE1"}
            value={row.objectId}
            onChange={(e) =>
              setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, objectId: e.target.value } : r)))
            }
          />
          <button type="button" className="inline-action" onClick={() => removeRow(row.id)}>
            Remove
          </button>
        </div>
      ))}
      <div className="maintenance-preview-setup__row">
        <button type="button" className="inline-action" onClick={addRow} disabled={rows.length >= MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS}>
          Add subject
        </button>
      </div>
      <div className="maintenance-preview-setup__row">
        <label className="maintenance-preview-setup__label" htmlFor="mww-ctx">
          Preview context (framing only)
        </label>
        <select
          id="mww-ctx"
          className="maintenance-preview-setup__select"
          value={previewContext}
          onChange={(e) => setPreviewContext(e.target.value as MaintenancePreviewContext)}
        >
          {CONTEXT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="maintenance-preview-setup__row">
        <label className="maintenance-preview-setup__label" htmlFor="mww-sync">
          sync_runs_limit (stability / consistency window)
        </label>
        <input
          id="mww-sync"
          className="maintenance-preview-setup__input"
          type="number"
          min={1}
          max={100}
          value={syncRunsLimit}
          onChange={(e) => setSyncRunsLimit(Number.parseInt(e.target.value, 10) || 20)}
        />
      </div>
      <button type="button" className="maintenance-preview-setup__submit" onClick={apply}>
        Load maintenance window workspace
      </button>
    </div>
  );
}
