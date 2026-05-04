import { useCallback, useState } from "react";

import { apiClient } from "../../api/client";
import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { formatDateTime } from "../../lib/presentation";
import { mergeViewIntoSearch, replaceUrlSearchParams } from "../../lib/url-app-state";
import {
  useValidationDetailQuery,
  useValidationListQuery,
  useValidationTimelineQuery,
  useValidationUrlSelection,
} from "./api";

const V1_TYPE = "policy_read_model_observability_v1";

function setValidationSelection(validationId: string | null) {
  const sp = mergeViewIntoSearch(window.location.search, "validation-workspace");
  if (validationId) {
    sp.set("validation_id", validationId);
  } else {
    sp.delete("validation_id");
  }
  replaceUrlSearchParams(sp);
}

export function ValidationWorkspaceView() {
  const { selectedId } = useValidationUrlSelection();
  const listQuery = useValidationListQuery();
  const detailQuery = useValidationDetailQuery(selectedId);
  const timelineQuery = useValidationTimelineQuery(selectedId);
  const [policyId, setPolicyId] = useState("");
  const [context, setContext] = useState<"pre_change" | "post_change">("pre_change");
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
      const res = await apiClient.createValidation({
        validation_type: V1_TYPE,
        validation_context: context,
        target_kind: "policy",
        target_ids: [pid],
        created_by_actor_type: "operator",
        created_by_actor_id: "operator_webui",
      });
      await listQuery.reload();
      setValidationSelection(res.validation_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }, [policyId, context, listQuery]);

  return (
    <div className="view-stack">
      <header className="view-header">
        <h1 className="view-title">Validation workspace</h1>
        <p className="view-subtitle text-muted">
          Backend-owned validation results (v1: bounded policy read-model observability). This is{" "}
          <strong>not</strong> a preview diff, not an evidence delta / replay artifact, and not
          execution or approval. Unknown and not-applicable verdicts are first-class.
        </p>
      </header>

      <section className="detail-card">
        <h2 className="detail-card__title">Request a validation</h2>
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
            <span className="form-field__label">validation_context</span>
            <select
              className="form-field__input"
              value={context}
              onChange={(e) => setContext(e.target.value as "pre_change" | "post_change")}
            >
              <option value="pre_change">pre_change</option>
              <option value="post_change">post_change</option>
            </select>
          </label>
        </div>
        <div className="detail-card__actions">
          <button type="button" className="btn btn--primary" disabled={busy} onClick={onSubmit}>
            {busy ? "Running…" : "Run validation"}
          </button>
        </div>
        {error ? <p className="text-error">{error}</p> : null}
      </section>

      <div className="workflow-lifecycle-split">
        <section className="detail-card">
          <h2 className="detail-card__title">Validation records</h2>
          {listQuery.isLoading ? <LoadingState label="Loading validation records" /> : null}
          {listQuery.error ? <ErrorState error={listQuery.error} onRetry={() => void listQuery.reload()} /> : null}
          {!listQuery.isLoading && !listQuery.error && (listQuery.data?.items.length ?? 0) === 0 ? (
            <EmptyState title="No validation records" description="Run validation to create one." />
          ) : null}
          {!listQuery.isLoading && !listQuery.error && (listQuery.data?.items.length ?? 0) > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Validation id</th>
                  <th>Status</th>
                  <th>Verdict</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {(listQuery.data?.items ?? []).map((item) => (
                  <tr key={item.validation_id}>
                    <td>
                      <button
                        type="button"
                        className="inline-action"
                        onClick={() => setValidationSelection(item.validation_id)}
                      >
                        <code>{item.validation_id}</code>
                      </button>
                    </td>
                    <td>{item.validation_status}</td>
                    <td>{item.overall_verdict ?? "unknown"}</td>
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
            <EmptyState title="No validation selected" description="Select a validation record from the list." />
          ) : null}
          {selectedId && detailQuery.isLoading ? <LoadingState label="Loading validation detail" /> : null}
          {selectedId && detailQuery.error ? (
            <ErrorState error={detailQuery.error} onRetry={() => void detailQuery.reload()} />
          ) : null}
          {selectedId && detailQuery.data ? (
            <>
              <button type="button" className="inline-action" onClick={() => setValidationSelection(null)}>
                Clear selection
              </button>
              <pre className="code-block code-block--scroll" data-testid="validation-last-json">
                {JSON.stringify(detailQuery.data, null, 2)}
              </pre>
              <h3 className="detail-card__title">Timeline</h3>
              {timelineQuery.isLoading ? <LoadingState label="Loading validation timeline" /> : null}
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
          <code>POST /api/v1/validations</code>, <code>GET /api/v1/validations</code>,{" "}
          <code>GET /api/v1/validations/{"{id}"}</code>, <code>…/timeline</code>. See{" "}
          <code>platform/docs/validation-result-contract-v1.md</code>.
        </p>
      </section>
    </div>
  );
}
