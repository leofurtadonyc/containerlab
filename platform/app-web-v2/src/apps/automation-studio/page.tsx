import type { AutomationStudioOverviewResponse, FacadeSectionStatus } from '../../api/types'
import { DataTable, DegradedStateBanner, EmptyState, ErrorState, LoadingSkeleton, MetricCard, NonClaimBanner } from '../../design-system/components'

export type AutomationStudioViewState = 'ready' | 'loading' | 'empty' | 'error' | 'degraded'

export interface AutomationStudioPageProps {
  data: AutomationStudioOverviewResponse
  state: AutomationStudioViewState
}

function toneFromStatus(status: FacadeSectionStatus): 'healthy' | 'warning' | 'critical' | 'pending' | 'readOnly' {
  if (status === 'partial') return 'warning'
  if (status === 'degraded' || status === 'error' || status === 'blocked') return 'critical'
  return 'readOnly'
}

export function AutomationStudioPage({ data, state }: AutomationStudioPageProps) {
  if (state === 'loading') {
    return <LoadingSkeleton title="Loading state example" message="Workflow records and approvals are loading." />
  }

  const kpis = state === 'empty' ? [] : (data.kpis.data ?? [])
  const workflows = state === 'empty' ? [] : (data.workflow_canvas.data ?? [])
  const executions = state === 'empty' ? [] : (data.recent_executions.data ?? [])
  const integrations = state === 'empty' ? [] : (data.integrations_health.data ?? [])
  const approvals = state === 'empty' ? [] : (data.approval_queue.data ?? [])

  return (
    <section className="automation-studio">
      <h1>Automation Studio</h1>
      <NonClaimBanner copy="Automation is bounded to backend-supported workflow records. It is not autonomous remediation or general device actuation." />
      <NonClaimBanner copy="Execution controls are disabled until prerequisite workflow, preview, validation, and approval gates are satisfied by backend records." />

      {state === 'degraded' ? (
        <DegradedStateBanner message="Partial evidence only. Some sources are missing, stale, or unavailable." />
      ) : null}
      {state === 'error' ? (
        <ErrorState
          title="Automation Studio data error"
          message="Backend workflow data is unavailable for this section. Do not infer executable readiness from this placeholder."
        />
      ) : null}

      {kpis.length === 0 ? (
        <EmptyState title="No workflow records available." message="No workflow evidence is available." />
      ) : (
        <div className="automation-studio-kpi-row">
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

      <div className="automation-studio-grid">
        <article className="ds-card">
          <h3>Workflow canvas</h3>
          <DataTable
            caption="Automation workflows"
            columns={['Workflow', 'Status', 'Owner']}
            rows={workflows.map((workflow) => [workflow.name, workflow.status, workflow.owner])}
          />
        </article>

        <article className="ds-card">
          <h3>Recent executions</h3>
          <DataTable
            caption="Automation recent executions"
            columns={['Workflow', 'Status', 'Started']}
            rows={executions.map((run) => [run.workflow, run.status, run.started_at])}
          />
        </article>
      </div>

      <div className="automation-studio-grid">
        <article className="ds-card">
          <h3>Integrations health</h3>
          <DataTable
            caption="Automation integrations health"
            columns={['Integration', 'Status']}
            rows={integrations.map((integration) => [integration.integration, integration.status])}
          />
        </article>

        <article className="ds-card">
          <h3>Approval queue</h3>
          <DataTable
            caption="Automation approval queue"
            columns={['Summary', 'State']}
            rows={approvals.map((approval) => [approval.summary, approval.state])}
          />
        </article>
      </div>

      <article className="ds-card">
        <h3>Actions</h3>
        <p className="ds-muted">Execution and workflow-modifying controls remain disabled in this batch.</p>
        <div className="ds-top-controls">
          <button type="button" className="ds-control" aria-label="Create workflow" disabled>
            Create workflow
          </button>
          <button type="button" className="ds-control" aria-label="Run dry run" disabled>
            Run dry run
          </button>
          <button type="button" className="ds-control" aria-label="Execute workflow" disabled>
            Execute workflow
          </button>
        </div>
      </article>
    </section>
  )
}
