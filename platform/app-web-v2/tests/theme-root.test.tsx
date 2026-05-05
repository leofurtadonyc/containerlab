import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from '../src/App'

describe('theme root', () => {
  it('renders the v2 dark theme root class', () => {
    const { container } = render(<App />)
    const shell = container.querySelector('.ds-app-shell')

    expect(shell).toHaveClass('theme-v2-dark')
  })
})
