import { useCallback, useState } from "react";

import { apiClient } from "../../api/client";
import { EmptyState, LoadingState } from "../../components/query-states";

const V1_TYPE = "policy_read_model_observability_v1";

export function ValidationWorkspaceView() {
  const [policyId, setPolicyId] = useState("");
  const [context, setContext] = useState<"pre_change" | "post_change">("pre_change");
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
      const res = await apiClient.createValidation({
        validation_type: V1_TYPE,
        validation_context: context,
        target_kind: "policy",
        target_ids: [pid],
        created_by_actor_type: "operator",
        created_by_actor_id: "operator_webui",
      });
      setDetailJson(JSON.stringify(res, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }, [policyId, context]);

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

      <section className="detail-card">
        <h2 className="detail-card__title">Last response</h2>
        {busy ? <LoadingState label="Loading validation" /> : null}
        {!busy && !detailJson && !error ? (
          <EmptyState
            title="No validation yet"
            description="Submit a policy id to see capability decision, checks, and verdict JSON."
          />
        ) : null}
        {detailJson ? (
          <pre className="code-block code-block--scroll" data-testid="validation-last-json">
            {detailJson}
          </pre>
        ) : null}
      </section>

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
