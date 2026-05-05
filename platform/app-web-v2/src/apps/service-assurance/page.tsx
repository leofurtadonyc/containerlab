import type { FacadeSectionStatus, ServiceAssuranceOverviewResponse } from '../../api/types'
import { DataTable, DegradedStateBanner, EmptyState, ErrorState, LoadingSkeleton, MetricCard, NonClaimBanner } from '../../design-system/components'

export type ServiceAssuranceViewState = 'ready' | 'loading' | 'empty' | 'error' | 'degraded'

export interface ServiceAssurancePageProps {
  data: ServiceAssuranceOverviewResponse
  state: ServiceAssuranceViewState
}

function toneFromStatus(status: FacadeSectionStatus): 'healthy' | 'warning' | 'critical' | 'pending' | 'readOnly' {
  if (status === 'partial') return 'warning'
  if (status === 'degraded' || status === 'error' || status === 'blocked') return 'critical'
  return 'readOnly'
}

export function ServiceAssurancePage({ data, state }: ServiceAssurancePageProps) {
  if (state === 'loading') {
    return <LoadingSkeleton title="Loading state example" message="Service health map and service summaries are loading." />
  }

  const kpis = state === 'empty' ? [] : (data.kpis.data ?? [])
  const mapGroups = state === 'empty' ? [] : (data.service_health_map.data?.groups ?? [])
  const topServices = state === 'empty' ? [] : (data.top_impacted_services.data ?? [])
  const incidents = state === 'empty' ? [] : (data.active_incidents.data ?? [])

  return (
    <section className="service-assurance">
      <h1>Service Assurance</h1>
      <NonClaimBanner copy="Service assurance reflects available platform evidence, not full SLA certification." />
      <NonClaimBanner copy="Impact is inferred from current platform models and may be partial." />

      {state === 'degraded' ? (
        <DegradedStateBanner message="Partial evidence only. Some sources are missing, stale, or unavailable." />
      ) : null}
      {state === 'error' ? (
        <ErrorState
          title="Service Assurance data error"
          message="Backend data is unavailable for this section. Do not infer operational state from this placeholder."
        />
      ) : null}

      {kpis.length === 0 ? (
        <EmptyState title="No services observed." message="No service evidence is available yet." />
      ) : (
        <div className="service-assurance-kpi-row">
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

      <div className="service-assurance-grid">
        <article className="ds-card">
          <h3>Service health map</h3>
          <DataTable
            caption="Service health groups"
            columns={['Group', 'Status', 'Impacted services']}
            rows={mapGroups.map((group) => [group.label, group.status, String(group.impacted_services)])}
          />
        </article>

        <article className="ds-card">
          <h3>Top impacted services</h3>
          <DataTable
            caption="Top impacted services"
            columns={['Service', 'Health', 'Impacted customers']}
            rows={topServices.map((service) => [service.name, service.health, String(service.impacted_customers)])}
          />
        </article>
      </div>

      <article className="ds-card">
        <h3>Active incidents</h3>
        <DataTable
          caption="Service assurance active incidents"
          columns={['Incident', 'Severity', 'Service']}
          rows={incidents.map((incident) => [incident.title, incident.severity, incident.service])}
        />
      </article>

      <article className="ds-card">
        <h3>Actions</h3>
        <p className="ds-muted">State-changing service operations are disabled in this batch.</p>
        <div className="ds-top-controls">
          <button type="button" className="ds-control" aria-label="Add service" disabled>
            Add service
          </button>
          <button type="button" className="ds-control" aria-label="Run root-cause analysis" disabled>
            Run root-cause analysis
          </button>
        </div>
      </article>
    </section>
  )
}
