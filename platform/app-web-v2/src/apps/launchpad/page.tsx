import type { LaunchpadAppsResponse, FacadeMaturity } from '../../api/types'
import { APP_REGISTRY } from '../../app-registry'
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

export type LaunchpadViewState = 'ready' | 'loading' | 'empty' | 'error' | 'degraded'

export interface LaunchpadPageProps {
  data: LaunchpadAppsResponse
  state: LaunchpadViewState
  selectedAppId: string
  onSelectApp: (appId: string) => void
}

function toneFromMaturity(maturity: FacadeMaturity): 'healthy' | 'warning' | 'future' | 'readOnly' {
  if (maturity === 'future' || maturity === 'not_implemented') return 'future'
  if (maturity === 'preview') return 'warning'
  return 'readOnly'
}

export function LaunchpadPage({ data, state, selectedAppId, onSelectApp }: LaunchpadPageProps) {
  if (state === 'loading') {
    return <LoadingSkeleton title="Loading state example" message="Skeleton app cards and snapshot cards are loading." />
  }

  const apps = state === 'empty' ? [] : data.apps
  const futureApps = apps.filter((app) => app.maturity === 'future' || app.maturity === 'not_implemented')
  const activeApp = apps.find((app) => app.id === selectedAppId) ?? apps[0] ?? null

  return (
    <section className="launchpad">
      <h1>Platform Launchpad</h1>
      <p className="ds-muted">
        Platform posture is bounded by available backend evidence and does not indicate production readiness.
      </p>
      <NonClaimBanner copy="This platform is not production-ready and remains conditionally ready with explicit limits." />

      {state === 'degraded' ? (
        <DegradedStateBanner message="Partial evidence only. Some sources are missing, stale, or unavailable." />
      ) : null}
      {state === 'error' ? (
        <ErrorState
          title="Launchpad data error"
          message="Backend data is unavailable for this section. Do not infer operational state from this placeholder."
        />
      ) : null}

      {apps.length === 0 ? (
        <EmptyState
          title="No app posture is available yet."
          message="Backend capability data is unavailable."
        />
      ) : (
        <>
          <div className="launchpad-kpi-row">
            <MetricCard
              label="Network health"
              value={data.operational_snapshot.data?.network_health ?? 'unknown'}
              tone="readOnly"
              helperText={data.operational_snapshot.status}
            />
            <MetricCard
              label="Services at risk"
              value={String(data.operational_snapshot.data?.services_at_risk ?? 'n/a')}
              tone="warning"
              helperText="bounded evidence"
            />
            <MetricCard
              label="Pending approvals"
              value={String(data.operational_snapshot.data?.pending_approvals ?? 'n/a')}
              tone="pending"
              helperText="workflow posture"
            />
            <MetricCard
              label="Evidence confidence"
              value={data.operational_snapshot.data?.evidence_confidence ?? 'partial'}
              tone="readOnly"
              helperText="source-backed"
            />
          </div>

          <div className="launchpad-grid">
            {apps.map((app) => (
              <button
                key={app.id}
                type="button"
                className="launchpad-tile"
                data-active={activeApp?.id === app.id}
                onClick={() => onSelectApp(app.id)}
              >
                <MetricCard
                  label={app.label}
                  value={app.current_posture}
                  tone={toneFromMaturity(app.maturity)}
                  helperText={app.maturity}
                />
              </button>
            ))}
          </div>

          <DataTable
            caption="Launchpad capabilities and posture"
            columns={['Capability', 'Maturity', 'Route']}
            rows={APP_REGISTRY.map((app) => [app.label, app.maturity, app.defaultRoute])}
          />

          {futureApps.length > 0 ? (
            <div className="launchpad-future-grid">
              {futureApps.map((app) => (
                <FutureCapabilityCard
                  key={app.id}
                  title={app.label}
                  reason={app.unavailable_reason ?? 'Future capability: backend support is not implemented yet.'}
                  requiredBackend="api-v2-facade"
                />
              ))}
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
