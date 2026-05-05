import type { CommandCenterOverviewResponse, FacadeSectionStatus } from '../../api/types'
import {
  DataTable,
  DegradedStateBanner,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  MetricCard,
  NonClaimBanner,
} from '../../design-system/components'

export type CommandCenterViewState = 'ready' | 'loading' | 'empty' | 'error' | 'degraded'

export interface CommandCenterPageProps {
  data: CommandCenterOverviewResponse
  state: CommandCenterViewState
  path: string
}

function toneFromStatus(status: FacadeSectionStatus): 'healthy' | 'warning' | 'critical' | 'pending' | 'readOnly' {
  if (status === 'partial') return 'warning'
  if (status === 'degraded' || status === 'error' || status === 'blocked') return 'critical'
  return 'readOnly'
}

function viewLabel(path: string): string {
  if (path.endsWith('/incidents')) return 'Incidents'
  if (path.endsWith('/situation-room')) return 'Situation Room'
  return 'Overview'
}

export function CommandCenterPage({ data, state, path }: CommandCenterPageProps) {
  if (state === 'loading') {
    return <LoadingSkeleton title="Loading state example" message="KPI strip and incident queue are loading." />
  }

  const kpis = state === 'empty' ? [] : (data.kpis.data ?? [])
  const incidents = state === 'empty' ? [] : (data.incident_queue.data ?? [])
  const timeline = state === 'empty' ? [] : (data.recent_timeline.data ?? [])
  const situationRoom = state === 'empty' ? null : data.situation_room.data

  return (
    <section className="command-center">
      <h1>Command Center</h1>
      <p className="ds-muted">Triage workspace: {viewLabel(path)}</p>
      <NonClaimBanner copy="Triage view only. This screen does not determine root cause or authorize remediation." />

      {state === 'degraded' ? (
        <DegradedStateBanner message="Partial evidence only. Some sources are missing, stale, or unavailable." />
      ) : null}
      {state === 'error' ? (
        <ErrorState
          title="Command Center data error"
          message="Backend data is unavailable for this section. Do not infer operational state from this placeholder."
        />
      ) : null}

      {kpis.length === 0 ? (
        <EmptyState title="No active incidents." message="Recent evidence is unavailable. Use global search to continue triage." />
      ) : (
        <div className="command-center-kpi-row">
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

      <div className="command-center-grid">
        <article className="ds-card">
          <h3>Incident queue</h3>
          {incidents.length > 0 ? (
            <DataTable
              caption="Command center incidents"
              columns={['Severity', 'Subject', 'Symptom', 'Evidence']}
              rows={incidents.map((incident) => [
                incident.severity,
                incident.subject,
                incident.symptom,
                incident.evidence_confidence,
              ])}
            />
          ) : (
            <EmptyState title="No incident queue entries." message="No incident queue evidence is available." />
          )}
        </article>

        <article className="ds-card">
          <h3>Network operations map</h3>
          <p className="ds-muted">Map placeholder is bounded to available backend evidence.</p>
          <p className="ds-muted">Investigate from queue and timeline before operational decisions.</p>
        </article>
      </div>

      <div className="command-center-grid">
        <article className="ds-card">
          <h3>Recent timeline</h3>
          {timeline.length > 0 ? (
            <DataTable
              caption="Command center timeline"
              columns={['At', 'Event', 'Severity']}
              rows={timeline.map((entry) => [entry.at, entry.label, entry.severity])}
            />
          ) : (
            <EmptyState title="No timeline entries." message="No timeline evidence is available." />
          )}
        </article>

        <article className="ds-card">
          <h3>Situation room summary</h3>
          {situationRoom ? (
            <>
              <p>{situationRoom.summary}</p>
              <p className="ds-muted">Route: {situationRoom.route}</p>
              <button type="button" className="ds-control">
                Open Situation Room
              </button>
            </>
          ) : (
            <EmptyState title="Situation room unavailable." message="No situation room summary is available." />
          )}
        </article>
      </div>

      <article className="ds-card">
        <h3>Controls</h3>
        <p className="ds-muted">State-changing actions are disabled until backend support exists.</p>
        <div className="ds-top-controls">
          <button type="button" className="ds-control" aria-label="Assign owner" disabled>
            Assign owner
          </button>
          <button type="button" className="ds-control" aria-label="Create incident" disabled>
            Create incident
          </button>
          <button type="button" className="ds-control" aria-label="Run remediation" disabled>
            Run remediation
          </button>
        </div>
      </article>
    </section>
  )
}
