import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../src/App'

const forbiddenClaims = [
  /production ready/i,
  /autonomous remediation enabled/i,
  /guaranteed safe/i,
  /guaranteed rollback/i,
  /root cause confirmed/i,
  /push device configuration/i,
  /universal topology truth/i,
  /universal path truth/i,
]

describe('safety copy matrix guardrails', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders required safety copy phrases for implemented app batches', () => {
    const routesWithRequiredCopy: Array<{ path: string; copy: string }> = [
      {
        path: '/app/launchpad',
        copy: 'Platform posture is bounded by available backend evidence and does not indicate production readiness.',
      },
      {
        path: '/app/command-center',
        copy: 'Triage view only. This screen does not determine root cause or authorize remediation.',
      },
      {
        path: '/app/digital-twin',
        copy: 'Evidence-backed topology view, not a forwarding guarantee.',
      },
      {
        path: '/app/change-safety',
        copy: 'Validation is gate input, not network proof.',
      },
      {
        path: '/app/service-assurance',
        copy: 'Service assurance reflects available platform evidence, not full SLA certification.',
      },
      {
        path: '/app/transport-engineering',
        copy: 'Transport engineering views are evidence-backed planning aids, not controller programming.',
      },
      {
        path: '/app/traffic-intelligence',
        copy: 'Future capability: traffic intelligence backend support is not implemented. No flow telemetry or anomaly detection is available in this product yet.',
      },
      {
        path: '/app/intent-compliance',
        copy: 'Compliance reflects available platform evidence, not certification or multi-vendor parity.',
      },
      {
        path: '/app/automation-studio',
        copy: 'Automation is bounded to backend-supported workflow records. It is not autonomous remediation or general device actuation.',
      },
      {
        path: '/app/ai-assistant',
        copy: 'Future capability: AI Assistant backend support is not implemented. AI recommendations must not be shown or acted on.',
      },
      {
        path: '/app/admin-platform-ops',
        copy: 'Admin controls are read-only placeholders unless backend auth/RBAC and configuration APIs exist.',
      },
    ]

    routesWithRequiredCopy.forEach(({ path, copy }) => {
      cleanup()
      window.history.replaceState({}, '', path)
      render(<App />)
      expect(screen.getAllByText(copy).length).toBeGreaterThan(0)
    })
  })

  it('does not render forbidden claim phrases', () => {
    const routes = [
      '/app/launchpad',
      '/app/command-center',
      '/app/digital-twin',
      '/app/change-safety',
      '/app/service-assurance',
      '/app/transport-engineering',
      '/app/traffic-intelligence',
      '/app/intent-compliance',
      '/app/automation-studio',
      '/app/ai-assistant',
      '/app/admin-platform-ops',
    ]

    routes.forEach((path) => {
      cleanup()
      window.history.replaceState({}, '', path)
      render(<App />)
      forbiddenClaims.forEach((claimPattern) => {
        expect(screen.queryByText(claimPattern)).not.toBeInTheDocument()
      })
    })
  })
})
