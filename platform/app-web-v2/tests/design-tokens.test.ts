import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const TOKENS_FILE = join(process.cwd(), 'src/styles/tokens.css')
const INDEX_FILE = join(process.cwd(), 'src/index.css')

describe('design token foundation', () => {
  it('exports required token categories', () => {
    const tokens = readFileSync(TOKENS_FILE, 'utf8')

    expect(tokens).toContain('--surface-base')
    expect(tokens).toContain('--text-primary')
    expect(tokens).toContain('--space-4')
    expect(tokens).toContain('--font-size-md')
    expect(tokens).toContain('--radius-md')
    expect(tokens).toContain('--shadow-card')
    expect(tokens).toContain('--focus-ring')
    expect(tokens).toContain('--z-sticky')
    expect(tokens).toContain('--layout-top-bar-height')
    expect(tokens).toContain('--status-healthy')
    expect(tokens).toContain('--graph-link-normal')
    expect(tokens).toContain('--chart-series-1')
  })

  it('uses token references in scaffold shell styles', () => {
    const styles = readFileSync(INDEX_FILE, 'utf8')

    expect(styles).toContain('var(--surface-overlay)')
    expect(styles).toContain('var(--border-subtle)')
    expect(styles).toContain('var(--layout-top-bar-height)')
    expect(styles).not.toMatch(/#[0-9a-fA-F]{3,8}/)
  })
})
