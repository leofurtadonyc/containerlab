import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../src/App'

describe('change safety app', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders change-safety route targets', () => {
    window.history.replaceState({}, '', '/app/change-safety')
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Change Safety' })).toBeInTheDocument()
    expect(screen.getByText('Change Safety workspace: Plans')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/change-safety/approval-queue')
    render(<App />)
    expect(screen.getByText('Change Safety workspace: Approval Queue')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/change-safety/safety-cases')
    render(<App />)
    expect(screen.getByText('Change Safety workspace: Safety Cases')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/change-safety/rollback')
    render(<App />)
    expect(screen.getByText('Change Safety workspace: Rollback')).toBeInTheDocument()
  })

  it('shows exact safety-copy matrix phrases', () => {
    window.history.replaceState({}, '', '/app/change-safety')
    render(<App />)

    expect(screen.getAllByText('Validation is gate input, not network proof.').length).toBeGreaterThan(0)
    expect(screen.getByText('Preview is pre-change reasoning only; it is not execution.')).toBeInTheDocument()
    expect(screen.getAllByText('Approval state reflects platform workflow records only.').length).toBeGreaterThan(0)
    expect(
      screen.getByText('Rollback readiness is compensation-only and is not guaranteed device restoration.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Safe action is platform-only and does not push device or controller configuration.'),
    ).toBeInTheDocument()
  })

  it('keeps execute and rollback actions disabled', () => {
    window.history.replaceState({}, '', '/app/change-safety')
    render(<App />)

    expect(screen.getByRole('button', { name: 'Execute change' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Rollback change' })).toBeDisabled()
  })

  it('renders read-only report/export actions', () => {
    window.history.replaceState({}, '', '/app/change-safety/safety-cases')
    render(<App />)

    expect(screen.getByRole('button', { name: 'Download safety case report' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download preview diff report' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download rollback report' })).toBeInTheDocument()
  })

  it('renders change context drawer and evidence sections', () => {
    window.history.replaceState({}, '', '/app/change-safety')
    render(<App />)

    const complementaryRegions = screen.getAllByRole('complementary')
    const labels = complementaryRegions.map((region) => region.getAttribute('aria-label'))
    expect(labels).toContain('Selected change context')
    expect(labels).toContain('Evidence sections')
  })

  it('supports loading, empty, error, and degraded states via route query', () => {
    window.history.replaceState({}, '', '/app/change-safety?changeSafetyState=loading')
    render(<App />)
    expect(screen.getByText('Loading state example')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/change-safety?changeSafetyState=empty')
    render(<App />)
    expect(screen.getByText('No change plans.')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/change-safety?changeSafetyState=error')
    render(<App />)
    expect(screen.getByText('Change Safety data error')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/change-safety?changeSafetyState=degraded')
    render(<App />)
    expect(
      screen.getByText('Partial evidence only. Some sources are missing, stale, or unavailable.'),
    ).toBeInTheDocument()
  })

  it('does not show forbidden guaranteed-safe wording', () => {
    window.history.replaceState({}, '', '/app/change-safety')
    render(<App />)

    expect(screen.queryByText('Validated safe')).not.toBeInTheDocument()
  })
})
