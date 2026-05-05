import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../src/App'

describe('service assurance app', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders service-assurance route target', () => {
    window.history.replaceState({}, '', '/app/service-assurance')
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Service Assurance' })).toBeInTheDocument()
    expect(screen.getByText('Service health map')).toBeInTheDocument()
  })

  it('shows exact service assurance non-claim copy', () => {
    window.history.replaceState({}, '', '/app/service-assurance')
    render(<App />)

    expect(
      screen.getAllByText('Service assurance reflects available platform evidence, not full SLA certification.').length,
    ).toBeGreaterThan(0)
    expect(
      screen.getByText('Impact is inferred from current platform models and may be partial.'),
    ).toBeInTheDocument()
  })

  it('keeps service actions disabled', () => {
    window.history.replaceState({}, '', '/app/service-assurance')
    render(<App />)

    expect(screen.getByRole('button', { name: 'Add service' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Run root-cause analysis' })).toBeDisabled()
  })

  it('renders service context drawer', () => {
    window.history.replaceState({}, '', '/app/service-assurance')
    render(<App />)

    const complementaryRegions = screen.getAllByRole('complementary')
    const labels = complementaryRegions.map((region) => region.getAttribute('aria-label'))
    expect(labels).toContain('Selected service context')
    expect(labels).toContain('Evidence sections')
  })

  it('supports loading, empty, error, and degraded states via route query', () => {
    window.history.replaceState({}, '', '/app/service-assurance?serviceAssuranceState=loading')
    render(<App />)
    expect(screen.getByText('Loading state example')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/service-assurance?serviceAssuranceState=empty')
    render(<App />)
    expect(screen.getByText('No services observed.')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/service-assurance?serviceAssuranceState=error')
    render(<App />)
    expect(screen.getByText('Service Assurance data error')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/service-assurance?serviceAssuranceState=degraded')
    render(<App />)
    expect(
      screen.getByText('Partial evidence only. Some sources are missing, stale, or unavailable.'),
    ).toBeInTheDocument()
  })

  it('does not show forbidden sla-guarantee wording', () => {
    window.history.replaceState({}, '', '/app/service-assurance')
    render(<App />)

    expect(screen.queryByText('SLA guaranteed')).not.toBeInTheDocument()
  })
})
