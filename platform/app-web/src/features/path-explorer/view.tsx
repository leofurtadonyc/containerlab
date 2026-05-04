import { useCallback, useEffect, useMemo, useState } from "react";

import { APP_URL_SEARCH_CHANGED } from "../../lib/url-app-state";
import { WorkspaceHeader } from "../../components/workspace-header";
import {
  PATH_EXPLORER_POLICY_ID_PARAM,
  readPathExplorerPolicyIdFromSearch,
} from "../../lib/path-explorer-navigation";
import { useReplaceUrlSearchParams } from "../../lib/use-url-search-params";
import { PathExplorerProduct } from "./path-explorer-product";

function readSearch(): string {
  return typeof window !== "undefined" ? window.location.search : "";
}

export function PathExplorerView() {
  const [search, setSearch] = useState(readSearch);
  const replaceUrlSearchParams = useReplaceUrlSearchParams();

  const syncFromUrl = useCallback(() => {
    setSearch(readSearch());
  }, []);

  useEffect(() => {
    window.addEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
    return () => window.removeEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
  }, [syncFromUrl]);

  const policyId = useMemo(() => readPathExplorerPolicyIdFromSearch(search), [search]);

  const applyPolicyId = useCallback(
    (raw: string) => {
      const next = new URLSearchParams(search);
      const t = raw.trim();
      if (!t) {
        next.delete(PATH_EXPLORER_POLICY_ID_PARAM);
      } else {
        next.set(PATH_EXPLORER_POLICY_ID_PARAM, t);
      }
      replaceUrlSearchParams(next);
    },
    [search, replaceUrlSearchParams],
  );

  return (
    <section className="workspace-page path-explorer-route">
      <PathExplorerSetup policyId={policyId} onApplyPolicyId={applyPolicyId} />
      {policyId ? <PathExplorerProduct policyId={policyId} /> : null}
    </section>
  );
}

function PathExplorerSetup({
  policyId,
  onApplyPolicyId,
}: {
  policyId: string | null;
  onApplyPolicyId: (raw: string) => void;
}) {
  const [draft, setDraft] = useState(policyId ?? "");

  useEffect(() => {
    setDraft(policyId ?? "");
  }, [policyId]);

  return (
    <div className="path-explorer-setup workspace-page">
      <WorkspaceHeader
        eyebrow="Network Truth"
        title="Path Explorer"
        summary="Load a bounded path-analysis workspace anchored on a normalized policy and current topology-policy evidence."
      />
      <div className="detail-card">
        <p className="body-copy">
          Enter a normalized <strong>policy_id</strong> to load the composed <code>path_explorer_v1</code> workspace
          (path-analysis + explainability [+ optional dossier]). This is read-only interpretation support, not dataplane
          proof or change authority.
        </p>
      <form
        className="path-explorer-setup__form"
        onSubmit={(e) => {
          e.preventDefault();
          onApplyPolicyId(draft);
        }}
      >
        <label htmlFor="path-explorer-policy-input">policy_id</label>
        <input
          id="path-explorer-policy-input"
          className="path-explorer-setup__input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. PE1:static_local:192.0.2.11:100"
          autoComplete="off"
        />
        <button type="submit">Load workspace</button>
      </form>
      </div>
    </div>
  );
}
