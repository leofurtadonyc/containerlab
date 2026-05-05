import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../src/App'

describe('intent compliance app', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders intent-compliance route target', () => {
    window.history.replaceState({}, '', '/app/intent-compliance')
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Intent & Compliance' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Top drifted intents' })).toBeInTheDocument()
  })

  it('shows exact intent compliance non-claim copy', () => {
    window.history.replaceState({}, '', '/app/intent-compliance')
    render(<App />)

    expect(
      screen.getAllByText('Compliance reflects available platform evidence, not certification or multi-vendor parity.').length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText('Remediation is disabled unless a bounded backend workflow explicitly supports it.').length,
    ).toBeGreaterThan(0)
  })

  it('keeps remediation controls disabled', () => {
    window.history.replaceState({}, '', '/app/intent-compliance')
    render(<App />)

    expect(screen.getByRole('button', { name: 'Auto-remediate' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Enforce intent' })).toBeDisabled()
  })

  it('renders intent context drawer', () => {
    window.history.replaceState({}, '', '/app/intent-compliance')
    render(<App />)

    const complementaryRegions = screen.getAllByRole('complementary')
    const labels = complementaryRegions.map((region) => region.getAttribute('aria-label'))
    expect(labels).toContain('Selected intent context')
    expect(labels).toContain('Evidence sections')
  })

  it('supports loading, empty, error, and degraded states via route query', () => {
    window.history.replaceState({}, '', '/app/intent-compliance?intentComplianceState=loading')
    render(<App />)
    expect(screen.getByText('Loading state example')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/intent-compliance?intentComplianceState=empty')
    render(<App />)
    expect(screen.getByText('No policy/intent evidence.')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/intent-compliance?intentComplianceState=error')
    render(<App />)
    expect(screen.getByText('Intent & Compliance data error')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/intent-compliance?intentComplianceState=degraded')
    render(<App />)
    expect(
      screen.getByText('Partial evidence only. Some sources are missing, stale, or unavailable.'),
    ).toBeInTheDocument()
  })

  it('does not show forbidden compliance claims', () => {
    window.history.replaceState({}, '', '/app/intent-compliance')
    render(<App />)

    expect(screen.queryByText(/certified compliant/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/auto-remediate now/i)).not.toBeInTheDocument()
  })
})
