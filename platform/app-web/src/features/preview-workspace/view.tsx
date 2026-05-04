import { useCallback, useState } from "react";

import { apiClient } from "../../api/client";
import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { formatDateTime } from "../../lib/presentation";
import { mergeViewIntoSearch, replaceUrlSearchParams } from "../../lib/url-app-state";
import {
  usePreviewDetailQuery,
  usePreviewListQuery,
  usePreviewTimelineQuery,
  usePreviewUrlSelection,
} from "./api";
const V1_TYPE = "policy_static_local_intent_preview_v1";

function setPreviewSelection(previewId: string | null) {
  const sp = mergeViewIntoSearch(window.location.search, "preview-workspace");
  if (previewId) {
    sp.set("preview_id", previewId);
  } else {
    sp.delete("preview_id");
  }
  replaceUrlSearchParams(sp);
}

export function PreviewWorkspaceView() {
  const { selectedId } = usePreviewUrlSelection();
  const listQuery = usePreviewListQuery();
  const detailQuery = usePreviewDetailQuery(selectedId);
  const timelineQuery = usePreviewTimelineQuery(selectedId);
  const [policyId, setPolicyId] = useState("");
  const [proposedIntent, setProposedIntent] = useState<"declared" | "unknown">("unknown");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const pid = policyId.trim();
      if (!pid) {
        setError("Enter a normalized policy_id from Policies.");
        return;
      }
      const res = await apiClient.createPreview({
        preview_type: V1_TYPE,
        target_kind: "policy",
        target_ids: [pid],
        requested_action_type: "intent_state_change",
        requested_payload: { proposed_intent_state: proposedIntent },
        actor_type: "operator",
        actor_id: "operator_webui",
      });
      await listQuery.reload();
      setPreviewSelection(res.preview.preview_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }, [policyId, proposedIntent, listQuery]);

  return (
    <div className="view-stack">
      <header className="view-header">
        <h1 className="view-title">Preview workspace</h1>
        <p className="view-subtitle text-muted">
          Backend-owned dry-run preview (v1: static_local <code>intent_state</code> only). This is
          not network execution, not evidence replay, and not an evidence-delta. Successful preview
          does not grant execution authority.
        </p>
      </header>

      <section className="detail-card">
        <h2 className="detail-card__title">Request a preview</h2>
        <div className="form-grid">
          <label className="form-field">
            <span className="form-field__label">policy_id</span>
            <input
              className="form-field__input"
              type="text"
              value={policyId}
              onChange={(e) => setPolicyId(e.target.value)}
              placeholder="e.g. PE1:static_local:192.0.2.11:100"
              autoComplete="off"
            />
          </label>
          <label className="form-field">
            <span className="form-field__label">proposed intent_state</span>
            <select
              className="form-field__input"
              value={proposedIntent}
              onChange={(e) => setProposedIntent(e.target.value as "declared" | "unknown")}
            >
              <option value="declared">declared</option>
              <option value="unknown">unknown</option>
            </select>
          </label>
        </div>
        <div className="detail-card__actions">
          <button type="button" className="btn btn--primary" disabled={busy} onClick={onSubmit}>
            {busy ? "Running…" : "Run preview"}
          </button>
        </div>
        {error ? <p className="text-error">{error}</p> : null}
      </section>

      <div className="workflow-lifecycle-split">
        <section className="detail-card">
          <h2 className="detail-card__title">Preview records</h2>
          {listQuery.isLoading ? <LoadingState label="Loading preview records" /> : null}
          {listQuery.error ? <ErrorState error={listQuery.error} onRetry={() => void listQuery.reload()} /> : null}
          {!listQuery.isLoading && !listQuery.error && (listQuery.data?.items.length ?? 0) === 0 ? (
            <EmptyState title="No preview records" description="Run preview to create one." />
          ) : null}
          {!listQuery.isLoading && !listQuery.error && (listQuery.data?.items.length ?? 0) > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Preview id</th>
                  <th>Status</th>
                  <th>Decision</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {(listQuery.data?.items ?? []).map((item) => (
                  <tr key={item.preview_id}>
                    <td>
                      <button type="button" className="inline-action" onClick={() => setPreviewSelection(item.preview_id)}>
                        <code>{item.preview_id}</code>
                      </button>
                    </td>
                    <td>{item.preview_status}</td>
                    <td>{item.capability_decision_state}</td>
                    <td className="meta-copy">{formatDateTime(item.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </section>

        <section className="detail-card">
          <h2 className="detail-card__title">Detail & timeline</h2>
          {!selectedId ? (
            <EmptyState title="No preview selected" description="Select a preview record from the list." />
          ) : null}
          {selectedId && detailQuery.isLoading ? <LoadingState label="Loading preview detail" /> : null}
          {selectedId && detailQuery.error ? (
            <ErrorState error={detailQuery.error} onRetry={() => void detailQuery.reload()} />
          ) : null}
          {selectedId && detailQuery.data ? (
            <>
              <button type="button" className="inline-action" onClick={() => setPreviewSelection(null)}>
                Clear selection
              </button>
              <pre className="code-block code-block--scroll" data-testid="preview-last-json">
                {JSON.stringify(detailQuery.data, null, 2)}
              </pre>
              <h3 className="detail-card__title">Timeline</h3>
              {timelineQuery.isLoading ? <LoadingState label="Loading preview timeline" /> : null}
              {timelineQuery.error ? (
                <ErrorState error={timelineQuery.error} onRetry={() => void timelineQuery.reload()} />
              ) : null}
              {timelineQuery.data?.events?.length ? (
                <ol className="timeline-list">
                  {timelineQuery.data.events.map((ev) => (
                    <li key={ev.event_id}>
                      <span className="meta-copy">{formatDateTime(ev.occurred_at)}</span> —{" "}
                      <code>{ev.event_type}</code>
                      {ev.reason ? ` — ${ev.reason}` : ""}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="meta-copy">No timeline events.</p>
              )}
            </>
          ) : null}
        </section>
      </div>

      <section className="detail-card">
        <h2 className="detail-card__title">API</h2>
        <p className="text-muted">
          <code>POST /api/v1/previews</code>, <code>GET /api/v1/previews</code>,{" "}
          <code>GET /api/v1/previews/{"{id}"}</code>, <code>…/diff</code>, <code>…/timeline</code>. See{" "}
          <code>platform/docs/dry-run-preview-diff-contract-v1.md</code>.
        </p>
      </section>
    </div>
  );
}
