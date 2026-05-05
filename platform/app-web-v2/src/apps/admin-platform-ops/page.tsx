import type { AdminPlatformOpsOverviewResponse, FacadeSectionStatus } from '../../api/types'
import { DataTable, DegradedStateBanner, EmptyState, ErrorState, LoadingSkeleton, MetricCard, NonClaimBanner } from '../../design-system/components'

export type AdminPlatformOpsViewState = 'ready' | 'loading' | 'empty' | 'error' | 'degraded'

export interface AdminPlatformOpsPageProps {
  data: AdminPlatformOpsOverviewResponse
  state: AdminPlatformOpsViewState
}

function toneFromStatus(status: FacadeSectionStatus): 'healthy' | 'warning' | 'critical' | 'pending' | 'readOnly' {
  if (status === 'partial') return 'warning'
  if (status === 'degraded' || status === 'error' || status === 'blocked') return 'critical'
  return 'readOnly'
}

export function AdminPlatformOpsPage({ data, state }: AdminPlatformOpsPageProps) {
  if (state === 'loading') {
    return <LoadingSkeleton title="Loading state example" message="Admin platform status and runtime summaries are loading." />
  }

  const kpis = state === 'empty' ? [] : (data.kpis.data ?? [])
  const serviceHealth = state === 'empty' ? [] : (data.service_health.data ?? [])
  const runtimeStatus = state === 'empty' ? [] : (data.runtime_status.data ?? [])
  const auditSummary = state === 'empty' ? [] : (data.audit_summary.data ?? [])

  return (
    <section className="admin-platform-ops">
      <h1>Admin &amp; Platform Ops</h1>
      <NonClaimBanner copy="Admin controls are read-only placeholders unless backend auth/RBAC and configuration APIs exist." />

      {state === 'degraded' ? (
        <DegradedStateBanner message="Partial evidence only. Some sources are missing, stale, or unavailable." />
      ) : null}
      {state === 'error' ? (
        <ErrorState
          title="Admin & Platform Ops data error"
          message="Backend admin and runtime data is unavailable for this section. Do not infer write capabilities from this placeholder."
        />
      ) : null}

      {kpis.length === 0 ? (
        <EmptyState title="No admin/runtime evidence available." message="Admin platform evidence is unavailable." />
      ) : (
        <div className="admin-platform-ops-kpi-row">
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

      <div className="admin-platform-ops-grid">
        <article className="ds-card">
          <h3>Service health</h3>
          <DataTable
            caption="Admin platform service health"
            columns={['Component', 'Status', 'Detail']}
            rows={serviceHealth.map((item) => [item.component, item.status, item.detail])}
          />
        </article>

        <article className="ds-card">
          <h3>Runtime status</h3>
          <DataTable
            caption="Admin platform runtime status"
            columns={['Runtime', 'Status', 'Detail']}
            rows={runtimeStatus.map((item) => [item.runtime, item.status, item.detail])}
          />
        </article>
      </div>

      <article className="ds-card">
        <h3>Audit summary</h3>
        <DataTable
          caption="Admin platform audit summary"
          columns={['Category', 'Count', 'Status']}
          rows={auditSummary.map((item) => [item.category, item.count, item.status])}
        />
      </article>

      <article className="ds-card">
        <h3>Actions</h3>
        <p className="ds-muted">All admin controls remain disabled until backend auth/RBAC and config APIs exist.</p>
        <div className="ds-top-controls">
          <button type="button" className="ds-control" aria-label="Add user" disabled>
            Add user
          </button>
          <button type="button" className="ds-control" aria-label="Update RBAC roles" disabled>
            Update RBAC roles
          </button>
          <button type="button" className="ds-control" aria-label="Write configuration" disabled>
            Write configuration
          </button>
        </div>
      </article>
    </section>
  )
}
