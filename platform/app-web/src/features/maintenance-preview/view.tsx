import { useCallback, useEffect, useMemo, useState } from "react";

import type { MaintenancePreviewContext } from "../../api/contracts";
import { ApiClientError, type MaintenancePreviewQuery } from "../../api/client";
import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { APP_URL_SEARCH_CHANGED } from "../../lib/url-app-state";
import {
  navigateToMaintenancePreview,
  readMaintenancePreviewSubjectFromSearch,
  type MaintenancePreviewSubject,
} from "../../lib/maintenance-preview-navigation";
import { MaintenancePreviewProduct } from "./maintenance-preview-product";
import { useMaintenancePreviewQuery } from "./api";

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

export function MaintenancePreviewView() {
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

  const previewQuery = useMaintenancePreviewQuery(clientQuery, enabled);
  const reload = previewQuery.reload;

  if (subject?.kind === "invalid") {
    return (
      <section className="maintenance-preview-route maintenance-preview-route--error">
        <h2>Maintenance Preview</h2>
        <ErrorState error={INVALID_MAINTENANCE_SUBJECT_ERROR} onRetry={syncFromUrl} />
        <p className="table-note">
          <button type="button" className="inline-action" onClick={() => navigateToMaintenancePreview()}>
            Clear subject params
          </button>
        </p>
      </section>
    );
  }

  if (!subject) {
    return (
      <section className="maintenance-preview-route maintenance-preview-route--setup">
        <h2>Maintenance Preview</h2>
        <MaintenancePreviewSetupForm />
      </section>
    );
  }

  if (previewQuery.isLoading && !previewQuery.data) {
    return (
      <section className="maintenance-preview-route maintenance-preview-route--loading">
        <h2>Maintenance Preview</h2>
        <LoadingState label="Loading maintenance_preview_v1 assembly from app-api." />
      </section>
    );
  }

  if (previewQuery.error) {
    return (
      <section className="maintenance-preview-route maintenance-preview-route--error">
        <h2>Maintenance Preview</h2>
        <ErrorState error={previewQuery.error} onRetry={reload} />
        <p className="table-note">
          <button type="button" className="inline-action" onClick={() => navigateToMaintenancePreview()}>
            Change subject
          </button>
        </p>
      </section>
    );
  }

  if (!previewQuery.data) {
    return (
      <section className="maintenance-preview-route maintenance-preview-route--empty">
        <h2>Maintenance Preview</h2>
        <EmptyState title="No payload" description="The preview request did not return a body." />
      </section>
    );
  }

  return (
    <section className="maintenance-preview-route">
      <p className="table-note maintenance-preview-subject-bar">
        <span>
          Subject: <code>{previewQuery.data.subject.object_kind}</code> ·{" "}
          <strong>{previewQuery.data.subject.display_name}</strong> (<code>{previewQuery.data.subject.object_id}</code>)
        </span>
        <button type="button" className="inline-action" onClick={() => navigateToMaintenancePreview()}>
          Change subject
        </button>
      </p>
      <MaintenancePreviewProduct data={previewQuery.data} onReload={reload} />
    </section>
  );
}

const CONTEXT_OPTIONS: { value: MaintenancePreviewContext; label: string }[] = [
  { value: "explicit_subject", label: "Explicit subject" },
  { value: "planning_window", label: "Planning window (framing)" },
  { value: "topology_drilldown", label: "Topology drilldown (framing)" },
  { value: "change_adjacent", label: "Change-adjacent (framing)" },
];

function MaintenancePreviewSetupForm() {
  const [mode, setMode] = useState<"node" | "link">("node");
  const [objectId, setObjectId] = useState("");
  const [previewContext, setPreviewContext] = useState<MaintenancePreviewContext>("explicit_subject");

  const apply = useCallback(() => {
    const trimmed = objectId.trim();
    if (!trimmed) {
      return;
    }
    if (mode === "node") {
      navigateToMaintenancePreview({ nodeId: trimmed, previewContext });
    } else {
      navigateToMaintenancePreview({ linkId: trimmed, previewContext });
    }
  }, [mode, objectId, previewContext]);

  return (
    <div className="maintenance-preview-setup">
      <p className="body-copy">
        Choose a <strong>topology node_id</strong> or <strong>link_id</strong> from the current normalized snapshot.
        This workspace composes existing read evidence only—it is <strong>not</strong> maintenance approval,
        validation, or simulation.
      </p>
      <div className="maintenance-preview-setup__row">
        <label className="maintenance-preview-setup__label">
          Subject kind
          <div className="maintenance-preview-setup__radios">
            <label>
              <input
                type="radio"
                name="mp-kind"
                checked={mode === "node"}
                onChange={() => setMode("node")}
              />{" "}
              Node
            </label>
            <label>
              <input
                type="radio"
                name="mp-kind"
                checked={mode === "link"}
                onChange={() => setMode("link")}
              />{" "}
              Link
            </label>
          </div>
        </label>
      </div>
      <div className="maintenance-preview-setup__row">
        <label className="maintenance-preview-setup__label" htmlFor="mp-object-id">
          node_id or link_id
        </label>
        <input
          id="mp-object-id"
          className="maintenance-preview-setup__input"
          type="text"
          placeholder={mode === "node" ? "e.g. PE1" : "e.g. P1--PE1"}
          value={objectId}
          onChange={(e) => setObjectId(e.target.value)}
        />
      </div>
      <div className="maintenance-preview-setup__row">
        <label className="maintenance-preview-setup__label" htmlFor="mp-ctx">
          Preview context (framing only)
        </label>
        <select
          id="mp-ctx"
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
        Load maintenance preview
      </button>
    </div>
  );
}
