import { useMemo } from "react";

import {
  labelForInvestigationNavSource,
  parseInvestigationNavContext,
} from "../../lib/investigation-url-context";
import { navigateToEvidenceView } from "../../lib/url-app-state";

export interface InvestigationNavContextBannerProps {
  /** Current `window.location.search` (including leading `?` when non-empty). */
  search: string;
}

/**
 * Breadcrumb-style context when `inv_from` is set: prior surface + optional shell object focus
 * (`device_id`, `policy_id`, `topology_object` / `topology_object_kind`).
 */
export function InvestigationNavContextBanner({ search }: InvestigationNavContextBannerProps) {
  const parsed = useMemo(() => parseInvestigationNavContext(search), [search]);
  const { invFrom, deviceId, policyId, topologyObjectId, topologyObjectKind } = parsed;

  if (!invFrom) {
    return null;
  }

  const focusParts: { key: string; label: string; value: string }[] = [];
  if (deviceId) {
    focusParts.push({ key: "device", label: "Device", value: deviceId });
  }
  if (policyId) {
    focusParts.push({ key: "policy", label: "Policy", value: policyId });
  }
  if (topologyObjectId && topologyObjectKind) {
    focusParts.push({
      key: "topology",
      label: `${topologyObjectKind} (topology)`,
      value: topologyObjectId,
    });
  }

  return (
    <div className="investigation-nav-context-banner">
      <nav aria-label="Investigation entry context">
        <ol className="investigation-nav-context-banner__crumbs">
          <li>
            <button
              type="button"
              className="inline-action"
              onClick={() => navigateToEvidenceView(invFrom)}
            >
              {labelForInvestigationNavSource(invFrom)}
            </button>
          </li>
          <li className="investigation-nav-context-banner__sep" aria-hidden="true">
            /
          </li>
          <li className="investigation-nav-context-banner__here">Investigation workspace</li>
        </ol>
      </nav>
      {focusParts.length > 0 ? (
        <p className="table-note investigation-nav-context-banner__focus">
          Shell parameters preserved with this session:{" "}
          {focusParts.map((p, i) => (
            <span key={p.key}>
              {i > 0 ? " · " : null}
              {p.label}: <code>{p.value}</code>
            </span>
          ))}
        </p>
      ) : (
        <p className="table-note investigation-nav-context-banner__focus">
          No device, policy, or topology object parameters are present in the URL; open a read surface and select a row
          before launching investigation to pin identifiers here.
        </p>
      )}
    </div>
  );
}
