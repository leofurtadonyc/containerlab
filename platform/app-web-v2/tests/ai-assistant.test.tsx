import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../src/App'

describe('ai assistant placeholder app', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders ai-assistant route target', () => {
    window.history.replaceState({}, '', '/app/ai-assistant')
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'AI Assistant' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Assistant panel' })).toBeInTheDocument()
  })

  it('shows exact ai limitation copy', () => {
    window.history.replaceState({}, '', '/app/ai-assistant')
    render(<App />)

    expect(
      screen.getAllByText(
        'Future capability: AI Assistant backend support is not implemented. AI recommendations must not be shown or acted on.',
      ).length,
    ).toBeGreaterThan(0)
  })

  it('keeps ai placeholder controls disabled', () => {
    window.history.replaceState({}, '', '/app/ai-assistant')
    render(<App />)

    expect(screen.getByRole('textbox', { name: 'Ask assistant' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Apply recommendation' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Create change' })).toBeDisabled()
  })

  it('renders ai context drawers', () => {
    window.history.replaceState({}, '', '/app/ai-assistant')
    render(<App />)

    const complementaryRegions = screen.getAllByRole('complementary')
    const labels = complementaryRegions.map((region) => region.getAttribute('aria-label'))
    expect(labels).toContain('AI context unavailable')
    expect(labels).toContain('Evidence sections')
  })

  it('does not show recommendations or tool-call claims', () => {
    window.history.replaceState({}, '', '/app/ai-assistant')
    render(<App />)

    expect(screen.queryByText(/recommended action/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/tool call executed/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/assistant response:/i)).not.toBeInTheDocument()
  })
})
