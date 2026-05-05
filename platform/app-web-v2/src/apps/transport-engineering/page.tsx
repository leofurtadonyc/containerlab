import type { FacadeSectionStatus, TransportEngineeringOverviewResponse } from '../../api/types'
import {
  DataTable,
  DegradedStateBanner,
  EmptyState,
  ErrorState,
  FutureCapabilityCard,
  LoadingSkeleton,
  MetricCard,
  NonClaimBanner,
} from '../../design-system/components'

export type TransportEngineeringViewState = 'ready' | 'loading' | 'empty' | 'error' | 'degraded'

export interface TransportEngineeringPageProps {
  data: TransportEngineeringOverviewResponse
  state: TransportEngineeringViewState
}

function toneFromStatus(status: FacadeSectionStatus): 'healthy' | 'warning' | 'critical' | 'pending' | 'readOnly' {
  if (status === 'partial') return 'warning'
  if (status === 'degraded' || status === 'error' || status === 'blocked') return 'critical'
  return 'readOnly'
}

export function TransportEngineeringPage({ data, state }: TransportEngineeringPageProps) {
  if (state === 'loading') {
    return <LoadingSkeleton title="Loading state example" message="Topology map and transport panels are loading." />
  }

  const kpis = state === 'empty' ? [] : (data.kpis.data ?? [])
  const utilization = state === 'empty' ? [] : (data.utilization_panels.data ?? [])
  const opportunities = state === 'empty' ? [] : (data.optimization_opportunities.data ?? [])

  return (
    <section className="transport-engineering">
      <h1>Transport Engineering</h1>
      <NonClaimBanner copy="Transport engineering views are evidence-backed planning aids, not controller programming." />
      <NonClaimBanner copy="Optimization actions are disabled until backend support exists." />

      {state === 'degraded' ? (
        <DegradedStateBanner message="Partial evidence only. Some sources are missing, stale, or unavailable." />
      ) : null}
      {state === 'error' ? (
        <ErrorState
          title="Transport Engineering data error"
          message="Backend data is unavailable for this section. Do not infer operational state from this placeholder."
        />
      ) : null}

      {kpis.length === 0 ? (
        <EmptyState title="No path/topology evidence." message="Transport evidence is unavailable." />
      ) : (
        <div className="transport-engineering-kpi-row">
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

      <div className="transport-engineering-grid">
        <article className="ds-card">
          <h3>Network topology map</h3>
          <DataTable
            caption="Transport topology map summary"
            columns={['Nodes', 'Links', 'Selected path']}
            rows={[
              [
                String(data.topology_map.data?.nodes ?? 'n/a'),
                String(data.topology_map.data?.links ?? 'n/a'),
                data.topology_map.data?.selected_path?.join(' -> ') ?? 'n/a',
              ],
            ]}
          />
        </article>

        <article className="ds-card">
          <h3>Utilization and demand panels</h3>
          <DataTable
            caption="Transport utilization panels"
            columns={['Panel', 'Value', 'Status']}
            rows={utilization.map((panel) => [panel.label, panel.value, panel.status])}
          />
        </article>
      </div>

      <article className="ds-card">
        <h3>Optimization opportunities</h3>
        {opportunities.length > 0 ? (
          opportunities.map((item) => (
            <FutureCapabilityCard
              key={item.id}
              title={item.title}
              reason={item.reason}
              requiredBackend="transport-optimization-api"
            />
          ))
        ) : (
          <EmptyState title="No optimization opportunities available." message="No transport optimization evidence is available." />
        )}
      </article>

      <article className="ds-card">
        <h3>Actions</h3>
        <p className="ds-muted">Optimization and programming actions remain disabled.</p>
        <div className="ds-top-controls">
          <button type="button" className="ds-control" aria-label="Compute paths" disabled>
            Compute paths
          </button>
          <button type="button" className="ds-control" aria-label="Optimize network" disabled>
            Optimize network
          </button>
        </div>
      </article>
    </section>
  )
}
