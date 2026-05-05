import type {
  ChangeSafetyCaseResponse,
  ChangeSafetyDashboardResponse,
  FacadeSectionStatus,
} from '../../api/types'
import {
  DataTable,
  DegradedStateBanner,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  MetricCard,
  NonClaimBanner,
  WorkflowStepper,
} from '../../design-system/components'

export type ChangeSafetyViewState = 'ready' | 'loading' | 'empty' | 'error' | 'degraded'

export interface ChangeSafetyPageProps {
  dashboard: ChangeSafetyDashboardResponse
  safetyCase: ChangeSafetyCaseResponse
  state: ChangeSafetyViewState
  path: string
}

function toneFromStatus(status: FacadeSectionStatus): 'healthy' | 'warning' | 'critical' | 'pending' | 'readOnly' {
  if (status === 'partial') return 'warning'
  if (status === 'degraded' || status === 'error' || status === 'blocked') return 'critical'
  return 'readOnly'
}

function viewLabel(path: string): string {
  if (path.endsWith('/plans')) return 'Plans'
  if (path.endsWith('/approval-queue')) return 'Approval Queue'
  if (path.endsWith('/safety-cases')) return 'Safety Cases'
  if (path.endsWith('/rollback')) return 'Rollback'
  return 'Plans'
}

export function ChangeSafetyPage({ dashboard, safetyCase, state, path }: ChangeSafetyPageProps) {
  if (state === 'loading') {
    return <LoadingSkeleton title="Loading state example" message="Plan cards and workflow sections are loading." />
  }

  const kpis = state === 'empty' ? [] : (dashboard.kpis.data ?? [])
  const plans = state === 'empty' ? [] : (dashboard.plans.data ?? [])
  const evidencePack = state === 'empty' ? [] : (dashboard.evidence_pack.data ?? [])
  const prerequisites = state === 'empty' ? [] : (safetyCase.prerequisites.data ?? [])

  return (
    <section className="change-safety">
      <h1>Change Safety</h1>
      <p className="ds-muted">Change Safety workspace: {viewLabel(path)}</p>
      <NonClaimBanner copy="Validation is gate input, not network proof." />
      <NonClaimBanner copy="Safe action is platform-only and does not push device or controller configuration." />

      {state === 'degraded' ? (
        <DegradedStateBanner message="Partial evidence only. Some sources are missing, stale, or unavailable." />
      ) : null}
      {state === 'error' ? (
        <ErrorState
          title="Change Safety data error"
          message="Backend data is unavailable for this section. Do not infer operational state from this placeholder."
        />
      ) : null}

      {kpis.length === 0 ? (
        <EmptyState title="No change plans." message="No change planning evidence is available." />
      ) : (
        <div className="change-safety-kpi-row">
          {kpis.map((kpi) => (
            <MetricCard
              key={kpi.id}
              label={kpi.label}
              value={kpi.value}
              tone={toneFromStatus(kpi.status)}
              helperText={kpi.status}
            />
          ))}
        </div>
      )}

      <div className="change-safety-grid">
        <article className="ds-card">
          <h3>Plans</h3>
          <DataTable
            caption="Change plans"
            columns={['Title', 'Risk', 'Stage', 'Approval']}
            rows={plans.map((plan) => [plan.title, plan.risk, plan.stage, plan.approval_status])}
          />
        </article>

        <article className="ds-card">
          <h3>Safety verdict</h3>
          <p className="ds-muted">{safetyCase.verdict.data?.label ?? 'Unknown verdict'}</p>
          <NonClaimBanner copy="Approval state reflects platform workflow records only." />
          <NonClaimBanner copy="Rollback readiness is compensation-only and is not guaranteed device restoration." />
        </article>
      </div>

      <article className="ds-card">
        <h3>Workflow stepper</h3>
        <WorkflowStepper
          activeStepId={dashboard.workflow_steps.data?.find((step) => step.status === 'active')?.id ?? 'validation'}
          blockedReason="Execution controls are disabled until prerequisite workflow, preview, validation, and approval gates are satisfied by backend records."
          steps={
            dashboard.workflow_steps.data?.map((step) => ({
              id: step.id,
              label: step.label,
              status: step.status,
            })) ?? []
          }
        />
      </article>

      <div className="change-safety-grid">
        <article className="ds-card">
          <h3>Preview and validation</h3>
          <NonClaimBanner copy="Preview is pre-change reasoning only; it is not execution." />
          <DataTable
            caption="Safety case prerequisites"
            columns={['Prerequisite', 'Status', 'Required']}
            rows={prerequisites.map((item) => [item.label, item.status, item.required ? 'yes' : 'no'])}
          />
        </article>

        <article className="ds-card">
          <h3>Evidence and rollback panels</h3>
          <DataTable
            caption="Evidence pack"
            columns={['Label', 'Source contract']}
            rows={evidencePack.map((item) => [item.label, item.source_contract_id])}
          />
          <p className="ds-muted">
            Rollback note: {String(safetyCase.rollback_readiness.data?.note ?? 'No rollback note available.')}
          </p>
        </article>
      </div>

      <article className="ds-card">
        <h3>Reports and exports</h3>
        <p className="ds-muted">Export/report actions are read-only and bounded to evidence payloads.</p>
        <div className="ds-top-controls">
          <button type="button" className="ds-control" aria-label="Download safety case report">
            Download safety case report
          </button>
          <button type="button" className="ds-control" aria-label="Download preview diff report">
            Download preview diff report
          </button>
          <button type="button" className="ds-control" aria-label="Download rollback report">
            Download rollback report
          </button>
        </div>
      </article>

      <article className="ds-card">
        <h3>Controls</h3>
        <p className="ds-muted">Mutation controls are disabled in this batch.</p>
        <div className="ds-top-controls">
          <button type="button" className="ds-control" aria-label="Execute change" disabled>
            Execute change
          </button>
          <button type="button" className="ds-control" aria-label="Rollback change" disabled>
            Rollback change
          </button>
        </div>
      </article>
    </section>
  )
}
