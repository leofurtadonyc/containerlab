import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('cutover docs', () => {
  it('keeps runtime plan and parity review in non-cutover posture', () => {
    const runtimePlan = readFileSync(resolve(process.cwd(), 'docs/frontend-v2-runtime-and-cutover-plan.md'), 'utf-8')
    const parityReview = readFileSync(resolve(process.cwd(), 'docs/frontend-v2-v1-v2-parity-review.md'), 'utf-8')

    expect(runtimePlan).toContain('v1 remains the rollback target until v2 has runtime, parity, safety, and stakeholder acceptance gates.')
    expect(runtimePlan).toContain('v1 deprecation: only after explicit approval and parity signoff.')
    expect(runtimePlan).toContain('v1/v2 parity review is documented as cutover-ready;')

    expect(parityReview).toContain('parity posture: `bounded_parity_preview`')
    expect(parityReview).toContain('cutover decision: `not approved`')
    expect(parityReview).toContain('Do not deprecate or remove v1 at this stage.')
  })

  it('documents export/replay boundaries and legacy mapping expectations', () => {
    const replayBoundaries = readFileSync(
      resolve(process.cwd(), 'docs/frontend-v2-export-report-replay-boundaries.md'),
      'utf-8',
    )
    const parityReview = readFileSync(resolve(process.cwd(), 'docs/frontend-v2-v1-v2-parity-review.md'), 'utf-8')

    expect(replayBoundaries).toContain('Export/report/replay features must map to existing v1 contract behavior or render disabled/future.')
    expect(replayBoundaries).toContain('Replay is evidence replay only, not network replay or device-state restoration.')
    expect(replayBoundaries).toContain('Compliance reflects available platform evidence, not certification or multi-vendor parity.')

    expect(parityReview).toContain('Legacy `view=` compatibility is maintained through explicit alias mapping.')
    expect(parityReview).toContain('Unknown legacy views are intentionally mapped to Launchpad with `legacy_mapping_unknown`.')
  })

  it('documents the legacy redirect decision contract and rollback safety', () => {
    const redirectPlan = readFileSync(resolve(process.cwd(), 'docs/frontend-v2-legacy-redirect-plan.md'), 'utf-8')

    expect(redirectPlan).toContain('mark decision `legacy_mapping_unknown`;')
    expect(redirectPlan).toContain('preserve non-`view` query parameters for operator context.')
    expect(redirectPlan).toContain('Keep v1 URL reachable as rollback path until explicit deprecation approval.')
    expect(redirectPlan).toContain('v1 remains the rollback target; cutover is not approved.')
  })

  it('documents old UI deprecation as approval-gated with rollback safeguards', () => {
    const deprecationPlan = readFileSync(resolve(process.cwd(), 'docs/frontend-v2-old-ui-deprecation-plan.md'), 'utf-8')

    expect(deprecationPlan).toContain('If any prerequisite fails, deprecation is blocked.')
    expect(deprecationPlan).toContain('User explicitly approves deprecation.')
    expect(deprecationPlan).toContain('Abort deprecation and return to v1 default when:')
    expect(deprecationPlan).toContain('No removal of `platform/app-web` is authorized at this stage.')
  })
})
