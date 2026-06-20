import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../src/App'

describe('component accessibility', () => {
  afterEach(() => {
    cleanup()
  })

  it('exposes shell landmarks and accessible drawers', () => {
    window.history.replaceState({}, '', '/app/command-center')
    render(<App />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'App sidebar' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'App tabs' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Section menu' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Selected incident context' })).toBeInTheDocument()
  })

  it('keeps digital twin interactive regions accessible', () => {
    window.history.replaceState({}, '', '/app/digital-twin')
    render(<App />)

    expect(screen.getByRole('img', { name: 'Network topology canvas' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Selected object context' })).toBeInTheDocument()
    expect(screen.getByLabelText('Search topology')).toBeInTheDocument()
  })
})
