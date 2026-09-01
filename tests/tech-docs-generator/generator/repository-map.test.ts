// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { defaultRepoRoot } from '../helpers/shared-repo-model.mjs'
import { renderRepositoryMap } from '../../../tech-docs-generator/scripts/render-repository-map.mjs'

function renderHtml(input = {}) {
  const { pages } = renderRepositoryMap(input)
  expect(pages.map((page) => page.href)).toEqual(['index.html'])
  return pages[0].html
}

describe('render-repository-map', () => {
  it('renders the generated map page with navigation, search, and live graph facts', () => {
    const html = renderHtml({ repoRoot: defaultRepoRoot })
    expect(html).toContain('<a href="#graph">Graph evidence</a>')
    expect(html).toContain('id="report-search"')
    expect(html).toContain('render-repository-map.mjs')
    expect(html).toContain('tech-docs-generator/scripts/graph-impact.mjs')
    expect(html).not.toContain('not yet generated')
    expect(html).toMatch(/<strong>Graph<\/strong> [\d,]+ files · [\d,]+ edges/)
  })

  it('is deterministic across renders', () => {
    expect(renderHtml({ repoRoot: defaultRepoRoot })).toBe(renderHtml({ repoRoot: defaultRepoRoot }))
  })

  it('emits no wall-clock timestamps', () => {
    expect(renderHtml({ repoRoot: defaultRepoRoot })).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)
  })

  it('renders not-yet-generated placeholders when graph artifacts are absent', () => {
    const emptyRepoRoot = mkdtempSync(path.join(tmpdir(), 'repository-map-test-'))
    try {
      const html = renderHtml({ repoRoot: emptyRepoRoot })
      expect(html).toContain('not yet generated')
      expect(html).not.toMatch(/<strong>Graph<\/strong> [\d,]+ files/)
    } finally {
      rmSync(emptyRepoRoot, { recursive: true, force: true })
    }
  })
})
