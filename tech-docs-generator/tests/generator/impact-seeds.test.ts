// @vitest-environment node
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { readImpactSeeds } from '../../scripts/generate-all.mjs'

function writeStats(dir, highestFanIn) {
  const statsPath = path.join(dir, 'latest.json')
  writeFileSync(statsPath, JSON.stringify({ highestFanIn }), 'utf8')
  return statsPath
}

describe('readImpactSeeds', () => {
  it('returns the top five fan-in files in stats order', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'impact-seeds-'))
    try {
      const statsPath = writeStats(dir, [
        { file: 'site/components/Planner/Planner.tsx', count: 40, domain: 'planner' },
        { file: 'site/components/Studio/Studio.tsx', count: 30, domain: 'studio' },
        { file: 'a.ts', count: 3, domain: 'tests' },
        { file: 'b.ts', count: 2, domain: 'tests' },
        { file: 'c.ts', count: 1, domain: 'tests' },
        { file: 'd.ts', count: 0, domain: 'tests' },
      ])
      expect(readImpactSeeds(statsPath)).toEqual([
        'site/components/Planner/Planner.tsx',
        'site/components/Studio/Studio.tsx',
        'a.ts',
        'b.ts',
        'c.ts',
      ])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('returns an empty list when the stats report is missing or malformed', () => {
    expect(readImpactSeeds(path.join(tmpdir(), 'impact-seeds-missing-latest.json'))).toEqual([])
    const dir = mkdtempSync(path.join(tmpdir(), 'impact-seeds-'))
    try {
      const statsPath = writeStats(dir, undefined)
      expect(readImpactSeeds(statsPath)).toEqual([])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
