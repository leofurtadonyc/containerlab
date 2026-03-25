import { useCallback, useEffect, useId, useRef, useState } from "react";

import { ApiClientError, apiClient } from "../../api/client";
import type { OperatorSearchPivotTarget, OperatorSearchResponse } from "../../api/contracts";
import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import {
  describeOperatorSearchAction,
  familyLabel,
  navigateFromOperatorSearchPivot,
  navigateToDeltaDigestFromGlobalSearch,
  navigateToEvidenceReplayFromGlobalSearch,
  navigateToInvestigationFromOperatorSearchHit,
  navigateToOperatorBriefingFromGlobalSearch,
  navigateToReadinessFromOperatorCapabilityHit,
  navigateToSituationRoomFromGlobalSearch,
  supportsInvestigationShortcut,
} from "../../lib/operator-search-navigation";
import { navigateToMaintenancePreviewForTopologyObject } from "../../lib/maintenance-preview-navigation";
import {
  navigateToImpactReportForMaintenance,
  navigateToImpactReportForPolicy,
  navigateToImpactReportHub,
} from "../../lib/impact-report-navigation";
import { navigateToPolicyExplainabilityWorkspace } from "../../lib/policy-dossier-navigation";
import { navigateToServiceExplorerForPolicy } from "../../lib/service-explorer-navigation";
import { navigateToServiceDossierForPolicy } from "../../lib/service-dossier-navigation";
import {
  navigateToChangeSafetyCaseForMaintenance,
  navigateToChangeSafetyCaseForPolicy,
  navigateToChangeSafetyCaseHub,
} from "../../lib/change-safety-case-navigation";

const DEBOUNCE_MS = 400;

export function GlobalOperatorSearch() {
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<OperatorSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiClientError | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(inputValue.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [inputValue]);

  useEffect(() => {
    if (debounced.length < 2) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiClient
      .getOperatorSearch(debounced)
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        setLoading(false);
        if (err instanceof ApiClientError) {
          setError(err);
        } else {
          setError(new ApiClientError("Search failed.", 0));
        }
        setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, reloadNonce]);

  useEffect(() => {
    const onDocDown = (ev: MouseEvent) => {
      const el = rootRef.current;
      if (!el || !open) {
        return;
      }
      if (ev.target instanceof Node && !el.contains(ev.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open]);

  const clearSearchUi = useCallback(() => {
    setOpen(false);
    setInputValue("");
    setDebounced("");
    setData(null);
  }, []);

  const onSelectHit = useCallback(
    (pivot: OperatorSearchPivotTarget, echoQuery: string) => {
      navigateFromOperatorSearchPivot(pivot, { echoSearchQuery: echoQuery });
      clearSearchUi();
    },
    [clearSearchUi],
  );

  const showPanel = open && (loading || error !== null || data !== null);

  return (
    <div className="global-operator-search" ref={rootRef}>
      <div className="global-operator-search__header">
        <label className="global-operator-search__label" htmlFor={inputId}>
          Search inventory
        </label>
        <span className="global-operator-search__hint">Phase 2 list fields only</span>
      </div>
      <div className="global-operator-search__control">
        <input
          id={inputId}
          type="search"
          className="global-operator-search__input"
          placeholder="Policies, devices, topology, capabilities…"
          autoComplete="off"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          aria-expanded={showPanel}
          aria-controls="global-operator-search-results"
        />
      </div>
      {showPanel && (
        <div
          id="global-operator-search-results"
          className="global-operator-search__panel"
          role="region"
          aria-label="Operator search results"
        >
          {inputValue.trim().length > 0 && inputValue.trim().length < 2 && (
            <p className="global-operator-search__meta">Type at least two characters to search.</p>
          )}
          {debounced.length >= 2 && loading && <LoadingState label="Searching inventory…" />}
          {debounced.length >= 2 && !loading && error && (
            <ErrorState error={error} onRetry={() => setReloadNonce((n) => n + 1)} />
          )}
          {debounced.length >= 2 && !loading && !error && data?.result_state === "ambiguous" && (
            <p className="global-operator-search__meta">{data.guidance}</p>
          )}
          {debounced.length >= 2 && !loading && !error && data?.result_state === "no_hits" && (
            <EmptyState
              title="No matches"
              description={data.guidance ?? "No matches in bounded inventory fields."}
            />
          )}
          {debounced.length >= 2 && !loading && !error && data?.result_state === "hits" && (
            <>
              <div className="global-operator-search__groups">
                {data.groups.map((group) => (
                  <section key={group.family} className="global-operator-search__group">
                    <h3 className="global-operator-search__group-title">
                      {familyLabel(group.family)}
                      {group.capped ? (
                        <span className="global-operator-search__cap">
                          {" "}
                          showing {group.items.length} of {group.items_total_matched}
                        </span>
                      ) : null}
                    </h3>
                    <ul className="global-operator-search__list">
                      {group.items.map((hit) => (
                        <li key={`${group.family}-${hit.primary_id}-${hit.object_kind}`}>
                          <div className="global-operator-search__hit-block">
                            <button
                              type="button"
                              className="global-operator-search__hit"
                              onClick={() => onSelectHit(hit.pivot, data.q)}
                            >
                              <span className="global-operator-search__hit-title">{hit.title}</span>
                              <span className="global-operator-search__hit-id">{hit.primary_id}</span>
                              <span className="global-operator-search__hit-kind">{hit.object_kind}</span>
                              <span className="global-operator-search__hit-action">
                                {describeOperatorSearchAction(hit.object_kind)}
                              </span>
                            </button>
                            <div className="global-operator-search__deeplink-row">
                              {hit.pivot.policy_id ||
                              (hit.pivot.topology_object && hit.pivot.topology_object_kind) ? (
                                <button
                                  type="button"
                                  className="inline-action global-operator-search__deeplink"
                                  onClick={() => {
                                    const p = hit.pivot;
                                    const scoped = p.policy_id
                                      ? { policyId: p.policy_id }
                                      : p.topology_object && p.topology_object_kind
                                        ? {
                                            topologyObject: {
                                              id: p.topology_object,
                                              kind: p.topology_object_kind,
                                            },
                                          }
                                        : undefined;
                                    navigateToOperatorBriefingFromGlobalSearch(data.q, scoped);
                                    clearSearchUi();
                                  }}
                                >
                                  Briefing
                                </button>
                              ) : null}
                              {hit.pivot.topology_object && hit.pivot.topology_object_kind ? (
                                <button
                                  type="button"
                                  className="inline-action global-operator-search__deeplink"
                                  onClick={() => {
                                    navigateToMaintenancePreviewForTopologyObject(
                                      hit.pivot.topology_object!,
                                      hit.pivot.topology_object_kind!,
                                      {
                                        previewContext: "topology_drilldown",
                                        echoSearchQuery: data.q,
                                      },
                                    );
                                    clearSearchUi();
                                  }}
                                >
                                  Maintenance preview
                                </button>
                              ) : null}
                              {supportsInvestigationShortcut(hit.object_kind) ? (
                                <button
                                  type="button"
                                  className="inline-action global-operator-search__deeplink"
                                  onClick={() => {
                                    navigateToDeltaDigestFromGlobalSearch(data.q);
                                    clearSearchUi();
                                  }}
                                >
                                  Delta digest
                                </button>
                              ) : null}
                              {supportsInvestigationShortcut(hit.object_kind) ? (
                                <button
                                  type="button"
                                  className="inline-action global-operator-search__deeplink"
                                  onClick={() => {
                                    navigateToInvestigationFromOperatorSearchHit(hit, data.q);
                                    clearSearchUi();
                                  }}
                                >
                                  Investigation
                                </button>
                              ) : null}
                              {hit.object_kind === "capability" ? (
                                <button
                                  type="button"
                                  className="inline-action global-operator-search__deeplink"
                                  onClick={() => {
                                    navigateToReadinessFromOperatorCapabilityHit(hit.primary_id, data.q);
                                    clearSearchUi();
                                  }}
                                >
                                  Readiness
                                </button>
                              ) : null}
                              {hit.pivot.policy_id ? (
                                <button
                                  type="button"
                                  className="inline-action global-operator-search__deeplink"
                                  onClick={() => {
                                    navigateToPolicyExplainabilityWorkspace(
                                      hit.pivot.policy_id!,
                                      data.q,
                                      "candidates",
                                    );
                                    clearSearchUi();
                                  }}
                                >
                                  Explainability
                                </button>
                              ) : null}
                              {hit.pivot.policy_id ? (
                                <button
                                  type="button"
                                  className="inline-action global-operator-search__deeplink"
                                  onClick={() => {
                                    navigateToServiceExplorerForPolicy(hit.pivot.policy_id!, {
                                      echoSearchQuery: data.q,
                                    });
                                    clearSearchUi();
                                  }}
                                >
                                  Service Explorer
                                </button>
                              ) : null}
                              {hit.pivot.policy_id ? (
                                <button
                                  type="button"
                                  className="inline-action global-operator-search__deeplink"
                                  title="service_dossier_v1 — composed workspace for policy:…; not a search hit inside the dossier JSON"
                                  onClick={() => {
                                    navigateToServiceDossierForPolicy(hit.pivot.policy_id!, {
                                      echoSearchQuery: data.q,
                                    });
                                    clearSearchUi();
                                  }}
                                >
                                  Service dossier
                                </button>
                              ) : null}
                              {hit.pivot.policy_id ? (
                                <button
                                  type="button"
                                  className="inline-action global-operator-search__deeplink"
                                  title="Opens policy-shaped impact_report_v1 — same inventory anchor as dossier, not a search hit inside the report body."
                                  onClick={() => {
                                    navigateToImpactReportForPolicy(hit.pivot.policy_id!, {
                                      echoSearchQuery: data.q,
                                    });
                                    clearSearchUi();
                                  }}
                                >
                                  Impact report (policy)
                                </button>
                              ) : null}
                              {hit.pivot.policy_id ? (
                                <button
                                  type="button"
                                  className="inline-action global-operator-search__deeplink"
                                  title="change_safety_case_v1 — pre-change evidence posture; same policy anchor as Service Explorer, not a search hit inside the case JSON."
                                  onClick={() => {
                                    navigateToChangeSafetyCaseForPolicy(hit.pivot.policy_id!, {
                                      echoSearchQuery: data.q,
                                    });
                                    clearSearchUi();
                                  }}
                                >
                                  Change safety case (policy)
                                </button>
                              ) : null}
                              {hit.pivot.topology_object && hit.pivot.topology_object_kind ? (
                                <button
                                  type="button"
                                  className="inline-action global-operator-search__deeplink"
                                  title="Opens maintenance-shaped impact_report_v1 for this topology object — navigation only, not graph proof."
                                  onClick={() => {
                                    const id = hit.pivot.topology_object!;
                                    const kind = hit.pivot.topology_object_kind!;
                                    if (kind === "node") {
                                      navigateToImpactReportForMaintenance({
                                        nodeId: id,
                                        previewContext: "topology_drilldown",
                                        echoSearchQuery: data.q,
                                      });
                                    } else {
                                      navigateToImpactReportForMaintenance({
                                        linkId: id,
                                        previewContext: "topology_drilldown",
                                        echoSearchQuery: data.q,
                                      });
                                    }
                                    clearSearchUi();
                                  }}
                                >
                                  Impact report (maintenance)
                                </button>
                              ) : null}
                              {hit.pivot.topology_object && hit.pivot.topology_object_kind ? (
                                <button
                                  type="button"
                                  className="inline-action global-operator-search__deeplink"
                                  title="Opens topology-shaped change_safety_case_v1 — navigation only, not graph proof."
                                  onClick={() => {
                                    const id = hit.pivot.topology_object!;
                                    const kind = hit.pivot.topology_object_kind!;
                                    if (kind === "node") {
                                      navigateToChangeSafetyCaseForMaintenance({
                                        nodeId: id,
                                        previewContext: "topology_drilldown",
                                        echoSearchQuery: data.q,
                                      });
                                    } else {
                                      navigateToChangeSafetyCaseForMaintenance({
                                        linkId: id,
                                        previewContext: "topology_drilldown",
                                        echoSearchQuery: data.q,
                                      });
                                    }
                                    clearSearchUi();
                                  }}
                                >
                                  Change safety case (maintenance)
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
              <div className="global-operator-search__panel-footer">
                <span className="global-operator-search__panel-footer-label">Cross-surface</span>
                <button
                  type="button"
                  className="inline-action"
                  onClick={() => {
                    navigateToDeltaDigestFromGlobalSearch(data.q);
                    clearSearchUi();
                  }}
                >
                  Delta digest
                </button>
                <button
                  type="button"
                  className="inline-action"
                  onClick={() => {
                    navigateToOperatorBriefingFromGlobalSearch(data.q);
                    clearSearchUi();
                  }}
                >
                  Operator briefing
                </button>
                <button
                  type="button"
                  className="inline-action"
                  onClick={() => {
                    navigateToSituationRoomFromGlobalSearch(data.q);
                    clearSearchUi();
                  }}
                >
                  Situation room (evidence pack)
                </button>
                <button
                  type="button"
                  className="inline-action"
                  title="Import a previously downloaded evidence_export_v1 JSON — not live inventory matches."
                  onClick={() => {
                    navigateToEvidenceReplayFromGlobalSearch(data.q);
                    clearSearchUi();
                  }}
                >
                  Evidence replay (frozen file)
                </button>
                <button
                  type="button"
                  className="inline-action"
                  title="Impact Report setup — choose service, policy, or maintenance anchor; not a report generated from the query text."
                  onClick={() => {
                    navigateToImpactReportHub(data.q);
                    clearSearchUi();
                  }}
                >
                  Impact report hub
                </button>
                <button
                  type="button"
                  className="inline-action"
                  title="Change Safety Case setup — choose service or policy anchor; not a case generated from the query text alone."
                  onClick={() => {
                    navigateToChangeSafetyCaseHub(data.q);
                    clearSearchUi();
                  }}
                >
                  Change safety case hub
                </button>
              </div>
            </>
          )}
          {debounced.length >= 2 && !loading && !error && data && data.explicit_non_claims.length > 0 && (
            <ul className="global-operator-search__nonclaims">
              {data.explicit_non_claims.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
