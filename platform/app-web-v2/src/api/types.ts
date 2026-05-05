export type FacadeMaturity = 'available' | 'bounded' | 'preview' | 'future' | 'backend_only' | 'not_implemented'
export type FacadeSectionStatus = 'ok' | 'empty' | 'partial' | 'degraded' | 'blocked' | 'future' | 'error'
export type FacadeEvidenceStrength = 'direct' | 'derived' | 'mixed' | 'placeholder' | 'unknown'

export interface FacadeFreshness {
  generated_at: string | null
  stale: boolean
  reason?: string
}

export interface FacadeSection<T> {
  id: string
  label: string
  status: FacadeSectionStatus
  maturity: FacadeMaturity
  freshness: FacadeFreshness
  source_contract_ids: string[]
  evidence_strength: FacadeEvidenceStrength
  partiality: string[]
  non_claims: string[]
  warnings: string[]
  blocked_actions: string[]
  future_capabilities: string[]
  data: T | null
}

export interface FacadeEnvelope {
  contract_id: string
  generated_at: string
  maturity: FacadeMaturity
  source_contract_ids: string[]
  non_claims: string[]
  warnings: string[]
}

export interface FacadeErrorResponse {
  code: string
  message: string
  request_id?: string
  section_status?: FacadeSectionStatus
  non_claims: string[]
}

export interface LaunchpadAppsResponse extends FacadeEnvelope {
  contract_id: 'frontend_v2_launchpad_apps_v1'
  apps: Array<{
    id: string
    label: string
    description: string
    route: string
    maturity: FacadeMaturity
    status: FacadeSectionStatus
    current_posture: string
    unavailable_reason?: string
    source_contract_ids: string[]
    non_claims: string[]
  }>
  operational_snapshot: FacadeSection<{
    network_health: string
    services_at_risk: number | null
    pending_approvals: number | null
    evidence_confidence: string
  }>
}

export interface CommandCenterOverviewResponse extends FacadeEnvelope {
  contract_id: 'frontend_v2_command_center_overview_v1'
  kpis: FacadeSection<Array<{ id: string; label: string; value: string; status: FacadeSectionStatus }>>
  incident_queue: FacadeSection<
    Array<{ id: string; severity: string; subject: string; symptom: string; evidence_confidence: string }>
  >
  recent_timeline: FacadeSection<Array<{ at: string; label: string; severity: string }>>
  situation_room: FacadeSection<{ active: boolean; summary: string; route: string }>
}

export interface DigitalTwinOverviewResponse extends FacadeEnvelope {
  contract_id: 'frontend_v2_digital_twin_overview_v1'
  kpis: FacadeSection<Array<{ id: string; label: string; value: string; status: FacadeSectionStatus }>>
  topology_graph: FacadeSection<{ nodes: unknown[]; links: unknown[]; selected_path?: string[] }>
  controller_evidence: FacadeSection<{ lanes: Array<{ id: string; posture: string; evidence_strength: string }> }>
}

export interface DigitalTwinObjectContextResponse extends FacadeEnvelope {
  contract_id: 'frontend_v2_digital_twin_object_context_v1'
  object: { object_id: string; object_kind: string; label: string; maturity: FacadeMaturity }
  identity: FacadeSection<Record<string, string>>
  related_policies: FacadeSection<unknown[]>
  failure_impact: FacadeSection<Record<string, unknown>>
  evidence_timeline: FacadeSection<unknown[]>
  actions: Array<{ id: string; label: string; enabled: boolean; reason?: string }>
}

export interface ChangeSafetyDashboardResponse extends FacadeEnvelope {
  contract_id: 'frontend_v2_change_safety_dashboard_v1'
  kpis: FacadeSection<Array<{ id: string; label: string; value: string; status: FacadeSectionStatus }>>
  plans: FacadeSection<Array<{ id: string; title: string; risk: string; stage: string; approval_status: string }>>
  selected_plan: FacadeSection<Record<string, unknown>>
  workflow_steps: FacadeSection<Array<{ id: string; label: string; status: string }>>
  evidence_pack: FacadeSection<Array<{ id: string; label: string; source_contract_id: string }>>
  blocked_actions: string[]
}

export interface ChangeSafetyCaseResponse extends FacadeEnvelope {
  contract_id: 'frontend_v2_change_safety_case_v1'
  change_id: string
  verdict: FacadeSection<{ label: string; posture: 'ready' | 'blocked' | 'requires_review' | 'unknown'; reasons: string[] }>
  prerequisites: FacadeSection<Array<{ id: string; label: string; status: string; required: boolean }>>
  preview: FacadeSection<Record<string, unknown>>
  validation: FacadeSection<Record<string, unknown>>
  rollback_readiness: FacadeSection<Record<string, unknown>>
  allowed_actions: Array<{ id: string; label: string; enabled: boolean; reason: string }>
}

export interface ServiceAssuranceOverviewResponse extends FacadeEnvelope {
  contract_id: 'frontend_v2_service_assurance_overview_v1'
  kpis: FacadeSection<Array<{ id: string; label: string; value: string; status: FacadeSectionStatus }>>
  service_health_map: FacadeSection<{ groups: Array<{ id: string; label: string; status: string; impacted_services: number }> }>
  top_impacted_services: FacadeSection<Array<{ id: string; name: string; health: string; impacted_customers: number }>>
  active_incidents: FacadeSection<Array<{ id: string; title: string; severity: string; service: string }>>
}

export interface TransportEngineeringOverviewResponse extends FacadeEnvelope {
  contract_id: 'frontend_v2_transport_engineering_overview_v1'
  kpis: FacadeSection<Array<{ id: string; label: string; value: string; status: FacadeSectionStatus }>>
  topology_map: FacadeSection<{ nodes: number; links: number; selected_path?: string[] }>
  utilization_panels: FacadeSection<Array<{ id: string; label: string; value: string; status: string }>>
  optimization_opportunities: FacadeSection<Array<{ id: string; title: string; reason: string; blocked: boolean }>>
}

export interface IntentComplianceOverviewResponse extends FacadeEnvelope {
  contract_id: 'frontend_v2_intent_compliance_overview_v1'
  kpis: FacadeSection<Array<{ id: string; label: string; value: string; status: FacadeSectionStatus }>>
  intent_vs_observed: FacadeSection<{ in_sync: number; drifted: number; unknown: number }>
  top_drifted_intents: FacadeSection<Array<{ id: string; intent: string; drift_level: string; evidence: string }>>
  policy_validations: FacadeSection<Array<{ id: string; policy: string; status: string; last_checked: string }>>
  remediation_recommendations: FacadeSection<Array<{ id: string; label: string; enabled: boolean; reason: string }>>
}

export interface AutomationStudioOverviewResponse extends FacadeEnvelope {
  contract_id: 'frontend_v2_automation_studio_overview_v1'
  kpis: FacadeSection<Array<{ id: string; label: string; value: string; status: FacadeSectionStatus }>>
  workflow_canvas: FacadeSection<Array<{ id: string; name: string; status: string; owner: string }>>
  recent_executions: FacadeSection<Array<{ id: string; workflow: string; status: string; started_at: string }>>
  integrations_health: FacadeSection<Array<{ id: string; integration: string; status: string }>>
  approval_queue: FacadeSection<Array<{ id: string; summary: string; state: string }>>
  blocked_actions: string[]
}

export interface AdminPlatformOpsOverviewResponse extends FacadeEnvelope {
  contract_id: 'frontend_v2_admin_platform_ops_overview_v1'
  kpis: FacadeSection<Array<{ id: string; label: string; value: string; status: FacadeSectionStatus }>>
  service_health: FacadeSection<Array<{ id: string; component: string; status: string; detail: string }>>
  runtime_status: FacadeSection<Array<{ id: string; runtime: string; status: string; detail: string }>>
  audit_summary: FacadeSection<Array<{ id: string; category: string; count: string; status: string }>>
  blocked_actions: string[]
}
