// @vitest-environment node
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { defaultRepoRoot } from '../helpers/shared-repo-model.mjs'
import { renderRepositoryMap } from '../../scripts/render-repository-map.mjs'

function renderHtml(input = {}) {
  const { pages } = renderRepositoryMap(input)
  expect(pages.map((page) => page.href)).toEqual(['index.html'])
  return pages[0].html
}

function readStats() {
  return JSON.parse(
    readFileSync(
      path.join(defaultRepoRoot, 'generated-documents', 'repository-graph', 'stats', 'latest.json'),
      'utf8',
    ),
  )
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

  it('matches the live graph stats counts and fan-in callout', () => {
    const stats = readStats()
    const html = renderHtml({ repoRoot: defaultRepoRoot })
    const formatted = (value) => Number(value).toLocaleString('en-US')
    expect(html).toContain(`<strong>Graph</strong> ${formatted(stats.files)} files`)
    expect(html).toContain(`Graph files</div><div class="value">${formatted(stats.files)}`)
    expect(html).toContain(`Local edges</div><div class="value">${formatted(stats.edges)}`)
    const topFanIn = stats.highestFanIn.slice(0, 3).map((entry) => entry.file)
    for (const file of topFanIn) {
      expect(html).toContain(`<code>${file}</code>`)
    }
  })

  it('only claims root-level paths that exist on disk in the compact tree', () => {
    const html = renderHtml({ repoRoot: defaultRepoRoot })
    const tree = html.match(/Compact repository tree<\/h2>\s*<pre>([\s\S]*?)<\/pre>/)?.[1] ?? ''
    expect(tree).not.toBe('')
    const claimed = [...tree.matchAll(/^[├└]─ (\S+)/gm)].map((match) => match[1]).filter((token) => !token.includes('·'))
    expect(claimed.length).toBeGreaterThanOrEqual(10)
    for (const token of claimed) {
      expect(existsSync(path.join(defaultRepoRoot, token)), `tree claims missing path: ${token}`).toBe(true)
    }
  })

  it('makes no claims about tooling that does not exist in the repository', () => {
    const html = renderHtml({ repoRoot: defaultRepoRoot })
    for (const phantom of ['ltm/']) {
      expect(html).not.toContain(phantom)
    }
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
