import { useCallback, useState } from "react";

import { apiClient } from "../../api/client";
import type { ActionSafetyCaseResponse } from "../../api/contracts";
import { EmptyState, LoadingState } from "../../components/query-states";

const V1_ACTION = "policy_static_local_operator_intent_record_v1";
const V1_PREVIEW = "policy_static_local_intent_preview_v1";
const V1_VALIDATION = "policy_read_model_observability_v1";

/** Bounded operator surface: one narrow safe action slice (platform intent overlay only). */
export function SafeActionWorkspaceView() {
  const [workflowId, setWorkflowId] = useState("");
  const [previewId, setPreviewId] = useState("");
  const [validationId, setValidationId] = useState("");
  const [policyId, setPolicyId] = useState("");
  const [proposedIntent, setProposedIntent] = useState<"declared" | "unknown">("declared");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const [detailJson, setDetailJson] = useState<string | null>(null);
  const [timelineJson, setTimelineJson] = useState<string | null>(null);
  const [safetyCase, setSafetyCase] = useState<ActionSafetyCaseResponse | null>(null);

  const onCreateWorkflow = useCallback(async () => {
    setError(null);
    setBusy(true);
    setStep("Creating workflow…");
    try {
      const res = await apiClient.createWorkflowLifecycle({
        workflow_type: "safe_action_v1_demo",
        title: "Safe action v1",
        description: "WebUI demo workflow",
        initial_status: "requested",
        actor: "operator_webui",
        provenance: "operator",
      });
      const wid = res.workflow.workflow_id;
      setWorkflowId(wid);
      await apiClient.transitionWorkflowLifecycle(wid, {
        next_status: "approved",
        actor: "operator_webui",
        reason: "Demo: jump to approved for bounded safe action lab",
        provenance: "operator",
      });
      setStep(`Workflow ${wid} created and approved (demo shortcut).`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Workflow failed.");
    } finally {
      setBusy(false);
    }
  }, []);

  const onCreatePreviewValidation = useCallback(async () => {
    setError(null);
    setBusy(true);
    setStep("Preview + validation…");
    try {
      const wid = workflowId.trim();
      const pid = policyId.trim();
      if (!wid || !pid) {
        setError("Enter workflow_id and policy_id (or create workflow first).");
        return;
      }
      const pv = await apiClient.createPreview({
        preview_type: V1_PREVIEW,
        target_kind: "policy",
        target_ids: [pid],
        requested_action_type: "intent_state_change",
        requested_payload: { proposed_intent_state: proposedIntent },
        workflow_id: wid,
        actor_type: "operator",
        actor_id: "operator_webui",
      });
      const pvid = pv.preview.preview_id;
      setPreviewId(pvid);
      const val = await apiClient.createValidation({
        validation_type: V1_VALIDATION,
        validation_context: "pre_change",
        target_kind: "policy",
        target_ids: [pid],
        workflow_id: wid,
        preview_id: pvid,
        created_by_actor_type: "operator",
        created_by_actor_id: "operator_webui",
      });
      setValidationId(val.validation_id);
      setStep(`preview_id=${pvid} validation_id=${val.validation_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview/validation failed.");
    } finally {
      setBusy(false);
    }
  }, [workflowId, policyId, proposedIntent]);

  const onCreateAction = useCallback(async () => {
    setError(null);
    setBusy(true);
    setDetailJson(null);
    setTimelineJson(null);
      setSafetyCase(null);
    setStep("Creating action…");
    try {
      const wid = workflowId.trim();
      const pvid = previewId.trim();
      const vid = validationId.trim();
      const pid = policyId.trim();
      if (!wid || !pvid || !vid || !pid) {
        setError("workflow_id, preview_id, validation_id, and policy_id required.");
        return;
      }
      const res = await apiClient.createSafeAction({
        workflow_id: wid,
        preview_id: pvid,
        validation_id: vid,
        action_type: V1_ACTION,
        target_kind: "policy",
        target_ids: [pid],
        requested_payload: { proposed_intent_state: proposedIntent },
        requested_by_actor_type: "operator",
        requested_by_actor_id: "operator_webui",
      });
      setDetailJson(JSON.stringify(res, null, 2));
      setSafetyCase(await apiClient.getActionSafetyCase(res.action.action_id));
      const tl = await apiClient.getSafeActionTimeline(res.action.action_id);
      setTimelineJson(JSON.stringify(tl, null, 2));
      setStep(`Action ${res.action.action_id} — decision ${res.action.action_decision} / ${res.action.execution_status}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action create failed.");
    } finally {
      setBusy(false);
    }
  }, [workflowId, previewId, validationId, policyId, proposedIntent]);

  const onApproveExecute = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      if (!detailJson) {
        setError("Create an action first.");
        return;
      }
      const aid = JSON.parse(detailJson).action.action_id as string;
      await apiClient.approveSafeAction(aid, { actor_id: "operator_webui", provenance: "operator" });
      const done = await apiClient.executeSafeAction(aid, { actor_id: "operator_webui", provenance: "operator" });
      setDetailJson(JSON.stringify(done, null, 2));
      setSafetyCase(await apiClient.getActionSafetyCase(aid));
      const tl = await apiClient.getSafeActionTimeline(aid);
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
        <h1 className="view-title">Safe action workspace</h1>
        <p className="view-subtitle text-muted">
          Backend-owned <strong>action execution</strong> for one v1 slice: persist operator{" "}
          <code>intent_state</code> for <code>static_local</code> policies as platform data only. This is{" "}
          <strong>not</strong> a preview diff, validation verdict, evidence export, replay, or sync-history
          row. It is <strong>not</strong> device or controller configuration push.
        </p>
      </header>

      <section className="detail-card">
        <h2 className="detail-card__title">1. Workflow (demo shortcut)</h2>
        <p className="text-muted">
          Creates a lifecycle record and moves it to <code>approved</code> so execute is allowed. Production
          flows should walk planned/dry-run states honestly.
        </p>
        <div className="detail-card__actions">
          <button type="button" className="btn btn--secondary" disabled={busy} onClick={onCreateWorkflow}>
            Create + approve workflow
          </button>
        </div>
        <label className="form-field">
          <span className="form-field__label">workflow_id</span>
          <input
            className="form-field__input"
            value={workflowId}
            onChange={(e) => setWorkflowId(e.target.value)}
            placeholder="filled after create"
            autoComplete="off"
          />
        </label>
      </section>

      <section className="detail-card">
        <h2 className="detail-card__title">2. Preview + validation (prerequisites)</h2>
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
          <button type="button" className="btn btn--primary" disabled={busy} onClick={onCreatePreviewValidation}>
            Create preview + validation
          </button>
        </div>
        <label className="form-field">
          <span className="form-field__label">preview_id</span>
          <input className="form-field__input" value={previewId} onChange={(e) => setPreviewId(e.target.value)} />
        </label>
        <label className="form-field">
          <span className="form-field__label">validation_id</span>
          <input
            className="form-field__input"
            value={validationId}
            onChange={(e) => setValidationId(e.target.value)}
          />
        </label>
      </section>

      <section className="detail-card">
        <h2 className="detail-card__title">3. Action request</h2>
        <div className="detail-card__actions">
          <button type="button" className="btn btn--primary" disabled={busy} onClick={onCreateAction}>
            POST /api/v1/actions
          </button>
          <button type="button" className="btn btn--secondary" disabled={busy || !detailJson} onClick={onApproveExecute}>
            Approve + execute
          </button>
        </div>
        {step ? <p className="text-muted">{step}</p> : null}
        {error ? <p className="text-error">{error}</p> : null}
      </section>

      <section className="detail-card">
        <h2 className="detail-card__title">Action safety case</h2>
        {safetyCase ? (
          <ActionSafetyCasePanel safetyCase={safetyCase} />
        ) : (
          <EmptyState
            title="No safety case yet"
            description="Create an action to assemble bounded preview, validation, evidence, and rollback readiness."
          />
        )}
      </section>

      <section className="detail-card">
        <h2 className="detail-card__title">Last action detail</h2>
        {busy ? <LoadingState label="Working" /> : null}
        {!busy && !detailJson ? (
          <EmptyState title="No action yet" description="Complete prerequisites and create an action." />
        ) : null}
        {detailJson ? (
          <pre className="code-block code-block--scroll" data-testid="safe-action-detail-json">
            {detailJson}
          </pre>
        ) : null}
      </section>

      <section className="detail-card">
        <h2 className="detail-card__title">Timeline</h2>
        {timelineJson ? (
          <pre className="code-block code-block--scroll" data-testid="safe-action-timeline-json">
            {timelineJson}
          </pre>
        ) : (
          <p className="text-muted">Timeline appears after action create.</p>
        )}
      </section>

      <section className="detail-card">
        <h2 className="detail-card__title">API</h2>
        <p className="text-muted">
          <code>POST /api/v1/actions</code>, <code>GET /api/v1/actions</code>, <code>…/approve</code>,{" "}
          <code>…/execute</code>, <code>…/timeline</code>. Contract:{" "}
          <code>platform/docs/safe-action-workflow-contract-v1.md</code>.
        </p>
      </section>
    </div>
  );
}

function postureLabel(posture: ActionSafetyCaseResponse["final_bounded_posture"]): string {
  return posture.replace(/_/g, " ");
}

export function ActionSafetyCasePanel({ safetyCase }: { safetyCase: ActionSafetyCaseResponse }) {
  return (
    <div data-testid="action-safety-case">
      <p className="callout">
        Final bounded posture: <strong>{postureLabel(safetyCase.final_bounded_posture)}</strong>{" "}
        (<code>{safetyCase.final_bounded_posture}</code>). This is operator review language, not safe-to-execute
        authority.
      </p>
      <div className="summary-grid">
        <SafetyCaseReference label="Action" refData={safetyCase.action} />
        <SafetyCaseReference label="Workflow" refData={safetyCase.workflow_lifecycle} />
        <SafetyCaseReference label="Preview" refData={safetyCase.preview} />
        <SafetyCaseReference label="Validation" refData={safetyCase.validation} />
        <SafetyCaseReference label="Evidence quality" refData={safetyCase.evidence_quality} />
        <SafetyCaseReference label="Controller evidence" refData={safetyCase.controller_evidence} />
        <SafetyCaseReference label="Rollback readiness" refData={safetyCase.rollback_readiness} />
      </div>
      <SafetyCaseGateList title="Blocking gates" gates={safetyCase.blocking_gates} empty="No blocking gates reported." />
      <SafetyCaseGateList title="Warning gates" gates={safetyCase.warning_gates} empty="No warning gates reported." />
      <SafetyCaseGateList
        title="Missing evidence"
        gates={safetyCase.missing_evidence}
        empty="No missing evidence gates reported."
      />
      <h3 className="detail-card__subtitle">Operator next steps</h3>
      <ul>
        {safetyCase.operator_next_steps.map((step) => (
          <li key={step.step_id}>
            <strong>{step.label}:</strong> {step.rationale}
          </li>
        ))}
      </ul>
      <h3 className="detail-card__subtitle">Explicit limitations</h3>
      <ul>
        {safetyCase.safety_framing.explicit_limitations.map((limitation) => (
          <li key={limitation}>{limitation}</li>
        ))}
      </ul>
    </div>
  );
}

function SafetyCaseReference({ label, refData }: { label: string; refData: ActionSafetyCaseResponse["action"] }) {
  return (
    <div className="summary-card">
      <h3 className="summary-card__title">{label}</h3>
      <p className="text-muted">{refData.summary}</p>
      <p className="text-muted">
        present=<code>{String(refData.present)}</code>
        {refData.status ? (
          <>
            {" "}
            status=<code>{refData.status}</code>
          </>
        ) : null}
        {refData.verdict ? (
          <>
            {" "}
            verdict=<code>{refData.verdict}</code>
          </>
        ) : null}
      </p>
    </div>
  );
}

function SafetyCaseGateList({
  title,
  gates,
  empty,
}: {
  title: string;
  gates: ActionSafetyCaseResponse["blocking_gates"];
  empty: string;
}) {
  return (
    <>
      <h3 className="detail-card__subtitle">{title}</h3>
      {gates.length === 0 ? (
        <p className="text-muted">{empty}</p>
      ) : (
        <ul>
          {gates.map((gate) => (
            <li key={gate.gate_id}>
              <strong>{gate.gate_id}</strong>: {gate.summary}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
