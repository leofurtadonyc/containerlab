import {
  getAdminPlatformOpsOverviewFixture,
  getAutomationStudioOverviewFixture,
  getChangeSafetyCaseFixture,
  getChangeSafetyDashboardFixture,
  getCommandCenterOverviewFixture,
  getDigitalTwinObjectContextFixture,
  getDigitalTwinOverviewFixture,
  getLaunchpadAppsFixture,
  getIntentComplianceOverviewFixture,
  getServiceAssuranceOverviewFixture,
  getTransportEngineeringOverviewFixture,
} from '../fixtures'
import type {
  AdminPlatformOpsOverviewResponse,
  AutomationStudioOverviewResponse,
  ChangeSafetyCaseResponse,
  ChangeSafetyDashboardResponse,
  CommandCenterOverviewResponse,
  DigitalTwinObjectContextResponse,
  DigitalTwinOverviewResponse,
  IntentComplianceOverviewResponse,
  LaunchpadAppsResponse,
  ServiceAssuranceOverviewResponse,
  TransportEngineeringOverviewResponse,
} from './types'

type EndpointPath =
  | '/api/v2/launchpad/apps'
  | '/api/v2/command-center/overview'
  | '/api/v2/digital-twin/overview'
  | '/api/v2/digital-twin/objects/{object_id}/context'
  | '/api/v2/change-safety/dashboard'
  | '/api/v2/change-safety/{change_id}/safety-case'
  | '/api/v2/service-assurance/overview'
  | '/api/v2/transport-engineering/overview'
  | '/api/v2/intent-compliance/overview'
  | '/api/v2/automation-studio/overview'
  | '/api/v2/admin-platform-ops/overview'

export interface MockRequest<TResponse> {
  endpoint: EndpointPath
  response: TResponse
}

function resolveMockRequest(endpoint: EndpointPath, id?: string): MockRequest<unknown> {
  switch (endpoint) {
    case '/api/v2/launchpad/apps':
      return { endpoint, response: getLaunchpadAppsFixture() }
    case '/api/v2/command-center/overview':
      return { endpoint, response: getCommandCenterOverviewFixture() }
    case '/api/v2/digital-twin/overview':
      return { endpoint, response: getDigitalTwinOverviewFixture() }
    case '/api/v2/digital-twin/objects/{object_id}/context':
      return { endpoint, response: getDigitalTwinObjectContextFixture(id ?? 'object-unknown') }
    case '/api/v2/change-safety/dashboard':
      return { endpoint, response: getChangeSafetyDashboardFixture() }
    case '/api/v2/change-safety/{change_id}/safety-case':
      return { endpoint, response: getChangeSafetyCaseFixture(id ?? 'change-unknown') }
    case '/api/v2/service-assurance/overview':
      return { endpoint, response: getServiceAssuranceOverviewFixture() }
    case '/api/v2/transport-engineering/overview':
      return { endpoint, response: getTransportEngineeringOverviewFixture() }
    case '/api/v2/intent-compliance/overview':
      return { endpoint, response: getIntentComplianceOverviewFixture() }
    case '/api/v2/automation-studio/overview':
      return { endpoint, response: getAutomationStudioOverviewFixture() }
    case '/api/v2/admin-platform-ops/overview':
      return { endpoint, response: getAdminPlatformOpsOverviewFixture() }
  }
}

function mockRequest<TResponse>(endpoint: EndpointPath, id?: string): Promise<TResponse> {
  return Promise.resolve(resolveMockRequest(endpoint, id).response as TResponse)
}

export const facadeClient = {
  getLaunchpadApps(): Promise<LaunchpadAppsResponse> {
    return mockRequest('/api/v2/launchpad/apps')
  },
  getCommandCenterOverview(): Promise<CommandCenterOverviewResponse> {
    return mockRequest('/api/v2/command-center/overview')
  },
  getDigitalTwinOverview(): Promise<DigitalTwinOverviewResponse> {
    return mockRequest('/api/v2/digital-twin/overview')
  },
  getDigitalTwinObjectContext(objectId: string): Promise<DigitalTwinObjectContextResponse> {
    return mockRequest('/api/v2/digital-twin/objects/{object_id}/context', objectId)
  },
  getChangeSafetyDashboard(): Promise<ChangeSafetyDashboardResponse> {
    return mockRequest('/api/v2/change-safety/dashboard')
  },
  getChangeSafetyCase(changeId: string): Promise<ChangeSafetyCaseResponse> {
    return mockRequest('/api/v2/change-safety/{change_id}/safety-case', changeId)
  },
  getServiceAssuranceOverview(): Promise<ServiceAssuranceOverviewResponse> {
    return mockRequest('/api/v2/service-assurance/overview')
  },
  getTransportEngineeringOverview(): Promise<TransportEngineeringOverviewResponse> {
    return mockRequest('/api/v2/transport-engineering/overview')
  },
  getIntentComplianceOverview(): Promise<IntentComplianceOverviewResponse> {
    return mockRequest('/api/v2/intent-compliance/overview')
  },
  getAutomationStudioOverview(): Promise<AutomationStudioOverviewResponse> {
    return mockRequest('/api/v2/automation-studio/overview')
  },
  getAdminPlatformOpsOverview(): Promise<AdminPlatformOpsOverviewResponse> {
    return mockRequest('/api/v2/admin-platform-ops/overview')
  },
}
