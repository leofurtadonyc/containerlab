import { useCallback, useState } from "react";

import { apiClient } from "../../api/client";
import { EmptyState, LoadingState } from "../../components/query-states";

const V1_ROLLBACK = "policy_operator_intent_rollback_v1";
const V1_VALIDATION = "policy_read_model_observability_v1";

/** Bounded operator surface: rollback v1 (platform intent overlay compensation only). */
export function RollbackWorkspaceView() {
  const [policyId, setPolicyId] = useState("");
  const [parentActionId, setParentActionId] = useState("");
  const [postValidationId, setPostValidationId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const [detailJson, setDetailJson] = useState<string | null>(null);
  const [timelineJson, setTimelineJson] = useState<string | null>(null);

  const onCreatePostChangeValidation = useCallback(async () => {
    setError(null);
    setBusy(true);
    setStep("Creating post_change validation…");
    try {
      const pid = policyId.trim();
      if (!pid) {
        setError("Enter policy_id.");
        return;
      }
      const val = await apiClient.createValidation({
        validation_type: V1_VALIDATION,
        validation_context: "post_change",
        target_kind: "policy",
        target_ids: [pid],
        created_by_actor_type: "operator",
        created_by_actor_id: "operator_webui",
      });
      setPostValidationId(val.validation_id);
      setStep(`post_change validation_id=${val.validation_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Validation failed.");
    } finally {
      setBusy(false);
    }
  }, [policyId]);

  const onCreateRollback = useCallback(async () => {
    setError(null);
    setBusy(true);
    setDetailJson(null);
    setTimelineJson(null);
    setStep("Creating rollback…");
    try {
      const aid = parentActionId.trim();
      const vid = postValidationId.trim();
      const pid = policyId.trim();
      if (!aid || !vid || !pid) {
        setError("parent_action_id, pre_rollback (post_change) validation_id, and policy_id required.");
        return;
      }
      const res = await apiClient.createRollback({
        parent_action_id: aid,
        rollback_type: V1_ROLLBACK,
        target_kind: "policy",
        target_ids: [pid],
        pre_rollback_validation_id: vid,
        requested_by_actor_type: "operator",
        requested_by_actor_id: "operator_webui",
      });
      setDetailJson(JSON.stringify(res, null, 2));
      const tl = await apiClient.getRollbackTimeline(res.rollback.rollback_id);
      setTimelineJson(JSON.stringify(tl, null, 2));
      setStep(`Rollback ${res.rollback.rollback_id} — ${res.rollback.rollback_decision} / ${res.rollback.rollback_status}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rollback create failed.");
    } finally {
      setBusy(false);
    }
  }, [parentActionId, postValidationId, policyId]);

  const onApproveExecute = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      if (!detailJson) {
        setError("Create a rollback first.");
        return;
      }
      const rid = JSON.parse(detailJson).rollback.rollback_id as string;
      await apiClient.approveRollback(rid, { actor_id: "operator_webui", provenance: "operator" });
      const done = await apiClient.executeRollback(rid, { actor_id: "operator_webui", provenance: "operator" });
      setDetailJson(JSON.stringify(done, null, 2));
      const tl = await apiClient.getRollbackTimeline(rid);
      setTimelineJson(JSON.stringify(tl, null, 2));
      setStep("Approved and executed (if prerequisites still current).");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approve/execute failed.");
    } finally {
      setBusy(false);
    }
  }, [detailJson]);

  return (
    <div className="view-stack">
      <header className="view-header">
        <h1 className="view-title">Rollback workspace</h1>
        <p className="view-subtitle text-muted">
          Backend-owned <strong>rollback orchestration</strong> for one v1 slice: compensate the platform
          operator intent overlay by writing a new intent record (bounded; not SR OS / device restore). This
          is <strong>not</strong> universal undo, multi-vendor rollback, or evidence replay.
        </p>
      </header>

      <section className="detail-card">
        <h2 className="detail-card__title">1. Prerequisites</h2>
        <p className="text-muted">
          Requires a <strong>succeeded</strong> safe action and a fresh <code>post_change</code> validation
          that passes for the same policy.
        </p>
        <div className="form-grid">
          <label className="form-field">
            <span className="form-field__label">policy_id</span>
            <input
              className="form-field__input"
              value={policyId}
              onChange={(e) => setPolicyId(e.target.value)}
              placeholder="e.g. PE1:static_local:192.0.2.11:100"
              autoComplete="off"
            />
          </label>
          <label className="form-field">
            <span className="form-field__label">parent_action_id</span>
            <input
              className="form-field__input"
              value={parentActionId}
              onChange={(e) => setParentActionId(e.target.value)}
              placeholder="safe action id to compensate"
              autoComplete="off"
            />
          </label>
        </div>
        <div className="detail-card__actions">
          <button type="button" className="btn btn--secondary" disabled={busy} onClick={onCreatePostChangeValidation}>
            Create post_change validation
          </button>
        </div>
        <label className="form-field">
          <span className="form-field__label">pre_rollback_validation_id (post_change)</span>
          <input
            className="form-field__input"
            value={postValidationId}
            onChange={(e) => setPostValidationId(e.target.value)}
            autoComplete="off"
          />
        </label>
      </section>

      <section className="detail-card">
        <h2 className="detail-card__title">2. Rollback request</h2>
        <div className="detail-card__actions">
          <button type="button" className="btn btn--primary" disabled={busy} onClick={onCreateRollback}>
            POST /api/v1/rollbacks
          </button>
          <button type="button" className="btn btn--secondary" disabled={busy || !detailJson} onClick={onApproveExecute}>
            Approve + execute
          </button>
        </div>
        {step ? <p className="text-muted">{step}</p> : null}
        {error ? <p className="text-error">{error}</p> : null}
      </section>

      <section className="detail-card">
        <h2 className="detail-card__title">Last rollback detail</h2>
        {busy ? <LoadingState label="Working" /> : null}
        {!busy && !detailJson ? (
          <EmptyState title="No rollback yet" description="Enter ids and create a rollback request." />
        ) : null}
        {detailJson ? (
          <pre className="code-block code-block--scroll" data-testid="rollback-detail-json">
            {detailJson}
          </pre>
        ) : null}
      </section>

      <section className="detail-card">
        <h2 className="detail-card__title">Timeline</h2>
        {timelineJson ? (
          <pre className="code-block code-block--scroll" data-testid="rollback-timeline-json">
            {timelineJson}
          </pre>
        ) : (
          <p className="text-muted">Timeline appears after rollback create.</p>
        )}
      </section>

      <section className="detail-card">
        <h2 className="detail-card__title">API</h2>
        <p className="text-muted">
          <code>POST /api/v1/rollbacks</code>, <code>GET /api/v1/rollbacks</code>, <code>…/approve</code>,{" "}
          <code>…/execute</code>, <code>…/timeline</code>. Contract:{" "}
          <code>platform/docs/rollback-orchestration-contract-v1.md</code>.
        </p>
      </section>
    </div>
  );
}
