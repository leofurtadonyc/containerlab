import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { facadeClient } from '../api/client'
import { ChangeSafetyPage, type ChangeSafetyViewState } from '../apps/change-safety/page'
import { CommandCenterPage, type CommandCenterViewState } from '../apps/command-center/page'
import { DigitalTwinPage, type DigitalTwinViewState } from '../apps/digital-twin/page'
import { ServiceAssurancePage, type ServiceAssuranceViewState } from '../apps/service-assurance/page'
import { TransportEngineeringPage, type TransportEngineeringViewState } from '../apps/transport-engineering/page'
import { TrafficIntelligencePage } from '../apps/traffic-intelligence/page'
import { IntentCompliancePage, type IntentComplianceViewState } from '../apps/intent-compliance/page'
import { AutomationStudioPage, type AutomationStudioViewState } from '../apps/automation-studio/page'
import { AIAssistantPage } from '../apps/ai-assistant/page'
import { AdminPlatformOpsPage, type AdminPlatformOpsViewState } from '../apps/admin-platform-ops/page'
import { APP_REGISTRY } from '../app-registry'
import { LaunchpadPage, type LaunchpadViewState } from '../apps/launchpad/page'
import {
  getChangeSafetyCaseFixture,
  getChangeSafetyDashboardFixture,
  getCommandCenterOverviewFixture,
  getDigitalTwinObjectContextFixture,
  getDigitalTwinOverviewFixture,
  getLaunchpadAppsFixture,
  getIntentComplianceOverviewFixture,
  getAutomationStudioOverviewFixture,
  getAdminPlatformOpsOverviewFixture,
  getServiceAssuranceOverviewFixture,
  getTransportEngineeringOverviewFixture,
} from '../fixtures'
import {
  APP_TABS_BY_APP,
  APP_VERTICAL_MENU_BY_APP,
  ROUTE_REGISTRY,
  getDefaultPathForApp,
  getInvalidRouteFallback,
  getRouteByPath,
} from '../routes'
import {
  AppShell,
  AppSidebar,
  AppTabs,
  ApprovalQueue,
  ConfidenceMeter,
  ContextDrawer,
  DataTable,
  DegradedStateBanner,
  EmptyState,
  ErrorState,
  EvidenceDrawer,
  FutureCapabilityCard,
  LoadingSkeleton,
  MetricCard,
  NonClaimBanner,
  TopBar,
  VerticalMenu,
  WorkflowStepper,
} from '../design-system/components'

function readInitialPath(): string {
  const path = window.location.pathname || '/app/launchpad'
  return path === '/' ? '/app/launchpad' : path
}

export function GlobalShell() {
  const [currentPath, setCurrentPath] = useState<string>(readInitialPath)

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, '', path)
    setCurrentPath(path)
  }, [])
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [launchpadStateOverride] = useState<LaunchpadViewState>(() => {
    const search = new URLSearchParams(window.location.search)
    const value = search.get('launchpadState')
    if (value === 'loading' || value === 'empty' || value === 'error' || value === 'degraded') {
      return value
    }
    return 'ready'
  })
  const [launchpadData, setLaunchpadData] = useState(getLaunchpadAppsFixture)
  const [commandCenterStateOverride] = useState<CommandCenterViewState>(() => {
    const search = new URLSearchParams(window.location.search)
    const value = search.get('commandCenterState')
    if (value === 'loading' || value === 'empty' || value === 'error' || value === 'degraded') {
      return value
    }
    return 'ready'
  })
  const [commandCenterData, setCommandCenterData] = useState(getCommandCenterOverviewFixture)
  const [digitalTwinStateOverride] = useState<DigitalTwinViewState>(() => {
    const search = new URLSearchParams(window.location.search)
    const value = search.get('digitalTwinState')
    if (value === 'loading' || value === 'empty' || value === 'error' || value === 'degraded' || value === 'future') {
      return value
    }
    return 'ready'
  })
  const [digitalTwinData, setDigitalTwinData] = useState(getDigitalTwinOverviewFixture)
  const [selectedDigitalTwinObjectId, setSelectedDigitalTwinObjectId] = useState('r1')
  const [digitalTwinObjectContext, setDigitalTwinObjectContext] = useState(() =>
    getDigitalTwinObjectContextFixture('r1'),
  )
  const [changeSafetyStateOverride] = useState<ChangeSafetyViewState>(() => {
    const search = new URLSearchParams(window.location.search)
    const value = search.get('changeSafetyState')
    if (value === 'loading' || value === 'empty' || value === 'error' || value === 'degraded') {
      return value
    }
    return 'ready'
  })
  const [changeSafetyDashboard, setChangeSafetyDashboard] = useState(getChangeSafetyDashboardFixture)
  const [selectedChangeId, setSelectedChangeId] = useState('chg-100')
  const [changeSafetyCase, setChangeSafetyCase] = useState(() => getChangeSafetyCaseFixture('chg-100'))
  const [serviceAssuranceStateOverride] = useState<ServiceAssuranceViewState>(() => {
    const search = new URLSearchParams(window.location.search)
    const value = search.get('serviceAssuranceState')
    if (value === 'loading' || value === 'empty' || value === 'error' || value === 'degraded') {
      return value
    }
    return 'ready'
  })
  const [serviceAssuranceData, setServiceAssuranceData] = useState(getServiceAssuranceOverviewFixture)
  const [transportEngineeringStateOverride] = useState<TransportEngineeringViewState>(() => {
    const search = new URLSearchParams(window.location.search)
    const value = search.get('transportEngineeringState')
    if (value === 'loading' || value === 'empty' || value === 'error' || value === 'degraded') {
      return value
    }
    return 'ready'
  })
  const [transportEngineeringData, setTransportEngineeringData] = useState(getTransportEngineeringOverviewFixture)
  const [intentComplianceStateOverride] = useState<IntentComplianceViewState>(() => {
    const search = new URLSearchParams(window.location.search)
    const value = search.get('intentComplianceState')
    if (value === 'loading' || value === 'empty' || value === 'error' || value === 'degraded') {
      return value
    }
    return 'ready'
  })
  const [intentComplianceData, setIntentComplianceData] = useState(getIntentComplianceOverviewFixture)
  const [automationStudioStateOverride] = useState<AutomationStudioViewState>(() => {
    const search = new URLSearchParams(window.location.search)
    const value = search.get('automationStudioState')
    if (value === 'loading' || value === 'empty' || value === 'error' || value === 'degraded') {
      return value
    }
    return 'ready'
  })
  const [automationStudioData, setAutomationStudioData] = useState(getAutomationStudioOverviewFixture)
  const [adminPlatformOpsStateOverride] = useState<AdminPlatformOpsViewState>(() => {
    const search = new URLSearchParams(window.location.search)
    const value = search.get('adminPlatformOpsState')
    if (value === 'loading' || value === 'empty' || value === 'error' || value === 'degraded') {
      return value
    }
    return 'ready'
  })
  const [adminPlatformOpsData, setAdminPlatformOpsData] = useState(getAdminPlatformOpsOverviewFixture)
  const [selectedLaunchpadAppId, setSelectedLaunchpadAppId] = useState('launchpad')
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const resolvedRoute = getRouteByPath(currentPath)
  const fallback = resolvedRoute ? null : getInvalidRouteFallback(currentPath)
  const activeRoute = resolvedRoute ?? getRouteByPath('/app/launchpad')
  const activeAppId = activeRoute ? activeRoute.appId : 'launchpad'

  const appItems = useMemo(
    () =>
      APP_REGISTRY.map((app) => ({
        id: app.id,
        label: app.label,
        disabled: app.maturity === 'future',
        icon:
          app.id === 'launchpad' ? '⊞'
            : app.id === 'command-center' ? '▤'
              : app.id === 'digital-twin' ? '⬡'
                : app.id === 'change-safety' ? '⛨'
                  : app.id === 'service-assurance' ? '◈'
                    : app.id === 'transport-engineering' ? '↗'
                      : app.id === 'traffic-intelligence' ? '≋'
                        : app.id === 'intent-compliance' ? '☑'
                          : app.id === 'automation-studio' ? '⚙'
                            : app.id === 'ai-assistant' ? '✦'
                              : '⊟',
      })),
    [],
  )

  const tabItems = APP_TABS_BY_APP[activeAppId]
  const menuItems = APP_VERTICAL_MENU_BY_APP[activeAppId]

  // Build tab-id → path and verticalMenu-id → path lookups from the route registry
  const tabPathMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const route of ROUTE_REGISTRY) {
      if (route.tabId && !map[route.tabId]) map[route.tabId] = route.path
    }
    return map
  }, [])

  const menuPathMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const route of ROUTE_REGISTRY) {
      if (route.verticalMenuId && !map[route.verticalMenuId]) map[route.verticalMenuId] = route.path
    }
    return map
  }, [])

  useEffect(() => {
    function handlePopState() {
      setCurrentPath(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === '/' && !(event.target instanceof HTMLInputElement)) {
        event.preventDefault()
        searchInputRef.current?.focus()
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsCommandPaletteOpen(true)
      }

      if (event.key === 'Escape') {
        setIsCommandPaletteOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    facadeClient.getLaunchpadApps().then((response) => {
      setLaunchpadData(response)
      if (response.apps.some((app) => app.id === selectedLaunchpadAppId)) {
        return
      }
      setSelectedLaunchpadAppId(response.apps[0]?.id ?? 'launchpad')
    })
  }, [selectedLaunchpadAppId])

  useEffect(() => {
    facadeClient.getCommandCenterOverview().then((response) => {
      setCommandCenterData(response)
    })
  }, [])

  useEffect(() => {
    facadeClient.getDigitalTwinOverview().then((response) => {
      setDigitalTwinData(response)
      const firstNode = response.topology_graph.data?.nodes[0]
      const nodeId =
        typeof firstNode === 'object' && firstNode !== null && 'id' in firstNode
          ? String(firstNode.id)
          : 'r1'
      setSelectedDigitalTwinObjectId(nodeId)
    })
  }, [])

  useEffect(() => {
    facadeClient.getDigitalTwinObjectContext(selectedDigitalTwinObjectId).then((response) => {
      setDigitalTwinObjectContext(response)
    })
  }, [selectedDigitalTwinObjectId])

  useEffect(() => {
    facadeClient.getChangeSafetyDashboard().then((response) => {
      setChangeSafetyDashboard(response)
      const nextChangeId = response.plans.data?.[0]?.id ?? 'chg-100'
      setSelectedChangeId(nextChangeId)
    })
  }, [])

  useEffect(() => {
    facadeClient.getChangeSafetyCase(selectedChangeId).then((response) => {
      setChangeSafetyCase(response)
    })
  }, [selectedChangeId])

  useEffect(() => {
    facadeClient.getServiceAssuranceOverview().then((response) => {
      setServiceAssuranceData(response)
    })
  }, [])

  useEffect(() => {
    facadeClient.getTransportEngineeringOverview().then((response) => {
      setTransportEngineeringData(response)
    })
  }, [])

  useEffect(() => {
    facadeClient.getIntentComplianceOverview().then((response) => {
      setIntentComplianceData(response)
    })
  }, [])

  useEffect(() => {
    facadeClient.getAutomationStudioOverview().then((response) => {
      setAutomationStudioData(response)
    })
  }, [])

  useEffect(() => {
    facadeClient.getAdminPlatformOpsOverview().then((response) => {
      setAdminPlatformOpsData(response)
    })
  }, [])

  const futureAppCount = launchpadData.apps.filter((app) => app.maturity === 'future').length

  const defaultContextDrawer = (
    <>
      <ContextDrawer title="Object context placeholder" subtitle="Bounded read-only context">
        <NonClaimBanner copy="Object context is bounded by available evidence." />
        <NonClaimBanner copy="Read-only view. No device or controller changes are performed from this screen." />
      </ContextDrawer>
      <EvidenceDrawer
        title="Evidence sections"
        sections={[
          { id: 'topology', label: 'Topology truth', status: 'partial' },
          { id: 'validation', label: 'Validation', status: 'future' },
        ]}
      />
      <ContextDrawer title="Task and approval drawer" subtitle="Placeholder behavior">
        <NonClaimBanner copy="Approval state reflects platform workflow records only." />
      </ContextDrawer>
    </>
  )

  const commandCenterContextDrawer = (
    <ContextDrawer
      title="Selected incident context"
      subtitle="Core-RTR-1 — Cisco ASR 9001"
      headerAction={
        <button type="button" className="cc-drawer-close" aria-label="Close drawer" disabled>
          ✕
        </button>
      }
    >
      <div className="cc-drawer-object-header">
        <div className="cc-drawer-object-icon" aria-hidden="true">⬡</div>
        <div>
          <p className="cc-drawer-object-name">Core-RTR-1</p>
          <div className="cc-drawer-object-meta">
            <span className="cc-drawer-meta-item">Cisco ASR 9001</span>
            <span className="cc-drawer-meta-item">·</span>
            <span className="cc-drawer-meta-item">10.1.1.1</span>
            <span className="cc-drawer-meta-item">·</span>
            <span className="cc-drawer-meta-item">Core Site A</span>
          </div>
        </div>
      </div>
      <div className="cc-drawer-risk-row">
        <span className="cc-critical-badge"><span aria-hidden="true">△</span> Critical Risk</span>
        <div className="cc-drawer-risk-right">
          <div>
            <p className="cc-risk-score">95</p>
            <p className="cc-risk-label">Risk Score</p>
          </div>
          <svg
            className="cc-drawer-sparkline"
            aria-hidden="true"
            viewBox="0 0 88 24"
            width="88"
            height="24"
            fill="none"
          >
            <polyline
              points="0,18 11,14 22,16 33,8 44,12 55,6 66,10 77,4 88,7"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
      <div className="cc-drawer-tabs">
        <button type="button" className="cc-drawer-tab" aria-current="page">Overview</button>
        <button type="button" className="cc-drawer-tab">Topology</button>
        <button type="button" className="cc-drawer-tab">Performance</button>
        <button type="button" className="cc-drawer-tab">More</button>
      </div>
      <div className="cc-drawer-section-row">
        <p className="cc-drawer-section-title">Recent Changes</p>
        <button type="button" className="cc-link cc-drawer-view-all">View all</button>
      </div>
      <div className="cc-drawer-change-row">
        <div>
          <p className="cc-drawer-change-title">CHG-78231 — Update BGP Policy</p>
          <p className="cc-drawer-change-meta">Today, 08:12</p>
        </div>
        <span className="cc-drawer-change-owner">Sam Lee</span>
      </div>
      <div className="cc-drawer-change-row">
        <div>
          <p className="cc-drawer-change-title">CHG-78102 — Firmware Upgrade</p>
          <p className="cc-drawer-change-meta">Yesterday, 22:41</p>
        </div>
        <span className="cc-drawer-change-owner">Priya Nair</span>
      </div>
      <div className="cc-drawer-change-row">
        <div>
          <p className="cc-drawer-change-title">CHG-77911 — ACL Update</p>
          <p className="cc-drawer-change-meta">May 9, 14:33</p>
        </div>
        <span className="cc-drawer-change-owner">Daniel Kim</span>
      </div>
      <p className="cc-drawer-section-title">Related Services</p>
      <div className="cc-drawer-services">
        <span className="cc-drawer-service-badge cc-sev-critical">
          <span className="cc-sev-dot" aria-hidden="true">●</span> Internet Access
        </span>
        <span className="cc-drawer-service-badge cc-sev-critical">
          <span className="cc-sev-dot" aria-hidden="true">●</span> MPLS Core
        </span>
        <span className="cc-drawer-service-badge cc-sev-high">
          <span className="cc-sev-dot" aria-hidden="true">●</span> Corporate WAN
        </span>
      </div>
      <p className="cc-drawer-section-title">Evidence Confidence</p>
      <p style={{ fontSize: '12px', fontWeight: '700', color: '#15803d' }}>92% <span style={{ fontWeight: '600', color: '#64748b' }}>High</span></p>
      <div className="cc-drawer-evidence-bar">
        <div className="cc-drawer-evidence-fill" style={{ width: '92%' }} />
      </div>
      <p className="cc-drawer-section-title">Suggested Next Actions</p>
      <div className="cc-drawer-action-row">
        <div className="cc-drawer-action-icon" aria-hidden="true">◉</div>
        <div className="cc-drawer-action-label">
          <p className="cc-drawer-action-name">Collect device diagnostics bundle</p>
          <p className="cc-drawer-action-desc">Run pre-built investigation</p>
        </div>
        <button type="button" className="cc-drawer-action-btn">Run</button>
      </div>
      <div className="cc-drawer-action-row">
        <div className="cc-drawer-action-icon" aria-hidden="true">⚖</div>
        <div className="cc-drawer-action-label">
          <p className="cc-drawer-action-name">Check recent changes impact</p>
          <p className="cc-drawer-action-desc">Compare before/after states</p>
        </div>
        <button type="button" className="cc-drawer-action-btn">Compare</button>
      </div>
      <div className="cc-drawer-action-row">
        <div className="cc-drawer-action-icon" aria-hidden="true">⬡</div>
        <div className="cc-drawer-action-label">
          <p className="cc-drawer-action-name">Open in Digital Twin</p>
          <p className="cc-drawer-action-desc">Visualize topology &amp; paths</p>
        </div>
        <button type="button" className="cc-drawer-action-btn">Open</button>
      </div>
      <NonClaimBanner copy="Triage view only. This screen does not determine root cause or authorize remediation." />
    </ContextDrawer>
  )

  const digitalTwinContextDrawer = (
    <>
      <ContextDrawer
        title="Selected object context"
        subtitle="NYC1 · Router"
        headerAction={
          <button type="button" className="cc-drawer-close" aria-label="Close drawer">✕</button>
        }
      >
        {/* Object identity metadata — kept for test compatibility */}
        <p className="sr-only">Object id: {digitalTwinObjectContext.object.object_id}</p>

        <div className="dt-drawer-identity">
          <div className="dt-drawer-obj-name">NYC1</div>
          <div className="dt-drawer-obj-meta">
            <span className="dt-badge dt-badge--gray">Router</span>
            <span className="dt-badge dt-badge--red">Critical</span>
            <span className="dt-badge dt-badge--blue">Core</span>
          </div>
        </div>

        {/* Drawer tabs */}
        <div className="dt-drawer-tab-bar" role="tablist">
          <button role="tab" className="dt-drawer-tab" aria-selected="true" aria-current="page">Overview</button>
          <button role="tab" className="dt-drawer-tab" aria-selected="false">Evidence</button>
          <button role="tab" className="dt-drawer-tab" aria-selected="false">
            Alerts <span className="dt-drawer-tab-badge">2</span>
          </button>
        </div>

        {/* Confidence row */}
        <div className="dt-drawer-section">
          <div className="dt-drawer-row">
            <span className="dt-drawer-row-label">Confidence Score</span>
            <span className="dt-drawer-row-value">
              <span className="dt-conf-bar"><span className="dt-conf-fill" style={{ width: '95%' }} /></span>
              95% <span className="dt-badge dt-badge--green">High</span>
            </span>
          </div>
          <div className="dt-drawer-row">
            <span className="dt-drawer-row-label">Snapshot</span>
            <span className="dt-drawer-row-value">May 13 10:00 · 7m ago</span>
          </div>
        </div>

        {/* Description */}
        <div className="dt-drawer-section">
          <h4 className="dt-drawer-section-title">Description</h4>
          <dl className="dt-drawer-desc-grid">
            <dt>Model</dt><dd>Cisco NCS 5501</dd>
            <dt>Mgmt IP</dt><dd>10.10.20.1</dd>
            <dt>ASN</dt><dd>AS65002</dd>
            <dt>Location</dt><dd>New York, NY, US</dd>
          </dl>
        </div>

        {/* Dependencies */}
        <div className="dt-drawer-section">
          <h4 className="dt-drawer-section-title">Dependencies</h4>
          <ul className="dt-drawer-dep-list">
            <li>SEA1 — primary peer</li>
            <li>FRA1 — egress path</li>
            <li>CHI1 — backup path</li>
          </ul>
        </div>

        {/* Paths through this node */}
        <div className="dt-drawer-section">
          <h4 className="dt-drawer-section-title">Paths through this node</h4>
          <p className="dt-drawer-body-text">SEA1 → NYC1 → FRA1 (primary)</p>
          <button type="button" className="dt-link-btn">Show Paths (3)</button>
        </div>

        {/* Recent Changes */}
        <div className="dt-drawer-section">
          <h4 className="dt-drawer-section-title">Recent Changes</h4>
          <p className="dt-drawer-body-text dt-drawer-body-text--muted">BGP table update — 2m ago</p>
        </div>

        {/* Blast Radius */}
        <div className="dt-drawer-section">
          <h4 className="dt-drawer-section-title">Blast Radius</h4>
          <p className="dt-drawer-body-text">12 services · 8 paths affected if removed</p>
        </div>

        {/* Non-claim */}
        <NonClaimBanner copy="Evidence-backed topology view, not a forwarding guarantee." />

        {/* Actions */}
        <div className="dt-drawer-actions">
          <button type="button" className="dt-btn-primary dt-drawer-action-btn">Open Dossier</button>
          <button type="button" className="dt-btn-secondary dt-drawer-action-btn">Show Paths</button>
          <button type="button" className="dt-btn-ghost dt-drawer-action-btn">Compare Snapshot</button>
          <button type="button" className="dt-btn-ghost dt-drawer-action-btn" disabled title="Future capability: backend support is not implemented yet.">Run What-If</button>
        </div>
      </ContextDrawer>
    </>
  )

  const selectedChangePlan = changeSafetyDashboard.plans.data?.find((plan) => plan.id === selectedChangeId)
    ?? changeSafetyDashboard.plans.data?.[0]
    ?? null
  const changeSafetyContextDrawer = (
    <>
      <ContextDrawer title="Selected change context" subtitle="Bounded change safety context">
        <p className="ds-muted">
          <strong>{selectedChangePlan?.title ?? 'No change selected'}</strong>
        </p>
        <p className="ds-muted">Risk: {selectedChangePlan?.risk ?? 'unknown'}</p>
        <p className="ds-muted">Stage: {selectedChangePlan?.stage ?? 'unknown'}</p>
        <NonClaimBanner copy="Validation is gate input, not network proof." />
      </ContextDrawer>
      <EvidenceDrawer
        title="Evidence sections"
        sections={[
          { id: 'plans', label: changeSafetyDashboard.plans.label, status: changeSafetyDashboard.plans.status },
          { id: 'workflow', label: changeSafetyDashboard.workflow_steps.label, status: changeSafetyDashboard.workflow_steps.status },
          { id: 'safety_case', label: changeSafetyCase.verdict.label, status: changeSafetyCase.verdict.status },
        ]}
      />
      <ContextDrawer title="Task and approval drawer" subtitle="Placeholder behavior">
        <NonClaimBanner copy="Approval state reflects platform workflow records only." />
      </ContextDrawer>
    </>
  )

  const selectedService = serviceAssuranceData.top_impacted_services.data?.[0] ?? null
  const serviceAssuranceContextDrawer = (
    <>
      <ContextDrawer title="Selected service context" subtitle="Bounded service assurance context">
        <p className="ds-muted">
          <strong>{selectedService?.name ?? 'No service selected'}</strong>
        </p>
        <p className="ds-muted">Health: {selectedService?.health ?? 'unknown'}</p>
        <p className="ds-muted">Impacted customers: {String(selectedService?.impacted_customers ?? 'n/a')}</p>
        <NonClaimBanner copy="Service assurance reflects available platform evidence, not full SLA certification." />
      </ContextDrawer>
      <EvidenceDrawer
        title="Evidence sections"
        sections={[
          { id: 'kpis', label: serviceAssuranceData.kpis.label, status: serviceAssuranceData.kpis.status },
          { id: 'map', label: serviceAssuranceData.service_health_map.label, status: serviceAssuranceData.service_health_map.status },
          { id: 'incidents', label: serviceAssuranceData.active_incidents.label, status: serviceAssuranceData.active_incidents.status },
        ]}
      />
      <ContextDrawer title="Task and approval drawer" subtitle="Placeholder behavior">
        <NonClaimBanner copy="Read-only view. No device or controller changes are performed from this screen." />
      </ContextDrawer>
    </>
  )

  const transportOpportunity = transportEngineeringData.optimization_opportunities.data?.[0] ?? null
  const transportEngineeringContextDrawer = (
    <>
      <ContextDrawer title="Selected transport context" subtitle="Bounded transport engineering context">
        <p className="ds-muted">
          <strong>{transportOpportunity?.title ?? 'No opportunity selected'}</strong>
        </p>
        <p className="ds-muted">Blocked: {transportOpportunity?.blocked ? 'yes' : 'no'}</p>
        <p className="ds-muted">Reason: {transportOpportunity?.reason ?? 'unknown'}</p>
        <NonClaimBanner copy="Transport engineering views are evidence-backed planning aids, not controller programming." />
      </ContextDrawer>
      <EvidenceDrawer
        title="Evidence sections"
        sections={[
          { id: 'kpis', label: transportEngineeringData.kpis.label, status: transportEngineeringData.kpis.status },
          { id: 'topology', label: transportEngineeringData.topology_map.label, status: transportEngineeringData.topology_map.status },
          {
            id: 'optimization',
            label: transportEngineeringData.optimization_opportunities.label,
            status: transportEngineeringData.optimization_opportunities.status,
          },
        ]}
      />
      <ContextDrawer title="Task and approval drawer" subtitle="Placeholder behavior">
        <NonClaimBanner copy="Optimization actions are disabled until backend support exists." />
      </ContextDrawer>
    </>
  )

  const trafficIntelligenceContextDrawer = (
    <>
      <ContextDrawer title="Traffic context unavailable" subtitle="Future capability placeholder">
        <NonClaimBanner copy="Future capability: traffic intelligence backend support is not implemented. No flow telemetry or anomaly detection is available in this product yet." />
        <p className="ds-muted">No traffic context can be inspected because backend support is not implemented.</p>
      </ContextDrawer>
      <EvidenceDrawer
        title="Evidence sections"
        sections={[
          { id: 'maturity', label: 'Capability maturity', status: 'future' },
          { id: 'backend', label: 'Backend readiness', status: 'not_implemented' },
        ]}
      />
      <ContextDrawer title="Task and approval drawer" subtitle="Placeholder behavior">
        <NonClaimBanner copy="Future capability: backend support is not implemented yet." />
      </ContextDrawer>
    </>
  )

  const selectedDriftedIntent = intentComplianceData.top_drifted_intents.data?.[0] ?? null
  const intentComplianceContextDrawer = (
    <>
      <ContextDrawer title="Selected intent context" subtitle="Bounded intent and compliance context">
        <p className="ds-muted">
          <strong>{selectedDriftedIntent?.intent ?? 'No intent selected'}</strong>
        </p>
        <p className="ds-muted">Drift level: {selectedDriftedIntent?.drift_level ?? 'unknown'}</p>
        <p className="ds-muted">Evidence: {selectedDriftedIntent?.evidence ?? 'unknown'}</p>
        <NonClaimBanner copy="Compliance reflects available platform evidence, not certification or multi-vendor parity." />
      </ContextDrawer>
      <EvidenceDrawer
        title="Evidence sections"
        sections={[
          { id: 'kpis', label: intentComplianceData.kpis.label, status: intentComplianceData.kpis.status },
          { id: 'intent_observed', label: intentComplianceData.intent_vs_observed.label, status: intentComplianceData.intent_vs_observed.status },
          { id: 'validations', label: intentComplianceData.policy_validations.label, status: intentComplianceData.policy_validations.status },
        ]}
      />
      <ContextDrawer title="Task and approval drawer" subtitle="Placeholder behavior">
        <NonClaimBanner copy="Remediation is disabled unless a bounded backend workflow explicitly supports it." />
      </ContextDrawer>
    </>
  )

  const selectedWorkflow = automationStudioData.workflow_canvas.data?.[0] ?? null
  const automationStudioContextDrawer = (
    <>
      <ContextDrawer title="Selected workflow context" subtitle="Bounded workflow and approval context">
        <p className="ds-muted">
          <strong>{selectedWorkflow?.name ?? 'No workflow selected'}</strong>
        </p>
        <p className="ds-muted">Status: {selectedWorkflow?.status ?? 'unknown'}</p>
        <p className="ds-muted">Owner: {selectedWorkflow?.owner ?? 'unknown'}</p>
        <NonClaimBanner copy="Automation is bounded to backend-supported workflow records. It is not autonomous remediation or general device actuation." />
      </ContextDrawer>
      <EvidenceDrawer
        title="Evidence sections"
        sections={[
          { id: 'kpis', label: automationStudioData.kpis.label, status: automationStudioData.kpis.status },
          { id: 'workflow_canvas', label: automationStudioData.workflow_canvas.label, status: automationStudioData.workflow_canvas.status },
          { id: 'approvals', label: automationStudioData.approval_queue.label, status: automationStudioData.approval_queue.status },
        ]}
      />
      <ContextDrawer title="Task and approval drawer" subtitle="Placeholder behavior">
        <NonClaimBanner copy="Execution controls are disabled until prerequisite workflow, preview, validation, and approval gates are satisfied by backend records." />
      </ContextDrawer>
    </>
  )

  const aiAssistantContextDrawer = (
    <>
      <ContextDrawer title="AI context unavailable" subtitle="Future capability placeholder">
        <NonClaimBanner copy="Future capability: AI Assistant backend support is not implemented. AI recommendations must not be shown or acted on." />
        <p className="ds-muted">No AI context is available because AI/chat backend support is not implemented.</p>
      </ContextDrawer>
      <EvidenceDrawer
        title="Evidence sections"
        sections={[
          { id: 'maturity', label: 'Capability maturity', status: 'future' },
          { id: 'backend', label: 'Backend readiness', status: 'not_implemented' },
        ]}
      />
      <ContextDrawer title="Task and approval drawer" subtitle="Placeholder behavior">
        <NonClaimBanner copy="Future capability: backend support is not implemented yet." />
      </ContextDrawer>
    </>
  )

  const selectedAdminService = adminPlatformOpsData.service_health.data?.[0] ?? null
  const adminPlatformOpsContextDrawer = (
    <>
      <ContextDrawer title="Selected platform context" subtitle="Bounded admin and runtime context">
        <p className="ds-muted">
          <strong>{selectedAdminService?.component ?? 'No service selected'}</strong>
        </p>
        <p className="ds-muted">Status: {selectedAdminService?.status ?? 'unknown'}</p>
        <p className="ds-muted">Detail: {selectedAdminService?.detail ?? 'unknown'}</p>
        <NonClaimBanner copy="Admin controls are read-only placeholders unless backend auth/RBAC and configuration APIs exist." />
      </ContextDrawer>
      <EvidenceDrawer
        title="Evidence sections"
        sections={[
          { id: 'kpis', label: adminPlatformOpsData.kpis.label, status: adminPlatformOpsData.kpis.status },
          { id: 'service_health', label: adminPlatformOpsData.service_health.label, status: adminPlatformOpsData.service_health.status },
          { id: 'runtime_status', label: adminPlatformOpsData.runtime_status.label, status: adminPlatformOpsData.runtime_status.status },
        ]}
      />
      <ContextDrawer title="Task and approval drawer" subtitle="Placeholder behavior">
        <NonClaimBanner copy="Read-only view. No device or controller changes are performed from this screen." />
      </ContextDrawer>
    </>
  )

  const handleSidebarNavigate = useCallback(
    (appId: string) => navigate(getDefaultPathForApp(appId)),
    [navigate],
  )

  const handleTabNavigate = useCallback(
    (tabId: string) => {
      const path = tabPathMap[tabId]
      if (path) navigate(path)
    },
    [navigate, tabPathMap],
  )

  const handleMenuNavigate = useCallback(
    (menuId: string) => {
      const path = menuPathMap[menuId]
      if (path) navigate(path)
    },
    [navigate, menuPathMap],
  )

  return (
    <div data-testid="v2-scaffold-root">
      <AppShell
        apps={appItems}
        activeAppId={activeAppId}
        topBar={
          <TopBar
            environment="Production"
            fabric="NA-East / IP Fabric"
            commandSlot={
              <>
                <input
                  ref={searchInputRef}
                  className="ds-control ds-global-search"
                  aria-label="Global search"
                  placeholder="Search or type a command..."
                  readOnly
                />
                <button type="button" className="ds-control ds-icon-control ds-kbd-hint" aria-label="Command bar trigger">
                  <span aria-hidden="true">⌘</span>
                  <span>K</span>
                </button>
              </>
            }
          />
        }
        sidebar={
          <AppSidebar
            items={appItems}
            activeId={activeAppId}
            onNavigate={handleSidebarNavigate}
          />
        }
        tabs={
          activeAppId === 'launchpad'
            ? undefined
            : (
              <AppTabs
                items={tabItems}
                activeId={activeRoute ? activeRoute.tabId : tabItems[0].id}
                onNavigate={handleTabNavigate}
              />
            )
        }
        verticalMenu={
          activeAppId === 'launchpad'
            ? undefined
            : (
              <VerticalMenu
                items={menuItems}
                activeId={activeRoute ? activeRoute.verticalMenuId : menuItems[0].id}
                onNavigate={handleMenuNavigate}
                header={
                  activeAppId === 'command-center' ? (
                    <span className="cc-menu-section-label">View</span>
                  ) : null
                }
                footer={
                  activeAppId === 'command-center' ? (
                    <div className="cc-menu-filters">
                      <div className="cc-menu-filter-header">
                        <span className="cc-menu-filter-title">Filters</span>
                        <button type="button" className="cc-menu-filter-add" aria-label="Add filter">+</button>
                      </div>
                      <div className="cc-menu-filter-group">
                        <label className="cc-menu-filter-label">Severity</label>
                        <div className="cc-menu-filter-select">
                          <span className="cc-menu-filter-value">All</span>
                          <span className="cc-menu-filter-caret" aria-hidden="true">▾</span>
                        </div>
                      </div>
                      <div className="cc-menu-filter-group">
                        <label className="cc-menu-filter-label">Status</label>
                        <div className="cc-menu-filter-select">
                          <span className="cc-menu-filter-value">Open, Acknowledged</span>
                          <span className="cc-menu-filter-caret" aria-hidden="true">▾</span>
                        </div>
                      </div>
                      <div className="cc-menu-filter-group">
                        <label className="cc-menu-filter-label">Domain</label>
                        <div className="cc-menu-filter-select">
                          <span className="cc-menu-filter-value">All</span>
                          <span className="cc-menu-filter-caret" aria-hidden="true">▾</span>
                        </div>
                      </div>
                      <div className="cc-menu-filter-group">
                        <label className="cc-menu-filter-label">Owner</label>
                        <div className="cc-menu-filter-select">
                          <span className="cc-menu-filter-value">All</span>
                          <span className="cc-menu-filter-caret" aria-hidden="true">▾</span>
                        </div>
                      </div>
                      <button type="button" className="cc-menu-clear-all">Clear all</button>
                    </div>
                  ) : null
                }
              />
            )
        }
        contextDrawer={
          activeAppId === 'launchpad'
            ? undefined
            : activeAppId === 'command-center'
              ? commandCenterContextDrawer
              : activeAppId === 'digital-twin'
                ? digitalTwinContextDrawer
                : activeAppId === 'change-safety'
                  ? changeSafetyContextDrawer
                  : activeAppId === 'service-assurance'
                    ? serviceAssuranceContextDrawer
                    : activeAppId === 'transport-engineering'
                      ? transportEngineeringContextDrawer
                      : activeAppId === 'traffic-intelligence'
                        ? trafficIntelligenceContextDrawer
                        : activeAppId === 'intent-compliance'
                          ? intentComplianceContextDrawer
                          : activeAppId === 'automation-studio'
                            ? automationStudioContextDrawer
                            : activeAppId === 'ai-assistant'
                              ? aiAssistantContextDrawer
                              : activeAppId === 'admin-platform-ops'
                                ? adminPlatformOpsContextDrawer
                                : defaultContextDrawer
        }
      >
        {fallback ? <DegradedStateBanner message={fallback.notice} /> : null}
        {activeAppId === 'launchpad' ? (
          <LaunchpadPage
            data={launchpadData}
            state={launchpadStateOverride}
            selectedAppId={selectedLaunchpadAppId}
            onSelectApp={(appId) => {
              setSelectedLaunchpadAppId(appId)
              navigate(getDefaultPathForApp(appId))
            }}
          />
        ) : activeAppId === 'command-center' ? (
          <CommandCenterPage
            data={commandCenterData}
            state={commandCenterStateOverride}
            path={activeRoute?.path ?? '/app/command-center'}
          />
        ) : activeAppId === 'digital-twin' ? (
          <DigitalTwinPage
            overview={digitalTwinData}
            objectContext={digitalTwinObjectContext}
            state={digitalTwinStateOverride}
            path={activeRoute?.path ?? '/app/digital-twin'}
          />
        ) : activeAppId === 'change-safety' ? (
          <ChangeSafetyPage
            dashboard={changeSafetyDashboard}
            safetyCase={changeSafetyCase}
            state={changeSafetyStateOverride}
            path={activeRoute?.path ?? '/app/change-safety'}
          />
        ) : activeAppId === 'service-assurance' ? (
          <ServiceAssurancePage
            data={serviceAssuranceData}
            state={serviceAssuranceStateOverride}
          />
        ) : activeAppId === 'transport-engineering' ? (
          <TransportEngineeringPage
            data={transportEngineeringData}
            state={transportEngineeringStateOverride}
          />
        ) : activeAppId === 'traffic-intelligence' ? (
          <TrafficIntelligencePage />
        ) : activeAppId === 'intent-compliance' ? (
          <IntentCompliancePage
            data={intentComplianceData}
            state={intentComplianceStateOverride}
          />
        ) : activeAppId === 'automation-studio' ? (
          <AutomationStudioPage
            data={automationStudioData}
            state={automationStudioStateOverride}
          />
        ) : activeAppId === 'ai-assistant' ? (
          <AIAssistantPage />
        ) : activeAppId === 'admin-platform-ops' ? (
          <AdminPlatformOpsPage
            data={adminPlatformOpsData}
            state={adminPlatformOpsStateOverride}
          />
        ) : (
          <>
            <MetricCard
              label="Platform posture"
              value={launchpadData.operational_snapshot.data?.network_health ?? 'bounded'}
              tone="readOnly"
              helperText={launchpadData.non_claims[0] ?? 'Shell controls are placeholders until backend dependencies exist.'}
            />
            <ConfidenceMeter label="Evidence confidence" score={68} />
            <DataTable
              caption="Foundation component states"
              columns={['Shell region', 'Status', 'Contract']}
              rows={[
                ['Top bar controls', 'placeholder', launchpadData.contract_id],
                ['Navigation', 'ready', launchpadData.contract_id],
                ['Right context drawer', 'ready', launchpadData.contract_id],
              ]}
            />
            <WorkflowStepper
              activeStepId="shell"
              blockedReason="State-changing commands are disabled until backend gates exist."
              steps={[
                { id: 'tokens', label: 'Tokens', status: 'complete' },
                { id: 'components', label: 'Components', status: 'complete' },
                { id: 'shell', label: 'Global Shell', status: 'active' },
              ]}
            />
            <ApprovalQueue
              items={[
                { id: 'q1', summary: 'Task 08 global shell', state: 'ready_for_review' },
                { id: 'q2', summary: 'Task 10 launchpad app', state: 'ready_for_review' },
              ]}
            />
            <LoadingSkeleton title="Loading state example" message="Shared component skeleton placeholder." />
            <EmptyState title="Empty state example" message="No app-specific data is rendered in foundation tasks." />
            <ErrorState title="Error state example" message="Backend facade is not connected in this task." />
            <DegradedStateBanner message="Partial evidence only. Some sources are missing, stale, or unavailable." />
            <FutureCapabilityCard
              title="Future capability card example"
              reason={`Future capability: backend support is not implemented yet. ${futureAppCount} app(s) currently marked future.`}
              requiredBackend="api-v2-facade"
            />
          </>
        )}

        {isCommandPaletteOpen ? (
          <section className="ds-drawer" role="dialog" aria-label="Command palette">
            <h3>Command palette</h3>
            <p className="ds-muted">Global search is limited to local app and route metadata.</p>
            <p className="ds-muted">State-changing commands are disabled until backend gates exist.</p>
          </section>
        ) : null}
      </AppShell>
    </div>
  )
}
