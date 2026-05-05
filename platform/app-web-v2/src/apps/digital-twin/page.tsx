import type {
  DigitalTwinObjectContextResponse,
  DigitalTwinOverviewResponse,
  FacadeSectionStatus,
} from '../../api/types'
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

export type DigitalTwinViewState = 'ready' | 'loading' | 'empty' | 'error' | 'degraded' | 'future'

export interface DigitalTwinPageProps {
  overview: DigitalTwinOverviewResponse
  objectContext: DigitalTwinObjectContextResponse
  state: DigitalTwinViewState
  path: string
}

function toneFromStatus(status: FacadeSectionStatus): 'healthy' | 'warning' | 'critical' | 'pending' | 'readOnly' {
  if (status === 'partial') return 'warning'
  if (status === 'degraded' || status === 'error' || status === 'blocked') return 'critical'
  return 'readOnly'
}

function viewLabel(path: string): string {
  if (path.endsWith('/map')) return 'Map'
  if (path.endsWith('/paths')) return 'Paths'
  if (path.endsWith('/snapshots')) return 'Snapshots'
  if (path.endsWith('/queries')) return 'Queries'
  return 'Map'
}

export function DigitalTwinPage({ overview, objectContext, state, path }: DigitalTwinPageProps) {
  if (state === 'loading') {
    return <LoadingSkeleton title="Loading state example" message="Topology canvas and evidence sections are loading." />
  }

  const kpis = state === 'empty' ? [] : (overview.kpis.data ?? [])
  const nodes = state === 'empty' ? [] : (overview.topology_graph.data?.nodes ?? [])
  const links = state === 'empty' ? [] : (overview.topology_graph.data?.links ?? [])
  const lanes = state === 'empty' ? [] : (overview.controller_evidence.data?.lanes ?? [])

  return (
    <section className="digital-twin">
      <h1>Network Digital Twin</h1>
      <p className="ds-muted">Digital Twin workspace: {viewLabel(path)}</p>
      <NonClaimBanner copy="Evidence-backed topology view, not a forwarding guarantee." />

      {state === 'degraded' ? (
        <DegradedStateBanner message="Partial evidence only. Some sources are missing, stale, or unavailable." />
      ) : null}
      {state === 'error' ? (
        <ErrorState
          title="Digital Twin data error"
          message="Backend data is unavailable for this section. Do not infer operational state from this placeholder."
        />
      ) : null}

      {kpis.length === 0 ? (
        <EmptyState title="No topology objects." message="No topology evidence is available yet." />
      ) : (
        <div className="digital-twin-kpi-row">
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

      <div className="digital-twin-grid">
        <article className="ds-card">
          <h3>Topology map</h3>
          <p className="ds-muted">Graph-first evidence workspace.</p>
          <DataTable
            caption="Digital twin topology summary"
            columns={['Nodes', 'Links', 'Selected path']}
            rows={[[String(nodes.length), String(links.length), overview.topology_graph.data?.selected_path?.join(' -> ') ?? 'n/a']]}
          />
        </article>

        <article className="ds-card">
          <h3>Path and dependency analysis</h3>
          <NonClaimBanner copy="Path analysis is bounded by available evidence and is not dataplane proof." />
          <p className="ds-muted">Dependencies and path confidence are evidence-derived.</p>
        </article>
      </div>

      <div className="digital-twin-grid">
        <article className="ds-card">
          <h3>Controller evidence lanes</h3>
          <NonClaimBanner copy="Controller evidence is bounded and may be partial or unavailable." />
          <DataTable
            caption="Controller evidence lanes"
            columns={['Lane', 'Posture', 'Evidence strength']}
            rows={lanes.map((lane) => [lane.id, lane.posture, lane.evidence_strength])}
          />
        </article>

        <article className="ds-card">
          <h3>Selected object context</h3>
          <p className="ds-muted">Object: {objectContext.object.label}</p>
          <DataTable
            caption="Object identity"
            columns={['Field', 'Value']}
            rows={Object.entries(objectContext.identity.data ?? {}).map(([field, value]) => [field, value])}
          />
        </article>
      </div>

      {state === 'future' ? (
        <FutureCapabilityCard
          title="What-if simulation"
          reason="Future capability: backend support is not implemented yet."
          requiredBackend="digital-twin-simulation-api"
        />
      ) : null}

      <article className="ds-card">
        <h3>Actions</h3>
        <p className="ds-muted">Simulation and execution actions remain disabled.</p>
        <div className="ds-top-controls">
          <button type="button" className="ds-control" aria-label="Run what-if simulation" disabled>
            Run what-if simulation
          </button>
          <button type="button" className="ds-control" aria-label="Program controller path" disabled>
            Program controller path
          </button>
        </div>
      </article>
    </section>
  )
}
