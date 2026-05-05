import { facadeClient } from '../src/api/client'
import { describe, expect, it } from 'vitest'

describe('api facade mock contracts', () => {
  it('returns typed launchpad contract with maturity and non-claims', async () => {
    const response = await facadeClient.getLaunchpadApps()

    expect(response.contract_id).toBe('frontend_v2_launchpad_apps_v1')
    expect(response.maturity).toBe('preview')
    expect(response.non_claims.length).toBeGreaterThan(0)
    expect(response.operational_snapshot.status).toBe('partial')
  })

  it('returns command-center, digital-twin, change-safety, service-assurance, transport, intent, automation, and admin contracts', async () => {
    const [command, twin, dashboard, safetyCase, serviceAssurance, transportEngineering, intentCompliance, automationStudio, adminPlatformOps] = await Promise.all([
      facadeClient.getCommandCenterOverview(),
      facadeClient.getDigitalTwinOverview(),
      facadeClient.getChangeSafetyDashboard(),
      facadeClient.getChangeSafetyCase('chg-100'),
      facadeClient.getServiceAssuranceOverview(),
      facadeClient.getTransportEngineeringOverview(),
      facadeClient.getIntentComplianceOverview(),
      facadeClient.getAutomationStudioOverview(),
      facadeClient.getAdminPlatformOpsOverview(),
    ])

    expect(command.contract_id).toBe('frontend_v2_command_center_overview_v1')
    expect(twin.contract_id).toBe('frontend_v2_digital_twin_overview_v1')
    expect(dashboard.contract_id).toBe('frontend_v2_change_safety_dashboard_v1')
    expect(safetyCase.contract_id).toBe('frontend_v2_change_safety_case_v1')
    expect(serviceAssurance.contract_id).toBe('frontend_v2_service_assurance_overview_v1')
    expect(transportEngineering.contract_id).toBe('frontend_v2_transport_engineering_overview_v1')
    expect(intentCompliance.contract_id).toBe('frontend_v2_intent_compliance_overview_v1')
    expect(automationStudio.contract_id).toBe('frontend_v2_automation_studio_overview_v1')
    expect(adminPlatformOps.contract_id).toBe('frontend_v2_admin_platform_ops_overview_v1')
  })

  it('returns object context contract with preserved object id', async () => {
    const response = await facadeClient.getDigitalTwinObjectContext('node-01')

    expect(response.contract_id).toBe('frontend_v2_digital_twin_object_context_v1')
    expect(response.object.object_id).toBe('node-01')
    expect(response.actions.some((action) => action.enabled === false)).toBe(true)
  })
})
