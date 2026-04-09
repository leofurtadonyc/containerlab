import { useCallback, useState } from "react";

import type { WorkflowLifecycleStatus } from "../../api/contracts";
import { apiClient } from "../../api/client";
import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import { WorkspaceHeader } from "../../components/workspace-header";
import {
  mergeViewIntoSearch,
  replaceUrlSearchParams,
} from "../../lib/url-app-state";
import { formatDateTime } from "../../lib/presentation";
import {
  useWorkflowLifecycleDetailQuery,
  useWorkflowLifecycleListQuery,
  useWorkflowLifecycleTimelineQuery,
  useWorkflowLifecycleUrlSelection,
} from "./api";

const STATUSES: WorkflowLifecycleStatus[] = [
  "requested",
  "planned",
  "approved",
  "rejected",
  "dry_run_ready",
  "executing",
  "succeeded",
  "failed",
  "cancelled",
];

function setWorkflowLifecycleSelection(workflowId: string | null) {
  const sp = mergeViewIntoSearch(window.location.search, "workflow-lifecycle");
  if (workflowId) {
    sp.set("workflow_lifecycle_id", workflowId);
  } else {
    sp.delete("workflow_lifecycle_id");
  }
  replaceUrlSearchParams(sp);
}

export function WorkflowLifecycleView() {
  const { selectedId } = useWorkflowLifecycleUrlSelection();
  const listQuery = useWorkflowLifecycleListQuery();
  const detailQuery = useWorkflowLifecycleDetailQuery(selectedId);
  const timelineQuery = useWorkflowLifecycleTimelineQuery(selectedId);

  const [createType, setCreateType] = useState("platform_change");
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createStatus, setCreateStatus] = useState<WorkflowLifecycleStatus>("requested");
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [transitionNext, setTransitionNext] = useState<WorkflowLifecycleStatus>("planned");
  const [transitionReason, setTransitionReason] = useState("");
  const [transitionBusy, setTransitionBusy] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  const onSelectRow = useCallback((id: string) => {
    setWorkflowLifecycleSelection(id);
  }, []);

  const onClearSelection = useCallback(() => {
    setWorkflowLifecycleSelection(null);
  }, []);

  const onCreate = useCallback(async () => {
    setCreateError(null);
    setCreateBusy(true);
    try {
      const res = await apiClient.createWorkflowLifecycle({
        workflow_type: createType.trim() || "platform_change",
        title: createTitle.trim() || "Untitled workflow",
        description: createDescription.trim() || null,
        initial_status: createStatus,
        actor: "operator_webui",
        provenance: "operator",
      });
      setCreateTitle("");
      setCreateDescription("");
      await listQuery.reload();
      setWorkflowLifecycleSelection(res.workflow.workflow_id);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreateBusy(false);
    }
  }, [createType, createTitle, createDescription, createStatus, listQuery]);

  const onTransition = useCallback(async () => {
    if (!selectedId) {
      return;
    }
    setTransitionError(null);
    setTransitionBusy(true);
    try {
      await apiClient.transitionWorkflowLifecycle(selectedId, {
        next_status: transitionNext,
        reason: transitionReason.trim() || null,
        actor: "operator_webui",
        provenance: "operator",
      });
      setTransitionReason("");
      await Promise.all([detailQuery.reload(), timelineQuery.reload(), listQuery.reload()]);
    } catch (e) {
      setTransitionError(e instanceof Error ? e.message : "Transition failed");
    } finally {
      setTransitionBusy(false);
    }
  }, [selectedId, transitionNext, transitionReason, detailQuery, timelineQuery, listQuery]);

  const effectiveList = listQuery.data?.items ?? [];

  return (
    <div className="page-section workflow-lifecycle-view workspace-page">
      <WorkspaceHeader
        eyebrow="Change & Safety"
        title="Workflow lifecycle"
        summary="Manage durable backend-owned workflow lifecycle records without confusing them for sync-run history, dry-run validation, or network execution."
        actions={
          <div className="workspace-toolbar">
            <button
              type="button"
              className="shell-action-button shell-action-button--secondary"
              onClick={() => {
                const sp = mergeViewIntoSearch(window.location.search, "workflows");
                replaceUrlSearchParams(sp);
              }}
            >
              Open Workflows
            </button>
          </div>
        }
      />
      <p className="workspace-inline-note">
        Durable <strong>workflow lifecycle records</strong> are owned by the backend and stored in Postgres. This is
        <strong> not</strong> sync-run history, and Dry-run, validation, and network execution remain unimplemented.
      </p>

      <section className="panel workflow-lifecycle-create">
        <h3 className="panel-title">Create workflow record</h3>
        <p className="meta-copy">
          Bounded record management only — does not execute changes on devices or controllers.
        </p>
        <div className="workflow-lifecycle-form">
          <label>
            Type
            <input
              value={createType}
              onChange={(e) => setCreateType(e.target.value)}
              placeholder="e.g. platform_change"
            />
          </label>
          <label>
            Title
            <input
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="Short title"
            />
          </label>
          <label>
            Description (optional)
            <input
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              placeholder="Optional description"
            />
          </label>
          <label>
            Initial status
            <select
              value={createStatus}
              onChange={(e) => setCreateStatus(e.target.value as WorkflowLifecycleStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
        {createError ? <p className="workflow-lifecycle-error">{createError}</p> : null}
        <button type="button" className="inline-action" disabled={createBusy} onClick={() => void onCreate()}>
          {createBusy ? "Creating…" : "Create workflow record"}
        </button>
      </section>

      <div className="workflow-lifecycle-split">
        <section className="panel">
          <h3 className="panel-title">Lifecycle records</h3>
          {listQuery.isLoading ? <LoadingState label="Loading workflow lifecycle list…" /> : null}
          {listQuery.error ? (
            <ErrorState error={listQuery.error} onRetry={() => void listQuery.reload()} />
          ) : null}
          {!listQuery.isLoading && !listQuery.error && effectiveList.length === 0 ? (
            <EmptyState title="No workflow lifecycle records" description="Create one above." />
          ) : null}
          {!listQuery.isLoading && !listQuery.error && effectiveList.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {effectiveList.map((w) => (
                  <tr
                    key={w.workflow_id}
                    className={selectedId === w.workflow_id ? "workflow-lifecycle-row-selected" : undefined}
                  >
                    <td>
                      <button
                        type="button"
                        className="inline-action workflow-lifecycle-row-hit"
                        onClick={() => onSelectRow(w.workflow_id)}
                      >
                        <StatusPill value={w.workflow_status} />
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="inline-action workflow-lifecycle-row-hit"
                        onClick={() => onSelectRow(w.workflow_id)}
                      >
                        {w.workflow_type}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="inline-action workflow-lifecycle-row-hit"
                        onClick={() => onSelectRow(w.workflow_id)}
                      >
                        {w.title}
                      </button>
                    </td>
                    <td className="meta-copy">{formatDateTime(w.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </section>

        <section className="panel workflow-lifecycle-detail">
          <h3 className="panel-title">Detail & timeline</h3>
          {!selectedId ? (
            <EmptyState title="No workflow selected" description="Select a row from the list." />
          ) : null}
          {selectedId && detailQuery.isLoading ? <LoadingState label="Loading workflow…" /> : null}
          {selectedId && detailQuery.error ? (
            <ErrorState error={detailQuery.error} onRetry={() => void detailQuery.reload()} />
          ) : null}
          {selectedId && detailQuery.data ? (
            <div>
              <button type="button" className="inline-action" onClick={onClearSelection}>
                Clear selection
              </button>
              <dl className="detail-grid">
                <dt>id</dt>
                <dd>
                  <code>{detailQuery.data.workflow.workflow_id}</code>
                </dd>
                <dt>status</dt>
                <dd>
                  <StatusPill value={detailQuery.data.workflow.workflow_status} />
                </dd>
                <dt>type</dt>
                <dd>{detailQuery.data.workflow.workflow_type}</dd>
                <dt>title</dt>
                <dd>{detailQuery.data.workflow.title}</dd>
                <dt>description</dt>
                <dd>{detailQuery.data.workflow.description ?? "—"}</dd>
                <dt>actors</dt>
                <dd>
                  created: {detailQuery.data.workflow.actor_created}
                  {detailQuery.data.workflow.actor_updated
                    ? ` · updated: ${detailQuery.data.workflow.actor_updated}`
                    : ""}
                </dd>
              </dl>

              <h4 className="subsection-title">Record transition</h4>
              <p className="meta-copy">Terminal workflows cannot transition (409 from API).</p>
              <div className="workflow-lifecycle-form">
                <label>
                  Next status
                  <select
                    value={transitionNext}
                    onChange={(e) => setTransitionNext(e.target.value as WorkflowLifecycleStatus)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Reason (optional)
                  <input
                    value={transitionReason}
                    onChange={(e) => setTransitionReason(e.target.value)}
                    placeholder="Why this transition"
                  />
                </label>
              </div>
              {transitionError ? <p className="workflow-lifecycle-error">{transitionError}</p> : null}
              <button
                type="button"
                className="inline-action"
                disabled={transitionBusy}
                onClick={() => void onTransition()}
              >
                {transitionBusy ? "Recording…" : "Record transition"}
              </button>

              <h4 className="subsection-title">Timeline</h4>
              {timelineQuery.isLoading ? <LoadingState label="Loading timeline…" /> : null}
              {timelineQuery.error ? (
                <ErrorState error={timelineQuery.error} onRetry={() => void timelineQuery.reload()} />
              ) : null}
              {timelineQuery.data?.events?.length ? (
                <ol className="timeline-list">
                  {timelineQuery.data.events.map((ev) => (
                    <li key={ev.event_id}>
                      <span className="meta-copy">{formatDateTime(ev.occurred_at)}</span> —{" "}
                      <code>{ev.event_type}</code> {ev.prior_status ? `${ev.prior_status} → ` : ""}
                      {ev.next_status}
                      {ev.reason ? ` — ${ev.reason}` : ""}
                      <span className="meta-copy"> ({ev.provenance})</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="meta-copy">No events.</p>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
