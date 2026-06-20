import type { LaunchpadAppsResponse, FacadeMaturity } from '../../api/types'
import {
  DegradedStateBanner,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  type StatusTone,
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

function maturityLabel(maturity: FacadeMaturity): string {
  if (maturity === 'future' || maturity === 'not_implemented') return 'Future'
  if (maturity === 'preview') return 'Partial'
  return 'Current'
}

function appIcon(appId: string): string {
  if (appId === 'command-center') return '◉'
  if (appId === 'digital-twin') return '◎'
  if (appId === 'change-safety') return '◇'
  if (appId === 'service-assurance') return '◌'
  if (appId === 'transport-engineering') return '⟍'
  if (appId === 'traffic-intelligence') return '◍'
  if (appId === 'intent-compliance') return '▣'
  if (appId === 'automation-studio') return '⚙'
  if (appId === 'ai-assistant') return '✦'
  if (appId === 'admin-platform-ops') return '☰'
  return '⌂'
}

function appIconToneClass(appId: string): string {
  return `launchpad-app-icon--${appId}`
}

export function LaunchpadPage({ data, state, selectedAppId, onSelectApp }: LaunchpadPageProps) {
  if (state === 'loading') {
    return <LoadingSkeleton title="Loading state example" message="Skeleton app cards and snapshot cards are loading." />
  }

  const apps = state === 'empty' ? [] : data.apps
  const featuredAppIds = ['command-center', 'digital-twin', 'change-safety', 'service-assurance']
  const featuredApps = apps.filter((app) => featuredAppIds.includes(app.id))
  const allAppIds = [
    'transport-engineering',
    'traffic-intelligence',
    'intent-compliance',
    'automation-studio',
    'ai-assistant',
    'admin-platform-ops',
  ]
  const allApps = apps.filter((app) => allAppIds.includes(app.id))
  const activeApp = apps.find((app) => app.id === selectedAppId) ?? apps[0] ?? null
  const recentActivity = [
    { id: 'r1', summary: 'Change Safety analysis completed for CHG-24876', meta: 'impact: 2 services, 4 devices', when: '2m ago' },
    { id: 'r2', summary: 'Digital Twin sync completed successfully', meta: 'NA-East / Fabric', when: '8m ago' },
    { id: 'r3', summary: 'Service Health degradation detected on Video-Streaming', meta: 'Performance impacting 3% of users', when: '18m ago' },
    { id: 'r4', summary: 'Command executed: show bgp summary', meta: 'NAE-RTR-01', when: '22m ago' },
  ]
  const pinnedViews = [
    { id: 'p1', title: 'Global Network Overview', subtitle: 'Command Center' },
    { id: 'p2', title: 'Traffic Heatmap', subtitle: 'Traffic Intelligence' },
    { id: 'p3', title: 'Change Safety Dashboard', subtitle: 'Change Safety' },
    { id: 'p4', title: 'Intent Compliance Posture', subtitle: 'Intent & Compliance' },
    { id: 'p5', title: 'Service Health Executive', subtitle: 'Service Assurance' },
    { id: 'p6', title: 'Automation Dashboard', subtitle: 'Automation Studio' },
  ]
  const snapshotCards: Array<{ id: string; label: string; value: string; tone: StatusTone; helper: string; icon: string }> = [
    {
      id: 'network-health',
      label: 'Network Health',
      value: '98.6%',
      tone: 'healthy',
      helper: 'Healthy',
      icon: '♡',
    },
    {
      id: 'services-at-risk',
      label: 'Services at Risk',
      value: '12',
      tone: 'warning',
      helper: 'Medium',
      icon: '⬡',
    },
    {
      id: 'pending-approvals',
      label: 'Pending Approvals',
      value: '7',
      tone: 'pending',
      helper: 'Requires Action',
      icon: '◌',
    },
    {
      id: 'active-changes',
      label: 'Active Changes',
      value: '23',
      tone: 'pending',
      helper: 'In Progress',
      icon: '↻',
    },
    {
      id: 'evidence-confidence',
      label: 'Evidence Confidence',
      value: '92%',
      tone: 'healthy',
      helper: 'High',
      icon: '◍',
    },
    {
      id: 'topology-sync',
      label: 'Topology Sync',
      value: '99.2%',
      tone: 'healthy',
      helper: 'In Sync',
      icon: '◈',
    },
    {
      id: 'critical-alerts',
      label: 'Critical Alerts',
      value: '3',
      tone: 'critical',
      helper: 'Requires Immediate Attention',
      icon: '△',
    },
  ]
  const upcomingCapabilities = [
    {
      id: 'network-optimization',
      title: 'Network Optimization',
      description: 'AI-driven options for performance and cost tuning',
      eta: 'ETA: Q3 2025',
      icon: '⟲',
    },
    {
      id: 'policy-insights',
      title: 'Policy Insights',
      description: 'Advanced analytics for automated recommendations',
      eta: 'ETA: Q4 2025',
      icon: '▦',
    },
  ]

  return (
    <section className="launchpad">
      {apps.length === 0 ? (
        <>
          {state === 'degraded' ? (
            <DegradedStateBanner message="Partial evidence only. Some sources are missing, stale, or unavailable." />
          ) : null}
          {state === 'error' ? (
            <ErrorState
              title="Launchpad data error"
              message="Backend data is unavailable for this section. Do not infer operational state from this placeholder."
            />
          ) : null}
          <EmptyState
            title="No app posture is available yet."
            message="Backend capability data is unavailable."
          />
        </>
      ) : (
        <>
          <div className="launchpad-command-strip">
            <input
              className="ds-control launchpad-command-input"
              readOnly
              value="Ask or command anything about the network..."
              aria-label="Launchpad command strip"
            />
            <button type="button" className="ds-control ds-icon-control" aria-label="Send command">
              →
            </button>
            <button type="button" className="ds-control">
              Recent Commands
            </button>
          </div>

          <div className="launchpad-header">
            <h1>Platform Launchpad</h1>
            <p className="launchpad-subtitle">
              Choose an app to investigate, assure, optimize, or safely change the network.
            </p>
            <p className="launchpad-honesty">
              Platform posture is bounded by available backend evidence and does not indicate production readiness.
            </p>
            <p className="launchpad-honesty">
              This platform is not production-ready and remains conditionally ready with explicit limits.
            </p>
          </div>

          {state === 'degraded' ? (
            <DegradedStateBanner message="Partial evidence only. Some sources are missing, stale, or unavailable." />
          ) : null}
          {state === 'error' ? (
            <ErrorState
              title="Launchpad data error"
              message="Backend data is unavailable for this section. Do not infer operational state from this placeholder."
            />
          ) : null}

          <div className="launchpad-layout">
            <div className="launchpad-main-column">
              <section className="launchpad-section">
                <div className="launchpad-section-header">
                  <h2>Featured Apps</h2>
                  <button type="button" className="launchpad-text-link">
                    View all apps →
                  </button>
                </div>
                <div className="launchpad-featured-grid">
                  {featuredApps.map((app) => (
                    <button
                      key={`featured-${app.id}`}
                      type="button"
                      className="launchpad-featured-tile"
                      onClick={() => onSelectApp(app.id)}
                    >
                      <div className="launchpad-tile-head">
                        <span className={`launchpad-app-icon ${appIconToneClass(app.id)}`} aria-hidden="true">
                          {appIcon(app.id)}
                        </span>
                        <p className="launchpad-tile-title">{app.label}</p>
                      </div>
                      <p className="launchpad-tile-description">{app.description}</p>
                      <span className="status-chip" data-tone={toneFromMaturity(app.maturity)}>
                        <span aria-hidden="true">●</span>
                        <span>{maturityLabel(app.maturity)}</span>
                      </span>
                      <span className="launchpad-open-app">
                        <span>Open App</span>
                        <span aria-hidden="true">→</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="launchpad-section">
                <h2>All Apps</h2>
                <div className="launchpad-grid">
                  {allApps.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      className="launchpad-tile"
                      data-active={activeApp?.id === app.id}
                      onClick={() => onSelectApp(app.id)}
                    >
                      <div className="launchpad-tile-head">
                        <span className={`launchpad-app-icon ${appIconToneClass(app.id)}`} aria-hidden="true">
                          {appIcon(app.id)}
                        </span>
                        <p className="launchpad-tile-title">{app.label}</p>
                      </div>
                      <p className="launchpad-tile-description">{app.description}</p>
                      <span className="status-chip" data-tone={toneFromMaturity(app.maturity)}>
                        <span aria-hidden="true">●</span>
                        <span>{maturityLabel(app.maturity)}</span>
                      </span>
                      <span className="launchpad-open-app">
                        <span>Open App</span>
                        <span aria-hidden="true">→</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <div className="launchpad-bottom-row">
                <article className="ds-card">
                  <div className="launchpad-section-header">
                    <h2>Recent Activity</h2>
                    <button type="button" className="launchpad-text-link">
                      View all →
                    </button>
                  </div>
                  <ul className="launchpad-list">
                    {recentActivity.map((event) => (
                      <li key={event.id} className="launchpad-list-item launchpad-activity-item">
                        <span className="launchpad-activity-icon" aria-hidden="true">
                          {event.id === 'r1' ? '◇' : event.id === 'r2' ? '◎' : event.id === 'r3' ? '◍' : '⌘'}
                        </span>
                        <div className="launchpad-activity-content">
                          <p className="launchpad-list-title">{event.summary}</p>
                          <p className="ds-muted">{event.meta}</p>
                        </div>
                        <span className="ds-muted">{event.when}</span>
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="ds-card">
                  <div className="launchpad-section-header">
                    <h2>Favorites / Pinned Views</h2>
                    <button type="button" className="launchpad-text-link">
                      Manage ⚙
                    </button>
                  </div>
                  <ul className="launchpad-list launchpad-pinned-grid">
                    {pinnedViews.map((item) => (
                      <li key={item.id} className="launchpad-list-item launchpad-pinned-item">
                        <span className="launchpad-pinned-icon" aria-hidden="true">
                          {item.id === 'p1' ? '◍' : item.id === 'p2' ? '▤' : item.id === 'p3' ? '◇' : item.id === 'p4' ? '▣' : item.id === 'p5' ? '◌' : '⚙'}
                        </span>
                        <div className="launchpad-pinned-content">
                          <p className="launchpad-list-title">{item.title}</p>
                          <p className="ds-muted">{item.subtitle}</p>
                        </div>
                        <span className="launchpad-pinned-star" aria-label="Pinned">★</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </div>

            <aside className="launchpad-side-column">
              <article className="ds-card launchpad-snapshot-panel">
                <div className="launchpad-section-header">
                  <h2>Operational Snapshot</h2>
                  <span className="ds-muted launchpad-snapshot-refresh">↻ Refreshed 2m ago</span>
                </div>
                <div className="launchpad-kpi-row">
                  {snapshotCards.filter((card) => card.id !== 'critical-alerts').map((card) => (
                    <div key={card.id} className="launchpad-snapshot-card">
                      <div className="launchpad-snapshot-card-head">
                        <span className="launchpad-snapshot-icon" aria-hidden="true">
                          {card.icon}
                        </span>
                        <p className="launchpad-snapshot-label">{card.label}</p>
                      </div>
                      <div className="launchpad-snapshot-value-row">
                        <p className="launchpad-snapshot-value">{card.value}</p>
                        <span className={`launchpad-sparkline launchpad-sparkline-${card.tone}`} aria-hidden="true" />
                      </div>
                      <span className="status-chip launchpad-snapshot-status" data-tone={card.tone}>
                        <span aria-hidden="true">●</span>
                        <span>{card.helper}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <button type="button" className="launchpad-critical-card">
                  <span className="launchpad-critical-icon" aria-hidden="true">
                    {snapshotCards.find((card) => card.id === 'critical-alerts')?.icon}
                  </span>
                  <div>
                    <p className="launchpad-snapshot-label">Critical Alerts</p>
                    <p className="launchpad-snapshot-value">{snapshotCards.find((card) => card.id === 'critical-alerts')?.value}</p>
                    <p className="launchpad-critical-helper">Requires Immediate Attention</p>
                  </div>
                  <span aria-hidden="true">→</span>
                </button>
                <button type="button" className="launchpad-command-center-link">
                  Go to Command Center →
                </button>
              </article>

              <article className="ds-card launchpad-upcoming-panel">
                <div className="launchpad-section-header">
                  <h2>Upcoming / Coming Soon</h2>
                  <button type="button" className="launchpad-text-link">
                    View roadmap →
                  </button>
                </div>
                <div className="launchpad-future-grid">
                  {upcomingCapabilities.map((capability) => (
                    <article key={capability.id} className="launchpad-future-card">
                      <span className="launchpad-future-icon" aria-hidden="true">
                        {capability.icon}
                      </span>
                      <div className="launchpad-future-content">
                        <div className="launchpad-future-head">
                          <p className="launchpad-future-title">{capability.title}</p>
                          <span className="status-chip" data-tone="future">
                            <span aria-hidden="true">●</span>
                            <span>Future</span>
                          </span>
                        </div>
                        <p className="launchpad-future-description">{capability.description}</p>
                        <p className="launchpad-future-eta">{capability.eta}</p>
                        <p className="launchpad-future-meta">Future capability: backend support is not implemented yet.</p>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            </aside>
          </div>
        </>
      )}
    </section>
  )
}
