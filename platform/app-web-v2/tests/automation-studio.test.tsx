import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../src/App'

describe('automation studio app', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders automation-studio route target', () => {
    window.history.replaceState({}, '', '/app/automation-studio')
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Automation Studio' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Workflow canvas' })).toBeInTheDocument()
  })

  it('shows exact automation non-claim copy', () => {
    window.history.replaceState({}, '', '/app/automation-studio')
    render(<App />)

    expect(
      screen.getAllByText(
        'Automation is bounded to backend-supported workflow records. It is not autonomous remediation or general device actuation.',
      ).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText(
        'Execution controls are disabled until prerequisite workflow, preview, validation, and approval gates are satisfied by backend records.',
      ).length,
    ).toBeGreaterThan(0)
  })

  it('keeps execution controls disabled', () => {
    window.history.replaceState({}, '', '/app/automation-studio')
    render(<App />)

    expect(screen.getByRole('button', { name: 'Create workflow' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Run dry run' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Execute workflow' })).toBeDisabled()
  })

  it('renders workflow context drawer', () => {
    window.history.replaceState({}, '', '/app/automation-studio')
    render(<App />)

    const complementaryRegions = screen.getAllByRole('complementary')
    const labels = complementaryRegions.map((region) => region.getAttribute('aria-label'))
    expect(labels).toContain('Selected workflow context')
    expect(labels).toContain('Evidence sections')
  })

  it('supports loading, empty, error, and degraded states via route query', () => {
    window.history.replaceState({}, '', '/app/automation-studio?automationStudioState=loading')
    render(<App />)
    expect(screen.getByText('Loading state example')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/automation-studio?automationStudioState=empty')
    render(<App />)
    expect(screen.getByText('No workflow records available.')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/automation-studio?automationStudioState=error')
    render(<App />)
    expect(screen.getByText('Automation Studio data error')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/automation-studio?automationStudioState=degraded')
    render(<App />)
    expect(
      screen.getByText('Partial evidence only. Some sources are missing, stale, or unavailable.'),
    ).toBeInTheDocument()
  })

  it('does not show forbidden automation claims', () => {
    window.history.replaceState({}, '', '/app/automation-studio')
    render(<App />)

    expect(screen.queryByText(/execute anything/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/push device configuration/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/autonomous remediation enabled/i)).not.toBeInTheDocument()
  })
})
