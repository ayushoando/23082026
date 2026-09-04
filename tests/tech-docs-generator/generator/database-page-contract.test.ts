// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

const readRepoFile = (relativePath: string) =>
  readFileSync(path.join(repoRoot, relativePath), 'utf8')

describe('tech docs database page contract', () => {
  it('documents the live Admin and Products database tables instead of retired examples', () => {
    const databasePage = readRepoFile('tech-docs-generator/src/pages/Database.tsx')
    const databaseBoundaries = readRepoFile('tech-docs-generator/src/data/databaseBoundaries.ts')

    for (const liveTable of [
      'oando_plans',
      'planner_operation_idempotency',
      'furniture_catalog',
      'block_descriptors',
      'catalog_products',
      'configurator_products',
      'planner_managed_products',
      'svg_revisions',
      'svg_revision_artifacts',
    ]) {
      expect(databasePage).toContain(liveTable)
    }

    expect(databaseBoundaries).toContain('block_descriptors')
    expect(databaseBoundaries).toContain('Products — catalog, configurator, flags')

    for (const retiredPattern of [
      /public\.plans/,
      /pgTable\('plans'/,
      /users\s+\|\|--o\{\s+plans/,
      /\bleads\b/,
      /\bplan_items\b/,
      /\bproduct_variants\b/,
      /\bactivity\b/,
      /\bJsonB\b/,
      /config\/database\/types\/database\.types\.ts/,
    ]) {
      expect(databasePage).not.toMatch(retiredPattern)
    }
  })
})
