import type { CommandCenterOverviewResponse, FacadeSectionStatus } from '../../api/types'
import {
  DegradedStateBanner,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
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

function severityClass(sev: string): string {
  if (sev === 'Critical') return 'cc-sev-critical'
  if (sev === 'High') return 'cc-sev-high'
  if (sev === 'Medium') return 'cc-sev-medium'
  return 'cc-sev-unknown'
}

function kpiIcon(id: string): string {
  if (id === 'network-health') return '◎'
  if (id === 'active-incidents') return '⚠'
  if (id === 'services-at-risk') return '◈'
  if (id === 'pending-approvals') return '✓'
  if (id === 'active-changes') return '⟳'
  if (id === 'evidence-confidence') return '◉'
  if (id === 'critical-alerts') return '△'
  return '○'
}

function kpiTone(helper: string): string {
  if (helper.toLowerCase().includes('healthy') || helper.toLowerCase().includes('high') || helper.toLowerCase().includes('in sync')) return 'healthy'
  if (helper.toLowerCase().includes('medium') || helper.toLowerCase().includes('in progress') || helper.toLowerCase().includes('requires action')) return 'warning'
  if (helper.toLowerCase().includes('immediate') || helper.toLowerCase().includes('critical')) return 'critical'
  return 'readOnly'
}

function ownerInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

export function CommandCenterPage({ data, state, path }: CommandCenterPageProps) {
  if (state === 'loading') {
    return <LoadingSkeleton title="Loading state example" message="KPI strip and incident queue are loading." />
  }

  const currentView = viewLabel(path)

  const kpis = state === 'empty' ? [] : [
    { id: 'network-health', label: 'Network Health', value: '98.6%', status: 'ok' as FacadeSectionStatus, helper: 'Healthy' },
    { id: 'active-incidents', label: 'Active Incidents', value: '23', status: 'partial' as FacadeSectionStatus, helper: 'vs 1h ago' },
    { id: 'services-at-risk', label: 'Services at Risk', value: '12', status: 'partial' as FacadeSectionStatus, helper: 'Medium' },
    { id: 'pending-approvals', label: 'Pending Approvals', value: '7', status: 'partial' as FacadeSectionStatus, helper: 'Requires Action' },
    { id: 'active-changes', label: 'Active Changes', value: '23', status: 'partial' as FacadeSectionStatus, helper: 'In Progress' },
    { id: 'evidence-confidence', label: 'Evidence Confidence', value: '92%', status: 'ok' as FacadeSectionStatus, helper: 'High' },
    { id: 'critical-alerts', label: 'Critical Alerts', value: '3', status: 'degraded' as FacadeSectionStatus, helper: 'Requires Immediate Attention' },
  ]

  const incidents = state === 'empty' ? [] : [
    { id: 'INC-24876', severity: 'Critical', object: 'Core-RTR-1', objectType: 'Application', symptom: 'Interface Gi1/0/48 Down', owner: 'Taylor Smith', lastUpdated: '2m ago' },
    { id: 'INC-24861', severity: 'High', object: 'Payments API', objectType: 'Application', symptom: 'Elevated Error Rate (5xx)', owner: 'Jordan Lee', lastUpdated: '8m ago' },
    { id: 'INC-24845', severity: 'High', object: 'DC1-SW-Leaf-7', objectType: 'Switch', symptom: 'High Packet Loss', owner: 'Morgan Patel', lastUpdated: '15m ago' },
    { id: 'INC-24833', severity: 'Medium', object: 'Voice Service', objectType: 'Service', symptom: 'MOS Degradation', owner: 'Riley Chen', lastUpdated: '24m ago' },
    { id: 'INC-24810', severity: 'Medium', object: 'Edge-FW-Cluster', objectType: 'Firewall', symptom: 'CPU Utilization High', owner: 'Avery Johnson', lastUpdated: '31m ago' },
  ]

  const timeline = state === 'empty' ? [] : [
    { at: '2m ago', id: 'INC-24876', label: 'Core-RTR-1 interface Gi0/4 down', severity: 'Critical' },
    { at: '8m ago', id: 'INC-24861', label: 'Payments API latency breach', severity: 'High' },
    { at: '15m ago', id: 'INC-24845', label: 'DC1-SW-Leaf-7 packet-loss threshold crossed', severity: 'High' },
    { at: '24m ago', id: 'INC-24833', label: 'Voice Service MOS degradation', severity: 'Medium' },
    { at: '31m ago', id: 'INC-24810', label: 'Edge-FW-Cluster CPU Utilization High', severity: 'Medium' },
  ]

  const situationRoom = state === 'empty' ? null : data.situation_room.data

  const tabs = ['Overview', 'Incidents', 'Investigations', 'Services', 'Changes', 'Evidence', 'Reports']

  return (
    <section className="command-center">
      <div className="command-center-command-row">
        <input
          className="ds-control command-center-command-input"
          aria-label="Command center input"
          value="Ask or command anything about the network..."
          readOnly
        />
        <button type="button" className="ds-control ds-icon-control" aria-label="Send command">→</button>
        <button type="button" className="ds-control">Recent Commands</button>
      </div>

      <div className="command-center-header">
        <div className="command-center-header-text">
          <h1>Command Center</h1>
          <p className="command-center-subtitle">Real-time network operations and incident response.</p>
          {/* Route label for test and accessibility compatibility */}
          <span className="cc-view-label">Triage workspace: {currentView}</span>
        </div>
        <div className="command-center-actions">
          <button type="button" className="cc-btn-primary" aria-label="Investigate">Investigate</button>
          <button type="button" className="cc-btn-outline" aria-label="Open Situation Room">Open Situation Room</button>
          <button type="button" className="ds-control ds-icon-control" aria-label="More actions">⋯</button>
        </div>
      </div>

      <p className="cc-safety-note">
        Triage view only. This screen does not determine root cause or authorize remediation.
      </p>

      {state === 'degraded' ? (
        <DegradedStateBanner message="Partial evidence only. Some sources are missing, stale, or unavailable." />
      ) : null}
      {state === 'error' ? (
        <ErrorState
          title="Command Center data error"
          message="Backend data is unavailable for this section. Do not infer operational state from this placeholder."
        />
      ) : null}

      <div className="cc-tab-bar" role="tablist" aria-label="Command Center views">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            className="cc-tab"
            aria-current={tab === 'Overview' ? 'page' : undefined}
          >
            {tab}
          </button>
        ))}
      </div>

      {kpis.length === 0 ? (
        <EmptyState title="No active incidents." message="Recent evidence is unavailable. Use global search to continue triage." />
      ) : (
        <div className="command-center-kpi-row">
          {kpis.map((kpi) => (
            <article key={kpi.id} className={`command-center-kpi-card${kpi.id === 'critical-alerts' ? ' cc-kpi-critical' : ''}`}>
              <div className="cc-kpi-icon-tile" data-tone={toneFromStatus(kpi.status)}>
                <span aria-hidden="true">{kpiIcon(kpi.id)}</span>
              </div>
              <p className="command-center-kpi-label">{kpi.label}</p>
              <p className="command-center-kpi-value">{kpi.value}</p>
              <span className="cc-kpi-status" data-tone={kpiTone(kpi.helper)}>
                <span className="cc-kpi-dot" aria-hidden="true">●</span>
                <span>{kpi.helper}</span>
              </span>
              <span className="command-center-kpi-trend" aria-hidden="true" />
            </article>
          ))}
        </div>
      )}

      <div className="command-center-main-grid">
        <article className="cc-panel cc-incident-panel">
          <div className="command-center-section-head">
            <h2>Incident Queue ({incidents.length > 0 ? 23 : 0})</h2>
            <div className="cc-table-controls">
              <span className="cc-control-label">Group by <strong>None</strong></span>
              <span className="cc-control-label">Sort by <strong>Priority</strong></span>
              <button type="button" className="cc-icon-btn" aria-label="Toggle view">⊞</button>
              <button type="button" className="cc-icon-btn" aria-label="Refresh">↻</button>
            </div>
          </div>
          {incidents.length > 0 ? (
            <>
              <table className="cc-incident-table">
                <caption className="ds-sr-only">Command center incidents</caption>
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>ID</th>
                    <th>Object / Service</th>
                    <th>Symptom</th>
                    <th>Owner</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => (
                    <tr key={inc.id}>
                      <td>
                        <span className={`cc-severity-pill ${severityClass(inc.severity)}`}>
                          <span className="cc-sev-dot" aria-hidden="true">●</span>
                          {inc.severity}
                        </span>
                      </td>
                      <td>
                        <a className="cc-incident-id">{inc.id}</a>
                      </td>
                      <td>
                        <div className="cc-object-cell">
                          <span className="cc-object-icon" aria-hidden="true">⬡</span>
                          <div>
                            <span className="cc-object-name">{inc.object}</span>
                            <span className="cc-object-type">{inc.objectType}</span>
                          </div>
                        </div>
                      </td>
                      <td className="cc-symptom">{inc.symptom}</td>
                      <td>
                        <div className="cc-owner-cell">
                          <span className="cc-owner-avatar">{ownerInitials(inc.owner)}</span>
                          <span className="cc-owner-name">{inc.owner}</span>
                        </div>
                      </td>
                      <td className="cc-last-updated">{inc.lastUpdated}</td>
                      <td>
                        <div className="cc-row-actions">
                          <button type="button" className="cc-icon-btn" aria-label={`Inspect ${inc.id}`}>◉</button>
                          <button type="button" className="cc-icon-btn" aria-label={`Edit ${inc.id}`}>✎</button>
                          <button type="button" className="cc-icon-btn" aria-label={`More for ${inc.id}`}>⋯</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="cc-table-footer">
                <a className="cc-view-all-link">View all incidents →</a>
              </div>
            </>
          ) : (
            <EmptyState title="No incident queue entries." message="No incident queue evidence is available." />
          )}
        </article>

        <article className="cc-panel cc-map-panel">
          <div className="command-center-section-head">
            <h2>Network Operations Map <span className="cc-map-info" aria-hidden="true">ⓘ</span></h2>
            <a className="cc-link">View full map</a>
          </div>
          <div className="cc-map-area">
            <div className="cc-map-bg">
              <div className="cc-map-region cc-map-na-east">
                <span className="cc-map-node cc-node-healthy" aria-label="Healthy node" />
                <span className="cc-map-node cc-node-critical cc-node-offset" aria-label="Critical node" />
                <span className="cc-region-label">NA-East</span>
              </div>
              <div className="cc-map-region cc-map-eu-west">
                <span className="cc-map-node cc-node-warning" aria-label="Degraded node" />
                <span className="cc-region-label">EU-West</span>
              </div>
              <div className="cc-map-region cc-map-ap-south">
                <span className="cc-map-node cc-node-unknown" aria-label="Unknown node" />
                <span className="cc-region-label">AP-South</span>
              </div>
            </div>
          </div>
          <div className="cc-map-legend">
            <span className="cc-legend-item"><span className="cc-legend-dot cc-node-healthy" />Healthy</span>
            <span className="cc-legend-item"><span className="cc-legend-dot cc-node-warning" />Degraded</span>
            <span className="cc-legend-item"><span className="cc-legend-dot cc-node-critical" />Critical</span>
            <span className="cc-legend-item"><span className="cc-legend-dot cc-node-unknown" />Unknown</span>
          </div>
        </article>
      </div>

      <div className="command-center-bottom-grid">
        <article className="cc-panel cc-timeline-panel">
          <div className="command-center-section-head">
            <h2>Recent Incidents Timeline</h2>
            <a className="cc-link">View all</a>
          </div>
          {timeline.length > 0 ? (
            <div className="cc-timeline">
              <div className="cc-timeline-track" aria-hidden="true" />
              {timeline.map((entry) => (
                <div key={entry.id} className="cc-timeline-row">
                  <span className="cc-timeline-marker" aria-hidden="true" />
                  <span className="cc-timeline-time">{entry.at}</span>
                  <div className="cc-timeline-body">
                    <a className="cc-incident-id">{entry.id}</a>
                    <p className="cc-timeline-text">{entry.label}</p>
                  </div>
                  <span className={`cc-sev-badge ${severityClass(entry.severity)}`}>{entry.severity}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No timeline entries." message="No timeline evidence is available." />
          )}
        </article>

        <article className="cc-panel cc-situation-room">
          <div className="command-center-section-head">
            <h2>Situation Room (1 Active)</h2>
            <a className="cc-link">Open all</a>
          </div>
          {situationRoom ? (
            <div className="cc-sr-body">
              <p className="cc-sr-title">Major Incident: Core-RTR-1 Connectivity</p>
              <p className="cc-sr-started">Started 10:14 AM (29m ago)</p>
              <div className="cc-sr-impact">
                <span className="cc-impact-label">Impact</span>
                <p>Multiple services experiencing loss of connectivity</p>
              </div>
              <p className="cc-sr-status">Triage in Progress</p>
              <div className="cc-progress-track">
                <div className="cc-progress-fill" style={{ width: '28%' }} />
                <span className="cc-progress-pct">28%</span>
              </div>
              <div className="cc-avatar-stack">
                <span className="cc-participant-avatar">TS</span>
                <span className="cc-participant-avatar">MR</span>
                <span className="cc-participant-avatar">+4</span>
              </div>
              <button type="button" className="cc-open-sr-btn">Open Situation Room →</button>
            </div>
          ) : (
            <EmptyState title="Situation room unavailable." message="No situation room summary is available." />
          )}
        </article>
      </div>

      <div className="cc-action-bar">
        <button type="button" className="cc-action-btn" aria-label="Assign owner" disabled>
          <span aria-hidden="true">👤</span> Assign Owner
        </button>
        <button type="button" className="cc-action-btn" aria-label="Create incident" disabled>
          <span aria-hidden="true">📋</span> Create Briefing
        </button>
        <button type="button" className="cc-action-btn" aria-label="Run remediation" disabled>
          <span aria-hidden="true">⚖</span> Compare Evidence
        </button>
        <button type="button" className="cc-action-btn cc-action-dropdown" disabled>
          <span aria-hidden="true">⬇</span> Export Summary
        </button>
        <button type="button" className="cc-action-btn cc-action-primary">
          <span aria-hidden="true">↻</span> Refresh Data
        </button>
        <span className="cc-auto-refresh"><span className="cc-auto-dot" aria-hidden="true">●</span> Auto-refresh: On</span>
      </div>
    </section>
  )
}
