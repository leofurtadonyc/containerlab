import { useCallback, useState } from "react";

import { apiClient } from "../../api/client";
import { EmptyState, LoadingState } from "../../components/query-states";
const V1_TYPE = "policy_static_local_intent_preview_v1";

export function PreviewWorkspaceView() {
  const [policyId, setPolicyId] = useState("");
  const [proposedIntent, setProposedIntent] = useState<"declared" | "unknown">("unknown");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailJson, setDetailJson] = useState<string | null>(null);

  const onSubmit = useCallback(async () => {
    setError(null);
    setBusy(true);
    setDetailJson(null);
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
      setDetailJson(JSON.stringify(res, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }, [policyId, proposedIntent]);

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

      <section className="detail-card">
        <h2 className="detail-card__title">Last response</h2>
        {busy ? <LoadingState label="Loading preview" /> : null}
        {!busy && !detailJson && !error ? (
          <EmptyState
            title="No preview yet"
            description="Submit a policy id to see decision and diff JSON."
          />
        ) : null}
        {detailJson ? (
          <pre className="code-block code-block--scroll" data-testid="preview-last-json">
            {detailJson}
          </pre>
        ) : null}
      </section>

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
