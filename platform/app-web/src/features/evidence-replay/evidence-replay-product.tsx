import { useCallback, useMemo, useState } from "react";

import {
  EVIDENCE_REPLAY_VIEWER_CONTRACT_ID,
  parseEvidenceExportJson,
  parseEvidenceExportMarkdown,
  type EvidenceReplayMarkdownPartial,
  type EvidenceReplayModel,
} from "../../lib/evidence-replay";
import {
  readPolicyIdForReplay,
  readSyncRunsFromSubjectRef,
  readTopologyPivotForReplay,
} from "../../lib/evidence-replay/evidence-replay-pivots";
import { navigateToInvestigationView } from "../../lib/investigation-navigation";
import { navigateToPolicyDossierWorkspace } from "../../lib/policy-dossier-navigation";
import { navigateToSituationRoomView } from "../../lib/situation-room-navigation";
import { navigateToTopologyDossier } from "../../lib/topology-dossier-navigation";
import { navigateToEvidenceView } from "../../lib/url-app-state";

const MAX_IMPORT_CHARS = 2_000_000;

function formatSubjectRef(ref: Record<string, unknown>): string {
  try {
    return JSON.stringify(ref, null, 2);
  } catch {
    return String(ref);
  }
}

function formatNestedPreview(nested: Record<string, unknown> | null): string {
  if (!nested) {
    return "";
  }
  try {
    return JSON.stringify(nested, null, 2);
  } catch {
    return "";
  }
}

function extractFirstJsonFence(md: string): string | null {
  const re = /```json\s*([\s\S]*?)```/i;
  const m = re.exec(md);
  if (!m?.[1]) {
    return null;
  }
  return m[1].trim();
}

export function EvidenceReplayProduct() {
  const [draftText, setDraftText] = useState("");
  const [loadedText, setLoadedText] = useState<string | null>(null);
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [parseHint, setParseHint] = useState<string | null>(null);

  const parsed = useMemo(() => {
    if (!loadedText) {
      return null;
    }
    const t = loadedText.trim();
    if (t.startsWith("{")) {
      return { format: "json" as const, result: parseEvidenceExportJson(loadedText) };
    }
    return { format: "markdown" as const, result: parseEvidenceExportMarkdown(loadedText) };
  }, [loadedText]);

  const applyLoadedText = useCallback((text: string, label: string | null, hint: string | null) => {
    if (text.length > MAX_IMPORT_CHARS) {
      setParseHint(`Import too large (>${MAX_IMPORT_CHARS} characters). Use a smaller export file.`);
      return;
    }
    setLoadedText(text);
    setFileLabel(label);
    setParseHint(hint);
  }, []);

  const onFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const text = typeof reader.result === "string" ? reader.result : "";
        applyLoadedText(text, file.name, null);
      };
      reader.readAsText(file, "UTF-8");
      e.target.value = "";
    },
    [applyLoadedText],
  );

  const loadFromDraft = useCallback(() => {
    applyLoadedText(draftText, null, null);
  }, [applyLoadedText, draftText]);

  const clearLoaded = useCallback(() => {
    setLoadedText(null);
    setFileLabel(null);
    setParseHint(null);
  }, []);

  const tryParseJsonFence = useCallback(() => {
    if (!loadedText) {
      return;
    }
    const fence = extractFirstJsonFence(loadedText);
    if (!fence) {
      setParseHint("No ```json fence found to parse.");
      return;
    }
    setLoadedText(fence);
    setParseHint("Parsed JSON from Markdown fence (still replay, not live).");
  }, [loadedText]);

  const renderJsonModel = (model: EvidenceReplayModel) => {
    const syncRuns = readSyncRunsFromSubjectRef(model.subjectRef);
    const policyPivot = readPolicyIdForReplay(model.subjectRef, model.nested);
    const topologyPivot = readTopologyPivotForReplay(model.subjectRef, model.nested);

    return (
      <>
        <dl className="evidence-replay-dl">
          <dt>evidence_export_v1 · export_kind</dt>
          <dd>
            <code>{model.exportKind}</code>
          </dd>
          <dt>generated_at (export time)</dt>
          <dd>
            <code>{model.generatedAt}</code>
          </dd>
          <dt>subject_ref</dt>
          <dd>
            <pre className="evidence-replay-pre">{formatSubjectRef(model.subjectRef)}</pre>
          </dd>
          <dt>source_contract_ids</dt>
          <dd>
            {model.sourceContractIds.length ? (
              <ul className="evidence-replay-list">
                {model.sourceContractIds.map((id) => (
                  <li key={id}>
                    <code>{id}</code>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="meta-copy">—</span>
            )}
          </dd>
        </dl>

        {model.partial ? (
          <p className="evidence-replay-partial-callout">
            Partial replay: nested payload was missing, incomplete, or not fully mapped. This is still a frozen export, not
            live data.
          </p>
        ) : null}

        {model.parseWarnings.length > 0 ? (
          <div className="evidence-replay-warnings">
            <h4>Parse notes</h4>
            <ul>
              {model.parseWarnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {model.exportFraming ? (
          <div className="evidence-replay-framing">
            <h4>Export framing (from file)</h4>
            <p className="body-copy">{model.exportFraming}</p>
          </div>
        ) : null}

        <div className="evidence-replay-nonclaims">
          <h4>Explicit non-claims (from export)</h4>
          {model.explicitNonClaims.length ? (
            <ul>
              {model.explicitNonClaims.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          ) : (
            <p className="meta-copy">None listed on this envelope.</p>
          )}
        </div>

        {model.nested && Object.keys(model.nested).length > 0 ? (
          <details className="evidence-replay-nested" open>
            <summary>Nested payload (read-only JSON)</summary>
            <pre className="evidence-replay-pre evidence-replay-pre--scroll">{formatNestedPreview(model.nested)}</pre>
          </details>
        ) : null}

        <div className="evidence-replay-pivots">
          <h4>Open live workspace (not replay)</h4>
          <p className="evidence-replay-pivots__hint">
            Live routes call today&apos;s read APIs. Identifiers may be gone or changed — this is navigation only, not a
            guarantee the file matches current posture.
          </p>
          <div className="evidence-replay-pivots__grid">
            {model.exportKind === "situation_room" ? (
              <button
                type="button"
                className="nav-drilldown-button"
                onClick={() => navigateToSituationRoomView(syncRuns)}
              >
                Open live situation room
              </button>
            ) : null}
            {model.exportKind === "investigation_workspace" ? (
              <button
                type="button"
                className="nav-drilldown-button"
                onClick={() => navigateToInvestigationView(syncRuns, { invFrom: "evidence-replay" })}
              >
                Open live investigation workspace
              </button>
            ) : null}
            {model.exportKind === "policy_dossier" && policyPivot ? (
              <button
                type="button"
                className="nav-drilldown-button"
                onClick={() => navigateToPolicyDossierWorkspace(policyPivot.policyId, "evidence_replay_viewer")}
              >
                Open live policy dossier
              </button>
            ) : null}
            {model.exportKind === "topology_object_dossier" && topologyPivot ? (
              <button
                type="button"
                className="nav-drilldown-button"
                onClick={() =>
                  navigateToTopologyDossier(
                    topologyPivot.objectId,
                    topologyPivot.kind,
                    "evidence_replay_viewer",
                  )
                }
              >
                Open live topology dossier
              </button>
            ) : null}
            <button type="button" className="inline-action" onClick={() => navigateToEvidenceView("overview")}>
              Overview
            </button>
          </div>
          {policyPivot?.source === "nested_policy_record" || topologyPivot?.source === "nested_object_identity" ? (
            <p className="meta-copy evidence-replay-pivots__fallback">
              Live pivot identity was taken from the nested dossier payload (usable ids were not present in{" "}
              <code>subject_ref</code>).
            </p>
          ) : null}
          {(model.exportKind === "policy_dossier" && !policyPivot) ||
          (model.exportKind === "topology_object_dossier" && !topologyPivot) ? (
            <p className="meta-copy evidence-replay-pivots__unmapped" role="status">
              Unmapped pivot: cannot derive a live {model.exportKind.replace(/_/g, " ")} target from{" "}
              <code>subject_ref</code>
              {model.nested && Object.keys(model.nested).length > 0 ? " or nested identity fields" : ""}. Use Overview or
              navigate manually — do not guess ids from the file.
            </p>
          ) : null}
        </div>
      </>
    );
  };

  const renderMarkdownPartial = (m: EvidenceReplayMarkdownPartial) => (
    <>
      <div className="evidence-replay-warnings">
        <h4>Markdown companion</h4>
        <ul>
          {m.parseWarnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
        {m.inferredExportKind ? (
          <p className="meta-copy">
            Inferred heading kind: <code>{m.inferredExportKind}</code> (informative only).
          </p>
        ) : null}
      </div>
      <pre className="evidence-replay-pre evidence-replay-pre--scroll">{m.bodyText}</pre>
      {m.hasStructuredJsonFence ? (
        <p className="table-note">
          <button type="button" className="inline-action" onClick={tryParseJsonFence}>
            Parse JSON from first fenced JSON block
          </button>
        </p>
      ) : null}
      <div className="evidence-replay-pivots">
        <h4>Live workspaces (limited without JSON envelope)</h4>
        <p className="evidence-replay-pivots__hint">
          Markdown replay cannot prove structured subject_ref. You may still open bounded live surfaces — they reflect
          current APIs, not this file.
        </p>
        <div className="evidence-replay-pivots__grid">
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToSituationRoomView(20)}>
            Open live situation room
          </button>
          <button
            type="button"
            className="nav-drilldown-button"
            onClick={() => navigateToInvestigationView(20, { invFrom: "evidence-replay" })}
          >
            Open live investigation
          </button>
          <button type="button" className="inline-action" onClick={() => navigateToEvidenceView("overview")}>
            Overview
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="evidence-replay-product">
      <header className="evidence-replay-hero">
        <p className="eyebrow">{EVIDENCE_REPLAY_VIEWER_CONTRACT_ID}</p>
        <h2>Evidence replay</h2>
        <p className="body-copy evidence-replay-hero__lede">
          Replay of exported evidence (not live product data). Imports are bounded client-side text only — nothing here
          refreshes from the platform unless you use a live pivot.
        </p>
      </header>

      <div className="evidence-replay-banner" role="status">
        <strong>Replay mode</strong>
        <span>
          {" "}
          — This surface shows frozen bytes from a file. It is <em>not</em> a live situation room, dossier, or
          investigation feed.
        </span>
      </div>

      <section className="evidence-replay-load" aria-label="Load export file">
        <h3>Load export</h3>
        <p className="table-note">
          Choose a UTF-8 <code>.json</code> or <code>.md</code> export (max ~{MAX_IMPORT_CHARS.toLocaleString()}{" "}
          characters). JSON provides full envelope replay; Markdown is companion-only.
        </p>
        <p>
          <label className="evidence-replay-file-label">
            <input
              type="file"
              accept=".json,.md,.txt,application/json,text/plain"
              aria-label="Choose export file"
              onChange={onFile}
            />
          </label>
        </p>
        <div className="evidence-replay-paste">
          <label htmlFor="evidence-replay-paste">Or paste text</label>
          <textarea
            id="evidence-replay-paste"
            className="evidence-replay-textarea"
            rows={6}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder='Paste evidence_export_v1 JSON, or Markdown companion text…'
          />
          <p>
            <button type="button" className="inline-action" onClick={loadFromDraft}>
              Load pasted text
            </button>
            {loadedText ? (
              <button type="button" className="inline-action" onClick={clearLoaded}>
                Clear loaded replay
              </button>
            ) : null}
          </p>
        </div>
        {fileLabel ? (
          <p className="meta-copy">
            Loaded file: <code>{fileLabel}</code>
          </p>
        ) : null}
        {parseHint ? <p className="meta-copy">{parseHint}</p> : null}
      </section>

      {!loadedText ? (
        <p className="table-note">No export loaded yet.</p>
      ) : !parsed ? null : parsed.format === "json" && parsed.result.status === "ok" ? (
        <section className="evidence-replay-body" aria-label="Replayed export">
          {renderJsonModel(parsed.result.model)}
        </section>
      ) : parsed.format === "json" && parsed.result.status === "error" ? (
        <section className="evidence-replay-body evidence-replay-body--error" aria-label="Parse error">
          <h3>Cannot replay this JSON</h3>
          <p className="body-copy">
            <code>{parsed.result.error.code}</code>: {parsed.result.error.message}
          </p>
          <p className="meta-copy">
            This is a blocking error — the file is not a usable <code>evidence_export_v1</code> envelope for structured
            replay.
          </p>
        </section>
      ) : parsed.format === "markdown" && parsed.result.status === "markdown_partial" ? (
        <section className="evidence-replay-body" aria-label="Markdown replay">
          {renderMarkdownPartial(parsed.result)}
        </section>
      ) : (
        <section className="evidence-replay-body evidence-replay-body--error" aria-label="Markdown error">
          <h3>Cannot display this Markdown</h3>
          <p className="body-copy">
            {parsed.result.status === "error" ? (
              <>
                <code>{parsed.result.error.code}</code>: {parsed.result.error.message}
              </>
            ) : null}
          </p>
        </section>
      )}
    </div>
  );
}
