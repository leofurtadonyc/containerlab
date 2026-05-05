import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../src/App'

describe('degraded/empty/error query states', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders launchpad query states', () => {
    window.history.replaceState({}, '', '/app/launchpad?launchpadState=error')
    render(<App />)
    expect(screen.getByText('Launchpad data error')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/launchpad?launchpadState=empty')
    render(<App />)
    expect(screen.getByText('No app posture is available yet.')).toBeInTheDocument()
  })

  it('renders command-center query states', () => {
    window.history.replaceState({}, '', '/app/command-center?commandCenterState=degraded')
    render(<App />)
    expect(
      screen.getByText('Partial evidence only. Some sources are missing, stale, or unavailable.'),
    ).toBeInTheDocument()
  })

  it('renders digital-twin query states', () => {
    window.history.replaceState({}, '', '/app/digital-twin?digitalTwinState=loading')
    render(<App />)
    expect(screen.getByText('Loading state example')).toBeInTheDocument()
  })

  it('renders change-safety query states', () => {
    window.history.replaceState({}, '', '/app/change-safety?changeSafetyState=error')
    render(<App />)
    expect(screen.getByText('Change Safety data error')).toBeInTheDocument()
  })

  it('renders batch-3 query states', () => {
    window.history.replaceState({}, '', '/app/intent-compliance?intentComplianceState=loading')
    render(<App />)
    expect(screen.getByText('Loading state example')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/automation-studio?automationStudioState=error')
    render(<App />)
    expect(screen.getByText('Automation Studio data error')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/admin-platform-ops?adminPlatformOpsState=empty')
    render(<App />)
    expect(screen.getByText('No admin/runtime evidence available.')).toBeInTheDocument()
  })
})
