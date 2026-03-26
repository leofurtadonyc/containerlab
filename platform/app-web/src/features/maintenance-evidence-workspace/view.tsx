import { useCallback, useEffect, useMemo, useState } from "react";

import type { MaintenancePreviewContext } from "../../api/contracts";
import { ApiClientError, type MaintenancePreviewQuery } from "../../api/client";
import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { APP_URL_SEARCH_CHANGED } from "../../lib/url-app-state";
import {
  navigateToMaintenanceEvidenceWorkspace,
  readMaintenancePreviewSubjectFromSearch,
  type MaintenancePreviewSubject,
} from "../../lib/maintenance-evidence-workspace-navigation";
import { MaintenanceEvidenceWorkspaceProduct } from "./maintenance-evidence-workspace-product";
import { useMaintenanceEvidenceWorkspaceQuery } from "./api";

const INVALID_MAINTENANCE_SUBJECT_ERROR = new ApiClientError(
  "Invalid subject parameters: use only one of maintenance_node_id, maintenance_link_id, or maintenance_object_id with maintenance_object_kind.",
  422,
  "shell_validation",
);

function readSearch(): string {
  return typeof window !== "undefined" ? window.location.search : "";
}

function subjectToClientQuery(subject: MaintenancePreviewSubject): MaintenancePreviewQuery | null {
  if (subject.kind === "invalid") {
    return null;
  }
  if (subject.kind === "node") {
    return { nodeId: subject.nodeId, previewContext: subject.previewContext };
  }
  if (subject.kind === "link") {
    return { linkId: subject.linkId, previewContext: subject.previewContext };
  }
  return {
    objectId: subject.objectId,
    objectKind: subject.objectKind,
    previewContext: subject.previewContext,
  };
}

export function MaintenanceEvidenceWorkspaceView() {
  const [search, setSearch] = useState(readSearch);

  const syncFromUrl = useCallback(() => {
    setSearch(readSearch());
  }, []);

  useEffect(() => {
    window.addEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
    return () => window.removeEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
  }, [syncFromUrl]);

  const subject = useMemo(() => readMaintenancePreviewSubjectFromSearch(search), [search]);
  const clientQuery = useMemo(() => (subject ? subjectToClientQuery(subject) : null), [subject]);
  const enabled = subject != null && subject.kind !== "invalid" && clientQuery != null;

  const workspaceQuery = useMaintenanceEvidenceWorkspaceQuery(clientQuery, enabled);
  const reload = workspaceQuery.reload;

  if (subject?.kind === "invalid") {
    return (
      <section className="maintenance-preview-route maintenance-preview-route--error">
        <h2>Maintenance evidence workspace</h2>
        <ErrorState error={INVALID_MAINTENANCE_SUBJECT_ERROR} onRetry={syncFromUrl} />
        <p className="table-note">
          <button type="button" className="inline-action" onClick={() => navigateToMaintenanceEvidenceWorkspace()}>
            Clear subject params
          </button>
        </p>
      </section>
    );
  }

  if (!subject) {
    return (
      <section className="maintenance-preview-route maintenance-preview-route--setup">
        <h2>Maintenance evidence workspace</h2>
        <MaintenanceEvidenceWorkspaceSetupForm />
      </section>
    );
  }

  if (workspaceQuery.isLoading && !workspaceQuery.data) {
    return (
      <section className="maintenance-preview-route maintenance-preview-route--loading">
        <h2>Maintenance evidence workspace</h2>
        <LoadingState label="Loading maintenance_evidence_workspace_v1 assembly from app-api." />
      </section>
    );
  }

  if (workspaceQuery.error) {
    return (
      <section className="maintenance-preview-route maintenance-preview-route--error">
        <h2>Maintenance evidence workspace</h2>
        <ErrorState error={workspaceQuery.error} onRetry={reload} />
        <p className="table-note">
          <button type="button" className="inline-action" onClick={() => navigateToMaintenanceEvidenceWorkspace()}>
            Change subject
          </button>
        </p>
      </section>
    );
  }

  if (!workspaceQuery.data) {
    return (
      <section className="maintenance-preview-route maintenance-preview-route--empty">
        <h2>Maintenance evidence workspace</h2>
        <EmptyState title="No payload" description="The workspace request did not return a body." />
      </section>
    );
  }

  return (
    <section className="maintenance-preview-route">
      <p className="table-note maintenance-preview-subject-bar">
        <span>
          Subject: <code>{workspaceQuery.data.object_kind}</code> ·{" "}
          <strong>{workspaceQuery.data.maintenance_preview.subject.display_name}</strong> (
          <code>{workspaceQuery.data.object_id}</code>)
        </span>
        <button type="button" className="inline-action" onClick={() => navigateToMaintenanceEvidenceWorkspace()}>
          Change subject
        </button>
      </p>
      <MaintenanceEvidenceWorkspaceProduct data={workspaceQuery.data} onReload={reload} />
    </section>
  );
}

const CONTEXT_OPTIONS: { value: MaintenancePreviewContext; label: string }[] = [
  { value: "explicit_subject", label: "Explicit subject" },
  { value: "planning_window", label: "Planning window (framing)" },
  { value: "topology_drilldown", label: "Topology drilldown (framing)" },
  { value: "change_adjacent", label: "Change-adjacent (framing)" },
];

function MaintenanceEvidenceWorkspaceSetupForm() {
  const [mode, setMode] = useState<"node" | "link">("node");
  const [objectId, setObjectId] = useState("");
  const [previewContext, setPreviewContext] = useState<MaintenancePreviewContext>("explicit_subject");

  const apply = useCallback(() => {
    const trimmed = objectId.trim();
    if (!trimmed) {
      return;
    }
    if (mode === "node") {
      navigateToMaintenanceEvidenceWorkspace({ nodeId: trimmed, previewContext });
    } else {
      navigateToMaintenanceEvidenceWorkspace({ linkId: trimmed, previewContext });
    }
  }, [mode, objectId, previewContext]);

  return (
    <div className="maintenance-preview-setup">
      <p className="body-copy">
        Choose a <strong>topology node_id</strong> or <strong>link_id</strong> from the current normalized snapshot.
        This workspace composes <code>maintenance_preview_v1</code>, optional dossier / timeline / delta, and{" "}
        <code>change_safety_case_v1</code> — read-only interpretation support; <strong>not</strong> approval,
        simulation, or <code>evidence_export_v1</code>.
      </p>
      <div className="maintenance-preview-setup__row">
        <label className="maintenance-preview-setup__label">
          Subject kind
          <div className="maintenance-preview-setup__radios">
            <label>
              <input
                type="radio"
                name="mew-kind"
                checked={mode === "node"}
                onChange={() => setMode("node")}
              />{" "}
              Node
            </label>
            <label>
              <input
                type="radio"
                name="mew-kind"
                checked={mode === "link"}
                onChange={() => setMode("link")}
              />{" "}
              Link
            </label>
          </div>
        </label>
      </div>
      <div className="maintenance-preview-setup__row">
        <label className="maintenance-preview-setup__label" htmlFor="mew-object-id">
          node_id or link_id
        </label>
        <input
          id="mew-object-id"
          className="maintenance-preview-setup__input"
          type="text"
          placeholder={mode === "node" ? "e.g. PE1" : "e.g. P1--PE1"}
          value={objectId}
          onChange={(e) => setObjectId(e.target.value)}
        />
      </div>
      <div className="maintenance-preview-setup__row">
        <label className="maintenance-preview-setup__label" htmlFor="mew-ctx">
          Preview context (framing only)
        </label>
        <select
          id="mew-ctx"
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
      <button type="button" className="maintenance-preview-setup__submit" onClick={apply}>
        Load maintenance evidence workspace
      </button>
    </div>
  );
}
