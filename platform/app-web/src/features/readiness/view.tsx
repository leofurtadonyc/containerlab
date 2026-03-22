import { useEffect } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { IdentifierChip } from "../../components/identifier-chip";
import { StatusPill } from "../../components/status-pill";
import type { DryRunReadinessBlocker, DryRunReadinessPrerequisite } from "../../api/contracts";
import { formatDateTime, formatLabel } from "../../lib/presentation";
import {
  READINESS_BLOCKER_PARAM,
  READINESS_CAPABILITY_FEATURE_PARAM,
  READINESS_PREREQUISITE_PARAM,
  navigateReadinessDrilldown,
  readinessBlockerDomId,
  readinessPrerequisiteDomId,
} from "../../lib/readiness-navigation";
import { useUrlSearchParams } from "../../lib/use-url-search-params";
import {
  describeAssessmentAreaStatus,
  describeDryRunReadinessStatus,
  describeEvidenceCoverage,
  describePlanningReadiness,
  describeReadinessBlockerCategory,
  describeReadinessBlockerSeverity,
  normalizeDryRunReadiness,
  summarizeReadinessItemIdentitySupport,
} from "../../lib/readiness";
import { useCapabilitiesQuery } from "../capabilities/api";

function blockersLinkedToPrerequisite(
  prerequisite: DryRunReadinessPrerequisite["prerequisite"],
  blockers: DryRunReadinessBlocker[],
): DryRunReadinessBlocker[] {
  return blockers.filter((b) => b.related_prerequisites.includes(prerequisite));
}

export function ReadinessView() {
  const { data, error, isLoading, reload } = useCapabilitiesQuery();
  const searchParams = useUrlSearchParams();
  const blockerScrollTarget = searchParams.get(READINESS_BLOCKER_PARAM);
  const prerequisiteScrollTarget = searchParams.get(READINESS_PREREQUISITE_PARAM);
  const capabilityFeatureContext = searchParams.get(READINESS_CAPABILITY_FEATURE_PARAM);

  useEffect(() => {
    if (!data) {
      return;
    }
    const readiness = normalizeDryRunReadiness(data.dry_run_readiness);
    const scrollToId = (elementId: string) => {
      const el = document.getElementById(elementId);
      if (!el) {
        return;
      }
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };
    if (
      prerequisiteScrollTarget &&
      readiness.prerequisites.some((p) => p.prerequisite === prerequisiteScrollTarget)
    ) {
      scrollToId(readinessPrerequisiteDomId(prerequisiteScrollTarget));
      return;
    }
    if (
      blockerScrollTarget &&
      readiness.blockers.some((b) => b.blocker === blockerScrollTarget)
    ) {
      scrollToId(readinessBlockerDomId(blockerScrollTarget));
    }
  }, [blockerScrollTarget, prerequisiteScrollTarget, data]);

  if (isLoading) {
    return (
      <section>
        <h2>Readiness</h2>
        <LoadingState label="Loading bounded readiness support." />
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2>Readiness</h2>
        <ErrorState error={error} onRetry={reload} />
      </section>
    );
  }

  if (!data) {
    return (
      <section>
        <h2>Readiness</h2>
        <EmptyState
          title="No readiness data"
          description="The backend returned no readiness-support response."
        />
      </section>
    );
  }

  const readiness = normalizeDryRunReadiness(data.dry_run_readiness);
  const blockers = readiness.blockers;
  const prerequisites = readiness.prerequisites;
  const assessmentAreas = readiness.assessment_areas;
  const identitySupport = summarizeReadinessItemIdentitySupport(readiness);

  return (
    <section>
      <div className="section-header">
        <div>
          <h2>Readiness</h2>
          <p>
            This page explains what the current platform is ready to reason about,
            what remains blocked, and where evidence coverage is still bounded. It is
            strictly read-only and does not imply any execution capability.
          </p>
        </div>
        <StatusPill value={readiness.status} />
      </div>

      {capabilityFeatureContext ? (
        <p className="table-note">
          <strong>Capability navigation context.</strong> Linked from a capability detail using
          feature <code>{capabilityFeatureContext}</code> as read-only framing. Readiness is still
          the full bounded snapshot, not filtered to that tuple.
        </p>
      ) : null}

      <p className="table-note">
        <strong>Two different clocks.</strong> The <strong>evaluation sample (this response)</strong>{" "}
        is <code>generated_at</code> on the capabilities response: when this bounded readiness
        payload was assembled for your request. That matches Grafana&apos;s{" "}
        <strong>Evaluation sample (this response) age</strong> on the platform overview dashboard
        (observability-only, not a product verdict). The{" "}
        <strong>persisted snapshot (last material change)</strong> is{" "}
        <code>readiness_persisted_at</code>: when the backend last wrote a materially changed
        persisted readiness snapshot row. These are not interchangeable freshness signals.
      </p>

      <div className="metadata-row">
        <span>Planning readiness: {formatLabel(readiness.planning_readiness)}</span>
        <span>Phase recommendation: {formatLabel(readiness.phase_recommendation)}</span>
        <span>
          Evaluation sample (this response): {formatDateTime(data.generated_at)}
        </span>
        <span>
          Persisted snapshot (last material change):{" "}
          {formatDateTime(data.readiness_persisted_at ?? null)}
        </span>
        <span>Snapshot anchor exposed: {data.readiness_snapshot_id ? "Yes" : "No"}</span>
        <span>Child item identity: {formatLabel(identitySupport.posture)}</span>
      </div>

      {!data.readiness_persisted_at ? (
        <p className="table-note">
          <strong>Persisted snapshot time unavailable.</strong> This response does not include{" "}
          <code>readiness_persisted_at</code>. Bounded planning posture may still apply; this is
          not a validation verdict and does not imply incorrect readiness history.
        </p>
      ) : null}

      <p className="callout">{readiness.summary}</p>

      <div className="summary-grid">
        <article className="summary-card">
          <p className="summary-label">Readiness Status</p>
          <strong>{formatLabel(readiness.status)}</strong>
          <p>{describeDryRunReadinessStatus(readiness.status)}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Planning Readiness</p>
          <strong>{formatLabel(readiness.planning_readiness)}</strong>
          <p>{describePlanningReadiness(readiness.planning_readiness)}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Blockers</p>
          <strong>{blockers.length}</strong>
          <p>Explicit blocker records that still prevent stronger future dry-run reasoning.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Prerequisites</p>
          <strong>{prerequisites.length}</strong>
          <p>Bounded prerequisite checks currently exposed by the backend-owned readiness model.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Child Item Identifiers</p>
          <strong>
            {identitySupport.exposedCount} / {identitySupport.totalCount}
          </strong>
          <p>The response anchor stays primary when child records remain snapshot-scoped only.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Strong Evidence</p>
          <strong>{readiness.evidence_coverage_counts.strong ?? 0}</strong>
          <p>Prerequisites whose current evidence is stable enough for the bounded claim.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Bounded Evidence</p>
          <strong>{readiness.evidence_coverage_counts.bounded ?? 0}</strong>
          <p>Prerequisites with useful evidence that still remains intentionally bounded.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Supported Prerequisites</p>
          <strong>{readiness.support_posture_counts.supported ?? 0}</strong>
          <p>Prerequisites backed by currently supported product slices.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Partial Prerequisites</p>
          <strong>{readiness.support_posture_counts.partially_supported ?? 0}</strong>
          <p>Prerequisites backed by useful but still bounded platform slices.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Critical Blockers</p>
          <strong>{readiness.blocker_severity_counts.critical ?? 0}</strong>
          <p>Hard-stop blockers that still prevent any stronger move beyond planning assessment.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Phase-Transition Scope Hits</p>
          <strong>{readiness.blocked_scope_counts.phase_transition ?? 0}</strong>
          <p>Explicit blocker hits that still show why the platform must remain fully in Phase 2.</p>
        </article>
      </div>

      <div className="callout">
        <strong>Read-only boundary remains explicit</strong>
        <p>
          This page is preparation metadata only. It does not offer execution
          controls, approvals, rollback behavior, or dry-run preview output. The
          goal is to make blockers and bounded evidence easier to understand before
          any future workflow-grade work is considered.
        </p>
        <p className="table-note">
          Persisted readiness snapshot anchor:{" "}
          <IdentifierChip
            value={data.readiness_snapshot_id}
            emptyLabel="Not exposed in this response"
          />
        </p>
      </div>

      <div className="callout">
        <strong>Identity posture stays explicit</strong>
        <p>{identitySupport.summary}</p>
        <p className="table-note">{identitySupport.note}</p>
      </div>

      <div className="content-grid">
        <article className="detail-card">
          <p className="summary-label">Persisted Readiness Anchor</p>
          <p>
            This page is backed by a persisted readiness-support snapshot when the backend has one.
            The anchor identifies that persisted read-only response record, remains the strongest
            stable reference across mixed-version payloads, and does not imply workflow state or
            execution capability.
          </p>
          <div className="key-value-list">
            <div className="key-value-row">
              <span>Snapshot anchor</span>
              <IdentifierChip
                value={data.readiness_snapshot_id}
                emptyLabel="Not exposed in this response"
              />
            </div>
            <div className="key-value-row">
              <span>Persisted snapshot (last material change)</span>
              <strong>{formatDateTime(data.readiness_persisted_at ?? null)}</strong>
            </div>
            <div className="key-value-row">
              <span>Evaluation sample (this response)</span>
              <strong>{formatDateTime(data.generated_at)}</strong>
            </div>
          </div>
          <p className="table-note">
            Platform overview Grafana panels use the same two labels as this card; they mirror
            numeric ages only. Evaluation-sample time is not persisted-snapshot chronology.
          </p>
        </article>
        <article className="detail-card">
          <p className="summary-label">Child Item Identity Posture</p>
          <p>
            Standalone blocker, prerequisite, and assessment-area identifiers are optional trust
            cues. Their presence helps reference a specific child record, but they never imply a
            workflow handle, approval object, or execution control.
          </p>
          <div className="key-value-list">
            <div className="key-value-row">
              <span>Current posture</span>
              <strong>{formatLabel(identitySupport.posture)}</strong>
            </div>
            <div className="key-value-row">
              <span>Identifiers exposed</span>
              <strong>
                {identitySupport.exposedCount} of {identitySupport.totalCount}
              </strong>
            </div>
            <div className="key-value-row">
              <span>Fallback reference</span>
              <IdentifierChip
                value={data.readiness_snapshot_id}
                emptyLabel="No response anchor exposed"
              />
            </div>
          </div>
          <p className="table-note">{identitySupport.note}</p>
        </article>
        <article className="detail-card">
          <p className="summary-label">Readiness Scope</p>
          <p>{readiness.readiness_scope}</p>
          {readiness.notes.length > 0 ? (
            <>
              <p className="summary-label">Readiness Notes</p>
              <ul className="notes-list">
                {readiness.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </>
          ) : null}
        </article>
        <article className="detail-card">
          <p className="summary-label">Strongest Blockers</p>
          {readiness.strongest_blockers.length > 0 ? (
            <ul className="notes-list">
              {readiness.strongest_blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          ) : (
            <p>No strongest-blocker summary is available from the current backend response.</p>
          )}
        </article>
        <article className="detail-card">
          <p className="summary-label">Bounded Next Steps</p>
          {readiness.bounded_next_steps.length > 0 ? (
            <ul className="notes-list">
              {readiness.bounded_next_steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          ) : (
            <p>No bounded next steps are available from the current backend response.</p>
          )}
        </article>
        <article className="detail-card">
          <p className="summary-label">Assessment Areas</p>
          {assessmentAreas.length > 0 ? (
            <ul className="notes-list">
              {assessmentAreas.map((assessment) => (
                <li key={assessment.area}>
                  <strong>
                    {formatLabel(assessment.area)}: {formatLabel(assessment.status)}
                  </strong>
                  {" - "}
                  {assessment.summary}
                  <div className="table-note">
                    Item identifier:{" "}
                    <IdentifierChip
                      value={assessment.item_id}
                      emptyLabel="Snapshot-scoped only"
                    />
                  </div>
                  <div className="table-note">
                    {describeAssessmentAreaStatus(assessment.status)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No assessment-area detail is available from the current backend response.</p>
          )}
        </article>
        <article className="detail-card">
          <p className="summary-label">Blocker Posture</p>
          <ul className="compact-list">
            <li>
              <span>Contract blockers</span>
              <strong>{readiness.blocker_category_counts.contract ?? 0}</strong>
            </li>
            <li>
              <span>Truth blockers</span>
              <strong>{readiness.blocker_category_counts.truth ?? 0}</strong>
            </li>
            <li>
              <span>History blockers</span>
              <strong>{readiness.blocker_category_counts.history ?? 0}</strong>
            </li>
            <li>
              <span>Critical severity</span>
              <strong>{readiness.blocker_severity_counts.critical ?? 0}</strong>
            </li>
            <li>
              <span>Major severity</span>
              <strong>{readiness.blocker_severity_counts.major ?? 0}</strong>
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <p className="summary-label">Blocked Scope Coverage</p>
          <ul className="compact-list">
            <li>
              <span>Planning depth</span>
              <strong>{readiness.blocked_scope_counts.planning_depth ?? 0}</strong>
            </li>
            <li>
              <span>Preview contracts</span>
              <strong>{readiness.blocked_scope_counts.preview_contracts ?? 0}</strong>
            </li>
            <li>
              <span>Validation contracts</span>
              <strong>{readiness.blocked_scope_counts.validation_contracts ?? 0}</strong>
            </li>
            <li>
              <span>Workflow audit relationships</span>
              <strong>{readiness.blocked_scope_counts.workflow_audit_relationships ?? 0}</strong>
            </li>
            <li>
              <span>Phase transition</span>
              <strong>{readiness.blocked_scope_counts.phase_transition ?? 0}</strong>
            </li>
          </ul>
        </article>
      </div>

      {blockers.length === 0 ? (
        <EmptyState
          title="No blocker records"
          description="The backend did not return explicit blocker records for the current readiness snapshot."
        />
      ) : (
        <>
          <div className="history-evidence-drilldown">
            <p className="summary-label">Blocker drilldown</p>
            <p className="table-note">
              Jump to a blocker card below. Related prerequisites link to the prerequisite section on this
              page — bounded interpretation only, not validation or workflow execution.
            </p>
            <div className="history-evidence-drilldown-actions">
              {blockers.map((b) => (
                <button
                  key={b.blocker}
                  type="button"
                  className="nav-drilldown-button"
                  onClick={() => navigateReadinessDrilldown({ blocker: b.blocker })}
                >
                  {formatLabel(b.blocker)}
                </button>
              ))}
            </div>
          </div>
          <div className="content-grid">
            {blockers.map((blocker) => (
              <article
                className={`detail-card${
                  blockerScrollTarget === blocker.blocker ? " drilldown-focused" : ""
                }`}
                id={readinessBlockerDomId(blocker.blocker)}
                key={blocker.blocker}
              >
                <p className="summary-label">Blocker</p>
                <h3>{formatLabel(blocker.blocker)}</h3>
                <p>{blocker.summary}</p>
                <ul className="compact-list">
                  <li>
                    <span>Severity</span>
                    <strong>{formatLabel(blocker.severity)}</strong>
                  </li>
                  <li>
                    <span>Category</span>
                    <strong>{formatLabel(blocker.category)}</strong>
                  </li>
                  <li>
                    <span>Evidence basis</span>
                    <strong>{formatLabel(blocker.evidence_basis)}</strong>
                  </li>
                  <li>
                    <span>Blocked scopes</span>
                    <strong>
                      {blocker.blocked_readiness_scopes.length > 0
                        ? blocker.blocked_readiness_scopes.map((value) => formatLabel(value)).join(" • ")
                        : "None recorded"}
                    </strong>
                  </li>
                  <li>
                    <span>Related prerequisites</span>
                    {blocker.related_prerequisites.length > 0 ? (
                      <div className="history-evidence-drilldown-actions">
                        {blocker.related_prerequisites.map((value) => (
                          <button
                            key={value}
                            type="button"
                            className="nav-drilldown-button"
                            onClick={() => navigateReadinessDrilldown({ prerequisite: value })}
                          >
                            {formatLabel(value)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <strong> None recorded</strong>
                    )}
                  </li>
                </ul>
              <p className="table-note">
                Item identifier:{" "}
                <IdentifierChip value={blocker.item_id} emptyLabel="Snapshot-scoped only" />
              </p>
              <p className="table-note">
                {describeReadinessBlockerSeverity(blocker.severity)}{" "}
                {describeReadinessBlockerCategory(blocker.category)}
              </p>
                {blocker.notes.length > 0 ? (
                  <ul className="notes-list">
                    {blocker.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </>
      )}

      {prerequisites.length === 0 ? (
        <EmptyState
          title="No prerequisites"
          description="The backend did not return prerequisite detail for the current readiness snapshot."
        />
      ) : (
        <>
          <div className="history-evidence-drilldown">
            <p className="summary-label">Prerequisite drilldown</p>
            <p className="table-note">
              Jump to a prerequisite card. Blockers that reference a prerequisite appear as reverse links
              when the contract lists them — planning-support navigation only.
            </p>
            <div className="history-evidence-drilldown-actions">
              {prerequisites.map((p) => (
                <button
                  key={p.prerequisite}
                  type="button"
                  className="nav-drilldown-button"
                  onClick={() => navigateReadinessDrilldown({ prerequisite: p.prerequisite })}
                >
                  {formatLabel(p.prerequisite)}
                </button>
              ))}
            </div>
          </div>
          <div className="content-grid">
            {prerequisites.map((prerequisite) => {
              const linkedBlockers = blockersLinkedToPrerequisite(prerequisite.prerequisite, blockers);

              return (
                <article
                  className={`detail-card${
                    prerequisiteScrollTarget === prerequisite.prerequisite ? " drilldown-focused" : ""
                  }`}
                  id={readinessPrerequisiteDomId(prerequisite.prerequisite)}
                  key={prerequisite.prerequisite}
                >
                  <p className="summary-label">Prerequisite</p>
                  <h3>{formatLabel(prerequisite.prerequisite)}</h3>
                  <p>{prerequisite.current_evidence}</p>
                  <ul className="compact-list">
                    <li>
                      <span>Status</span>
                      <strong>{formatLabel(prerequisite.status)}</strong>
                    </li>
                    <li>
                      <span>Support posture</span>
                      <strong>{formatLabel(prerequisite.support_posture)}</strong>
                    </li>
                    <li>
                      <span>Evidence basis</span>
                      <strong>{formatLabel(prerequisite.evidence_basis)}</strong>
                    </li>
                    <li>
                      <span>Evidence coverage</span>
                      <strong>{formatLabel(prerequisite.evidence_coverage)}</strong>
                    </li>
                    <li>
                      <span>Related capabilities</span>
                      <strong>
                        {prerequisite.related_capabilities.length > 0
                          ? prerequisite.related_capabilities.map((value) => formatLabel(value)).join(" • ")
                          : "None recorded"}
                      </strong>
                    </li>
                    <li>
                      <span>Blockers referencing this prerequisite</span>
                      {linkedBlockers.length > 0 ? (
                        <div className="history-evidence-drilldown-actions">
                          {linkedBlockers.map((b) => (
                            <button
                              key={b.blocker}
                              type="button"
                              className="nav-drilldown-button"
                              onClick={() => navigateReadinessDrilldown({ blocker: b.blocker })}
                            >
                              {formatLabel(b.blocker)}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <strong> None recorded</strong>
                      )}
                    </li>
                  </ul>
              <p className="table-note">
                Item identifier:{" "}
                <IdentifierChip
                  value={prerequisite.item_id}
                  emptyLabel="Snapshot-scoped only"
                />
              </p>
              <p className="table-note">
                {describeEvidenceCoverage(prerequisite.evidence_coverage)}
              </p>
                  {prerequisite.blocking_gaps.length > 0 ? (
                    <>
                      <p className="summary-label">Blocking Gaps</p>
                      <ul className="notes-list">
                        {prerequisite.blocking_gaps.map((gap) => (
                          <li key={gap}>{gap}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </article>
              );
            })}
          </div>
        </>
      )}

      <p className="footnote">
        This readiness page is backed by the capabilities readiness contract rather than a
        workflow engine. It explains bounded reasoning support only and does not imply
        approvals, execution, rollback, or preview behavior.
      </p>
    </section>
  );
}
