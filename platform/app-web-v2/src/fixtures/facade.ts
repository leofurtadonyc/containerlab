import { APP_REGISTRY } from '../app-registry'
import type {
  AdminPlatformOpsOverviewResponse,
  AutomationStudioOverviewResponse,
  ChangeSafetyCaseResponse,
  ChangeSafetyDashboardResponse,
  CommandCenterOverviewResponse,
  DigitalTwinObjectContextResponse,
  DigitalTwinOverviewResponse,
  FacadeSection,
  FacadeSectionStatus,
  LaunchpadAppsResponse,
  IntentComplianceOverviewResponse,
  ServiceAssuranceOverviewResponse,
  TransportEngineeringOverviewResponse,
} from '../api/types'

function nowIso(): string {
  return new Date('2026-05-04T00:00:00.000Z').toISOString()
}

function section<T>(
  id: string,
  label: string,
  status: FacadeSectionStatus,
  data: T | null,
  options?: { warnings?: string[]; partiality?: string[]; nonClaims?: string[] },
): FacadeSection<T> {
  return {
    id,
    label,
    status,
    maturity: status === 'future' ? 'future' : 'bounded',
    freshness: { generated_at: nowIso(), stale: status === 'partial', reason: status === 'partial' ? 'fixture' : undefined },
    source_contract_ids: ['fixture_contract_v2'],
    evidence_strength: status === 'future' ? 'placeholder' : 'mixed',
    partiality: options?.partiality ?? (status === 'partial' ? ['fixture_partial_state'] : []),
    non_claims: options?.nonClaims ?? [],
    warnings: options?.warnings ?? [],
    blocked_actions: status === 'future' ? ['state_change_disabled'] : [],
    future_capabilities: status === 'future' ? ['backend_not_implemented'] : [],
    data,
  }
}

function appDescription(id: string): string {
  const descriptions: Record<string, string> = {
    'command-center': 'Real-time network visibility, control, and diagnostics.',
    'digital-twin': 'Live digital replica for analysis, simulation, and impact modeling.',
    'change-safety': 'Pre-change risk analysis and impact validation.',
    'service-assurance': 'End-to-end service health and experience assurance.',
    'transport-engineering': 'Design, plan and optimize transport networks.',
    'traffic-intelligence': 'Network traffic analytics and insights.',
    'intent-compliance': 'Intent validation and policy compliance.',
    'automation-studio': 'Automate workflows and operational tasks.',
    'ai-assistant': 'Natural language insights and automation.',
    'admin-platform-ops': 'Platform administration and operations.',
  }
  return descriptions[id] ?? `${id} app`
}

export function getLaunchpadAppsFixture(): LaunchpadAppsResponse {
  return {
    contract_id: 'frontend_v2_launchpad_apps_v1',
    generated_at: nowIso(),
    maturity: 'preview',
    source_contract_ids: ['platform_status_v1', 'capabilities_list_v1'],
    non_claims: ['This platform is not production-ready and remains conditionally ready with explicit limits.'],
    warnings: [],
    apps: APP_REGISTRY.map((app) => ({
      id: app.id,
      label: app.label,
      description: appDescription(app.id),
      route: app.defaultRoute,
      maturity: app.maturity,
      status: app.maturity === 'future' ? 'future' : 'ok',
      current_posture: app.maturity === 'future' ? 'backend_not_implemented' : 'bounded',
      unavailable_reason: app.maturity === 'future' ? 'Future capability: backend support is not implemented yet.' : undefined,
      source_contract_ids: ['app_registry_v2'],
      non_claims:
        app.maturity === 'future'
          ? ['Future capability: backend support is not implemented yet.']
          : ['Read-only view. No device or controller changes are performed from this screen.'],
    })),
    operational_snapshot: section(
      'operational_snapshot',
      'Operational Snapshot',
      'partial',
      {
        network_health: 'bounded',
        services_at_risk: 3,
        pending_approvals: 2,
        evidence_confidence: 'partial',
      },
      {
        warnings: ['Backend data is unavailable for some sections. Do not infer operational state from this placeholder.'],
        nonClaims: ['Not production readiness.'],
      },
    ),
  }
}

export function getCommandCenterOverviewFixture(): CommandCenterOverviewResponse {
  return {
    contract_id: 'frontend_v2_command_center_overview_v1',
    generated_at: nowIso(),
    maturity: 'bounded',
    source_contract_ids: ['delta_digest_v1', 'operator_briefing_v1'],
    non_claims: ['Triage view only. This screen does not determine root cause or authorize remediation.'],
    warnings: [],
    kpis: section('kpis', 'Operational KPIs', 'ok', [
      { id: 'active_incidents', label: 'Active incidents', value: '4', status: 'partial' },
      { id: 'evidence_confidence', label: 'Evidence confidence', value: '68%', status: 'partial' },
    ]),
    incident_queue: section('incident_queue', 'Incident Queue', 'partial', [
      {
        id: 'inc-001',
        severity: 'critical',
        subject: 'Core fabric link instability',
        symptom: 'Packet loss burst',
        evidence_confidence: 'partial',
      },
    ]),
    recent_timeline: section('recent_timeline', 'Recent timeline', 'ok', [
      { at: nowIso(), label: 'Investigation created', severity: 'warning' },
    ]),
    situation_room: section('situation_room', 'Situation room', 'ok', {
      active: true,
      summary: 'Cross-domain review active.',
      route: '/app/command-center/situation-room',
    }),
  }
}

export function getDigitalTwinOverviewFixture(): DigitalTwinOverviewResponse {
  return {
    contract_id: 'frontend_v2_digital_twin_overview_v1',
    generated_at: nowIso(),
    maturity: 'bounded',
    source_contract_ids: ['topology_truth_v1', 'controller_evidence_v1'],
    non_claims: ['Evidence-backed topology view, not a forwarding guarantee.'],
    warnings: [],
    kpis: section('kpis', 'Digital twin KPIs', 'ok', [
      { id: 'discovered_nodes', label: 'Discovered nodes', value: '124', status: 'ok' },
      { id: 'divergence', label: 'Divergence', value: '6', status: 'partial' },
    ]),
    topology_graph: section('topology_graph', 'Topology graph', 'partial', {
      nodes: [{ id: 'r1' }, { id: 'r2' }],
      links: [{ id: 'l1', from: 'r1', to: 'r2' }],
      selected_path: ['r1', 'r2'],
    }),
    controller_evidence: section('controller_evidence', 'Controller evidence', 'degraded', {
      lanes: [{ id: 'odl-primary', posture: 'degraded', evidence_strength: 'mixed' }],
    }),
  }
}

export function getDigitalTwinObjectContextFixture(objectId: string): DigitalTwinObjectContextResponse {
  return {
    contract_id: 'frontend_v2_digital_twin_object_context_v1',
    generated_at: nowIso(),
    maturity: 'bounded',
    source_contract_ids: ['topology_dossier_v1'],
    non_claims: ['Object context is bounded by available evidence.'],
    warnings: [],
    object: {
      object_id: objectId,
      object_kind: 'node',
      label: `Object ${objectId}`,
      maturity: 'bounded',
    },
    identity: section('identity', 'Identity', 'ok', {
      object_id: objectId,
      role: 'core-router',
      region: 'core-fabric-a',
    }),
    related_policies: section('related_policies', 'Related policies', 'partial', [{ id: 'policy-1', name: 'Transit policy' }]),
    failure_impact: section('failure_impact', 'Failure impact', 'ok', { impacted_services: 2, criticality: 'warning' }),
    evidence_timeline: section('evidence_timeline', 'Evidence timeline', 'ok', [
      { at: nowIso(), label: 'Telemetry refresh', posture: 'ok' },
    ]),
    actions: [
      { id: 'open_dossier', label: 'Open dossier', enabled: true },
      { id: 'run_simulation', label: 'Run simulation', enabled: false, reason: 'Future capability: backend support is not implemented yet.' },
    ],
  }
}

export function getChangeSafetyDashboardFixture(): ChangeSafetyDashboardResponse {
  return {
    contract_id: 'frontend_v2_change_safety_dashboard_v1',
    generated_at: nowIso(),
    maturity: 'bounded',
    source_contract_ids: ['workflow_lifecycle_v1', 'validation_workspace_v1'],
    non_claims: ['Validation is gate input, not network proof.'],
    warnings: [],
    kpis: section('kpis', 'Change safety KPIs', 'ok', [
      { id: 'active_changes', label: 'Active changes', value: '2', status: 'partial' },
      { id: 'rollback_readiness', label: 'Rollback readiness', value: 'partial', status: 'partial' },
    ]),
    plans: section('plans', 'Plans', 'ok', [
      { id: 'chg-100', title: 'Core upgrade window', risk: 'medium', stage: 'approval', approval_status: 'pending' },
    ]),
    selected_plan: section('selected_plan', 'Selected plan', 'ok', {
      id: 'chg-100',
      title: 'Core upgrade window',
      owner: 'netops',
    }),
    workflow_steps: section('workflow_steps', 'Workflow steps', 'ok', [
      { id: 'preview', label: 'Preview', status: 'complete' },
      { id: 'validation', label: 'Validation', status: 'active' },
      { id: 'approval', label: 'Approval', status: 'pending' },
    ]),
    evidence_pack: section('evidence_pack', 'Evidence pack', 'partial', [
      { id: 'ev-1', label: 'Validation timeline', source_contract_id: 'validation_timeline_v1' },
    ]),
    blocked_actions: ['execute_change_disabled', 'rollback_disabled'],
  }
}

export function getChangeSafetyCaseFixture(changeId: string): ChangeSafetyCaseResponse {
  return {
    contract_id: 'frontend_v2_change_safety_case_v1',
    generated_at: nowIso(),
    maturity: 'bounded',
    source_contract_ids: ['action_safety_case_v1', 'change_safety_report_v1'],
    non_claims: ['No guaranteed safe execution; no universal rollback.'],
    warnings: [],
    change_id: changeId,
    verdict: section('verdict', 'Safety verdict', 'blocked', {
      label: 'Requires review',
      posture: 'requires_review',
      reasons: ['Partial evidence only. Some sources are missing, stale, or unavailable.'],
    }),
    prerequisites: section('prerequisites', 'Prerequisites', 'partial', [
      { id: 'approval', label: 'Approval record', status: 'pending', required: true },
      { id: 'validation', label: 'Validation score', status: 'partial', required: true },
    ]),
    preview: section('preview', 'Preview', 'ok', { summary: 'Preview is pre-change reasoning only; it is not execution.' }),
    validation: section('validation', 'Validation', 'partial', { score: 72, confidence: 'partial' }),
    rollback_readiness: section('rollback_readiness', 'Rollback readiness', 'partial', {
      posture: 'compensation_only',
      note: 'Rollback readiness is compensation-only and is not guaranteed device restoration.',
    }),
    allowed_actions: [
      { id: 'request_approval', label: 'Request approval', enabled: true, reason: 'Workflow record available.' },
      {
        id: 'execute_change',
        label: 'Execute change',
        enabled: false,
        reason: 'Execution controls are disabled until prerequisite workflow, preview, validation, and approval gates are satisfied by backend records.',
      },
    ],
  }
}

export function getServiceAssuranceOverviewFixture(): ServiceAssuranceOverviewResponse {
  return {
    contract_id: 'frontend_v2_service_assurance_overview_v1',
    generated_at: nowIso(),
    maturity: 'bounded',
    source_contract_ids: ['service_explorer_v1', 'service_impact_workspace_v1'],
    non_claims: ['Service assurance reflects available platform evidence, not full SLA certification.'],
    warnings: [],
    kpis: section('kpis', 'Service assurance KPIs', 'ok', [
      { id: 'total_services', label: 'Total services', value: '42', status: 'ok' },
      { id: 'degraded_services', label: 'Degraded', value: '6', status: 'partial' },
      { id: 'critical_services', label: 'Critical', value: '2', status: 'partial' },
      { id: 'sla_compliance', label: 'SLA compliance', value: 'bounded', status: 'partial' },
    ]),
    service_health_map: section('service_health_map', 'Service health map', 'partial', {
      groups: [
        { id: 'metro-core', label: 'Metro Core', status: 'partial', impacted_services: 3 },
        { id: 'edge-access', label: 'Edge Access', status: 'ok', impacted_services: 1 },
      ],
    }),
    top_impacted_services: section('top_impacted_services', 'Top impacted services', 'partial', [
      { id: 'svc-001', name: 'L3VPN Gold North', health: 'degraded', impacted_customers: 18 },
      { id: 'svc-002', name: 'Wholesale Transit East', health: 'critical', impacted_customers: 7 },
    ]),
    active_incidents: section('active_incidents', 'Active incidents', 'partial', [
      { id: 'inc-310', title: 'Core PE packet loss', severity: 'partial', service: 'L3VPN Gold North' },
    ]),
  }
}

export function getTransportEngineeringOverviewFixture(): TransportEngineeringOverviewResponse {
  return {
    contract_id: 'frontend_v2_transport_engineering_overview_v1',
    generated_at: nowIso(),
    maturity: 'preview',
    source_contract_ids: ['path_explorer_v1', 'topology_truth_v1', 'controller_evidence_v1'],
    non_claims: ['Transport engineering views are evidence-backed planning aids, not controller programming.'],
    warnings: [],
    kpis: section('kpis', 'Transport engineering KPIs', 'ok', [
      { id: 'total_links', label: 'Total links', value: '188', status: 'ok' },
      { id: 'over_utilized_links', label: 'Over-utilized links', value: '9', status: 'partial' },
      { id: 'unprotected_paths', label: 'Unprotected paths', value: '5', status: 'partial' },
      { id: 'blocking_output', label: 'Blocking output', value: 'partial', status: 'partial' },
    ]),
    topology_map: section('topology_map', 'Topology map', 'partial', {
      nodes: 124,
      links: 188,
      selected_path: ['PE1', 'P3', 'PE4'],
    }),
    utilization_panels: section('utilization_panels', 'Utilization panels', 'partial', [
      { id: 'avg_utilization', label: 'Average utilization', value: '63%', status: 'partial' },
      { id: 'peak_link', label: 'Peak link', value: 'PE1-P3 87%', status: 'partial' },
    ]),
    optimization_opportunities: section('optimization_opportunities', 'Optimization opportunities', 'future', [
      {
        id: 'opt-001',
        title: 'Rebalance metro edge demand',
        reason: 'Optimization actions are disabled until backend support exists.',
        blocked: true,
      },
    ]),
  }
}

export function getIntentComplianceOverviewFixture(): IntentComplianceOverviewResponse {
  return {
    contract_id: 'frontend_v2_intent_compliance_overview_v1',
    generated_at: nowIso(),
    maturity: 'bounded',
    source_contract_ids: ['policies_v1', 'validation_workspace_v1', 'explainability_v1'],
    non_claims: ['Compliance reflects available platform evidence, not certification or multi-vendor parity.'],
    warnings: [],
    kpis: section('kpis', 'Intent compliance KPIs', 'ok', [
      { id: 'total_intents', label: 'Total intents', value: '67', status: 'ok' },
      { id: 'in_sync', label: 'In sync', value: '48', status: 'ok' },
      { id: 'drifted', label: 'Drifted', value: '11', status: 'partial' },
      { id: 'at_risk', label: 'At risk', value: '8', status: 'partial' },
    ]),
    intent_vs_observed: section('intent_vs_observed', 'Intent vs observed state', 'partial', {
      in_sync: 48,
      drifted: 11,
      unknown: 8,
    }),
    top_drifted_intents: section('top_drifted_intents', 'Top drifted intents', 'partial', [
      { id: 'intent-001', intent: 'Core traffic isolation', drift_level: 'high', evidence: 'partial' },
      { id: 'intent-004', intent: 'Edge route policy', drift_level: 'medium', evidence: 'mixed' },
    ]),
    policy_validations: section('policy_validations', 'Recent policy validations', 'partial', [
      { id: 'val-100', policy: 'Tenant isolation baseline', status: 'partial', last_checked: nowIso() },
      { id: 'val-101', policy: 'Route leak prevention', status: 'ok', last_checked: nowIso() },
    ]),
    remediation_recommendations: section('remediation_recommendations', 'Remediation recommendations', 'future', [
      {
        id: 'rem-001',
        label: 'Auto-remediate drifted intents',
        enabled: false,
        reason: 'Remediation is disabled unless a bounded backend workflow explicitly supports it.',
      },
    ]),
  }
}

export function getAutomationStudioOverviewFixture(): AutomationStudioOverviewResponse {
  return {
    contract_id: 'frontend_v2_automation_studio_overview_v1',
    generated_at: nowIso(),
    maturity: 'bounded',
    source_contract_ids: ['workflow_lifecycle_v1', 'preview_workspace_v1', 'validation_workspace_v1'],
    non_claims: ['Automation is bounded to backend-supported workflow records. It is not autonomous remediation or general device actuation.'],
    warnings: [],
    kpis: section('kpis', 'Automation studio KPIs', 'ok', [
      { id: 'total_workflows', label: 'Total workflows', value: '24', status: 'ok' },
      { id: 'active_workflows', label: 'Active', value: '8', status: 'ok' },
      { id: 'failed_runs', label: 'Failed runs', value: '3', status: 'partial' },
      { id: 'pending_approvals', label: 'Pending approvals', value: '5', status: 'partial' },
    ]),
    workflow_canvas: section('workflow_canvas', 'Workflow canvas', 'partial', [
      { id: 'wf-001', name: 'Core maintenance workflow', status: 'active', owner: 'netops' },
      { id: 'wf-007', name: 'Rollback readiness checker', status: 'partial', owner: 'sre' },
    ]),
    recent_executions: section('recent_executions', 'Recent executions', 'partial', [
      { id: 'run-410', workflow: 'Core maintenance workflow', status: 'partial', started_at: nowIso() },
      { id: 'run-411', workflow: 'Rollback readiness checker', status: 'ok', started_at: nowIso() },
    ]),
    integrations_health: section('integrations_health', 'Integrations health', 'partial', [
      { id: 'int-01', integration: 'Ticketing bridge', status: 'ok' },
      { id: 'int-02', integration: 'Validation feed', status: 'partial' },
    ]),
    approval_queue: section('approval_queue', 'Approval queue', 'ok', [
      { id: 'ap-100', summary: 'Core maintenance workflow', state: 'awaiting_approval' },
      { id: 'ap-101', summary: 'Policy validation rerun', state: 'awaiting_approval' },
    ]),
    blocked_actions: ['create_workflow_disabled', 'execute_workflow_disabled', 'run_dry_run_disabled'],
  }
}

export function getAdminPlatformOpsOverviewFixture(): AdminPlatformOpsOverviewResponse {
  return {
    contract_id: 'frontend_v2_admin_platform_ops_overview_v1',
    generated_at: nowIso(),
    maturity: 'bounded',
    source_contract_ids: ['platform_status_v1', 'auth_boundaries_v1', 'runtime_inventory_v1'],
    non_claims: ['Admin controls are read-only placeholders unless backend auth/RBAC and configuration APIs exist.'],
    warnings: [],
    kpis: section('kpis', 'Admin platform KPIs', 'ok', [
      { id: 'platform_services', label: 'Platform services', value: '12', status: 'ok' },
      { id: 'healthy_services', label: 'Healthy', value: '10', status: 'ok' },
      { id: 'degraded_services', label: 'Degraded', value: '2', status: 'partial' },
      { id: 'pending_admin_tasks', label: 'Pending admin tasks', value: '5', status: 'partial' },
    ]),
    service_health: section('service_health', 'Service health', 'partial', [
      { id: 'svc-api', component: 'app-api', status: 'ok', detail: 'Facade reachable' },
      { id: 'svc-web-v2', component: 'app-web-v2', status: 'ok', detail: 'Preview reachable' },
      { id: 'svc-odl', component: 'odl', status: 'partial', detail: 'Intermittent southbound evidence' },
    ]),
    runtime_status: section('runtime_status', 'Runtime status', 'partial', [
      { id: 'rt-clab', runtime: 'containerlab', status: 'ok', detail: 'Core lab topology deployed' },
      { id: 'rt-v1v2', runtime: 'web-ui coexistence', status: 'ok', detail: 'v1 and v2 preview both reachable' },
    ]),
    audit_summary: section('audit_summary', 'Audit summary', 'ok', [
      { id: 'audit-config', category: 'Config updates', count: '0', status: 'read_only' },
      { id: 'audit-access', category: 'Access policy updates', count: '0', status: 'read_only' },
    ]),
    blocked_actions: ['add_user_disabled', 'update_rbac_disabled', 'write_config_disabled'],
  }
}
