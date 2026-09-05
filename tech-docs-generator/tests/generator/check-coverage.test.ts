// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { evaluateCoverage } from '../../scripts/check-coverage.mjs'

describe('coverage gate', () => {
  it('fails when lines or page lines are below 90 percent', () => {
    const result = evaluateCoverage(
      { lines: { pct: 89 }, branches: { pct: 95 }, statements: { pct: 96 }, functions: { pct: 96 } },
      [{ file: 'src/pages/Deployment.tsx', lines: { pct: 89 } }],
    )

    expect(result.failures).toEqual([
      'lines 89% < 90%',
      'src/pages/Deployment.tsx lines 89% < 90%',
    ])
    expect(result.warnings).toEqual([])
  })

  it('fails when branches are below 85 percent', () => {
    const result = evaluateCoverage(
      { lines: { pct: 96 }, branches: { pct: 84 }, statements: { pct: 96 }, functions: { pct: 96 } },
      [],
    )

    expect(result.failures).toEqual(['branches 84% < 85%'])
  })

  it('fails when statements or functions are below 90 percent', () => {
    const result = evaluateCoverage(
      { lines: { pct: 96 }, branches: { pct: 96 }, statements: { pct: 88 }, functions: { pct: 89 } },
      [],
    )

    expect(result.failures).toEqual(['statements 88% < 90%', 'functions 89% < 90%'])
  })

  it('passes at the lines/statements/functions 90 and branches 85 floors', () => {
    const result = evaluateCoverage(
      { lines: { pct: 90 }, branches: { pct: 85 }, statements: { pct: 90 }, functions: { pct: 90 } },
      [{ file: 'src/pages/Deployment.tsx', lines: { pct: 90 } }],
    )

    expect(result.failures).toEqual([])
    expect(result.warnings).toEqual([])
  })
})
