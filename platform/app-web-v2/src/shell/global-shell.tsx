import { useEffect, useMemo, useRef, useState } from 'react'

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
  const [currentPath] = useState<string>(readInitialPath)
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
      })),
    [],
  )

  const tabItems = APP_TABS_BY_APP[activeAppId]
  const menuItems = APP_VERTICAL_MENU_BY_APP[activeAppId]

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
  const selectedLaunchpadApp =
    launchpadData.apps.find((app) => app.id === selectedLaunchpadAppId) ?? launchpadData.apps[0] ?? null

  const launchpadContextDrawer = (
    <>
      <ContextDrawer title="Selected app context" subtitle="Launchpad app detail">
        <p className="ds-muted"><strong>{selectedLaunchpadApp?.label ?? 'No app selected'}</strong></p>
        <p className="ds-muted">Maturity: {selectedLaunchpadApp?.maturity ?? 'unknown'}</p>
        <p className="ds-muted">Route: {selectedLaunchpadApp?.route ?? '/app/launchpad'}</p>
        <NonClaimBanner copy="Platform posture is bounded by available backend evidence and does not indicate production readiness." />
      </ContextDrawer>
      <EvidenceDrawer
        title="Evidence sections"
        sections={[
          { id: 'snapshot', label: 'Operational snapshot', status: launchpadData.operational_snapshot.status },
          { id: 'capability', label: 'Capability source contracts', status: 'partial' },
        ]}
      />
      <ContextDrawer title="Task and approval drawer" subtitle="Placeholder behavior">
        <NonClaimBanner copy="Approval state reflects platform workflow records only." />
      </ContextDrawer>
    </>
  )

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

  const selectedIncident = commandCenterData.incident_queue.data?.[0] ?? null
  const commandCenterContextDrawer = (
    <>
      <ContextDrawer title="Selected incident context" subtitle="Bounded incident triage context">
        <p className="ds-muted">
          <strong>{selectedIncident?.subject ?? 'No incident selected'}</strong>
        </p>
        <p className="ds-muted">Severity: {selectedIncident?.severity ?? 'unknown'}</p>
        <p className="ds-muted">Evidence confidence: {selectedIncident?.evidence_confidence ?? 'unknown'}</p>
        <NonClaimBanner copy="Triage view only. This screen does not determine root cause or authorize remediation." />
      </ContextDrawer>
      <EvidenceDrawer
        title="Evidence sections"
        sections={[
          { id: 'kpis', label: commandCenterData.kpis.label, status: commandCenterData.kpis.status },
          { id: 'incident_queue', label: commandCenterData.incident_queue.label, status: commandCenterData.incident_queue.status },
          { id: 'timeline', label: commandCenterData.recent_timeline.label, status: commandCenterData.recent_timeline.status },
        ]}
      />
      <ContextDrawer title="Task and approval drawer" subtitle="Placeholder behavior">
        <NonClaimBanner copy="Approval state reflects platform workflow records only." />
      </ContextDrawer>
    </>
  )

  const digitalTwinContextDrawer = (
    <>
      <ContextDrawer title="Selected object context" subtitle="Bounded topology object detail">
        <p className="ds-muted">
          <strong>{digitalTwinObjectContext.object.label}</strong>
        </p>
        <p className="ds-muted">Object kind: {digitalTwinObjectContext.object.object_kind}</p>
        <p className="ds-muted">Object id: {digitalTwinObjectContext.object.object_id}</p>
        <NonClaimBanner copy="Evidence-backed topology view, not a forwarding guarantee." />
      </ContextDrawer>
      <EvidenceDrawer
        title="Evidence sections"
        sections={[
          { id: 'topology_graph', label: digitalTwinData.topology_graph.label, status: digitalTwinData.topology_graph.status },
          { id: 'controller_evidence', label: digitalTwinData.controller_evidence.label, status: digitalTwinData.controller_evidence.status },
          { id: 'object_identity', label: digitalTwinObjectContext.identity.label, status: digitalTwinObjectContext.identity.status },
        ]}
      />
      <ContextDrawer title="Task and approval drawer" subtitle="Placeholder behavior">
        <NonClaimBanner copy="Read-only view. No device or controller changes are performed from this screen." />
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

  return (
    <div data-testid="v2-scaffold-root">
      <AppShell
        apps={appItems}
        activeAppId={activeAppId}
        topBar={
          <TopBar
            environment="Lab"
            fabric="core-fabric-a"
            commandSlot={
              <>
                <input
                  ref={searchInputRef}
                  className="ds-control"
                  aria-label="Global search"
                  placeholder="Global search (route metadata only)"
                  readOnly
                />
                <button type="button" className="ds-control" aria-label="Command bar trigger">
                  Command Bar
                </button>
                <button type="button" className="ds-control" aria-label="Quick actions" disabled>
                  Quick Actions
                </button>
                <button type="button" className="ds-control" aria-label="Help menu">
                  Help
                </button>
                <button type="button" className="ds-control" aria-label="User menu" disabled>
                  User
                </button>
              </>
            }
          />
        }
        sidebar={<AppSidebar items={appItems} activeId={activeAppId} />}
        tabs={<AppTabs items={tabItems} activeId={activeRoute ? activeRoute.tabId : tabItems[0].id} />}
        verticalMenu={
          <VerticalMenu
            items={menuItems}
            activeId={activeRoute ? activeRoute.verticalMenuId : menuItems[0].id}
          />
        }
        contextDrawer={
          activeAppId === 'launchpad'
            ? launchpadContextDrawer
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
            onSelectApp={setSelectedLaunchpadAppId}
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
